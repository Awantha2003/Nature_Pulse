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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
  Tooltip,
  Pagination,
  Tabs,
  Tab,
  Fade,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CalendarToday,
  Person,
  LocalHospital,
  AccessTime,
  Payment,
  Edit,
  Delete,
  Visibility,
  Search,
  Refresh,
  CheckCircle,
  Cancel,
  Schedule,
  Phone,
  Email,
  TrendingUp,
  Assessment
} from '@mui/icons-material';
import api from '../../utils/api';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today: 0
  });

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await api.get(`/appointments?${params}`);
      
      if (response.data.status === 'success') {
        setAppointments(response.data.data.appointments);
        setPagination(prev => ({
          ...prev,
          ...response.data.data.pagination
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await api.get('/appointments');
      if (response.data.status === 'success') {
        const allAppointments = response.data.data.appointments;
        const today = new Date().toISOString().split('T')[0];
        
        const statsData = {
          total: allAppointments.length,
          scheduled: allAppointments.filter(apt => apt.status === 'scheduled').length,
          confirmed: allAppointments.filter(apt => apt.status === 'confirmed').length,
          completed: allAppointments.filter(apt => apt.status === 'completed').length,
          cancelled: allAppointments.filter(apt => apt.status === 'cancelled').length,
          today: allAppointments.filter(apt => 
            new Date(apt.appointmentDate).toISOString().split('T')[0] === today
          ).length
        };
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchStats();
  }, [pagination.page, filters]);

  // Handle status update
  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}`, {
        status: newStatus
      });

      if (response.data.status === 'success') {
        setSuccess('Appointment status updated successfully');
        fetchAppointments();
        fetchStats();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment status');
    }
  };

  // Handle appointment deletion
  const handleDelete = async () => {
    try {
      const response = await api.delete(`/appointments/${appointmentToDelete}`);
      
      if (response.data.status === 'success') {
        setSuccess('Appointment deleted successfully');
        setDeleteOpen(false);
        setAppointmentToDelete(null);
        fetchAppointments();
        fetchStats();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete appointment');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'primary',
      confirmed: 'success',
      'in-progress': 'warning',
      completed: 'success',
      cancelled: 'error',
      'no-show': 'default'
    };
    return colors[status] || 'default';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const icons = {
      scheduled: <Schedule />,
      confirmed: <CheckCircle />,
      'in-progress': <AccessTime />,
      completed: <CheckCircle />,
      cancelled: <Cancel />,
      'no-show': <Cancel />
    };
    return icons[status] || <Schedule />;
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPagination(prev => ({ ...prev, page: value }));
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const statusMap = ['', 'scheduled', 'confirmed', 'completed', 'cancelled'];
    handleFilterChange('status', statusMap[newValue]);
  };

  return (
    <Container maxWidth="xl">
      <Fade in timeout={800}>
      <Box sx={{ py: 4 }}>
          {/* Header */}
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
              Appointment Management 📅
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Manage all platform appointments and consultations
            </Typography>
          </Box>

          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Assessment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Appointments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Schedule sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.scheduled}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Scheduled
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <CardContent>
                  <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.confirmed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Confirmed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <CardContent>
                  <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.completed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Cancel sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.cancelled}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cancelled
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <CardContent>
                  <CalendarToday sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.today}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Today
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters and Search */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Search"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    placeholder="Search by patient or doctor name..."
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      label="Status"
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="scheduled">Scheduled</MenuItem>
                      <MenuItem value="confirmed">Confirmed</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                      <MenuItem value="no-show">No Show</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filters.type}
                      label="Type"
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="consultation">Consultation</MenuItem>
                      <MenuItem value="follow-up">Follow-up</MenuItem>
                      <MenuItem value="emergency">Emergency</MenuItem>
                      <MenuItem value="routine">Routine</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => {
                      setFilters({
                        status: '',
                        type: '',
                        startDate: '',
                        endDate: '',
                        search: ''
                      });
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  >
                    Reset
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`All (${stats.total})`} />
              <Tab label={`Scheduled (${stats.scheduled})`} />
              <Tab label={`Confirmed (${stats.confirmed})`} />
              <Tab label={`Completed (${stats.completed})`} />
              <Tab label={`Cancelled (${stats.cancelled})`} />
            </Tabs>
          </Box>

          {/* Appointments Table */}
          <Card>
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Patient</TableCell>
                          <TableCell>Doctor</TableCell>
                          <TableCell>Date & Time</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Payment</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appointments.map((appointment) => (
                          <TableRow key={appointment._id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                  {appointment.patient?.firstName?.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2">
                                    {appointment.patient?.firstName} {appointment.patient?.lastName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {appointment.patient?.email}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                                  {appointment.doctor?.user?.firstName?.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2">
                                    Dr. {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {appointment.doctor?.specialization}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="subtitle2">
                                  {formatDate(appointment.appointmentDate)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatTime(appointment.appointmentTime)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={appointment.type}
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(appointment.status)}
                                label={appointment.status}
                                color={getStatusColor(appointment.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Payment sx={{ mr: 1, fontSize: 16 }} />
                                <Box>
                                  <Typography variant="subtitle2">
                                    ₹{appointment.payment?.amount}
                                  </Typography>
                                  <Chip
                                    label={appointment.payment?.status}
                                    size="small"
                                    color={appointment.payment?.status === 'paid' ? 'success' : 'warning'}
                                    variant="outlined"
                                  />
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedAppointment(appointment);
                                      setDetailsOpen(true);
                                    }}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Update Status">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      const newStatus = appointment.status === 'scheduled' ? 'confirmed' : 'completed';
                                      handleStatusUpdate(appointment._id, newStatus);
                                    }}
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setAppointmentToDelete(appointment._id);
                                      setDeleteOpen(true);
                                    }}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        count={pagination.totalPages}
                        page={pagination.page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                      />
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Appointment Details Dialog */}
          <Dialog
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarToday sx={{ mr: 2 }} />
                Appointment Details
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedAppointment && (
                <Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Patient Information
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <Person />
                          </ListItemIcon>
                          <ListItemText
                            primary="Name"
                            secondary={`${selectedAppointment.patient?.firstName} ${selectedAppointment.patient?.lastName}`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Email />
                          </ListItemIcon>
                          <ListItemText
                            primary="Email"
                            secondary={selectedAppointment.patient?.email}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Phone />
                          </ListItemIcon>
                          <ListItemText
                            primary="Phone"
                            secondary={selectedAppointment.patient?.phone}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Doctor Information
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <LocalHospital />
                          </ListItemIcon>
                          <ListItemText
                            primary="Name"
                            secondary={`Dr. ${selectedAppointment.doctor?.user?.firstName} ${selectedAppointment.doctor?.user?.lastName}`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <LocalHospital />
                          </ListItemIcon>
                          <ListItemText
                            primary="Specialization"
                            secondary={selectedAppointment.doctor?.specialization}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Email />
                          </ListItemIcon>
                          <ListItemText
                            primary="Email"
                            secondary={selectedAppointment.doctor?.user?.email}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Appointment Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Date: {formatDate(selectedAppointment.appointmentDate)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Time: {formatTime(selectedAppointment.appointmentTime)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Type: {selectedAppointment.type}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Status: {selectedAppointment.status}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">
                            Reason: {selectedAppointment.reason}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Virtual: {selectedAppointment.isVirtual ? 'Yes' : 'No'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Payment: ₹{selectedAppointment.payment?.amount} ({selectedAppointment.payment?.status})
                          </Typography>
                        </Grid>
                      </Grid>
                      {selectedAppointment.symptoms && selectedAppointment.symptoms.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Symptoms:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {selectedAppointment.symptoms.map((symptom, index) => (
                              <Chip key={index} label={symptom} size="small" />
                            ))}
                          </Box>
                        </Box>
                      )}
                      {selectedAppointment.notes && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Notes:
        </Typography>
                          <Typography variant="body2">
                            {selectedAppointment.notes}
        </Typography>
      </Box>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
          >
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this appointment? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button onClick={handleDelete} color="error" variant="contained">
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbars */}
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError(null)}
          >
            <Alert onClose={() => setError(null)} severity="error">
              {error}
            </Alert>
          </Snackbar>
          <Snackbar
            open={!!success}
            autoHideDuration={6000}
            onClose={() => setSuccess(null)}
          >
            <Alert onClose={() => setSuccess(null)} severity="success">
              {success}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
};

export default AdminAppointments;
