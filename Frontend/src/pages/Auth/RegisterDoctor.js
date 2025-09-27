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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
      country: '',
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
  const [touched, setTouched] = useState({});
  const [qualificationErrors, setQualificationErrors] = useState({});
  
  const { registerDoctor } = useAuth();
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
              Register as Doctor
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join our platform as a healthcare professional
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
              Personal Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
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
                  helperText="Enter your first name (2-50 characters)"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
                  helperText="Enter your last name (2-50 characters)"
                />
              </Grid>
              <Grid size={12}>
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
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedTextField
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
                  error={fieldErrors.password}
                  helperText="Password must be at least 6 characters long"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedTextField
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
                  error={fieldErrors.confirmPassword}
                  helperText="Re-enter your password to confirm"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
                  helperText="Enter a valid Sri Lankan mobile number (e.g., 0704949394)"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
                  helperText="Enter your date of birth (age must be 13-120 years)"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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

            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
              Address Information
            </Typography>

            <Grid container spacing={2}>
              <Grid size={12}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedTextField
                  fullWidth
                  id="address.state"
                  label="State"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  disabled={loading}
                  error={fieldErrors['address.state']}
                  helperText="Enter your state"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
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

            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
              Professional Information
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
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
                  helperText="Enter your medical license number (5-50 characters)"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
                  helperText="Enter your medical specialization (2-100 characters)"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
                  helperText="Enter years of experience (0-50 years)"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
                  helperText="Enter your consultation fee in Sri Lankan Rupees (must be positive)"
                />
              </Grid>
              <Grid size={12}>
                <ValidatedTextField
                  fullWidth
                  id="bio"
                  label="Bio"
                  name="bio"
                  multiline
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  error={fieldErrors.bio}
                  helperText={`Describe your professional background and expertise (${formData.bio?.length || 0}/500 characters)`}
                  inputProps={{
                    maxLength: 500
                  }}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
              Qualifications
            </Typography>

            {qualifications.map((qual, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
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
                <Grid size={{ xs: 12, sm: 4 }}>
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
                <Grid size={{ xs: 12, sm: 3 }}>
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
                <Grid size={{ xs: 12, sm: 1 }}>
                  <IconButton
                    onClick={() => removeQualification(index)}
                    disabled={loading || qualifications.length === 1}
                    color="error"
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
              sx={{ mb: 2 }}
            >
              Add Qualification
            </Button>

            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
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
              />
              <Button
                variant="outlined"
                onClick={addLanguage}
                disabled={loading || !newLanguage.trim()}
              >
                Add
              </Button>
            </Box>

            <List dense>
              {formData.languages.map((language, index) => (
                <ListItem key={index}>
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
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !isFormValid(fieldErrors)}
            >
              {loading ? <CircularProgress size={24} /> : 'Register as Doctor'}
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

export default RegisterDoctor;
