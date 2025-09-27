const express = require('express');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const HealthLog = require('../models/HealthLog');
const CommunityReport = require('../models/CommunityReport');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, restrictTo, checkActive } = require('../middleware/auth');
const { validateUserUpdate, validatePagination, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, checkActive, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // If user is a doctor, also get doctor profile
    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await Doctor.findOne({ user: user._id });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        doctor: doctorProfile
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, checkActive, validateUserUpdate, handleValidationErrors, async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'address', 'dateOfBirth', 'gender'];
    const updates = {};
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
});

// @route   POST /api/users/profile/upload-image
// @desc    Upload profile image
// @access  Private
router.post('/profile/upload-image', protect, checkActive, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No image file provided'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: req.file.path },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload image'
    });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, checkActive, async (req, res) => {
  try {
    console.log('Change password request received:', req.body);
    console.log('User ID:', req.user._id);
    
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      console.log('Missing password fields');
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check current password
    const isCorrectPassword = await user.correctPassword(currentPassword, user.password);
    console.log('Password check result:', isCorrectPassword);
    
    if (!isCorrectPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Hash the new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.updateOne(
      { _id: req.user._id },
      { 
        password: hashedPassword,
        passwordChangedAt: Date.now()
      }
    );
    console.log('Password updated successfully');

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password'
    });
  }
});

// @route   GET /api/users/doctors
// @desc    Get all doctors (for patients to browse)
// @access  Private
router.get('/doctors', protect, checkActive, validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { specialization, search, sortBy = 'rating.average', sortOrder = 'desc' } = req.query;

    // Build filter - temporarily show unverified doctors for testing
    const filter = { isVerified: { $in: [true, false] } }; // Show both verified and unverified doctors
    
    if (specialization) {
      filter.specialization = new RegExp(specialization, 'i');
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

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
      .populate('user', 'firstName lastName email phone profileImage')
      .sort(sort)
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

// @route   GET /api/users/doctors/:id
// @desc    Get doctor profile by ID
// @access  Private
router.get('/doctors/:id', protect, checkActive, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'firstName lastName email phone profileImage')
      .populate({
        path: 'reviews',
        populate: {
          path: 'patient',
          select: 'firstName lastName'
        }
      });

    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { doctor }
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch doctor'
    });
  }
});

// @route   GET /api/users/patients
// @desc    Get all patients (for doctors and admins)
// @access  Private (Doctor/Admin only)
router.get('/patients', protect, checkActive, restrictTo('doctor', 'admin'), validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, isActive } = req.query;

    // Build filter
    const filter = { role: 'patient' };
    
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

    const patients = await User.find({ ...filter, ...searchFilter })
      .select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ ...filter, ...searchFilter });

    res.status(200).json({
      status: 'success',
      data: {
        patients,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPatients: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patients'
    });
  }
});

// @route   GET /api/users/patients/:id
// @desc    Get patient profile by ID
// @access  Private (Doctor/Admin only)
router.get('/patients/:id', protect, checkActive, restrictTo('doctor', 'admin'), async (req, res) => {
  try {
    const patient = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires');

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { patient }
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patient'
    });
  }
});

