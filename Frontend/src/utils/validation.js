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

// Validation functions
export const validateEmail = (email) => {
  if (!email || safeTrim(email) === '') {
    return 'Email is required';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }
  if (email.length > 254) {
    return 'Email address is too long';
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password || password.trim() === '') {
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

export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};

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

export const validatePhone = (phone) => {
  if (!phone || safeTrim(phone) === '') {
    return 'Phone number is required';
  }
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/[^\d]/g, '');
  
  // Check if it's exactly 10 digits
  if (cleanPhone.length !== 10) {
    return 'Phone number must be exactly 10 digits (e.g., 0704949394)';
  }
  
  // Check if it starts with 0 and follows Sri Lankan mobile format
  if (!PHONE_REGEX.test(cleanPhone)) {
    return 'Please enter a valid Sri Lankan mobile number (e.g., 0704949394)';
  }
  
  return null;
};

export const validateDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) {
    return 'Date of birth is required';
  }
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
    ? age - 1 
    : age;
  
  if (actualAge < MIN_AGE) {
    return `You must be at least ${MIN_AGE} years old to register`;
  }
  if (actualAge > MAX_AGE) {
    return `Age must be no more than ${MAX_AGE} years`;
  }
  if (birthDate > today) {
    return 'Date of birth cannot be in the future';
  }
  return null;
};

export const validateGender = (gender) => {
  if (!gender || gender.trim() === '') {
    return 'Gender is required';
  }
  const validGenders = ['male', 'female', 'other'];
  if (!validGenders.includes(gender)) {
    return 'Please select a valid gender';
  }
  return null;
};

export const validateAddress = (address, fieldName) => {
  if (!address || address.trim() === '') {
    return `${fieldName} is required`;
  }
  if (address.trim().length < ADDRESS_MIN_LENGTH) {
    return `${fieldName} must be at least ${ADDRESS_MIN_LENGTH} characters long`;
  }
  if (address.trim().length > ADDRESS_MAX_LENGTH) {
    return `${fieldName} must be no more than ${ADDRESS_MAX_LENGTH} characters long`;
  }
  return null;
};

export const validateZipCode = (zipCode) => {
  if (!zipCode || zipCode.trim() === '') {
    return 'ZIP code is required';
  }
  const cleanZip = zipCode.replace(/\s/g, '');
  if (!/^\d{5}(-\d{4})?$/.test(cleanZip)) {
    return 'Please enter a valid ZIP code (12345 or 12345-6789)';
  }
  return null;
};

export const validateLicenseNumber = (licenseNumber) => {
  if (!licenseNumber || licenseNumber.trim() === '') {
    return 'Medical license number is required';
  }
  if (licenseNumber.trim().length < LICENSE_MIN_LENGTH) {
    return `License number must be at least ${LICENSE_MIN_LENGTH} characters long`;
  }
  if (licenseNumber.trim().length > LICENSE_MAX_LENGTH) {
    return `License number must be no more than ${LICENSE_MAX_LENGTH} characters long`;
  }
  return null;
};

export const validateSpecialization = (specialization) => {
  if (!specialization || specialization.trim() === '') {
    return 'Specialization is required';
  }
  if (specialization.trim().length < SPECIALIZATION_MIN_LENGTH) {
    return `Specialization must be at least ${SPECIALIZATION_MIN_LENGTH} characters long`;
  }
  if (specialization.trim().length > SPECIALIZATION_MAX_LENGTH) {
    return `Specialization must be no more than ${SPECIALIZATION_MAX_LENGTH} characters long`;
  }
  return null;
};

export const validateExperience = (experience) => {
  if (experience === '' || experience === null || experience === undefined) {
    return 'Years of experience is required';
  }
  const exp = parseInt(experience);
  if (isNaN(exp)) {
    return 'Please enter a valid number for years of experience';
  }
  if (exp < MIN_EXPERIENCE) {
    return `Experience must be at least ${MIN_EXPERIENCE} years`;
  }
  if (exp > MAX_EXPERIENCE) {
    return `Experience must be no more than ${MAX_EXPERIENCE} years`;
  }
  return null;
};

