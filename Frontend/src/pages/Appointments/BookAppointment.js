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
import api from '../../utils/api';

const BookAppointment = () => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form data
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [appointmentType, setAppointmentType] = useState('consultation');
  const [isVirtual, setIsVirtual] = useState(false);
  const [reason, setReason] = useState('');
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
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

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
      const dateStr = selectedDate instanceof Date ? 
        selectedDate.toISOString().split('T')[0] : 
        new Date(selectedDate).toISOString().split('T')[0];
      const response = await api.get(`/appointments/doctor/${selectedDoctor}/availability?date=${dateStr}`);
      
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
    if (activeStep === 0 && !selectedDoctor) {
      setError('Please select a doctor');
      return;
    }
    if (activeStep === 1 && (!selectedDate || !selectedTime)) {
      setError('Please select date and time');
      return;
    }
    if (activeStep === 2 && !reason.trim()) {
      setError('Please provide a reason for the appointment');
      return;
    }
    if (activeStep === 2 && reason.trim().length < 10) {
      setError('Reason must be at least 10 characters long');
      return;
    }
    if (activeStep === 2 && reason.trim().length > 500) {
      setError('Reason cannot exceed 500 characters');
      return;
    }
    
    setError(null);
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
        doctor: selectedDoctor,
        appointmentDate: selectedDate instanceof Date ? 
          selectedDate.toISOString().split('T')[0] : 
          new Date(selectedDate).toISOString().split('T')[0],
        appointmentTime: selectedTime,
        type: appointmentType,
        isVirtual,
        reason: reason.trim(),
        symptoms,
        location: isVirtual ? { type: 'virtual' } : { type: 'clinic' }
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
        setError(err.response.data.message || 'Invalid appointment data. Please check your selections.');
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
              <Grid item xs={12} md={6} key={doctor._id}>
                <Card 
                  variant={selectedDoctor === doctor._id ? "elevation" : "outlined"}
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedDoctor === doctor._id ? 2 : 1,
                    borderColor: selectedDoctor === doctor._id ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setSelectedDoctor(doctor._id)}
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
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  minDate={new Date()}
                  maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Available Time Slots</InputLabel>
                <Select
                  value={selectedTime || ''}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  disabled={!selectedDate || availableSlots.length === 0}
                >
                  {availableSlots.length === 0 && selectedDate ? (
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
                </Select>
              </FormControl>
            </Grid>
            {selectedDoctorData && (
              <Grid item xs={12}>
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Appointment Type</InputLabel>
                <Select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                >
                  {appointmentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isVirtual}
                    onChange={(e) => setIsVirtual(e.target.checked)}
                  />
                }
                label="Virtual Consultation"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Appointment"
                multiline
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please describe the reason for your appointment (minimum 10 characters)..."
                required
                helperText={`${reason.length}/500 characters (minimum 10 required)`}
                error={reason.length > 0 && reason.length < 10}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Symptoms (Optional)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add Symptom"
                  value={currentSymptom}
                  onChange={(e) => setCurrentSymptom(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSymptom()}
                />
                <Button variant="outlined" onClick={handleAddSymptom}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {symptoms.map((symptom) => (
                  <Chip
                    key={symptom}
                    label={symptom}
                    onDelete={() => handleRemoveSymptom(symptom)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
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
                    href={`/app/appointments/${bookingSummary._id}/payment`}
                    sx={{ mr: 2 }}
                  >
                    Pay Now
                  </Button>
                  <Button
                    variant="outlined"
                    href="/appointments"
                  >
                    View Appointments
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
            {error}
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
                  onClick={() => window.location.href = '/appointments'}
                >
                  View Appointments
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
