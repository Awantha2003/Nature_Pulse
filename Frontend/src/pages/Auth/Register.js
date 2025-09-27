import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validateRegisterForm, isFormValid } from '../../utils/validation';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field on blur
    const errors = validateRegisterForm(formData);
    if (errors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: errors[name] }));
    }
  };

  // Real-time validation
  useEffect(() => {
    const errors = validateRegisterForm(formData);
    setFieldErrors(errors);
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    // Validate form before submission
    const errors = validateRegisterForm(formData);
    if (!isFormValid(errors)) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData);
      
      if (result.success) {
        navigate('/app/patient/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        // Handle validation errors from backend
        const errors = err.response.data.errors;
        const errorMessages = errors.map(error => error.msg).join(', ');
        setError(`Validation failed: ${errorMessages}`);
        
        // Set field-specific errors
        const fieldErrorMap = {};
        errors.forEach(error => {
          fieldErrorMap[error.path] = error.msg;
        });
        setFieldErrors(fieldErrorMap);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography component="h1" variant="h4" gutterBottom>
              Register as Patient
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create your account to get started
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={!!fieldErrors.firstName}
                  helperText={fieldErrors.firstName || 'Enter your first name (2-50 characters)'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={!!fieldErrors.lastName}
                  helperText={fieldErrors.lastName || 'Enter your last name (2-50 characters)'}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={!!fieldErrors.email}
                  helperText={fieldErrors.email || 'Enter a valid email address'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={!!fieldErrors.password}
                  helperText={fieldErrors.password || 'Password must be at least 6 characters long'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={!!fieldErrors.confirmPassword}
                  helperText={fieldErrors.confirmPassword || 'Re-enter your password to confirm'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  id="phone"
                  label="Phone Number"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={!!fieldErrors.phone}
                  helperText={fieldErrors.phone || 'Enter a valid phone number (10-15 digits)'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  id="dateOfBirth"
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={!!fieldErrors.dateOfBirth}
                  helperText={fieldErrors.dateOfBirth || 'Enter your date of birth (age must be 13-120 years)'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required error={!!fieldErrors.gender}>
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select
                    labelId="gender-label"
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    label="Gender"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                  {fieldErrors.gender && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                      {fieldErrors.gender}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  id="address.street"
                  label="Street Address"
                  name="address.street"
                  autoComplete="street-address"
                  value={formData.address.street}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={!!fieldErrors['address.street']}
                  helperText={fieldErrors['address.street'] || 'Enter your street address'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  id="address.city"
                  label="City"
                  name="address.city"
                  autoComplete="address-level2"
                  value={formData.address.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={!!fieldErrors['address.city']}
                  helperText={fieldErrors['address.city'] || 'Enter your city'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  id="address.state"
                  label="State"
                  name="address.state"
                  autoComplete="address-level1"
                  value={formData.address.state}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={!!fieldErrors['address.state']}
                  helperText={fieldErrors['address.state'] || 'Enter your state'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  id="address.zipCode"
                  label="ZIP Code"
                  name="address.zipCode"
                  autoComplete="postal-code"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={!!fieldErrors['address.zipCode']}
                  helperText={fieldErrors['address.zipCode'] || 'Enter your ZIP code (12345 or 12345-6789)'}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  id="address.country"
                  label="Country"
                  name="address.country"
                  autoComplete="country"
                  value={formData.address.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={!!fieldErrors['address.country']}
                  helperText={fieldErrors['address.country'] || 'Enter your country'}
                />
              </Grid>
            </Grid>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !isFormValid(fieldErrors)}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
