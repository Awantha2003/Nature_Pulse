// Validation utility functions for form validation

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Phone validation regex for Sri Lankan mobile numbers
const PHONE_REGEX = /^0[0-9]{9}$/; // Sri Lankan mobile format: 0XXXXXXXXX (10 digits starting with 0)

// Password strength requirements
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 128;

// Name validation
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 50;

// Address validation
const ADDRESS_MIN_LENGTH = 5;
const ADDRESS_MAX_LENGTH = 200;

// License number validation
const LICENSE_MIN_LENGTH = 5;
const LICENSE_MAX_LENGTH = 50;

// Specialization validation
const SPECIALIZATION_MIN_LENGTH = 2;
const SPECIALIZATION_MAX_LENGTH = 100;

// Bio validation
const BIO_MIN_LENGTH = 10;
const BIO_MAX_LENGTH = 500;

// Age validation
const MIN_AGE = 13;
const MAX_AGE = 120;

// Experience validation
const MIN_EXPERIENCE = 0;
const MAX_EXPERIENCE = 50;

// Consultation fee validation (in Sri Lankan Rupees)
const MIN_FEE = 100; // Minimum 100 LKR
const MAX_FEE = 50000; // Maximum 50,000 LKR

// Helper function to safely trim strings
const safeTrim = (value) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return '';
};

// Email validation
export const validateEmail = (email) => {
  if (!email || safeTrim(email) === '') {
    return 'Email is required';
  }
  if (!EMAIL_REGEX.test(safeTrim(email))) {
    return 'Please enter a valid email address';
  }
  return null;
};

