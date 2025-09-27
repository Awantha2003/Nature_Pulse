const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      console.log('No token provided for request:', req.path);
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const currentUser = await User.findById(decoded.id).select('+password');
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'error',
        message: 'User recently changed password. Please log in again.'
      });
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired. Please log in again.'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Authentication error.'
    });
  }
};

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log('Role check for request:', req.path, 'User role:', req.user.role, 'Required roles:', roles);
    if (!roles.includes(req.user.role)) {
      console.log('Access denied - insufficient role for request:', req.path);
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};

// Check if user is active
exports.checkActive = (req, res, next) => {
  if (!req.user.isActive) {
    return res.status(403).json({
      status: 'error',
      message: 'Your account has been deactivated. Please contact support.'
    });
  }
  next();
};


// Optional authentication - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      
      if (currentUser && !currentUser.changedPasswordAfter(decoded.iat)) {
        req.user = currentUser;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Generate JWT token
exports.signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Generate refresh token
exports.signRefreshToken = (id) => {
  return jwt.sign({ id, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Verify refresh token
exports.verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw error;
  }
};

// Check if user has specific permissions
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Check if user can access specific resource
exports.checkResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.userId;
      const userId = req.user._id;
      const userRole = req.user.role;

      // Admin can access everything
      if (userRole === 'admin') {
        return next();
      }

      // Users can access their own resources
      if (resourceId === userId.toString()) {
        return next();
      }

      // Doctors can access their patients' data
      if (userRole === 'doctor' && resourceType === 'patient') {
        const Doctor = require('../models/Doctor');
        const doctor = await Doctor.findOne({ user: userId });
        
        if (doctor) {
          // Check if this patient has appointments with this doctor
          const Appointment = require('../models/Appointment');
          const hasAppointment = await Appointment.findOne({
            doctor: doctor._id,
            patient: resourceId
          });

          if (hasAppointment) {
            return next();
          }
        }
      }

      return res.status(403).json({
        status: 'fail',
        message: 'You do not have access to this resource'
      });
    } catch (error) {
      console.error('Resource access check error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to verify resource access'
      });
    }
  };
};

// Check if user owns the resource
exports.checkOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user._id;
      const userRole = req.user.role;

      // Admin can access everything
      if (userRole === 'admin') {
        return next();
      }

      // Check if user owns the resource
      const resource = await resourceModel.findById(resourceId);
      if (!resource) {
        return res.status(404).json({
          status: 'error',
          message: 'Resource not found'
        });
      }

      // Check ownership based on resource type
      if (resource.user && resource.user.toString() === userId.toString()) {
        return next();
      }

      if (resource.patient && resource.patient.toString() === userId.toString()) {
        return next();
      }

      if (resource.author && resource.author.toString() === userId.toString()) {
        return next();
      }

      return res.status(403).json({
        status: 'fail',
        message: 'You do not have access to this resource'
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to verify resource ownership'
      });
    }
  };
};