export const validateConsultationFee = (fee) => {
  if (fee === '' || fee === null || fee === undefined) {
    return 'Consultation fee is required';
  }
  const feeNum = parseFloat(fee);
  if (isNaN(feeNum)) {
    return 'Please enter a valid consultation fee';
  }
  if (feeNum < MIN_FEE) {
    return `Consultation fee must be at least LKR ${MIN_FEE}`;
  }
  if (feeNum > MAX_FEE) {
    return `Consultation fee must be no more than LKR ${MAX_FEE}`;
  }
  return null;
};

export const validateBio = (bio) => {
  if (!bio || bio.trim() === '') {
    return 'Bio is required';
  }
  if (bio.trim().length < BIO_MIN_LENGTH) {
    return `Bio must be at least ${BIO_MIN_LENGTH} characters long`;
  }
  if (bio.length > BIO_MAX_LENGTH) {
    return `Bio must be no more than ${BIO_MAX_LENGTH} characters long`;
  }
  return null;
};

export const validateQualification = (qualification) => {
  const errors = {};
  
  if (!qualification.degree || qualification.degree.trim() === '') {
    errors.degree = 'Degree is required';
  } else if (qualification.degree.trim().length < 2) {
    errors.degree = 'Degree must be at least 2 characters long';
  } else if (qualification.degree.trim().length > 100) {
    errors.degree = 'Degree must be no more than 100 characters long';
  }
  
  if (!qualification.institution || qualification.institution.trim() === '') {
    errors.institution = 'Institution is required';
  } else if (qualification.institution.trim().length < 2) {
    errors.institution = 'Institution must be at least 2 characters long';
  } else if (qualification.institution.trim().length > 200) {
    errors.institution = 'Institution must be no more than 200 characters long';
  }
  
  if (!qualification.year || qualification.year.trim() === '') {
    errors.year = 'Year is required';
  } else {
    const year = parseInt(qualification.year);
    const currentYear = new Date().getFullYear();
    if (isNaN(year)) {
      errors.year = 'Please enter a valid year';
    } else if (year < 1900) {
      errors.year = 'Year must be 1900 or later';
    } else if (year > currentYear) {
      errors.year = 'Year cannot be in the future';
    }
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

export const validateLanguage = (language) => {
  if (!language || language.trim() === '') {
    return 'Language cannot be empty';
  }
  if (language.trim().length < 2) {
    return 'Language must be at least 2 characters long';
  }
  if (language.trim().length > 50) {
    return 'Language must be no more than 50 characters long';
  }
  if (!/^[a-zA-Z\s\-']+$/.test(language.trim())) {
    return 'Language can only contain letters, spaces, hyphens, and apostrophes';
  }
  return null;
};

// Comprehensive validation functions for forms
export const validateLoginForm = (formData) => {
  const errors = {};
  
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;
  
  return errors;
};

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
  
  // Address information
  if (formData.address) {
    const streetError = validateAddress(formData.address.street, 'Street address');
    if (streetError) errors['address.street'] = streetError;
    
    const cityError = validateAddress(formData.address.city, 'City');
    if (cityError) errors['address.city'] = cityError;
    
    const stateError = validateAddress(formData.address.state, 'State');
    if (stateError) errors['address.state'] = stateError;
    
    const zipCodeError = validateZipCode(formData.address.zipCode);
    if (zipCodeError) errors['address.zipCode'] = zipCodeError;
    
    const countryError = validateAddress(formData.address.country, 'Country');
    if (countryError) errors['address.country'] = countryError;
  }
  
  return errors;
};

export const validateDoctorRegisterForm = (formData, qualifications = []) => {
  const errors = validateRegisterForm(formData);
  
  // Professional information
  const licenseError = validateLicenseNumber(formData.licenseNumber);
  if (licenseError) errors.licenseNumber = licenseError;
  
  const specializationError = validateSpecialization(formData.specialization);
  if (specializationError) errors.specialization = specializationError;
  
  const experienceError = validateExperience(formData.experience);
  if (experienceError) errors.experience = experienceError;
  
  const consultationFeeError = validateConsultationFee(formData.consultationFee);
  if (consultationFeeError) errors.consultationFee = consultationFeeError;
  
  const bioError = validateBio(formData.bio);
  if (bioError) errors.bio = bioError;
  
  // Validate qualifications
  if (qualifications && qualifications.length > 0) {
    const validQualifications = qualifications.filter(q => q.degree && q.institution && q.year);
    if (validQualifications.length === 0) {
      errors.qualifications = 'At least one complete qualification is required';
    } else {
      qualifications.forEach((qual, index) => {
        const qualErrors = validateQualification(qual);
        if (qualErrors) {
          Object.keys(qualErrors).forEach(field => {
            errors[`qualification_${index}_${field}`] = qualErrors[field];
          });
        }
      });
    }
  }
  
  // Validate languages
  if (formData.languages && formData.languages.length > 0) {
    formData.languages.forEach((language, index) => {
      const languageError = validateLanguage(language);
      if (languageError) {
        errors[`language_${index}`] = languageError;
      }
    });
  }
  
  return errors;
};

// Helper function to check if form is valid
export const isFormValid = (errors) => {
  return Object.keys(errors).length === 0;
};

// Helper function to get first error message
export const getFirstError = (errors) => {
  const firstKey = Object.keys(errors)[0];
  return firstKey ? errors[firstKey] : null;
};

// Appointment booking validation functions
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
    errors.reason = 'Please provide a reason for the appointment';
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

// Profile management validation functions
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

// Health goals validation functions
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
    
    if (!formData.targetMetric.targetValue || formData.targetMetric.targetValue === '') {
      errors['targetMetric.targetValue'] = 'Target value is required';
    } else {
      const targetValue = parseFloat(formData.targetMetric.targetValue);
      if (isNaN(targetValue) || targetValue <= 0) {
        errors['targetMetric.targetValue'] = 'Target value must be a positive number';
      }
    }
  }
  
  if (formData.timeframe) {
    if (!formData.timeframe.startDate) {
      errors['timeframe.startDate'] = 'Start date is required';
    }
    
    if (!formData.timeframe.endDate) {
      errors['timeframe.endDate'] = 'End date is required';
    } else if (formData.timeframe.startDate && formData.timeframe.endDate) {
      const startDate = new Date(formData.timeframe.startDate);
      const endDate = new Date(formData.timeframe.endDate);
      if (endDate <= startDate) {
        errors['timeframe.endDate'] = 'End date must be after start date';
      }
    }
  }
  
  return errors;
};

