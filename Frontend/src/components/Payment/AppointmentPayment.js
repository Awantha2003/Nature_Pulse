import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel
} from '@mui/material';
import {
  Payment,
  CreditCard,
  AccountBalance,
  PhoneAndroid,
  CheckCircle,
  Error
} from '@mui/icons-material';
// Stripe imports removed - using demo payment instead
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

// Demo payment component - no Stripe needed

const DemoPaymentForm = ({ appointment, onPaymentSuccess, onPaymentError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDemoPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/payments/demo-payment', {
        appointmentId: appointment._id,
        amount: appointment.payment.amount,
        paymentMethod: 'demo_card'
      });

      if (response.data.status === 'success') {
        onPaymentSuccess(response.data.data);
      } else {
        setError(response.data.message || 'Demo payment failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Demo payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Demo Payment Mode
        </Typography>
        <Typography variant="body2">
          This is a demo payment system. No real money will be charged. 
          The payment will be processed and saved to the database for testing purposes.
        </Typography>
      </Alert>

      <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Demo Card Information
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Card Number:</strong> 4242 4242 4242 4242<br />
          <strong>Expiry:</strong> Any future date<br />
          <strong>CVC:</strong> Any 3 digits<br />
          <strong>Amount:</strong> ${appointment.payment.amount}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleDemoPayment}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
        sx={{ 
          bgcolor: 'success.main',
          '&:hover': {
            bgcolor: 'success.dark'
          }
        }}
      >
        {loading ? 'Processing Demo Payment...' : `Pay $${appointment.payment.amount} (Demo)`}
      </Button>
    </Box>
  );
};

const PaymentForm = ({ appointment, onPaymentSuccess, onPaymentError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('demo_card');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create demo payment record
      const paymentData = {
        appointmentId: appointment._id,
        amount: appointment.payment.amount,
        paymentMethod: paymentMethod,
        status: 'completed',
        transactionId: `demo_${Date.now()}`,
        cardDetails: null
      };

      const response = await api.post('/payments/demo-payment', paymentData);

      if (response.data.status === 'success') {
        onPaymentSuccess(response.data.data.payment);
      } else {
        throw new Error(response.data.message || 'Payment failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
      onPaymentError(err);
    } finally {
      setLoading(false);
    }
  };

  // Demo payment options

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <FormLabel component="legend">Payment Method</FormLabel>
        <RadioGroup
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          sx={{ mt: 1 }}
        >
          <FormControlLabel
            value="demo_card"
            control={<Radio />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CreditCard sx={{ mr: 1 }} />
                Demo Credit Card
              </Box>
            }
          />
          <FormControlLabel
            value="demo_mobile"
            control={<Radio />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneAndroid sx={{ mr: 1 }} />
                Demo Mobile Payment
              </Box>
            }
          />
          <FormControlLabel
            value="demo_bank"
            control={<Radio />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalance sx={{ mr: 1 }} />
                Demo Bank Transfer
              </Box>
            }
          />
        </RadioGroup>
      </Box>

      {paymentMethod === 'demo_card' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Demo Card Details
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Demo Card:</strong> 4242 4242 4242 4242<br />
              <strong>Expiry:</strong> Any future date<br />
              <strong>CVV:</strong> Any 3 digits<br />
              <strong>Name:</strong> Any name
            </Typography>
          </Paper>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
      >
        {loading ? 'Processing...' : `Pay $${appointment.payment.amount}`}
      </Button>
    </form>
  );
};

const AppointmentPayment = () => {
  const { id: appointmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      if (!appointmentId) {
        setError('Appointment ID is missing');
        return;
      }
      const response = await api.get(`/appointments/${appointmentId}`);
      
      if (response.data.status === 'success') {
        setAppointment(response.data.data.appointment);
        
        // Create payment intent
        if (response.data.data.appointment.payment.status === 'pending') {
          try {
            const paymentResponse = await api.post('/payments/create-payment-intent', {
              amount: response.data.data.appointment.payment.amount,
              metadata: {
                type: 'appointment',
                appointmentId: appointmentId
              }
            });
            
            if (paymentResponse.data.status === 'success') {
              setIsDemoMode(paymentResponse.data.data.demo || false);
              // Only set clientSecret if not in demo mode
              if (!paymentResponse.data.data.demo) {
                setClientSecret(paymentResponse.data.data.clientSecret);
              }
            } else {
              // If payment intent creation fails, fall back to demo mode
              console.warn('Payment intent creation failed, falling back to demo mode');
              setIsDemoMode(true);
            }
          } catch (paymentError) {
            console.error('Payment intent creation error:', paymentError);
            // If payment intent creation fails, fall back to demo mode
            console.warn('Payment intent creation failed, falling back to demo mode');
            setIsDemoMode(true);
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    setPaymentSuccess(true);
    // Show success message without redirecting
  };

  const handlePaymentError = (error) => {
    setError(error);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  if (!appointment) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">
            Appointment not found
          </Alert>
        </Box>
      </Container>
    );
  }

  if (appointment.payment.status === 'paid') {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Payment Already Completed
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This appointment has already been paid for.
          </Typography>
          <Button
            variant="contained"
            href="/appointments"
          >
            View Appointments
          </Button>
        </Box>
      </Container>
    );
  }

  if (paymentSuccess) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Payment Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your appointment has been confirmed. You will receive a confirmation email shortly.
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => {
                const dashboardPath = user?.role === 'patient' ? '/app/patient/dashboard' : 
                                     user?.role === 'doctor' ? '/app/doctor/dashboard' : 
                                     user?.role === 'admin' ? '/app/admin/overview' : '/dashboard';
                navigate(dashboardPath);
              }}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/app/patient/appointments')}
            >
              View Appointments
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Payment for Appointment
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Appointment Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Doctor:</strong> Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Specialization:</strong> {appointment.doctor.specialization}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Date:</strong> {formatDate(appointment.appointmentDate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Time:</strong> {formatTime(appointment.appointmentTime)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Type:</strong> {appointment.type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Reason:</strong> {appointment.reason}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Payment Information
                </Typography>
                
                {error ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                    <Button
                      variant="contained"
                      onClick={() => window.location.reload()}
                      sx={{ mt: 2 }}
                    >
                      Retry
                    </Button>
                  </Box>
                ) : isDemoMode ? (
                  <DemoPaymentForm
                    appointment={appointment}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                ) : (
                  <PaymentForm
                    appointment={appointment}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Consultation Fee</Typography>
                  <Typography variant="body2">${appointment.payment.amount}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tax</Typography>
                  <Typography variant="body2">Rs 0.00</Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6" color="primary">
                    ${appointment.payment.amount}
                  </Typography>
                </Box>

                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  {isDemoMode ? (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Demo Mode:</strong> This is a test payment. No real money will be charged.
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Payment Security:</strong> Your payment information is encrypted and secure.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AppointmentPayment;
