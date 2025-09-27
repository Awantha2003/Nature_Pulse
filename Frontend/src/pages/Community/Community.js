import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Pagination,
  Alert,
  Snackbar,
  Fab,
  Tooltip,
  Rating,
  Divider,
  Badge,
  Paper,
  InputAdornment,
  CircularProgress,
  Fade,
  Zoom
} from '@mui/material';
import {
  Add,
  ThumbUp,
  Comment,
  Share,
  Flag,
  Search,
  FilterList,
  TrendingUp,
  Verified,
  Visibility,
  Edit,
  Delete,
  Star,
  StarBorder,
  LocalHospital,
  Psychology,
  Favorite,
  Healing
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const Community = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [trendingReports, setTrendingReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagType, setFlagType] = useState('');

  // Form states
  const [newReport, setNewReport] = useState({
    title: '',
    content: '',
    category: '',
    condition: '',
    tags: [],
    rating: {
      overall: 5,
      effectiveness: 5,
      sideEffects: 5,
      cost: 5
    },
    treatmentDetails: {
      duration: 'weeks',
      durationValue: 1,
      cost: 0,
      sideEffects: [],
      improvements: [],
      challenges: []
    },
    isAnonymous: false
  });

  const categories = [
    { value: 'treatment_experience', label: 'Treatment Experience', icon: <LocalHospital /> },
    { value: 'recovery_story', label: 'Recovery Story', icon: <Healing /> },
    { value: 'symptom_management', label: 'Symptom Management', icon: <Psychology /> },
    { value: 'medication_review', label: 'Medication Review', icon: <Star /> },
    { value: 'lifestyle_tips', label: 'Lifestyle Tips', icon: <Favorite /> },
    { value: 'doctor_review', label: 'Doctor Review', icon: <LocalHospital /> },
    { value: 'product_review', label: 'Product Review', icon: <Star /> },
    { value: 'general_health', label: 'General Health', icon: <Healing /> },
    { value: 'mental_health', label: 'Mental Health', icon: <Psychology /> },
    { value: 'chronic_condition', label: 'Chronic Condition', icon: <LocalHospital /> },
    { value: 'other', label: 'Other', icon: <Star /> }
  ];

  const flagTypes = [
    { value: 'inappropriate', label: 'Inappropriate Content' },
    { value: 'misleading', label: 'Misleading Information' },
    { value: 'spam', label: 'Spam' },
    { value: 'fake', label: 'Fake/False Information' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchReports();
    fetchTrendingReports();
  }, [currentPage, selectedCategory, sortBy, sortOrder]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        status: 'approved',
        sortBy,
        sortOrder
      });

      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('condition', searchQuery);

      const response = await api.get(`/community/reports?${params}`);
      setReports(response.data.data.reports);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (err) {
      setError('Failed to fetch community reports');
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingReports = async () => {
    try {
      const response = await api.get('/community/reports/trending?limit=5');
      setTrendingReports(response.data.data.reports);
    } catch (err) {
      console.error('Fetch trending reports error:', err);
    }
  };

  const handleCreateReport = async () => {
    try {
      const response = await api.post('/community/reports', newReport);
      setSuccess('Report submitted successfully! It will be reviewed before being published.');
      setCreateDialogOpen(false);
      setNewReport({
        title: '',
        content: '',
        category: '',
        condition: '',
        tags: [],
        rating: { overall: 5, effectiveness: 5, sideEffects: 5, cost: 5 },
        treatmentDetails: {
          duration: 'weeks',
          durationValue: 1,
          cost: 0,
          sideEffects: [],
          improvements: [],
          challenges: []
        },
        isAnonymous: false
      });
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create report');
    }
  };

  const handleLikeReport = async (reportId) => {
    try {
      const response = await api.post(`/community/reports/${reportId}/like`);
      fetchReports();
    } catch (err) {
      setError('Failed to like report');
    }
  };

  const handleFlagReport = async () => {
    try {
      await api.post(`/community/reports/${selectedReport._id}/flag`, {
        type: flagType,
        reason: flagReason
      });
      setSuccess('Report flagged successfully');
      setFlagDialogOpen(false);
      setFlagReason('');
      setFlagType('');
    } catch (err) {
      setError('Failed to flag report');
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    if (newValue === 0) {
      fetchReports();
    } else if (newValue === 1) {
      fetchTrendingReports();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : <Star />;
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const renderReportCard = (report) => (
    <Zoom in timeout={300} key={report._id}>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              src={report.author?.profileImage ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${report.author.profileImage}` : ''} 
              sx={{ mr: 1, width: 32, height: 32 }}
            >
              {report.author?.firstName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {report.isAnonymous ? 'Anonymous' : `${report.author?.firstName} ${report.author?.lastName}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(report.createdAt)}
              </Typography>
            </Box>
            {report.isVerified && (
              <Tooltip title="Verified Report">
                <Verified color="primary" sx={{ ml: 'auto' }} />
              </Tooltip>
            )}
          </Box>

          <Typography variant="h6" gutterBottom sx={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {report.title}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ 
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 2
          }}>
            {report.content}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Chip
              icon={getCategoryIcon(report.category)}
              label={getCategoryLabel(report.category)}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={report.condition}
              size="small"
              sx={{ ml: 1 }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating value={report.rating?.overall || 0} readOnly size="small" />
            <Typography variant="caption" sx={{ ml: 1 }}>
              {report.rating?.overall || 0}/5
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ThumbUp fontSize="small" color="action" />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {report.likeCount || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Comment fontSize="small" color="action" />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {report.commentCount || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Visibility fontSize="small" color="action" />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {report.engagement?.views || 0}
              </Typography>
            </Box>
          </Box>
        </CardContent>

        <CardActions>
          <Button
            size="small"
            startIcon={<ThumbUp />}
            onClick={() => handleLikeReport(report._id)}
          >
            Like
          </Button>
          <Button
            size="small"
            startIcon={<Comment />}
            onClick={() => {
              setSelectedReport(report);
              setViewDialogOpen(true);
            }}
          >
            View
          </Button>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedReport(report);
              setFlagDialogOpen(true);
            }}
          >
            <Flag />
          </IconButton>
        </CardActions>
      </Card>
    </Zoom>
  );

  return (
    <Container maxWidth="lg">
      <Fade in timeout={800}>
      <Box sx={{ py: 4 }}>
          {/* Header */}
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
              Community Reports 🌟
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Share your health journey and learn from others' experiences
            </Typography>
          </Box>

          {/* Search and Filter */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search by condition..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {category.icon}
                          <Typography sx={{ ml: 1 }}>{category.label}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort By"
                  >
                    <MenuItem value="createdAt">Date</MenuItem>
                    <MenuItem value="rating.overall">Rating</MenuItem>
                    <MenuItem value="engagement.views">Views</MenuItem>
                    <MenuItem value="likeCount">Likes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={fetchReports}
                  startIcon={<FilterList />}
                >
                  Apply
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={currentTab} onChange={handleTabChange}>
              <Tab 
                label="All Reports" 
                icon={<Healing />} 
                iconPosition="start"
              />
              <Tab 
                label="Trending" 
                icon={<TrendingUp />} 
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Content */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {currentTab === 0 && (
                <>
                  <Grid container spacing={3}>
                    {reports.map(renderReportCard)}
                  </Grid>
                  
                  {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                      <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={(event, page) => setCurrentPage(page)}
                        color="primary"
                        size="large"
                      />
                    </Box>
                  )}
                </>
              )}

              {currentTab === 1 && (
                <Grid container spacing={3}>
                  {trendingReports.map(renderReportCard)}
                </Grid>
              )}
            </>
          )}

          {/* Floating Action Button */}
          <Fab
            color="primary"
            aria-label="add report"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => setCreateDialogOpen(true)}
          >
            <Add />
          </Fab>

          {/* Create Report Dialog */}
          <Dialog 
            open={createDialogOpen} 
            onClose={() => setCreateDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Share Your Health Experience</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={newReport.title}
                    onChange={(e) => setNewReport({...newReport, title: e.target.value})}
                    placeholder="Brief description of your experience..."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={newReport.category}
                      onChange={(e) => setNewReport({...newReport, category: e.target.value})}
                      label="Category"
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.value} value={category.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {category.icon}
                            <Typography sx={{ ml: 1 }}>{category.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Condition"
                    value={newReport.condition}
                    onChange={(e) => setNewReport({...newReport, condition: e.target.value})}
                    placeholder="e.g., Diabetes, Anxiety, etc."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Your Experience"
                    value={newReport.content}
                    onChange={(e) => setNewReport({...newReport, content: e.target.value})}
                    placeholder="Share your detailed experience, what worked, what didn't, tips for others..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Overall Rating
                  </Typography>
                  <Rating
                    value={newReport.rating.overall}
                    onChange={(event, newValue) => 
                      setNewReport({
                        ...newReport, 
                        rating: {...newReport.rating, overall: newValue}
                      })
                    }
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleCreateReport} 
                variant="contained"
                disabled={!newReport.title || !newReport.content || !newReport.category}
              >
                Submit Report
              </Button>
            </DialogActions>
          </Dialog>

          {/* View Report Dialog */}
          <Dialog 
            open={viewDialogOpen} 
            onClose={() => setViewDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            {selectedReport && (
              <>
                <DialogTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">{selectedReport.title}</Typography>
                    {selectedReport.isVerified && (
                      <Chip icon={<Verified />} label="Verified" color="primary" size="small" />
                    )}
                  </Box>
                </DialogTitle>
                <DialogContent>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar src={selectedReport.author?.profileImage ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${selectedReport.author.profileImage}` : ''} sx={{ mr: 1 }}>
                        {selectedReport.author?.firstName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {selectedReport.isAnonymous ? 'Anonymous' : `${selectedReport.author?.firstName} ${selectedReport.author?.lastName}`}
        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(selectedReport.createdAt)}
        </Typography>
      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Chip
                        icon={getCategoryIcon(selectedReport.category)}
                        label={getCategoryLabel(selectedReport.category)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={selectedReport.condition}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>

                    <Rating value={selectedReport.rating?.overall || 0} readOnly />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedReport.content}
                  </Typography>

                  {selectedReport.treatmentDetails && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Treatment Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Duration: {selectedReport.treatmentDetails.durationValue} {selectedReport.treatmentDetails.duration}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Cost: ${selectedReport.treatmentDetails.cost}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                  <Button 
                    startIcon={<ThumbUp />}
                    onClick={() => handleLikeReport(selectedReport._id)}
                  >
                    Like ({selectedReport.likeCount || 0})
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>

          {/* Flag Report Dialog */}
          <Dialog 
            open={flagDialogOpen} 
            onClose={() => setFlagDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Flag Report</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Flag Type</InputLabel>
                    <Select
                      value={flagType}
                      onChange={(e) => setFlagType(e.target.value)}
                      label="Flag Type"
                    >
                      {flagTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Reason"
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    placeholder="Please explain why you're flagging this report..."
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setFlagDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleFlagReport} 
                variant="contained"
                color="error"
                disabled={!flagType || !flagReason}
              >
                Flag Report
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbars */}
          <Snackbar 
            open={!!error} 
            autoHideDuration={6000} 
            onClose={() => setError(null)}
          >
            <Alert onClose={() => setError(null)} severity="error">
              {error}
            </Alert>
          </Snackbar>

          <Snackbar 
            open={!!success} 
            autoHideDuration={6000} 
            onClose={() => setSuccess(null)}
          >
            <Alert onClose={() => setSuccess(null)} severity="success">
              {success}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
};

export default Community;
