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
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
  Chip,
  Switch,
  FormControlLabel,
  Stack,
  Rating,
  LinearProgress,
  Tabs,
  Tab,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Inventory,
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  Refresh,
  Star,
  Warning,
  Category,
  CloudUpload,
  Image,
  Delete as DeleteIcon,
  CheckCircle,
  Cancel,
  Person,
  Schedule,
  Approval,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const AdminCatalog = () => {
  const { user } = useAuth();
  
  // Helper function to construct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return 'http://localhost:5000/api/products/placeholder/300/200';
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Handle different path formats (both / and \ separators)
    let filename;
    if (imagePath.includes('/') || imagePath.includes('\\')) {
      // Full path: "uploads/products/filename.png" or "uploads\products\filename.png" -> "filename.png"
      filename = imagePath.split(/[/\\]/).pop();
    } else {
      // Just filename: "filename.png" -> "filename.png"
      filename = imagePath;
    }
    
    // Clean the filename to ensure it's valid
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    
    const fullUrl = `http://localhost:5000/api/products/images/${filename}`;
    return fullUrl;
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
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
  
  // Tab and approval states
  const [currentTab, setCurrentTab] = useState(0);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    if (currentTab === 1) {
      fetchPendingProducts();
    }
  }, [searchTerm, categoryFilter, statusFilter, sortBy, sortOrder, currentTab]);

  const fetchPendingProducts = async () => {
    try {
      const response = await api.get('/products/pending');
      setPendingProducts(response.data.data.products);
    } catch (err) {
      setError('Failed to load pending products');
      console.error('Error fetching pending products:', err);
    }
  };

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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: 1,
        limit: 20,
        q: searchTerm,
        category: categoryFilter,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      const response = await api.get(`/products?${params}`);
      setProducts(response.data.data.products || []);
    } catch (err) {
      setError('Failed to load products');
      console.error('Products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Use predefined categories that match backend validation
      const predefinedCategories = [
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
      setCategories(predefinedCategories);
    } catch (err) {
      console.error('Categories error:', err);
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
      const productId = response.data.data.product._id;
      
      // Upload images if any are selected
      if (selectedImages.length > 0) {
        await uploadImages(productId);
      }
      
      setAddDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
      console.error('Add product error:', err);
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
      setError(err.response?.data?.message || 'Failed to update product');
      console.error('Update product error:', err);
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

  const getStockStatus = (product) => {
    const stock = product.inventory?.stock || product.stock || 0;
    const threshold = product.inventory?.lowStockThreshold || product.lowStockThreshold || 5;
    
    if (stock === 0) return { status: 'out_of_stock', color: 'error', text: 'Out of Stock' };
    if (stock <= threshold) return { status: 'low_stock', color: 'warning', text: 'Low Stock' };
    return { status: 'in_stock', color: 'success', text: 'In Stock' };
  };

  const getProductRating = (reviews) => {
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ borderRadius: '20px', height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: `${color}.main` }}>
              {value}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ 
            bgcolor: `${color}.light`, 
            borderRadius: '50%', 
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
            Product Catalog 📦
          </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Tooltip title="Refresh Data">
                <IconButton onClick={fetchProducts}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddDialogOpen(true)}
                sx={{ borderRadius: '15px' }}
              >
                Add Product
              </Button>
            </Box>
          </Box>
          <Typography variant="h6" color="text.secondary">
            Manage your complete product catalog with inventory tracking and performance analytics
          </Typography>
        </Box>
      </Fade>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab 
            label="Product Catalog" 
            icon={<Inventory />} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            label={`Pending Approvals (${pendingProducts.length})`} 
            icon={<Approval />} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Total Products"
                value={products.length}
                icon={<Inventory sx={{ fontSize: 30, color: 'primary.main' }} />}
                color="primary"
                subtitle={`${products.filter(p => p.isActive).length} active`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Featured Products"
                value={products.filter(p => p.isFeatured).length}
                icon={<Star sx={{ fontSize: 30, color: 'warning.main' }} />}
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
                icon={<Warning sx={{ fontSize: 30, color: 'error.main' }} />}
                color="error"
                subtitle="Needs attention"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Categories"
                value={categories.length}
                icon={<Category sx={{ fontSize: 30, color: 'success.main' }} />}
                color="success"
                subtitle="Product categories"
              />
            </Grid>
          </Grid>

      {/* Filters and Search */}
      <Card sx={{ p: 3, borderRadius: '20px', mb: 4 }}>
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
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
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
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="featured">Featured</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
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
              sx={{ borderRadius: '15px' }}
            >
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {products.map((product) => {
          const stockStatus = getStockStatus(product);
          const rating = getProductRating(product.reviews);
          const price = product.price?.current || product.price;
          
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product._id}>
              <Card sx={{ borderRadius: '20px', height: '100%', position: 'relative' }}>
                {/* Product Image */}
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={getImageUrl(product.images?.[0]?.url)}
                    alt={product.name}
                    sx={{ borderRadius: '20px 20px 0 0' }}
                    onError={(e) => {
                      console.error('Image failed to load:', e.target.src);
                      e.target.src = 'http://localhost:5000/api/products/placeholder/300/200';
                    }}
                  />
                  <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                    <Chip 
                      label={stockStatus.text} 
                      size="small" 
                      color={stockStatus.color}
                      variant="filled"
                    />
                  </Box>
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    {product.isFeatured && (
                      <Chip 
                        label="Featured" 
                        size="small" 
                        color="warning"
                        variant="filled"
                        icon={<Star />}
                      />
                    )}
                  </Box>
                </Box>

                <CardContent>
                  {/* Product Info */}
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }} noWrap>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {product.brand}
                  </Typography>
                  
                  {/* Rating */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={rating} precision={0.1} size="small" readOnly />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({product.reviews?.length || 0})
                    </Typography>
                  </Box>

                  {/* Price */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      ${price}
                    </Typography>
                  </Box>

                  {/* Stock Info */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Stock: {product.inventory?.stock || product.stock || 0} units
                  </Typography>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSelectedProduct(product);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Product">
                      <IconButton 
                        size="small" 
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Product">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteProduct(product._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Add Product Dialog */}
      <Dialog open={addDialogOpen} onClose={() => { setAddDialogOpen(false); setError(null); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Add New Product
          </Typography>
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
                      <MenuItem key={category._id || category} value={category.name || category}>
                        {category.name || category}
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
                    id="image-upload"
                    multiple
                    type="file"
                    onChange={handleImageSelect}
                  />
                  <label htmlFor="image-upload">
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
          <Button onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddProduct}
            disabled={uploadingImages}
            sx={{ borderRadius: '15px' }}
          >
            {uploadingImages ? 'Uploading...' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onClose={() => { setEditDialogOpen(false); setError(null); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Edit Product - {selectedProduct?.name}
          </Typography>
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
                      <MenuItem key={category._id || category} value={category.name || category}>
                        {category.name || category}
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
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateProduct}
            sx={{ borderRadius: '15px' }}
          >
            Update Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Product Details - {selectedProduct?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CardMedia
                    component="img"
                    height="300"
                    image={getImageUrl(selectedProduct.images?.[0]?.url)}
                    alt={selectedProduct.name}
                    sx={{ borderRadius: '15px' }}
                    onError={(e) => {
                      console.error('View dialog image failed to load:', e.target.src);
                      e.target.src = 'http://localhost:5000/api/products/placeholder/400/300';
                    }}
                    onLoad={() => {
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
                    {selectedProduct.name}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedProduct.brand}
        </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={getProductRating(selectedProduct.reviews)} precision={0.1} readOnly />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({selectedProduct.reviews?.length || 0} reviews)
        </Typography>
      </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
                    ${selectedProduct.price?.current || selectedProduct.price}
                  </Typography>
                  <Chip 
                    label={getStockStatus(selectedProduct).text} 
                    color={getStockStatus(selectedProduct).color}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedProduct.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stock: {selectedProduct.inventory?.stock || selectedProduct.stock || 0} units
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
        </>
      )}

      {/* Pending Approvals Tab */}
      {currentTab === 1 && (
        <>
          {/* Summary Card for Pending Approvals */}
          <Card sx={{ p: 3, borderRadius: '20px', mb: 4, bgcolor: 'warning.light' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.dark', mb: 1 }}>
                  {pendingProducts.length}
                </Typography>
                <Typography variant="h6" sx={{ color: 'warning.dark', opacity: 0.9 }}>
                  Products Pending Approval
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={fetchPendingProducts}
                sx={{ borderRadius: '15px' }}
              >
                Refresh
              </Button>
            </Box>
          </Card>

          {/* Pending Products Grid */}
          <Grid container spacing={3}>
            {pendingProducts.map((product) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product._id}>
                <Card sx={{ borderRadius: '20px', height: '100%', position: 'relative' }}>
                  {/* Product Image */}
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={getImageUrl(product.images?.[0]?.url)}
                      alt={product.name}
                      sx={{ borderRadius: '20px 20px 0 0' }}
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
                        fontWeight: 600
                      }}
                    />
                  </Box>

                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {product.description?.substring(0, 100)}...
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        ${product.price?.current || product.price}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Chip
                        label={product.category}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {product.brand}
                      </Typography>
                    </Box>

                    {/* Doctor Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                        <Person sx={{ fontSize: 16 }} />
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        {product.createdBy?.name || 'Unknown Doctor'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Schedule sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => {
                        setSelectedProduct(product);
                        setViewDialogOpen(true);
                      }}
                      sx={{ borderRadius: '15px' }}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<CheckCircle />}
                      onClick={() => openApproveDialog(product)}
                      color="success"
                      sx={{ borderRadius: '15px' }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Cancel />}
                      onClick={() => openRejectDialog(product)}
                      color="error"
                      sx={{ borderRadius: '15px' }}
                    >
                      Reject
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {pendingProducts.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CheckCircle sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No Products Pending Approval
              </Typography>
              <Typography variant="body1" color="text.secondary">
                All products have been reviewed. Great job!
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Approve Product
          </Typography>
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
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Reject Product
          </Typography>
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
  );
};

export default AdminCatalog;
