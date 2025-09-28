const express = require('express');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const CommunityReport = require('../models/CommunityReport');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, restrictTo, checkActive } = require('../middleware/auth');
const { validatePagination, validateMongoId, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Test route to check orders without authentication (for debugging)
router.get('/test-orders', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber status payment.status createdAt user')
      .populate('user', 'firstName lastName email role');
    
    console.log('Test route - Total orders in database:', totalOrders);
    console.log('Test route - Recent orders:', recentOrders);
    
    res.status(200).json({
      status: 'success',
      message: 'Test route - Orders found in database',
      data: {
        totalOrders,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Test orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch test orders'
    });
  }
});

// All admin routes require admin role
router.use(protect, checkActive, restrictTo('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Get appointment statistics
    const totalAppointments = await Appointment.countDocuments();
    const appointmentsThisMonth = await Appointment.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    const pendingAppointments = await Appointment.countDocuments({
      status: 'scheduled'
    });

    // Get community report statistics
    const totalReports = await CommunityReport.countDocuments();
    const pendingReports = await CommunityReport.countDocuments({
      status: 'pending'
    });
    const flaggedReports = await CommunityReport.countDocuments({
      status: 'flagged'
    });

    // Get product statistics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.countDocuments({
      'inventory.stock': { $lte: 10 }
    });

    // Get order statistics
    const totalOrders = await Order.countDocuments();
    const ordersThisMonth = await Order.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    const confirmedOrders = await Order.countDocuments({
      status: { $in: ['confirmed', 'completed', 'delivered'] }
    });
    const pendingOrders = await Order.countDocuments({
      status: 'pending'
    });

    // Get revenue statistics
    const revenueStats = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'completed', 'confirmed'] },
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' }
        }
      }
    ]);

    const dashboardData = {
      users: {
        total: totalUsers,
        patients: totalPatients,
        doctors: totalDoctors,
        newThisMonth: newUsersThisMonth
      },
      appointments: {
        total: totalAppointments,
        thisMonth: appointmentsThisMonth,
        pending: pendingAppointments
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
        flagged: flaggedReports
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts
      },
      orders: {
        total: totalOrders,
        thisMonth: ordersThisMonth,
        confirmed: confirmedOrders,
        pending: pendingOrders
      },
      revenue: revenueStats[0] || {
        totalRevenue: 0,
        averageOrderValue: 0
      }
    };

    console.log('Admin dashboard data:', dashboardData);

    res.status(200).json({
      status: 'success',
      data: dashboardData
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with admin controls
// @access  Private (Admin only)
router.get('/users', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { role, isActive, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter
    const filter = {};
    
    if (role) {
      filter.role = role;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Build search
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { firstName: new RegExp(search, 'i') },
          { lastName: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ]
      };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find({ ...filter, ...searchFilter })
      .select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ ...filter, ...searchFilter });

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Private (Admin only)
router.put('/users/:id/status', validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'isActive must be a boolean value'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user status'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.put('/users/:id/role', validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['patient', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be patient, doctor, or admin'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User role updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user role'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user general information
// @access  Private (Admin only)
router.put('/users/:id', validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, isActive } = req.body;

    // Build update object with only provided fields
    const updateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (role !== undefined) {
      if (!['patient', 'doctor', 'admin'].includes(role)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid role. Must be patient, doctor, or admin'
        });
      }
      updateFields.role = role;
    }
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          status: 'error',
          message: 'isActive must be a boolean value'
        });
      }
      updateFields.isActive = isActive;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already exists'
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/users/:id', validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user'
    });
  }
});

// @route   GET /api/admin/doctors
// @desc    Get all doctors with verification status
// @access  Private (Admin only)
router.get('/doctors', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { isVerified, specialization, search } = req.query;

    // Build filter
    const filter = {};
    
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }
    
    if (specialization) {
      filter.specialization = new RegExp(specialization, 'i');
    }

    // Build search
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { specialization: new RegExp(search, 'i') },
          { bio: new RegExp(search, 'i') }
        ]
      };
    }

    const doctors = await Doctor.find({ ...filter, ...searchFilter })
      .populate('user', 'firstName lastName email phone profileImage isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Doctor.countDocuments({ ...filter, ...searchFilter });

    res.status(200).json({
      status: 'success',
      data: {
        doctors,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalDoctors: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch doctors'
    });
  }
});