// Health log validation functions
export const validateHealthLog = (formData) => {
  const errors = {};
  console.log('Validating health log with data:', formData);
  
  if (!formData.date) {
    errors.date = 'Date is required';
  }
  
  // Validate vital signs
  if (formData.vitalSigns) {
    if (formData.vitalSigns.bloodPressure) {
      if (formData.vitalSigns.bloodPressure.systolic) {
        const systolic = parseInt(formData.vitalSigns.bloodPressure.systolic);
        console.log('Validating systolic:', formData.vitalSigns.bloodPressure.systolic, 'Parsed:', systolic);
        if (isNaN(systolic) || systolic < 50 || systolic > 250) {
          errors['vitalSigns.bloodPressure.systolic'] = 'Systolic pressure must be between 50-250 mmHg';
        }
      }
      
      if (formData.vitalSigns.bloodPressure.diastolic) {
        const diastolic = parseInt(formData.vitalSigns.bloodPressure.diastolic);
        console.log('Validating diastolic:', formData.vitalSigns.bloodPressure.diastolic, 'Parsed:', diastolic);
        if (isNaN(diastolic) || diastolic < 30 || diastolic > 150) {
          errors['vitalSigns.bloodPressure.diastolic'] = 'Diastolic pressure must be between 30-150 mmHg';
        }
      }
      
      // Validate blood pressure relationship
      if (formData.vitalSigns.bloodPressure.systolic && formData.vitalSigns.bloodPressure.diastolic) {
        const systolic = parseInt(formData.vitalSigns.bloodPressure.systolic);
        const diastolic = parseInt(formData.vitalSigns.bloodPressure.diastolic);
        console.log('Validating BP relationship:', systolic, 'vs', diastolic);
        if (!isNaN(systolic) && !isNaN(diastolic) && systolic <= diastolic) {
          errors['vitalSigns.bloodPressure.systolic'] = 'Systolic pressure must be higher than diastolic pressure';
        }
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
  
  // Validate sleep duration
  if (formData.sleep && formData.sleep.duration) {
    const duration = parseFloat(formData.sleep.duration);
    if (isNaN(duration) || duration < 0 || duration > 24) {
      errors['sleep.duration'] = 'Sleep duration must be between 0-24 hours';
    }
  }
  
  // Validate exercise duration
  if (formData.exercise && formData.exercise.duration) {
    const duration = parseFloat(formData.exercise.duration);
    if (isNaN(duration) || duration < 0 || duration > 12) {
      errors['exercise.duration'] = 'Exercise duration must be between 0-12 hours';
    }
  }
  
  // Validate water intake
  if (formData.nutrition && formData.nutrition.waterIntake) {
    const waterIntake = parseFloat(formData.nutrition.waterIntake);
    if (isNaN(waterIntake) || waterIntake < 0 || waterIntake > 20) {
      errors['nutrition.waterIntake'] = 'Water intake must be between 0-20 liters';
    }
  }
  
  // Validate meals description
  if (formData.nutrition && formData.nutrition.meals) {
    const meals = safeTrim(formData.nutrition.meals);
    console.log('Validating meals:', meals, 'Length:', meals.length);
    if (meals.length > 500) {
      errors['nutrition.meals'] = 'Meals description must be no more than 500 characters';
    }
  }
  
  // Validate supplements
  if (formData.nutrition && formData.nutrition.supplements) {
    const supplements = safeTrim(formData.nutrition.supplements);
    console.log('Validating supplements:', supplements, 'Length:', supplements.length);
    if (supplements.length > 200) {
      errors['nutrition.supplements'] = 'Supplements must be no more than 200 characters';
    }
  }
  
  // Validate exercise type
  if (formData.exercise && formData.exercise.type) {
    const exerciseType = safeTrim(formData.exercise.type);
    console.log('Validating exercise type:', exerciseType, 'Length:', exerciseType.length);
    if (exerciseType.length > 100) {
      errors['exercise.type'] = 'Exercise type must be no more than 100 characters';
    }
  }
  
  // Validate medications
  if (formData.medications) {
    const medications = safeTrim(formData.medications);
    console.log('Validating medications:', medications, 'Length:', medications.length);
    if (medications.length > 300) {
      errors.medications = 'Medications must be no more than 300 characters';
    }
  }
  
  // Validate notes
  if (formData.notes) {
    const notes = safeTrim(formData.notes);
    console.log('Validating notes:', notes, 'Length:', notes.length);
    if (notes.length > 1000) {
      errors.notes = 'Notes must be no more than 1000 characters';
    }
  }
  
  // Validate tags
  if (formData.tags && Array.isArray(formData.tags)) {
    const tagsString = formData.tags.join(', ');
    console.log('Validating tags:', formData.tags, 'String:', tagsString, 'Length:', tagsString.length);
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