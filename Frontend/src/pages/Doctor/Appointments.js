import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Fade,
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
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  CalendarToday,
  Person,
  AccessTime,
  CheckCircle,
  Pending,
  Cancel,
  VideoCall,
  LocationOn,
  Notifications,
  Refresh,
  FilterList,
  ViewList,
  Schedule,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const DoctorAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'table'
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAppointments();
    fetchUnreadCount();
  }, [statusFilter]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      if (response.data.status === 'success') {
        setUnreadCount(response.data.data.count || 0);
      }
    } catch (err) {
      console.error('Fetch unread count error:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await api.get(`/appointments?${params}`);
      if (response.data.status === 'success') {
        setAppointments(response.data.data.appointments || []);
      } else {
        setError('Failed to fetch appointments');
      }
    } catch (err) {
      setError('Failed to fetch appointments');
      console.error('Fetch appointments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'warning';
      case 'confirmed': return 'info';
      case 'in-progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'no-show': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Pending />;
      case 'confirmed': return <CheckCircle />;
      case 'in-progress': return <AccessTime />;
      case 'completed': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      case 'no-show': return <Cancel />;
      default: return <Schedule />;
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

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}`, {
        status: newStatus
      });
      
      if (response.data.status === 'success') {
        // Update the appointment in the local state
        setAppointments(prev => 
          prev.map(apt => 
            apt._id === appointmentId 
              ? { ...apt, status: newStatus }
              : apt
          )
        );
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
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

  return (
    <Container maxWidth="lg">
      <Fade in timeout={800}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
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
                Manage your patient appointments and consultations
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Tooltip title="Notifications">
                <IconButton color="primary">
                  <Badge badgeContent={unreadCount} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton onClick={() => {
                  fetchAppointments();
                  fetchUnreadCount();
                }} color="primary">
                  <Refresh />
                </IconButton>
              </Tooltip>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>
      </Fade>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {appointments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CalendarToday sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No Appointments Found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {statusFilter === 'all' 
              ? 'You don\'t have any appointments yet.' 
              : `No appointments with status "${statusFilter}" found.`
            }
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {appointments.map((appointment) => (
            <Grid size={{ xs: 12, md: 6 }} key={appointment._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {appointment.patient?.firstName?.[0]}{appointment.patient?.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Patient
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      icon={getStatusIcon(appointment.status)}
                      label={appointment.status.replace('-', ' ').toUpperCase()}
                      color={getStatusColor(appointment.status)}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <CalendarToday />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Date"
                        secondary={formatDate(appointment.appointmentDate)}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <AccessTime />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Time"
                        secondary={formatTime(appointment.appointmentTime)}
                      />
                    </ListItem>

                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          {appointment.isVirtual ? <VideoCall /> : <LocationOn />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Type"
                        secondary={appointment.isVirtual ? 'Virtual Consultation' : 'In-Person'}
                      />
                    </ListItem>

                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Reason"
                        secondary={appointment.reason}
                      />
                    </ListItem>
                  </List>

                  {appointment.symptoms && appointment.symptoms.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Symptoms:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {appointment.symptoms.map((symptom, index) => (
                          <Chip
                            key={index}
                            label={symptom}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {appointment.status === 'scheduled' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                      >
                        Confirm
                      </Button>
                    )}
                    {appointment.status === 'confirmed' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleStatusUpdate(appointment._id, 'in-progress')}
                      >
                        Start
                      </Button>
                    )}
                    {appointment.status === 'in-progress' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      href={`/app/doctor/appointments/${appointment._id}`}
                    >
                      View Details
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default DoctorAppointments;