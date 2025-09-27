import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Fade,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  IconButton,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Stack,
  Badge,
  Fab,
} from '@mui/material';
import {
  ShoppingCart,
  Add,
  Remove,
  Delete,
  LocalShipping,
  Payment,
  Star,
  ShoppingBag,
  ArrowBack,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const PatientCart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    phone: ''
  });
  const [billingAddress, setBillingAddress] = useState({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    phone: ''
  });
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/cart');
      setCart(response.data.data.cart);
    } catch (err) {
      setError('Failed to load cart');
      console.error('Cart error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = async (productId, quantity) => {
    try {
      setUpdating(true);
      if (quantity === 0) {
        await api.delete(`/products/cart/items/${productId}`);
      } else {
        await api.put(`/products/cart/items/${productId}`, { quantity });
      }
      await fetchCart();
    } catch (err) {
      setError('Failed to update cart');
      console.error('Update cart error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (productId) => {
    try {
      setUpdating(true);
      await api.delete(`/products/cart/items/${productId}`);
      await fetchCart();
    } catch (err) {
      setError('Failed to remove item');
      console.error('Remove item error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    try {
      setUpdating(true);
      await api.delete('/products/cart');
      await fetchCart();
    } catch (err) {
      setError('Failed to clear cart');
      console.error('Clear cart error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    setCheckoutDialogOpen(true);
  };

  const processPayment = async () => {
    try {
      setProcessingPayment(true);
      
      // Calculate total amount
      const subtotal = cart.items?.reduce((total, item) => total + (item.product.price?.current || item.product.price) * item.quantity, 0) || 0;
      const shipping = 10.00;
      const tax = subtotal * 0.1;
      const totalAmount = subtotal + shipping + tax;
      
      // Process demo payment for cart
      const demoPaymentResponse = await api.post('/payments/cart-demo-payment', {
        cartId: cart._id,
        amount: totalAmount,
        paymentMethod: paymentMethod,
        shippingAddress: shippingAddress,
        billingAddress: sameAsShipping ? shippingAddress : billingAddress
      });

      // Navigate to success page or show success message
      navigate('/app/patient/orders', { 
        state: { 
          message: 'Order placed successfully!',
          order: demoPaymentResponse.data.data.order
        }
      });
    } catch (err) {
      setError('Payment failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setProcessingPayment(false);
      setCheckoutDialogOpen(false);
    }
  };

  const getStockStatus = (product) => {
    if (product.inventory.stock === 0) return { status: 'out_of_stock', color: 'error', text: 'Out of Stock' };
    if (product.inventory.stock <= product.inventory.lowStockThreshold) return { status: 'low_stock', color: 'warning', text: 'Low Stock' };
    return { status: 'in_stock', color: 'success', text: 'In Stock' };
  };

  const getProductRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!cart || cart.items.length === 0) {
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
              Shopping Cart 🛒
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Review and checkout your selected items
            </Typography>
          </Box>
        </Fade>

        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ShoppingCart sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Add some products to your cart to get started.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<ShoppingBag />}
            onClick={() => navigate('/app/patient/shop')}
            sx={{ borderRadius: '15px', py: 1.5 }}
          >
            Browse Products
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Fade in timeout={800}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => navigate('/app/patient/shop')} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Shopping Cart 🛒
            </Typography>
          </Box>
          <Typography variant="h6" color="text.secondary">
            Review and checkout your selected items ({cart.items?.length || 0} items)
          </Typography>
        </Box>
      </Fade>

      <Grid container spacing={4}>
        {/* Cart Items */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3, borderRadius: '20px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Cart Items
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={clearCart}
                disabled={updating}
                sx={{ borderRadius: '15px' }}
              >
                Clear Cart
              </Button>
            </Box>

            <List>
              {cart.items.map((item, index) => {
                const stockStatus = getStockStatus(item.product);
                return (
                  <React.Fragment key={item.product._id}>
                    <ListItem sx={{ px: 0, py: 2 }}>
                      <CardMedia
                        component="img"
                        sx={{ width: 80, height: 80, mr: 2, borderRadius: '10px' }}
                        image={item.product.primaryImage || 'http://localhost:5000/api/products/placeholder/80/80'}
                        alt={item.product.name}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {item.product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {item.product.brand} • {item.product.category}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                          <Typography variant="body2">
                            {getProductRating(item.product.reviews)} ({item.product.reviews?.length || 0} reviews)
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={stockStatus.text} 
                            size="small" 
                            color={stockStatus.color}
                            variant="outlined"
                          />
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            ${item.product.price.current}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => updateItemQuantity(item.product._id, item.quantity - 1)}
                          disabled={updating || item.quantity <= 1}
                        >
                          <Remove />
                        </IconButton>
                        <Typography variant="h6" sx={{ minWidth: 40, textAlign: 'center' }}>
                          {item.quantity}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => updateItemQuantity(item.product._id, item.quantity + 1)}
                          disabled={updating || item.quantity >= item.product.inventory.stock}
                        >
                          <Add />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => removeItem(item.product._id)}
                          disabled={updating}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItem>
                    {index < cart.items.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        </Grid>

        {/* Order Summary */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 3, borderRadius: '20px', position: 'sticky', top: 20 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Order Summary
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Subtotal ({cart.items?.length || 0} items)</Typography>
                <Typography variant="body1">${(cart.items?.reduce((total, item) => total + (item.product.price?.current || item.product.price) * item.quantity, 0) || 0).toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Shipping</Typography>
                <Typography variant="body1">$10.00</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Tax</Typography>
                <Typography variant="body1">${((cart.items?.reduce((total, item) => total + (item.product.price?.current || item.product.price) * item.quantity, 0) || 0) * 0.1).toFixed(2)}</Typography>
              </Box>
              {cart.coupon && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" color="success.main">
                    Discount ({cart.coupon.code})
                  </Typography>
                  <Typography variant="body1" color="success.main">
                    -${(cart.totalDiscount || 0).toFixed(2)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Total</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  ${((cart.items?.reduce((total, item) => total + (item.product.price?.current || item.product.price) * item.quantity, 0) || 0) + 10 + ((cart.items?.reduce((total, item) => total + (item.product.price?.current || item.product.price) * item.quantity, 0) || 0) * 0.1) - (cart.totalDiscount || 0)).toFixed(2)}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<Payment />}
              onClick={handleCheckout}
              disabled={updating || cart.items.length === 0}
              sx={{ borderRadius: '15px', py: 1.5, mb: 2 }}
            >
              Proceed to Checkout
            </Button>

            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<ShoppingBag />}
              onClick={() => navigate('/app/patient/shop')}
              sx={{ borderRadius: '15px', py: 1.5 }}
            >
              Continue Shopping
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onClose={() => setCheckoutDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          Checkout
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Shipping Address */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Shipping Address
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={shippingAddress.firstName}
                  onChange={(e) => setShippingAddress({...shippingAddress, firstName: e.target.value})}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={shippingAddress.lastName}
                  onChange={(e) => setShippingAddress({...shippingAddress, lastName: e.target.value})}
                />
                <TextField
                  fullWidth
                  label="Street Address"
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                />
                <TextField
                  fullWidth
                  label="City"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                />
                <TextField
                  fullWidth
                  label="State"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                />
                <TextField
                  fullWidth
                  label="ZIP Code"
                  value={shippingAddress.zipCode}
                  onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                />
              </Stack>
            </Grid>

            {/* Payment Method */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Payment Method
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="Payment Method"
                >
                  <MenuItem value="card">Credit/Debit Card</MenuItem>
                  <MenuItem value="upi">UPI</MenuItem>
                  <MenuItem value="netbanking">Net Banking</MenuItem>
                  <MenuItem value="cod">Cash on Delivery</MenuItem>
                </Select>
              </FormControl>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  This is a demo checkout. In production, you would integrate with a payment gateway like Stripe.
                </Typography>
              </Alert>

              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: '10px' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Order Total
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  ${((cart.items?.reduce((total, item) => total + (item.product.price?.current || item.product.price) * item.quantity, 0) || 0) + 10 + ((cart.items?.reduce((total, item) => total + (item.product.price?.current || item.product.price) * item.quantity, 0) || 0) * 0.1) - (cart.totalDiscount || 0)).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCheckoutDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={processPayment}
            disabled={processingPayment}
            startIcon={processingPayment ? <CircularProgress size={20} /> : <Payment />}
            sx={{ borderRadius: '15px', py: 1.5 }}
          >
            {processingPayment ? 'Processing...' : 'Place Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PatientCart;