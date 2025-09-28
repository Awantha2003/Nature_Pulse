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
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Person,
  CalendarToday,
  LocationOn,
  HealthAndSafety,
  Assignment,
  LocalHospital,
  TrendingUp,
  CheckCircle,
  Warning,
  Info,
  ArrowBack,
  Refresh,
  Assessment,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const DoctorPatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [healthLogs, setHealthLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (id) {
      fetchPatientDetails();
    }
  }, [id]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch patient details
      const patientResponse = await api.get(`/users/patients/${id}`);
      if (patientResponse.data.status === 'success') {
        setPatient(patientResponse.data.data.patient);
      }

      // Fetch patient appointments
      const appointmentsResponse = await api.get(`/appointments?patient=${id}`);
      if (appointmentsResponse.data.status === 'success') {
        setAppointments(appointmentsResponse.data.data.appointments || []);
      }

      // Fetch health logs (if available)
      try {
        const healthResponse = await api.get(`/health-logs?patient=${id}`);
        if (healthResponse.data.status === 'success') {
          setHealthLogs(healthResponse.data.data.healthLogs || []);
        }
      } catch (healthError) {
        console.log('Health logs not available:', healthError);
      }

    } catch (err) {
      setError('Failed to fetch patient details');
      console.error('Fetch patient details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      case 'scheduled': return <CalendarToday />;
      case 'confirmed': return <CheckCircle />;
      case 'in-progress': return <LocalHospital />;
      case 'completed': return <CheckCircle />;
      case 'cancelled': return <Warning />;
      case 'no-show': return <Warning />;
      default: return <Info />;
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

  if (error || !patient) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Patient not found'}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/app/doctor/patients')}
        >
          Back to Patients
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Fade in timeout={800}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton
              onClick={() => navigate('/app/doctor/patients')}
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
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
                {patient.firstName} {patient.lastName}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Patient Profile & Health Records
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchPatientDetails} color="primary">
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Patient Overview Card */}
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 120, 
                        height: 120, 
                        fontSize: '3rem',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        border: '3px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      {patient.firstName?.[0]}{patient.lastName?.[0]}
                    </Avatar>
                  </Box>
                </Grid>
                <Grid item xs={12} md={9}>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {patient.firstName} {patient.lastName}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Chip
                      icon={patient.isActive ? <CheckCircle /> : <Warning />}
                      label={patient.isActive ? 'Active Patient' : 'Inactive Patient'}
                      color={patient.isActive ? 'success' : 'warning'}
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                    <Chip
                      icon={patient.isEmailVerified ? <CheckCircle /> : <Warning />}
                      label={patient.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
                      color={patient.isEmailVerified ? 'success' : 'warning'}
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        <strong>Email:</strong> {patient.email}
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        <strong>Phone:</strong> {patient.phone || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        <strong>Member Since:</strong> {formatDate(patient.createdAt)}
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        <strong>Last Login:</strong> {patient.lastLogin ? formatDate(patient.lastLogin) : 'Never'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
              <Tab icon={<Person />} label="Personal Info" />
              <Tab icon={<Assignment />} label="Appointments" />
              <Tab icon={<HealthAndSafety />} label="Health Records" />
              <Tab icon={<Assessment />} label="Analytics" />
            </Tabs>
          </Paper>

          {/* Tab Content */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Person sx={{ mr: 1 }} />
                      Personal Information
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Full Name"
                          secondary={`${patient.firstName} ${patient.lastName}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Email"
                          secondary={patient.email}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Phone"
                          secondary={patient.phone || 'Not provided'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Date of Birth"
                          secondary={patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'Not provided'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Gender"
                          secondary={patient.gender || 'Not specified'}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Info sx={{ mr: 1 }} />
                      Account Information
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Account Status"
                          secondary={
                            <Chip
                              icon={patient.isActive ? <CheckCircle /> : <Warning />}
                              label={patient.isActive ? 'Active' : 'Inactive'}
                              color={patient.isActive ? 'success' : 'warning'}
                              size="small"
                            />
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Email Verification"
                          secondary={
                            <Chip
                              icon={patient.isEmailVerified ? <CheckCircle /> : <Warning />}
                              label={patient.isEmailVerified ? 'Verified' : 'Not Verified'}
                              color={patient.isEmailVerified ? 'success' : 'warning'}
                              size="small"
                            />
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Member Since"
                          secondary={formatDate(patient.createdAt)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Last Login"
                          secondary={patient.lastLogin ? formatDate(patient.lastLogin) : 'Never'}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Assignment sx={{ mr: 1 }} />
                  Appointment History ({appointments.length})
                </Typography>
                {appointments.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CalendarToday sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No Appointments Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This patient hasn't had any appointments yet.
          </Typography>
        </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date & Time</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Reason</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appointments.map((appointment) => (
                          <TableRow key={appointment._id}>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(appointment.appointmentDate)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {appointment.appointmentTime}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={appointment.isVirtual ? <LocalHospital /> : <LocationOn />}
                                label={appointment.isVirtual ? 'Virtual' : 'In-Person'}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(appointment.status)}
                                label={appointment.status.replace('-', ' ').toUpperCase()}
                                color={getStatusColor(appointment.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {appointment.reason}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => navigate(`/app/doctor/appointments/${appointment._id}`)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <HealthAndSafety sx={{ mr: 1 }} />
                  Health Records
                </Typography>
                {healthLogs.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <HealthAndSafety sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No Health Records Found
        </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This patient hasn't logged any health data yet.
        </Typography>
      </Box>
                ) : (
                  <List>
                    {healthLogs.map((log, index) => (
                      <React.Fragment key={log._id || index}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <HealthAndSafety />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`Health Log - ${formatDate(log.date)}`}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Mood: {log.mood} | Energy: {log.energyLevel}
                                </Typography>
                                {log.notes && (
                                  <Typography variant="body2" color="text.secondary" noWrap>
                                    {log.notes}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < healthLogs.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUp sx={{ mr: 1 }} />
                      Appointment Statistics
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Total Appointments"
                          secondary={appointments.length}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Completed"
                          secondary={appointments.filter(a => a.status === 'completed').length}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Scheduled"
                          secondary={appointments.filter(a => a.status === 'scheduled').length}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Cancelled"
                          secondary={appointments.filter(a => a.status === 'cancelled').length}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Assessment sx={{ mr: 1 }} />
                      Health Activity
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Health Logs"
                          secondary={healthLogs.length}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Last Health Entry"
                          secondary={healthLogs.length > 0 ? formatDate(healthLogs[0].date) : 'None'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Account Age"
                          secondary={`${Math.floor((new Date() - new Date(patient.createdAt)) / (1000 * 60 * 60 * 24))} days`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Fade>
    </Container>
  );
};

export default DoctorPatientDetail;
