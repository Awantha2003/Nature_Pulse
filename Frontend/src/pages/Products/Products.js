import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Products = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Ayurvedic Products
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page will show the product catalog. Coming soon!
        </Typography>
      </Box>
    </Container>
  );
};

export default Products;