// @route   PUT /api/admin/doctors/:id/verify
// @desc    Verify or reject doctor
// @access  Private (Admin only)
router.put('/doctors/:id/verify', validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { isVerified, notes } = req.body;

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'isVerified must be a boolean value'
      });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { 
        isVerified,
        verificationNotes: notes
      },
      { new: true }
    ).populate('user', 'firstName lastName email phone profileImage');

    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Doctor ${isVerified ? 'verified' : 'rejected'} successfully`,
      data: { doctor }
    });
  } catch (error) {
    console.error('Verify doctor error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify doctor'
    });
  }
});

// @route   GET /api/admin/reports
// @desc    Get all community reports for moderation
// @access  Private (Admin only)
router.get('/reports', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { status, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (category) {
      filter.category = category;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reports = await CommunityReport.find(filter)
      .populate('author', 'firstName lastName email profileImage')
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

// @route   PUT /api/admin/reports/:id/moderate
// @desc    Moderate community report
// @access  Private (Admin only)
router.put('/reports/:id/moderate', validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['approved', 'rejected', 'flagged'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be approved, rejected, or flagged'
      });
    }

    const report = await CommunityReport.findByIdAndUpdate(
      req.params.id,
      {
        status,
        'moderation.moderatedBy': req.user._id,
        'moderation.moderatedAt': new Date(),
        'moderation.moderationNotes': notes
      },
      { new: true }
    ).populate('author', 'firstName lastName email profileImage');

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Report ${status} successfully`,
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

// @route   GET /api/admin/appointments
// @desc    Get all appointments for admin view
// @access  Private (Admin only)
router.get('/appointments', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { status, type, startDate, endDate } = req.query;

    // Build filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (startDate || endDate) {
      filter.appointmentDate = {};
      if (startDate) filter.appointmentDate.$gte = new Date(startDate);
      if (endDate) filter.appointmentDate.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(filter)
      .populate([
        { path: 'patient', select: 'firstName lastName email phone' },
        { path: 'doctor', populate: { path: 'user', select: 'firstName lastName email phone' } }
      ])
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        appointments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalAppointments: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch appointments'
    });
  }
});

// @route   GET /api/admin/orders/debug
// @desc    Debug route to check orders in database
// @access  Private (Admin only)
router.get('/orders/debug', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber status payment.status createdAt user')
      .populate('user', 'firstName lastName email');
    
    console.log('Debug - Total orders in database:', totalOrders);
    console.log('Debug - Recent orders:', recentOrders);
    
    res.status(200).json({
      status: 'success',
      data: {
        totalOrders,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Debug orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to debug orders'
    });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders for admin view
// @access  Private (Admin only)
router.get('/orders', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    console.log('Admin orders route accessed by user:', {
      userId: req.user._id,
      userRole: req.user.role,
      userEmail: req.user.email
    });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { status, paymentStatus, startDate, endDate } = req.query;

    // Build filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (paymentStatus) {
      filter['payment.status'] = paymentStatus;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    console.log('Admin orders query - filter:', filter);
    console.log('Admin orders query - pagination:', { page, limit, skip });

    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);
    
    console.log('Admin orders query - results:', {
      ordersFound: orders.length,
      totalOrders: total,
      filter: filter
    });

    res.status(200).json({
      status: 'success',
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Private (Admin only)
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get current month start for "this month" calculations
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    // User statistics
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: currentMonthStart }
    });

    // Order statistics
    const totalOrders = await Order.countDocuments();
    const ordersThisMonth = await Order.countDocuments({
      createdAt: { $gte: currentMonthStart }
    });

    // Revenue statistics
    const revenueStats = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'completed', 'confirmed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' }
        }
      }
    ]);

    // Product statistics
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({
      'inventory.stock': { $lte: 10 } // Assuming low stock threshold is 10
    });

    // User registration trends
    const userTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Appointment trends
    const appointmentTrends = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Revenue trends
    const revenueTrends = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'completed', 'confirmed'] },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Top products
    const topProducts = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'completed', 'confirmed'] },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          productName: '$product.name',
          totalSold: 1,
          totalRevenue: 1
        }
      },
      {
        $sort: { totalSold: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        period: `${period} days`,
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth
        },
        orders: {
          total: totalOrders,
          thisMonth: ordersThisMonth
        },
        revenue: revenueStats[0] || {
          totalRevenue: 0,
          averageOrderValue: 0
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts
        },
        userTrends,
        appointmentTrends,
        revenueTrends,
        topProducts
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics'
    });
  }
});

