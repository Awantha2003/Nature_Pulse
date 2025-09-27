import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button,
  Paper,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  Fab,
  Tooltip,
  CircularProgress,
  Alert,
  Stack,
  Badge,
  Fade,
  Zoom,
  Slide,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { 
  CalendarToday, 
  HealthAndSafety, 
  TrendingUp,
  LocalHospital,
  Assignment,
  People,
  Add,
  TrendingDown,
  TrendingFlat,
  AccessTime,
  CheckCircle,
  Warning,
  Info,
  Person,
  Schedule,
  Assessment,
  FitnessCenter,
  Psychology,
  Bedtime,
  Restaurant,
  Notifications,
  Star,
  Timeline,
  RateReview,
  PendingActions,
  Group,
  MedicalServices,
  Analytics,
  Today,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Add Chatbase chatbot script
  useEffect(() => {
    const script = document.createElement('script');
    script.innerHTML = `
      (function(){if(!window.chatbase||window.chatbase("getState")!=="initialized"){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");script.src="https://www.chatbase.co/embed.min.js";script.id="FpVaxNMtKpentZtx4X61X";script.domain="www.chatbase.co";document.body.appendChild(script)};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();
    `;
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove the script when component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/dashboard/doctor');
      setDashboardData(response.data.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic data based on actual appointment data
  const generateAppointmentTrendsData = () => {
    if (!dashboardData?.dashboard) {
      // Generate sample data if no real data available
      const last7Days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const appointments = Math.floor(Math.random() * 8) + 5; // 5-12 appointments
        const completed = Math.floor(appointments * 0.9); // 90% completion rate
        const cancelled = appointments - completed;
        
        last7Days.push({
          date: date.toISOString().split('T')[0],
          appointments,
          completed,
          cancelled,
        });
      }
      
      return last7Days;
    }
    
    // Use actual appointment data
    const todayAppointments = dashboardData.dashboard.todayAppointments || 0;
    const totalAppointments = dashboardData.dashboard.totalAppointments || 0;
    
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate daily appointments based on current data
      const dailyAppointments = Math.floor(totalAppointments / 7) + Math.floor(Math.random() * 3);
      const completed = Math.floor(dailyAppointments * 0.9);
      const cancelled = dailyAppointments - completed;
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        appointments: dailyAppointments,
        completed,
        cancelled,
      });
    }
    
    return last7Days;
  };

  const generatePatientAgeDistribution = () => {
    if (!dashboardData?.dashboard) {
      return [
        { name: '18-30', value: 0, color: '#4CAF50' },
        { name: '31-45', value: 0, color: '#2196F3' },
        { name: '46-60', value: 0, color: '#FF9800' },
        { name: '60+', value: 0, color: '#9C27B0' },
      ];
    }
    
    const totalPatients = dashboardData.dashboard.totalPatients || 0;
    
    // Simulate age distribution based on total patients
    const age18_30 = Math.floor(totalPatients * 0.25);
    const age31_45 = Math.floor(totalPatients * 0.35);
    const age46_60 = Math.floor(totalPatients * 0.30);
    const age60Plus = totalPatients - age18_30 - age31_45 - age46_60;
    
    return [
      { name: '18-30', value: age18_30, color: '#4CAF50' },
      { name: '31-45', value: age31_45, color: '#2196F3' },
      { name: '46-60', value: age46_60, color: '#FF9800' },
      { name: '60+', value: age60Plus, color: '#9C27B0' },
    ];
  };

  const appointmentTrendsData = generateAppointmentTrendsData();
  const patientAgeDistribution = generatePatientAgeDistribution();

  const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];

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

  const dashboard = dashboardData?.dashboard || {};
  const todayAppointments = dashboardData?.todayAppointments || [];
  const pendingRequests = dashboardData?.pendingRequests || [];
  const recentPatients = dashboardData?.recentPatients || [];
  const followUpsDue = dashboardData?.followUpsDue || [];

  return (
    <Container maxWidth="xl">
      {/* Welcome Header */}
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
            Good day, Dr. {user?.firstName || 'Doctor'}! 👨‍⚕️
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Here's your practice overview and patient management dashboard
          </Typography>
        </Box>
      </Fade>

      {/* Practice Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6 }} md={3}>
          <Zoom in timeout={1000}>
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
                color: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                },
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Today sx={{ fontSize: 40 }} />
                  <Badge badgeContent={dashboard.todayAppointments || 0} color="error">
                    <Schedule sx={{ fontSize: 24 }} />
                  </Badge>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Today's Schedule
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Appointments scheduled
                </Typography>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }} md={3}>
          <Zoom in timeout={1200}>
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
                color: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                },
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <PendingActions sx={{ fontSize: 40 }} />
                  <Badge badgeContent={dashboard.pendingRequests || 0} color="warning">
                    <Notifications sx={{ fontSize: 24 }} />
                  </Badge>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Pending Requests
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Awaiting approval
                </Typography>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }} md={3}>
          <Zoom in timeout={1400}>
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
                color: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                },
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Star sx={{ fontSize: 40 }} />
                  <Chip 
                    label={`${dashboard.avgRating || 0}/5`} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Average Rating
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {dashboard.totalReviews || 0} reviews
                </Typography>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }} md={3}>
          <Zoom in timeout={1600}>
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
                color: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                },
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Group sx={{ fontSize: 40 }} />
                  <Chip 
                    label={`${dashboard.totalPatients || 0} patients`} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Total Patients
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Active patients
                </Typography>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Slide direction="up" in timeout={1000}>
            <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Appointment Trends (7 Days)
                  </Typography>
                  <Chip 
                    icon={<Analytics />} 
                    label="Analytics" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#666" />
                      <YAxis stroke="#666" />
                      <RechartsTooltip 
                        contentStyle={{ 
                          borderRadius: '10px',
                          border: 'none',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar dataKey="appointments" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" fill="#2196F3" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cancelled" fill="#f44336" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Slide direction="up" in timeout={1200}>
            <Card sx={{ borderRadius: '20px', overflow: 'hidden', height: '100%' }}>
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Patient Age Distribution
                </Typography>
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Box sx={{ height: 250, mb: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={patientAgeDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {patientAgeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box>
                    {patientAgeDistribution.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            backgroundColor: item.color, 
                            borderRadius: '50%', 
                            mr: 1 
                          }} 
                        />
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.value}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
      </Grid>

      {/* Today's Appointments & Pending Requests */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Slide direction="up" in timeout={1400}>
            <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Today's Appointments
                  </Typography>
                  <IconButton onClick={() => navigate('/app/doctor/appointments')}>
                    <CalendarToday />
                  </IconButton>
                </Box>
                
                {todayAppointments.length > 0 ? (
                  <List>
                    {todayAppointments.map((appointment, index) => (
                      <React.Fragment key={index}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <Person />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${appointment.patient?.firstName} ${appointment.patient?.lastName}`}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(appointment.appointmentDate).toLocaleTimeString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {appointment.reason || 'General consultation'}
                                </Typography>
                              </Box>
                            }
                          />
                          <Chip 
                            label={appointment.status} 
                            size="small" 
                            color={appointment.status === 'confirmed' ? 'success' : 'warning'}
                          />
                        </ListItem>
                        {index < todayAppointments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CalendarToday sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No appointments today
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enjoy your free day!
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Slide>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Slide direction="up" in timeout={1600}>
            <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Pending Requests
                  </Typography>
                  <Badge badgeContent={pendingRequests.length} color="error">
                    <PendingActions />
                  </Badge>
                </Box>
                
                {pendingRequests.length > 0 ? (
                  <List>
                    {pendingRequests.map((request, index) => (
                      <React.Fragment key={index}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'warning.main' }}>
                              <Person />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${request.patient?.firstName} ${request.patient?.lastName}`}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(request.appointmentDate).toLocaleDateString()} at {new Date(request.appointmentDate).toLocaleTimeString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {request.reason || 'General consultation'}
                                </Typography>
                              </Box>
                            }
                          />
                          <Box>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="success"
                              sx={{ mr: 1, borderRadius: '15px' }}
                            >
                              Accept
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error"
                              sx={{ borderRadius: '15px' }}
                            >
                              Decline
                            </Button>
                          </Box>
                        </ListItem>
                        {index < pendingRequests.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      All caught up!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No pending appointment requests
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Slide>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={12}>
          <Slide direction="up" in timeout={1800}>
            <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Quick Actions
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<People />}
                      onClick={() => navigate('/app/doctor/patients')}
                      sx={{ 
                        borderRadius: '15px', 
                        py: 2,
                        borderColor: '#4CAF50',
                        color: '#4CAF50',
                        '&:hover': {
                          borderColor: '#4CAF50',
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        }
                      }}
                    >
                      Manage Patients
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<CalendarToday />}
                      onClick={() => navigate('/app/doctor/appointments')}
                      sx={{ 
                        borderRadius: '15px', 
                        py: 2,
                        borderColor: '#2196F3',
                        color: '#2196F3',
                        '&:hover': {
                          borderColor: '#2196F3',
                          backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        }
                      }}
                    >
                      Appointments
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Assignment />}
                      onClick={() => navigate('/app/doctor/edrc')}
                      sx={{ 
                        borderRadius: '15px', 
                        py: 2,
                        borderColor: '#FF9800',
                        color: '#FF9800',
                        '&:hover': {
                          borderColor: '#FF9800',
                          backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        }
                      }}
                    >
                      EDRC Reports
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Person />}
                      onClick={() => navigate('/app/doctor/profile')}
                      sx={{ 
                        borderRadius: '15px', 
                        py: 2,
                        borderColor: '#9C27B0',
                        color: '#9C27B0',
                        '&:hover': {
                          borderColor: '#9C27B0',
                          backgroundColor: 'rgba(156, 39, 176, 0.1)',
                        }
                      }}
                    >
                      Profile
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add appointment"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
          }
        }}
        onClick={() => navigate('/app/doctor/appointments')}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default DoctorDashboard;