import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  TextField,
  Grid
} from '@mui/material';
import {
  Payment,
  CreditCard,
  AccountBalance,
  PhoneAndroid,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const DemoPayment = ({ appointment, onPaymentSuccess, onPaymentError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('demo_card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4242424242424242',
    expiryDate: '12/25',
    cvv: '123',
    cardholderName: 'Demo User'
  });

  const { user } = useAuth();

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create demo payment record
      const paymentData = {
        appointmentId: appointment._id,
        amount: appointment.fee,
        paymentMethod: paymentMethod,
        status: 'completed',
        transactionId: `demo_${Date.now()}`,
        cardDetails: paymentMethod === 'demo_card' ? cardDetails : null
      };

      const response = await api.post('/payments/demo-payment', paymentData);

      if (response.data.status === 'success') {
        onPaymentSuccess(response.data.data.payment);
      } else {
        throw new Error(response.data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.response?.data?.message || 'Payment failed. Please try again.');
      onPaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      value: 'demo_card',
      label: 'Demo Credit Card',
      icon: <CreditCard />,
      description: 'Test with demo card (4242 4242 4242 4242)'
    },
    {
      value: 'demo_bank',
      label: 'Demo Bank Transfer',
      icon: <AccountBalance />,
      description: 'Simulate bank transfer payment'
    },
    {
      value: 'demo_mobile',
      label: 'Demo Mobile Payment',
      icon: <PhoneAndroid />,
      description: 'Simulate mobile wallet payment'
    }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Payment sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Demo Payment
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This is a demo payment system for testing purposes
            </Typography>
          </Box>

          {/* Appointment Details */}
          <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>
              Appointment Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Doctor: {appointment.doctor?.name || 'Dr. Demo'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Date: {new Date(appointment.date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Time: {appointment.time}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" color="primary.main">
                  Amount: ${appointment.fee}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Payment Method Selection */}
          <Box sx={{ mb: 4 }}>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
              Select Payment Method
            </FormLabel>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {paymentMethods.map((method) => (
                <Paper
                  key={method.value}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: paymentMethod === method.value ? 2 : 1,
                    borderColor: paymentMethod === method.value ? 'primary.main' : 'grey.300',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50'
                    }
                  }}
                  onClick={() => setPaymentMethod(method.value)}
                >
                  <FormControlLabel
                    value={method.value}
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                          {method.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {method.label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {method.description}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </Paper>
              ))}
            </RadioGroup>
          </Box>

          {/* Card Details (for demo card) */}
          {paymentMethod === 'demo_card' && (
            <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                Demo Card Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Card Number"
                    value={cardDetails.cardNumber}
                    onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
                    placeholder="4242 4242 4242 4242"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Expiry Date"
                    value={cardDetails.expiryDate}
                    onChange={(e) => setCardDetails({...cardDetails, expiryDate: e.target.value})}
                    placeholder="MM/YY"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="CVV"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                    placeholder="123"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Cardholder Name"
                    value={cardDetails.cardholderName}
                    onChange={(e) => setCardDetails({...cardDetails, cardholderName: e.target.value})}
                    placeholder="Demo User"
                  />
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Payment Button */}
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handlePayment}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2
              }}
            >
              {loading ? 'Processing Payment...' : `Pay $${appointment.fee}`}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Demo Notice */}
          <Alert severity="info" sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              <strong>Demo Mode:</strong> This is a demonstration payment system. 
              No real money will be charged. All transactions are simulated for testing purposes.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Container>
  );
};

export default DemoPayment;
