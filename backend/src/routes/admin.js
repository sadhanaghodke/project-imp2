const express = require('express');
const { body, param } = require('express-validator');
const {
  getDashboardAnalytics,
  assignWorker,
  approveResolution,
  getWorkers,
  manageUserPoints,
  getComplaintHistory
} = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Validation rules
const assignWorkerValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid complaint ID'),
  body('workerId')
    .isUUID()
    .withMessage('Invalid worker ID'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];

const approveResolutionValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid complaint ID'),
  body('approved')
    .isBoolean()
    .withMessage('Approved must be true or false'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];

const managePointsValidation = [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID'),
  body('points')
    .isInt({ min: -1000, max: 1000 })
    .withMessage('Points must be between -1000 and 1000'),
  body('reason')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Reason must be between 3 and 100 characters')
];

const complaintIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid complaint ID')
];

// Routes
router.get('/analytics', getDashboardAnalytics);

router.get('/workers', getWorkers);

router.put('/complaints/:id/assign', 
  assignWorkerValidation,
  assignWorker
);

router.put('/complaints/:id/approve', 
  approveResolutionValidation,
  approveResolution
);

router.get('/complaints/:id/history',
  complaintIdValidation,
  getComplaintHistory
);

router.put('/users/:userId/points',
  managePointsValidation,
  manageUserPoints
);

module.exports = router;