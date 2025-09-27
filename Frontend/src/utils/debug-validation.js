// Debug utility to test validation
import { validateDoctorRegisterForm } from './validation';

export const testDoctorValidation = (formData) => {
  console.log('Testing doctor validation with data:', formData);
  
  const errors = validateDoctorRegisterForm(formData, formData.qualifications || []);
  console.log('Validation errors:', errors);
  
  const errorCount = Object.keys(errors).length;
  console.log('Number of errors:', errorCount);
  
  if (errorCount > 0) {
    console.log('Error details:');
    Object.entries(errors).forEach(([field, error]) => {
      console.log(`- ${field}: ${error}`);
    });
  }
  
  return errors;
};

export const testRegisterValidation = (formData) => {
  console.log('Testing register validation with data:', formData);
  
  const errors = validateRegisterForm(formData);
  console.log('Validation errors:', errors);
  
  const errorCount = Object.keys(errors).length;
  console.log('Number of errors:', errorCount);
  
  if (errorCount > 0) {
    console.log('Error details:');
    Object.entries(errors).forEach(([field, error]) => {
      console.log(`- ${field}: ${error}`);
    });
  }
  
  return errors;
};
