import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Fade,
  Zoom,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Divider,
  Paper,
  Stack,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  Person,
  MedicalServices,
  Payment,
  CheckCircle,
  ArrowBack,
  Search,
  Star,
  LocationOn,
  VideoCall,
  Phone,
  Schedule,
  CreditCard,
  LocalHospital,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const BookAppointment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [appointmentType, setAppointmentType] = useState('in-person');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [bookingData, setBookingData] = useState({
    reason: '',
    symptoms: '',
    notes: '',
    isVirtual: false,
    location: '',
    meetingLink: ''
  });

  const specializations = [
    'All',
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery'
  ];

  const steps = ['Select Doctor', 'Choose Date & Time', 'Appointment Details', 'Payment'];

  useEffect(() => {
    fetchDoctors();
  }, [searchTerm, selectedSpecialization]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        specialization: selectedSpecialization === 'All' ? '' : selectedSpecialization,
        isAcceptingNewPatients: 'true'
      });
      
      const response = await api.get(`/users/doctors?${params}`);
      setDoctors(response.data.data.doctors || []);
    } catch (err) {
      setError('Failed to load doctors');
      console.error('Doctors error:', err);
      setDoctors([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    try {
      const dateString = date.toISOString().split('T')[0];
      
      const response = await api.get(`/appointments/doctor/${doctorId}/availability?date=${dateString}`);
      
      setAvailableSlots(response.data.data.availableSlots || []);
    } catch (err) {
      console.error('Availability error:', err);
      console.error('Error response:', err.response?.data);
      setAvailableSlots([]);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setActiveStep(1);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (selectedDoctor) {
      fetchAvailableSlots(selectedDoctor._id, date);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setActiveStep(2);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    try {
      // Frontend validation
      if (!selectedDoctor) {
        setError('Please select a doctor');
        return;
      }
      
      if (!selectedDate) {
        setError('Please select an appointment date');
        return;
      }
      
      if (!selectedTime) {
        setError('Please select an appointment time');
        return;
      }
      
      if (!bookingData.reason || bookingData.reason.trim().length < 5) {
        setError('Please provide a reason for your visit (at least 5 characters)');
        return;
      }
      
      // Format time as HH:MM string
      const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
      
      // Map appointment type to valid backend values
      const validAppointmentType = appointmentType === 'in-person' ? 'consultation' : 
                                  appointmentType === 'virtual' ? 'consultation' : 
                                  appointmentType;
      
      const appointmentData = {
        doctor: selectedDoctor._id,
        appointmentDate: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD format
        appointmentTime: timeString, // HH:MM format
        duration: 30,
        type: validAppointmentType,
        reason: bookingData.reason.trim(),
        symptoms: bookingData.symptoms?.trim() || '',
        notes: bookingData.notes?.trim() || '',
        isVirtual: appointmentType === 'virtual',
        location: appointmentType === 'in-person' ? (bookingData.location?.trim() || '') : '',
        meetingLink: appointmentType === 'virtual' ? (bookingData.meetingLink?.trim() || '') : '',
        paymentMethod: paymentMethod
      };

      console.log('Submitting appointment data:', appointmentData);

      const response = await api.post('/appointments', appointmentData);
      
      // Navigate to payment if required
      if (response.data.data.appointment.payment.status === 'pending') {
        navigate(`/app/appointments/${response.data.data.appointment._id}/payment`);
      } else {
        navigate('/app/patient/appointments', { 
          state: { message: 'Appointment booked successfully!' } 
        });
      }
    } catch (err) {
      console.error('Booking error:', err);
      
      // Handle validation errors specifically
      if (err.response?.status === 400 && err.response?.data?.errors) {
        const validationErrors = err.response.data.errors.map(error => error.msg).join(', ');
        setError(`Validation failed: ${validationErrors}`);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to book appointment. Please try again.');
      }
    }
  };

  const getDoctorRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading && doctors.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg">
        <Fade in timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <IconButton onClick={() => navigate('/app/patient/appointments')} sx={{ mr: 2 }}>
                <ArrowBack />
              </IconButton>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Book Appointment 📅
              </Typography>
            </Box>
            <Typography variant="h6" color="text.secondary">
              Schedule your healthcare consultation with our qualified doctors
            </Typography>
            
            {/* Error Display */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: '15px' }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}
          </Box>
        </Fade>

        {/* Progress Stepper */}
        <Card sx={{ borderRadius: '20px', mb: 4, p: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Card>

        {/* Step 1: Select Doctor */}
        {activeStep === 0 && (
          <Fade in timeout={800}>
            <Box>
              {/* Search and Filter */}
              <Card sx={{ borderRadius: '20px', mb: 4, p: 3 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      placeholder="Search doctors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <Search sx={{ mr: 1, color: 'text.secondary' }} />
                        ),
                      }}
                      sx={{ borderRadius: '15px' }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Specialization</InputLabel>
                      <Select
                        value={selectedSpecialization}
                        onChange={(e) => setSelectedSpecialization(e.target.value)}
                        label="Specialization"
                      >
                        {specializations.map((spec) => (
                          <MenuItem key={spec} value={spec}>
                            {spec}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Card>

              {/* Doctors List */}
              <Grid container spacing={3}>
                {doctors.map((doctor, index) => (
                  <Grid size={{ xs: 12, md: 6 }} key={doctor._id}>
                    <Zoom in timeout={1000 + index * 100}>
                      <Card 
                        sx={{ 
                          borderRadius: '20px',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                          },
                        }}
                        onClick={() => handleDoctorSelect(doctor)}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                              src={doctor.user?.profileImage ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${doctor.user.profileImage}` : ''}
                              sx={{ mr: 2, width: 60, height: 60 }}
                            >
                              <MedicalServices />
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Dr. {doctor.user?.firstName || 'Unknown'} {doctor.user?.lastName || 'Doctor'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {doctor.specialization}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Star sx={{ fontSize: 16, color: '#FFD700', mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {doctor.rating?.average?.toFixed(1) || '0.0'} ({doctor.rating?.count || 0} reviews)
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {doctor.bio?.substring(0, 100)}...
                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Chip 
                              label={`LKR ${doctor.consultationFee}/consultation`} 
                              color="primary" 
                              variant="outlined"
                            />
                            <Chip 
                              label={`${doctor.experience} years exp.`} 
                              color="secondary" 
                              variant="outlined"
                            />
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                              icon={<LocationOn />} 
                              label="In-Person" 
                              size="small" 
                              variant="outlined"
                            />
                            <Chip 
                              icon={<VideoCall />} 
                              label="Virtual" 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Fade>
        )}

        {/* Step 2: Choose Date & Time */}
        {activeStep === 1 && selectedDoctor && (
          <Fade in timeout={800}>
            <Box>
              <Card sx={{ borderRadius: '20px', mb: 4, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    src={selectedDoctor.user?.profileImage ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${selectedDoctor.user.profileImage}` : ''}
                    sx={{ mr: 2, width: 50, height: 50 }}
                  >
                    <MedicalServices />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Dr. {selectedDoctor.user?.firstName || 'Unknown'} {selectedDoctor.user?.lastName || 'Doctor'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedDoctor.specialization}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Select Date
                    </Typography>
                    <DatePicker
                      label="Appointment Date"
                      value={selectedDate}
                      onChange={handleDateSelect}
                      minDate={new Date()}
                      maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
                      slotProps={{
                        textField: {
                          fullWidth: true
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Available Times
                    </Typography>
                    {selectedDate ? (
                      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {availableSlots.length > 0 ? (
                          <Grid container spacing={1}>
                            {availableSlots.map((slot, index) => (
                              <Grid size={{ xs: 6, sm: 4 }} key={index}>
                                <Button
                                  variant={selectedTime?.getTime() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), parseInt(slot.split(':')[0]), parseInt(slot.split(':')[1])).getTime() ? 'contained' : 'outlined'}
                                  fullWidth
                                  onClick={() => handleTimeSelect(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), parseInt(slot.split(':')[0]), parseInt(slot.split(':')[1])))}
                                  sx={{ borderRadius: '15px' }}
                                >
                                  {formatTime(slot)}
                                </Button>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No available slots for this date
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Please select a date first
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack} startIcon={<ArrowBack />}>
                  Back
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                  disabled={!selectedDate || !selectedTime}
                  sx={{ borderRadius: '15px' }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Step 3: Appointment Details */}
        {activeStep === 2 && (
          <Fade in timeout={800}>
            <Box>
              <Card sx={{ borderRadius: '20px', mb: 4, p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Appointment Details
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={12}>
                    <FormLabel component="legend">Appointment Type</FormLabel>
                    <RadioGroup
                      value={appointmentType}
                      onChange={(e) => setAppointmentType(e.target.value)}
                      row
                    >
                      <FormControlLabel 
                        value="in-person" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationOn sx={{ mr: 1 }} />
                            In-Person
                          </Box>
                        } 
                      />
                      <FormControlLabel 
                        value="virtual" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <VideoCall sx={{ mr: 1 }} />
                            Virtual
                          </Box>
                        } 
                      />
                    </RadioGroup>
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label="Reason for Visit"
                      value={bookingData.reason}
                      onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                      required
                      error={bookingData.reason && bookingData.reason.trim().length < 5}
                      helperText={
                        bookingData.reason && bookingData.reason.trim().length < 5 
                          ? "Please provide at least 5 characters" 
                          : `Required field - describe why you need this appointment (${bookingData.reason?.length || 0}/500 characters)`
                      }
                      placeholder="e.g., Annual checkup, specific symptoms, follow-up visit..."
                      inputProps={{ maxLength: 500 }}
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Symptoms (Optional)"
                      value={bookingData.symptoms}
                      onChange={(e) => setBookingData({ ...bookingData, symptoms: e.target.value })}
                      placeholder="Describe any symptoms you're experiencing..."
                      helperText={`Optional - describe your symptoms (${bookingData.symptoms?.length || 0}/1000 characters)`}
                      inputProps={{ maxLength: 1000 }}
                    />
                  </Grid>

                  {appointmentType === 'in-person' && (
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Preferred Location"
                        value={bookingData.location}
                        onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                        placeholder="Clinic address or location preference"
                        helperText={`Optional - preferred location (${bookingData.location?.length || 0}/200 characters)`}
                        inputProps={{ maxLength: 200 }}
                      />
                    </Grid>
                  )}

                  {appointmentType === 'virtual' && (
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Meeting Link (Optional)"
                        value={bookingData.meetingLink}
                        onChange={(e) => setBookingData({ ...bookingData, meetingLink: e.target.value })}
                        placeholder="Zoom, Google Meet, or other video call link"
                        helperText={`Optional - video call link (${bookingData.meetingLink?.length || 0}/500 characters)`}
                        inputProps={{ maxLength: 500 }}
                      />
                    </Grid>
                  )}

                  <Grid size={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Additional Notes (Optional)"
                      value={bookingData.notes}
                      onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                      placeholder="Any additional information you'd like to share..."
                      helperText={`Optional - additional notes (${bookingData.notes?.length || 0}/1000 characters)`}
                      inputProps={{ maxLength: 1000 }}
                    />
                  </Grid>
                </Grid>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack} startIcon={<ArrowBack />}>
                  Back
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                  disabled={!bookingData.reason}
                  sx={{ borderRadius: '15px' }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Step 4: Payment */}
        {activeStep === 3 && (
          <Fade in timeout={800}>
            <Box>
              <Card sx={{ borderRadius: '20px', mb: 4, p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Payment Information
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: '15px' }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Appointment Summary
                      </Typography>
                      <List>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <MedicalServices />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`Dr. ${selectedDoctor.user?.firstName || 'Unknown'} ${selectedDoctor.user?.lastName || 'Doctor'}`}
                            secondary={selectedDoctor.specialization}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary="Date & Time"
                            secondary={`${selectedDate?.toLocaleDateString()} at ${selectedTime?.toLocaleTimeString()}`}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary="Type"
                            secondary={appointmentType === 'in-person' ? 'In-Person Consultation' : 'Virtual Consultation'}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary="Duration"
                            secondary="30 minutes"
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: '15px' }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Payment Method
                      </Typography>
                      <FormControl component="fieldset">
                        <RadioGroup
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <FormControlLabel 
                            value="card" 
                            control={<Radio />} 
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CreditCard sx={{ mr: 1 }} />
                                Credit/Debit Card
                              </Box>
                            } 
                          />
                          <FormControlLabel 
                            value="insurance" 
                            control={<Radio />} 
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocalHospital sx={{ mr: 1 }} />
                                Insurance
                              </Box>
                            } 
                          />
                        </RadioGroup>
                      </FormControl>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                          Total Amount:
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          LKR ${selectedDoctor.consultationFee}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack} startIcon={<ArrowBack />}>
                  Back
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleSubmit}
                  startIcon={<CheckCircle />}
                  sx={{ borderRadius: '15px' }}
                >
                  Book Appointment
                </Button>
              </Box>
            </Box>
          </Fade>
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default BookAppointment;

