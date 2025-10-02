import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Fade,
  Zoom,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material';
import {
  CalendarToday,
  Person,
  MedicalServices,
  Schedule,
  CheckCircle,
  Cancel,
  Add,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const PatientAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelDialog, setCancelDialog] = useState({ open: false, appointment: null });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      setAppointments(response.data.data.appointments);
    } catch (err) {
      setError('Failed to load appointments');
      console.error('Appointments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    // Handle time string format (HH:MM)
    if (typeof timeString === 'string' && timeString.includes(':')) {
      return timeString;
    }
    // Fallback for date string
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canCancelAppointment = (appointment) => {
    const now = new Date();
    const appointmentDateTime = new Date(appointment.appointmentDate);
    const [hours, minutes] = appointment.appointmentTime.split(':');
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);
    
    return hoursUntilAppointment > 5 && ['scheduled', 'confirmed'].includes(appointment.status);
  };

  const handleCancelClick = (appointment) => {
    setCancelDialog({ open: true, appointment });
    setCancelReason('');
  };

  const handleCancelConfirm = async () => {
    if (!cancelDialog.appointment) return;
    
    setCancelling(true);
    try {
      await api.put(`/appointments/${cancelDialog.appointment._id}/cancel`, {
        reason: cancelReason || 'No reason provided'
      });
      
      setSnackbar({
        open: true,
        message: 'Appointment cancelled successfully',
        severity: 'success'
      });
      
      // Refresh appointments
      fetchAppointments();
      
      setCancelDialog({ open: false, appointment: null });
      setCancelReason('');
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

  const handleCancelDialogClose = () => {
    setCancelDialog({ open: false, appointment: null });
    setCancelReason('');
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
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
    <Container maxWidth="lg">
      <Fade in timeout={800}>
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            My Appointments 📅
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage your healthcare appointments and consultations
          </Typography>
        </Box>
      </Fade>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Upcoming Appointments
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/app/patient/appointments/book')}
          sx={{ borderRadius: '15px' }}
        >
          Book New Appointment
        </Button>
      </Box>

      {appointments.length > 0 ? (
        <Grid container spacing={3}>
          {appointments.map((appointment, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={appointment._id}>
              <Zoom in timeout={1000 + index * 200}>
                <Card 
                  sx={{ 
                    borderRadius: '20px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={appointment.doctor?.profileImage ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${appointment.doctor.profileImage}` : ''}
                          sx={{ mr: 2, width: 50, height: 50 }}
                        >
                          <MedicalServices />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.doctor?.specialization}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={appointment.status}
                        color={getStatusColor(appointment.status)}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarToday sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(appointment.appointmentDate)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Schedule sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatTime(appointment.appointmentTime)}
                        </Typography>
                      </Box>
                      {appointment.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          <strong>Notes:</strong> {appointment.notes}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/app/patient/appointments/${appointment._id}`)}
                        sx={{ borderRadius: '15px', flex: 1 }}
                      >
                        View Details
                      </Button>
                      {canCancelAppointment(appointment) && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Cancel />}
                          onClick={() => handleCancelClick(appointment)}
                          sx={{ borderRadius: '15px' }}
                        >
                          Cancel
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CalendarToday sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No Appointments Scheduled
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You don't have any upcoming appointments. Book your first appointment to get started.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/app/patient/appointments/book')}
            sx={{ borderRadius: '15px' }}
          >
            Book Your First Appointment
          </Button>
        </Box>
      )}

      {/* Cancel Appointment Dialog */}
      <Dialog
        open={cancelDialog.open}
        onClose={handleCancelDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Cancel Appointment
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to cancel your appointment with{' '}
            <strong>
              Dr. {cancelDialog.appointment?.doctor?.user?.firstName}{' '}
              {cancelDialog.appointment?.doctor?.user?.lastName}
            </strong>{' '}
            on{' '}
            <strong>
              {cancelDialog.appointment && formatDate(cancelDialog.appointment.appointmentDate)}
            </strong>{' '}
            at{' '}
            <strong>
              {cancelDialog.appointment && formatTime(cancelDialog.appointment.appointmentTime)}
            </strong>
            ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Note: You can only cancel appointments that are more than 5 hours away.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Please provide a reason for cancelling this appointment..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialogClose} disabled={cancelling}>
            Keep Appointment
          </Button>
          <Button
            onClick={handleCancelConfirm}
            color="error"
            variant="contained"
            disabled={cancelling}
            startIcon={cancelling ? <CircularProgress size={16} /> : <Cancel />}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
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
    </Container>
  );
};

export default PatientAppointments;