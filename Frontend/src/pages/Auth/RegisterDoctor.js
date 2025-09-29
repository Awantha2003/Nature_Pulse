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
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fade,
  Slide,
  Avatar,
  InputAdornment,
  Chip,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  LocalHospital as DoctorIcon,
  Person as PersonIcon,
  Email,
  Phone,
  LocationOn,
  Work,
  School,
  Language,
  Security,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validateDoctorRegisterForm, isFormValid, validateQualification, validateLanguage } from '../../utils/validation';
import { ValidatedTextField, ValidatedSelect } from '../../components/Validation';

const RegisterDoctor = () => {
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
    // Doctor specific fields
    licenseNumber: '',
    specialization: '',
    experience: '',
    consultationFee: '',
    bio: '',
    languages: [],
  });
  const [qualifications, setQualifications] = useState([
    { degree: '', institution: '', year: '' }
  ]);
  const [newLanguage, setNewLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [qualificationErrors, setQualificationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { registerDoctor } = useAuth();
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
      const errors = validateDoctorRegisterForm({
        ...formData,
        [name]: value,
        ...(name.startsWith('address.') ? {
          address: {
            ...formData.address,
            [name.split('.')[1]]: value,
          }
        } : {})
      }, qualifications);
      
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
    
    // Validate field on blur
    const errors = validateDoctorRegisterForm(formData, qualifications);
    if (errors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: errors[name] }));
    }
  };

  // Real-time validation
  useEffect(() => {
    const errors = validateDoctorRegisterForm(formData, qualifications);
    setFieldErrors(errors);
  }, [formData, qualifications]);

  const handleQualificationChange = (index, field, value) => {
    const newQualifications = [...qualifications];
    newQualifications[index][field] = value;
    setQualifications(newQualifications);
    
    // Validate qualification on change
    const qualErrors = validateQualification(newQualifications[index]);
    if (qualErrors) {
      setQualificationErrors(prev => ({
        ...prev,
        [`${index}_${field}`]: qualErrors[field]
      }));
    } else {
      setQualificationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${index}_${field}`];
        return newErrors;
      });
    }
  };

  const addQualification = () => {
    setQualifications([...qualifications, { degree: '', institution: '', year: '' }]);
  };

  const removeQualification = (index) => {
    if (qualifications.length > 1) {
      setQualifications(qualifications.filter((_, i) => i !== index));
    }
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      const languageError = validateLanguage(newLanguage.trim());
      if (languageError) {
        setError(languageError);
        return;
      }
      
      setFormData({
        ...formData,
        languages: [...formData.languages, newLanguage.trim()]
      });
      setNewLanguage('');
    }
  };

  const removeLanguage = (language) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter(l => l !== language)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});
    setQualificationErrors({});

    // Validate form before submission
    const errors = validateDoctorRegisterForm(formData, qualifications);
    if (!isFormValid(errors)) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    // Validate qualifications
    const validQualifications = qualifications.filter(q => q.degree && q.institution && q.year);
    if (validQualifications.length === 0) {
      setError('At least one qualification is required');
      setLoading(false);
      return;
    }

    try {
      // Ensure date is in YYYY-MM-DD format
      let formattedDate = formData.dateOfBirth;
      if (formData.dateOfBirth instanceof Date) {
        formattedDate = formData.dateOfBirth.toISOString().split('T')[0];
      } else if (typeof formData.dateOfBirth === 'string' && formData.dateOfBirth.includes('T')) {
        formattedDate = new Date(formData.dateOfBirth).toISOString().split('T')[0];
      }

      const doctorData = {
        ...formData,
        dateOfBirth: formattedDate,
        qualifications: validQualifications,
        experience: parseInt(formData.experience),
        consultationFee: parseFloat(formData.consultationFee),
      };

      console.log('Sending doctor data:', doctorData);
      const result = await registerDoctor(doctorData);
      
      if (result.success) {
        navigate('/app/doctor/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Doctor registration error:', err);
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
        console.log('Field errors set:', fieldErrorMap);
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
    <Container component="main" maxWidth="lg">
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
            border: '1px solid rgba(25, 118, 210, 0.1)',
          }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto', 
                mb: 2, 
                bgcolor: 'secondary.main',
                boxShadow: 3,
              }}>
                <DoctorIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography component="h1" variant="h4" gutterBottom sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1976D2, #42A5F5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Join as Doctor
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Join our platform as a healthcare professional
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="Patient Management" size="small" color="secondary" variant="outlined" />
                <Chip label="Appointment Scheduling" size="small" color="secondary" variant="outlined" />
                <Chip label="Analytics & Reports" size="small" color="secondary" variant="outlined" />
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
                    color: 'secondary.main',
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
                        helperText="Enter your first name"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color="action" />
                            </InputAdornment>
                          ),
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
                        helperText="Enter your last name"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color="action" />
                            </InputAdornment>
                          ),
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
                        helperText="Enter a valid email address"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email color="action" />
                            </InputAdornment>
                          ),
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
                        helperText="Password must be at least 6 characters"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Security color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
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
                        helperText="Re-enter your password"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Security color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                edge="end"
                              >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
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
                        helperText="Sri Lankan mobile number (e.g., 0704949394)"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone color="action" />
                            </InputAdornment>
                          ),
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
                        helperText="Enter your date of birth"
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
                        disabled={loading}
                        error={fieldErrors.gender}
                        helperText="Select your gender"
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
                    color: 'secondary.main',
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
                        value={formData.address.street}
                        onChange={handleChange}
                        disabled={loading}
                        error={fieldErrors['address.street']}
                        helperText="Enter your street address"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        fullWidth
                        id="address.city"
                        label="City"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleChange}
                        disabled={loading}
                        error={fieldErrors['address.city']}
                        helperText="Enter your city"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        fullWidth
                        id="address.state"
                        label="State/Province"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleChange}
                        disabled={loading}
                        error={fieldErrors['address.state']}
                        helperText="Enter your state or province"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        fullWidth
                        id="address.zipCode"
                        label="ZIP Code"
                        name="address.zipCode"
                        value={formData.address.zipCode}
                        onChange={handleChange}
                        disabled={loading}
                        error={fieldErrors['address.zipCode']}
                        helperText="Enter your ZIP code"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        fullWidth
                        id="address.country"
                        label="Country"
                        name="address.country"
                        value={formData.address.country}
                        onChange={handleChange}
                        disabled={loading}
                        error={fieldErrors['address.country']}
                        helperText="Enter your country"
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Slide>

              <Slide direction="up" in timeout={1000}>
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mb: 3,
                    color: 'secondary.main',
                    fontWeight: 'bold'
                  }}>
                    <Work />
                    Professional Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        required
                        fullWidth
                        id="licenseNumber"
                        label="Medical License Number"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loading}
                        error={fieldErrors.licenseNumber}
                        helperText="Enter your medical license number"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        required
                        fullWidth
                        id="specialization"
                        label="Specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loading}
                        error={fieldErrors.specialization}
                        helperText="Enter your medical specialization"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        required
                        fullWidth
                        id="experience"
                        label="Years of Experience"
                        name="experience"
                        type="number"
                        value={formData.experience}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loading}
                        error={fieldErrors.experience}
                        helperText="Enter years of experience"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ValidatedTextField
                        required
                        fullWidth
                        id="consultationFee"
                        label="Consultation Fee (LKR)"
                        name="consultationFee"
                        type="number"
                        value={formData.consultationFee}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loading}
                        error={fieldErrors.consultationFee}
                        helperText="Enter your consultation fee"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ValidatedTextField
                        fullWidth
                        id="bio"
                        label="Professional Bio"
                        name="bio"
                        multiline
                        rows={4}
                        value={formData.bio}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loading}
                        error={fieldErrors.bio}
                        helperText={`Describe your professional background (${formData.bio?.length || 0}/500 characters)`}
                        inputProps={{
                          maxLength: 500
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Slide>

              <Slide direction="up" in timeout={1200}>
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mb: 3,
                    color: 'secondary.main',
                    fontWeight: 'bold'
                  }}>
                    <School />
                    Qualifications
                  </Typography>
                  
                  {qualifications.map((qual, index) => (
                    <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={4}>
                        <ValidatedTextField
                          required
                          fullWidth
                          label="Degree"
                          value={qual.degree}
                          onChange={(e) => handleQualificationChange(index, 'degree', e.target.value)}
                          disabled={loading}
                          error={qualificationErrors[`${index}_degree`]}
                          helperText="Enter degree or certification"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <ValidatedTextField
                          required
                          fullWidth
                          label="Institution"
                          value={qual.institution}
                          onChange={(e) => handleQualificationChange(index, 'institution', e.target.value)}
                          disabled={loading}
                          error={qualificationErrors[`${index}_institution`]}
                          helperText="Enter institution name"
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <ValidatedTextField
                          required
                          fullWidth
                          label="Year"
                          type="number"
                          value={qual.year}
                          onChange={(e) => handleQualificationChange(index, 'year', e.target.value)}
                          disabled={loading}
                          error={qualificationErrors[`${index}_year`]}
                          helperText="Enter graduation year"
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton
                          onClick={() => removeQualification(index)}
                          disabled={loading || qualifications.length === 1}
                          color="error"
                          sx={{ mt: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}

                  <Button
                    startIcon={<AddIcon />}
                    onClick={addQualification}
                    disabled={loading}
                    sx={{ mb: 3 }}
                  >
                    Add Qualification
                  </Button>
                </Box>
              </Slide>

              <Slide direction="up" in timeout={1400}>
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mb: 3,
                    color: 'secondary.main',
                    fontWeight: 'bold'
                  }}>
                    <Language />
                    Languages
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      label="Add Language"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      disabled={loading}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLanguage();
                        }
                      }}
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      variant="outlined"
                      onClick={addLanguage}
                      disabled={loading || !newLanguage.trim()}
                      sx={{ minWidth: 100 }}
                    >
                      Add
                    </Button>
                  </Box>

                  <List dense>
                    {formData.languages.map((language, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemText primary={language} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => removeLanguage(language)}
                            disabled={loading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Slide>
              
              <Fade in timeout={1600}>
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
                      background: 'linear-gradient(45deg, #1976D2, #42A5F5)',
                      boxShadow: 3,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #0D47A1, #1976D2)',
                        boxShadow: 6,
                      },
                    }}
                  >
                    {loading ? 'Creating Account...' : 'Create Doctor Account'}
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

export default RegisterDoctor;