// @route   PUT /api/users/doctors/:id/availability
// @desc    Update doctor availability
// @access  Private (Doctor only)
router.put('/doctors/:id/availability', protect, checkActive, restrictTo('doctor'), async (req, res) => {
  try {
    console.log('Availability update request received:', {
      doctorId: req.params.id,
      userId: req.user._id,
      availabilityData: req.body.availability
    });

    const doctor = await Doctor.findOne({ user: req.user._id });

    if (!doctor) {
      console.log('Doctor not found for user:', req.user._id);
      return res.status(404).json({
        status: 'error',
        message: 'Doctor profile not found'
      });
    }

    console.log('Found doctor:', doctor._id);
    console.log('Current doctor availability before update:', JSON.stringify(doctor.availability, null, 2));

    const { availability } = req.body;

    if (!availability) {
      console.log('No availability data provided');
      return res.status(400).json({
        status: 'error',
        message: 'Availability data is required'
      });
    }

    // Validate availability format
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of days) {
      if (availability[day]) {
        const dayData = availability[day];
        if (dayData.isAvailable) {
          if (!dayData.startTime || !dayData.endTime) {
            return res.status(400).json({
              status: 'error',
              message: `Start time and end time are required for ${day}`
            });
          }
        }
      }
    }

    console.log('Updating doctor availability:', availability);
    doctor.availability = availability;
    
    console.log('Saving doctor to database...');
    console.log('Doctor before save:', JSON.stringify(doctor.availability, null, 2));
    
    let savedDoctor;
    try {
      savedDoctor = await doctor.save();
      console.log('Doctor saved successfully');
      console.log('Doctor after save:', JSON.stringify(savedDoctor.availability, null, 2));
    } catch (saveError) {
      console.error('Error saving doctor:', saveError);
      if (saveError.name === 'ValidationError') {
        console.error('Validation errors:', saveError.errors);
      }
      throw saveError;
    }

    res.status(200).json({
      status: 'success',
      message: 'Availability updated successfully',
      data: { availability: savedDoctor.availability }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update availability'
    });
  }
});

// @route   PUT /api/users/doctors/:id/profile
// @desc    Update doctor profile
// @access  Private (Doctor only)
router.put('/doctors/:id/profile', protect, checkActive, restrictTo('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });

    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor profile not found'
      });
    }

    const allowedUpdates = ['specialization', 'bio', 'consultationFee', 'languages', 'isAcceptingNewPatients'];
    const updates = {};
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctor._id,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email phone profileImage');

    res.status(200).json({
      status: 'success',
      message: 'Doctor profile updated successfully',
      data: { doctor: updatedDoctor }
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update doctor profile'
    });
  }
});

// @route   DELETE /api/users/deactivate
// @desc    Deactivate user account
// @access  Private
router.delete('/deactivate', protect, checkActive, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: 'Password is required to deactivate account'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check password
    if (!(await user.correctPassword(password, user.password))) {
      return res.status(400).json({
        status: 'error',
        message: 'Incorrect password'
      });
    }

    // Deactivate account
    user.isActive = false;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to deactivate account'
    });
  }
});

// ==================== DASHBOARD ANALYTICS ENDPOINTS ====================

// @route   GET /api/users/dashboard/patient
// @desc    Get patient dashboard analytics
// @access  Private (Patient only)
router.get('/dashboard/patient', protect, checkActive, restrictTo('patient'), async (req, res) => {
  try {
    const userId = req.user._id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      patient: userId,
      status: { $in: ['confirmed', 'pending'] },
      appointmentDate: { $gte: new Date() }
    })
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'firstName lastName')
    .sort({ appointmentDate: 1 })
    .limit(3);

    // Get health logs for analytics
    const healthLogs = await HealthLog.find({
      user: userId,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 });

    // Calculate health metrics
    const recentLogs = healthLogs.slice(0, 7);
    const avgEnergy = recentLogs.length > 0 
      ? recentLogs.reduce((sum, log) => sum + (log.energyLevel || 0), 0) / recentLogs.length 
      : 0;

    // Get health streak (consecutive days with logs)
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasLog = healthLogs.some(log => {
        const logDate = new Date(log.createdAt);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === checkDate.getTime();
      });
      
      if (hasLog) {
        streak++;
      } else {
        break;
      }
    }

    // Get EDRC reports
    const edrcReports = await CommunityReport.find({
      author: userId,
      status: 'approved'
    }).sort({ createdAt: -1 }).limit(3);

    // Get recent orders
    const recentOrders = await Order.find({
      user: userId
    }).sort({ createdAt: -1 }).limit(3);

    res.status(200).json({
      status: 'success',
      data: {
        dashboard: {
          healthStreak: streak,
          avgEnergy: Math.round(avgEnergy * 10) / 10,
          upcomingAppointments: upcomingAppointments.length,
          totalHealthLogs: healthLogs.length,
          edrcReports: edrcReports.length,
          recentOrders: recentOrders.length
        },
        upcomingAppointments,
        recentHealthLogs: recentLogs,
        edrcReports,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Patient dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patient dashboard data'
    });
  }
});

