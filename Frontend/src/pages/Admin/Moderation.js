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
  Warning,
  ThumbUp,
  Comment,
  Healing,
  Favorite,
  Report,
  Analytics,
  PictureAsPdf,
  TableChart,
  FileDownload,
  Assessment
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const AdminModeration = () => {
  const { user, hasRole } = useAuth();
  
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
  
  // Report generation states
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState('pdf');
  const [reportDateRange, setReportDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [generatingReport, setGeneratingReport] = useState(false);

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
    if (hasRole('admin')) {
      fetchReports();
      fetchStats();
    } else {
      console.log('User does not have admin role, skipping admin data fetch');
      setReports([]);
      setStats(null);
    }
  }, [currentPage, selectedStatus, selectedCategory, sortBy, sortOrder, hasRole]);

  useEffect(() => {
    if (hasRole('admin')) {
      fetchFlaggedReports();
    } else {
      console.log('User does not have admin role, skipping flagged reports fetch');
      setFlaggedReports([]);
    }
  }, [hasRole]);

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
      const reportsData = response.data.data.reports || [];
      setReports(reportsData);
      setTotalPages(response.data.data.pagination?.totalPages || 1);
      
      
    } catch (err) {
      console.error('Fetch reports error:', err);
      setError('Failed to fetch reports. Please check if the backend API is running.');
      setReports([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlaggedReports = async () => {
    try {
      // First try the dedicated flagged endpoint
      const response = await api.get('/community/admin/flagged?limit=10');
      if (response.data.data && response.data.data.reports) {
        setFlaggedReports(response.data.data.reports);
        return;
      }
    } catch (err) {
      console.log('Flagged endpoint not available, using fallback:', err.message);
    }
    
    // Fallback: fetch all reports and filter flagged ones
    try {
      const response = await api.get('/community/admin/reports?status=flagged&limit=50');
      if (response.data.data && response.data.data.reports) {
        setFlaggedReports(response.data.data.reports);
      } else {
        setFlaggedReports([]);
      }
    } catch (err) {
      console.error('Failed to fetch flagged reports:', err);
      setFlaggedReports([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/community/admin/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Fetch stats error:', err);
      // Fallback: generate stats from reports data
      const stats = {
        overall: {
          totalReports: reports.length,
          pendingReports: reports.filter(r => r.status === 'pending').length,
          approvedReports: reports.filter(r => r.status === 'approved').length,
          flaggedReports: reports.filter(r => r.status === 'flagged').length,
          rejectedReports: reports.filter(r => r.status === 'rejected').length,
          totalLikes: reports.reduce((sum, r) => sum + (r.engagement?.likes?.length || 0), 0),
          totalComments: reports.reduce((sum, r) => sum + (r.engagement?.comments?.length || 0), 0),
          totalViews: reports.reduce((sum, r) => sum + (r.engagement?.views || 0), 0)
        },
        categories: categories.map(cat => ({
          _id: cat.value,
          count: reports.filter(r => r.category === cat.value).length,
          pending: reports.filter(r => r.category === cat.value && r.status === 'pending').length,
          approved: reports.filter(r => r.category === cat.value && r.status === 'approved').length,
          flagged: reports.filter(r => r.category === cat.value && r.status === 'flagged').length
        })),
        flagTypes: [],
        trends: {
          daily: [],
          weekly: [],
          monthly: []
        }
      };
      setStats(stats);
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

  // Report generation functions
  const handleGenerateReport = () => {
    setReportDialogOpen(true);
  };

  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  const handleDateRangeChange = (field) => (event) => {
    setReportDateRange(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const generateReport = async () => {
    try {
      setGeneratingReport(true);
      
      // Fetch all reports for the selected date range
      const params = new URLSearchParams({
        limit: 1000, // Get all reports
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (reportDateRange.startDate) {
        params.append('startDate', reportDateRange.startDate);
      }
      if (reportDateRange.endDate) {
        params.append('endDate', reportDateRange.endDate);
      }

      const response = await api.get(`/community/admin/reports?${params}`);
      const allReports = response.data.data.reports || [];
      
      // Calculate statistics
      const totalReports = allReports.length;
      const approvedReports = allReports.filter(r => r.status === 'approved').length;
      const pendingReports = allReports.filter(r => r.status === 'pending').length;
      const flaggedReports = allReports.filter(r => r.status === 'flagged').length;
      const rejectedReports = allReports.filter(r => r.status === 'rejected').length;
      
      // Category breakdown
      const categoryStats = {};
      allReports.forEach(report => {
        const category = report.category;
        if (!categoryStats[category]) {
          categoryStats[category] = { total: 0, approved: 0, pending: 0, flagged: 0, rejected: 0 };
        }
        categoryStats[category].total++;
        categoryStats[category][report.status]++;
      });

      // Flag analysis
      const flagStats = {
        total: 0,
        byType: {},
        byReason: {}
      };
      
      allReports.forEach(report => {
        if (report.moderation && report.moderation.flags) {
          report.moderation.flags.forEach(flag => {
            flagStats.total++;
            flagStats.byType[flag.type] = (flagStats.byType[flag.type] || 0) + 1;
            flagStats.byReason[flag.reason] = (flagStats.byReason[flag.reason] || 0) + 1;
          });
        }
      });

      const reportData = {
        generatedAt: new Date().toISOString(),
        dateRange: {
          start: reportDateRange.startDate || 'All time',
          end: reportDateRange.endDate || 'All time'
        },
        summary: {
          totalReports,
          approvedReports,
          pendingReports,
          flaggedReports,
          rejectedReports,
          approvalRate: totalReports > 0 ? ((approvedReports / totalReports) * 100).toFixed(1) : 0,
          flagRate: totalReports > 0 ? ((flaggedReports / totalReports) * 100).toFixed(1) : 0
        },
        categoryBreakdown: categoryStats,
        flagAnalysis: flagStats,
        reports: allReports
      };

      if (reportType === 'pdf') {
        generatePDFReport(reportData);
      } else if (reportType === 'csv') {
        generateCSVReport(reportData);
      } else if (reportType === 'json') {
        generateJSONReport(reportData);
      }

      setReportDialogOpen(false);
      setSuccess('Report generated successfully!');
      
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const generatePDFReport = (data) => {
    // Create a simple PDF report using browser's print functionality
    const printWindow = window.open('', '_blank');
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Content Moderation Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
          .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #1976d2; }
          .stat-label { font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Content Moderation Report</h1>
          <p>Generated on: ${new Date(data.generatedAt).toLocaleString()}</p>
          <p>Date Range: ${data.dateRange.start} to ${data.dateRange.end}</p>
        </div>
        
        <div class="section">
          <h2>Summary Statistics</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${data.summary.totalReports}</div>
              <div class="stat-label">Total Reports</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.summary.approvedReports}</div>
              <div class="stat-label">Approved</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.summary.flaggedReports}</div>
              <div class="stat-label">Flagged</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.summary.pendingReports}</div>
              <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.summary.rejectedReports}</div>
              <div class="stat-label">Rejected</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.summary.approvalRate}%</div>
              <div class="stat-label">Approval Rate</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Category Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Total</th>
                <th>Approved</th>
                <th>Pending</th>
                <th>Flagged</th>
                <th>Rejected</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(data.categoryBreakdown).map(([category, stats]) => `
                <tr>
                  <td>${getCategoryLabel(category)}</td>
                  <td>${stats.total}</td>
                  <td>${stats.approved}</td>
                  <td>${stats.pending}</td>
                  <td>${stats.flagged}</td>
                  <td>${stats.rejected}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Flag Analysis</h2>
          <p><strong>Total Flags:</strong> ${data.flagAnalysis.total}</p>
          <h3>Flags by Type:</h3>
          <ul>
            ${Object.entries(data.flagAnalysis.byType).map(([type, count]) => `
              <li>${type}: ${count}</li>
            `).join('')}
          </ul>
        </div>

        <div class="footer">
          <p>This report was generated by Nature Pulse Content Moderation System</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const generateCSVReport = (data) => {
    const csvContent = [
      ['Content Moderation Report'],
      ['Generated on:', new Date(data.generatedAt).toLocaleString()],
      ['Date Range:', `${data.dateRange.start} to ${data.dateRange.end}`],
      [],
      ['Summary Statistics'],
      ['Total Reports', data.summary.totalReports],
      ['Approved Reports', data.summary.approvedReports],
      ['Pending Reports', data.summary.pendingReports],
      ['Flagged Reports', data.summary.flaggedReports],
      ['Rejected Reports', data.summary.rejectedReports],
      ['Approval Rate (%)', data.summary.approvalRate],
      ['Flag Rate (%)', data.summary.flagRate],
      [],
      ['Category Breakdown'],
      ['Category', 'Total', 'Approved', 'Pending', 'Flagged', 'Rejected'],
      ...Object.entries(data.categoryBreakdown).map(([category, stats]) => [
        getCategoryLabel(category),
        stats.total,
        stats.approved,
        stats.pending,
        stats.flagged,
        stats.rejected
      ]),
      [],
      ['Flag Analysis'],
      ['Total Flags', data.flagAnalysis.total],
      ...Object.entries(data.flagAnalysis.byType).map(([type, count]) => [type, count])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moderation-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const generateJSONReport = (data) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moderation-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (!hasRole('admin')) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You do not have admin permissions to access the moderation panel.
            </Typography>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Fade in timeout={800}>
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
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
              <Button
                variant="contained"
                startIcon={<Assessment />}
                onClick={handleGenerateReport}
                sx={{
                  background: 'linear-gradient(45deg, #1976D2 30%, #2E7D32 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565C0 30%, #1B5E20 90%)',
                  },
                }}
              >
                Generate Report
              </Button>
            </Box>
          </Box>

          {/* Search and Filter */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}>
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
              <Grid size={{ xs: 12, md: 2 }}>
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
              <Grid size={{ xs: 12, md: 2 }}>
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
                        {category.label}
                      </MenuItem>
                    ))}
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
                    <MenuItem value="createdAt">Date</MenuItem>
                    <MenuItem value="title">Title</MenuItem>
                    <MenuItem value="status">Status</MenuItem>
                    <MenuItem value="category">Category</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FilterList />}
                  sx={{ height: '56px' }}
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
                      <Grid size={{ xs: 12, md: 6, lg: 4 }} key={report._id}>
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
                <>
                  {flaggedReports.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Flag sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h5" color="text.secondary" gutterBottom>
                        No Flagged Reports
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        There are currently no flagged reports that require attention.
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={3}>
                      {flaggedReports.map((report) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={report._id}>
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
                </>
              )}

              {currentTab === 2 && (
                <>
                  {!stats ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Analytics sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h5" color="text.secondary" gutterBottom>
                        Loading Analytics
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Generating moderation analytics and statistics...
                      </Typography>
                      <CircularProgress sx={{ mt: 2 }} />
                    </Box>
                  ) : (
                    <>
                      {/* Overall Stats */}
                      <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, md: 3 }}>
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
                        <Grid size={{ xs: 12, md: 3 }}>
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
                        <Grid size={{ xs: 12, md: 3 }}>
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
                        <Grid size={{ xs: 12, md: 3 }}>
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

                      {/* Category Breakdown */}
                      <Card sx={{ mb: 4 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Reports by Category
                          </Typography>
                          <Grid container spacing={2}>
                            {stats.categories.map((category) => (
                              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category._id}>
                                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    {getCategoryLabel(category._id)}
                                  </Typography>
                                  <Typography variant="h4" color="primary.main">
                                    {category.count}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <Chip label={`Pending: ${category.pending}`} size="small" color="warning" />
                                    <Chip label={`Approved: ${category.approved}`} size="small" color="success" />
                                    <Chip label={`Flagged: ${category.flagged}`} size="small" color="error" />
                                  </Box>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* Error Snackbar */}
          <Snackbar 
            open={!!error} 
            autoHideDuration={6000} 
            onClose={() => setError(null)}
          >
            <Alert onClose={() => setError(null)} severity="error">
              {error}
            </Alert>
          </Snackbar>

          {/* Success Snackbar */}
          <Snackbar 
            open={!!success} 
            autoHideDuration={6000} 
            onClose={() => setSuccess(null)}
          >
            <Alert onClose={() => setSuccess(null)} severity="success">
              {success}
            </Alert>
          </Snackbar>

          {/* View Report Dialog */}
          <Dialog 
            open={viewDialogOpen} 
            onClose={() => setViewDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility />
                Report Details
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedReport && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      src={selectedReport.author?.profileImage ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${selectedReport.author.profileImage}` : ''} 
                      sx={{ mr: 2, width: 40, height: 40 }}
                    >
                      {selectedReport.author?.firstName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {selectedReport.isAnonymous ? 'Anonymous' : `${selectedReport.author?.firstName} ${selectedReport.author?.lastName}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(selectedReport.createdAt)}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="h5" gutterBottom>
                    {selectedReport.title}
                  </Typography>

                  <Typography variant="body1" paragraph>
                    {selectedReport.content}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={getCategoryIcon(selectedReport.category)}
                      label={getCategoryLabel(selectedReport.category)}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={selectedReport.condition}
                      color="secondary"
                    />
                    {selectedReport.isVerified && (
                      <Chip
                        icon={<Verified />}
                        label="Verified"
                        color="success"
                      />
                    )}
                    {getStatusChip(selectedReport.status)}
                  </Box>

                  {selectedReport.moderation?.flags?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="error" gutterBottom>
                        Flags ({selectedReport.moderation.flags.length})
                      </Typography>
                      {selectedReport.moderation.flags.map((flag, index) => (
                        <Chip
                          key={index}
                          label={`${flag.type}: ${flag.reason}`}
                          color="error"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
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
            </DialogActions>
          </Dialog>

          {/* Moderation Dialog */}
          <Dialog 
            open={moderateDialogOpen} 
            onClose={() => setModerateDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {moderationAction === 'approve' ? <CheckCircle color="success" /> : <Cancel color="error" />}
                {moderationAction === 'approve' ? 'Approve Report' : 'Reject Report'}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                Are you sure you want to {moderationAction} this report?
              </Typography>
              
              {selectedReport && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Report: {selectedReport.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    by {selectedReport.isAnonymous ? 'Anonymous' : `${selectedReport.author?.firstName} ${selectedReport.author?.lastName}`}
                  </Typography>
                </Box>
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Moderation Notes (Optional)"
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                placeholder="Add any notes about your decision..."
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setModerateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleModerateReport}
                variant="contained"
                color={moderationAction === 'approve' ? 'success' : 'error'}
                startIcon={moderationAction === 'approve' ? <CheckCircle /> : <Cancel />}
              >
                {moderationAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Verification Dialog */}
          <Dialog 
            open={verifyDialogOpen} 
            onClose={() => setVerifyDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Verified />
                Verify Report
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                How would you like to verify this report?
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
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

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Verification Notes"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Add verification details..."
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setVerifyDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleVerifyReport}
                variant="contained"
                color="success"
                startIcon={<Verified />}
              >
                Verify Report
              </Button>
            </DialogActions>
          </Dialog>

          {/* Report Generation Dialog */}
          <Dialog 
            open={reportDialogOpen} 
            onClose={() => setReportDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assessment />
                Generate Moderation Report
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                Generate a comprehensive report of content moderation activities.
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  onChange={handleReportTypeChange}
                  label="Report Type"
                >
                  <MenuItem value="pdf">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PictureAsPdf />
                      PDF Report
                    </Box>
                  </MenuItem>
                  <MenuItem value="csv">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TableChart />
                      CSV Export
                    </Box>
                  </MenuItem>
                  <MenuItem value="json">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileDownload />
                      JSON Data
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <Typography variant="h6" gutterBottom>
                Date Range (Optional)
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={reportDateRange.startDate}
                    onChange={handleDateRangeChange('startDate')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={reportDateRange.endDate}
                    onChange={handleDateRangeChange('endDate')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Leave date fields empty to include all reports.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={generateReport}
                variant="contained"
                startIcon={generatingReport ? <CircularProgress size={20} /> : <Assessment />}
                disabled={generatingReport}
              >
                {generatingReport ? 'Generating...' : 'Generate Report'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default AdminModeration;