const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get user's reward history
router.get('/rewards', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const rewards = await prisma.rewardHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const totalPoints = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true }
    });

    res.json({
      rewards,
      totalPoints: totalPoints?.points || 0
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({
      error: 'Failed to fetch reward history'
    });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'CITIZEN') {
      const [
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
        totalPoints,
        avgRating
      ] = await Promise.all([
        prisma.complaint.count({ where: { citizenId: userId } }),
        prisma.complaint.count({ 
          where: { citizenId: userId, status: 'PENDING' } 
        }),
        prisma.complaint.count({ 
          where: { citizenId: userId, status: 'RESOLVED' } 
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { points: true }
        }),
        prisma.feedback.aggregate({
          where: { citizenId: userId },
          _avg: { rating: true }
        })
      ]);

      stats = {
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
        totalPoints: totalPoints?.points || 0,
        avgRating: avgRating._avg.rating || 0,
        resolutionRate: totalComplaints > 0 
          ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1)
          : 0
      };

    } else if (userRole === 'WORKER') {
      const [
        assignedTasks,
        completedTasks,
        inProgressTasks,
        avgCompletionTime
      ] = await Promise.all([
        prisma.workerAssignment.count({ where: { workerId: userId } }),
        prisma.workerAssignment.count({ 
          where: { 
            workerId: userId,
            completedAt: { not: null }
          } 
        }),
        prisma.workerAssignment.count({ 
          where: { 
            workerId: userId,
            startedAt: { not: null },
            completedAt: null
          } 
        }),
        prisma.workerAssignment.findMany({
          where: {
            workerId: userId,
            completedAt: { not: null }
          },
          select: {
            assignedAt: true,
            completedAt: true
          }
        })
      ]);

      // Calculate average completion time
      const completionTimes = avgCompletionTime.map(task => {
        const timeDiff = new Date(task.completedAt) - new Date(task.assignedAt);
        return timeDiff / (1000 * 60 * 60 * 24); // Convert to days
      });

      const avgTime = completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

      stats = {
        assignedTasks,
        completedTasks,
        inProgressTasks,
        avgCompletionTime: Math.round(avgTime * 10) / 10,
        completionRate: assignedTasks > 0 
          ? ((completedTasks / assignedTasks) * 100).toFixed(1)
          : 0
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch user statistics'
    });
  }
});

module.exports = router;