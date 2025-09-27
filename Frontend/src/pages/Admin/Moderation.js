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
  Tooltip,
  Rating,
  Divider,
  Paper,
  InputAdornment,
  CircularProgress,
  Fade,
  Zoom,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import {
  Security,
  CheckCircle,
  Cancel,
  Flag,
  Search,
  FilterList,
  Verified,
  Visibility,
  Delete,
  Star,
  LocalHospital,
  Psychology,
  Favorite,
  Healing,
  ExpandMore,
  Warning,
  Report,
  Analytics,
  ThumbUp,
  Comment
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const AdminModeration = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [flaggedReports, setFlaggedReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Dialog states
  const [moderateDialogOpen, setModerateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [moderationAction, setModerationAction] = useState('');
  const [moderationNotes, setModerationNotes] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');

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

  const statusOptions = [
    { value: 'pending', label: 'Pending Review', color: 'warning' },
    { value: 'approved', label: 'Approved', color: 'success' },
    { value: 'rejected', label: 'Rejected', color: 'error' },
    { value: 'flagged', label: 'Flagged', color: 'error' }
  ];

  const verificationMethods = [
    { value: 'medical_record', label: 'Medical Record Verification' },
    { value: 'doctor_confirmation', label: 'Doctor Confirmation' },
    { value: 'admin_review', label: 'Admin Review' }
  ];

  useEffect(() => {
    fetchReports();
    fetchFlaggedReports();
    fetchStats();
  }, [currentPage, selectedStatus, selectedCategory, sortBy, sortOrder]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        sortBy,
        sortOrder
      });

      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await api.get(`/community/admin/reports?${params}`);
      setReports(response.data.data.reports);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (err) {
      setError('Failed to fetch reports for moderation');
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlaggedReports = async () => {
    try {
      const response = await api.get('/community/admin/flagged?limit=10');
      setFlaggedReports(response.data.data.reports);
    } catch (err) {
      console.error('Fetch flagged reports error:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/community/admin/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const handleModerateReport = async () => {
    try {
      await api.put(`/community/admin/reports/${selectedReport._id}/moderate`, {
        action: moderationAction,
        moderationNotes
      });
      setSuccess(`Report ${moderationAction}d successfully`);
      setModerateDialogOpen(false);
      setModerationAction('');
      setModerationNotes('');
      fetchReports();
      fetchStats();
    } catch (err) {
      setError('Failed to moderate report');
    }
  };

  const handleVerifyReport = async () => {
    try {
      await api.post(`/community/admin/reports/${selectedReport._id}/verify`, {
        verificationMethod,
        verificationNotes
      });
      setSuccess('Report verified successfully');
      setVerifyDialogOpen(false);
      setVerificationMethod('');
      setVerificationNotes('');
      fetchReports();
    } catch (err) {
      setError('Failed to verify report');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      try {
        await api.delete(`/community/admin/reports/${reportId}`);
        setSuccess('Report deleted successfully');
        fetchReports();
        fetchStats();
      } catch (err) {
        setError('Failed to delete report');
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    if (newValue === 0) {
      fetchReports();
    } else if (newValue === 1) {
      fetchFlaggedReports();
    } else if (newValue === 2) {
      fetchStats();
    }
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
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : <Star />;
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getStatusChip = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return (
      <Chip
        label={statusOption?.label || status}
        color={statusOption?.color || 'default'}
        size="small"
        icon={status === 'flagged' ? <Flag /> : status === 'approved' ? <CheckCircle /> : <Warning />}
      />
    );
  };

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
            Content Moderation 🛡️
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Moderate community content and ensure platform safety
          </Typography>
        </Box>

          {/* Search and Filter */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search reports..."
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
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    {statusOptions.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
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
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort By"
                  >
                    <MenuItem value="createdAt">Date</MenuItem>
                    <MenuItem value="status">Status</MenuItem>
                    <MenuItem value="category">Category</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={fetchReports}
                  startIcon={<FilterList />}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={currentTab} onChange={handleTabChange}>
              <Tab 
                label="All Reports" 
                icon={<Report />} 
                iconPosition="start"
              />
              <Tab 
                label="Flagged Reports" 
                icon={<Flag />} 
                iconPosition="start"
              />
              <Tab 
                label="Analytics" 
                icon={<Analytics />} 
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
                    {reports.map((report) => (
                      <Grid item xs={12} md={6} lg={4} key={report._id}>
                        <Zoom in timeout={300}>
                          <Card 
                            sx={{ 
                              height: '100%', 
                              display: 'flex', 
                              flexDirection: 'column',
                              border: report.status === 'flagged' ? '2px solid #f44336' : '1px solid #e0e0e0',
                              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 4
                              }
                            }}
                          >
                            <CardContent sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                                </Box>
                                {getStatusChip(report.status)}
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

                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
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
                                />
                                {report.isVerified && (
                                  <Chip
                                    icon={<Verified />}
                                    label="Verified"
                                    size="small"
                                    color="success"
                                  />
                                )}
                              </Box>

                              {report.moderation?.flags?.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="error" fontWeight="bold">
                                    {report.moderation.flags.length} Flag(s)
                                  </Typography>
                                  {report.moderation.flags.slice(0, 2).map((flag, index) => (
                                    <Chip
                                      key={index}
                                      label={`${flag.type}: ${flag.reason}`}
                                      size="small"
                                      color="error"
                                      variant="outlined"
                                      sx={{ ml: 0.5, mb: 0.5 }}
                                    />
                                  ))}
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
                                startIcon={<Visibility />}
                                onClick={() => {
                                  setSelectedReport(report);
                                  setViewDialogOpen(true);
                                }}
                              >
                                View
                              </Button>
                              {report.status === 'pending' && (
                                <>
                                  <Button
                                    size="small"
                                    startIcon={<CheckCircle />}
                                    color="success"
                                    onClick={() => {
                                      setSelectedReport(report);
                                      setModerationAction('approve');
                                      setModerateDialogOpen(true);
                                    }}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="small"
                                    startIcon={<Cancel />}
                                    color="error"
                                    onClick={() => {
                                      setSelectedReport(report);
                                      setModerationAction('reject');
                                      setModerateDialogOpen(true);
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {report.status === 'flagged' && (
                                <Button
                                  size="small"
                                  startIcon={<Flag />}
                                  color="warning"
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setModerationAction('flag');
                                    setModerateDialogOpen(true);
                                  }}
                                >
                                  Review
                                </Button>
                              )}
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteReport(report._id)}
                              >
                                <Delete />
                              </IconButton>
                            </CardActions>
                          </Card>
                        </Zoom>
                      </Grid>
                    ))}
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
                  {flaggedReports.map((report) => (
                    <Grid item xs={12} md={6} lg={4} key={report._id}>
                      <Zoom in timeout={300}>
                        <Card 
                          sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            border: '2px solid #f44336',
                            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 4
                            }
                          }}
                        >
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                              </Box>
                              {getStatusChip(report.status)}
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

                            {report.moderation?.flags?.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="error" fontWeight="bold">
                                  {report.moderation.flags.length} Flag(s)
                                </Typography>
                                {report.moderation.flags.slice(0, 2).map((flag, index) => (
                                  <Chip
                                    key={index}
                                    label={`${flag.type}: ${flag.reason}`}
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    sx={{ ml: 0.5, mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </CardContent>

                          <CardActions>
                            <Button
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => {
                                setSelectedReport(report);
                                setViewDialogOpen(true);
                              }}
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              startIcon={<Flag />}
                              color="warning"
                              onClick={() => {
                                setSelectedReport(report);
                                setModerationAction('flag');
                                setModerateDialogOpen(true);
                              }}
                            >
                              Review
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteReport(report._id)}
                            >
                              <Delete />
                            </IconButton>
                          </CardActions>
                        </Card>
                      </Zoom>
                    </Grid>
                  ))}
                </Grid>
              )}

              {currentTab === 2 && stats && (
                <>
                  {/* Overall Stats */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={3}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography color="text.secondary" gutterBottom variant="h6">
                                Total Reports
                              </Typography>
                              <Typography variant="h4" component="div" color="primary.main">
                                {stats.overall.totalReports}
                              </Typography>
                            </Box>
                            <Box sx={{ color: 'primary.main' }}>
                              <Report sx={{ fontSize: 40 }} />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography color="text.secondary" gutterBottom variant="h6">
                                Pending Review
                              </Typography>
                              <Typography variant="h4" component="div" color="warning.main">
                                {stats.overall.pendingReports}
                              </Typography>
                            </Box>
                            <Box sx={{ color: 'warning.main' }}>
                              <Warning sx={{ fontSize: 40 }} />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography color="text.secondary" gutterBottom variant="h6">
                                Approved
                              </Typography>
                              <Typography variant="h4" component="div" color="success.main">
                                {stats.overall.approvedReports}
                              </Typography>
                            </Box>
                            <Box sx={{ color: 'success.main' }}>
                              <CheckCircle sx={{ fontSize: 40 }} />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography color="text.secondary" gutterBottom variant="h6">
                                Flagged
                              </Typography>
                              <Typography variant="h4" component="div" color="error.main">
                                {stats.overall.flaggedReports}
                              </Typography>
                            </Box>
                            <Box sx={{ color: 'error.main' }}>
                              <Flag sx={{ fontSize: 40 }} />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Category Stats */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Reports by Category
                          </Typography>
                          {stats.categories.map((category) => (
                            <Box key={category._id} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">
                                  {getCategoryLabel(category._id)}
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {category.count}
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={(category.count / stats.overall.totalReports) * 100}
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Flag Types
                          </Typography>
                          {stats.flagTypes.map((flagType) => (
                            <Box key={flagType._id} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">
                                  {flagType._id}
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {flagType.count}
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={(flagType.count / stats.overall.totalFlags) * 100}
                                color="error"
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </>
              )}
            </>
          )}

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
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {getStatusChip(selectedReport.status)}
                      {selectedReport.isVerified && (
                        <Chip icon={<Verified />} label="Verified" color="success" size="small" />
                      )}
                    </Box>
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
                          {selectedReport.author?.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formatDate(selectedReport.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
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
                      />
                    </Box>

                    <Rating value={selectedReport.rating?.overall || 0} readOnly />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                    {selectedReport.content}
                  </Typography>

                  {selectedReport.moderation?.flags?.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6" color="error">
                          Flags ({selectedReport.moderation.flags.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {selectedReport.moderation.flags.map((flag, index) => (
                          <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #f44336', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="error">
                              {flag.type.toUpperCase()}
                            </Typography>
                            <Typography variant="body2">
                              {flag.reason}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Flagged by: {flag.flaggedBy?.firstName} {flag.flaggedBy?.lastName} ({flag.flaggedBy?.role})
        </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {formatDate(flag.flaggedAt)}
        </Typography>
      </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  )}

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
                  {selectedReport.status === 'pending' && (
                    <>
                      <Button 
                        startIcon={<CheckCircle />}
                        color="success"
                        onClick={() => {
                          setModerationAction('approve');
                          setModerateDialogOpen(true);
                          setViewDialogOpen(false);
                        }}
                      >
                        Approve
                      </Button>
                      <Button 
                        startIcon={<Cancel />}
                        color="error"
                        onClick={() => {
                          setModerationAction('reject');
                          setModerateDialogOpen(true);
                          setViewDialogOpen(false);
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {!selectedReport.isVerified && (
                    <Button 
                      startIcon={<Verified />}
                      onClick={() => {
                        setVerifyDialogOpen(true);
                        setViewDialogOpen(false);
                      }}
                    >
                      Verify
                    </Button>
                  )}
                </DialogActions>
              </>
            )}
          </Dialog>

          {/* Moderate Report Dialog */}
          <Dialog 
            open={moderateDialogOpen} 
            onClose={() => setModerateDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {moderationAction === 'approve' ? 'Approve Report' : 
               moderationAction === 'reject' ? 'Reject Report' : 
               'Review Flagged Report'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Moderation Notes"
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setModerateDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleModerateReport} 
                variant="contained"
                color={moderationAction === 'approve' ? 'success' : 'error'}
                disabled={!moderationAction}
              >
                {moderationAction === 'approve' ? 'Approve' : 
                 moderationAction === 'reject' ? 'Reject' : 
                 'Update Status'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Verify Report Dialog */}
          <Dialog 
            open={verifyDialogOpen} 
            onClose={() => setVerifyDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Verify Report</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Verification Method</InputLabel>
                    <Select
                      value={verificationMethod}
                      onChange={(e) => setVerificationMethod(e.target.value)}
                      label="Verification Method"
                    >
                      {verificationMethods.map((method) => (
                        <MenuItem key={method.value} value={method.value}>
                          {method.label}
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
                    label="Verification Notes"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add verification details..."
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleVerifyReport} 
                variant="contained"
                disabled={!verificationMethod}
              >
                Verify Report
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

export default AdminModeration;
