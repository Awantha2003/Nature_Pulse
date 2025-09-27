import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Pagination,
  Tooltip
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  Person,
  LocalHospital,
  Payment,
  Cancel,
  Edit,
  VideoCall,
  Phone,
  LocationOn,
  CheckCircle,
  Schedule,
  Error
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const statusTabs = [
    { label: 'All', value: 'all' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

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
    fetchAppointments();
  }, [selectedTab, page]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      let statusFilter = '';
      if (selectedTab === 1) statusFilter = 'scheduled,confirmed';
      else if (selectedTab === 2) statusFilter = 'completed';
      else if (selectedTab === 3) statusFilter = 'cancelled';

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await api.get(`/appointments?${params}`);
      
      if (response.data.status === 'success') {
        setAppointments(response.data.data.appointments);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalAppointments(response.data.data.pagination.totalAppointments);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !cancelReason.trim()) return;

    try {
      setCancelling(true);
      const response = await api.put(`/appointments/${selectedAppointment._id}/cancel`, {
        reason: cancelReason
      });

      if (response.data.status === 'success') {
        setCancelDialogOpen(false);
        setCancelReason('');
        setSelectedAppointment(null);
        fetchAppointments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const canCancelAppointment = (appointment) => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const appointmentTime = appointment.appointmentTime.split(':');
    appointmentDate.setHours(parseInt(appointmentTime[0]), parseInt(appointmentTime[1]));
    
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
    
    return hoursUntilAppointment > 24 && ['scheduled', 'confirmed'].includes(appointment.status);
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

  const getAppointmentTypeIcon = (type, isVirtual) => {
    if (isVirtual) return <VideoCall />;
    if (type === 'emergency') return <LocalHospital />;
    return <Person />;
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Appointments
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage your appointments and view your medical history
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
              {statusTabs.map((tab, index) => (
                <Tab key={index} label={tab.label} />
              ))}
            </Tabs>
          </Box>

          <CardContent>
            {appointments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No appointments found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTab === 0 ? 'You don\'t have any appointments yet.' : 
                   `You don't have any ${statusTabs[selectedTab].label.toLowerCase()} appointments.`}
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {appointments.map((appointment) => (
                  <Grid size={{ xs: 12 }} key={appointment._id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, md: 8 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              {getAppointmentTypeIcon(appointment.type, appointment.isVirtual)}
                              <Typography variant="h6" sx={{ ml: 1 }}>
                                {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
                              </Typography>
                              <Chip
                                icon={statusIcons[appointment.status]}
                                label={appointment.status.replace('-', ' ').toUpperCase()}
                                color={statusColors[appointment.status]}
                                size="small"
                                sx={{ ml: 2 }}
                              />
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {appointment.doctor.specialization}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <CalendarToday fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {formatDate(appointment.appointmentDate)}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AccessTime fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {formatTime(appointment.appointmentTime)}
                              </Typography>
                            </Box>

                            {appointment.isVirtual ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <VideoCall fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">Virtual Consultation</Typography>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LocationOn fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  {appointment.location?.address || 'Clinic Location'}
                                </Typography>
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Payment fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                ${appointment.payment.amount} - 
                              </Typography>
                              <Chip
                                label={appointment.payment.status.toUpperCase()}
                                color={getPaymentStatusColor(appointment.payment.status)}
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                              Reason: {appointment.reason}
                            </Typography>
                          </Grid>

                          <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {appointment.status === 'confirmed' && appointment.isVirtual && (
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

                              {canCancelAppointment(appointment) && (
                                <Button
                                  variant="outlined"
                                  color="error"
                                  startIcon={<Cancel />}
                                  fullWidth
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setCancelDialogOpen(true);
                                  }}
                                >
                                  Cancel
                                </Button>
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
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Cancel Appointment Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Cancel Appointment</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Are you sure you want to cancel this appointment? This action cannot be undone.
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
      </Box>
    </Container>
  );
};

export default Appointments;
