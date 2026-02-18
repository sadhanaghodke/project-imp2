const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getDashboardAnalytics = async (req, res) => {
  try {
    const [
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      rejectedComplaints,
      totalUsers,
      totalWorkers,
      recentComplaints,
      topCitizens,
      workerPerformance
    ] = await Promise.all([
      // Total complaints
      prisma.complaint.count(),
      
      // Complaints by status
      prisma.complaint.count({ where: { status: 'PENDING' } }),
      prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.complaint.count({ where: { status: 'RESOLVED' } }),
      prisma.complaint.count({ where: { status: 'REJECTED' } }),
      
      // User counts
      prisma.user.count({ where: { role: 'CITIZEN' } }),
      prisma.user.count({ where: { role: 'WORKER' } }),
      
      // Recent complaints (last 7 days)
      prisma.complaint.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          citizen: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Top citizens by points
      prisma.user.findMany({
        where: { role: 'CITIZEN' },
        orderBy: { points: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          points: true,
          _count: {
            select: {
              complaints: true
            }
          }
        }
      }),
      
      // Worker performance
      prisma.user.findMany({
        where: { role: 'WORKER' },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              assignedTasks: {
                where: {
                  completedAt: {
                    not: null
                  }
                }
              }
            }
          }
        }
      })
    ]);

    // Calculate resolution rate
    const resolutionRate = totalComplaints > 0 
      ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1)
      : 0;

    // Calculate average resolution time (last 30 days)
    const resolvedComplaintsWithTime = await prisma.complaint.findMany({
      where: {
        status: 'RESOLVED',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        workerAssignment: true
      }
    });

    const avgResolutionTime = resolvedComplaintsWithTime.length > 0
      ? resolvedComplaintsWithTime.reduce((acc, complaint) => {
          if (complaint.workerAssignment?.completedAt) {
            const timeDiff = new Date(complaint.workerAssignment.completedAt) - new Date(complaint.createdAt);
            return acc + (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
          }
          return acc;
        }, 0) / resolvedComplaintsWithTime.length
      : 0;

    res.json({
      overview: {
        totalComplaints,
        pendingComplaints,
        inProgressComplaints,
        resolvedComplaints,
        rejectedComplaints,
        totalUsers,
        totalWorkers,
        resolutionRate: parseFloat(resolutionRate),
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10
      },
      recentComplaints,
      topCitizens,
      workerPerformance: workerPerformance.map(worker => ({
        ...worker,
        completedTasks: worker._count.assignedTasks
      }))
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard analytics'
    });
  }
};

const assignWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { workerId, notes } = req.body;
    const adminId = req.user.id;

    // Validate complaint exists and is assignable
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

    if (complaint.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Only pending complaints can be assigned'
      });
    }

    if (complaint.workerAssignment) {
      return res.status(409).json({
        error: 'Already assigned',
        message: 'This complaint is already assigned to a worker'
      });
    }

    // Validate worker exists and is active
    const worker = await prisma.user.findUnique({
      where: { 
        id: workerId,
        role: 'WORKER',
        isActive: true
      }
    });

    if (!worker) {
      return res.status(404).json({
        error: 'Worker not found',
        message: 'Invalid or inactive worker selected'
      });
    }

    // Create assignment and update complaint status
    const [assignment, updatedComplaint] = await Promise.all([
      prisma.workerAssignment.create({
        data: {
          complaintId: id,
          workerId,
          notes
        },
        include: {
          worker: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.complaint.update({
        where: { id },
        data: { status: 'ASSIGNED' }
      })
    ]);

    // Record admin action
    await prisma.adminAction.create({
      data: {
        complaintId: id,
        adminId,
        action: 'assigned',
        notes: `Assigned to ${worker.name}`
      }
    });

    res.json({
      message: 'Worker assigned successfully',
      assignment,
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Assign worker error:', error);
    res.status(500).json({
      error: 'Failed to assign worker'
    });
  }
};

const approveResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, notes } = req.body;
    const adminId = req.user.id;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        workerAssignment: true,
        citizen: true
      }
    });

    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    if (complaint.status !== 'RESOLVED') {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Only resolved complaints can be approved or rejected'
      });
    }

    const newStatus = approved ? 'RESOLVED' : 'IN_PROGRESS';
    const action = approved ? 'approved' : 'rejected';

    // Update complaint if rejected
    if (!approved) {
      await prisma.complaint.update({
        where: { id },
        data: { status: newStatus }
      });

      // Reset worker assignment completion
      if (complaint.workerAssignment) {
        await prisma.workerAssignment.update({
          where: { id: complaint.workerAssignment.id },
          data: {
            completedAt: null,
            notes: notes || 'Resolution rejected by admin'
          }
        });
      }

      // Deduct points from citizen if resolution was rejected
      await prisma.user.update({
        where: { id: complaint.citizenId },
        data: {
          points: {
            decrement: 20
          }
        }
      });

      await prisma.rewardHistory.create({
        data: {
          userId: complaint.citizenId,
          complaintId: complaint.id,
          points: -20,
          reason: 'Resolution rejected'
        }
      });
    }

    // Record admin action
    await prisma.adminAction.create({
      data: {
        complaintId: id,
        adminId,
        action,
        notes
      }
    });

    res.json({
      message: `Resolution ${action} successfully`,
      status: newStatus
    });
  } catch (error) {
    console.error('Approve resolution error:', error);
    res.status(500).json({
      error: 'Failed to process resolution approval'
    });
  }
};