// @route   GET /api/users/dashboard/doctor
// @desc    Get doctor dashboard analytics
// @access  Private (Doctor only)
router.get('/dashboard/doctor', protect, checkActive, restrictTo('doctor'), async (req, res) => {
  try {
    const userId = req.user._id;
    const doctor = await Doctor.findOne({ user: userId });
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor profile not found'
      });
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get today's appointments
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayAppointments = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: { $gte: todayStart, $lte: todayEnd }
    }).populate('patient', 'firstName lastName');

    // Get scheduled appointment requests (pending confirmation)
    const pendingRequests = await Appointment.find({
      doctor: doctor._id,
      status: 'scheduled'
    }).populate('patient', 'firstName lastName').limit(5);

    // Get recent patients
    const allRecentPatientIds = await Appointment.find({
      doctor: doctor._id,
      createdAt: { $gte: thirtyDaysAgo }
    }).distinct('patient');
    
    // Limit to 5 recent patients
    const recentPatientIds = allRecentPatientIds.slice(0, 5);

    const recentPatients = await User.find({
      _id: { $in: recentPatientIds }
    }).select('firstName lastName email');

    // Calculate average rating
    const avgRating = doctor.rating?.average || 0;
    const totalReviews = doctor.rating?.count || 0;

    // Get follow-ups due
    const followUpsDue = await Appointment.find({
      doctor: doctor._id,
      status: 'completed',
      'prescription.followUpDate': { $lte: new Date() }
    }).populate('patient', 'firstName lastName').limit(5);

    res.status(200).json({
      status: 'success',
      data: {
        dashboard: {
          todayAppointments: todayAppointments.length,
          pendingRequests: pendingRequests.length,
          avgRating: Math.round(avgRating * 10) / 10,
          totalReviews,
          followUpsDue: followUpsDue.length,
          totalPatients: recentPatients.length
        },
        todayAppointments,
        pendingRequests,
        recentPatients,
        followUpsDue
      }
    });
  } catch (error) {
    console.error('Doctor dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch doctor dashboard data'
    });
  }
});

// @route   GET /api/users/dashboard/admin
// @desc    Get admin dashboard analytics
// @access  Private (Admin only)
router.get('/dashboard/admin', protect, checkActive, restrictTo('admin'), async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get new registrations (7 days)
    const newRegistrations = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get total users
    const totalUsers = await User.countDocuments();
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });

    // Get active users (last 30 days)
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });

    // Get flagged content
    const flaggedReports = await CommunityReport.countDocuments({
      status: 'flagged'
    });

    // Get system health metrics
    const totalAppointments = await Appointment.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email role createdAt');

    const recentOrders = await Order.find()
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate sales (last 7 days)
    const recentOrdersSales = await Order.find({
      createdAt: { $gte: sevenDaysAgo },
      status: 'completed'
    });
    
    const totalSales = recentOrdersSales.reduce((sum, order) => sum + order.totalAmount, 0);

    res.status(200).json({
      status: 'success',
      data: {
        dashboard: {
          newRegistrations,
          totalUsers,
          totalPatients,
          totalDoctors,
          activeUsers,
          flaggedReports,
          totalAppointments,
          totalOrders,
          totalProducts,
          totalSales: Math.round(totalSales * 100) / 100
        },
        recentUsers,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch admin dashboard data'
    });
  }
});

