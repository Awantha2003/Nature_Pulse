# Form Validation Components

This directory contains reusable validation components for consistent form validation across the application.

## Components

### ValidatedTextField
A wrapper around Material-UI's TextField component that provides consistent error display.

**Props:**
- `error` - Error message to display
- `helperText` - Helper text to show when there's no error
- `showErrorBelow` - Whether to show error message below the field (default: true)
- All other TextField props are passed through

**Usage:**
```jsx
import { ValidatedTextField } from '../components/Validation';

<ValidatedTextField
  required
  fullWidth
  id="email"
  label="Email Address"
  name="email"
  value={formData.email}
  onChange={handleChange}
  onBlur={handleBlur}
  error={fieldErrors.email}
  helperText="Enter a valid email address"
/>
```

### ValidatedSelect
A wrapper around Material-UI's FormControl/Select components that provides consistent error display.

**Props:**
- `error` - Error message to display
- `helperText` - Helper text to show when there's no error
- `showErrorBelow` - Whether to show error message below the field (default: true)
- All other FormControl/Select props are passed through

**Usage:**
```jsx
import { ValidatedSelect } from '../components/Validation';

<ValidatedSelect
  required
  id="gender"
  name="gender"
  label="Gender"
  value={formData.gender}
  onChange={handleChange}
  error={fieldErrors.gender}
  helperText="Select your gender"
>
  <MenuItem value="male">Male</MenuItem>
  <MenuItem value="female">Female</MenuItem>
  <MenuItem value="other">Other</MenuItem>
</ValidatedSelect>
```

## Validation Hook

### useFormValidation
A custom hook that provides form validation state management and handlers.

**Parameters:**
- `initialData` - Initial form data object
- `validationFunction` - Function that validates form data and returns errors object
- `options` - Configuration options:
  - `validateOnChange` - Validate on field change (default: true)
  - `validateOnBlur` - Validate on field blur (default: true)
  - `clearErrorsOnChange` - Clear field errors when user starts typing (default: true)

**Returns:**
- `formData` - Current form data
- `fieldErrors` - Object containing field-specific error messages
- `touched` - Object tracking which fields have been touched
- `isValid` - Boolean indicating if form is valid
- `handleChange` - Handler for field changes
- `handleBlur` - Handler for field blur events
- `resetForm` - Function to reset form to initial state
- `setFieldError` - Function to manually set field error
- `clearFieldError` - Function to clear specific field error
- `clearAllErrors` - Function to clear all errors
- `updateFormData` - Function to update form data
- `setFormData` - Function to set form data directly

**Usage:**
```jsx
import useFormValidation from '../hooks/useFormValidation';
import { validateRegisterForm } from '../utils/validation';

const MyForm = () => {
  const {
    formData,
    fieldErrors,
    isValid,
    handleChange,
    handleBlur,
    resetForm
  } = useFormValidation(
    { email: '', password: '' },
    validateRegisterForm
  );

  return (
    <form>
      <ValidatedTextField
        name="email"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={fieldErrors.email}
        helperText="Enter your email"
      />
    </form>
  );
};
```

## Validation Utilities

The validation utilities are located in `../utils/validation.js` and provide:

- Individual field validation functions
- Comprehensive form validation functions
- Validation constants and regex patterns
- Helper functions for form validation

## Error Display Style

All validation components display errors in a consistent style:
- Red error messages appear directly below the field
- Error messages are displayed in small, red text
- Helper text is shown when there are no errors
- Fields are highlighted in red when they contain errors

This matches the design shown in the registration form image with red validation messages below each required field.
