const express = require('express');
const HealthGoal = require('../models/HealthGoal');
const HealthLog = require('../models/HealthLog');
const { protect, checkActive } = require('../middleware/auth');
const { validatePagination, validateMongoId, handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// Validation rules for health goals
const validateHealthGoal = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Goal title must be between 5 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('category')
    .isIn([
      'weight_management',
      'fitness',
      'nutrition',
      'sleep',
      'mental_health',
      'medication_adherence',
      'symptom_management',
      'vital_signs',
      'lifestyle',
      'other'
    ])
    .withMessage('Invalid goal category'),
  
  body('type')
    .isIn(['increase', 'decrease', 'maintain', 'achieve', 'track'])
    .withMessage('Invalid goal type'),
  
  body('targetMetric.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Target metric name must be between 2 and 100 characters'),
  
  body('targetMetric.unit')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Target metric unit must be between 1 and 20 characters'),
  
  body('targetMetric.targetValue')
    .isNumeric()
    .withMessage('Target value must be a number'),
  
  body('timeframe.endDate')
    .isISO8601()
    .withMessage('Please provide a valid end date')
    .custom((value) => {
      const endDate = new Date(value);
      const today = new Date();
      if (endDate <= today) {
        throw new Error('End date must be in the future');
      }
      return true;
    }),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority level')
];

// @route   POST /api/health-goals
// @desc    Create a new health goal
// @access  Private
router.post('/', protect, checkActive, validateHealthGoal, handleValidationErrors, async (req, res) => {
  try {
    const goalData = {
      user: req.user._id,
      ...req.body
    };

    // Calculate duration in days
    const startDate = new Date(goalData.timeframe.startDate || Date.now());
    const endDate = new Date(goalData.timeframe.endDate);
    goalData.timeframe.duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    const healthGoal = await HealthGoal.create(goalData);

    res.status(201).json({
      status: 'success',
      message: 'Health goal created successfully',
      data: { healthGoal }
    });
  } catch (error) {
    console.error('Create health goal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create health goal'
    });
  }
});

// @route   GET /api/health-goals
// @desc    Get user's health goals
// @access  Private
router.get('/', protect, checkActive, validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { status, category, priority } = req.query;

    // Build filter
    const filter = { user: req.user._id };
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const healthGoals = await HealthGoal.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await HealthGoal.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        healthGoals,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalGoals: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get health goals error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch health goals'
    });
  }
});

// @route   GET /api/health-goals/:id
// @desc    Get specific health goal
// @access  Private
router.get('/:id', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const healthGoal = await HealthGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!healthGoal) {
      return res.status(404).json({
        status: 'error',
        message: 'Health goal not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { healthGoal }
    });
  } catch (error) {
    console.error('Get health goal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch health goal'
    });
  }
});

// @route   PUT /api/health-goals/:id
// @desc    Update health goal
// @access  Private
router.put('/:id', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const healthGoal = await HealthGoal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!healthGoal) {
      return res.status(404).json({
        status: 'error',
        message: 'Health goal not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Health goal updated successfully',
      data: { healthGoal }
    });
  } catch (error) {
    console.error('Update health goal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update health goal'
    });
  }
});

// @route   DELETE /api/health-goals/:id
// @desc    Delete health goal
// @access  Private
router.delete('/:id', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const healthGoal = await HealthGoal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!healthGoal) {
      return res.status(404).json({
        status: 'error',
        message: 'Health goal not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Health goal deleted successfully'
    });
  } catch (error) {
    console.error('Delete health goal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete health goal'
    });
  }
});

// @route   POST /api/health-goals/:id/progress
// @desc    Update goal progress
// @access  Private
router.post('/:id/progress', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { currentValue, note } = req.body;

    if (currentValue === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Current value is required'
      });
    }

    const healthGoal = await HealthGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!healthGoal) {
      return res.status(404).json({
        status: 'error',
        message: 'Health goal not found'
      });
    }

    // Update current value
    healthGoal.targetMetric.currentValue = currentValue;
    healthGoal.progress.lastUpdated = new Date();

    // Add note if provided
    if (note) {
      healthGoal.notes.push({
        content: note,
        type: 'progress'
      });
    }

    await healthGoal.save();

    res.status(200).json({
      status: 'success',
      message: 'Goal progress updated successfully',
      data: { healthGoal }
    });
  } catch (error) {
    console.error('Update goal progress error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update goal progress'
    });
  }
});

// @route   GET /api/health-goals/stats/overview
// @desc    Get user's goal statistics
// @access  Private
router.get('/stats/overview', protect, checkActive, async (req, res) => {
  try {
    const stats = await HealthGoal.getUserGoalStats(req.user._id);
    const categoryStats = await HealthGoal.getGoalsByCategory(req.user._id);

    // Get recent goals
    const recentGoals = await HealthGoal.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get overdue goals
    const overdueGoals = await HealthGoal.find({
      user: req.user._id,
      status: 'active',
      'timeframe.endDate': { $lt: new Date() }
    });

    res.status(200).json({
      status: 'success',
      data: {
        overview: stats[0] || {
          totalGoals: 0,
          activeGoals: 0,
          completedGoals: 0,
          averageProgress: 0,
          overdueGoals: 0
        },
        categoryStats,
        recentGoals,
        overdueGoals
      }
    });
  } catch (error) {
    console.error('Get goal stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch goal statistics'
    });
  }
});

// @route   POST /api/health-goals/:id/milestone
// @desc    Add milestone to goal
// @access  Private
router.post('/:id/milestone', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { title, targetValue, description } = req.body;

    if (!title || targetValue === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Title and target value are required'
      });
    }

    const healthGoal = await HealthGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!healthGoal) {
      return res.status(404).json({
        status: 'error',
        message: 'Health goal not found'
      });
    }

    healthGoal.milestones.push({
      title,
      targetValue,
      description
    });

    await healthGoal.save();

    res.status(200).json({
      status: 'success',
      message: 'Milestone added successfully',
      data: { healthGoal }
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add milestone'
    });
  }
});

// @route   PUT /api/health-goals/:id/milestone/:milestoneId
// @desc    Update milestone
// @access  Private
router.put('/:id/milestone/:milestoneId', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { achieved } = req.body;

    const healthGoal = await HealthGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!healthGoal) {
      return res.status(404).json({
        status: 'error',
        message: 'Health goal not found'
      });
    }

    const milestone = healthGoal.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({
        status: 'error',
        message: 'Milestone not found'
      });
    }

    if (achieved !== undefined) {
      milestone.achieved = achieved;
      if (achieved) {
        milestone.achievedDate = new Date();
      }
    }

    await healthGoal.save();

    res.status(200).json({
      status: 'success',
      message: 'Milestone updated successfully',
      data: { healthGoal }
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update milestone'
    });
  }
});

// @route   POST /api/health-goals/:id/share
// @desc    Share health goal with doctor
// @access  Private
router.post('/:id/share', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({
        status: 'error',
        message: 'Doctor ID is required'
      });
    }

    const healthGoal = await HealthGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!healthGoal) {
      return res.status(404).json({
        status: 'error',
        message: 'Health goal not found'
      });
    }

    // Add doctor to sharedWith array if not already present
    if (!healthGoal.sharing.sharedWith.includes(doctorId)) {
      healthGoal.sharing.sharedWith.push(doctorId);
      healthGoal.sharing.isShared = true;
      await healthGoal.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Health goal shared successfully',
      data: { healthGoal }
    });
  } catch (error) {
    console.error('Share health goal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to share health goal'
    });
  }
});

module.exports = router;
