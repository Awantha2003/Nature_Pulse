import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Avatar,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Radio,
  RadioGroup,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  Person,
  LocalHospital,
  VideoCall,
  LocationOn,
  Star,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { ValidatedTextField, ValidatedSelect } from '../../components/Validation';
import { validateAppointmentBooking, isFormValid } from '../../utils/validation';

const BookAppointment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Form data
  const [formData, setFormData] = useState({
    selectedDoctor: '',
    selectedDate: null,
    selectedTime: null,
    appointmentType: 'consultation',
    isVirtual: false,
    reason: '',
    symptoms: '',
    notes: ''
  });
  const [symptoms, setSymptoms] = useState([]);
  const [currentSymptom, setCurrentSymptom] = useState('');

  // Data
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDoctorData, setSelectedDoctorData] = useState(null);
  const [bookingSummary, setBookingSummary] = useState(null);

  const steps = ['Select Doctor', 'Choose Date & Time', 'Appointment Details', 'Confirmation'];

  const appointmentTypes = [
    { value: 'consultation', label: 'General Consultation' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'routine', label: 'Routine Checkup' }
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (formData.selectedDoctor && formData.selectedDate) {
      fetchAvailableSlots();
    }
  }, [formData.selectedDoctor, formData.selectedDate]);

  // Validation handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    const errors = validateAppointmentBooking(formData);
    if (errors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: errors[name] }));
    }
  };

  // Real-time validation
  useEffect(() => {
    const errors = validateAppointmentBooking(formData);
    setFieldErrors(errors);
  }, [formData]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/users/doctors?verified=true&acceptingPatients=true');
      if (response.data.status === 'success') {
        setDoctors(response.data.data.doctors || []);
        if (!response.data.data.doctors || response.data.data.doctors.length === 0) {
          setError('No verified doctors are currently available. Please check back later or contact support.');
        }
      } else {
        setError('No doctors available');
      }
    } catch (err) {
      console.error('Fetch doctors error:', err);
      if (err.response?.status === 404) {
        setError('No verified doctors found. Please contact support to add doctors to the system.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later or contact support.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch doctors. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      // Format date properly for the API
      const dateStr = formData.selectedDate instanceof Date ? 
        formData.selectedDate.toISOString().split('T')[0] : 
        new Date(formData.selectedDate).toISOString().split('T')[0];
      const response = await api.get(`/appointments/doctor/${formData.selectedDoctor}/availability?date=${dateStr}`);
      
      if (response.data.status === 'success') {
        setAvailableSlots(response.data.data.availableSlots || []);
        setSelectedDoctorData(response.data.data.doctorInfo);
      } else {
        setAvailableSlots([]);
        setError('No available slots for this date');
      }
    } catch (err) {
      console.error('Fetch availability error:', err);
      setAvailableSlots([]);
      setError(err.response?.data?.message || 'Failed to fetch available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Validate current step before proceeding
    const errors = validateAppointmentBooking(formData);
    const stepErrors = {};
    
    if (activeStep === 0) {
      if (errors.selectedDoctor) stepErrors.selectedDoctor = errors.selectedDoctor;
    } else if (activeStep === 1) {
      if (errors.selectedDate) stepErrors.selectedDate = errors.selectedDate;
      if (errors.selectedTime) stepErrors.selectedTime = errors.selectedTime;
    } else if (activeStep === 2) {
      if (errors.reason) stepErrors.reason = errors.reason;
      if (errors.symptoms) stepErrors.symptoms = errors.symptoms;
      if (errors.notes) stepErrors.notes = errors.notes;
    }
    
    if (Object.keys(stepErrors).length > 0) {
      setFieldErrors(stepErrors);
      setError('Please fix the validation errors before proceeding');
      return;
    }
    
    setError(null);
    setFieldErrors({});
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAddSymptom = () => {
    if (currentSymptom.trim() && !symptoms.includes(currentSymptom.trim())) {
      setSymptoms([...symptoms, currentSymptom.trim()]);
      setCurrentSymptom('');
    }
  };

  const handleRemoveSymptom = (symptom) => {
    setSymptoms(symptoms.filter(s => s !== symptom));
  };

  const handleBookAppointment = async () => {
    try {
      setLoading(true);
      setError(null);

      const appointmentData = {
        doctor: formData.selectedDoctor,
        appointmentDate: formData.selectedDate instanceof Date ? 
          formData.selectedDate.toISOString().split('T')[0] : 
          new Date(formData.selectedDate).toISOString().split('T')[0],
        appointmentTime: formData.selectedTime,
        type: formData.appointmentType,
        isVirtual: formData.isVirtual,
        reason: formData.reason.trim(),
        symptoms: formData.symptoms,
        notes: formData.notes,
        location: formData.isVirtual ? { type: 'virtual' } : { type: 'clinic' }
      };

      const response = await api.post('/appointments', appointmentData);
      
      if (response.data.status === 'success') {
        setBookingSummary(response.data.data.appointment);
        setSuccess('Appointment booked successfully!');
        setActiveStep(3);
      }
    } catch (err) {
      console.error('Booking error:', err);
      
      // Handle different types of errors
      if (err.response?.status === 400 && err.response?.data?.errors) {
        const validationErrors = err.response.data.errors.map(error => error.msg).join(', ');
        setError(`Validation failed: ${validationErrors}`);
      } else if (err.response?.status === 404) {
        setError('Doctor not found or not verified. Please select a different doctor.');
      } else if (err.response?.status === 400) {
        const errorMessage = err.response.data.message || 'Invalid appointment data. Please check your selections.';
        const suggestions = err.response.data.suggestions;
        
        if (suggestions && suggestions.length > 0) {
          setError(`${errorMessage}\n\n💡 Suggestions:\n• ${suggestions.join('\n• ')}`);
        } else {
          setError(errorMessage);
        }
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later or contact support.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to book appointment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        if (loading) {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress />
            </Box>
          );
        }
        
        if (doctors.length === 0) {
          return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No doctors available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please check back later or contact support.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={fetchDoctors}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Retry
              </Button>
            </Box>
          );
        }
        
        return (
          <Grid container spacing={3}>
            {doctors.map((doctor) => (
              <Grid size={{ xs: 12, md: 6 }} key={doctor._id}>
                <Card 
                  variant={formData.selectedDoctor === doctor._id ? "elevation" : "outlined"}
                  sx={{ 
                    cursor: 'pointer',
                    border: formData.selectedDoctor === doctor._id ? 2 : 1,
                    borderColor: formData.selectedDoctor === doctor._id ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, selectedDoctor: doctor._id }))}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 60, height: 60, mr: 2 }}>
                        {doctor.user?.firstName?.[0]}{doctor.user?.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {doctor.specialization}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Star sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                          <Typography variant="body2">
                            {doctor.rating?.average?.toFixed(1) || '0.0'} ({doctor.rating?.count || 0} reviews)
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {doctor.bio}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary">
                        LKR ${doctor.consultationFee}
                      </Typography>
                      <Chip 
                        label={doctor.isAcceptingNewPatients ? "Available" : "Not Available"} 
                        color={doctor.isAcceptingNewPatients ? "success" : "error"}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Select Date"
                  value={formData.selectedDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, selectedDate: date }))}
                  minDate={new Date()}
                  maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
                  renderInput={(params) => (
                    <ValidatedTextField 
                      {...params} 
                      fullWidth 
                      error={!!fieldErrors.selectedDate}
                      helperText={fieldErrors.selectedDate || "Select your preferred date"}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ValidatedSelect
                fullWidth
                id="selectedTime"
                name="selectedTime"
                label="Available Time Slots"
                value={formData.selectedTime || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={!formData.selectedDate || availableSlots.length === 0}
                error={!!fieldErrors.selectedTime}
                helperText={fieldErrors.selectedTime || "Select your preferred time slot"}
                >
                  {availableSlots.length === 0 && formData.selectedDate ? (
                    <MenuItem disabled>
                      {loading ? 'Loading...' : 'No available slots'}
                    </MenuItem>
                  ) : (
                    availableSlots.map((slot) => (
                      <MenuItem key={slot} value={slot}>
                        {formatTime(slot)}
                      </MenuItem>
                    ))
                  )}
              </ValidatedSelect>
            </Grid>
            {selectedDoctorData && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>
                    Doctor Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Name:</strong> {selectedDoctorData.name}<br />
                    <strong>Specialization:</strong> {selectedDoctorData.specialization}<br />
                    <strong>Consultation Fee:</strong> LKR ${selectedDoctorData.consultationFee}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <ValidatedSelect
                fullWidth
                id="appointmentType"
                name="appointmentType"
                label="Appointment Type"
                value={formData.appointmentType}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!fieldErrors.appointmentType}
                helperText="Select the type of appointment"
                >
                  {appointmentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
              </ValidatedSelect>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isVirtual}
                    onChange={(e) => setFormData(prev => ({ ...prev, isVirtual: e.target.checked }))}
                  />
                }
                label="Virtual Consultation"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <ValidatedTextField
                fullWidth
                label="Reason for Appointment"
                name="reason"
                multiline
                rows={3}
                value={formData.reason}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Please describe the reason for your appointment (minimum 10 characters)..."
                required
                error={!!fieldErrors.reason}
                helperText={`${formData.reason.length}/500 characters (minimum 10 required)`}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <ValidatedTextField
                  fullWidth
                label="Symptoms (Optional)"
                name="symptoms"
                multiline
                rows={2}
                value={formData.symptoms}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Describe any symptoms you're experiencing..."
                error={!!fieldErrors.symptoms}
                helperText={`${formData.symptoms.length}/500 characters`}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <ValidatedTextField
                fullWidth
                label="Additional Notes (Optional)"
                name="notes"
                multiline
                rows={2}
                value={formData.notes}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Any additional information you'd like to share with the doctor..."
                error={!!fieldErrors.notes}
                helperText={`${formData.notes.length}/1000 characters`}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Appointment Booked Successfully!
            </Typography>
            {bookingSummary && (
              <Paper sx={{ p: 3, mt: 3, textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom>
                  Appointment Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Doctor:</strong> Dr. {bookingSummary.doctor.user.firstName} {bookingSummary.doctor.user.lastName}<br />
                  <strong>Date:</strong> {new Date(bookingSummary.appointmentDate).toLocaleDateString()}<br />
                  <strong>Time:</strong> {formatTime(bookingSummary.appointmentTime)}<br />
                  <strong>Type:</strong> {bookingSummary.type}<br />
                  <strong>Consultation Fee:</strong> LKR ${bookingSummary.payment.amount}<br />
                  <strong>Status:</strong> {bookingSummary.status}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate(`/app/appointments/${bookingSummary._id}/payment`)}
                    sx={{ mr: 2 }}
                  >
                    Pay Now
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const dashboardPath = user?.role === 'patient' ? '/app/patient/dashboard' : 
                                           user?.role === 'doctor' ? '/app/doctor/dashboard' : 
                                           user?.role === 'admin' ? '/app/admin/overview' : '/dashboard';
                      navigate(dashboardPath);
                    }}
                  >
                    Go to Dashboard
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Book Appointment
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Schedule an appointment with our qualified doctors
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            <Typography component="div" sx={{ whiteSpace: 'pre-line' }}>
              {error}
            </Typography>
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ minHeight: 400 }}>
              {renderStepContent(activeStep)}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(0)}
                >
                  Book Another Appointment
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={activeStep === 2 ? handleBookAppointment : handleNext}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : 
                   activeStep === 2 ? 'Book Appointment' : 'Next'}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default BookAppointment;
