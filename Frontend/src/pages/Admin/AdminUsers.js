import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AdminUsers = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manage Users
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page will allow admins to manage users. Coming soon!
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminUsers;
