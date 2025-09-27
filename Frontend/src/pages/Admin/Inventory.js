import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Fade,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
  Switch,
  FormControlLabel,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Inventory,
  Search,
  Add,
  Edit,
  Delete,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Download,
  FilterList,
  Visibility,
  TrendingUp,
  TrendingDown,
  Assessment,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const AdminInventory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stockAdjustmentDialogOpen, setStockAdjustmentDialogOpen] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: '',
    operation: 'add',
    reason: ''
  });

  useEffect(() => {
    fetchInventoryData();
  }, [currentPage, searchTerm, categoryFilter, stockStatusFilter, sortBy, sortOrder]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        category: categoryFilter,
        stockStatus: stockStatusFilter,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      const response = await api.get(`/admin/products/inventory?${params}`);
      setProducts(response.data.data.products);
      setSummary(response.data.data.summary);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (err) {
      setError('Failed to load inventory data');
      console.error('Inventory error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async () => {
    try {
      await api.post(`/admin/products/${selectedProduct._id}/stock-adjustment`, adjustmentData);
      setStockAdjustmentDialogOpen(false);
      setAdjustmentData({ quantity: '', operation: 'add', reason: '' });
      fetchInventoryData();
    } catch (err) {
      setError('Failed to adjust stock');
      console.error('Stock adjustment error:', err);
    }
  };

  const handleUpdateInventory = async (productId, updates) => {
    try {
      await api.put(`/admin/products/${productId}/inventory`, updates);
      setEditDialogOpen(false);
      fetchInventoryData();
    } catch (err) {
      setError('Failed to update inventory');
      console.error('Update inventory error:', err);
    }
  };

  const getStockStatus = (product) => {
    if (product.inventory.stock === 0) return { status: 'out_of_stock', color: 'error', text: 'Out of Stock' };
    if (product.inventory.stock <= product.inventory.lowStockThreshold) return { status: 'low_stock', color: 'warning', text: 'Low Stock' };
    return { status: 'in_stock', color: 'success', text: 'In Stock' };
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
              Inventory Management 📦
          </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Tooltip title="Refresh Data">
                <IconButton onClick={fetchInventoryData}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={<Download />}
                sx={{ borderRadius: '15px' }}
              >
                Export
              </Button>
            </Box>
          </Box>
          <Typography variant="h6" color="text.secondary">
            Track and manage product inventory levels, stock adjustments, and low stock alerts
          </Typography>
        </Box>
      </Fade>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={summary?.totalProducts || 0}
            icon={<Inventory sx={{ fontSize: 30, color: 'primary.main' }} />}
            color="primary"
            subtitle={`${summary?.activeProducts || 0} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock"
            value={summary?.lowStockProducts || 0}
            icon={<Warning sx={{ fontSize: 30, color: 'warning.main' }} />}
            color="warning"
            subtitle="Needs attention"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Out of Stock"
            value={summary?.outOfStockProducts || 0}
            icon={<Error sx={{ fontSize: 30, color: 'error.main' }} />}
            color="error"
            subtitle="Urgent restock"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Inventory Value"
            value={`$${summary?.totalInventoryValue?.toFixed(2) || '0.00'}`}
            icon={<Assessment sx={{ fontSize: 30, color: 'success.main' }} />}
            color="success"
            subtitle="Total value"
          />
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ p: 3, borderRadius: '20px', mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="herbal_supplements">Herbal Supplements</MenuItem>
                <MenuItem value="ayurvedic_medicines">Ayurvedic Medicines</MenuItem>
                <MenuItem value="skincare">Skincare</MenuItem>
                <MenuItem value="haircare">Haircare</MenuItem>
                <MenuItem value="digestive_health">Digestive Health</MenuItem>
                <MenuItem value="immune_support">Immune Support</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Stock Status</InputLabel>
              <Select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                label="Stock Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="in_stock">In Stock</MenuItem>
                <MenuItem value="low_stock">Low Stock</MenuItem>
                <MenuItem value="out_of_stock">Out of Stock</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="inventory.stock">Stock</MenuItem>
                <MenuItem value="price.current">Price</MenuItem>
                <MenuItem value="createdAt">Date Added</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              startIcon={sortOrder === 'asc' ? <TrendingUp /> : <TrendingDown />}
              sx={{ borderRadius: '15px' }}
            >
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Products Table */}
      <Card sx={{ borderRadius: '20px' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="center">Stock</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <TableRow key={product._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {product.name}
        </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {product.brand}
        </Typography>
      </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={product.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {product.inventory.stock}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Threshold: {product.inventory.lowStockThreshold}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={stockStatus.text} 
                          size="small" 
                          color={stockStatus.color}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          ${product.price.current}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Inventory">
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setSelectedProduct(product);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Stock Adjustment">
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setSelectedProduct(product);
                                setStockAdjustmentDialogOpen(true);
                              }}
                            >
                              <Add />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Inventory Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Edit Inventory - {selectedProduct?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Current Stock"
              type="number"
              defaultValue={selectedProduct?.inventory.stock}
              InputProps={{
                inputProps: { min: 0 }
              }}
            />
            <TextField
              fullWidth
              label="Low Stock Threshold"
              type="number"
              defaultValue={selectedProduct?.inventory.lowStockThreshold}
              InputProps={{
                inputProps: { min: 0 }
              }}
            />
            <FormControlLabel
              control={<Switch defaultChecked={selectedProduct?.inventory.trackInventory} />}
              label="Track Inventory"
            />
            <FormControlLabel
              control={<Switch defaultChecked={selectedProduct?.inventory.allowBackorder} />}
              label="Allow Backorder"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              // Handle update logic here
              setEditDialogOpen(false);
            }}
            sx={{ borderRadius: '15px' }}
          >
            Update Inventory
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={stockAdjustmentDialogOpen} onClose={() => setStockAdjustmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Stock Adjustment - {selectedProduct?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Operation</InputLabel>
              <Select
                value={adjustmentData.operation}
                onChange={(e) => setAdjustmentData({...adjustmentData, operation: e.target.value})}
                label="Operation"
              >
                <MenuItem value="add">Add Stock</MenuItem>
                <MenuItem value="subtract">Remove Stock</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={adjustmentData.quantity}
              onChange={(e) => setAdjustmentData({...adjustmentData, quantity: e.target.value})}
              InputProps={{
                inputProps: { min: 1 }
              }}
            />
            <TextField
              fullWidth
              label="Reason (Optional)"
              multiline
              rows={3}
              value={adjustmentData.reason}
              onChange={(e) => setAdjustmentData({...adjustmentData, reason: e.target.value})}
              placeholder="e.g., Restock from supplier, Damaged goods, etc."
            />
            <Alert severity="info">
              <Typography variant="body2">
                Current stock: {selectedProduct?.inventory.stock} units
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setStockAdjustmentDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStockAdjustment}
            disabled={!adjustmentData.quantity}
            sx={{ borderRadius: '15px' }}
          >
            Adjust Stock
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminInventory;