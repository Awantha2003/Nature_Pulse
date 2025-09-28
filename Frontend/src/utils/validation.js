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

// Health log validation
export const validateHealthLog = (formData) => {
  const errors = {};
  
  // Basic Information - Required fields
  if (!formData.date) {
    errors.date = 'Date is required';
  }
  
  if (!formData.mood) {
    errors.mood = 'Mood is required';
  }
  
  if (!formData.energyLevel) {
    errors.energyLevel = 'Energy level is required';
  }
  
  // Validate vital signs - Required fields
  if (formData.vitalSigns) {
    if (!formData.vitalSigns.bloodPressure || !formData.vitalSigns.bloodPressure.systolic || !formData.vitalSigns.bloodPressure.diastolic) {
      errors['vitalSigns.bloodPressure'] = 'Blood pressure is required';
    } else {
      const systolic = parseInt(formData.vitalSigns.bloodPressure.systolic);
      const diastolic = parseInt(formData.vitalSigns.bloodPressure.diastolic);
      
      if (isNaN(systolic) || systolic < 70 || systolic > 250) {
        errors['vitalSigns.bloodPressure.systolic'] = 'Systolic pressure must be between 70-250 mmHg';
      }
      
      if (isNaN(diastolic) || diastolic < 40 || diastolic > 150) {
        errors['vitalSigns.bloodPressure.diastolic'] = 'Diastolic pressure must be between 40-150 mmHg';
      }
      
      if (systolic <= diastolic) {
        errors['vitalSigns.bloodPressure'] = 'Systolic pressure must be higher than diastolic pressure';
      }
    }
    
    if (formData.vitalSigns.heartRate) {
      const heartRate = parseInt(formData.vitalSigns.heartRate);
      if (isNaN(heartRate) || heartRate < 30 || heartRate > 220) {
        errors['vitalSigns.heartRate'] = 'Heart rate must be between 30-220 bpm';
      }
    }
    
    if (formData.vitalSigns.temperature) {
      const temperature = parseFloat(formData.vitalSigns.temperature);
      if (isNaN(temperature) || temperature < 20 || temperature > 45) {
        errors['vitalSigns.temperature'] = 'Temperature must be between 20-45°C (68-113°F)';
      }
    }
    
    if (formData.vitalSigns.weight) {
      const weight = parseFloat(formData.vitalSigns.weight);
      if (isNaN(weight) || weight < 20 || weight > 500) {
        errors['vitalSigns.weight'] = 'Weight must be between 20-500 kg';
      }
    }
    
    if (formData.vitalSigns.height) {
      const height = parseFloat(formData.vitalSigns.height);
      if (isNaN(height) || height < 50 || height > 250) {
        errors['vitalSigns.height'] = 'Height must be between 50-250 cm';
      }
    }
    
    if (formData.vitalSigns.bloodSugar) {
      const bloodSugar = parseFloat(formData.vitalSigns.bloodSugar);
      if (isNaN(bloodSugar) || bloodSugar < 0 || bloodSugar > 600) {
        errors['vitalSigns.bloodSugar'] = 'Blood sugar must be between 0-600 mg/dL';
      }
    }
  }
  
  // Validate sleep - Required fields
  if (!formData.sleep || !formData.sleep.duration) {
    errors['sleep.duration'] = 'Sleep duration is required';
  } else {
    const duration = parseFloat(formData.sleep.duration);
    if (isNaN(duration) || duration < 0 || duration > 24) {
      errors['sleep.duration'] = 'Sleep duration must be between 0-24 hours';
    }
  }
  
  if (!formData.sleep || !formData.sleep.quality) {
    errors['sleep.quality'] = 'Sleep quality is required';
  }
  
  // Validate exercise - Required fields
  if (!formData.exercise || !formData.exercise.type) {
    errors['exercise.type'] = 'Exercise type is required';
  }
  
  if (!formData.exercise || !formData.exercise.duration) {
    errors['exercise.duration'] = 'Exercise duration is required';
  } else {
    const duration = parseFloat(formData.exercise.duration);
    if (isNaN(duration) || duration < 0 || duration > 12) {
      errors['exercise.duration'] = 'Exercise duration must be between 0-12 hours';
    }
  }
  
  if (!formData.exercise || !formData.exercise.intensity) {
    errors['exercise.intensity'] = 'Exercise intensity is required';
  }
  
  // Validate nutrition - Required fields
  if (!formData.nutrition || !formData.nutrition.waterIntake) {
    errors['nutrition.waterIntake'] = 'Water intake is required';
  } else {
    const waterIntake = parseFloat(formData.nutrition.waterIntake);
    if (isNaN(waterIntake) || waterIntake < 0 || waterIntake > 20) {
      errors['nutrition.waterIntake'] = 'Water intake must be between 0-20 liters';
    }
  }
  
  if (!formData.nutrition || !formData.nutrition.supplements) {
    errors['nutrition.supplements'] = 'Supplements information is required';
  }
  
  if (!formData.nutrition || !formData.nutrition.meals) {
    errors['nutrition.meals'] = 'Meals description is required';
  }
  
  if (!formData.medications) {
    errors.medications = 'Medications information is required';
  }
  
  if (!formData.tags || formData.tags.length === 0) {
    errors.tags = 'At least one tag is required';
  }
  
  if (!formData.notes) {
    errors.notes = 'Notes are required';
  }
  
  // Validate meals description
  if (formData.nutrition && formData.nutrition.meals) {
    const meals = safeTrim(formData.nutrition.meals);
    if (meals.length > 500) {
      errors['nutrition.meals'] = 'Meals description must be no more than 500 characters';
    }
  }
  
  // Validate supplements
  if (formData.nutrition && formData.nutrition.supplements) {
    const supplements = safeTrim(formData.nutrition.supplements);
    if (supplements.length > 200) {
      errors['nutrition.supplements'] = 'Supplements must be no more than 200 characters';
    }
  }
  
  // Validate exercise type
  if (formData.exercise && formData.exercise.type) {
    const exerciseType = safeTrim(formData.exercise.type);
    if (exerciseType.length > 100) {
      errors['exercise.type'] = 'Exercise type must be no more than 100 characters';
    }
  }
  
  // Validate medications
  if (formData.medications) {
    const medications = safeTrim(formData.medications);
    if (medications.length > 300) {
      errors.medications = 'Medications must be no more than 300 characters';
    }
  }
  
  // Validate notes
  if (formData.notes) {
    const notes = safeTrim(formData.notes);
    if (notes.length > 1000) {
      errors.notes = 'Notes must be no more than 1000 characters';
    }
  }
  
  // Validate tags
  if (formData.tags && Array.isArray(formData.tags)) {
    const tagsString = formData.tags.join(', ');
    if (tagsString.length > 200) {
      errors.tags = 'Tags must be no more than 200 characters total';
    }
    
    // Check individual tag length
    for (let i = 0; i < formData.tags.length; i++) {
      const tag = safeTrim(formData.tags[i]);
      if (tag.length > 50) {
        errors.tags = 'Each tag must be no more than 50 characters';
        break;
      }
    }
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
