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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Menu,
} from '@mui/material';
import {
  TrendingUp,
  People,
  ShoppingCart,
  AttachMoney,
  Inventory,
  Assessment,
  Download,
  Refresh,
  Visibility,
  Warning,
  CheckCircle,
  Info,
  BarChart,
  PieChart,
  Timeline,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const AdminAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [period, setPeriod] = useState('30');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [analytics, sales, userAct, inventory] = await Promise.all([
        api.get(`/admin/analytics?period=${period}`),
        api.get(`/admin/analytics/sales-report?period=${period}`),
        api.get(`/admin/analytics/user-activity?period=${period}`),
        api.get(`/admin/analytics/inventory-report?period=${period}`)
      ]);
      
      setAnalyticsData(analytics.data.data);
      setSalesReport(sales.data.data);
      setUserActivity(userAct.data.data);
      setInventoryReport(inventory.data.data);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  const handleExport = async (format = 'csv') => {
    try {
      console.log(`Exporting sales data in ${format} format...`);
      
      // Show loading state
      setLoading(true);
      
      // Get current date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      // Create export URL
      const exportUrl = `/admin/analytics/export?format=${format}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      
      // Add authorization header by using fetch first
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}${exportUrl}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Get the blob data
      const blob = await response.blob();
      
      // Create object URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`Export completed successfully - ${format} format`);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
      setExportMenuAnchor(null);
    }
  };

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const formatCurrency = (amount) => {
    return `Rs ${(amount || 0).toFixed(2)}`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
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
            {trend && (
              <Chip 
                label={trend} 
                size="small" 
                color={trend.includes('+') ? 'success' : 'error'}
                variant="outlined"
                sx={{ mt: 1 }}
              />
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
            Analytics & Reports 📊
          </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  label="Period"
                >
                  <MenuItem value="7">Last 7 days</MenuItem>
                  <MenuItem value="30">Last 30 days</MenuItem>
                  <MenuItem value="90">Last 90 days</MenuItem>
                  <MenuItem value="365">Last year</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="Refresh Data">
                <IconButton onClick={handleRefresh}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Typography variant="h6" color="text.secondary">
            Comprehensive analytics and detailed reporting for platform insights
          </Typography>
        </Box>
      </Fade>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total Users"
            value={formatNumber(analyticsData?.users?.total)}
            icon={<People sx={{ fontSize: 30, color: 'primary.main' }} />}
            color="primary"
            subtitle={`${formatNumber(analyticsData?.users?.newThisMonth)} new this month`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total Orders"
            value={formatNumber(analyticsData?.orders?.total)}
            icon={<ShoppingCart sx={{ fontSize: 30, color: 'success.main' }} />}
            color="success"
            subtitle={`${formatNumber(analyticsData?.orders?.thisMonth)} this month`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Revenue"
            value={formatCurrency(analyticsData?.revenue?.totalRevenue)}
            icon={<AttachMoney sx={{ fontSize: 30, color: 'warning.main' }} />}
            color="warning"
            subtitle={`Avg: ${formatCurrency(analyticsData?.revenue?.averageOrderValue)}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Products"
            value={formatNumber(analyticsData?.products?.total)}
            icon={<Inventory sx={{ fontSize: 30, color: 'info.main' }} />}
            color="info"
            subtitle={`${formatNumber(analyticsData?.products?.lowStock)} low stock`}
          />
        </Grid>
      </Grid>

      {/* Tabs for different analytics views */}
      <Card sx={{ borderRadius: '20px' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Overview" icon={<Assessment />} />
            <Tab label="Sales Analytics" icon={<BarChart />} />
            <Tab label="User Activity" icon={<People />} />
            <Tab label="Inventory" icon={<Inventory />} />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Card sx={{ p: 2, borderRadius: '15px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Recent User Registrations
                  </Typography>
                  {analyticsData?.userTrends?.slice(-7).map((trend, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          {new Date(trend._id.year, trend._id.month - 1, trend._id.day).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {trend.count} users
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(trend.count / Math.max(...analyticsData.userTrends.map(t => t.count))) * 100}
                        sx={{ borderRadius: '5px' }}
                      />
                    </Box>
                  ))}
                </Card>
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Card sx={{ p: 2, borderRadius: '15px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Top Products
                  </Typography>
                  <List>
                    {analyticsData?.topProducts?.slice(0, 5).map((product, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Chip label={index + 1} size="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={product.productName}
                          secondary={`${product.totalSold} sold • ${formatCurrency(product.totalRevenue)} revenue`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Sales Analytics Tab */}
          {activeTab === 1 && salesReport && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Sales Summary & Analytics
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={handleExportMenuOpen}
                    sx={{ borderRadius: '15px' }}
                  >
                    Export Report
                  </Button>
                  <Menu
                    anchorEl={exportMenuAnchor}
                    open={Boolean(exportMenuAnchor)}
                    onClose={handleExportMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem onClick={() => handleExport('csv')}>
                      <Download sx={{ mr: 1 }} />
                      Export as CSV
                    </MenuItem>
                    <MenuItem onClick={() => handleExport('json')}>
                      <Download sx={{ mr: 1 }} />
                      Export as JSON
                    </MenuItem>
                  </Menu>
                </Box>
              </Grid>
              
              {/* Primary Sales Metrics */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Card sx={{ p: 2, borderRadius: '15px', textAlign: 'center', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <AttachMoney sx={{ fontSize: 30, color: 'success.main', mr: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {formatCurrency(salesReport.summary.totalRevenue)}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>Total Revenue</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last {period} days
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, lg: 4 }}>
                <Card sx={{ p: 2, borderRadius: '15px', textAlign: 'center', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <ShoppingCart sx={{ fontSize: 30, color: 'primary.main', mr: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatNumber(salesReport.summary.totalOrders)}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>Total Orders</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {salesReport.summary.totalOrders > 0 ? 
                      `${(salesReport.summary.totalOrders / parseInt(period)).toFixed(1)} orders/day` : 
                      'No orders yet'
                    }
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, lg: 4 }}>
                <Card sx={{ p: 2, borderRadius: '15px', textAlign: 'center', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <Assessment sx={{ fontSize: 30, color: 'warning.main', mr: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      {formatCurrency(salesReport.summary.averageOrderValue)}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>Avg Order Value</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Per transaction
                  </Typography>
                </Card>
              </Grid>

              {/* Additional Sales Metrics */}
              <Grid size={{ xs: 12, lg: 3 }}>
                <Card sx={{ p: 2, borderRadius: '15px', textAlign: 'center', height: '100%' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {salesReport.summary?.totalProductsSold || 0}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>Products Sold</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total units
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, lg: 3 }}>
                <Card sx={{ p: 2, borderRadius: '15px', textAlign: 'center', height: '100%' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                    {salesReport.summary?.uniqueCustomers || 0}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>Unique Customers</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active buyers
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, lg: 3 }}>
                <Card sx={{ p: 2, borderRadius: '15px', textAlign: 'center', height: '100%' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {salesReport.summary?.cancelledOrders || 0}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>Cancelled Orders</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {salesReport.summary?.totalOrders > 0 ? 
                      `${((salesReport.summary.cancelledOrders / salesReport.summary.totalOrders) * 100).toFixed(1)}% rate` : 
                      'No cancellations'
                    }
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, lg: 3 }}>
                <Card sx={{ p: 2, borderRadius: '15px', textAlign: 'center', height: '100%' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {salesReport.summary?.completedOrders || 0}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>Completed Orders</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {salesReport.summary?.totalOrders > 0 ? 
                      `${((salesReport.summary.completedOrders / salesReport.summary.totalOrders) * 100).toFixed(1)}% rate` : 
                      'No completions'
                    }
                  </Typography>
                </Card>
              </Grid>
              {/* Sales Performance Charts */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <Card sx={{ p: 2, borderRadius: '15px', height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Sales Performance by Category
                  </Typography>
                  {salesReport.categoryPerformance?.length > 0 ? (
                    <List>
                      {salesReport.categoryPerformance.slice(0, 5).map((category, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Chip 
                              label={index + 1} 
                              size="small" 
                              color={index === 0 ? 'success' : index === 1 ? 'primary' : 'default'} 
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={category.category}
                            secondary={
                              <Box component="div">
                                <Typography variant="body2" component="span">
                                  Revenue: {formatCurrency(category.totalRevenue)} | 
                                  Orders: {formatNumber(category.totalOrders)}
                                </Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={(category.totalRevenue / Math.max(...salesReport.categoryPerformance.map(c => c.totalRevenue))) * 100}
                                  sx={{ mt: 1, borderRadius: '5px' }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No category data available
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <Card sx={{ p: 2, borderRadius: '15px', height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Sales Trends
                  </Typography>
                  {salesReport.dailySales?.length > 0 ? (
                    <List>
                      {salesReport.dailySales.slice(-7).map((day, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemText
                            primary={new Date(day.date).toLocaleDateString()}
                            secondary={
                              <Box component="div">
                                <Typography variant="body2" component="span">
                                  Revenue: {formatCurrency(day.revenue)} | 
                                  Orders: {formatNumber(day.orders)}
                                </Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={(day.revenue / Math.max(...salesReport.dailySales.map(d => d.revenue))) * 100}
                                  sx={{ mt: 1, borderRadius: '5px' }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No daily sales data available
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* Enhanced Top Selling Products Table */}
              <Grid size={{ xs: 12 }}>
                <Card sx={{ p: 2, borderRadius: '15px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Top Selling Products
                    </Typography>
                    <Chip 
                      label={`${salesReport.topSellingProducts?.length || 0} products`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Rank</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Quantity Sold</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Revenue</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Avg Price</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Performance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {salesReport.topSellingProducts?.slice(0, 10).map((product, index) => {
                          const avgPrice = product.totalQuantity > 0 ? product.totalRevenue / product.totalQuantity : 0;
                          const performance = index < 3 ? 'excellent' : index < 6 ? 'good' : 'average';
                          return (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Chip 
                                  label={`#${index + 1}`} 
                                  size="small" 
                                  color={index === 0 ? 'success' : index === 1 ? 'primary' : index === 2 ? 'warning' : 'default'}
                                  variant={index < 3 ? 'filled' : 'outlined'}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {product.productName}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={product.category} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {formatNumber(product.totalQuantity)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  {formatCurrency(product.totalRevenue)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">
                                  {formatCurrency(avgPrice)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={performance} 
                                  size="small" 
                                  color={performance === 'excellent' ? 'success' : performance === 'good' ? 'primary' : 'default'}
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {(!salesReport.topSellingProducts || salesReport.topSellingProducts.length === 0) && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No sales data available for the selected period
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>
            </Grid>
          )}

          {/* User Activity Tab */}
          {activeTab === 2 && userActivity && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Card sx={{ p: 2, borderRadius: '15px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    User Registration Trends
                  </Typography>
                  {userActivity.registrationTrends?.slice(-7).map((trend, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          {new Date(trend._id.year, trend._id.month - 1, trend._id.day).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatNumber(trend.totalRegistrations)} total
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Chip label={`${trend.patients} patients`} size="small" color="primary" />
                        <Chip label={`${trend.doctors} doctors`} size="small" color="secondary" />
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(trend.totalRegistrations / Math.max(...userActivity.registrationTrends.map(t => t.totalRegistrations))) * 100}
                        sx={{ borderRadius: '5px' }}
                      />
                    </Box>
                  ))}
                </Card>
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Card sx={{ p: 2, borderRadius: '15px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    User Engagement Metrics
                  </Typography>
                  <List>
                    {userActivity.engagementMetrics?.map((metric, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemText
                          primary={`${metric._id.charAt(0).toUpperCase() + metric._id.slice(1)}s`}
                          secondary={
                            <Box component="div">
                              <Typography variant="body2" component="span">
                                Total: {formatNumber(metric.totalUsers)} | Active: {formatNumber(metric.activeUsers)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                                Avg Appointments: {metric.avgAppointments?.toFixed(1)} | 
                                Avg Orders: {metric.avgOrders?.toFixed(1)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Inventory Tab */}
          {activeTab === 3 && inventoryReport && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Card sx={{ p: 2, borderRadius: '15px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Inventory Overview
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: '10px' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {formatNumber(inventoryReport.overview.totalProducts)}
                        </Typography>
                        <Typography variant="body2">Total Products</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: '10px' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {formatNumber(inventoryReport.overview.activeProducts)}
                        </Typography>
                        <Typography variant="body2">Active Products</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: '10px' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {formatNumber(inventoryReport.overview.lowStockProducts)}
                        </Typography>
                        <Typography variant="body2">Low Stock</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: '10px' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {formatNumber(inventoryReport.overview.outOfStockProducts)}
                        </Typography>
                        <Typography variant="body2">Out of Stock</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Card sx={{ p: 2, borderRadius: '15px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Low Stock Alert
                  </Typography>
                  <List>
                    {inventoryReport.lowStockProducts?.slice(0, 5).map((product, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Warning color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={product.name}
                          secondary={`Stock: ${product.inventory.stock} | Threshold: ${product.inventory.lowStockThreshold}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Card>
    </Container>
  );
};

export default AdminAnalytics;