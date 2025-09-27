import React from 'react';
import {
  Container,
  Typography,
  Box,
  Fade,
} from '@mui/material';
import {
  Person,
} from '@mui/icons-material';

const AdminUserDetail = () => {
  return (
    <Container maxWidth="lg">
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
            User Details 👤
          </Typography>
        </Box>
      </Fade>

      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Person sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          User Details Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View detailed user information and account management.
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminUserDetail;