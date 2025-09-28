const express = require('express');
const CommunityReport = require('../models/CommunityReport');
const { protect, restrictTo, checkActive } = require('../middleware/auth');
const { validateCommunityReport, validatePagination, validateMongoId, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/community/reports
// @desc    Create a new community report
// @access  Private
router.post('/reports', protect, checkActive, validateCommunityReport, handleValidationErrors, async (req, res) => {
  try {
    const reportData = {
      author: req.user._id,
      ...req.body
    };

    const report = await CommunityReport.create(reportData);

    // Populate author information
    await report.populate('author', 'firstName lastName profileImage');

    res.status(201).json({
      status: 'success',
      message: 'Report submitted successfully. It will be reviewed before being published.',
      data: { report }
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create report'
    });
  }
});

// @route   GET /api/community/reports
// @desc    Get community reports
// @access  Private
router.get('/reports', protect, checkActive, validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { category, condition, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    } else {
      // Default to show approved reports and user's own pending reports
      filter.$or = [
        { status: 'approved' },
        { author: req.user._id, status: 'pending' }
      ];
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (condition) {
      filter.condition = new RegExp(condition, 'i');
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reports = await CommunityReport.find(filter)
      .populate('author', 'firstName lastName profileImage')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await CommunityReport.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        reports,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReports: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reports'
    });
  }
});

// @route   GET /api/community/reports/trending
// @desc    Get trending community reports
// @access  Private
router.get('/reports/trending', protect, checkActive, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const trendingReports = await CommunityReport.getTrendingReports(parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: { reports: trendingReports }
    });
  } catch (error) {
    console.error('Get trending reports error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch trending reports'
    });
  }
});

// @route   GET /api/community/reports/:id
// @desc    Get specific community report
// @access  Private
router.get('/reports/:id', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const report = await CommunityReport.findById(req.params.id)
      .populate('author', 'firstName lastName profileImage')
      .populate('doctorReview.doctor', 'specialization')
      .populate('productReview.product', 'name images');

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // Increment view count
    report.engagement.views += 1;
    await report.save();

    res.status(200).json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch report'
    });
  }
});

// @route   PUT /api/community/reports/:id
// @desc    Update community report
// @access  Private
router.put('/reports/:id', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const report = await CommunityReport.findOne({
      _id: req.params.id,
      author: req.user._id
    });

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found or access denied'
      });
    }

    // Check if report can be edited
    if (report.status === 'approved') {
      return res.status(400).json({
        status: 'error',
        message: 'Approved reports cannot be edited'
      });
    }

    const allowedUpdates = ['title', 'content', 'category', 'condition', 'tags', 'rating', 'treatmentDetails', 'doctorReview', 'productReview'];
    const updates = {};
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedReport = await CommunityReport.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName profileImage');

    res.status(200).json({
      status: 'success',
      message: 'Report updated successfully',
      data: { report: updatedReport }
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update report'
    });
  }
});

// @route   DELETE /api/community/reports/:id
// @desc    Delete community report
// @access  Private
router.delete('/reports/:id', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const report = await CommunityReport.findOne({
      _id: req.params.id,
      author: req.user._id
    });

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found or access denied'
      });
    }

    await CommunityReport.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete report'
    });
  }
});

// @route   POST /api/community/reports/:id/like
// @desc    Like/unlike a community report
// @access  Private
router.post('/reports/:id/like', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const report = await CommunityReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    const isLiked = report.addLike(req.user._id);
    await report.save();

    res.status(200).json({
      status: 'success',
      message: isLiked ? 'Report liked' : 'Report unliked',
      data: {
        isLiked,
        likeCount: report.likeCount
      }
    });
  } catch (error) {
    console.error('Like report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to like/unlike report'
    });
  }
});

// @route   POST /api/community/reports/:id/comments
// @desc    Add comment to community report
// @access  Private
router.post('/reports/:id/comments', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Comment content is required'
      });
    }

    const report = await CommunityReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    const comment = report.addComment(req.user._id, content.trim());
    await report.save();

    // Populate comment author
    await comment.populate('user', 'firstName lastName profileImage');

    res.status(201).json({
      status: 'success',
      message: 'Comment added successfully',
      data: { comment }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add comment'
    });
  }
});