const getWorkers = async (req, res) => {
  try {
    const workers = await prisma.user.findMany({
      where: {
        role: 'WORKER',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            assignedTasks: {
              where: {
                completedAt: {
                  not: null
                }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const workersWithStats = workers.map(worker => ({
      ...worker,
      completedTasks: worker._count.assignedTasks
    }));

    res.json({ workers: workersWithStats });
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({
      error: 'Failed to fetch workers'
    });
  }
};

const manageUserPoints = async (req, res) => {
  try {
    const { userId } = req.params;
    const { points, reason } = req.body;
    const adminId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Update user points
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: parseInt(points)
        }
      }
    });

    // Record in reward history
    await prisma.rewardHistory.create({
      data: {
        userId,
        points: parseInt(points),
        reason: reason || 'Admin adjustment'
      }
    });

    res.json({
      message: 'User points updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        points: updatedUser.points
      }
    });
  } catch (error) {
    console.error('Manage user points error:', error);
    res.status(500).json({
      error: 'Failed to update user points'
    });
  }
};

const getComplaintHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        citizen: {
          select: {
            name: true,
            email: true
          }
        },
        workerAssignment: {
          include: {
            worker: {
              select: {
                name: true,
                email: true
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
            createdAt: 'asc'
          }
        },
        beforeImages: true,
        afterImages: true,
        feedbacks: {
          include: {
            citizen: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    // Build timeline
    const timeline = [
      {
        type: 'created',
        timestamp: complaint.createdAt,
        actor: complaint.citizen.name,
        description: 'Complaint submitted'
      }
    ];

    // Add admin actions to timeline
    complaint.adminActions.forEach(action => {
      timeline.push({
        type: 'admin_action',
        timestamp: action.createdAt,
        actor: action.admin.name,
        description: `Complaint ${action.action}`,
        notes: action.notes
      });
    });

    // Add worker actions
    if (complaint.workerAssignment) {
      if (complaint.workerAssignment.startedAt) {
        timeline.push({
          type: 'work_started',
          timestamp: complaint.workerAssignment.startedAt,
          actor: complaint.workerAssignment.worker.name,
          description: 'Work started'
        });
      }
      if (complaint.workerAssignment.completedAt) {
        timeline.push({
          type: 'work_completed',
          timestamp: complaint.workerAssignment.completedAt,
          actor: complaint.workerAssignment.worker.name,
          description: 'Work completed'
        });
      }
    }

    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      complaint,
      timeline
    });
  } catch (error) {
    console.error('Get complaint history error:', error);
    res.status(500).json({
      error: 'Failed to fetch complaint history'
    });
  }
};

module.exports = {
  getDashboardAnalytics,
  assignWorker,
  approveResolution,
  getWorkers,
  manageUserPoints,
  getComplaintHistory
};