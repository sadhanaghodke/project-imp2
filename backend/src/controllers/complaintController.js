const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { checkDuplicateImage } = require('../middleware/upload');
const { detectGarbage } = require('../utils/aiDetection');

const prisma = new PrismaClient();

const createComplaint = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { title, description, latitude, longitude, address } = req.body;
    const citizenId = req.user.id;

    if (!req.processedImage) {
      return res.status(400).json({
        error: 'Image required',
        message: 'Please upload an image of the garbage'
      });
    }

    // Check for duplicate image
    const duplicateComplaint = await checkDuplicateImage(req.processedImage.hash);
    if (duplicateComplaint) {
      return res.status(409).json({
        error: 'Duplicate image',
        message: 'This image has already been submitted',
        existingComplaint: {
          id: duplicateComplaint.id,
          title: duplicateComplaint.title,
          submittedAt: duplicateComplaint.createdAt
        }
      });
    }

    // AI garbage detection (simplified mock)
    const garbageDetected = await detectGarbage(req.processedImage.filepath);
    if (!garbageDetected.isGarbage) {
      return res.status(400).json({
        error: 'No garbage detected',
        message: 'Please upload an image that clearly shows garbage or cleanliness issues',
        confidence: garbageDetected.confidence
      });
    }

    // Create complaint
    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        imageUrl: req.processedImage.url,
        imageHash: req.processedImage.hash,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        citizenId,
        priority: garbageDetected.severity || 1
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Award points to citizen for valid complaint
    await prisma.user.update({
      where: { id: citizenId },
      data: {
        points: {
          increment: 10
        }
      }
    });

    // Record reward history
    await prisma.rewardHistory.create({
      data: {
        userId: citizenId,
        complaintId: complaint.id,
        points: 10,
        reason: 'Complaint submission'
      }
    });

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint,
      pointsEarned: 10
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      error: 'Failed to create complaint',
      message: error.message
    });
  }
};

const getComplaints = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let whereClause = {};

    // Role-based filtering
    if (userRole === 'CITIZEN') {
      whereClause.citizenId = userId;
    } else if (userRole === 'WORKER') {
      whereClause.workerAssignment = {
        workerId: userId
      };
    }
    // ADMIN can see all complaints

    // Status filtering
    if (status) {
      whereClause.status = status.toUpperCase();
    }

    const [complaints, totalCount] = await Promise.all([
      prisma.complaint.findMany({
        where: whereClause,
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          workerAssignment: {
            include: {
              worker: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          beforeAfterImages: true,
          feedbacks: {
            select: {
              rating: true,
              comment: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take
      }),
      prisma.complaint.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / take);

    res.json({
      complaints,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      error: 'Failed to fetch complaints'
    });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        workerAssignment: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        beforeAfterImages: true,
        feedbacks: {
          include: {
            citizen: {
              select: {
                name: true
              }
            }
          }
        },
        adminActions: {
          include: {
            admin: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    // Check access permissions
    const hasAccess = 
      userRole === 'ADMIN' ||
      (userRole === 'CITIZEN' && complaint.citizenId === userId) ||
      (userRole === 'WORKER' && complaint.workerAssignment?.workerId === userId);

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this complaint'
      });
    }

    res.json({ complaint });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({
      error: 'Failed to fetch complaint'
    });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        workerAssignment: true
      }
    });

    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    // Check permissions
    const canUpdate = 
      userRole === 'ADMIN' ||
      (userRole === 'WORKER' && complaint.workerAssignment?.workerId === userId);

    if (!canUpdate) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to update this complaint'
      });
    }

    // Validate status transition
    const validTransitions = {
      'PENDING': ['ASSIGNED', 'REJECTED'],
      'ASSIGNED': ['IN_PROGRESS', 'REJECTED'],
      'IN_PROGRESS': ['RESOLVED'],
      'RESOLVED': [],
      'REJECTED': []
    };

    if (!validTransitions[complaint.status].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        message: `Cannot change status from ${complaint.status} to ${status}`
      });
    }

    // Update complaint
    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        workerAssignment: {
          include: {
            worker: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Update worker assignment timestamps
    if (status === 'IN_PROGRESS' && complaint.workerAssignment) {
      await prisma.workerAssignment.update({
        where: { id: complaint.workerAssignment.id },
        data: {
          startedAt: new Date(),
          notes
        }
      });
    } else if (status === 'RESOLVED' && complaint.workerAssignment) {
      await prisma.workerAssignment.update({
        where: { id: complaint.workerAssignment.id },
        data: {
          completedAt: new Date(),
          notes
        }
      });

      // Award bonus points to citizen for resolved complaint
      await prisma.user.update({
        where: { id: complaint.citizenId },
        data: {
          points: {
            increment: 20
          }
        }
      });

      await prisma.rewardHistory.create({
        data: {
          userId: complaint.citizenId,
          complaintId: complaint.id,
          points: 20,
          reason: 'Complaint resolved'
        }
      });
    }

    res.json({
      message: 'Complaint status updated successfully',
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({
      error: 'Failed to update complaint status'
    });
  }
};

const uploadBeforeImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!req.processedImage) {
      return res.status(400).json({
        error: 'Image required'
      });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        workerAssignment: true
      }
    });

    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    // Check if user is assigned worker
    if (!complaint.workerAssignment || complaint.workerAssignment.workerId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only assigned workers can upload before images'
      });
    }

    // Create before image record
    const beforeImage = await prisma.beforeAfterImage.create({
      data: {
        complaintId: id,
        imageUrl: req.processedImage.url,
        imageType: 'before',
        uploadedByUserId: userId
      }
    });

    res.json({
      message: 'Before image uploaded successfully',
      image: beforeImage
    });
  } catch (error) {
    console.error('Upload before image error:', error);
    res.status(500).json({
      error: 'Failed to upload before image'
    });
  }
};

const uploadAfterImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!req.processedImage) {
      return res.status(400).json({
        error: 'Image required'
      });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        workerAssignment: true
      }
    });

    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    // Check if user is assigned worker
    if (!complaint.workerAssignment || complaint.workerAssignment.workerId !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only assigned workers can upload after images'
      });
    }

    // Create after image record
    const afterImage = await prisma.beforeAfterImage.create({
      data: {
        complaintId: id,
        imageUrl: req.processedImage.url,
        imageType: 'after',
        uploadedByUserId: userId
      }
    });

    res.json({
      message: 'After image uploaded successfully',
      image: afterImage
    });
  } catch (error) {
    console.error('Upload after image error:', error);
    res.status(500).json({
      error: 'Failed to upload after image'
    });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const citizenId = req.user.id;

    const complaint = await prisma.complaint.findUnique({
      where: { id }
    });

    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    // Check if citizen owns this complaint
    if (complaint.citizenId !== citizenId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only provide feedback for your own complaints'
      });
    }

    // Check if complaint is resolved
    if (complaint.status !== 'RESOLVED') {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Feedback can only be provided for resolved complaints'
      });
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        complaintId: id,
        citizenId
      }
    });

    if (existingFeedback) {
      return res.status(409).json({
        error: 'Feedback already submitted',
        message: 'You have already provided feedback for this complaint'
      });
    }

    const feedback = await prisma.feedback.create({
      data: {
        complaintId: id,
        citizenId,
        rating: parseInt(rating),
        comment
      }
    });

    res.json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      error: 'Failed to submit feedback'
    });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  uploadBeforeImage,
  uploadAfterImage,
  submitFeedback
};