const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    console.log('Request body:', req.body);
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
exports.validateUserRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('phone')
    .isLength({ min: 10, max: 15 })
    .withMessage('Please provide a valid phone number (10-15 characters)'),
  
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        throw new Error('Age must be between 13 and 120 years');
      }
      return true;
    }),
  
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other')
];

exports.validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

exports.validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  
  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),
  
  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Zip code cannot exceed 20 characters')
];

// Doctor validation rules
exports.validateDoctorRegistration = [
  body('licenseNumber')
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('License number must be between 5 and 50 characters'),
  
  body('specialization')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization must be between 2 and 100 characters'),
  
  body('experience')
    .custom((value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 0 || num > 50) {
        throw new Error('Experience must be between 0 and 50 years');
      }
      return true;
    }),
  
  body('consultationFee')
    .custom((value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        throw new Error('Consultation fee must be a positive number');
      }
      return true;
    }),
  
  body('qualifications')
    .isArray({ min: 1 })
    .withMessage('At least one qualification is required'),
  
  body('qualifications.*.degree')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Degree must be between 2 and 100 characters'),
  
  body('qualifications.*.institution')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Institution must be between 2 and 200 characters'),
  
  body('qualifications.*.year')
    .custom((value) => {
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1950 || year > currentYear) {
        throw new Error('Year must be between 1950 and current year');
      }
      return true;
    })
];

// Appointment validation rules
exports.validateAppointment = [
  body('doctor')
    .isMongoId()
    .withMessage('Please provide a valid doctor ID'),
  
  body('appointmentDate')
    .isISO8601()
    .withMessage('Please provide a valid appointment date')
    .custom((value) => {
      // Parse the date string and compare date parts directly
      const [year, month, day] = value.split('-').map(Number);
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth() + 1; // getMonth() returns 0-11
      const todayDay = today.getDate();
      
      // Compare dates by converting to comparable format (YYYYMMDD)
      const appointmentDateNum = year * 10000 + month * 100 + day;
      const todayDateNum = todayYear * 10000 + todayMonth * 100 + todayDay;
      
      if (appointmentDateNum < todayDateNum) {
        throw new Error('Appointment date cannot be in the past');
      }
      
      // Check if appointment is not more than 3 months in advance
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 3);
      const maxYear = maxDate.getFullYear();
      const maxMonth = maxDate.getMonth() + 1;
      const maxDay = maxDate.getDate();
      const maxDateNum = maxYear * 10000 + maxMonth * 100 + maxDay;
      
      if (appointmentDateNum > maxDateNum) {
        throw new Error('Appointment cannot be scheduled more than 3 months in advance');
      }
      
      return true;
    }),
  
  body('appointmentTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time in HH:MM format'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
  
  body('symptoms')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Symptoms must be between 5 and 1000 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  body('type')
    .optional()
    .isIn(['consultation', 'follow-up', 'emergency', 'routine'])
    .withMessage('Invalid appointment type'),
  
  body('isVirtual')
    .optional()
    .isBoolean()
    .withMessage('isVirtual must be a boolean value'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  
  body('meetingLink')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meeting link cannot exceed 500 characters'),
  
  body('paymentMethod')
    .optional()
    .isIn(['card', 'cash', 'insurance', 'other'])
    .withMessage('Invalid payment method')
];

// Health log validation rules
exports.validateHealthLog = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  
  body('vitalSigns.bloodPressure.systolic')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      const num = parseInt(value);
      if (isNaN(num) || num < 50 || num > 250) {
        throw new Error('Systolic pressure must be between 50 and 250');
      }
      return true;
    }),
  
  body('vitalSigns.bloodPressure.diastolic')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      const num = parseInt(value);
      if (isNaN(num) || num < 30 || num > 150) {
        throw new Error('Diastolic pressure must be between 30 and 150');
      }
      return true;
    }),
  
  body('vitalSigns.heartRate')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      const num = parseInt(value);
      if (isNaN(num) || num < 30 || num > 220) {
        throw new Error('Heart rate must be between 30 and 220');
      }
      return true;
    }),
  
  body('vitalSigns.temperature')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      const num = parseFloat(value);
      if (isNaN(num)) {
        throw new Error('Temperature must be a valid number');
      }
      // Accept both Celsius (20-45°C) and Fahrenheit (68-113°F) ranges
      if ((num >= 20 && num <= 45) || (num >= 68 && num <= 113)) {
        return true;
      }
      throw new Error('Temperature must be between 20-45°C (68-113°F)');
    }),
  
  body('vitalSigns.weight')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      const num = parseFloat(value);
      if (isNaN(num) || num < 20 || num > 1000) {
        throw new Error('Weight must be between 20 and 1000 lbs');
      }
      return true;
    }),
  
  body('mood')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      // Allow string values like 'excellent', 'good', etc.
      const validMoods = ['excellent', 'good', 'fair', 'poor', 'terrible'];
      if (typeof value === 'string' && validMoods.includes(value)) return true;
      // Also allow numeric values 1-10
      const num = parseInt(value);
      if (!isNaN(num) && num >= 1 && num <= 10) return true;
      throw new Error('Mood must be a valid mood string or number between 1 and 10');
    }),
  
  body('energyLevel')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      // Allow string values like 'high', 'medium', etc.
      const validLevels = ['high', 'medium', 'low', 'very-low'];
      if (typeof value === 'string' && validLevels.includes(value)) return true;
      // Also allow numeric values 1-10
      const num = parseInt(value);
      if (!isNaN(num) && num >= 1 && num <= 10) return true;
      throw new Error('Energy level must be a valid level string or number between 1 and 10');
    }),
  
  body('symptoms')
    .optional()
    .isArray()
    .withMessage('Symptoms must be an array'),
  
  body('symptoms.*.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Symptom name must be between 2 and 100 characters'),
  
  body('symptoms.*.severity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Symptom severity must be between 1 and 10')
];

