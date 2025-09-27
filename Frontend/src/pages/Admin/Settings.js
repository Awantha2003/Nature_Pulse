import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AdminSettings = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure system settings, permissions, and integrations.
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminSettings;
