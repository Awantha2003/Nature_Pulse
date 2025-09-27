// Simple validation tests to verify functionality
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateName,
  validatePhone,
  validateDateOfBirth,
  validateGender,
  validateAddress,
  validateZipCode,
  validateLicenseNumber,
  validateSpecialization,
  validateExperience,
  validateConsultationFee,
  validateBio,
  validateQualification,
  validateLanguage,
  validateLoginForm,
  validateRegisterForm,
  validateDoctorRegisterForm,
  isFormValid
} from './validation';

// Test email validation
console.log('Testing email validation:');
console.log('Valid email:', validateEmail('test@example.com')); // Should be null
console.log('Invalid email:', validateEmail('invalid-email')); // Should return error message
console.log('Empty email:', validateEmail('')); // Should return error message

// Test password validation
console.log('\nTesting password validation:');
console.log('Valid password:', validatePassword('password123')); // Should be null
console.log('Short password:', validatePassword('123')); // Should return error message
console.log('Empty password:', validatePassword('')); // Should return error message

// Test password match validation
console.log('\nTesting password match validation:');
console.log('Matching passwords:', validatePasswordMatch('password123', 'password123')); // Should be null
console.log('Non-matching passwords:', validatePasswordMatch('password123', 'password456')); // Should return error message

// Test name validation
console.log('\nTesting name validation:');
console.log('Valid name:', validateName('John Doe', 'First name')); // Should be null
console.log('Short name:', validateName('J', 'First name')); // Should return error message
console.log('Invalid characters:', validateName('John123', 'First name')); // Should return error message

// Test phone validation
console.log('\nTesting phone validation:');
console.log('Valid Sri Lankan phone:', validatePhone('0704949394')); // Should be null
console.log('Valid Sri Lankan phone:', validatePhone('0771234567')); // Should be null
console.log('Short phone:', validatePhone('123')); // Should return error message
console.log('Invalid phone:', validatePhone('abc123')); // Should return error message
console.log('Wrong format:', validatePhone('+94701234567')); // Should return error message

// Test date of birth validation
console.log('\nTesting date of birth validation:');
console.log('Valid DOB:', validateDateOfBirth('1990-01-01')); // Should be null
console.log('Too young:', validateDateOfBirth('2020-01-01')); // Should return error message
console.log('Future date:', validateDateOfBirth('2030-01-01')); // Should return error message

// Test form validation
console.log('\nTesting login form validation:');
const loginData = {
  email: 'test@example.com',
  password: 'password123'
};
const loginErrors = validateLoginForm(loginData);
console.log('Valid login form:', isFormValid(loginErrors)); // Should be true

const invalidLoginData = {
  email: 'invalid-email',
  password: '123'
};
const invalidLoginErrors = validateLoginForm(invalidLoginData);
console.log('Invalid login form:', isFormValid(invalidLoginErrors)); // Should be false
console.log('Login errors:', invalidLoginErrors);

// Test register form validation
console.log('\nTesting register form validation:');
const registerData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'password123',
  confirmPassword: 'password123',
  phone: '+1234567890',
  dateOfBirth: '1990-01-01',
  gender: 'male',
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    country: 'USA'
  }
};
const registerErrors = validateRegisterForm(registerData);
console.log('Valid register form:', isFormValid(registerErrors)); // Should be true

console.log('\nAll validation tests completed!');
