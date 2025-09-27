import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for form validation
 * @param {Object} initialData - Initial form data
 * @param {Function} validationFunction - Validation function to use
 * @param {Object} options - Additional options
 * @returns {Object} Validation state and handlers
 */
export const useFormValidation = (initialData, validationFunction, options = {}) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    clearErrorsOnChange = true
  } = options;

  const [formData, setFormData] = useState(initialData);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);

  // Validate form whenever formData changes
  useEffect(() => {
    if (validateOnChange) {
      const errors = validationFunction(formData);
      setFieldErrors(errors);
      setIsValid(Object.keys(errors).length === 0);
    }
  }, [formData, validationFunction, validateOnChange]);

  // Handle field changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Clear field error when user starts typing
    if (clearErrorsOnChange && fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Handle nested object fields (e.g., address.street)
    if (name.includes('.')) {
      const [parentKey, childKey] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parentKey]: {
          ...prev[parentKey],
          [childKey]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  }, [fieldErrors, clearErrorsOnChange]);

  // Handle field blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validateOnBlur) {
      const errors = validationFunction(formData);
      if (errors[name]) {
        setFieldErrors(prev => ({ ...prev, [name]: errors[name] }));
      }
    }
  }, [formData, validationFunction, validateOnBlur]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setFieldErrors({});
    setTouched({});
    setIsValid(false);
  }, [initialData]);

  // Set field error manually
  const setFieldError = useCallback((fieldName, errorMessage) => {
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: errorMessage
    }));
  }, []);

  // Clear field error manually
  const clearFieldError = useCallback((fieldName) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  // Update form data
  const updateFormData = useCallback((newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  }, []);

  return {
    formData,
    fieldErrors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    resetForm,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    updateFormData,
    setFormData
  };
};

export default useFormValidation;
