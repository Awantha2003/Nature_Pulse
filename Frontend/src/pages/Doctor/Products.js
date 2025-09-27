import React, { useState, useEffect, useCallback } from 'react';
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
  FormControlLabel,
  Switch,
  Paper,
  Avatar,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  ShoppingCart,
  Search,
  Add,
  Remove,
  Delete,
  Edit,
  Visibility,
  Star,
  FilterList,
  Sort,
  Inventory,
  Warning,
  CheckCircle,
  Category,
  LocalShipping,
  Payment,
  TrendingUp,
  TrendingDown,
  MoreVert,
  Upload,
  Image,
  Description,
  CloudUpload,
  Delete as DeleteIcon,
  PriceCheck,
  Storage,
  LowPriority,
  HighPriority,
  Business,
  Person,
  Schedule,
  Analytics,
  Timeline,
  Group,
  MedicalServices,
  AttachMoney,
  Speed,
  CloudDone,
  BugReport,
  Settings,
  AdminPanelSettings,
  Dashboard,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  CalendarToday,
  Refresh,
  Save,
  Cancel,
  Check,
  Close,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const DoctorProducts = () => {
  const { user } = useAuth();
  
  // Helper function to construct image URL
  const getImageUrl = (imagePath) => {
    console.log('Doctor - getImageUrl called with:', imagePath, typeof imagePath);
    
    if (!imagePath) {
      console.log('No imagePath, returning placeholder');
      return 'http://localhost:5000/api/products/placeholder/300/200';
    }
    
    if (imagePath.startsWith('http')) {
      console.log('HTTP URL detected, returning as-is');
      return imagePath;
    }
    
    // Handle different path formats (both / and \ separators)
    let filename;
    if (imagePath.includes('/') || imagePath.includes('\\')) {
      // Full path: "uploads/products/filename.png" or "uploads\products\filename.png" -> "filename.png"
      filename = imagePath.split(/[/\\]/).pop();
      console.log('Full path detected, extracted filename:', filename);
    } else {
      // Just filename: "filename.png" -> "filename.png"
      filename = imagePath;
      console.log('Just filename detected:', filename);
    }
    
    // Clean the filename to ensure it's valid
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    
    const fullUrl = `http://localhost:5000/api/products/images/${filename}`;
    console.log('Doctor - Final URL construction:', { imagePath, filename, fullUrl });
    return fullUrl;
  };
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    price: '',
    stock: '',
    lowStockThreshold: '',
    isActive: true,
    isFeatured: false,
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories] = useState([
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
  ]);

  // Debounced search to prevent too many API calls
  const debouncedFetchProducts = useCallback(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300); // 300ms delay
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, categoryFilter, statusFilter, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    const cleanup = debouncedFetchProducts();
    return cleanup;
  }, [debouncedFetchProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      // Build query parameters, filtering out empty values
      const queryParams = {
        page: currentPage,
        limit: 12,
        sortBy: sortBy,
        sortOrder: sortOrder
      };
      
      // Only add search and category if they have values and meet minimum length requirements
      if (searchTerm && searchTerm.trim() && searchTerm.trim().length >= 2) {
        queryParams.q = searchTerm.trim();
      }
      if (categoryFilter && categoryFilter.trim()) {
        queryParams.category = categoryFilter.trim();
      }
      
      // Handle status filter
      if (statusFilter && statusFilter.trim()) {
        if (statusFilter === 'pending') {
          queryParams.approvalStatus = 'pending';
        } else if (statusFilter === 'approved') {
          queryParams.approvalStatus = 'approved';
        } else if (statusFilter === 'rejected') {
          queryParams.approvalStatus = 'rejected';
        }
      }

      const params = new URLSearchParams(queryParams);
      console.log('Doctor - Fetching products with params:', params.toString());

      const response = await api.get(`/products?${params}`);
      console.log('Doctor - Fetched products:', response.data.data.products);
      
      // Filter products created by the current doctor
      const doctorProducts = response.data.data.products.filter(product => 
        product.createdBy === user._id
      );
      setProducts(doctorProducts);
      setTotalPages(response.data.data.totalPages);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load products';
      setError(errorMessage);
      console.error('Products error:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    // Client-side validation
    if (productForm.name.length < 5 || productForm.name.length > 200) {
      setError('Product name must be between 5 and 200 characters');
      return;
    }
    if (productForm.description.length < 20 || productForm.description.length > 2000) {
      setError('Description must be between 20 and 2000 characters');
      return;
    }
    if (productForm.brand.length < 2 || productForm.brand.length > 100) {
      setError('Brand must be between 2 and 100 characters');
      return;
    }
    if (!productForm.category) {
      setError('Please select a category');
      return;
    }
    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    try {
      setError(null); // Clear any previous errors
      const productData = {
        ...productForm,
        price: {
          current: parseFloat(productForm.price),
          currency: 'USD'
        },
        inventory: {
          stock: parseInt(productForm.stock),
          lowStockThreshold: parseInt(productForm.lowStockThreshold)
        }
      };
      
      const response = await api.post('/products', productData);
      const product = response.data.data.product;
      
      // Upload images if any are selected
      if (selectedImages.length > 0) {
        try {
          await uploadImages(product._id);
        } catch (imageError) {
          console.error('Image upload failed:', imageError);
          // Don't fail the entire operation if image upload fails
        }
      }
      
      setAddDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to add product';
      setError(errorMessage);
      console.error('Add product error:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const handleUpdateProduct = async () => {
    // Client-side validation
    if (productForm.name.length < 5 || productForm.name.length > 200) {
      setError('Product name must be between 5 and 200 characters');
      return;
    }
    if (productForm.description.length < 20 || productForm.description.length > 2000) {
      setError('Description must be between 20 and 2000 characters');
      return;
    }
    if (productForm.brand.length < 2 || productForm.brand.length > 100) {
      setError('Brand must be between 2 and 100 characters');
      return;
    }
    if (!productForm.category) {
      setError('Please select a category');
      return;
    }
    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    try {
      setError(null); // Clear any previous errors
      const productData = {
        ...productForm,
        price: {
          current: parseFloat(productForm.price),
          currency: 'USD'
        },
        inventory: {
          stock: parseInt(productForm.stock),
          lowStockThreshold: parseInt(productForm.lowStockThreshold)
        }
      };
      await api.put(`/products/${selectedProduct._id}`, productData);
      setEditDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to update product';
      setError(errorMessage);
      console.error('Update product error:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${productId}`);
        fetchProducts();
      } catch (err) {
        setError('Failed to delete product');
        console.error('Delete product error:', err);
      }
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      category: '',
      brand: '',
      price: '',
      stock: '',
      lowStockThreshold: '',
      isActive: true,
      isFeatured: false,
    });
    setSelectedImages([]);
    setImageUploadProgress(0);
    setUploadingImages(false);
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      const newImages = imageFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        id: Date.now() + Math.random()
      }));
      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const handleImageRemove = (imageId) => {
    setSelectedImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      // Revoke object URL to free memory
      const removedImage = prev.find(img => img.id === imageId);
      if (removedImage) {
        URL.revokeObjectURL(removedImage.preview);
      }
      return updated;
    });
  };

  const uploadImages = async (productId) => {
    if (selectedImages.length === 0) return [];

    setUploadingImages(true);
    setImageUploadProgress(0);

    try {
      const formData = new FormData();
      selectedImages.forEach((imageData, index) => {
        formData.append('images', imageData.file);
      });

      const response = await api.post(`/products/${productId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setImageUploadProgress(progress);
        },
      });

      setUploadingImages(false);
      setImageUploadProgress(0);
      return response.data.data.images || [];
    } catch (error) {
      setUploadingImages(false);
      setImageUploadProgress(0);
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const openEditDialog = (product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand,
      price: product.price?.current || product.price,
      stock: product.inventory?.stock || product.stock,
      lowStockThreshold: product.inventory?.lowStockThreshold || product.lowStockThreshold,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (product) => {
    setSelectedProduct(product);
    setViewDialogOpen(true);
  };

  const getStockStatus = (product) => {
    const stock = product.inventory?.stock || product.stock || 0;
    const threshold = product.inventory?.lowStockThreshold || product.lowStockThreshold || 5;
    
    if (stock === 0) return { status: 'Out of Stock', color: 'error' };
    if (stock <= threshold) return { status: 'Low Stock', color: 'warning' };
    return { status: 'In Stock', color: 'success' };
  };

  const getApprovalStatus = (product) => {
    switch (product.approvalStatus) {
      case 'pending':
        return { status: 'Pending Approval', color: 'warning', icon: '⏳' };
      case 'approved':
        return { status: 'Approved', color: 'success', icon: '✅' };
      case 'rejected':
        return { status: 'Rejected', color: 'error', icon: '❌' };
      default:
        return { status: 'Unknown', color: 'default', icon: '❓' };
    }
  };

  const getProductRating = (reviews) => {
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => {
    const getGradientColors = (colorType) => {
      switch (colorType) {
        case 'primary':
          return 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)'; // Nature Green
        case 'warning':
          return 'linear-gradient(135deg, #FFC107 0%, #FFEB3B 100%)'; // Motivation Yellow
        case 'error':
          return 'linear-gradient(135deg, #F44336 0%, #FF5722 100%)'; // Keep red for errors
        case 'success':
          return 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)'; // Wellness Green
        case 'info':
          return 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)'; // Trust Blue
        default:
          return 'linear-gradient(135deg, #9E9E9E 0%, #BDBDBD 100%)'; // Balance Grey
      }
    };

    return (
      <Card sx={{ 
        borderRadius: '24px', 
        height: '100%', 
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: getGradientColors(color),
          opacity: 0.9,
          zIndex: -1
        }
      }}>
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {value}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: 'white', opacity: 0.95 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ opacity: 0.85, color: 'white' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ 
            opacity: 0.9,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            p: 1.5,
            backdropFilter: 'blur(10px)'
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
    );
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
      background: 'linear-gradient(135deg, #2E7D32 0%, #1976D2 50%, #4CAF50 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(46, 125, 50, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(25, 118, 210, 0.15) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(255, 193, 7, 0.1) 0%, transparent 50%), radial-gradient(circle at 60% 40%, rgba(158, 158, 158, 0.08) 0%, transparent 50%)',
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
              My Products 🛒
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
              Manage your Ayurvedic products and inventory
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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Products"
            value={products.length}
            icon={<Inventory sx={{ fontSize: 30 }} />}
            color="primary"
            subtitle={`${products.filter(p => p.isActive).length} active`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Featured Products"
            value={products.filter(p => p.isFeatured).length}
            icon={<Star sx={{ fontSize: 30 }} />}
            color="warning"
            subtitle="Highlighted items"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Low Stock"
            value={products.filter(p => {
              const stock = p.inventory?.stock || p.stock || 0;
              const threshold = p.inventory?.lowStockThreshold || p.lowStockThreshold || 5;
              return stock <= threshold;
            }).length}
            icon={<Warning sx={{ fontSize: 30 }} />}
            color="error"
            subtitle="Needs attention"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Pending Approval"
            value={products.filter(p => p.approvalStatus === 'pending').length}
            icon={<Warning sx={{ fontSize: 30 }} />}
            color="warning"
            subtitle="Awaiting admin review"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Approved"
            value={products.filter(p => p.approvalStatus === 'approved').length}
            icon={<CheckCircle sx={{ fontSize: 30 }} />}
            color="success"
            subtitle="Ready for customers"
          />
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ 
        p: 3, 
        borderRadius: '24px', 
        mb: 4,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
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
                    <Search sx={{ color: 'rgba(255,255,255,0.7)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                borderRadius: '20px',
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover fieldset': {
                    border: 'none',
                  },
                  '&.Mui-focused fieldset': {
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255,255,255,0.7)',
                  opacity: 1,
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
                sx={{
                  borderRadius: '20px',
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover fieldset': {
                      border: 'none',
                    },
                    '&.Mui-focused fieldset': {
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                    },
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'rgba(255,255,255,0.7)',
                  }
                }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.name} value={category.name}>
                    {category.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Approval Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Approval Status"
                sx={{
                  borderRadius: '20px',
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover fieldset': {
                      border: 'none',
                    },
                    '&.Mui-focused fieldset': {
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                    },
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'rgba(255,255,255,0.7)',
                  }
                }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="pending">Pending Approval</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
                sx={{
                  borderRadius: '20px',
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover fieldset': {
                      border: 'none',
                    },
                    '&.Mui-focused fieldset': {
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                    },
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'rgba(255,255,255,0.7)',
                  }
                }}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="stock">Stock</MenuItem>
                <MenuItem value="createdAt">Date Added</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              sx={{ 
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                }
              }}
            >
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={() => {
                setError(null);
                fetchProducts();
              }}
              sx={{ 
                borderRadius: '20px',
                background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
                boxShadow: '0 4px 15px rgba(46, 125, 50, 0.4)',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(45deg, #4CAF50 30%, #2E7D32 90%)',
                  boxShadow: '0 6px 20px rgba(46, 125, 50, 0.6)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {products.map((product) => {
          const stockStatus = getStockStatus(product);
          const approvalStatus = getApprovalStatus(product);
          const rating = getProductRating(product.reviews);
          const price = product.price?.current || product.price;
          
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product._id}>
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
                      console.log('Doctor - Image failed to load:', e.target.src);
                      e.target.src = 'http://localhost:5000/api/products/placeholder/300/200';
                    }}
                  />
                  <Chip
                    label={`${approvalStatus.icon} ${approvalStatus.status}`}
                    color={approvalStatus.color}
                    size="small"
                    sx={{ 
                      position: 'absolute', 
                      top: 12, 
                      right: 12,
                      background: approvalStatus.color === 'warning' ? 'rgba(255, 193, 7, 0.9)' : 
                                 approvalStatus.color === 'success' ? 'rgba(46, 125, 50, 0.9)' : 
                                 'rgba(244, 67, 54, 0.9)',
                      backdropFilter: 'blur(10px)',
                      fontWeight: 600,
                      color: 'white'
                    }}
                  />
                  {product.isFeatured && (
                    <Chip
                      icon={<Star />}
                      label="Featured"
                      color="warning"
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        top: 12, 
                        left: 12,
                        background: 'rgba(255, 193, 7, 0.9)',
                        backdropFilter: 'blur(10px)',
                        fontWeight: 600,
                        color: 'white'
                      }}
                    />
                  )}
                </Box>

                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
                    {product.description?.substring(0, 100)}...
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#2E7D32', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                      ${price}
                    </Typography>
                    {rating > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                        <Star sx={{ fontSize: 16, color: '#FFC107' }} />
                        <Typography variant="body2" sx={{ ml: 0.5, color: 'white', fontWeight: 600 }}>
                          {rating}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={categories.find(c => c.name === product.category)?.displayName || product.category}
                      size="small"
                      sx={{
                        background: 'rgba(158, 158, 158, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(158, 158, 158, 0.3)',
                        fontWeight: 500
                      }}
                    />
                    <Typography variant="body2" sx={{ ml: 1, color: 'rgba(255,255,255,0.7)' }}>
                      {product.brand}
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Stock: {product.inventory?.stock || product.stock || 0} units
                  </Typography>
                  
                  {product.approvalNotes && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1, fontStyle: 'italic' }}>
                      Note: {product.approvalNotes}
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => openViewDialog(product)}
                    sx={{ 
                      borderRadius: '20px',
                      background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #42A5F5 30%, #1976D2 90%)',
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => openEditDialog(product)}
                    sx={{ 
                      borderRadius: '20px',
                      background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(46, 125, 50, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #4CAF50 30%, #2E7D32 90%)',
                        boxShadow: '0 4px 12px rgba(46, 125, 50, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Delete />}
                    onClick={() => handleDeleteProduct(product._id)}
                    sx={{ 
                      borderRadius: '20px',
                      background: 'linear-gradient(45deg, #9E9E9E 30%, #F44336 90%)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(158, 158, 158, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #F44336 30%, #9E9E9E 90%)',
                        boxShadow: '0 4px 12px rgba(158, 158, 158, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {products.length === 0 && !loading && (
      <Box sx={{ textAlign: 'center', py: 8 }}>
          <Inventory sx={{ fontSize: 80, color: 'rgba(255,255,255,0.6)', mb: 2 }} />
        <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
            No Products Found
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255,255,255,0.8)' }}>
            Start by adding your first Ayurvedic product to the inventory.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
            sx={{ 
              borderRadius: '20px',
              background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
              boxShadow: '0 4px 15px rgba(46, 125, 50, 0.4)',
              fontWeight: 600,
              fontSize: '1.1rem',
              py: 1.5,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(45deg, #4CAF50 30%, #2E7D32 90%)',
                boxShadow: '0 6px 20px rgba(46, 125, 50, 0.6)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Add Product
          </Button>
        </Box>
      )}

      {/* Add Product Dialog */}
      <Dialog open={addDialogOpen} onClose={() => { setAddDialogOpen(false); setError(null); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          Add New Product
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Product Name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Brand"
                  value={productForm.brand}
                  onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Stock Quantity"
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Low Stock Threshold"
                  type="number"
                  value={productForm.lowStockThreshold}
                  onChange={(e) => setProductForm({...productForm, lowStockThreshold: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={productForm.isActive}
                      onChange={(e) => setProductForm({...productForm, isActive: e.target.checked})}
                    />
                  }
                  label="Active Product"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={productForm.isFeatured}
                      onChange={(e) => setProductForm({...productForm, isFeatured: e.target.checked})}
                    />
                  }
                  label="Featured Product"
                />
              </Grid>
              
              {/* Image Upload Section */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Product Images
                </Typography>
                
                {/* Image Upload Button */}
                <Box sx={{ mb: 2 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="doctor-image-upload"
                    multiple
                    type="file"
                    onChange={handleImageSelect}
                  />
                  <label htmlFor="doctor-image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{ borderRadius: '15px' }}
                    >
                      Upload Images
                    </Button>
                  </label>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Upload up to 5 images (JPG, PNG, GIF)
                  </Typography>
                </Box>

                {/* Upload Progress */}
                {uploadingImages && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Uploading images... {imageUploadProgress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={imageUploadProgress} />
                  </Box>
                )}

                {/* Selected Images Preview */}
                {selectedImages.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    {selectedImages.map((imageData) => (
                      <Box
                        key={imageData.id}
                        sx={{
                          position: 'relative',
                          width: 120,
                          height: 120,
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: '2px solid #e0e0e0',
                        }}
                      >
                        <img
                          src={imageData.preview}
                          alt="Preview"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleImageRemove(imageData.id)}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setAddDialogOpen(false)}
            sx={{ borderRadius: '15px' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddProduct}
            disabled={uploadingImages}
            sx={{ 
              borderRadius: '15px',
              background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(45deg, #4CAF50 30%, #2E7D32 90%)',
              },
              '&:disabled': {
                background: 'rgba(158, 158, 158, 0.3)',
                color: 'rgba(255, 255, 255, 0.6)',
              }
            }}
          >
            {uploadingImages ? 'Uploading...' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onClose={() => { setEditDialogOpen(false); setError(null); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          Edit Product - {selectedProduct?.name}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Product Name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Brand"
                  value={productForm.brand}
                  onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Stock Quantity"
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Low Stock Threshold"
                  type="number"
                  value={productForm.lowStockThreshold}
                  onChange={(e) => setProductForm({...productForm, lowStockThreshold: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={productForm.isActive}
                      onChange={(e) => setProductForm({...productForm, isActive: e.target.checked})}
                    />
                  }
                  label="Active Product"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={productForm.isFeatured}
                      onChange={(e) => setProductForm({...productForm, isFeatured: e.target.checked})}
                    />
                  }
                  label="Featured Product"
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            sx={{ borderRadius: '15px' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateProduct}
            sx={{ 
              borderRadius: '15px',
              background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(45deg, #4CAF50 30%, #2E7D32 90%)',
              }
            }}
          >
            Update Product
          </Button>
        </DialogActions>
      </Dialog>

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
                    console.log('Doctor - View dialog image failed to load:', e.target.src);
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
                    label={categories.find(c => c.name === selectedProduct.category)?.displayName || selectedProduct.category}
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
                <Typography variant="body2" color="text.secondary">
                  Low Stock Threshold: {selectedProduct.inventory?.lowStockThreshold || selectedProduct.lowStockThreshold || 5} units
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={selectedProduct.isActive ? 'Active' : 'Inactive'}
                    color={selectedProduct.isActive ? 'success' : 'default'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {selectedProduct.isFeatured && (
                    <Chip
                      icon={<Star />}
                      label="Featured"
                      color="warning"
                      size="small"
                    />
                  )}
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

      {/* Floating Action Button */}
      <Fab
        aria-label="add product"
        onClick={() => setAddDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          borderRadius: '24px',
          background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
          boxShadow: '0 8px 32px rgba(46, 125, 50, 0.4)',
          '&:hover': {
            background: 'linear-gradient(45deg, #4CAF50 30%, #2E7D32 90%)',
            boxShadow: '0 12px 40px rgba(46, 125, 50, 0.6)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <Add sx={{ color: 'white', fontSize: 28 }} />
      </Fab>
      </Container>
    </Box>
  );
};

export default DoctorProducts;