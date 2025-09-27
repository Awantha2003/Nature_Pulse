import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Cart = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shopping Cart
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page will show your shopping cart. Coming soon!
        </Typography>
      </Box>
    </Container>
  );
};

export default Cart;
