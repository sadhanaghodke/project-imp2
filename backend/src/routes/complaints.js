const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  uploadBeforeImage,
  uploadAfterImage,
  submitFeedback
} = require('../controllers/complaintController');
const { authenticateToken, requireCitizen, requireWorker } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

const router = express.Router();

// Validation rules
const createComplaintValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters')
];

const updateStatusValidation = [
  body('status')
    .isIn(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];

const feedbackValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment must be less than 500 characters')
];

const complaintIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid complaint ID')
];

// Routes
router.post('/', 
  authenticateToken, 
  requireCitizen,
  uploadSingle('image', 'complaints'),
  createComplaintValidation,
  createComplaint
);

router.get('/', 
  authenticateToken,
  getComplaints
);

router.get('/:id', 
  authenticateToken,
  complaintIdValidation,
  getComplaintById
);

router.put('/:id/status', 
  authenticateToken,
  requireWorker,
  complaintIdValidation,
  updateStatusValidation,
  updateComplaintStatus
);

router.post('/:id/before-image',
  authenticateToken,
  requireWorker,
  complaintIdValidation,
  uploadSingle('image', 'before-after'),
  uploadBeforeImage
);

router.post('/:id/after-image',
  authenticateToken,
  requireWorker,
  complaintIdValidation,
  uploadSingle('image', 'before-after'),
  uploadAfterImage
);

router.post('/:id/feedback',
  authenticateToken,
  requireCitizen,
  complaintIdValidation,
  feedbackValidation,
  submitFeedback
);

module.exports = router;