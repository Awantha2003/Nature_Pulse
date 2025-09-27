import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Avatar,
} from '@mui/material';
import {
  CalendarToday,
  HealthAndSafety,
  People,
  ShoppingCart,
  LocalHospital,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const getQuickActions = () => {
    if (hasRole('patient')) {
      return [
        {
          title: 'Book Appointment',
          description: 'Schedule an appointment with a doctor',
          icon: <CalendarToday sx={{ fontSize: 40, color: 'primary.main' }} />,
          action: () => navigate('/book-appointment'),
          color: 'primary',
        },
        {
          title: 'Health Tracker',
          description: 'Track your daily health metrics',
          icon: <HealthAndSafety sx={{ fontSize: 40, color: 'success.main' }} />,
          action: () => navigate('/health-tracker'),
          color: 'success',
        },
        {
          title: 'Community',
          description: 'Connect with other patients',
          icon: <People sx={{ fontSize: 40, color: 'info.main' }} />,
          action: () => navigate('/community'),
          color: 'info',
        },
        {
          title: 'Products',
          description: 'Browse Ayurvedic products',
          icon: <ShoppingCart sx={{ fontSize: 40, color: 'warning.main' }} />,
          action: () => navigate('/products'),
          color: 'warning',
        },
      ];
    } else if (hasRole('doctor')) {
      return [
        {
          title: 'My Appointments',
          description: 'View and manage your appointments',
          icon: <CalendarToday sx={{ fontSize: 40, color: 'primary.main' }} />,
          action: () => navigate('/appointments'),
          color: 'primary',
        },
        {
          title: 'Patient Records',
          description: 'Access shared health records',
          icon: <HealthAndSafety sx={{ fontSize: 40, color: 'success.main' }} />,
          action: () => navigate('/health-tracker'),
          color: 'success',
        },
        {
          title: 'Community',
          description: 'Engage with the community',
          icon: <People sx={{ fontSize: 40, color: 'info.main' }} />,
          action: () => navigate('/community'),
          color: 'info',
        },
        {
          title: 'Products',
          description: 'Manage your products',
          icon: <ShoppingCart sx={{ fontSize: 40, color: 'warning.main' }} />,
          action: () => navigate('/products'),
          color: 'warning',
        },
      ];
    } else if (hasRole('admin')) {
      return [
        {
          title: 'Manage Users',
          description: 'View and manage all users',
          icon: <People sx={{ fontSize: 40, color: 'primary.main' }} />,
          action: () => navigate('/admin/users'),
          color: 'primary',
        },
        {
          title: 'Manage Reports',
          description: 'Moderate community reports',
          icon: <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />,
          action: () => navigate('/admin/reports'),
          color: 'success',
        },
        {
          title: 'Manage Products',
          description: 'Oversee product catalog',
          icon: <ShoppingCart sx={{ fontSize: 40, color: 'info.main' }} />,
          action: () => navigate('/admin/products'),
          color: 'info',
        },
        {
          title: 'Manage Appointments',
          description: 'View all appointments',
          icon: <CalendarToday sx={{ fontSize: 40, color: 'warning.main' }} />,
          action: () => navigate('/admin/appointments'),
          color: 'warning',
        },
      ];
    }
    return [];
  };

  const getWelcomeMessage = () => {
    if (hasRole('patient')) {
      return `Welcome back, ${user?.firstName}! How are you feeling today?`;
    } else if (hasRole('doctor')) {
      return `Good day, Dr. ${user?.lastName}! Ready to help your patients?`;
    } else if (hasRole('admin')) {
      return `Welcome, ${user?.firstName}! Here's your admin overview.`;
    }
    return `Welcome, ${user?.firstName}!`;
  };

  const quickActions = getQuickActions();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {getWelcomeMessage()}
        </Typography>
      </Box>

      {/* User Info Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
              {user?.firstName?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5" component="h2">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {user?.email}
              </Typography>
              <Typography variant="body2" color="primary.main" sx={{ textTransform: 'capitalize' }}>
                {user?.role}
              </Typography>
            </Box>
          </Box>
        </CardContent>
        <CardActions>
          <Button size="small" onClick={() => navigate('/profile')}>
            Edit Profile
          </Button>
        </CardActions>
      </Card>

      {/* Quick Actions */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Quick Actions
      </Typography>
      
      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
              onClick={action.action}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center' }}>
                <Button size="small" color={action.color}>
                  Go to {action.title}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity Placeholder */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Recent Activity
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              No recent activity to display. Start by exploring the quick actions above!
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Dashboard;
