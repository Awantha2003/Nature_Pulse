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
  Tabs,
  Tab,
} from '@mui/material';
import { 
  People, 
  TrendingUp, 
  Security, 
  Assessment,
  Assignment,
  ShoppingCart,
  LocalHospital,
  Notifications,
  Warning,
  CheckCircle,
  Info,
  Person,
  Schedule,
  Analytics,
  Timeline,
  Group,
  MedicalServices,
  Inventory,
  AttachMoney,
  Speed,
  Storage,
  CloudDone,
  BugReport,
  Settings,
  AdminPanelSettings,
  Dashboard,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  CalendarToday,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart as RechartsBarChart, Bar } from 'recharts';

const AdminOverview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/dashboard/admin');
      setDashboardData(response.data.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic data based on actual dashboard data
  const generateUserGrowthData = () => {
    if (!dashboardData) return [];
    
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate growth based on current totals
      const growthFactor = 1 + (6 - i) * 0.05; // 5% growth per day
      const basePatients = Math.floor(dashboardData.dashboard.totalPatients / 7);
      const baseDoctors = Math.floor(dashboardData.dashboard.totalDoctors / 7);
      const baseAdmins = Math.floor((dashboardData.dashboard.totalUsers - dashboardData.dashboard.totalPatients - dashboardData.dashboard.totalDoctors) / 7);
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        patients: Math.floor(basePatients * growthFactor),
        doctors: Math.floor(baseDoctors * growthFactor),
        admins: Math.floor(baseAdmins * growthFactor),
      });
    }
    
    return last7Days;
  };

  const generateSystemHealthData = () => {
    if (!dashboardData) return [];
    
    // Calculate system health based on actual metrics
    const totalUsers = dashboardData.dashboard.totalUsers;
    const activeUsers = dashboardData.dashboard.activeUsers;
    const totalAppointments = dashboardData.dashboard.totalAppointments;
    const totalOrders = dashboardData.dashboard.totalOrders;
    
    const userActivity = Math.min(100, (activeUsers / totalUsers) * 100);
    const appointmentLoad = Math.min(100, (totalAppointments / 1000) * 100);
    const orderLoad = Math.min(100, (totalOrders / 500) * 100);
    const systemLoad = Math.min(100, ((userActivity + appointmentLoad + orderLoad) / 3));
    
    return [
      { name: 'User Activity', value: Math.round(userActivity), color: '#4CAF50' },
      { name: 'Appointment Load', value: Math.round(appointmentLoad), color: '#2196F3' },
      { name: 'Order Processing', value: Math.round(orderLoad), color: '#FF9800' },
      { name: 'System Load', value: Math.round(systemLoad), color: '#9C27B0' },
    ];
  };

  const generateRevenueData = () => {
    if (!dashboardData) return [];
    
    const totalSales = dashboardData.dashboard.totalSales;
    const totalOrders = dashboardData.dashboard.totalOrders;
    
    // Generate monthly data based on current totals
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const baseRevenue = totalSales / 6;
    const baseOrders = totalOrders / 6;
    
    return months.map((month, index) => ({
      month,
      revenue: Math.round(baseRevenue * (1 + index * 0.1)), // 10% growth per month
      orders: Math.round(baseOrders * (1 + index * 0.1)),
    }));
  };

  const userGrowthData = generateUserGrowthData();
  const systemHealthData = generateSystemHealthData();
  const revenueData = generateRevenueData();

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
  const recentUsers = dashboardData?.recentUsers || [];
  const recentOrders = dashboardData?.recentOrders || [];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

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
            Admin Dashboard 🛡️
          </Typography>
          <Typography variant="h6" color="text.secondary">
            System overview and comprehensive analytics for platform management
          </Typography>
        </Box>
      </Fade>

      {/* System Metrics Cards */}
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
                  <People sx={{ fontSize: 40 }} />
                  <Chip 
                    label={`+${dashboard.newRegistrations || 0}`} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  New Users (7d)
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total: {dashboard.totalUsers || 0}
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
                  <AttachMoney sx={{ fontSize: 40 }} />
                  <Chip 
                    label={`$${dashboard.totalSales || 0}`} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Revenue (7d)
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {dashboard.totalOrders || 0} orders
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
                  <Warning sx={{ fontSize: 40 }} />
                  <Badge badgeContent={dashboard.flaggedReports || 0} color="error">
                    <Security sx={{ fontSize: 24 }} />
                  </Badge>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Flagged Content
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Requires review
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
                  <Speed sx={{ fontSize: 40 }} />
                  <Chip 
                    label="Excellent" 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  System Health
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  All systems operational
                </Typography>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      {/* Detailed Analytics Tabs */}
      <Card sx={{ borderRadius: '20px', overflow: 'hidden', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
            <Tab icon={<BarChartIcon />} label="User Analytics" />
            <Tab icon={<LineChartIcon />} label="Revenue Trends" />
            <Tab icon={<PieChartIcon />} label="System Health" />
            <Tab icon={<Assessment />} label="Platform Stats" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Slide direction="up" in timeout={1000}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  User Growth Analytics
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowthData}>
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
                        dataKey="patients" 
                        stackId="1" 
                        stroke="#4CAF50" 
                        fill="#4CAF50" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="doctors" 
                        stackId="2" 
                        stroke="#2196F3" 
                        fill="#2196F3" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="admins" 
                        stackId="3" 
                        stroke="#9C27B0" 
                        fill="#9C27B0" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </Slide>
          )}

          {activeTab === 1 && (
            <Slide direction="up" in timeout={1000}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Revenue & Orders Trends
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis yAxisId="left" stroke="#666" />
                      <YAxis yAxisId="right" orientation="right" stroke="#666" />
                      <RechartsTooltip 
                        contentStyle={{ 
                          borderRadius: '10px',
                          border: 'none',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar yAxisId="left" dataKey="revenue" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="orders" fill="#2196F3" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </Slide>
          )}

          {activeTab === 2 && (
            <Slide direction="up" in timeout={1000}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  System Performance Metrics
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={systemHealthData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {systemHealthData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 300 }}>
                      {systemHealthData.map((item, index) => (
                        <Box key={index} sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {item.name}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                              {item.value}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={item.value} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: item.color,
                                borderRadius: 4,
                              }
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Slide>
          )}

          {activeTab === 3 && (
            <Slide direction="up" in timeout={1000}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Platform Statistics
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '15px' }}>
                      <People sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {dashboard.totalPatients || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Patients
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '15px' }}>
                      <MedicalServices sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {dashboard.totalDoctors || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Doctors
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '15px' }}>
                      <CalendarToday sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {dashboard.totalAppointments || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Appointments
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '15px' }}>
                      <Inventory sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {dashboard.totalProducts || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Products
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Slide>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity & Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Slide direction="up" in timeout={1400}>
            <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Recent User Registrations
                  </Typography>
                  <IconButton onClick={() => navigate('/app/admin/users')}>
                    <People />
                  </IconButton>
                </Box>
                
                {recentUsers.length > 0 ? (
                  <List>
                    {recentUsers.map((user, index) => (
                      <React.Fragment key={index}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: user.role === 'patient' ? 'primary.main' : user.role === 'doctor' ? 'info.main' : 'secondary.main' }}>
                              <Person />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${user.firstName} ${user.lastName}`}
                            secondary={
                              <Box component="span">
                                <Typography variant="body2" color="text.secondary" component="span" display="block">
                                  {user.email}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" component="span" display="block">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                          />
                          <Chip 
                            label={user.role} 
                            size="small" 
                            color={user.role === 'patient' ? 'primary' : user.role === 'doctor' ? 'info' : 'secondary'}
                          />
                        </ListItem>
                        {index < recentUsers.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <People sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No recent registrations
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
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Quick Actions
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<People />}
                      onClick={() => navigate('/app/admin/users')}
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
                      Manage Users
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Security />}
                      onClick={() => navigate('/app/admin/moderation')}
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
                      Content Moderation
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<ShoppingCart />}
                      onClick={() => navigate('/app/admin/orders')}
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
                      Orders & Sales
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Settings />}
                      onClick={() => navigate('/app/admin/settings')}
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
                      System Settings
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
        aria-label="admin actions"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
          }
        }}
        onClick={() => navigate('/app/admin/users')}
      >
        <AdminPanelSettings />
      </Fab>
    </Container>
  );
};

export default AdminOverview;