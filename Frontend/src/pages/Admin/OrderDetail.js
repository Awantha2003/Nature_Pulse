import React from 'react';
import {
  Container,
  Typography,
  Box,
  Fade,
} from '@mui/material';
import {
  Assignment,
} from '@mui/icons-material';

const AdminOrderDetail = () => {
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
            Order Details 📋
          </Typography>
        </Box>
      </Fade>

      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Assignment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Order Details Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage individual order details.
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminOrderDetail;