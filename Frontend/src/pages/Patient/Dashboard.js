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
} from '@mui/material';
import { 
  CalendarToday, 
  HealthAndSafety, 
  TrendingUp,
  LocalHospital,
  Assignment,
  ShoppingCart,
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

const PatientDashboard = () => {
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
      const response = await api.get('/users/dashboard/patient');
      setDashboardData(response.data.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic data based on actual health logs
  const generateHealthTrendsData = () => {
    if (!dashboardData?.recentHealthLogs || dashboardData.recentHealthLogs.length === 0) {
      // Generate sample data if no real data available
      const last7Days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        last7Days.push({
          date: date.toISOString().split('T')[0],
          energy: Math.floor(Math.random() * 4) + 6, // 6-10
          mood: Math.floor(Math.random() * 4) + 6, // 6-10
          sleep: Math.floor(Math.random() * 3) + 6, // 6-9
          exercise: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
        });
      }
      
      return last7Days;
    }
    
    // Use actual health log data
    return dashboardData.recentHealthLogs.map(log => ({
      date: new Date(log.createdAt).toISOString().split('T')[0],
      energy: log.energyLevel || 0,
      mood: log.mood || 0,
      sleep: log.sleepHours || 0,
      exercise: log.exerciseMinutes || 0,
    }));
  };

  const generateGoalProgressData = () => {
    if (!dashboardData?.dashboard) {
      return [
        { name: 'Exercise', value: 0, color: '#4CAF50' },
        { name: 'Sleep', value: 0, color: '#2196F3' },
        { name: 'Nutrition', value: 0, color: '#FF9800' },
        { name: 'Meditation', value: 0, color: '#9C27B0' },
      ];
    }
    
    const healthStreak = dashboardData.dashboard.healthStreak || 0;
    const totalHealthLogs = dashboardData.dashboard.totalHealthLogs || 0;
    
    // Calculate progress based on health streak and total logs
    const exerciseProgress = Math.min(100, (healthStreak * 10) + (totalHealthLogs * 2));
    const sleepProgress = Math.min(100, (healthStreak * 12) + (totalHealthLogs * 3));
    const nutritionProgress = Math.min(100, (healthStreak * 8) + (totalHealthLogs * 2));
    const meditationProgress = Math.min(100, (healthStreak * 6) + (totalHealthLogs * 1));
    
    return [
      { name: 'Exercise', value: Math.round(exerciseProgress), color: '#4CAF50' },
      { name: 'Sleep', value: Math.round(sleepProgress), color: '#2196F3' },
      { name: 'Nutrition', value: Math.round(nutritionProgress), color: '#FF9800' },
      { name: 'Meditation', value: Math.round(meditationProgress), color: '#9C27B0' },
    ];
  };

  const healthTrendsData = generateHealthTrendsData();
  const goalProgressData = generateGoalProgressData();

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
  const upcomingAppointments = dashboardData?.upcomingAppointments || [];
  const recentHealthLogs = dashboardData?.recentHealthLogs || [];

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
            Welcome back, {user?.firstName || 'Patient'}! 👋
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Here's your personalized health overview and insights
          </Typography>
        </Box>
      </Fade>

      {/* Health Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  <FitnessCenter sx={{ fontSize: 40 }} />
                  <Chip 
                    label={`${dashboard.healthStreak || 0} days`} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Health Streak
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Keep up the great work! 🔥
                </Typography>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  <TrendingUp sx={{ fontSize: 40 }} />
                  <Chip 
                    label={`${dashboard.avgEnergy || 0}/10`} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Avg Energy
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Last 7 days average
                </Typography>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  <CalendarToday sx={{ fontSize: 40 }} />
                  <Badge badgeContent={dashboard.upcomingAppointments || 0} color="error">
                    <Schedule sx={{ fontSize: 24 }} />
                  </Badge>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Appointments
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Upcoming bookings
                </Typography>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  <Assessment sx={{ fontSize: 40 }} />
                  <Chip 
                    label={`${dashboard.totalHealthLogs || 0} logs`} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Health Logs
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total entries
                </Typography>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      {/* Health Trends Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Slide direction="up" in timeout={1000}>
            <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Health Trends (7 Days)
                  </Typography>
                  <Chip 
                    icon={<Timeline />} 
                    label="Real-time" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={healthTrendsData}>
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
                      <Area 
                        type="monotone" 
                        dataKey="energy" 
                        stackId="1" 
                        stroke="#4CAF50" 
                        fill="#4CAF50" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="mood" 
                        stackId="2" 
                        stroke="#2196F3" 
                        fill="#2196F3" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sleep" 
                        stackId="3" 
                        stroke="#FF9800" 
                        fill="#FF9800" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
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
                  Goal Progress
                </Typography>
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {goalProgressData.map((goal, index) => (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {goal.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {goal.value}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={goal.value} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: goal.color,
                            borderRadius: 4,
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
      </Grid>

      {/* Upcoming Appointments & Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Slide direction="up" in timeout={1400}>
            <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Upcoming Appointments
                  </Typography>
                  <IconButton onClick={() => navigate('/app/patient/appointments')}>
                    <CalendarToday />
                  </IconButton>
                </Box>
                
                {upcomingAppointments.length > 0 ? (
                  <List>
                    {upcomingAppointments.map((appointment, index) => (
                      <React.Fragment key={index}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <LocalHospital />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`Dr. ${appointment.doctor?.user?.firstName} ${appointment.doctor?.user?.lastName}`}
                            secondary={
                              <span>
                                <span style={{ display: 'block', color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>
                                  {appointment.doctor?.specialization}
                                </span>
                                <span style={{ display: 'block', color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem' }}>
                                  {new Date(appointment.appointmentDate).toLocaleDateString()} at {new Date(appointment.appointmentDate).toLocaleTimeString()}
                                </span>
                              </span>
                            }
                          />
                          <Chip 
                            label={appointment.status} 
                            size="small" 
                            color={appointment.status === 'confirmed' ? 'success' : 'warning'}
                          />
                        </ListItem>
                        {index < upcomingAppointments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CalendarToday sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No upcoming appointments
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => navigate('/app/patient/appointments')}
                      sx={{ borderRadius: '25px' }}
                    >
                      Book Appointment
                    </Button>
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
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Quick Actions
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<HealthAndSafety />}
                      onClick={() => navigate('/app/patient/health')}
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
                      Log Health
                    </Button>
                  </Grid>
                  <Grid size={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Assignment />}
                      onClick={() => navigate('/app/patient/edrc')}
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
                      EDRC Reports
                    </Button>
                  </Grid>
                  <Grid size={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<ShoppingCart />}
                      onClick={() => navigate('/app/patient/shop')}
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
                      Shop Products
                    </Button>
                  </Grid>
                  <Grid size={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Person />}
                      onClick={() => navigate('/app/patient/profile')}
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
        aria-label="add health log"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
          }
        }}
        onClick={() => navigate('/app/patient/health')}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default PatientDashboard;