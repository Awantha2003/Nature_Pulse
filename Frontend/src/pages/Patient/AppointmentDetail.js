import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  Person,
  LocalHospital,
  VideoCall,
  LocationOn,
  Payment,
  Cancel,
  Edit,
  CheckCircle,
  Schedule,
  Error,
  Medication,
  Notes,
  Phone,
  Email
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const PatientAppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const statusColors = {
    scheduled: 'primary',
    confirmed: 'success',
    'in-progress': 'warning',
    completed: 'success',
    cancelled: 'error',
    'no-show': 'default'
  };

  const statusIcons = {
    scheduled: <Schedule />,
    confirmed: <CheckCircle />,
    'in-progress': <AccessTime />,
    completed: <CheckCircle />,
    cancelled: <Cancel />,
    'no-show': <Error />
  };

  useEffect(() => {
      fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/appointments/${id}`);
      
      if (response.data.status === 'success') {
        const appointmentData = response.data.data.appointment;
        
        // Validate that we have the required data
        if (!appointmentData) {
          setError('Appointment data not found');
          return;
        }
        
        // Check if doctor data is properly populated
        if (!appointmentData.doctor) {
          setError('Doctor information not found for this appointment');
          return;
        }
        
        setAppointment(appointmentData);
      } else {
        setError('Failed to load appointment data');
      }
    } catch (err) {
      console.error('Fetch appointment error:', err);
      if (err.response?.status === 404) {
        setError('Appointment not found');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this appointment');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch appointment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) return;

    try {
      setCancelling(true);
      const response = await api.put(`/appointments/${id}/cancel`, {
        reason: cancelReason
      });

      if (response.data.status === 'success') {
        setCancelDialogOpen(false);
        setCancelReason('');
        setSnackbar({
          open: true,
          message: 'Appointment cancelled successfully',
          severity: 'success'
        });
        fetchAppointment();
      }
    } catch (err) {
      console.error('Cancel appointment error:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to cancel appointment',
        severity: 'error'
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const canCancelAppointment = () => {
    if (!appointment) return false;
    
    const appointmentDate = new Date(appointment.appointmentDate);
    const appointmentTime = appointment.appointmentTime.split(':');
    appointmentDate.setHours(parseInt(appointmentTime[0]), parseInt(appointmentTime[1]));
    
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
    
    
    return hoursUntilAppointment > 5 && ['scheduled', 'confirmed'].includes(appointment.status);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={fetchAppointment} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Retry'}
            </Button>
            <Button variant="contained" onClick={() => navigate('/app/patient/appointments')}>
              Back to Appointments
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  if (!appointment) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">
            Appointment not found
        </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Appointment Details
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/app/patient/appointments')}
          >
            Back to Appointments
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ flexGrow: 1 }}>
                    Dr. {appointment.doctor?.user?.firstName || 'Unknown'} {appointment.doctor?.user?.lastName || 'Doctor'}
                  </Typography>
                  <Chip
                    icon={statusIcons[appointment.status]}
                    label={appointment.status.replace('-', ' ').toUpperCase()}
                    color={statusColors[appointment.status]}
                    size="large"
                  />
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="h6" gutterBottom>
                        Appointment Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <CalendarToday />
                          </ListItemIcon>
                          <ListItemText
                            primary="Date"
                            secondary={formatDate(appointment.appointmentDate)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <AccessTime />
                          </ListItemIcon>
                          <ListItemText
                            primary="Time"
                            secondary={formatTime(appointment.appointmentTime)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Person />
                          </ListItemIcon>
                          <ListItemText
                            primary="Type"
                            secondary={appointment.type}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            {appointment.isVirtual ? <VideoCall /> : <LocationOn />}
                          </ListItemIcon>
                          <ListItemText
                            primary="Location"
                            secondary={appointment.isVirtual ? 'Virtual Consultation' : (appointment.location?.address || 'Clinic Location')}
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="h6" gutterBottom>
                        Doctor Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <Person />
                          </ListItemIcon>
                          <ListItemText
                            primary="Name"
                            secondary={`Dr. ${appointment.doctor?.user?.firstName || 'Unknown'} ${appointment.doctor?.user?.lastName || 'Doctor'}`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <LocalHospital />
                          </ListItemIcon>
                          <ListItemText
                            primary="Specialization"
                            secondary={appointment.doctor?.specialization || 'Not specified'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Phone />
                          </ListItemIcon>
                          <ListItemText
                            primary="Phone"
                            secondary={appointment.doctor?.user?.phone || 'Not available'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Email />
                          </ListItemIcon>
                          <ListItemText
                            primary="Email"
                            secondary={appointment.doctor?.user?.email || 'Not available'}
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Appointment Details
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Reason:</strong> {appointment.reason}
                        </Typography>

                {appointment.symptoms && appointment.symptoms.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Symptoms:</strong>
                        </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {appointment.symptoms.map((symptom, index) => (
                        <Chip key={index} label={symptom} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}

                {appointment.notes && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Doctor's Notes:</strong>
                    </Typography>
                        <Typography variant="body2" color="text.secondary">
                      {appointment.notes}
                    </Typography>
                  </Box>
                )}

                {appointment.prescription && appointment.prescription.medications && appointment.prescription.medications.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      <Medication sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Prescription
                        </Typography>
                    {appointment.prescription.medications.map((medication, index) => (
                      <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {medication.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Dosage:</strong> {medication.dosage}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Frequency:</strong> {medication.frequency}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Duration:</strong> {medication.duration}
                        </Typography>
                        {medication.instructions && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Instructions:</strong> {medication.instructions}
                        </Typography>
                        )}
                      </Paper>
                    ))}
                    </Box>
                )}

                {appointment.prescription && appointment.prescription.recommendations && appointment.prescription.recommendations.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      <Notes sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Recommendations
                      </Typography>
                    <List>
                      {appointment.prescription.recommendations.map((recommendation, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={recommendation} />
                        </ListItem>
                      ))}
                    </List>
                    </Box>
                )}
              </CardContent>
            </Card>
        </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Consultation Fee</Typography>
                  <Typography variant="body2">${appointment.payment.amount}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6" color="primary">
                    ${appointment.payment.amount}
                  </Typography>
                </Box>

                <Chip
                  label={appointment.payment.status.toUpperCase()}
                  color={getPaymentStatusColor(appointment.payment.status)}
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {appointment.status === 'confirmed' && appointment.isVirtual && appointment.meetingLink && (
                      <Button
                        variant="contained"
                      startIcon={<VideoCall />}
                        fullWidth
                      href={appointment.meetingLink}
                      target="_blank"
                    >
                      Join Meeting
                      </Button>
                  )}
                  
                  {canCancelAppointment() ? (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      fullWidth
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      Cancel Appointment
                    </Button>
                  ) : (
                    <Box sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" align="center">
                        {appointment.status === 'cancelled' ? 'Appointment already cancelled' :
                         appointment.status === 'completed' ? 'Appointment completed' :
                         !['scheduled', 'confirmed'].includes(appointment.status) ? `Status: ${appointment.status}` :
                         'Cannot cancel (less than 5 hours away)'}
                      </Typography>
                    </Box>
                  )}
                  
                  {appointment.payment.status === 'pending' && (
                  <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Payment />}
                    fullWidth
                      href={`/app/appointments/${appointment._id}/payment`}
                  >
                      Pay Now
                  </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
      </Grid>

        {/* Cancel Appointment Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to cancel your appointment with{' '}
              <strong>Dr. {appointment?.doctor?.user?.firstName} {appointment?.doctor?.user?.lastName}</strong>{' '}
              on <strong>{appointment && formatDate(appointment.appointmentDate)}</strong>{' '}
              at <strong>{appointment && formatTime(appointment.appointmentTime)}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Note: You can only cancel appointments that are more than 5 hours away. This action cannot be undone.
            </Typography>
            <TextField
              fullWidth
              label="Reason for cancellation"
              multiline
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancelling this appointment..."
              sx={{ mt: 2 }}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCancelAppointment}
              color="error"
              variant="contained"
              disabled={!cancelReason.trim() || cancelling}
            >
              {cancelling ? <CircularProgress size={20} /> : 'Cancel Appointment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </Container>
  );
};

export default PatientAppointmentDetail;