// @route   GET /api/users/analytics/health-trends
// @desc    Get health trends for patient
// @access  Private (Patient only)
router.get('/analytics/health-trends', protect, checkActive, restrictTo('patient'), async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30' } = req.query; // 7, 30, 90 days
    const daysAgo = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    const healthLogs = await HealthLog.find({
      user: userId,
      createdAt: { $gte: daysAgo }
    }).sort({ createdAt: 1 });

    // Process data for charts
    const trends = {
      energyLevel: [],
      mood: [],
      sleep: [],
      exercise: [],
      symptoms: []
    };

    healthLogs.forEach(log => {
      const date = log.createdAt.toISOString().split('T')[0];
      
      if (log.energyLevel !== undefined) {
        trends.energyLevel.push({ date, value: log.energyLevel });
      }
      if (log.mood !== undefined) {
        trends.mood.push({ date, value: log.mood });
      }
      if (log.sleepHours !== undefined) {
        trends.sleep.push({ date, value: log.sleepHours });
      }
      if (log.exerciseMinutes !== undefined) {
        trends.exercise.push({ date, value: log.exerciseMinutes });
      }
      if (log.symptoms && log.symptoms.length > 0) {
        trends.symptoms.push({ date, symptoms: log.symptoms });
      }
    });

    res.status(200).json({
      status: 'success',
      data: { trends, period }
    });
  } catch (error) {
    console.error('Health trends error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch health trends'
    });
  }
});

// @route   GET /api/users/analytics/patient-progress
// @desc    Get patient progress analytics for doctor
// @access  Private (Doctor only)
router.get('/analytics/patient-progress/:patientId', protect, checkActive, restrictTo('doctor'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctor = await Doctor.findOne({ user: req.user._id });
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor profile not found'
      });
    }

    // Check if doctor has appointments with this patient
    const hasAppointments = await Appointment.findOne({
      doctor: doctor._id,
      patient: patientId
    });

    if (!hasAppointments) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this patient\'s data'
      });
    }

    const patient = await User.findById(patientId);
    const healthLogs = await HealthLog.find({
      user: patientId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 });

    const appointments = await Appointment.find({
      doctor: doctor._id,
      patient: patientId
    }).sort({ appointmentDate: -1 }).limit(5);

    res.status(200).json({
      status: 'success',
      data: {
        patient: {
          id: patient._id,
          name: `${patient.firstName} ${patient.lastName}`,
          email: patient.email,
          phone: patient.phone
        },
        healthLogs,
        appointments
      }
    });
  } catch (error) {
    console.error('Patient progress error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patient progress'
    });
  }
});

// @route   GET /api/doctors
// @desc    Get all doctors (public)
// @access  Public
router.get('/doctors', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { specialization, verified, acceptingPatients } = req.query;

    let filter = {};
    
    if (specialization) {
      filter.specialization = new RegExp(specialization, 'i');
    }
    
    if (verified !== undefined) {
      filter.isVerified = verified === 'true';
    }
    
    if (acceptingPatients !== undefined) {
      filter.isAcceptingNewPatients = acceptingPatients === 'true';
    }

    const doctors = await Doctor.find(filter)
      .populate('user', 'firstName lastName email phone')
      .sort({ 'rating.average': -1 })
      .skip(skip)
      .limit(limit);

    const total = await Doctor.countDocuments(filter);

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

// @route   GET /api/doctors/:id
// @desc    Get doctor by ID
// @access  Public
router.get('/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'firstName lastName email phone');

    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { doctor }
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch doctor'
    });
  }
});

// @route   GET /api/users/orders
// @desc    Get user's orders
// @access  Private
router.get('/orders', protect, checkActive, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'name images');

    const totalOrders = await Order.countDocuments({ user: req.user._id });
    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      status: 'success',
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders'
    });
  }
});

// @route   GET /api/users/orders/:orderId
// @desc    Get specific order details
// @access  Private
router.get('/orders/:orderId', protect, checkActive, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      user: req.user._id 
    })
      .populate('items.product', 'name images description')
      .populate('user', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order details'
    });
  }
});

module.exports = router;