// Community report validation rules
exports.validateCommunityReport = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Content must be between 50 and 5000 characters'),
  
  body('category')
    .isIn([
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
      'clinical_insights',
      'research_findings',
      'case_study',
      'diagnosis_insights',
      'other'
    ])
    .withMessage('Invalid category'),
  
  body('condition')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Condition must be between 2 and 100 characters'),
  
  body('rating.overall')
    .isInt({ min: 1, max: 5 })
    .withMessage('Overall rating must be between 1 and 5'),
  
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  
  body('tags.*')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each tag must be between 2 and 30 characters')
];

// Health goal validation rules
exports.validateHealthGoal = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('category')
    .isIn(['fitness', 'nutrition', 'mental_health', 'medical', 'lifestyle', 'other'])
    .withMessage('Invalid category'),
  
  body('type')
    .isIn(['metric', 'habit', 'milestone', 'custom'])
    .withMessage('Invalid goal type'),
  
  body('targetMetric.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Metric name must be between 2 and 50 characters'),
  
  body('targetMetric.unit')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Unit must be between 1 and 20 characters'),
  
  body('targetMetric.targetValue')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        throw new Error('Target value must be a positive number');
      }
      return true;
    }),
  
  body('timeframe.startDate')
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  
  body('timeframe.endDate')
    .isISO8601()
    .withMessage('Please provide a valid end date')
    .custom((value, { req }) => {
      const startDate = new Date(req.body.timeframe?.startDate);
      const endDate = new Date(value);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('priority')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  
  body('reminders.enabled')
    .optional()
    .isBoolean()
    .withMessage('Reminders enabled must be a boolean value'),
  
  body('reminders.frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Reminder frequency must be daily, weekly, or monthly'),
  
  body('reminders.time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Reminder time must be in HH:MM format')
];

// Product validation rules
exports.validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Product name must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  
  body('category')
    .isIn([
      'herbal_supplements',
      'ayurvedic_medicines',
      'skincare',
      'haircare',
      'digestive_health',
      'immune_support',
      'stress_relief',
      'sleep_aid',
      'joint_health',
      'heart_health',
      'diabetes_care',
      'weight_management',
      'women_health',
      'men_health',
      'children_health',
      'elderly_care',
      'other'
    ])
    .withMessage('Invalid category'),
  
  body('brand')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Brand must be between 2 and 100 characters'),
  
  body('price.current')
    .isFloat({ min: 0 })
    .withMessage('Current price must be a positive number'),
  
  body('inventory.stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer')
];

// Cart validation rules
exports.validateCartItem = [
  body('product')
    .isMongoId()
    .withMessage('Please provide a valid product ID'),
  
  body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100')
];

// Parameter validation
exports.validateMongoId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID`)
];

// Query validation
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

exports.validateSearch = [
  query('q')
    .optional()
    .custom((value) => {
      if (value && value.trim().length > 0) {
        if (value.trim().length < 2 || value.trim().length > 100) {
          throw new Error('Search query must be between 2 and 100 characters');
        }
      }
      return true;
    }),
  
  query('category')
    .optional()
    .custom((value) => {
      if (value && value.trim().length > 0) {
        if (value.trim().length < 2 || value.trim().length > 50) {
          throw new Error('Category must be between 2 and 50 characters');
        }
      }
      return true;
    })
];
