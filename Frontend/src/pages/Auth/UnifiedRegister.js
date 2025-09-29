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
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fade,
  Slide,
  Avatar,
  InputAdornment,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalHospital as DoctorIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility,
  VisibilityOff,
  Email,
  Phone,
  LocationOn,
  Work,
  School,
  Language,
  Security,
  CheckCircle,
  ArrowForward,
  ArrowBack,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validateRegisterForm, validateDoctorRegisterForm, isFormValid, validateQualification, validateLanguage } from '../../utils/validation';
import { ValidatedTextField, ValidatedSelect } from '../../components/Validation';

const UnifiedRegister = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [userType, setUserType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form data
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
  
  const { register, registerDoctor } = useAuth();
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

  const steps = [
    'Choose Account Type',
    'Personal Information',
    userType === 'doctor' ? 'Professional Information' : 'Additional Details',
    'Review & Complete'
  ];

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setError('');
    setFieldErrors({});
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!userType) {
        setError('Please select an account type');
        return;
      }
    } else if (activeStep === 1) {
      // Validate personal information
      const personalFields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phone', 'dateOfBirth', 'gender'];
      const errors = userType === 'doctor' 
        ? validateDoctorRegisterForm(formData, qualifications)
        : validateRegisterForm(formData);
      
      const personalErrors = {};
      personalFields.forEach(field => {
        if (errors[field]) {
          personalErrors[field] = errors[field];
        }
      });
      
      if (Object.keys(personalErrors).length > 0) {
        setFieldErrors(personalErrors);
        setError('Please fix the errors before continuing');
        return;
      }
    } else if (activeStep === 2 && userType === 'doctor') {
      // Validate professional information
      const professionalFields = ['licenseNumber', 'specialization', 'experience', 'consultationFee'];
      const errors = validateDoctorRegisterForm(formData, qualifications);
      
      const professionalErrors = {};
      professionalFields.forEach(field => {
        if (errors[field]) {
          professionalErrors[field] = errors[field];
        }
      });
      
      if (Object.keys(professionalErrors).length > 0) {
        setFieldErrors(professionalErrors);
        setError('Please fix the professional information errors');
        return;
      }
    }
    
    setError('');
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setError('');
    setFieldErrors({});
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
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
      const errors = userType === 'doctor' 
        ? validateDoctorRegisterForm({
            ...formData,
            [name]: value,
            ...(name.startsWith('address.') ? {
              address: {
                ...formData.address,
                [name.split('.')[1]]: value,
              }
            } : {})
          }, qualifications)
        : validateRegisterForm({
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
    
    // Validate field on blur
    const errors = userType === 'doctor' 
      ? validateDoctorRegisterForm(formData, qualifications)
      : validateRegisterForm(formData);
    if (errors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: errors[name] }));
    }
  };

  // Real-time validation
  useEffect(() => {
    const errors = userType === 'doctor' 
      ? validateDoctorRegisterForm(formData, qualifications)
      : validateRegisterForm(formData);
    setFieldErrors(errors);
  }, [formData, qualifications, userType]);

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

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setFieldErrors({});
    setQualificationErrors({});

    // Final validation
    const errors = userType === 'doctor' 
      ? validateDoctorRegisterForm(formData, qualifications)
      : validateRegisterForm(formData);
    
    if (!isFormValid(errors)) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    let validQualifications = [];
    if (userType === 'doctor') {
      // Validate qualifications
      validQualifications = qualifications.filter(q => q.degree && q.institution && q.year);
      if (validQualifications.length === 0) {
        setError('At least one qualification is required');
        setLoading(false);
        return;
      }
    }

    try {
      let result;
      
      if (userType === 'doctor') {
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

        result = await registerDoctor(doctorData);
        
        if (result.success) {
          navigate('/app/doctor/dashboard');
        } else {
          setError(result.message);
        }
      } else {
        result = await register(formData);
        
        if (result.success) {
          navigate('/app/patient/dashboard');
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const fieldErrorMap = {};
        errors.forEach(error => {
          fieldErrorMap[error.path] = error.msg;
        });
        setFieldErrors(fieldErrorMap);
        
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

  const renderUserTypeSelection = () => (
    <Fade in={activeStep === 0} timeout={500}>
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Join Nature Pulse
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Choose your account type to get started
        </Typography>
        
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={6} md={5}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: userType === 'patient' ? 'scale(1.02)' : 'scale(1)',
                boxShadow: userType === 'patient' ? 6 : 2,
                border: userType === 'patient' ? '2px solid' : '1px solid',
                borderColor: userType === 'patient' ? 'primary.main' : 'divider',
              }}
              onClick={() => handleUserTypeSelect('patient')}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  Patient
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Book appointments, track your health, and connect with healthcare professionals
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="Book Appointments" size="small" />
                  <Chip label="Health Tracking" size="small" />
                  <Chip label="Community" size="small" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={5}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: userType === 'doctor' ? 'scale(1.02)' : 'scale(1)',
                boxShadow: userType === 'doctor' ? 6 : 2,
                border: userType === 'doctor' ? '2px solid' : '1px solid',
                borderColor: userType === 'doctor' ? 'primary.main' : 'divider',
              }}
              onClick={() => handleUserTypeSelect('doctor')}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'secondary.main' }}>
                  <DoctorIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  Doctor
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Manage patients, schedule appointments, and grow your practice
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="Patient Management" size="small" />
                  <Chip label="Appointments" size="small" />
                  <Chip label="Analytics" size="small" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );

  const renderPersonalInformation = () => (
    <Slide direction="right" in={activeStep === 1} timeout={500}>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          Personal Information
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Tell us about yourself
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
  );

  const renderAddressInformation = () => (
    <Slide direction="right" in={activeStep === 1} timeout={500}>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn color="primary" />
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
              helperText="Enter your street address"
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
              helperText="Enter your city"
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
              helperText="Enter your state or province"
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
              helperText="Enter your ZIP code"
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
              helperText="Enter your country"
            />
          </Grid>
        </Grid>
      </Box>
    </Slide>
  );

  const renderProfessionalInformation = () => (
    <Slide direction="right" in={activeStep === 2} timeout={500}>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Work color="primary" />
          Professional Information
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Tell us about your medical practice
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

        <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <School color="primary" />
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

        <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Language color="primary" />
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
  );

  const renderReview = () => (
    <Fade in={activeStep === 3} timeout={500}>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="primary" />
          Review Your Information
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Please review your information before creating your account
        </Typography>
        
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Name:</Typography>
              <Typography variant="body1">{formData.firstName} {formData.lastName}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Email:</Typography>
              <Typography variant="body1">{formData.email}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Phone:</Typography>
              <Typography variant="body1">{formData.phone}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Gender:</Typography>
              <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.gender}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {userType === 'doctor' && (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Professional Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">License Number:</Typography>
                <Typography variant="body1">{formData.licenseNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Specialization:</Typography>
                <Typography variant="body1">{formData.specialization}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Experience:</Typography>
                <Typography variant="body1">{formData.experience} years</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Consultation Fee:</Typography>
                <Typography variant="body1">LKR {formData.consultationFee}</Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Address
          </Typography>
          <Typography variant="body1">
            {formData.address.street && `${formData.address.street}, `}
            {formData.address.city && `${formData.address.city}, `}
            {formData.address.state && `${formData.address.state}, `}
            {formData.address.zipCode && `${formData.address.zipCode}, `}
            {formData.address.country}
          </Typography>
        </Paper>
      </Box>
    </Fade>
  );

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
        <Paper elevation={3} sx={{ padding: 4, width: '100%', borderRadius: 2 }}>
          <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ minHeight: 400 }}>
            {activeStep === 0 && renderUserTypeSelection()}
            {activeStep === 1 && (
              <Box>
                {renderPersonalInformation()}
                {renderAddressInformation()}
              </Box>
            )}
            {activeStep === 2 && userType === 'doctor' && renderProfessionalInformation()}
            {activeStep === 3 && renderReview()}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                endIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                sx={{ minWidth: 150 }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                disabled={loading}
                sx={{ minWidth: 100 }}
              >
                Next
              </Button>
            )}
          </Box>
          
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Already have an account? Sign In
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default UnifiedRegister;