// @route   GET /api/admin/analytics/sales-report
// @desc    Generate comprehensive sales report
// @access  Private (Admin only)
router.get('/analytics/sales-report', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    console.log('Sales report query - date range:', { start, end });
    console.log('Sales report query - looking for orders with status: delivered, completed, confirmed');
    
    // Debug: Check what orders exist in the database
    const allOrders = await Order.find({}).select('status createdAt pricing.total orderNumber').limit(5);
    console.log('Sample orders in database:', allOrders);

    // Sales summary
    const salesSummary = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'completed', 'confirmed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' },
          totalTax: { $sum: '$pricing.tax' },
          totalShipping: { $sum: '$pricing.shipping' },
          totalDiscount: { $sum: '$pricing.discount' }
        }
      }
    ]);

    console.log('Sales summary result:', salesSummary);

    // Sales by period
    let groupFormat;
    switch (groupBy) {
      case 'hour':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        break;
      case 'day':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const salesByPeriod = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'completed', 'confirmed'] }
        }
      },
      {
        $group: {
          _id: groupFormat,
          orders: { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
      }
    ]);

    // Top selling products
    const topSellingProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'completed', 'confirmed'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          averagePrice: { $avg: '$items.price' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          productName: 1,
          category: '$product.category',
          brand: '$product.brand',
          totalQuantity: 1,
          totalRevenue: 1,
          averagePrice: 1
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Sales by category
    const salesByCategory = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'completed', 'confirmed'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $group: {
          _id: '$product.category',
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    // Customer analytics
    const customerAnalytics = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'completed', 'confirmed'] }
        }
      },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          customerName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          customerEmail: '$user.email',
          totalOrders: 1,
          totalSpent: 1,
          averageOrderValue: 1
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Get additional metrics for the summary
    const totalProductsSold = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'completed', 'confirmed'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: null,
          totalProductsSold: { $sum: '$items.quantity' }
        }
      }
    ]);

    const uniqueCustomers = await Order.distinct('user', {
      createdAt: { $gte: start, $lte: end },
      status: { $in: ['delivered', 'completed', 'confirmed'] }
    });

    const cancelledOrders = await Order.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: 'cancelled'
    });

    const completedOrders = await Order.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: { $in: ['delivered', 'completed'] }
    });

    // Daily sales data
    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'completed', 'confirmed'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          revenue: 1,
          orders: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    // Category performance
    const categoryPerformance = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'completed', 'confirmed'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $group: {
          _id: '$product.category',
          category: { $first: '$product.category' },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        period: { start, end, groupBy },
        summary: {
          ...(salesSummary[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            totalTax: 0,
            totalShipping: 0,
            totalDiscount: 0
          }),
          totalProductsSold: totalProductsSold[0]?.totalProductsSold || 0,
          uniqueCustomers: uniqueCustomers.length,
          cancelledOrders,
          completedOrders
        },
        salesByPeriod,
        topSellingProducts,
        salesByCategory,
        customerAnalytics,
        dailySales,
        categoryPerformance
      }
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate sales report'
    });
  }
});

