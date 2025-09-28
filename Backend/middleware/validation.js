const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);
    console.log('Request URL:', req.url);
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
    .matches(/^0[0-9]{9}$/)
    .withMessage('Please provide a valid Sri Lankan mobile number (e.g., 0704949394)'),
  
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
    }),
  
  body('bio')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Bio must be between 10 and 500 characters')
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

// Health log validation rules - Updated to match frontend requirements
exports.validateHealthLog = [
  // 1. Basic Information - Required fields
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        throw new Error('Date cannot be in the future');
      }
      return true;
    }),
  
  body('mood')
    .notEmpty()
    .withMessage('Please select your mood')
    .isIn(['excellent', 'good', 'fair', 'poor', 'terrible'])
    .withMessage('Please select your mood'),
  
  body('energyLevel')
    .notEmpty()
    .withMessage('Please select your energy level')
    .isIn(['high', 'medium', 'low', 'very-low'])
    .withMessage('Please select your energy level'),
  
  // 2. Vital Signs - Required fields
  body('vitalSigns.bloodPressure.systolic')
    .notEmpty()
    .withMessage('Enter systolic pressure')
    .custom((value) => {
      const num = parseInt(value);
      if (isNaN(num)) {
        throw new Error('Enter numbers only (50-250)');
      }
      if (num < 50 || num > 250) {
        throw new Error('Enter a value between 50 and 250');
      }
      return true;
    }),
  
  body('vitalSigns.bloodPressure.diastolic')
    .notEmpty()
    .withMessage('Enter diastolic pressure')
    .custom((value) => {
      const num = parseInt(value);
      if (isNaN(num)) {
        throw new Error('Enter numbers only (30-150)');
      }
      if (num < 30 || num > 150) {
        throw new Error('Enter a value between 30 and 150');
      }
      return true;
    })
    .custom((value, { req }) => {
      const systolic = parseInt(req.body.vitalSigns?.bloodPressure?.systolic);
      const diastolic = parseInt(value);
      if (!isNaN(systolic) && !isNaN(diastolic) && systolic <= diastolic) {
        throw new Error('Systolic pressure must be higher than diastolic pressure');
      }
      return true;
    }),
  
  body('vitalSigns.heartRate')
    .notEmpty()
    .withMessage('Enter heart rate')
    .custom((value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 40 || num > 200) {
        throw new Error('Enter a value between 40 and 200');
      }
      return true;
    }),
  
  body('vitalSigns.temperature')
    .notEmpty()
    .withMessage('Enter temperature')
    .custom((value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 25 || num > 45) {
        throw new Error('Enter a value between 25 and 45');
      }
      return true;
    }),
  
  body('vitalSigns.weight')
    .notEmpty()
    .withMessage('Enter weight')
    .custom((value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 20 || num > 300) {
        throw new Error('Enter a value between 20 and 300');
      }
      return true;
    }),
  
  body('vitalSigns.height')
    .notEmpty()
    .withMessage('Enter height')
    .custom((value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 50 || num > 250) {
        throw new Error('Enter a value between 50 and 250');
      }
      return true;
    }),
  
  // 3. Sleep & Exercise - Required fields
  body('sleep.duration')
    .notEmpty()
    .withMessage('Enter sleep hours between 0 and 24')
    .custom((value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 24) {
        throw new Error('Enter sleep hours between 0 and 24');
      }
      return true;
    }),
  
  body('sleep.quality')
    .notEmpty()
    .withMessage('Please rate your sleep quality')
    .isIn(['excellent', 'good', 'fair', 'poor'])
    .withMessage('Please rate your sleep quality'),
  
  body('exercise.type')
    .optional()
    .custom((value) => {
      if (value && value.length > 100) {
        throw new Error('Exercise type must be under 100 characters');
      }
      return true;
    }),
  
  body('exercise.duration')
    .notEmpty()
    .withMessage('Exercise duration must be between 0 and 300 minutes')
    .custom((value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 300) {
        throw new Error('Exercise duration must be between 0 and 300 minutes');
      }
      return true;
    }),
  
  body('exercise.intensity')
    .notEmpty()
    .withMessage('Please select exercise intensity')
    .isIn(['low', 'moderate', 'high'])
    .withMessage('Please select exercise intensity'),
  
  // 4. Nutrition & Notes - Required fields
  body('nutrition.waterIntake')
    .notEmpty()
    .withMessage('Water intake must be between 0 and 300 oz')
    .custom((value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 300) {
        throw new Error('Water intake must be between 0 and 300 oz');
      }
      return true;
    }),
  
  body('nutrition.supplements')
    .optional()
    .custom((value) => {
      if (value && value.length > 200) {
        throw new Error('Supplements must be under 200 characters');
      }
      return true;
    }),
  
  body('nutrition.meals')
    .optional()
    .custom((value) => {
      if (value && value.length > 500) {
        throw new Error('Meals description must be under 500 characters');
      }
      return true;
    }),
  
  body('medications')
    .optional()
    .custom((value) => {
      if (value && value.length > 300) {
        throw new Error('Medications must be under 300 characters');
      }
      return true;
    }),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags) {
        const tagsString = tags.join(', ');
        if (tagsString.length > 200) {
          throw new Error('Tags must be under 200 characters total');
        }
        for (let i = 0; i < tags.length; i++) {
          const tag = tags[i].trim();
          if (tag.length > 50) {
            throw new Error('Each tag must be under 50 characters');
          }
        }
      }
      return true;
    }),
  
  body('notes')
    .optional()
    .custom((value) => {
      if (value && value.length > 1000) {
        throw new Error('Notes must be under 1000 characters');
      }
      return true;
    })
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
    .custom((value) => {
      console.log(`Validating ${paramName} ID:`, value);
      console.log(`ID length:`, value?.length);
      console.log(`ID type:`, typeof value);
      return true;
    })
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