// Password validation
export const validatePassword = (password) => {
  if (!password || password === '') {
    return 'Password is required';
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be no more than ${PASSWORD_MAX_LENGTH} characters long`;
  }
  return null;
};

// Password match validation
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword === '') {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};

// Name validation
export const validateName = (name, fieldName = 'Name') => {
  if (!name || safeTrim(name) === '') {
    return `${fieldName} is required`;
  }
  if (safeTrim(name).length < NAME_MIN_LENGTH) {
    return `${fieldName} must be at least ${NAME_MIN_LENGTH} characters long`;
  }
  if (safeTrim(name).length > NAME_MAX_LENGTH) {
    return `${fieldName} must be no more than ${NAME_MAX_LENGTH} characters long`;
  }
  if (!/^[a-zA-Z\s\-'\.]+$/.test(safeTrim(name))) {
    return `${fieldName} can only contain letters, spaces, hyphens, apostrophes, and periods`;
  }
  return null;
};

// Phone validation
export const validatePhone = (phone) => {
  if (!phone || safeTrim(phone) === '') {
    return 'Phone number is required';
  }
  if (!PHONE_REGEX.test(safeTrim(phone))) {
    return 'Please enter a valid Sri Lankan mobile number (0XXXXXXXXX)';
  }
  return null;
};

// Address validation
export const validateAddress = (address, fieldName = 'Address') => {
  if (!address || safeTrim(address) === '') {
    return `${fieldName} is required`;
  }
  if (safeTrim(address).length < ADDRESS_MIN_LENGTH) {
    return `${fieldName} must be at least ${ADDRESS_MIN_LENGTH} characters long`;
  }
  if (safeTrim(address).length > ADDRESS_MAX_LENGTH) {
    return `${fieldName} must be no more than ${ADDRESS_MAX_LENGTH} characters long`;
  }
  return null;
};

// Date of birth validation
export const validateDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) {
    return 'Date of birth is required';
  }
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  
  if (isNaN(birthDate.getTime())) {
    return 'Please enter a valid date';
  }
  
  if (age < MIN_AGE) {
    return `You must be at least ${MIN_AGE} years old`;
  }
  
  if (age > MAX_AGE) {
    return `Age must be less than ${MAX_AGE} years`;
  }
  
  return null;
};

// Gender validation
export const validateGender = (gender) => {
  if (!gender || safeTrim(gender) === '') {
    return 'Gender is required';
  }
  const validGenders = ['male', 'female', 'other'];
  if (!validGenders.includes(safeTrim(gender).toLowerCase())) {
    return 'Please select a valid gender';
  }
  return null;
};

// Login form validation
export const validateLoginForm = (formData) => {
  const errors = {};
  
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;
  
  return errors;
};

// Helper functions
export const isFormValid = (errors) => {
  return Object.keys(errors).length === 0;
};

export const getFirstError = (errors) => {
  const firstKey = Object.keys(errors)[0];
  return firstKey ? errors[firstKey] : null;
};

// Register form validation
export const validateRegisterForm = (formData) => {
  const errors = {};
  
  // Personal information
  const firstNameError = validateName(formData.firstName, 'First name');
  if (firstNameError) errors.firstName = firstNameError;
  
  const lastNameError = validateName(formData.lastName, 'Last name');
  if (lastNameError) errors.lastName = lastNameError;
  
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;
  
  const confirmPasswordError = validatePasswordMatch(formData.password, formData.confirmPassword);
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
  
  const phoneError = validatePhone(formData.phone);
  if (phoneError) errors.phone = phoneError;
  
  const dateOfBirthError = validateDateOfBirth(formData.dateOfBirth);
  if (dateOfBirthError) errors.dateOfBirth = dateOfBirthError;
  
  const genderError = validateGender(formData.gender);
  if (genderError) errors.gender = genderError;
  
  return errors;
};

// Doctor register form validation
export const validateDoctorRegisterForm = (formData, qualifications = []) => {
  const errors = {};
  
  // Basic information
  const firstNameError = validateName(formData.firstName, 'First name');
  if (firstNameError) errors.firstName = firstNameError;
  
  const lastNameError = validateName(formData.lastName, 'Last name');
  if (lastNameError) errors.lastName = lastNameError;
  
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;
  
  const confirmPasswordError = validatePasswordMatch(formData.password, formData.confirmPassword);
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
  
  const phoneError = validatePhone(formData.phone);
  if (phoneError) errors.phone = phoneError;
  
  const dateOfBirthError = validateDateOfBirth(formData.dateOfBirth);
  if (dateOfBirthError) errors.dateOfBirth = dateOfBirthError;
  
  const genderError = validateGender(formData.gender);
  if (genderError) errors.gender = genderError;
  
  return errors;
};

// Qualification validation
export const validateQualification = (qualification) => {
  const errors = {};
  
  if (!qualification.degree || safeTrim(qualification.degree) === '') {
    errors.degree = 'Degree is required';
  } else if (safeTrim(qualification.degree).length > 100) {
    errors.degree = 'Degree must be no more than 100 characters long';
  }
  
  if (!qualification.institution || safeTrim(qualification.institution) === '') {
    errors.institution = 'Institution is required';
  } else if (safeTrim(qualification.institution).length > 200) {
    errors.institution = 'Institution must be no more than 200 characters long';
  }
  
  if (!qualification.year || safeTrim(qualification.year) === '') {
    errors.year = 'Year is required';
  } else {
    const year = parseInt(qualification.year);
    const currentYear = new Date().getFullYear();
    if (isNaN(year)) {
      errors.year = 'Please enter a valid year';
    } else if (year < 1950) {
      errors.year = 'Year cannot be before 1950';
    } else if (year > currentYear) {
      errors.year = 'Year cannot be in the future';
    }
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

// Language validation
export const validateLanguage = (language) => {
  if (!language || safeTrim(language) === '') {
    return 'Language cannot be empty';
  }
  if (safeTrim(language).length < 2) {
    return 'Language must be at least 2 characters long';
  }
  if (safeTrim(language).length > 50) {
    return 'Language must be no more than 50 characters long';
  }
  if (!/^[a-zA-Z\s\-']+$/.test(safeTrim(language))) {
    return 'Language can only contain letters, spaces, hyphens, and apostrophes';
  }
  return null;
};

// Appointment booking validation
export const validateAppointmentBooking = (formData) => {
  const errors = {};
  
  if (!formData.selectedDoctor) {
    errors.selectedDoctor = 'Please select a doctor';
  }
  
  if (!formData.selectedDate) {
    errors.selectedDate = 'Please select an appointment date';
  }
  
  if (!formData.selectedTime) {
    errors.selectedTime = 'Please select an appointment time';
  }
  
  if (!formData.appointmentType) {
    errors.appointmentType = 'Please select appointment type';
  }
  
  if (!formData.reason || safeTrim(formData.reason) === '') {
    errors.reason = 'Reason for appointment is required';
  } else if (safeTrim(formData.reason).length < 10) {
    errors.reason = 'Reason must be at least 10 characters long';
  }
  
  if (formData.symptoms && safeTrim(formData.symptoms).length > 500) {
    errors.symptoms = 'Symptoms description must be no more than 500 characters';
  }
  
  if (formData.notes && safeTrim(formData.notes).length > 1000) {
    errors.notes = 'Notes must be no more than 1000 characters';
  }
  
  return errors;
};

// Profile update validation
export const validateProfileUpdate = (formData) => {
  const errors = {};
  
  const firstNameError = validateName(formData.firstName, 'First name');
  if (firstNameError) errors.firstName = firstNameError;
  
  const lastNameError = validateName(formData.lastName, 'Last name');
  if (lastNameError) errors.lastName = lastNameError;
  
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  const phoneError = validatePhone(formData.phone);
  if (phoneError) errors.phone = phoneError;
  
  if (formData.dateOfBirth) {
    const dateOfBirthError = validateDateOfBirth(formData.dateOfBirth);
    if (dateOfBirthError) errors.dateOfBirth = dateOfBirthError;
  }
  
  if (formData.gender) {
    const genderError = validateGender(formData.gender);
    if (genderError) errors.gender = genderError;
  }
  
  if (formData.address && safeTrim(formData.address).length > 200) {
    errors.address = 'Address must be no more than 200 characters';
  }
  
  return errors;
};

// Password change validation
export const validatePasswordChange = (formData) => {
  const errors = {};
  
  if (!formData.currentPassword || formData.currentPassword.trim() === '') {
    errors.currentPassword = 'Current password is required';
  }
  
  const newPasswordError = validatePassword(formData.newPassword);
  if (newPasswordError) errors.newPassword = newPasswordError;
  
  const confirmPasswordError = validatePasswordMatch(formData.newPassword, formData.confirmPassword);
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
  
  return errors;
};

// Health goals validation
export const validateHealthGoal = (formData) => {
  const errors = {};
  
  if (!formData.title || safeTrim(formData.title) === '') {
    errors.title = 'Goal title is required';
  } else if (safeTrim(formData.title).length < 5) {
    errors.title = 'Goal title must be at least 5 characters long';
  } else if (safeTrim(formData.title).length > 100) {
    errors.title = 'Goal title must be no more than 100 characters';
  }
  
  if (!formData.description || safeTrim(formData.description) === '') {
    errors.description = 'Goal description is required';
  } else if (safeTrim(formData.description).length < 10) {
    errors.description = 'Goal description must be at least 10 characters long';
  } else if (safeTrim(formData.description).length > 500) {
    errors.description = 'Goal description must be no more than 500 characters';
  }
  
  if (!formData.category || safeTrim(formData.category) === '') {
    errors.category = 'Goal category is required';
  }
  
  if (!formData.type || safeTrim(formData.type) === '') {
    errors.type = 'Goal type is required';
  }
  
  if (formData.targetMetric) {
    if (!formData.targetMetric.name || safeTrim(formData.targetMetric.name) === '') {
      errors['targetMetric.name'] = 'Target metric name is required';
    }
    
    if (!formData.targetMetric.unit || safeTrim(formData.targetMetric.unit) === '') {
      errors['targetMetric.unit'] = 'Target metric unit is required';
    }
    
    if (!formData.targetMetric.targetValue || safeTrim(formData.targetMetric.targetValue) === '') {
      errors['targetMetric.targetValue'] = 'Target value is required';
    }
  }
  
  if (!formData.priority || safeTrim(formData.priority) === '') {
    errors.priority = 'Priority is required';
  }
  
  if (!formData.targetDate) {
    errors.targetDate = 'Target date is required';
  } else {
    const targetDate = new Date(formData.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(targetDate.getTime())) {
      errors.targetDate = 'Please enter a valid target date';
    } else if (targetDate < today) {
      errors.targetDate = 'Target date cannot be in the past';
    }
  }
  
  return errors;
};

// Health log validation constants
const HEALTH_VALIDATION = {
  BLOOD_PRESSURE: {
    SYSTOLIC: { min: 50, max: 250 },
    DIASTOLIC: { min: 30, max: 150 }
  },
  HEART_RATE: { min: 40, max: 200 },
  TEMPERATURE: { min: 25, max: 45 }, // Celsius
  WEIGHT: { min: 20, max: 300 }, // kg
  HEIGHT: { min: 50, max: 250 }, // cm
  ENERGY_LEVEL: { min: 1, max: 10 },
  SLEEP_DURATION: { min: 0, max: 24 }, // hours
  EXERCISE_DURATION: { min: 0, max: 300 }, // minutes
  WATER_INTAKE: { min: 0, max: 300 }, // oz
  EXERCISE_TYPE_MAX: 100,
  SUPPLEMENTS_MAX: 200,
  MEALS_MAX: 500,
  MEDICATIONS_MAX: 300,
  TAGS_MAX: 200,
  TAG_MAX: 50,
  NOTES_MAX: 1000
};

// Individual field validation functions for health logs
export const validateBloodPressure = (systolic, diastolic) => {
  const errors = {};
  
  if (systolic && systolic !== '') {
    const sysNum = parseInt(systolic);
    if (isNaN(sysNum)) {
      errors.systolic = 'Enter a value between 50 and 250';
    } else if (sysNum < HEALTH_VALIDATION.BLOOD_PRESSURE.SYSTOLIC.min || sysNum > HEALTH_VALIDATION.BLOOD_PRESSURE.SYSTOLIC.max) {
      errors.systolic = 'Enter a value between 50 and 250';
    }
  }
  
  if (diastolic && diastolic !== '') {
    const diaNum = parseInt(diastolic);
    if (isNaN(diaNum)) {
      errors.diastolic = 'Enter a value between 30 and 150';
    } else if (diaNum < HEALTH_VALIDATION.BLOOD_PRESSURE.DIASTOLIC.min || diaNum > HEALTH_VALIDATION.BLOOD_PRESSURE.DIASTOLIC.max) {
      errors.diastolic = 'Enter a value between 30 and 150';
    }
  }
  
  // Cross-validation: systolic must be higher than diastolic
  if (systolic && diastolic && systolic !== '' && diastolic !== '') {
    const sysNum = parseInt(systolic);
    const diaNum = parseInt(diastolic);
    if (!isNaN(sysNum) && !isNaN(diaNum) && sysNum <= diaNum) {
      errors.systolic = 'Systolic pressure must be higher than diastolic pressure';
    }
  }
  
  return errors;
};

export const validateHeartRate = (heartRate) => {
  if (!heartRate || heartRate === '') return null;
  
  const hr = parseInt(heartRate);
  if (isNaN(hr) || hr < HEALTH_VALIDATION.HEART_RATE.min || hr > HEALTH_VALIDATION.HEART_RATE.max) {
    return 'Heart rate must be between 40 and 200';
  }
  return null;
};

export const validateTemperature = (temperature) => {
  if (!temperature || temperature === '') return null;
  
  const temp = parseFloat(temperature);
  if (isNaN(temp) || temp < HEALTH_VALIDATION.TEMPERATURE.min || temp > HEALTH_VALIDATION.TEMPERATURE.max) {
    return 'Enter a valid temperature (25–45 °C)';
  }
  return null;
};

export const validateWeight = (weight) => {
  if (!weight || weight === '') return null;
  
  const w = parseFloat(weight);
  if (isNaN(w) || w < HEALTH_VALIDATION.WEIGHT.min || w > HEALTH_VALIDATION.WEIGHT.max) {
    return 'Weight must be between 20 and 300 kg';
  }
  return null;
};

export const validateHeight = (height) => {
  if (!height || height === '') return null;
  
  const h = parseFloat(height);
  if (isNaN(h) || h < HEALTH_VALIDATION.HEIGHT.min || h > HEALTH_VALIDATION.HEIGHT.max) {
    return 'Height must be between 50 and 250 cm';
  }
  return null;
};

export const validateEnergyLevel = (energyLevel) => {
  if (!energyLevel || energyLevel === '') return null;
  
  const level = parseInt(energyLevel);
  if (isNaN(level) || level < HEALTH_VALIDATION.ENERGY_LEVEL.min || level > HEALTH_VALIDATION.ENERGY_LEVEL.max) {
    return 'Energy level must be between 1 and 10';
  }
  return null;
};

export const validateSleepDuration = (duration) => {
  if (!duration || duration === '') return null;
  
  const d = parseFloat(duration);
  if (isNaN(d) || d < HEALTH_VALIDATION.SLEEP_DURATION.min || d > HEALTH_VALIDATION.SLEEP_DURATION.max) {
    return 'Enter sleep hours between 0 and 24';
  }
  return null;
};

export const validateExerciseDuration = (duration) => {
  if (!duration || duration === '') return null;
  
  const d = parseFloat(duration);
  if (isNaN(d) || d < HEALTH_VALIDATION.EXERCISE_DURATION.min || d > HEALTH_VALIDATION.EXERCISE_DURATION.max) {
    return 'Exercise duration must be between 0 and 300 minutes';
  }
  return null;
};

export const validateWaterIntake = (waterIntake) => {
  if (!waterIntake || waterIntake === '') return null;
  
  const w = parseFloat(waterIntake);
  if (isNaN(w) || w < HEALTH_VALIDATION.WATER_INTAKE.min || w > HEALTH_VALIDATION.WATER_INTAKE.max) {
    return 'Water intake must be between 0 and 300 oz';
  }
  return null;
};

export const validateExerciseType = (exerciseType) => {
  if (!exerciseType || exerciseType === '') return null;
  
  if (exerciseType.length > HEALTH_VALIDATION.EXERCISE_TYPE_MAX) {
    return 'Exercise type must be under 100 characters';
  }
  return null;
};

export const validateSupplements = (supplements) => {
  if (!supplements || supplements === '') return null;
  
  if (supplements.length > HEALTH_VALIDATION.SUPPLEMENTS_MAX) {
    return 'Supplements must be under 200 characters';
  }
  return null;
};

export const validateMeals = (meals) => {
  if (!meals || meals === '') return null;
  
  if (meals.length > HEALTH_VALIDATION.MEALS_MAX) {
    return 'Meals description must be under 500 characters';
  }
  return null;
};

export const validateMedications = (medications) => {
  if (!medications || medications === '') return null;
  
  if (medications.length > HEALTH_VALIDATION.MEDICATIONS_MAX) {
    return 'Medications must be under 300 characters';
  }
  return null;
};

export const validateTags = (tags) => {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
  
  const tagsString = tags.join(', ');
  if (tagsString.length > HEALTH_VALIDATION.TAGS_MAX) {
    return 'Tags must be under 200 characters total';
  }
  
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i].trim();
    if (tag.length > HEALTH_VALIDATION.TAG_MAX) {
      return 'Each tag must be under 50 characters';
    }
  }
  return null;
};

export const validateNotes = (notes) => {
  if (!notes || notes === '') return null;
  
  if (notes.length > HEALTH_VALIDATION.NOTES_MAX) {
    return 'Notes must be under 1000 characters';
  }
  return null;
};

// Health log validation - Matches backend validation exactly
export const validateHealthLog = (formData) => {
  const errors = {};
  
  // 1. Basic Information - Required fields
  if (!formData.date) {
    errors.date = 'Date is required';
  } else {
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      errors.date = 'Date cannot be in the future';
    }
  }
  
  // Mood - Required
  if (!formData.mood) {
    errors.mood = 'Please select your mood';
  } else if (!['excellent', 'good', 'fair', 'poor', 'terrible'].includes(formData.mood)) {
    errors.mood = 'Please select your mood';
  }
  
  // Energy Level - Required (dropdown)
  if (!formData.energyLevel) {
    errors.energyLevel = 'Please select your energy level';
  } else if (!['high', 'medium', 'low', 'very-low'].includes(formData.energyLevel)) {
    errors.energyLevel = 'Please select your energy level';
  }
  
  // 2. Vital Signs - Required fields
  // Blood pressure - Required
  if (!formData.vitalSigns?.bloodPressure?.systolic) {
    errors['vitalSigns.bloodPressure.systolic'] = 'Enter systolic pressure (top number)';
  } else {
    const num = parseInt(formData.vitalSigns.bloodPressure.systolic);
    if (isNaN(num)) {
      errors['vitalSigns.bloodPressure.systolic'] = 'Enter numbers only (50-250)';
    } else if (num < 50 || num > 250) {
      errors['vitalSigns.bloodPressure.systolic'] = 'Systolic pressure must be between 50 and 250 mmHg';
    }
  }
  
  if (!formData.vitalSigns?.bloodPressure?.diastolic) {
    errors['vitalSigns.bloodPressure.diastolic'] = 'Enter diastolic pressure (bottom number)';
  } else {
    const num = parseInt(formData.vitalSigns.bloodPressure.diastolic);
    if (isNaN(num)) {
      errors['vitalSigns.bloodPressure.diastolic'] = 'Enter numbers only (30-150)';
    } else if (num < 30 || num > 150) {
      errors['vitalSigns.bloodPressure.diastolic'] = 'Diastolic pressure must be between 30 and 150 mmHg';
    }
  }
  
  // Cross-validation: systolic must be higher than diastolic
  if (formData.vitalSigns?.bloodPressure?.systolic && formData.vitalSigns?.bloodPressure?.diastolic) {
    const systolic = parseInt(formData.vitalSigns.bloodPressure.systolic);
    const diastolic = parseInt(formData.vitalSigns.bloodPressure.diastolic);
    if (!isNaN(systolic) && !isNaN(diastolic) && systolic <= diastolic) {
      errors['vitalSigns.bloodPressure.systolic'] = `Systolic (${systolic}) must be higher than diastolic (${diastolic})`;
      errors['vitalSigns.bloodPressure.diastolic'] = `Diastolic (${diastolic}) must be lower than systolic (${systolic})`;
    }
  }
  
  // Heart rate - Required
  if (!formData.vitalSigns?.heartRate) {
    errors['vitalSigns.heartRate'] = 'Enter heart rate';
  } else {
    const num = parseInt(formData.vitalSigns.heartRate);
    if (isNaN(num) || num < 40 || num > 200) {
      errors['vitalSigns.heartRate'] = 'Enter a value between 40 and 200';
    }
  }
  
  // Temperature - Required
  if (!formData.vitalSigns?.temperature) {
    errors['vitalSigns.temperature'] = 'Enter temperature';
  } else {
    const num = parseFloat(formData.vitalSigns.temperature);
    if (isNaN(num) || num < 25 || num > 45) {
      errors['vitalSigns.temperature'] = 'Enter a value between 25 and 45';
    }
  }
  
  // Weight - Required
  if (!formData.vitalSigns?.weight) {
    errors['vitalSigns.weight'] = 'Enter weight';
  } else {
    const num = parseFloat(formData.vitalSigns.weight);
    if (isNaN(num) || num < 20 || num > 300) {
      errors['vitalSigns.weight'] = 'Enter a value between 20 and 300';
    }
  }
  
  // Height - Required
  if (!formData.vitalSigns?.height) {
    errors['vitalSigns.height'] = 'Enter height';
  } else {
    const num = parseFloat(formData.vitalSigns.height);
    if (isNaN(num) || num < 50 || num > 250) {
      errors['vitalSigns.height'] = 'Enter a value between 50 and 250';
    }
  }
  
  // 3. Sleep & Exercise - Required fields
  // Sleep duration - Required
  if (!formData.sleep?.duration) {
    errors['sleep.duration'] = 'Enter sleep hours between 0 and 24';
  } else {
    const num = parseFloat(formData.sleep.duration);
    if (isNaN(num) || num < 0 || num > 24) {
      errors['sleep.duration'] = 'Enter sleep hours between 0 and 24';
    }
  }
  
  // Sleep quality - Required
  if (!formData.sleep?.quality) {
    errors['sleep.quality'] = 'Please rate your sleep quality';
  } else if (!['excellent', 'good', 'fair', 'poor'].includes(formData.sleep.quality)) {
    errors['sleep.quality'] = 'Please rate your sleep quality';
  }
  
  // Exercise type - Optional but validate if filled
  if (formData.exercise?.type && formData.exercise.type.length > 100) {
    errors['exercise.type'] = 'Exercise type must be under 100 characters';
  }
  
  // Exercise duration - Required
  if (!formData.exercise?.duration) {
    errors['exercise.duration'] = 'Exercise duration must be between 0 and 300 minutes';
  } else {
    const num = parseFloat(formData.exercise.duration);
    if (isNaN(num) || num < 0 || num > 300) {
      errors['exercise.duration'] = 'Exercise duration must be between 0 and 300 minutes';
    }
  }
  
  // Exercise intensity - Required
  if (!formData.exercise?.intensity) {
    errors['exercise.intensity'] = 'Please select exercise intensity';
  } else if (!['low', 'moderate', 'high'].includes(formData.exercise.intensity)) {
    errors['exercise.intensity'] = 'Please select exercise intensity';
  }
  
  // 4. Nutrition & Notes - Required fields
  // Water intake - Required
  if (!formData.nutrition?.waterIntake) {
    errors['nutrition.waterIntake'] = 'Water intake must be between 0 and 300 oz';
  } else {
    const num = parseFloat(formData.nutrition.waterIntake);
    if (isNaN(num) || num < 0 || num > 300) {
      errors['nutrition.waterIntake'] = 'Water intake must be between 0 and 300 oz';
    }
  }
  
  // Supplements - Optional but validate if filled
  if (formData.nutrition?.supplements && formData.nutrition.supplements.length > 200) {
    errors['nutrition.supplements'] = 'Supplements must be under 200 characters';
  }
  
  // Meals - Optional but validate if filled
  if (formData.nutrition?.meals && formData.nutrition.meals.length > 500) {
    errors['nutrition.meals'] = 'Meals description must be under 500 characters';
  }
  
  // Medications - Optional but validate if filled
  if (formData.medications && formData.medications.length > 300) {
    errors.medications = 'Medications must be under 300 characters';
  }
  
  // Tags - Optional but validate if filled
  if (formData.tags && Array.isArray(formData.tags)) {
    const tagsString = formData.tags.join(', ');
    if (tagsString.length > 200) {
      errors.tags = 'Tags must be under 200 characters total';
    }
    for (let i = 0; i < formData.tags.length; i++) {
      const tag = formData.tags[i].trim();
      if (tag.length > 50) {
        errors.tags = 'Each tag must be under 50 characters';
        break;
      }
    }
  }
  
  // Notes - Optional but validate if filled
  if (formData.notes && formData.notes.length > 1000) {
    errors.notes = 'Notes must be under 1000 characters';
  }
  
  return errors;
};

// Product validation functions
export const validateProduct = (formData) => {
  const errors = {};
  
  // Product name validation
  if (!formData.name || safeTrim(formData.name) === '') {
    errors.name = 'Product name is required';
  } else if (safeTrim(formData.name).length < 5) {
    errors.name = 'Product name must be at least 5 characters long';
  } else if (safeTrim(formData.name).length > 200) {
    errors.name = 'Product name must be no more than 200 characters';
  }
  
  // Brand validation
  if (!formData.brand || safeTrim(formData.brand) === '') {
    errors.brand = 'Brand is required';
  } else if (safeTrim(formData.brand).length < 2) {
    errors.brand = 'Brand must be at least 2 characters long';
  } else if (safeTrim(formData.brand).length > 100) {
    errors.brand = 'Brand must be no more than 100 characters';
  }
  
  // Category validation
  if (!formData.category || safeTrim(formData.category) === '') {
    errors.category = 'Category is required';
  }
  
  // Price validation
  if (!formData.price || safeTrim(formData.price) === '') {
    errors.price = 'Price is required';
  } else {
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      errors.price = 'Price must be a valid number greater than 0';
    } else if (price > 1000000) {
      errors.price = 'Price must be less than 1,000,000';
    }
  }
  
  // Description validation
  if (!formData.description || safeTrim(formData.description) === '') {
    errors.description = 'Description is required';
  } else if (safeTrim(formData.description).length < 20) {
    errors.description = 'Description must be at least 20 characters long';
  } else if (safeTrim(formData.description).length > 2000) {
    errors.description = 'Description must be no more than 2000 characters';
  }
  
  // Stock validation
  if (!formData.stock || safeTrim(formData.stock) === '') {
    errors.stock = 'Stock quantity is required';
  } else {
    const stock = parseInt(formData.stock);
    if (isNaN(stock) || stock < 0) {
      errors.stock = 'Stock quantity must be a valid number (0 or more)';
    } else if (stock > 100000) {
      errors.stock = 'Stock quantity must be less than 100,000';
    }
  }
  
  // Low stock threshold validation
  if (!formData.lowStockThreshold || safeTrim(formData.lowStockThreshold) === '') {
    errors.lowStockThreshold = 'Low stock threshold is required';
  } else {
    const threshold = parseInt(formData.lowStockThreshold);
    if (isNaN(threshold) || threshold < 0) {
      errors.lowStockThreshold = 'Low stock threshold must be a valid number (0 or more)';
    } else if (threshold > 10000) {
      errors.lowStockThreshold = 'Low stock threshold must be less than 10,000';
    }
  }
  
  return errors;
};