// @route   GET /api/admin/analytics/user-activity
// @desc    Generate user activity report
// @access  Private (Admin only)
router.get('/analytics/user-activity', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // User registration trends
    const registrationTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalRegistrations: { $sum: 1 },
          patients: {
            $sum: { $cond: [{ $eq: ['$role', 'patient'] }, 1, 0] }
          },
          doctors: {
            $sum: { $cond: [{ $eq: ['$role', 'doctor'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Active users (users with appointments or orders)
    const activeUsers = await User.aggregate([
      {
        $lookup: {
          from: 'appointments',
          localField: '_id',
          foreignField: 'patient',
          as: 'appointments'
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $match: {
          $or: [
            { 'appointments.createdAt': { $gte: start, $lte: end } },
            { 'orders.createdAt': { $gte: start, $lte: end } }
          ]
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // User engagement metrics
    const engagementMetrics = await User.aggregate([
      {
        $lookup: {
          from: 'appointments',
          localField: '_id',
          foreignField: 'patient',
          as: 'appointments'
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $lookup: {
          from: 'healthlogs',
          localField: '_id',
          foreignField: 'user',
          as: 'healthLogs'
        }
      },
      {
        $lookup: {
          from: 'communityreports',
          localField: '_id',
          foreignField: 'author',
          as: 'reports'
        }
      },
      {
        $project: {
          role: 1,
          totalAppointments: { $size: '$appointments' },
          totalOrders: { $size: '$orders' },
          totalHealthLogs: { $size: '$healthLogs' },
          totalReports: { $size: '$reports' },
          lastLogin: 1,
          isActive: 1
        }
      },
      {
        $group: {
          _id: '$role',
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          avgAppointments: { $avg: '$totalAppointments' },
          avgOrders: { $avg: '$totalOrders' },
          avgHealthLogs: { $avg: '$totalHealthLogs' },
          avgReports: { $avg: '$totalReports' }
        }
      }
    ]);

    // Recent user activity
    const recentActivity = await User.aggregate([
      {
        $match: {
          lastLogin: { $gte: start, $lte: end }
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          role: 1,
          lastLogin: 1,
          isActive: 1
        }
      },
      {
        $sort: { lastLogin: -1 }
      },
      {
        $limit: 50
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        period: { start, end },
        registrationTrends,
        activeUsers,
        engagementMetrics,
        recentActivity
      }
    });
  } catch (error) {
    console.error('User activity report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate user activity report'
    });
  }
});

// @route   GET /api/admin/analytics/inventory-report
// @desc    Generate inventory and product performance report
// @access  Private (Admin only)
router.get('/analytics/inventory-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Inventory overview
    const inventoryOverview = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          featuredProducts: {
            $sum: { $cond: ['$isFeatured', 1, 0] }
          },
          lowStockProducts: {
            $sum: {
              $cond: [
                { $lte: ['$inventory.stock', '$inventory.lowStockThreshold'] },
                1,
                0
              ]
            }
          },
          outOfStockProducts: {
            $sum: { $cond: [{ $eq: ['$inventory.stock', 0] }, 1, 0] }
          },
          totalInventoryValue: {
            $sum: { $multiply: ['$inventory.stock', '$price.current'] }
          }
        }
      }
    ]);

    // Products by category
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          totalStock: { $sum: '$inventory.stock' },
          averagePrice: { $avg: '$price.current' },
          totalValue: {
            $sum: { $multiply: ['$inventory.stock', '$price.current'] }
          }
        }
      },
      {
        $sort: { totalProducts: -1 }
      }
    ]);

    // Low stock products
    const lowStockProducts = await Product.find({
      'inventory.stock': { $lte: 10 },
      isActive: true
    })
    .select('name category brand inventory.stock inventory.lowStockThreshold price.current')
    .sort({ 'inventory.stock': 1 })
    .limit(20);

    // Top performing products (by sales)
    const topPerformingProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'completed', 'confirmed'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          productName: 1,
          category: '$product.category',
          currentStock: '$product.inventory.stock',
          currentPrice: '$product.price.current',
          totalSold: 1,
          totalRevenue: 1,
          stockTurnover: {
            $divide: ['$totalSold', '$product.inventory.stock']
          }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Products with no sales
    const productsWithNoSales = await Product.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.product',
          as: 'orders'
        }
      },
      {
        $match: {
          orders: { $size: 0 },
          isActive: true
        }
      },
      {
        $project: {
          name: 1,
          category: 1,
          brand: 1,
          'inventory.stock': 1,
          'price.current': 1,
          createdAt: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 20
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        period: { start, end },
        overview: inventoryOverview[0] || {
          totalProducts: 0,
          activeProducts: 0,
          featuredProducts: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0,
          totalInventoryValue: 0
        },
        productsByCategory,
        lowStockProducts,
        topPerformingProducts,
        productsWithNoSales
      }
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate inventory report'
    });
  }
});