// @route   POST /api/community/reports/:id/comments/:commentId/replies
// @desc    Reply to a comment
// @access  Private
router.post('/reports/:id/comments/:commentId/replies', protect, checkActive, validateMongoId('id'), validateMongoId('commentId'), handleValidationErrors, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Reply content is required'
      });
    }

    const report = await CommunityReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    const comment = report.engagement.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }

    const reply = {
      user: req.user._id,
      content: content.trim()
    };

    comment.replies.push(reply);
    await report.save();

    // Populate reply author
    const lastReply = comment.replies[comment.replies.length - 1];
    await lastReply.populate('user', 'firstName lastName profileImage');

    res.status(201).json({
      status: 'success',
      message: 'Reply added successfully',
      data: { reply: lastReply }
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add reply'
    });
  }
});

// @route   POST /api/community/reports/:id/flag
// @desc    Flag a community report
// @access  Private
router.post('/reports/:id/flag', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    console.log('Flag report request - ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);
    console.log('Request URL:', req.url);
    
    const { type = 'other', reason = 'Report flagged by user' } = req.body;

    const report = await CommunityReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // Check if user already flagged this report
    const existingFlag = report.moderation.flags.find(flag => 
      flag.flaggedBy.toString() === req.user._id.toString()
    );

    if (existingFlag) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already flagged this report'
      });
    }

    report.moderation.flags.push({
      type,
      reason,
      flaggedBy: req.user._id
    });

    // If report gets too many flags, mark it for review
    if (report.moderation.flags.length >= 5) {
      report.status = 'flagged';
    }

    await report.save();

    res.status(200).json({
      status: 'success',
      message: 'Report flagged successfully'
    });
  } catch (error) {
    console.error('Flag report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to flag report'
    });
  }
});

// @route   GET /api/community/categories
// @desc    Get report categories
// @access  Private
router.get('/categories', protect, checkActive, async (req, res) => {
  try {
    const categories = [
      'treatment_experience',
      'recovery_story',
      'symptom_management',
      'medication_review',
      'lifestyle_tips',
      'doctor_review',
      'product_review',
      'general_health',
      'mental_health',
      'chronic_condition',
      'other'
    ];

    res.status(200).json({
      status: 'success',
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories'
    });
  }
});

// @route   GET /api/community/stats
// @desc    Get community statistics
// @access  Private
router.get('/stats', protect, checkActive, async (req, res) => {
  try {
    const stats = await CommunityReport.aggregate([
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          approvedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          pendingReports: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          flaggedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] }
          },
          totalLikes: { $sum: { $size: '$engagement.likes' } },
          totalComments: { $sum: { $size: '$engagement.comments' } },
          totalViews: { $sum: '$engagement.views' }
        }
      }
    ]);

    const categoryStats = await CommunityReport.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        overall: stats[0] || {
          totalReports: 0,
          approvedReports: 0,
          pendingReports: 0,
          flaggedReports: 0,
          totalLikes: 0,
          totalComments: 0,
          totalViews: 0
        },
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error('Get community stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch community statistics'
    });
  }
});

// ==================== ADMIN MODERATION ROUTES ====================

// @route   GET /api/community/admin/reports
// @desc    Get all reports for moderation (Admin only)
// @access  Private (Admin)
router.get('/admin/reports', protect, checkActive, restrictTo('admin'), validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { status, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    } else {
      // Default to pending and flagged reports for moderation
      filter.status = { $in: ['pending', 'flagged'] };
    }
    
    if (category) {
      filter.category = category;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reports = await CommunityReport.find(filter)
      .populate('author', 'firstName lastName email profileImage')
      .populate('moderation.moderatedBy', 'firstName lastName')
      .populate('moderation.flags.flaggedBy', 'firstName lastName role')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await CommunityReport.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        reports,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReports: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get admin reports error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reports for moderation'
    });
  }
});

