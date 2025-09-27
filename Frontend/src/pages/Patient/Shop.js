import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Fade,
  Zoom,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Fab,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Stack,
} from '@mui/material';
import {
  ShoppingCart,
  Search,
  Add,
  Remove,
  Delete,
  LocalShipping,
  Payment,
  Star,
  FilterList,
  Sort,
  ShoppingBag,
  Favorite,
  FavoriteBorder,
  Visibility,
  AddShoppingCart,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const PatientShop = () => {
  const { user } = useAuth();
  
  // Helper function to construct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'http://localhost:5000/api/products/placeholder/300/200';
    if (imagePath.startsWith('http')) return imagePath;
    
    // Handle different path formats (both / and \ separators)
    let filename;
    if (imagePath.includes('/') || imagePath.includes('\\')) {
      // Full path: "uploads/products/filename.png" or "uploads\products\filename.png" -> "filename.png"
      filename = imagePath.split(/[/\\]/).pop();
    } else {
      // Just filename: "filename.png" -> "filename.png"
      filename = imagePath;
    }
    const fullUrl = `http://localhost:5000/api/products/images/${filename}`;
    return fullUrl;
  };
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const categories = [
    { name: 'All', displayName: 'All' },
    { name: 'herbal_supplements', displayName: 'Herbal Supplements' },
    { name: 'ayurvedic_medicines', displayName: 'Ayurvedic Medicines' },
    { name: 'skincare', displayName: 'Skincare' },
    { name: 'haircare', displayName: 'Haircare' },
    { name: 'digestive_health', displayName: 'Digestive Health' },
    { name: 'immune_support', displayName: 'Immune Support' },
    { name: 'stress_relief', displayName: 'Stress Relief' },
    { name: 'sleep_aid', displayName: 'Sleep Aid' },
    { name: 'joint_health', displayName: 'Joint Health' },
    { name: 'heart_health', displayName: 'Heart Health' },
    { name: 'diabetes_care', displayName: 'Diabetes Care' },
    { name: 'weight_management', displayName: 'Weight Management' },
    { name: 'women_health', displayName: 'Women Health' },
    { name: 'men_health', displayName: 'Men Health' },
    { name: 'children_health', displayName: 'Children Health' },
    { name: 'elderly_care', displayName: 'Elderly Care' },
    { name: 'other', displayName: 'Other' }
  ];

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, [currentPage, searchTerm, selectedCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        q: searchTerm,
        category: selectedCategory === 'All' ? '' : selectedCategory,
        sortBy: sortBy
      });
      
      const response = await api.get(`/products?${params}`);
      setProducts(response.data.data.products);
      setTotalPages(response.data.data.totalPages);
    } catch (err) {
      setError('Failed to load products');
      console.error('Products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await api.get('/products/cart');
      setCart(response.data.data.cart?.items || []);
    } catch (err) {
      console.error('Cart error:', err);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      await api.post('/products/cart/items', { product: productId, quantity });
      fetchCart();
    } catch (err) {
      setError('Failed to add item to cart');
      console.error('Add to cart error:', err);
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      if (quantity === 0) {
        await api.delete(`/products/cart/items/${productId}`);
      } else {
        await api.put(`/products/cart/items/${productId}`, { quantity });
      }
      fetchCart();
    } catch (err) {
      setError('Failed to update cart');
      console.error('Update cart error:', err);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await api.delete(`/products/cart/items/${productId}`);
      fetchCart();
    } catch (err) {
      setError('Failed to remove item from cart');
      console.error('Remove from cart error:', err);
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/products/cart');
      fetchCart();
    } catch (err) {
      setError('Failed to clear cart');
      console.error('Clear cart error:', err);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.product.price?.current || item.product.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getProductRating = (reviews) => {
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading && products.length === 0) {
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

  return (
    <Container maxWidth="xl">
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
            Ayurvedic Shop 🛒
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Browse and purchase authentic Ayurvedic products and health supplements
          </Typography>
        </Box>
      </Fade>

      {/* Search and Filter Bar */}
      <Card sx={{ borderRadius: '20px', mb: 4, p: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ borderRadius: '15px' }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category.name} value={category.name}>
                    {category.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="rating">Rating</MenuItem>
                <MenuItem value="createdAt">Newest</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<ShoppingBag />}
              onClick={() => setCartOpen(true)}
              sx={{ borderRadius: '15px', py: 1.5 }}
            >
              <Badge badgeContent={getCartItemCount()} color="error">
                Cart
              </Badge>
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Products Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {products.map((product, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product._id}>
            <Zoom in timeout={1000 + index * 100}>
              <Card 
                sx={{ 
                  borderRadius: '20px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={getImageUrl(product.images?.[0]?.url)}
                  alt={product.name}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleProductClick(product)}
                />
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {product.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Star sx={{ fontSize: 16, color: '#FFD700', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {getProductRating(product.reviews)} ({product.reviews?.length || 0} reviews)
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {product.description?.substring(0, 100)}...
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      ${product.price?.current || product.price}
                    </Typography>
                    <Chip 
                      label={product.category} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleProductClick(product)}
                      sx={{ borderRadius: '15px', flex: 1 }}
                    >
                      View
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddShoppingCart />}
                      onClick={() => addToCart(product._id)}
                      sx={{ borderRadius: '15px' }}
                    >
                      Add
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(event, value) => setCurrentPage(value)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Product Details Dialog */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProduct?.name}
        </DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <CardMedia
                  component="img"
                  height="300"
                  image={getImageUrl(selectedProduct.images?.[0]?.url)}
                  alt={selectedProduct.name}
                  sx={{ borderRadius: '15px' }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedProduct.name}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Star sx={{ fontSize: 20, color: '#FFD700', mr: 1 }} />
                  <Typography variant="h6">
                    {getProductRating(selectedProduct.reviews)} ({selectedProduct.reviews?.length || 0} reviews)
                  </Typography>
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
                  ${selectedProduct.price?.current || selectedProduct.price}
                </Typography>

                <Typography variant="body1" sx={{ mb: 3 }}>
                  {selectedProduct.description}
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Health Benefits:
                  </Typography>
                  {selectedProduct.healthBenefits && selectedProduct.healthBenefits.length > 0 ? (
                    <Box>
                      {selectedProduct.healthBenefits.map((benefit, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {benefit.benefit}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {benefit.description}
                          </Typography>
                          {benefit.scientificEvidence && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Scientific Evidence: {benefit.scientificEvidence}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No specific benefits listed.
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Usage Instructions:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedProduct.usageInstructions?.howToUse || 'Please consult with a healthcare professional.'}
                  </Typography>
                  
                  {selectedProduct.usageInstructions?.whenToUse && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>When to use:</strong> {selectedProduct.usageInstructions.whenToUse}
                    </Typography>
                  )}
                  
                  {selectedProduct.usageInstructions?.precautions && selectedProduct.usageInstructions.precautions.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Precautions:
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {selectedProduct.usageInstructions.precautions.map((precaution, index) => (
                          <li key={index}>
                            <Typography variant="body2" color="text.secondary">
                              {precaution}
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}
                  
                  {selectedProduct.usageInstructions?.contraindications && selectedProduct.usageInstructions.contraindications.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'warning.main' }}>
                        Contraindications:
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {selectedProduct.usageInstructions.contraindications.map((contraindication, index) => (
                          <li key={index}>
                            <Typography variant="body2" color="text.secondary">
                              {contraindication}
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}
                  
                  {selectedProduct.usageInstructions?.sideEffects && selectedProduct.usageInstructions.sideEffects.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'error.main' }}>
                        Possible Side Effects:
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {selectedProduct.usageInstructions.sideEffects.map((sideEffect, index) => (
                          <li key={index}>
                            <Typography variant="body2" color="text.secondary">
                              {sideEffect}
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddShoppingCart />}
                  onClick={() => {
                    addToCart(selectedProduct._id);
                    setProductDialogOpen(false);
                  }}
                  sx={{ borderRadius: '15px', py: 1.5 }}
                >
                  Add to Cart - ${selectedProduct.price?.current || selectedProduct.price}
                </Button>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shopping Cart Dialog */}
      <Dialog open={cartOpen} onClose={() => setCartOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Shopping Cart ({getCartItemCount()} items)
        </DialogTitle>
        <DialogContent>
          {cart.length > 0 ? (
            <List>
              {cart.map((item, index) => (
                <React.Fragment key={item.product._id}>
                  <ListItem sx={{ px: 0 }}>
                    <Box sx={{ width: 60, height: 60, mr: 2 }}>
                      <CardMedia
                        component="img"
                        height="60"
                        image={getImageUrl(item.product.images?.[0]?.url)}
                        alt={item.product.name}
                        sx={{ borderRadius: '8px' }}
                      />
                    </Box>
                    <ListItemText
                      primary={item.product.name}
                      secondary={`$${item.product.price?.current || item.product.price} each`}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => updateCartItem(item.product._id, item.quantity - 1)}
                      >
                        <Remove />
                      </IconButton>
                      <Typography variant="body1" sx={{ minWidth: 30, textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => updateCartItem(item.product._id, item.quantity + 1)}
                      >
                        <Add />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => removeFromCart(item.product._id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < cart.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ShoppingCart sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your cart is empty
        </Typography>
              <Typography variant="body2" color="text.secondary">
                Add some products to get started!
        </Typography>
      </Box>
          )}
        </DialogContent>
        {cart.length > 0 && (
          <DialogActions sx={{ p: 3, flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Typography variant="h6">
                Total: ${getCartTotal().toFixed(2)}
              </Typography>
              <Button 
                variant="outlined" 
                color="error"
                onClick={clearCart}
                startIcon={<Delete />}
              >
                Clear Cart
              </Button>
            </Box>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<Payment />}
              onClick={() => navigate('/app/patient/cart')}
              sx={{ borderRadius: '15px', py: 1.5 }}
            >
              Proceed to Checkout
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="shopping cart"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
          }
        }}
        onClick={() => setCartOpen(true)}
      >
        <Badge badgeContent={getCartItemCount()} color="error">
          <ShoppingCart />
        </Badge>
      </Fab>
    </Container>
  );
};

export default PatientShop;