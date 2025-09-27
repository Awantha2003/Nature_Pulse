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
  Alert,
  Snackbar,
  Rating,
  Paper,
  InputAdornment,
  CircularProgress,
  Fade,
  Zoom,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Pagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Fab
} from '@mui/material';
import {
  Add,
  ThumbUp,
  Comment,
  Flag,
  Search,
  TrendingUp,
  Verified,
  Visibility,
  Star,
  LocalHospital,
  Psychology,
  Favorite,
  Healing,
  MedicalServices,
  Science,
  Biotech,
  Person,
  Analytics,
  Edit,
  Delete,
  ExpandMore,
  Warning,
  Report,
  Block,
  Check,
  Close,
  VisibilityOff,
  Email,
  CalendarToday,
  Category,
  RateReview,
  TrendingDown,
  TrendingFlat,
  ThumbDown,
  Share,
  Bookmark,
  BookmarkBorder,
  FilterList,
  Sort,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const DoctorEDRC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingReport, setEditingReport] = useState(null);

  const [newReport, setNewReport] = useState({
    title: '',
    content: '',
    category: '',
    condition: '',
    tags: [],
    rating: {
      overall: 1,
      effectiveness: 1,
      sideEffects: 1,
      cost: 1
    },
    treatmentDetails: {
      duration: '',
      durationValue: 0,
      cost: 0,
      sideEffects: [],
      improvements: [],
      challenges: []
    },
    isDoctorReport: true,
    isAnonymous: false
  });

  const [flagData, setFlagData] = useState({
    type: '',
    reason: ''
  });

  const doctorCategories = [
    { value: 'clinical_insights', label: 'Clinical Insights', icon: <Science />, color: 'primary' },
    { value: 'research_findings', label: 'Research Findings', icon: <Biotech />, color: 'secondary' },
    { value: 'case_study', label: 'Case Study', icon: <MedicalServices />, color: 'success' },
    { value: 'treatment_experience', label: 'Treatment Experience', icon: <LocalHospital />, color: 'info' },
    { value: 'medication_review', label: 'Medication Review', icon: <Star />, color: 'warning' },
    { value: 'diagnosis_insights', label: 'Diagnosis Insights', icon: <Psychology />, color: 'error' },
    { value: 'other', label: 'Other', icon: <Star />, color: 'default' }
  ];

  const allCategories = [
    { value: '', label: 'All Categories' },
    { value: 'clinical_insights', label: 'Clinical Insights' },
    { value: 'research_findings', label: 'Research Findings' },
    { value: 'case_study', label: 'Case Study' },
    { value: 'treatment_experience', label: 'Treatment Experience' },
    { value: 'medication_review', label: 'Medication Review' },
    { value: 'doctor_review', label: 'Doctor Review' },
    { value: 'product_review', label: 'Product Review' },
    { value: 'recovery_story', label: 'Recovery Story' },
    { value: 'symptom_management', label: 'Symptom Management' },
    { value: 'lifestyle_tips', label: 'Lifestyle Tips' },
    { value: 'general_health', label: 'General Health' },
    { value: 'mental_health', label: 'Mental Health' },
    { value: 'chronic_condition', label: 'Chronic Condition' },
    { value: 'other', label: 'Other' }
  ];

  const conditions = [
    'Diabetes', 'Hypertension', 'Arthritis', 'Depression', 'Anxiety',
    'Digestive Issues', 'Skin Problems', 'Respiratory Issues', 'Heart Disease',
    'Cancer', 'Neurological Disorders', 'Autoimmune Diseases', 'Other'
  ];

  const flagTypes = [
    { value: 'inappropriate', label: 'Inappropriate Content' },
    { value: 'misleading', label: 'Misleading Information' },
    { value: 'spam', label: 'Spam' },
    { value: 'fake', label: 'Fake/Unverified' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchReports();
  }, [currentPage, searchTerm, selectedCategory, sortBy, currentTab]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        search: searchTerm,
        category: selectedCategory,
        sortBy: sortBy
      });

      // Add status filter based on tab
      if (currentTab === 0) {
        params.append('status', 'approved');
      } else if (currentTab === 1) {
        params.append('status', 'pending');
      } else if (currentTab === 2) {
        params.append('status', 'flagged');
      }

      const response = await api.get(`/community/reports?${params}`);
      setReports(response.data.data.reports);
      setTotalPages(response.data.data.pagination?.totalPages || 1);
    } catch (err) {
      setError('Failed to fetch community reports');
      console.error('Reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      // Validate form
      if (newReport.title.length < 10 || newReport.title.length > 200) {
        setError('Title must be between 10 and 200 characters');
        return;
      }
      
      if (newReport.content.length < 50 || newReport.content.length > 5000) {
        setError('Content must be between 50 and 5000 characters');
        return;
      }
      
      if (!newReport.category) {
        setError('Please select a category');
        return;
      }

      // Prepare data for submission
      const submitData = { ...newReport };
      
      // Only include treatmentDetails if duration is valid
      if (!submitData.treatmentDetails.duration || 
          !['days', 'weeks', 'months', 'years'].includes(submitData.treatmentDetails.duration)) {
        delete submitData.treatmentDetails;
      }

      await api.post('/community/reports', submitData);
      setSuccess('Report submitted successfully!');
      setCreateDialogOpen(false);
      resetForm();
      fetchReports();
    } catch (err) {
      setError('Failed to create report');
      console.error('Create error:', err);
    }
  };

  const handleEditReport = async () => {
    try {
      if (!editingReport) return;

      // Validate form
      if (newReport.title.length < 10 || newReport.title.length > 200) {
        setError('Title must be between 10 and 200 characters');
        return;
      }
      
      if (newReport.content.length < 50 || newReport.content.length > 5000) {
        setError('Content must be between 50 and 5000 characters');
        return;
      }

      // Prepare data for submission
      const submitData = { ...newReport };
      
      // Only include treatmentDetails if duration is valid
      if (!submitData.treatmentDetails.duration || 
          !['days', 'weeks', 'months', 'years'].includes(submitData.treatmentDetails.duration)) {
        delete submitData.treatmentDetails;
      }

      await api.put(`/community/reports/${editingReport._id}`, submitData);
      setSuccess('Report updated successfully!');
      setCreateDialogOpen(false);
      setEditingReport(null);
      resetForm();
      fetchReports();
    } catch (err) {
      setError('Failed to update report');
      console.error('Update error:', err);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await api.delete(`/community/reports/${reportId}`);
      setSuccess('Report deleted successfully!');
      fetchReports();
    } catch (err) {
      setError('Failed to delete report');
      console.error('Delete error:', err);
    }
  };

  const handleLikeReport = async (reportId) => {
    try {
      await api.post(`/community/reports/${reportId}/like`);
      fetchReports();
    } catch (err) {
      setError('Failed to like report');
      console.error('Like error:', err);
    }
  };

  const handleFlagReport = async () => {
    if (!selectedReport || !flagData.type) return;
    
    try {
      await api.post(`/community/reports/${selectedReport._id}/flag`, flagData);
      setSuccess('Report flagged successfully!');
      setFlagDialogOpen(false);
      setFlagData({ type: '', reason: '' });
      fetchReports();
    } catch (err) {
      setError('Failed to flag report');
      console.error('Flag error:', err);
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setNewReport({
      title: report.title,
      content: report.content,
      category: report.category,
      condition: report.condition,
      tags: report.tags || [],
      rating: report.rating || newReport.rating,
      treatmentDetails: report.treatmentDetails || newReport.treatmentDetails,
      isDoctorReport: true,
      isAnonymous: report.isAnonymous || false
    });
    setCreateDialogOpen(true);
  };

  const resetForm = () => {
    setNewReport({
      title: '',
      content: '',
      category: '',
      condition: '',
      tags: [],
      rating: {
        overall: 1,
        effectiveness: 1,
        sideEffects: 1,
        cost: 1
      },
      treatmentDetails: {
        duration: '',
        durationValue: 0,
        cost: 0,
        sideEffects: [],
        improvements: [],
        challenges: []
      },
      isDoctorReport: true,
      isAnonymous: false
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category) => {
    const cat = doctorCategories.find(c => c.value === category);
    return cat ? cat.icon : <Star />;
  };

  const getCategoryLabel = (category) => {
    const cat = allCategories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'flagged': return 'error';
      default: return 'default';
    }
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
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={report.status} 
                size="small" 
                color={getStatusColor(report.status)}
              />
              {report.isVerified && (
                <Tooltip title="Verified Report">
                  <Verified color="primary" />
                </Tooltip>
              )}
            </Box>
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
            {report.condition && (
              <Chip
                label={report.condition}
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Box>

          {report.rating && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Rating value={report.rating?.overall || 0} readOnly size="small" />
              <Typography variant="caption" sx={{ ml: 1 }}>
                {report.rating?.overall || 0}/5
              </Typography>
            </Box>
          )}

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
          {report.author?._id === user?._id && (
            <>
              <Button
                size="small"
                startIcon={<Edit />}
                onClick={() => handleEdit(report)}
              >
                Edit
              </Button>
              <Button
                size="small"
                startIcon={<Delete />}
                color="error"
                onClick={() => handleDeleteReport(report._id)}
              >
                Delete
              </Button>
            </>
          )}
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

  if (loading && reports.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
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
            EDRC - Doctor Portal 🩺
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Share clinical insights, research findings, and contribute to the medical community
          </Typography>
        </Box>
      </Fade>

      {/* Search and Filter Bar */}
      <Card sx={{ borderRadius: '20px', mb: 4, p: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Search reports..."
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
                {allCategories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
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
                <MenuItem value="recent">Most Recent</MenuItem>
                <MenuItem value="trending">Trending</MenuItem>
                <MenuItem value="rating">Highest Rated</MenuItem>
                <MenuItem value="likes">Most Liked</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Add />}
              onClick={() => {
                setEditingReport(null);
                resetForm();
                setCreateDialogOpen(true);
              }}
              sx={{ borderRadius: '15px', py: 1.5 }}
            >
              Share Insight
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: '15px' }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
          sx={{ borderRadius: '15px' }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Check />
                Approved Reports
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning />
                Pending Review
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Flag />
                Flagged Content
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      {/* Reports Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {reports.map((report, index) => (
          <Grid size={{ xs: 12, md: 6 }} lg={4} key={report._id}>
            {renderReportCard(report)}
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

      {/* Create/Edit Report Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingReport ? 'Edit Report' : 'Share Clinical Insight'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Title"
                value={newReport.title}
                onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                required
                helperText="Title must be between 10 and 200 characters"
                error={newReport.title.length > 0 && newReport.title.length < 10}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newReport.category}
                  onChange={(e) => setNewReport({ ...newReport, category: e.target.value })}
                  label="Category"
                  required
                >
                  {doctorCategories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {category.icon}
                        {category.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={newReport.condition}
                  onChange={(e) => setNewReport({ ...newReport, condition: e.target.value })}
                  label="Condition"
                >
                  {conditions.map((condition) => (
                    <MenuItem key={condition} value={condition}>
                      {condition}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Clinical Insight / Research Finding"
                value={newReport.content}
                onChange={(e) => setNewReport({ ...newReport, content: e.target.value })}
                placeholder="Share your clinical insights, research findings, case studies, or treatment experiences..."
                required
                helperText="Content must be between 50 and 5000 characters"
                error={newReport.content.length > 0 && newReport.content.length < 50}
              />
            </Grid>

            <Grid size={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Rating (Optional)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="body2">Overall Experience</Typography>
                  <Rating
                    value={newReport.rating.overall}
                    onChange={(event, newValue) => setNewReport({
                      ...newReport,
                      rating: { ...newReport.rating, overall: newValue || 1 }
                    })}
                    min={1}
                  />
                </Grid>
                <Grid size={6}>
                  <Typography variant="body2">Effectiveness</Typography>
                  <Rating
                    value={newReport.rating.effectiveness}
                    onChange={(event, newValue) => setNewReport({
                      ...newReport,
                      rating: { ...newReport.rating, effectiveness: newValue || 1 }
                    })}
                    min={1}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={editingReport ? handleEditReport : handleCreateReport} 
            variant="contained" 
            sx={{ borderRadius: '15px' }}
          >
            {editingReport ? 'Update' : 'Share'} Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {selectedReport?.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={selectedReport?.status} 
                size="small" 
                color={getStatusColor(selectedReport?.status)}
              />
              {selectedReport?.isVerified && (
                <Tooltip title="Verified Report">
                  <Verified color="primary" />
                </Tooltip>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2 }}>
                  {selectedReport.author?.firstName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedReport.isAnonymous ? 'Anonymous' : `${selectedReport.author?.firstName} ${selectedReport.author?.lastName}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
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
                {selectedReport.condition && (
                  <Chip
                    label={selectedReport.condition}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>

              <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {selectedReport.content}
              </Typography>

              {selectedReport.rating && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating value={selectedReport.rating.overall} readOnly />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {selectedReport.rating.overall}/5
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ThumbUp fontSize="small" color="action" />
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {selectedReport.likeCount || 0} likes
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Comment fontSize="small" color="action" />
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {selectedReport.commentCount || 0} comments
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Visibility fontSize="small" color="action" />
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {selectedReport.engagement?.views || 0} views
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
          <Button
            startIcon={<ThumbUp />}
            onClick={() => {
              handleLikeReport(selectedReport._id);
              setViewDialogOpen(false);
            }}
          >
            Like
          </Button>
        </DialogActions>
      </Dialog>

      {/* Flag Report Dialog */}
      <Dialog open={flagDialogOpen} onClose={() => setFlagDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Flag Inappropriate Content</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Flag Type</InputLabel>
                <Select
                  value={flagData.type}
                  onChange={(e) => setFlagData({ ...flagData, type: e.target.value })}
                  label="Flag Type"
                  required
                >
                  {flagTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason (Optional)"
                value={flagData.reason}
                onChange={(e) => setFlagData({ ...flagData, reason: e.target.value })}
                placeholder="Please provide additional details about why this content should be flagged..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlagDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleFlagReport} 
            variant="contained" 
            color="error"
            disabled={!flagData.type}
          >
            Flag Content
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="share insight"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
          }
        }}
        onClick={() => {
          setEditingReport(null);
          resetForm();
          setCreateDialogOpen(true);
        }}
      >
        <Add />
      </Fab>

      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DoctorEDRC;