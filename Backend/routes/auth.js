const express = require('express');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { signToken, signRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin, validateDoctorRegistration, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, handleValidationErrors, async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, dateOfBirth, gender, address, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      address,
      role: role || 'patient'
    });


    // Generate tokens
    const token = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Remove sensitive data
    user.password = undefined;

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed. Please try again.'
    });
  }
});

// @route   POST /api/auth/register-doctor
// @desc    Register a new doctor
// @access  Public
router.post('/register-doctor', validateUserRegistration, validateDoctorRegistration, handleValidationErrors, async (req, res) => {
  try {
    const { 
      firstName, lastName, email, password, phone, dateOfBirth, gender, address,
      licenseNumber, specialization, qualifications, experience, consultationFee, bio, languages
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Check if license number already exists
    const existingDoctor = await Doctor.findOne({ licenseNumber });
    if (existingDoctor) {
      return res.status(400).json({
        status: 'error',
        message: 'Doctor with this license number already exists'
      });
    }

    // Create user with doctor role
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      address,
      role: 'doctor'
    });

    // Create doctor profile
    const doctor = await Doctor.create({
      user: user._id,
      licenseNumber,
      specialization,
      qualifications,
      experience,
      consultationFee,
      bio,
      languages
    });


    // Generate tokens
    const token = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Remove sensitive data
    user.password = undefined;

    res.status(201).json({
      status: 'success',
      message: 'Doctor registered successfully',
      data: {
        user,
        doctor,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Doctor registration failed. Please try again.'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and password is correct
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const token = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Remove sensitive data
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed. Please try again.'
    });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = signToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);

    res.status(200).json({
      status: 'success',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid refresh token'
    });
  }
});



// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

module.exports = router;