// @route   GET /api/admin/products/inventory
// @desc    Get inventory management data
// @access  Private (Admin only)
router.get('/products/inventory', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { category, stockStatus, search, sortBy = 'name', sortOrder = 'asc' } = req.query;

    // Build filter
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (stockStatus) {
      switch (stockStatus) {
        case 'in_stock':
          filter['inventory.stock'] = { $gt: 10 };
          break;
        case 'low_stock':
          filter['inventory.stock'] = { $gt: 0, $lte: 10 };
          break;
        case 'out_of_stock':
          filter['inventory.stock'] = 0;
          break;
      }
    }

    // Build search
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { name: new RegExp(search, 'i') },
          { brand: new RegExp(search, 'i') },
          { category: new RegExp(search, 'i') }
        ]
      };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find({ ...filter, ...searchFilter })
      .select('name brand category price inventory isActive isFeatured createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({ ...filter, ...searchFilter });

    // Get inventory summary
    const inventorySummary = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
          lowStockProducts: {
            $sum: {
              $cond: [
                { $and: [
                  { $gt: ['$inventory.stock', 0] },
                  { $lte: ['$inventory.stock', '$inventory.lowStockThreshold'] }
                ]},
                1,
                0
              ]
            }
          },
          outOfStockProducts: {
            $sum: { $cond: [{ $eq: ['$inventory.stock', 0] }, 1, 0] }
          },
          totalInventoryValue: {
            $sum: { $multiply: ['$inventory.stock', '$price.current'] }
          }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        products,
        summary: inventorySummary[0] || {
          totalProducts: 0,
          activeProducts: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0,
          totalInventoryValue: 0
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch inventory data'
    });
  }
});

// @route   PUT /api/admin/products/:id/inventory
// @desc    Update product inventory
// @access  Private (Admin only)
router.put('/products/:id/inventory', validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { stock, lowStockThreshold, trackInventory, allowBackorder } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Update inventory fields
    if (stock !== undefined) {
      product.inventory.stock = stock;
    }
    if (lowStockThreshold !== undefined) {
      product.inventory.lowStockThreshold = lowStockThreshold;
    }
    if (trackInventory !== undefined) {
      product.inventory.trackInventory = trackInventory;
    }
    if (allowBackorder !== undefined) {
      product.inventory.allowBackorder = allowBackorder;
    }

    product.lastModifiedBy = req.user._id;
    await product.save();

    res.status(200).json({
      status: 'success',
      message: 'Inventory updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update inventory'
    });
  }
});

// @route   POST /api/admin/products/:id/stock-adjustment
// @desc    Adjust product stock (add/remove)
// @access  Private (Admin only)
router.post('/products/:id/stock-adjustment', validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { quantity, operation, reason } = req.body; // operation: 'add' or 'subtract'

    if (!quantity || !operation || !['add', 'subtract'].includes(operation)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid quantity and operation (add/subtract) are required'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const oldStock = product.inventory.stock;
    
    if (operation === 'subtract' && product.inventory.stock < quantity) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient stock for this adjustment'
      });
    }

    await product.updateStock(quantity, operation);
    product.lastModifiedBy = req.user._id;
    await product.save();

    res.status(200).json({
      status: 'success',
      message: `Stock ${operation === 'add' ? 'increased' : 'decreased'} successfully`,
      data: {
        product,
        adjustment: {
          operation,
          quantity,
          oldStock,
          newStock: product.inventory.stock,
          reason
        }
      }
    });
  } catch (error) {
    console.error('Stock adjustment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to adjust stock'
    });
  }
});

// @route   GET /api/admin/products/low-stock
// @desc    Get low stock products
// @access  Private (Admin only)
router.get('/products/low-stock', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const lowStockProducts = await Product.find({
      'inventory.stock': { $gt: 0, $lte: 10 },
      isActive: true
    })
    .select('name brand category inventory.stock inventory.lowStockThreshold price.current')
    .sort({ 'inventory.stock': 1 })
    .limit(parseInt(limit));

    const outOfStockProducts = await Product.find({
      'inventory.stock': 0,
      isActive: true
    })
    .select('name brand category inventory.stock price.current')
    .sort({ name: 1 })
    .limit(parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: {
        lowStockProducts,
        outOfStockProducts,
        summary: {
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length
        }
      }
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch low stock products'
    });
  }
});

// @route   GET /api/admin/products/categories
// @desc    Get product categories with statistics
// @access  Private (Admin only)
router.get('/products/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalStock: { $sum: '$inventory.stock' },
          averagePrice: { $avg: '$price.current' },
          totalValue: {
            $sum: { $multiply: ['$inventory.stock', '$price.current'] }
          },
          lowStockCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $gt: ['$inventory.stock', 0] },
                  { $lte: ['$inventory.stock', '$inventory.lowStockThreshold'] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { totalProducts: -1 }
      }
    ]);

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

