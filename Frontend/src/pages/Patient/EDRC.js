import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Fade,
  Zoom,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Rating
} from '@mui/material';
import {
  People,
  Add,
  Search,
  ThumbUp,
  Comment,
  Flag,
  LocalHospital,
  Psychology,
  Edit,
  Delete,
  Star,
  Info
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const PatientEDRC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Form state for new/edit report
  const [formData, setFormData] = useState({
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
    isAnonymous: false
  });

  const categories = [
    { value: '', label: 'All' },
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
    'Diabetes',
    'Hypertension',
    'Arthritis',
    'Depression',
    'Anxiety',
    'Digestive Issues',
    'Skin Problems',
    'Respiratory Issues',
    'Heart Disease',
    'Other'
  ];

  useEffect(() => {
    fetchReports();
  }, [currentPage, searchTerm, selectedCategory, sortBy]);

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
      
      const response = await api.get(`/community/reports?${params}`);
      setReports(response.data.data.reports);
      setTotalPages(response.data.data.totalPages);
    } catch (err) {
      setError('Failed to load community reports');
      console.error('Reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (formData.title.length < 10 || formData.title.length > 200) {
      setError('Title must be between 10 and 200 characters');
      return;
    }
    
    if (formData.content.length < 50 || formData.content.length > 5000) {
      setError('Content must be between 50 and 5000 characters');
      return;
    }
    
    if (!formData.category) {
      setError('Please select a category');
      return;
    }
    
    if (formData.rating.overall < 1 || formData.rating.overall > 5) {
      setError('Overall rating must be between 1 and 5');
      return;
    }
    
    try {
      // Prepare data for submission - only include treatmentDetails if duration is valid
      const submitData = { ...formData };
      
      // Only include treatmentDetails if duration is one of the valid enum values
      if (!submitData.treatmentDetails.duration || 
          !['days', 'weeks', 'months', 'years'].includes(submitData.treatmentDetails.duration)) {
        delete submitData.treatmentDetails;
      } else {
        // Clean up treatmentDetails - remove empty arrays and zero values
        const cleanedTreatmentDetails = {};
        if (submitData.treatmentDetails.duration) {
          cleanedTreatmentDetails.duration = submitData.treatmentDetails.duration;
        }
        if (submitData.treatmentDetails.durationValue && submitData.treatmentDetails.durationValue > 0) {
          cleanedTreatmentDetails.durationValue = submitData.treatmentDetails.durationValue;
        }
        if (submitData.treatmentDetails.cost && submitData.treatmentDetails.cost > 0) {
          cleanedTreatmentDetails.cost = submitData.treatmentDetails.cost;
        }
        if (submitData.treatmentDetails.sideEffects && submitData.treatmentDetails.sideEffects.length > 0) {
          cleanedTreatmentDetails.sideEffects = submitData.treatmentDetails.sideEffects;
        }
        if (submitData.treatmentDetails.improvements && submitData.treatmentDetails.improvements.length > 0) {
          cleanedTreatmentDetails.improvements = submitData.treatmentDetails.improvements;
        }
        if (submitData.treatmentDetails.challenges && submitData.treatmentDetails.challenges.length > 0) {
          cleanedTreatmentDetails.challenges = submitData.treatmentDetails.challenges;
        }
        
        // Only include treatmentDetails if it has meaningful data
        if (Object.keys(cleanedTreatmentDetails).length > 0) {
          submitData.treatmentDetails = cleanedTreatmentDetails;
        } else {
          delete submitData.treatmentDetails;
        }
      }
      
      if (editingReport) {
        await api.put(`/community/reports/${editingReport._id}`, submitData);
      } else {
        await api.post('/community/reports', submitData);
      }
      setReportDialogOpen(false);
      setEditingReport(null);
      resetForm();
      fetchReports();
      setError(null);
    } catch (err) {
      setError('Failed to save report');
      console.error('Save error:', err);
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setFormData({
      title: report.title,
      content: report.content,
      category: report.category,
      condition: report.condition,
      tags: report.tags || [],
      rating: report.rating || formData.rating,
      treatmentDetails: report.treatmentDetails || formData.treatmentDetails,
      isAnonymous: report.isAnonymous || false
    });
    setReportDialogOpen(true);
  };

  const handleDelete = async (reportId) => {
    try {
      await api.delete(`/community/reports/${reportId}`);
      fetchReports();
    } catch (err) {
      setError('Failed to delete report');
      console.error('Delete error:', err);
    }
  };

  const handleLike = async (reportId) => {
    try {
      await api.post(`/community/reports/${reportId}/like`);
      fetchReports();
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleFlag = async (reportId) => {
    try {
      await api.post(`/community/reports/${reportId}/flag`);
      fetchReports();
    } catch (err) {
      setError('Failed to flag report');
      console.error('Flag error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
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
      isAnonymous: false
    });
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

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'treatment_experience': return <LocalHospital />;
      case 'medication_review': return <Psychology />;
      case 'doctor_review': return <People />;
      case 'product_review': return <Star />;
      case 'recovery_story': return <LocalHospital />;
      case 'symptom_management': return <Psychology />;
      case 'lifestyle_tips': return <Star />;
      case 'general_health': return <LocalHospital />;
      case 'mental_health': return <Psychology />;
      case 'chronic_condition': return <LocalHospital />;
      default: return <Info />;
    }
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  if (loading && reports.length === 0) {
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
            Community (EDRC) 👥
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Connect with the healthcare community and share experiences
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
                {categories.map((category) => (
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
                <MenuItem value="trending">Trending</MenuItem>
                <MenuItem value="recent">Most Recent</MenuItem>
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
              onClick={() => setReportDialogOpen(true)}
              sx={{ borderRadius: '15px', py: 1.5 }}
            >
              Share Story
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Reports Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {reports.map((report, index) => (
          <Grid size={{ xs: 12, md: 6 }} lg={4} key={report._id}>
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
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {report.isAnonymous ? 'A' : report.author?.firstName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {report.isAnonymous ? 'Anonymous' : `${report.author?.firstName} ${report.author?.lastName}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={report.status} 
                      size="small" 
                      color={getStatusColor(report.status)}
                    />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {report.title}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {getCategoryIcon(report.category)}
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {getCategoryLabel(report.category)}
                    </Typography>
                    {report.condition && (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>•</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {report.condition}
                        </Typography>
                      </>
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {report.content?.substring(0, 150)}...
                  </Typography>

                  {report.rating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Rating 
                        value={report.rating.overall} 
                        readOnly 
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {report.rating.overall}/5
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    {report.tags?.slice(0, 3).map((tag, tagIndex) => (
                      <Chip 
                        key={tagIndex}
                        label={tag} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleLike(report._id)}
                        color={report.isLiked ? 'primary' : 'default'}
                      >
                        <ThumbUp />
                      </IconButton>
                      <Typography variant="body2" color="text.secondary">
                        {report.likeCount || 0}
                      </Typography>
                      
                      <IconButton size="small">
                        <Comment />
                      </IconButton>
                      <Typography variant="body2" color="text.secondary">
                        {report.commentCount || 0}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {report.author?._id === user?._id && (
                        <>
                          <IconButton size="small" onClick={() => handleEdit(report)}>
                            <Edit />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(report._id)}>
                            <Delete />
                          </IconButton>
                        </>
                      )}
                      <IconButton size="small" onClick={() => handleFlag(report._id)}>
                        <Flag />
                      </IconButton>
                    </Box>
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

      {/* Share Report Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingReport ? 'Edit Report' : 'Share Your Experience'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
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
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  helperText="Title must be between 10 and 200 characters"
                  error={formData.title.length > 0 && formData.title.length < 10}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    label="Category"
                    required
                  >
                    {categories.slice(1).map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
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
                  label="Your Experience"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Share your treatment experience, side effects, recovery story, or any helpful insights..."
                  required
                  helperText="Content must be between 50 and 5000 characters"
                  error={formData.content.length > 0 && formData.content.length < 50}
                />
              </Grid>

              <Grid size={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Treatment Details (Optional)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={4}>
                    <FormControl fullWidth>
                      <InputLabel>Duration</InputLabel>
                      <Select
                        value={formData.treatmentDetails.duration}
                        onChange={(e) => setFormData({
                          ...formData,
                          treatmentDetails: { ...formData.treatmentDetails, duration: e.target.value }
                        })}
                        label="Duration"
                      >
                        <MenuItem value="">Select Duration</MenuItem>
                        <MenuItem value="days">Days</MenuItem>
                        <MenuItem value="weeks">Weeks</MenuItem>
                        <MenuItem value="months">Months</MenuItem>
                        <MenuItem value="years">Years</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={4}>
                    <TextField
                      fullWidth
                      label="Duration Value"
                      type="number"
                      value={formData.treatmentDetails.durationValue || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        treatmentDetails: { ...formData.treatmentDetails, durationValue: parseInt(e.target.value) || 0 }
                      })}
                      disabled={!formData.treatmentDetails.duration}
                    />
                  </Grid>
                  <Grid size={4}>
                    <TextField
                      fullWidth
                      label="Cost (Optional)"
                      type="number"
                      value={formData.treatmentDetails.cost || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        treatmentDetails: { ...formData.treatmentDetails, cost: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Rating (Optional)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="body2">Overall Experience</Typography>
                    <Rating
                      value={formData.rating.overall}
                      onChange={(event, newValue) => setFormData({
                        ...formData,
                        rating: { ...formData.rating, overall: newValue || 1 }
                      })}
                      min={1}
                    />
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="body2">Effectiveness</Typography>
                    <Rating
                      value={formData.rating.effectiveness}
                      onChange={(event, newValue) => setFormData({
                        ...formData,
                        rating: { ...formData.rating, effectiveness: newValue || 1 }
                      })}
                      min={1}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: '15px' }}>
              {editingReport ? 'Update' : 'Share'} Report
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="share experience"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
          }
        }}
        onClick={() => setReportDialogOpen(true)}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default PatientEDRC;