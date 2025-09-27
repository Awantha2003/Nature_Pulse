import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Link,
  Grid,
} from '@mui/material';
import {
  HealthAndSafety,
  Login,
  PersonAdd,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const PublicShell = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <HealthAndSafety sx={{ mr: 2 }} />
              <Typography
                variant="h6"
                component="div"
                sx={{ fontWeight: 600 }}
              >
                Nature Pulse
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                color="inherit"
                onClick={() => navigate('/')}
              >
                Home
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/products')}
              >
                Products
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/doctors')}
              >
                Doctors
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/about')}
              >
                About
              </Button>
              
              {isAuthenticated() ? (
                <>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/app')}
                  >
                    Dashboard
                  </Button>
                  <Button
                    color="inherit"
                    onClick={logout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    color="inherit"
                    startIcon={<Login />}
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={() => navigate('/register')}
                    sx={{ ml: 1 }}
                  >
                    Register
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: 'grey.900',
          color: 'white',
          py: 4,
          mt: 'auto',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" gutterBottom>
                Nature Pulse
              </Typography>
              <Typography variant="body2" color="grey.400">
                Your trusted partner in healthcare, providing comprehensive solutions
                for patients, doctors, and healthcare providers.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link
                  color="inherit"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/');
                  }}
                  sx={{ textDecoration: 'none' }}
                >
                  Home
                </Link>
                <Link
                  color="inherit"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/products');
                  }}
                  sx={{ textDecoration: 'none' }}
                >
                  Products
                </Link>
                <Link
                  color="inherit"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/doctors');
                  }}
                  sx={{ textDecoration: 'none' }}
                >
                  Doctors
                </Link>
                <Link
                  color="inherit"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/about');
                  }}
                  sx={{ textDecoration: 'none' }}
                >
                  About
                </Link>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" gutterBottom>
                Contact
              </Typography>
              <Typography variant="body2" color="grey.400">
                Email: support@healthcareplatform.com
                <br />
                Phone: +1 (555) 123-4567
              </Typography>
            </Grid>
          </Grid>
          <Box
            sx={{
              mt: 4,
              pt: 4,
              borderTop: '1px solid',
              borderColor: 'grey.700',
            }}
          >
            <Typography variant="body2" color="grey.400" textAlign="center">
              © 2024 Nature Pulse. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default PublicShell;
