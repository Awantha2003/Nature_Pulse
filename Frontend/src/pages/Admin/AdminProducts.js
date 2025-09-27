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
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Fade,
  Avatar,
  Divider,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Person,
  Schedule,
  Warning,
  Check,
  Close,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const AdminProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/products/pending');
      setProducts(response.data.data.products);
    } catch (err) {
      setError('Failed to load pending products');
      console.error('Error fetching pending products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const handleApprove = async () => {
    try {
      await api.put(`/products/${selectedProduct._id}/approve`, {
        approvalNotes: approvalNotes
      });
      setApproveDialogOpen(false);
      setApprovalNotes('');
      fetchPendingProducts();
    } catch (err) {
      setError('Failed to approve product');
      console.error('Error approving product:', err);
    }
  };

  const handleReject = async () => {
    try {
      await api.put(`/products/${selectedProduct._id}/reject`, {
        approvalNotes: approvalNotes
      });
      setRejectDialogOpen(false);
      setApprovalNotes('');
      fetchPendingProducts();
    } catch (err) {
      setError('Failed to reject product');
      console.error('Error rejecting product:', err);
    }
  };

  const openViewDialog = (product) => {
    setSelectedProduct(product);
    setViewDialogOpen(true);
  };

  const openApproveDialog = (product) => {
    setSelectedProduct(product);
    setApprovalNotes('');
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (product) => {
    setSelectedProduct(product);
    setApprovalNotes('');
    setRejectDialogOpen(true);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return 'http://localhost:5000/api/products/placeholder/300/200';
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    let filename;
    if (imagePath.includes('/') || imagePath.includes('\\')) {
      filename = imagePath.split(/[/\\]/).pop();
    } else {
      filename = imagePath;
    }
    
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    return `http://localhost:5000/api/products/images/${filename}`;
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

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, primary.main 0%, secondary.main 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)',
        zIndex: 0
      }
    }}>
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <Fade in timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 800,
                color: 'white',
                textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                mb: 2
              }}
            >
              Product Approval 🔍
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
              Review and approve products submitted by doctors
            </Typography>
          </Box>
        </Fade>

        {error && (
          <Alert severity="error" sx={{ 
            mb: 3, 
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            {error}
          </Alert>
        )}

        {/* Summary Card */}
        <Card sx={{ 
          p: 3, 
          borderRadius: '24px', 
          mb: 4,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>
                {products.length}
              </Typography>
              <Typography variant="h6" sx={{ color: 'white', opacity: 0.9 }}>
                Products Pending Approval
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchPendingProducts}
              sx={{ 
                borderRadius: '20px',
                background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                }
              }}
            >
              Refresh
            </Button>
          </Box>
        </Card>

        {/* Products Grid */}
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product._id}>
              <Card sx={{ 
                borderRadius: '24px', 
                height: '100%', 
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)',
                }
              }}>
                {/* Product Image */}
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={getImageUrl(product.images?.[0]?.url)}
                    alt={product.name}
                    sx={{ borderRadius: '24px 24px 0 0' }}
                    onError={(e) => {
                      e.target.src = 'http://localhost:5000/api/products/placeholder/300/200';
                    }}
                  />
                  <Chip
                    label="⏳ Pending Approval"
                    color="warning"
                    size="small"
                    sx={{ 
                      position: 'absolute', 
                      top: 12, 
                      right: 12,
                      background: 'rgba(255, 193, 7, 0.9)',
                      backdropFilter: 'blur(10px)',
                      fontWeight: 600,
                      color: 'white'
                    }}
                  />
                </Box>

                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
                    {product.description?.substring(0, 100)}...
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#4ecdc4' }}>
                      ${product.price?.current || product.price}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={product.category}
                      size="small"
                      sx={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        fontWeight: 500
                      }}
                    />
                    <Typography variant="body2" sx={{ ml: 1, color: 'rgba(255,255,255,0.7)' }}>
                      {product.brand}
                    </Typography>
                  </Box>

                  {/* Doctor Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: '#4ecdc4' }}>
                      <Person sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {product.createdBy?.name || 'Unknown Doctor'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Schedule sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', mr: 1 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {new Date(product.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => openViewDialog(product)}
                    sx={{ 
                      borderRadius: '20px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.2)',
                      }
                    }}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<CheckCircle />}
                    onClick={() => openApproveDialog(product)}
                    sx={{ 
                      borderRadius: '20px',
                      background: 'rgba(76, 175, 80, 0.2)',
                      color: '#4caf50',
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      '&:hover': {
                        background: 'rgba(76, 175, 80, 0.3)',
                      }
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Cancel />}
                    onClick={() => openRejectDialog(product)}
                    sx={{ 
                      borderRadius: '20px',
                      background: 'rgba(244, 67, 54, 0.2)',
                      color: '#f44336',
                      border: '1px solid rgba(244, 67, 54, 0.3)',
                      '&:hover': {
                        background: 'rgba(244, 67, 54, 0.3)',
                      }
                    }}
                  >
                    Reject
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {products.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CheckCircle sx={{ fontSize: 80, color: 'rgba(255,255,255,0.6)', mb: 2 }} />
            <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
              No Products Pending Approval
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              All products have been reviewed. Great job!
            </Typography>
          </Box>
        )}

        {/* View Product Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            Product Details - {selectedProduct?.name}
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
                    onError={(e) => {
                      e.target.src = 'http://localhost:5000/api/products/placeholder/400/300';
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {selectedProduct.name}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedProduct.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                      ${selectedProduct.price?.current || selectedProduct.price}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={selectedProduct.category}
                      size="small"
                      variant="outlined"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {selectedProduct.brand}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Stock: {selectedProduct.inventory?.stock || selectedProduct.stock || 0} units
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Person sx={{ fontSize: 16, mr: 1 }} />
                    <Typography variant="body2">
                      Created by: {selectedProduct.createdBy?.name || 'Unknown Doctor'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Schedule sx={{ fontSize: 16, mr: 1 }} />
                    <Typography variant="body2">
                      Created: {new Date(selectedProduct.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setViewDialogOpen(false)}
              sx={{ borderRadius: '15px' }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            Approve Product
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to approve "{selectedProduct?.name}"?
            </Typography>
            <TextField
              fullWidth
              label="Approval Notes (Optional)"
              multiline
              rows={3}
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add any notes about this approval..."
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setApproveDialogOpen(false)}
              sx={{ borderRadius: '15px' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleApprove}
              startIcon={<CheckCircle />}
              sx={{ borderRadius: '15px' }}
            >
              Approve Product
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            Reject Product
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to reject "{selectedProduct?.name}"?
            </Typography>
            <TextField
              fullWidth
              label="Rejection Reason (Required)"
              multiline
              rows={3}
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setRejectDialogOpen(false)}
              sx={{ borderRadius: '15px' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleReject}
              startIcon={<Cancel />}
              disabled={!approvalNotes.trim()}
              sx={{ borderRadius: '15px' }}
            >
              Reject Product
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AdminProducts;