// @route   PUT /api/community/admin/reports/:id/moderate
// @desc    Moderate a community report (Approve/Reject/Flag)
// @access  Private (Admin)
router.put('/admin/reports/:id/moderate', protect, checkActive, restrictTo('admin'), validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { action, moderationNotes } = req.body;

    if (!['approve', 'reject', 'flag'].includes(action)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid moderation action. Must be approve, reject, or flag'
      });
    }

    const report = await CommunityReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // Update report status and moderation details
    report.status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged';
    report.moderation.moderatedBy = req.user._id;
    report.moderation.moderatedAt = new Date();
    report.moderation.moderationNotes = moderationNotes || '';

    await report.save();

    // Populate the updated report
    await report.populate('author', 'firstName lastName email');
    await report.populate('moderation.moderatedBy', 'firstName lastName');

    res.status(200).json({
      status: 'success',
      message: `Report ${action}d successfully`,
      data: { report }
    });
  } catch (error) {
    console.error('Moderate report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to moderate report'
    });
  }
});

// @route   DELETE /api/community/admin/reports/:id
// @desc    Delete a community report (Admin only)
// @access  Private (Admin)
router.delete('/admin/reports/:id', protect, checkActive, restrictTo('admin'), validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const report = await CommunityReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    await CommunityReport.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete report'
    });
  }
});

// @route   GET /api/community/admin/flagged
// @desc    Get all flagged reports
// @access  Private (Admin)
router.get('/admin/flagged', protect, checkActive, restrictTo('admin'), validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const reports = await CommunityReport.find({ status: 'flagged' })
      .populate('author', 'firstName lastName email profileImage')
      .populate('moderation.flags.flaggedBy', 'firstName lastName role')
      .sort({ 'moderation.flags.flaggedAt': -1 })
      .skip(skip)
      .limit(limit);

    const total = await CommunityReport.countDocuments({ status: 'flagged' });

    res.status(200).json({
      status: 'success',
      data: {
        reports,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReports: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get flagged reports error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch flagged reports'
    });
  }
});

// @route   GET /api/community/admin/stats
// @desc    Get moderation statistics
// @access  Private (Admin)
router.get('/admin/stats', protect, checkActive, restrictTo('admin'), async (req, res) => {
  try {
    const stats = await CommunityReport.aggregate([
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          pendingReports: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approvedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejectedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          flaggedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] }
          },
          totalFlags: { $sum: { $size: '$moderation.flags' } },
          totalLikes: { $sum: { $size: '$engagement.likes' } },
          totalComments: { $sum: { $size: '$engagement.comments' } },
          totalViews: { $sum: '$engagement.views' }
        }
      }
    ]);

    const categoryStats = await CommunityReport.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          flagged: {
            $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const flagTypeStats = await CommunityReport.aggregate([
      { $unwind: '$moderation.flags' },
      {
        $group: {
          _id: '$moderation.flags.type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        overall: stats[0] || {
          totalReports: 0,
          pendingReports: 0,
          approvedReports: 0,
          rejectedReports: 0,
          flaggedReports: 0,
          totalFlags: 0,
          totalLikes: 0,
          totalComments: 0,
          totalViews: 0
        },
        categories: categoryStats,
        flagTypes: flagTypeStats
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch moderation statistics'
    });
  }
});

// @route   POST /api/community/admin/reports/:id/verify
// @desc    Verify a community report (Admin only)
// @access  Private (Admin)
router.post('/admin/reports/:id/verify', protect, checkActive, restrictTo('admin'), validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { verificationMethod, verificationNotes } = req.body;

    if (!['medical_record', 'doctor_confirmation', 'admin_review'].includes(verificationMethod)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid verification method'
      });
    }

    const report = await CommunityReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    report.isVerified = true;
    report.verificationDetails = {
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      verificationMethod,
      verificationNotes: verificationNotes || ''
    };

    await report.save();

    res.status(200).json({
      status: 'success',
      message: 'Report verified successfully',
      data: { report }
    });
  } catch (error) {
    console.error('Verify report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify report'
    });
  }
});

module.exports = router;