// @route   POST /api/admin/products/bulk-update
// @desc    Bulk update products
// @access  Private (Admin only)
router.post('/products/bulk-update', async (req, res) => {
  try {
    const { productIds, updates } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Product IDs array is required'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Updates object is required'
      });
    }

    // Allowed fields for bulk update
    const allowedFields = [
      'isActive', 'isFeatured', 'category', 'brand',
      'inventory.stock', 'inventory.lowStockThreshold',
      'inventory.trackInventory', 'inventory.allowBackorder'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields to update'
      });
    }

    filteredUpdates.lastModifiedBy = req.user._id;

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: filteredUpdates }
    );

    res.status(200).json({
      status: 'success',
      message: `Updated ${result.modifiedCount} products successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to bulk update products'
    });
  }
});

// @route   GET /api/admin/products/performance
// @desc    Get product performance analytics
// @access  Private (Admin only)
router.get('/products/performance', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Top performing products by revenue
    const topByRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['delivered', 'completed'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.name' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          productName: 1,
          category: '$product.category',
          currentStock: '$product.inventory.stock',
          totalRevenue: 1,
          totalQuantity: 1,
          orderCount: 1,
          averageOrderValue: { $divide: ['$totalRevenue', '$orderCount'] }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Top performing products by quantity
    const topByQuantity = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['delivered', 'completed'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          productName: 1,
          category: '$product.category',
          currentStock: '$product.inventory.stock',
          totalQuantity: 1,
          totalRevenue: 1
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Products with no sales
    const noSalesProducts = await Product.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.product',
          as: 'orders'
        }
      },
      {
        $match: {
          orders: { $size: 0 },
          isActive: true,
          createdAt: { $gte: startDate }
        }
      },
      {
        $project: {
          name: 1,
          category: 1,
          brand: 1,
          'inventory.stock': 1,
          'price.current': 1,
          createdAt: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 20
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        period: `${period} days`,
        topByRevenue,
        topByQuantity,
        noSalesProducts
      }
    });
  } catch (error) {
    console.error('Product performance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product performance data'
    });
  }
});

// @route   GET /api/admin/analytics/export
// @desc    Export sales analytics data as CSV or PDF
// @access  Private (Admin only)
router.get('/analytics/export', async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    console.log('Export request - format:', format, 'date range:', { start, end });

    // Get comprehensive sales data
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'completed', 'confirmed'] }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      {
        $unwind: '$userData'
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      {
        $unwind: '$productData'
      },
      {
        $project: {
          orderNumber: 1,
          orderDate: '$createdAt',
          customerName: { $concat: ['$userData.firstName', ' ', '$userData.lastName'] },
          customerEmail: '$userData.email',
          productName: '$productData.name',
          productCategory: '$productData.category',
          quantity: '$items.quantity',
          unitPrice: '$items.price',
          totalPrice: { $multiply: ['$items.quantity', '$items.price'] },
          orderStatus: '$status',
          paymentStatus: '$payment.status',
          paymentMethod: '$payment.method',
          subtotal: '$pricing.subtotal',
          tax: '$pricing.tax',
          shipping: '$pricing.shipping',
          discount: '$pricing.discount',
          orderTotal: '$pricing.total'
        }
      },
      {
        $sort: { orderDate: -1 }
      }
    ]);

    // Get summary statistics
    const summaryStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'completed', 'confirmed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' },
          totalTax: { $sum: '$pricing.tax' },
          totalShipping: { $sum: '$pricing.shipping' },
          totalDiscount: { $sum: '$pricing.discount' },
          uniqueCustomers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          totalOrders: 1,
          totalRevenue: 1,
          averageOrderValue: 1,
          totalTax: 1,
          totalShipping: 1,
          totalDiscount: 1,
          uniqueCustomers: { $size: '$uniqueCustomers' }
        }
      }
    ]);

    const stats = summaryStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalTax: 0,
      totalShipping: 0,
      totalDiscount: 0,
      uniqueCustomers: 0
    };

    if (format === 'csv') {
      // Generate CSV
      let csvContent = 'Sales Analytics Report\n';
      csvContent += `Generated on: ${new Date().toISOString()}\n`;
      csvContent += `Date Range: ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}\n\n`;
      
      // Summary section
      csvContent += 'SUMMARY STATISTICS\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Orders,${stats.totalOrders}\n`;
      csvContent += `Total Revenue,$${stats.totalRevenue.toFixed(2)}\n`;
      csvContent += `Average Order Value,$${stats.averageOrderValue.toFixed(2)}\n`;
      csvContent += `Total Tax,$${stats.totalTax.toFixed(2)}\n`;
      csvContent += `Total Shipping,$${stats.totalShipping.toFixed(2)}\n`;
      csvContent += `Total Discount,$${stats.totalDiscount.toFixed(2)}\n`;
      csvContent += `Unique Customers,${stats.uniqueCustomers}\n\n`;
      
      // Detailed data section
      csvContent += 'DETAILED ORDER DATA\n';
      csvContent += 'Order Number,Order Date,Customer Name,Customer Email,Product Name,Product Category,Quantity,Unit Price,Total Price,Order Status,Payment Status,Payment Method,Subtotal,Tax,Shipping,Discount,Order Total\n';
      
      salesData.forEach(order => {
        csvContent += `"${order.orderNumber}","${order.orderDate.toISOString()}","${order.customerName}","${order.customerEmail}","${order.productName}","${order.productCategory}",${order.quantity},${order.unitPrice},${order.totalPrice},"${order.orderStatus}","${order.paymentStatus}","${order.paymentMethod}",${order.subtotal},${order.tax},${order.shipping},${order.discount},${order.orderTotal}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sales-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
      
    } else if (format === 'json') {
      // Generate JSON
      const exportData = {
        metadata: {
          generatedOn: new Date().toISOString(),
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString()
          },
          totalRecords: salesData.length
        },
        summary: stats,
        orders: salesData
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="sales-analytics-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
      
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid format. Supported formats: csv, json'
      });
    }

    console.log(`Export completed - ${salesData.length} records exported in ${format} format`);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export analytics data'
    });
  }
});

// @route   GET /api/admin/orders/export
// @desc    Export orders data as CSV, PDF, or Excel
// @access  Private (Admin only)
router.get('/orders/export', async (req, res) => {
  try {
    const { 
      format = 'csv', 
      startDate, 
      endDate, 
      status, 
      paymentStatus,
      search 
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (paymentStatus) {
      filter['payment.status'] = paymentStatus;
    }
    
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'user.firstName': { $regex: search, $options: 'i' } },
        { 'user.lastName': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Get orders with populated user data
    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .lean();

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Order Number',
        'Customer Name',
        'Customer Email',
        'Customer Phone',
        'Order Status',
        'Payment Status',
        'Subtotal',
        'Tax',
        'Shipping',
        'Discount',
        'Total',
        'Order Date',
        'Items Count'
      ];

      const csvRows = orders.map(order => [
        order.orderNumber || '',
        `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
        order.user?.email || '',
        order.user?.phone || '',
        order.status || '',
        order.payment?.status || '',
        order.pricing?.subtotal || 0,
        order.pricing?.tax || 0,
        order.pricing?.shipping || 0,
        order.pricing?.discount || 0,
        order.pricing?.total || 0,
        new Date(order.createdAt).toISOString().split('T')[0],
        order.items?.length || 0
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);

    } else if (format === 'json') {
      // Generate JSON
      const exportData = {
        metadata: {
          generatedOn: new Date().toISOString(),
          totalOrders: orders.length,
          dateRange: startDate && endDate ? { startDate, endDate } : null,
          filters: { status, paymentStatus, search }
        },
        orders: orders.map(order => ({
          orderNumber: order.orderNumber,
          customer: {
            name: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
            email: order.user?.email,
            phone: order.user?.phone
          },
          status: order.status,
          payment: {
            status: order.payment?.status,
            method: order.payment?.method
          },
          pricing: order.pricing,
          items: order.items?.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        }))
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);

    } else if (format === 'pdf') {
      // For PDF generation, we'll return a simplified JSON structure
      // In a real implementation, you'd use a library like puppeteer or jsPDF
      const pdfData = {
        title: 'Orders Report',
        generatedOn: new Date().toISOString(),
        totalOrders: orders.length,
        orders: orders.map(order => ({
          orderNumber: order.orderNumber,
          customer: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
          email: order.user?.email,
          status: order.status,
          paymentStatus: order.payment?.status,
          total: order.pricing?.total || 0,
          date: new Date(order.createdAt).toLocaleDateString()
        }))
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="orders-report-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(pdfData);

    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid format. Supported formats: csv, json, pdf'
      });
    }

    console.log(`Orders export completed - ${orders.length} records exported in ${format} format`);

  } catch (error) {
    console.error('Orders export error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export orders data'
    });
  }
});

module.exports = router;
