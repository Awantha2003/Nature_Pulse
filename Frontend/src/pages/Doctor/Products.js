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
  Collapse,
  Slide,
  Grow,
  Skeleton,
  CardActionArea,
  CardHeader,
  CardOverflow,
  AspectRatio,
  Modal,
  Backdrop,
  useTheme,
  alpha,
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

  const StatCard = ({ title, value, icon, color, subtitle, delay = 0 }) => {
    const getGradientColors = (colorType) => {
      switch (colorType) {
        case 'primary':
          return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        case 'warning':
          return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        case 'error':
          return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
        case 'success':
          return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        case 'info':
          return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
        default:
          return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
      }
    };

    return (
      <Grow in timeout={800 + delay}>
      <Card sx={{ 
          borderRadius: '28px', 
        height: '100%', 
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        position: 'relative',
        overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            '& .stat-icon': {
              transform: 'scale(1.1) rotate(5deg)',
            },
            '& .stat-value': {
              transform: 'scale(1.05)',
            }
          },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: getGradientColors(color),
            opacity: 0.8,
            zIndex: -1,
            transition: 'opacity 0.3s ease'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -50,
            right: -50,
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: -1,
            transition: 'all 0.3s ease'
          },
          '&:hover::after': {
            transform: 'scale(1.5)',
            opacity: 0.3
          }
        }}>
        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h3" 
                className="stat-value"
                sx={{ 
                  fontWeight: 900, 
                  mb: 1, 
                  color: 'white', 
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  transition: 'transform 0.3s ease'
                }}
              >
              {value}
            </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 0.5, 
                  color: 'white', 
                  opacity: 0.95,
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  letterSpacing: '0.02em'
                }}
              >
              {title}
            </Typography>
            {subtitle && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    opacity: 0.85, 
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: 500
                  }}
                >
                {subtitle}
              </Typography>
            )}
          </Box>
            <Box 
              className="stat-icon"
              sx={{ 
            opacity: 0.9,
                background: 'rgba(255, 255, 255, 0.25)',
                borderRadius: '20px',
                p: 2,
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
              }}
            >
              {React.cloneElement(icon, { 
                sx: { 
                  fontSize: { xs: 28, md: 32 },
                  color: 'white',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                } 
              })}
            </Box>
          </Box>
          
          {/* Progress indicator */}
          <Box sx={{ 
            width: '100%', 
            height: '4px', 
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
            mt: 2
          }}>
            <Box sx={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
              borderRadius: '2px',
              animation: 'shimmer 2s ease-in-out infinite'
            }} />
        </Box>
      </CardContent>
    </Card>
      </Grow>
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(240, 147, 251, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 60% 40%, rgba(245, 87, 108, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 10% 90%, rgba(79, 172, 254, 0.3) 0%, transparent 50%)
        `,
        zIndex: 0,
        animation: 'float 20s ease-in-out infinite'
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        zIndex: 0,
        animation: 'drift 30s linear infinite'
      },
      '@keyframes float': {
        '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
        '50%': { transform: 'translateY(-20px) rotate(5deg)' }
      },
      '@keyframes drift': {
        '0%': { transform: 'translateX(0px)' },
        '100%': { transform: 'translateX(60px)' }
      }
    }}>
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <Fade in timeout={800}>
          <Box sx={{ 
            mb: 6, 
            textAlign: 'center',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -20,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              zIndex: -1,
              animation: 'pulse 3s ease-in-out infinite'
            },
            '@keyframes pulse': {
              '0%, 100%': { transform: 'translateX(-50%) scale(1)', opacity: 0.5 },
              '50%': { transform: 'translateX(-50%) scale(1.1)', opacity: 0.8 }
            }
          }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 900,
                background: 'linear-gradient(45deg, #ffffff 30%, #f0f0f0 70%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                letterSpacing: '-0.02em',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '100px',
                  height: '4px',
                  background: 'linear-gradient(90deg, transparent, #ffffff, transparent)',
                  borderRadius: '2px'
                }
              }}
            >
              🌿 My Product Universe 🌿
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'rgba(255,255,255,0.95)', 
                fontWeight: 400,
                mb: 3,
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                letterSpacing: '0.02em',
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Craft, manage, and showcase your Ayurvedic treasures with precision and passion
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 2, 
              flexWrap: 'wrap',
              mt: 3
            }}>
              <Chip 
                icon={<MedicalServices />}
                label="Natural Healing"
                sx={{ 
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  fontSize: '0.9rem'
                }}
              />
              <Chip 
                icon={<Inventory />}
                label="Smart Inventory"
                sx={{ 
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  fontSize: '0.9rem'
                }}
              />
              <Chip 
                icon={<TrendingUp />}
                label="Growth Analytics"
                sx={{ 
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  fontSize: '0.9rem'
                }}
              />
            </Box>
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
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Total Products"
            value={products.length}
            icon={<Inventory />}
            color="primary"
            subtitle={`${products.filter(p => p.isActive).length} active`}
            delay={0}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Featured"
            value={products.filter(p => p.isFeatured).length}
            icon={<Star />}
            color="warning"
            subtitle="Highlighted items"
            delay={100}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Low Stock"
            value={products.filter(p => {
              const stock = p.inventory?.stock || p.stock || 0;
              const threshold = p.inventory?.lowStockThreshold || p.lowStockThreshold || 5;
              return stock <= threshold;
            }).length}
            icon={<Warning />}
            color="error"
            subtitle="Needs attention"
            delay={200}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Pending"
            value={products.filter(p => p.approvalStatus === 'pending').length}
            icon={<Schedule />}
            color="warning"
            subtitle="Awaiting review"
            delay={300}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Approved"
            value={products.filter(p => p.approvalStatus === 'approved').length}
            icon={<CheckCircle />}
            color="success"
            subtitle="Live & ready"
            delay={400}
          />
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Slide in timeout={1000} direction="up">
      <Card sx={{ 
          p: 4, 
          borderRadius: '32px', 
          mb: 6,
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe)',
            backgroundSize: '200% 100%',
            animation: 'gradientShift 3s ease infinite'
          },
          '@keyframes gradientShift': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' }
          }
        }}>
        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="🔍 Search your products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '1.2rem'
                    }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '25px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(15px)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 0.25)',
                    border: '2px solid rgba(255, 255, 255, 0.6)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)'
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255,255,255,0.8)',
                  opacity: 1,
                  fontWeight: 500
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>📂 Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="📂 Category"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '25px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(15px)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    transition: 'all 0.3s ease',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                    },
                    '&.Mui-focused': {
                      background: 'rgba(255, 255, 255, 0.25)',
                      border: '2px solid rgba(255, 255, 255, 0.6)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)'
                    },
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '1.2rem'
                  }
                }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.name} value={category.name} sx={{
                    fontWeight: 500,
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}>
                    {category.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>⚡ Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="⚡ Status"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '25px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(15px)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    transition: 'all 0.3s ease',
                    '& fieldset': { border: 'none' },
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                    },
                    '&.Mui-focused': {
                      background: 'rgba(255, 255, 255, 0.25)',
                      border: '2px solid rgba(255, 255, 255, 0.6)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)'
                    },
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '1.2rem'
                  }
                }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="pending">⏳ Pending</MenuItem>
                <MenuItem value="approved">✅ Approved</MenuItem>
                <MenuItem value="rejected">❌ Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>🔀 Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="🔀 Sort By"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '25px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(15px)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    transition: 'all 0.3s ease',
                    '& fieldset': { border: 'none' },
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                    },
                    '&.Mui-focused': {
                      background: 'rgba(255, 255, 255, 0.25)',
                      border: '2px solid rgba(255, 255, 255, 0.6)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)'
                    },
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '1.2rem'
                  }
                }}
              >
                <MenuItem value="name">📝 Name</MenuItem>
                <MenuItem value="price">💰 Price</MenuItem>
                <MenuItem value="stock">📦 Stock</MenuItem>
                <MenuItem value="createdAt">📅 Date Added</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              sx={{ 
                borderRadius: '25px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(15px)',
                fontWeight: 600,
                fontSize: '0.9rem',
                px: 2,
                py: 1.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.25)',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                }
              }}
            >
              {sortOrder === 'asc' ? '⬆️' : '⬇️'}
            </Button>
          </Grid>
          <Grid size={{ xs: 12, md: 1 }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={() => {
                setError(null);
                fetchProducts();
              }}
              sx={{ 
                borderRadius: '25px',
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                fontWeight: 700,
                fontSize: '0.9rem',
                px: 2,
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                  boxShadow: '0 12px 30px rgba(102, 126, 234, 0.6)',
                  transform: 'translateY(-2px) scale(1.02)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              🔄
            </Button>
          </Grid>
        </Grid>
      </Card>
      </Slide>

      {/* Products Grid */}
      <Grid container spacing={4}>
        {products.map((product, index) => {
          const stockStatus = getStockStatus(product);
          const approvalStatus = getApprovalStatus(product);
          const rating = getProductRating(product.reviews);
          const price = product.price?.current || product.price;
          
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product._id}>
              <Zoom in timeout={1000 + (index * 100)}>
              <Card sx={{ 
                  borderRadius: '32px', 
                height: '100%', 
                position: 'relative',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(25px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                '&:hover': {
                    transform: 'translateY(-12px) scale(1.02)',
                    boxShadow: '0 32px 64px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    '& .product-image': {
                      transform: 'scale(1.1)',
                    },
                    '& .product-actions': {
                      opacity: 1,
                      transform: 'translateY(0)',
                    },
                    '& .product-overlay': {
                      opacity: 1,
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 50%, rgba(240, 147, 251, 0.1) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    zIndex: 1
                  },
                  '&:hover::before': {
                    opacity: 1
                }
              }}>
                {/* Product Image */}
                <Box sx={{ 
                  position: 'relative', 
                  overflow: 'hidden',
                  borderRadius: '32px 32px 0 0',
                  height: '220px'
                }}>
                  <CardMedia
                    component="img"
                    height="220"
                    image={getImageUrl(product.images?.[0]?.url)}
                    alt={product.name}
                    className="product-image"
                    sx={{ 
                      borderRadius: '32px 32px 0 0',
                      transition: 'transform 0.4s ease',
                      objectFit: 'cover',
                      width: '100%'
                    }}
                    onError={(e) => {
                      console.log('Doctor - Image failed to load:', e.target.src);
                      e.target.src = 'http://localhost:5000/api/products/placeholder/300/200';
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <Box className="product-overlay" sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    zIndex: 2
                  }} />
                  
                  {/* Status Chips */}
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    right: 16, 
                    zIndex: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}>
                  <Chip
                    label={`${approvalStatus.icon} ${approvalStatus.status}`}
                    size="small"
                    sx={{ 
                        background: approvalStatus.color === 'warning' ? 'rgba(255, 193, 7, 0.95)' : 
                                   approvalStatus.color === 'success' ? 'rgba(46, 125, 50, 0.95)' : 
                                   'rgba(244, 67, 54, 0.95)',
                        backdropFilter: 'blur(15px)',
                        fontWeight: 700,
                        color: 'white',
                        fontSize: '0.75rem',
                        height: '28px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  />
                  {product.isFeatured && (
                    <Chip
                        icon={<Star sx={{ fontSize: '0.8rem' }} />}
                      label="Featured"
                      size="small"
                      sx={{ 
                          background: 'rgba(255, 193, 7, 0.95)',
                          backdropFilter: 'blur(15px)',
                          fontWeight: 700,
                          color: 'white',
                          fontSize: '0.75rem',
                          height: '28px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  )}
                </Box>

                  {/* Stock Status Indicator */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    zIndex: 3
                  }}>
                    <Chip
                      label={stockStatus.status}
                      size="small"
                      sx={{
                        background: stockStatus.color === 'success' ? 'rgba(76, 175, 80, 0.95)' :
                                   stockStatus.color === 'warning' ? 'rgba(255, 152, 0, 0.95)' :
                                   'rgba(244, 67, 54, 0.95)',
                        backdropFilter: 'blur(15px)',
                        fontWeight: 700,
                        color: 'white',
                        fontSize: '0.75rem',
                        height: '28px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                  </Box>
                </Box>

                <CardContent sx={{ p: 4, position: 'relative', zIndex: 2 }}>
                  {/* Product Title */}
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 800, 
                      mb: 2, 
                      color: 'white',
                      fontSize: '1.1rem',
                      lineHeight: 1.3,
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      minHeight: '2.6rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {product.name}
                  </Typography>
                  
                  {/* Product Description */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 3, 
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      minHeight: '2.7rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {product.description?.substring(0, 120)}...
                  </Typography>
                  
                  {/* Price and Rating */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 3,
                    p: 2,
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 900, 
                        color: 'white', 
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        fontSize: '1.3rem'
                      }}
                    >
                      ${price}
                    </Typography>
                    {rating > 0 && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        background: 'rgba(255, 193, 7, 0.2)',
                        borderRadius: '12px',
                        px: 1.5,
                        py: 0.5
                      }}>
                        <Star sx={{ fontSize: 18, color: '#FFC107', mr: 0.5 }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'white', 
                            fontWeight: 700,
                            fontSize: '0.9rem'
                          }}
                        >
                          {rating}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Category and Brand */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 3
                  }}>
                    <Chip
                      label={categories.find(c => c.name === product.category)?.displayName || product.category}
                      size="small"
                      sx={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        height: '32px',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255,255,255,0.8)',
                        fontWeight: 500,
                        fontSize: '0.85rem'
                      }}
                    >
                      {product.brand}
                    </Typography>
                  </Box>

                  {/* Stock Info */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    p: 2,
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    mb: 2
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}
                    >
                      📦 Stock: {product.inventory?.stock || product.stock || 0} units
                  </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.8rem'
                      }}
                    >
                      Threshold: {product.inventory?.lowStockThreshold || product.lowStockThreshold || 5}
                    </Typography>
                  </Box>
                  
                  {/* Approval Notes */}
                  {product.approvalNotes && (
                    <Box sx={{
                      p: 2,
                      background: 'rgba(255, 152, 0, 0.1)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 152, 0, 0.2)',
                      mb: 2
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255,255,255,0.9)', 
                          fontStyle: 'italic',
                          fontSize: '0.8rem',
                          fontWeight: 500
                        }}
                      >
                        💬 Note: {product.approvalNotes}
                    </Typography>
                    </Box>
                  )}
                </CardContent>

                <CardActions 
                  className="product-actions"
                  sx={{ 
                    p: 4, 
                    pt: 0, 
                    position: 'relative', 
                    zIndex: 2,
                    opacity: 0,
                    transform: 'translateY(20px)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap'
                  }}
                >
                  <Button
                    size="small"
                    startIcon={<Visibility sx={{ fontSize: '1rem' }} />}
                    onClick={() => openViewDialog(product)}
                    sx={{ 
                      borderRadius: '25px',
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      px: 2,
                      py: 1,
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                      flex: 1,
                      minWidth: '80px',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                        transform: 'translateY(-2px) scale(1.02)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    👁️ View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Edit sx={{ fontSize: '1rem' }} />}
                    onClick={() => openEditDialog(product)}
                    sx={{ 
                      borderRadius: '25px',
                      background: 'linear-gradient(45deg, #43e97b 30%, #38f9d7 90%)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      px: 2,
                      py: 1,
                      boxShadow: '0 4px 15px rgba(67, 233, 123, 0.4)',
                      flex: 1,
                      minWidth: '80px',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #38f9d7 30%, #43e97b 90%)',
                        boxShadow: '0 6px 20px rgba(67, 233, 123, 0.6)',
                        transform: 'translateY(-2px) scale(1.02)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    ✏️ Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Delete sx={{ fontSize: '1rem' }} />}
                    onClick={() => handleDeleteProduct(product._id)}
                    sx={{ 
                      borderRadius: '25px',
                      background: 'linear-gradient(45deg, #ff6b6b 30%, #ee5a24 90%)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      px: 2,
                      py: 1,
                      boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
                      flex: 1,
                      minWidth: '80px',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #ee5a24 30%, #ff6b6b 90%)',
                        boxShadow: '0 6px 20px rgba(255, 107, 107, 0.6)',
                        transform: 'translateY(-2px) scale(1.02)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    🗑️ Delete
                  </Button>
                </CardActions>
              </Card>
              </Zoom>
            </Grid>
          );
        })}
      </Grid>

      {products.length === 0 && !loading && (
        <Fade in timeout={1200}>
          <Box sx={{ 
            textAlign: 'center', 
            py: 12,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              zIndex: 0
            }
          }}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{
                display: 'inline-flex',
                p: 4,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                mb: 4,
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                <Inventory sx={{ 
                  fontSize: 100, 
                  color: 'rgba(255,255,255,0.8)',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                }} />
              </Box>
              
              <Typography 
                variant="h3" 
                sx={{ 
                  color: 'white', 
                  mb: 3, 
                  fontWeight: 800,
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  background: 'linear-gradient(45deg, #ffffff 30%, #f0f0f0 70%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                🌱 No Products Yet
          </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 4, 
                  color: 'rgba(255,255,255,0.9)',
                  maxWidth: '500px',
                  mx: 'auto',
                  lineHeight: 1.6,
                  fontWeight: 400
                }}
              >
                Ready to share your Ayurvedic wisdom with the world? 
                <br />
                Let's create your first product masterpiece! ✨
          </Typography>
              
          <Button
            variant="contained"
                startIcon={<Add sx={{ fontSize: '1.2rem' }} />}
            onClick={() => setAddDialogOpen(true)}
            sx={{ 
                  borderRadius: '30px',
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                  fontWeight: 700,
              fontSize: '1.1rem',
                  py: 2,
                  px: 4,
                  textTransform: 'none',
              '&:hover': {
                    background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                    boxShadow: '0 12px 30px rgba(102, 126, 234, 0.6)',
                    transform: 'translateY(-3px) scale(1.05)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                🚀 Create Your First Product
          </Button>
        </Box>
          </Box>
        </Fade>
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
          bottom: 32,
          right: 32,
          borderRadius: '32px',
          width: 64,
          height: 64,
          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
          boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)',
          '&:hover': {
            background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
            boxShadow: '0 16px 50px rgba(102, 126, 234, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            transform: 'scale(1.1) rotate(5deg)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: 'float 3s ease-in-out infinite'
        }}
      >
        <Add sx={{ 
          color: 'white', 
          fontSize: 32,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
        }} />
      </Fab>
      </Container>
    </Box>
  );
};

export default DoctorProducts;