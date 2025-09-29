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
  Card,
  CardContent,
  Fade,
  Slide,
  Avatar,
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email,
  Phone,
  LocationOn,
  Security,
  Visibility,
  VisibilityOff,
  CheckCircle,
  ArrowForward,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validateRegisterForm, isFormValid } from '../../utils/validation';
import { ValidatedTextField, ValidatedSelect } from '../../components/Validation';

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
      country: 'Sri Lanka',
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Helper function to get field validation status
  const getFieldStatus = (fieldName) => {
    const hasValue = formData[fieldName] && formData[fieldName].toString().trim() !== '';
    const hasError = fieldErrors[fieldName];
    const isValid = hasValue && !hasError;
    
    return {
      hasValue,
      hasError,
      isValid,
      showSuccess: isValid && hasValue
    };
  };

  // Helper function to get address field validation status
  const getAddressFieldStatus = (fieldName) => {
    const addressField = fieldName.split('.')[1];
    const hasValue = formData.address[addressField] && formData.address[addressField].toString().trim() !== '';
    const hasError = fieldErrors[fieldName];
    const isValid = hasValue && !hasError;
    
    return {
      hasValue,
      hasError,
      isValid,
      showSuccess: isValid && hasValue
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
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

    // Live validation - validate field immediately as user types
    setTimeout(() => {
      const errors = validateRegisterForm({
        ...formData,
        [name]: value,
        ...(name.startsWith('address.') ? {
          address: {
            ...formData.address,
            [name.split('.')[1]]: value,
          }
        } : {})
      });
      
      if (errors[name]) {
        setFieldErrors(prev => ({ ...prev, [name]: errors[name] }));
      } else {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }, 300); // Small delay to avoid excessive validation
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
      console.log('Error response:', err.response);
      
      if (err.response?.data?.errors) {
        // Handle validation errors from backend
        const errors = err.response.data.errors;
        console.log('Validation errors received:', errors);
        
        // Set field-specific errors
        const fieldErrorMap = {};
        errors.forEach(error => {
          fieldErrorMap[error.path] = error.msg;
        });
        setFieldErrors(fieldErrorMap);
        
        // Show first error as main error message
        if (errors.length > 0) {
          setError(errors[0].msg);
        } else {
          setError('Please check the form for errors');
        }
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Registration failed. Please check all fields and try again.');
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
        <Fade in timeout={800}>
          <Paper elevation={6} sx={{ 
            padding: 4, 
            width: '100%', 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            border: '1px solid rgba(46, 125, 50, 0.1)',
          }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto', 
                mb: 2, 
                bgcolor: 'primary.main',
                boxShadow: 3,
              }}>
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography component="h1" variant="h4" gutterBottom sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Join as Patient
            </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Create your account to access healthcare services
            </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="Book Appointments" size="small" color="primary" variant="outlined" />
                <Chip label="Health Tracking" size="small" color="primary" variant="outlined" />
                <Chip label="Community Support" size="small" color="primary" variant="outlined" />
              </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Slide direction="up" in timeout={600}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 3,
                  color: 'primary.main',
                  fontWeight: 'bold'
                }}>
                  <PersonIcon />
                  Personal Information
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                <ValidatedTextField
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
                  error={fieldErrors.firstName}
                      helperText={fieldErrors.firstName || "Enter your first name"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: getFieldStatus('firstName').showSuccess ? (
                          <InputAdornment position="end">
                            <SuccessIcon color="success" fontSize="small" />
                          </InputAdornment>
                        ) : getFieldStatus('firstName').hasError ? (
                          <InputAdornment position="end">
                            <ErrorIcon color="error" fontSize="small" />
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: getFieldStatus('firstName').hasError ? 'error.main' : 
                                        getFieldStatus('firstName').showSuccess ? 'success.main' : 'primary.main',
                          },
                        },
                      }}
                />
              </Grid>
                  <Grid item xs={12} sm={6}>
                <ValidatedTextField
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
                  error={fieldErrors.lastName}
                      helperText={fieldErrors.lastName || "Enter your last name"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: getFieldStatus('lastName').showSuccess ? (
                          <InputAdornment position="end">
                            <SuccessIcon color="success" fontSize="small" />
                          </InputAdornment>
                        ) : getFieldStatus('lastName').hasError ? (
                          <InputAdornment position="end">
                            <ErrorIcon color="error" fontSize="small" />
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: getFieldStatus('lastName').hasError ? 'error.main' : 
                                        getFieldStatus('lastName').showSuccess ? 'success.main' : 'primary.main',
                          },
                        },
                      }}
                />
              </Grid>
                  <Grid item xs={12}>
                <ValidatedTextField
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
                  error={fieldErrors.email}
                      helperText={fieldErrors.email || "Enter a valid email address"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: getFieldStatus('email').showSuccess ? (
                          <InputAdornment position="end">
                            <SuccessIcon color="success" fontSize="small" />
                          </InputAdornment>
                        ) : getFieldStatus('email').hasError ? (
                          <InputAdornment position="end">
                            <ErrorIcon color="error" fontSize="small" />
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: getFieldStatus('email').hasError ? 'error.main' : 
                                        getFieldStatus('email').showSuccess ? 'success.main' : 'primary.main',
                          },
                        },
                      }}
                />
              </Grid>
                  <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                      type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={fieldErrors.password}
                      helperText={fieldErrors.password || "Password must be at least 6 characters"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Security color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            {getFieldStatus('password').showSuccess ? (
                              <SuccessIcon color="success" fontSize="small" />
                            ) : getFieldStatus('password').hasError ? (
                              <ErrorIcon color="error" fontSize="small" />
                            ) : (
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            )}
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: getFieldStatus('password').hasError ? 'error.main' : 
                                        getFieldStatus('password').showSuccess ? 'success.main' : 'primary.main',
                          },
                        },
                      }}
                />
              </Grid>
                  <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={fieldErrors.confirmPassword}
                      helperText={fieldErrors.confirmPassword || "Re-enter your password"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Security color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            {getFieldStatus('confirmPassword').showSuccess ? (
                              <SuccessIcon color="success" fontSize="small" />
                            ) : getFieldStatus('confirmPassword').hasError ? (
                              <ErrorIcon color="error" fontSize="small" />
                            ) : (
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                edge="end"
                              >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            )}
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: getFieldStatus('confirmPassword').hasError ? 'error.main' : 
                                        getFieldStatus('confirmPassword').showSuccess ? 'success.main' : 'primary.main',
                          },
                        },
                      }}
                />
              </Grid>
                  <Grid item xs={12} sm={6}>
                <ValidatedTextField
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
                  error={fieldErrors.phone}
                      helperText={fieldErrors.phone || "Sri Lankan mobile number (e.g., 0704949394)"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: getFieldStatus('phone').showSuccess ? (
                          <InputAdornment position="end">
                            <SuccessIcon color="success" fontSize="small" />
                          </InputAdornment>
                        ) : getFieldStatus('phone').hasError ? (
                          <InputAdornment position="end">
                            <ErrorIcon color="error" fontSize="small" />
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: getFieldStatus('phone').hasError ? 'error.main' : 
                                        getFieldStatus('phone').showSuccess ? 'success.main' : 'primary.main',
                          },
                        },
                      }}
                />
              </Grid>
                  <Grid item xs={12} sm={6}>
                <ValidatedTextField
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
                  error={fieldErrors.dateOfBirth}
                      helperText={fieldErrors.dateOfBirth || "Enter your date of birth"}
                      InputProps={{
                        endAdornment: getFieldStatus('dateOfBirth').showSuccess ? (
                          <InputAdornment position="end">
                            <SuccessIcon color="success" fontSize="small" />
                          </InputAdornment>
                        ) : getFieldStatus('dateOfBirth').hasError ? (
                          <InputAdornment position="end">
                            <ErrorIcon color="error" fontSize="small" />
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: getFieldStatus('dateOfBirth').hasError ? 'error.main' : 
                                        getFieldStatus('dateOfBirth').showSuccess ? 'success.main' : 'primary.main',
                          },
                        },
                      }}
                />
              </Grid>
                  <Grid item xs={12} sm={6}>
                <ValidatedSelect
                  required
                  id="gender"
                  name="gender"
                  label="Gender"
                  value={formData.gender}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={fieldErrors.gender}
                      helperText={fieldErrors.gender || "Select your gender"}
                      InputProps={{
                        endAdornment: getFieldStatus('gender').showSuccess ? (
                          <InputAdornment position="end">
                            <SuccessIcon color="success" fontSize="small" />
                          </InputAdornment>
                        ) : getFieldStatus('gender').hasError ? (
                          <InputAdornment position="end">
                            <ErrorIcon color="error" fontSize="small" />
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: getFieldStatus('gender').hasError ? 'error.main' : 
                                        getFieldStatus('gender').showSuccess ? 'success.main' : 'primary.main',
                          },
                        },
                      }}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </ValidatedSelect>
              </Grid>
                </Grid>
              </Box>
            </Slide>

            <Slide direction="up" in timeout={800}>
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 3,
                  color: 'primary.main',
                  fontWeight: 'bold'
                }}>
                  <LocationOn />
                  Address Information
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                <ValidatedTextField
                  fullWidth
                  id="address.street"
                  label="Street Address"
                  name="address.street"
                  autoComplete="street-address"
                  value={formData.address.street}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={fieldErrors['address.street']}
                      helperText={fieldErrors['address.street'] || "Enter your street address"}
                      InputProps={{
                        endAdornment: getAddressFieldStatus('address.street').showSuccess ? (
                          <InputAdornment position="end">
                            <SuccessIcon color="success" fontSize="small" />
                          </InputAdornment>
                        ) : getAddressFieldStatus('address.street').hasError ? (
                          <InputAdornment position="end">
                            <ErrorIcon color="error" fontSize="small" />
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: getAddressFieldStatus('address.street').hasError ? 'error.main' : 
                                        getAddressFieldStatus('address.street').showSuccess ? 'success.main' : 'primary.main',
                          },
                        },
                      }}
                />
              </Grid>
                  <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  fullWidth
                  id="address.city"
                  label="City"
                  name="address.city"
                  autoComplete="address-level2"
                  value={formData.address.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={fieldErrors['address.city']}
                      helperText={fieldErrors['address.city'] || "Enter your city"}
                      InputProps={{
                        endAdornment: getAddressFieldStatus('address.city').showSuccess ? (
                          <InputAdornment position="end">
                            <SuccessIcon color="success" fontSize="small" />
                          </InputAdornment>
                        ) : getAddressFieldStatus('address.city').hasError ? (
                          <InputAdornment position="end">
                            <ErrorIcon color="error" fontSize="small" />
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: getAddressFieldStatus('address.city').hasError ? 'error.main' : 
                                        getAddressFieldStatus('address.city').showSuccess ? 'success.main' : 'primary.main',
                          },
                        },
                      }}
                />
              </Grid>
                  <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  fullWidth
                  id="address.state"
                      label="State/Province"
                  name="address.state"
                  autoComplete="address-level1"
                  value={formData.address.state}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={fieldErrors['address.state']}
                      helperText={fieldErrors['address.state'] || "Enter your state or province"}
                      InputProps={{
                        endAdornment: getAddressFieldStatus('address.state').showSuccess ? (
                          <InputAdornment position="end">
                            <SuccessIcon color="success" fontSize="small" />
                          </InputAdornment>
                        ) : getAddressFieldStatus('address.state').hasError ? (
                          <InputAdornment position="end">
                            <ErrorIcon color="error" fontSize="small" />
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: getAddressFieldStatus('address.state').hasError ? 'error.main' : 
                                        getAddressFieldStatus('address.state').showSuccess ? 'success.main' : 'primary.main',
                          },
                        },
                      }}
                />
              </Grid>
                  <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  fullWidth
                  id="address.zipCode"
                  label="ZIP Code"
                  name="address.zipCode"
                  autoComplete="postal-code"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={fieldErrors['address.zipCode']}
                      helperText={fieldErrors['address.zipCode'] || "Enter your ZIP code"}
                      InputProps={{
                        endAdornment: getAddressFieldStatus('address.zipCode').showSuccess ? (
                          <InputAdornment position="end">
                            <SuccessIcon color="success" fontSize="small" />
                          </InputAdornment>
                        ) : getAddressFieldStatus('address.zipCode').hasError ? (
                          <InputAdornment position="end">
                            <ErrorIcon color="error" fontSize="small" />
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: getAddressFieldStatus('address.zipCode').hasError ? 'error.main' : 
                                        getAddressFieldStatus('address.zipCode').showSuccess ? 'success.main' : 'primary.main',
                          },
                        },
                      }}
                />
              </Grid>
                  <Grid item xs={12} sm={6}>
                <ValidatedTextField
                  fullWidth
                  id="address.country"
                  label="Country"
                  name="address.country"
                  autoComplete="country"
                  value={formData.address.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={fieldErrors['address.country']}
                      helperText={fieldErrors['address.country'] || "Enter your country"}
                      InputProps={{
                        endAdornment: getAddressFieldStatus('address.country').showSuccess ? (
                          <InputAdornment position="end">
                            <SuccessIcon color="success" fontSize="small" />
                          </InputAdornment>
                        ) : getAddressFieldStatus('address.country').hasError ? (
                          <InputAdornment position="end">
                            <ErrorIcon color="error" fontSize="small" />
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: getAddressFieldStatus('address.country').hasError ? 'error.main' : 
                                        getAddressFieldStatus('address.country').showSuccess ? 'success.main' : 'primary.main',
                          },
                        },
                      }}
                />
              </Grid>
            </Grid>
              </Box>
            </Slide>
            
            <Fade in timeout={1000}>
              <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
                  size="large"
              disabled={loading || !isFormValid(fieldErrors)}
                  endIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                  sx={{ 
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
                    boxShadow: 3,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1B5E20, #2E7D32)',
                      boxShadow: 6,
                    },
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Patient Account'}
            </Button>
            
                <Box sx={{ mt: 3 }}>
                  <Link 
                    component={RouterLink} 
                    to="/login" 
                    variant="body2"
                    sx={{ 
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      }
                    }}
                  >
                Already have an account? Sign In
              </Link>
            </Box>
              </Box>
            </Fade>
          </Box>
        </Paper>
        </Fade>
      </Box>
    </Container>
  );
};

export default Register;
