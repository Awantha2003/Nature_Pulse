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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
  Email,
  Save,
  Add
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const DoctorAppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState({
    medications: [],
    recommendations: [],
    followUpDate: '',
    notes: ''
  });

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
      const response = await api.get(`/appointments/${id}`);
      
      if (response.data.status === 'success') {
        setAppointment(response.data.data.appointment);
        setNotes(response.data.data.appointment.notes || '');
        setPrescription(response.data.data.appointment.prescription || {
          medications: [],
          recommendations: [],
          followUpDate: '',
          notes: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointment = async () => {
    try {
      setSaving(true);
      setError(null);

      const updateData = {
        notes,
        prescription
      };

      const response = await api.put(`/appointments/${id}`, updateData);
      
      if (response.data.status === 'success') {
        setAppointment(response.data.data.appointment);
        setSuccess('Appointment updated successfully');
        setEditDialogOpen(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setSaving(true);
      const response = await api.put(`/appointments/${id}`, { status: newStatus });
      
      if (response.data.status === 'success') {
        setAppointment(response.data.data.appointment);
        setSuccess('Appointment status updated successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment status');
    } finally {
      setSaving(false);
    }
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
          <Button variant="contained" onClick={() => navigate('/app/doctor/appointments')}>
            Back to Appointments
          </Button>
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
            onClick={() => navigate('/app/doctor/appointments')}
          >
            Back to Appointments
          </Button>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ flexGrow: 1 }}>
                    {appointment.patient.firstName} {appointment.patient.lastName}
                  </Typography>
                  <Chip
                    icon={statusIcons[appointment.status]}
                    label={appointment.status.replace('-', ' ').toUpperCase()}
                    color={statusColors[appointment.status]}
                    size="large"
                  />
                </Box>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
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

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="h6" gutterBottom>
                        Patient Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <Person />
                          </ListItemIcon>
                          <ListItemText
                            primary="Name"
                            secondary={`${appointment.patient.firstName} ${appointment.patient.lastName}`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Phone />
                          </ListItemIcon>
                          <ListItemText
                            primary="Phone"
                            secondary={appointment.patient.phone}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Email />
                          </ListItemIcon>
                          <ListItemText
                            primary="Email"
                            secondary={appointment.patient.email}
                          />
                        </ListItem>
                        {appointment.patient.dateOfBirth && (
                          <ListItem>
                            <ListItemIcon>
                              <CalendarToday />
                            </ListItemIcon>
                            <ListItemText
                              primary="Date of Birth"
                              secondary={new Date(appointment.patient.dateOfBirth).toLocaleDateString()}
                            />
                          </ListItem>
                        )}
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
                      <strong>Notes:</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {appointment.notes}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Update Status</InputLabel>
                    <Select
                      value={appointment.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={saving}
                    >
                      <MenuItem value="scheduled">Scheduled</MenuItem>
                      <MenuItem value="confirmed">Confirmed</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                      <MenuItem value="no-show">No Show</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    fullWidth
                    onClick={() => setEditDialogOpen(true)}
                  >
                    Add Notes & Prescription
                  </Button>

                  {appointment.status === 'confirmed' && appointment.isVirtual && appointment.meetingLink && (
                    <Button
                      variant="outlined"
                      startIcon={<VideoCall />}
                      fullWidth
                      href={appointment.meetingLink}
                      target="_blank"
                    >
                      Join Meeting
                    </Button>
                  )}
                </Box>

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
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Edit Appointment Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Add Notes & Prescription</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mb: 3, mt: 1 }}
            />

            <TextField
              fullWidth
              label="Prescription Notes"
              multiline
              rows={3}
              value={prescription.notes}
              onChange={(e) => setPrescription({ ...prescription, notes: e.target.value })}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateAppointment}
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default DoctorAppointmentDetail;