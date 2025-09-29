import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Fade,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  Stack,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  People,
  Search,
  FilterList,
  Person,
  Email,
  Phone,
  CalendarToday,
  LocalHospital,
  HealthAndSafety,
  Assignment,
  Visibility,
  Edit,
  MoreVert,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Warning,
  Info,
  Refresh,
  Add,
  Assessment,
  PictureAsPdf,
  TableChart,
  FileDownload,
  DateRange,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const DoctorPatients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetailOpen, setPatientDetailOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    new: 0,
    recent: 0
  });
  const [reportData, setReportData] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportDateRange, setReportDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', '12');
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (statusFilter !== 'all') {
        params.append('isActive', statusFilter === 'active');
      }

      const response = await api.get(`/users/patients?${params}`);
      if (response.data.status === 'success') {
        setPatients(response.data.data.patients || []);
        setTotalPages(response.data.data.pagination.totalPages || 1);
        setTotalPatients(response.data.data.pagination.totalPatients || 0);
        
        // Calculate stats
        const allPatients = response.data.data.patients || [];
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        setStats({
          total: response.data.data.pagination.totalPatients || 0,
          active: allPatients.filter(p => p.isActive).length,
          new: allPatients.filter(p => new Date(p.createdAt) > thirtyDaysAgo).length,
          recent: allPatients.filter(p => p.lastLogin && new Date(p.lastLogin) > thirtyDaysAgo).length
        });
      } else {
        setError('Failed to fetch patients');
      }
    } catch (err) {
      setError('Failed to fetch patients');
      console.error('Fetch patients error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientDetailOpen(true);
  };

  const handleClosePatientDetail = () => {
    setPatientDetailOpen(false);
    setSelectedPatient(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'default';
  };

  const getStatusIcon = (isActive) => {
    return isActive ? <CheckCircle /> : <Warning />;
  };

  const generateReport = async () => {
    try {
      setGeneratingReport(true);
      
      // Try the dedicated report endpoint first
      let response;
      try {
        const params = new URLSearchParams();
        params.append('startDate', reportDateRange.start);
        params.append('endDate', reportDateRange.end);
        
        response = await api.get(`/users/patients/report?${params}`);
      } catch (reportError) {
        console.log('Report endpoint failed, falling back to regular patients endpoint:', reportError);
        // Fallback to regular patients endpoint with higher limit
        const params = new URLSearchParams();
        params.append('limit', '1000');
        response = await api.get(`/users/patients?${params}`);
      }
      
      if (response.data.status === 'success') {
        const allPatients = response.data.data.patients || [];
        
        // Filter patients by date range on frontend if using fallback
        const filteredPatients = allPatients.filter(patient => {
          const patientDate = new Date(patient.createdAt);
          const startDate = new Date(reportDateRange.start);
          const endDate = new Date(reportDateRange.end);
          return patientDate >= startDate && patientDate <= endDate;
        });

        // Calculate report statistics
        const reportStats = {
          totalPatients: filteredPatients.length,
          activePatients: filteredPatients.filter(p => p.isActive).length,
          inactivePatients: filteredPatients.filter(p => !p.isActive).length,
          newPatients: filteredPatients.filter(p => {
            const patientDate = new Date(p.createdAt);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return patientDate > thirtyDaysAgo;
          }).length,
          verifiedPatients: filteredPatients.filter(p => p.isEmailVerified).length,
          unverifiedPatients: filteredPatients.filter(p => !p.isEmailVerified).length
        };

        const reportData = {
          title: 'Patient Report',
          generatedAt: new Date().toISOString(),
          dateRange: reportDateRange,
          summary: reportStats,
          patients: filteredPatients.map(patient => ({
            id: patient._id,
            name: `${patient.firstName} ${patient.lastName}`,
            email: patient.email,
            phone: patient.phone || 'Not provided',
            status: patient.isActive ? 'Active' : 'Inactive',
            emailVerified: patient.isEmailVerified ? 'Yes' : 'No',
            joinedDate: new Date(patient.createdAt).toLocaleDateString(),
            lastLogin: patient.lastLogin ? new Date(patient.lastLogin).toLocaleDateString() : 'Never',
            gender: patient.gender || 'Not specified',
            dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'Not provided'
          }))
        };

        setReportData(reportData);
        setReportDialogOpen(true);
      } else {
        setError('Failed to generate report');
      }
    } catch (err) {
      setError('Failed to generate report');
      console.error('Generate report error:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const exportReport = (format) => {
    if (!reportData) {
      alert('No report data available. Please generate a report first.');
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `patients_report_${timestamp}`;

      if (format === 'pdf') {
        generatePDFReport(reportData, filename);
      } else if (format === 'csv') {
        generateCSVReport(reportData, filename);
      } else if (format === 'json') {
        generateJSONReport(reportData, filename);
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export report. Please try again.');
    }
  };

  const generatePDFReport = (data, filename) => {
    const printWindow = window.open('', '_blank');
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Report - ${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1976d2; padding-bottom: 20px; }
          .section { margin-bottom: 25px; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
          .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; background-color: #f9f9f9; }
          .stat-number { font-size: 24px; font-weight: bold; color: #1976d2; }
          .stat-label { font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          .status-active { color: #4caf50; font-weight: bold; }
          .status-inactive { color: #f44336; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Patient Report</h1>
          <p>Generated on: ${new Date(data.generatedAt).toLocaleString()}</p>
          <p>Date Range: ${data.dateRange.start} to ${data.dateRange.end}</p>
        </div>
        
        <div class="section">
          <h2>Summary Statistics</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${data.summary.totalPatients}</div>
              <div class="stat-label">Total Patients</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.summary.activePatients}</div>
              <div class="stat-label">Active Patients</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.summary.inactivePatients}</div>
              <div class="stat-label">Inactive Patients</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.summary.newPatients}</div>
              <div class="stat-label">New This Month</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.summary.verifiedPatients}</div>
              <div class="stat-label">Email Verified</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.summary.unverifiedPatients}</div>
              <div class="stat-label">Email Unverified</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Patient Details</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Email Verified</th>
                <th>Joined Date</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              ${data.patients.map(patient => `
                <tr>
                  <td>${patient.name}</td>
                  <td>${patient.email}</td>
                  <td>${patient.phone}</td>
                  <td class="${patient.status === 'Active' ? 'status-active' : 'status-inactive'}">${patient.status}</td>
                  <td>${patient.emailVerified}</td>
                  <td>${patient.joinedDate}</td>
                  <td>${patient.lastLogin}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Report generated by Nature Pulse Healthcare System</p>
          <p>This report contains confidential patient information and should be handled securely.</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const generateCSVReport = (data, filename) => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Status', 'Email Verified', 'Joined Date', 'Last Login', 'Gender', 'Date of Birth'],
      ...data.patients.map(patient => [
        patient.name,
        patient.email,
        patient.phone,
        patient.status,
        patient.emailVerified,
        patient.joinedDate,
        patient.lastLogin,
        patient.gender,
        patient.dateOfBirth
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateJSONReport = (data, filename) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && patients.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Fade in timeout={800}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                My Patients 👥
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Manage your patient records and health data
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Assessment />}
                onClick={() => setReportDialogOpen(true)}
                sx={{
                  background: 'linear-gradient(45deg, #FF6B6B 30%, #4ECDC4 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FF5252 30%, #26A69A 90%)',
                  }
                }}
              >
                Generate Report
              </Button>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchPatients} color="primary">
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats.total}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Patients
                      </Typography>
                    </Box>
                    <People sx={{ fontSize: 40, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats.active}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Active Patients
                      </Typography>
                    </Box>
                    <CheckCircle sx={{ fontSize: 40, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats.new}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        New This Month
                      </Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: 40, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats.recent}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Recent Activity
                      </Typography>
                    </Box>
                    <Assessment sx={{ fontSize: 40, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Search and Filters */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  placeholder="Search patients by name or email..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    label="Status"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Patients</MenuItem>
                    <MenuItem value="active">Active Only</MenuItem>
                    <MenuItem value="inactive">Inactive Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    icon={<People />}
                    label={`${totalPatients} patients`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Fade>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {patients.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <People sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No Patients Found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {searchTerm || statusFilter !== 'all' 
              ? 'No patients match your search criteria.' 
              : 'You don\'t have any patients yet.'
            }
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {patients.map((patient) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={patient._id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          mr: 2,
                          bgcolor: 'primary.main',
                          fontSize: '1.5rem'
                        }}
                      >
                        {patient.firstName?.[0]}{patient.lastName?.[0]}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div">
                          {patient.firstName} {patient.lastName}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(patient.isActive)}
                          label={patient.isActive ? 'Active' : 'Inactive'}
                          color={getStatusColor(patient.isActive)}
                          size="small"
                        />
                      </Box>
                    </Box>

                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                            <Email />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Email"
                          secondary={patient.email}
                        />
                      </ListItem>
                      
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                            <Phone />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Phone"
                          secondary={patient.phone || 'Not provided'}
                        />
                      </ListItem>

                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                            <CalendarToday />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Joined"
                          secondary={formatDate(patient.createdAt)}
                        />
                      </ListItem>
                    </List>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Visibility />}
                      onClick={() => handleViewPatient(patient)}
                      sx={{ flexGrow: 1 }}
                    >
                      View Details
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Assignment />}
                      onClick={() => navigate(`/app/doctor/patients/${patient._id}`)}
                    >
                      Records
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Patient Detail Dialog */}
      <Dialog
        open={patientDetailOpen}
        onClose={handleClosePatientDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              {selectedPatient?.firstName?.[0]}{selectedPatient?.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {selectedPatient?.firstName} {selectedPatient?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Patient Details
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Personal Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Email"
                        secondary={selectedPatient.email}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Phone"
                        secondary={selectedPatient.phone || 'Not provided'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Date of Birth"
                        secondary={selectedPatient.dateOfBirth ? formatDate(selectedPatient.dateOfBirth) : 'Not provided'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Gender"
                        secondary={selectedPatient.gender || 'Not specified'}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Account Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip
                            icon={getStatusIcon(selectedPatient.isActive)}
                            label={selectedPatient.isActive ? 'Active' : 'Inactive'}
                            color={getStatusColor(selectedPatient.isActive)}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Member Since"
                        secondary={formatDate(selectedPatient.createdAt)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Last Login"
                        secondary={selectedPatient.lastLogin ? formatDate(selectedPatient.lastLogin) : 'Never'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Email Verified"
                        secondary={
                          <Chip
                            icon={selectedPatient.isEmailVerified ? <CheckCircle /> : <Warning />}
                            label={selectedPatient.isEmailVerified ? 'Verified' : 'Not Verified'}
                            color={selectedPatient.isEmailVerified ? 'success' : 'warning'}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePatientDetail}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              handleClosePatientDetail();
              navigate(`/app/doctor/patients/${selectedPatient?._id}`);
            }}
          >
            View Full Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Generation Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Assessment sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">Generate Patient Report</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              Select Date Range
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={reportDateRange.start}
                  onChange={(e) => setReportDateRange(prev => ({ ...prev, start: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={reportDateRange.end}
                  onChange={(e) => setReportDateRange(prev => ({ ...prev, end: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
              This report will include all patients who joined within the selected date range.
            </Typography>

            {reportData && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Report Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                      <Typography variant="h6">{reportData.summary.totalPatients}</Typography>
                      <Typography variant="body2">Total Patients</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                      <Typography variant="h6">{reportData.summary.activePatients}</Typography>
                      <Typography variant="body2">Active</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                      <Typography variant="h6">{reportData.summary.newPatients}</Typography>
                      <Typography variant="body2">New This Month</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                      <Typography variant="h6">{reportData.summary.verifiedPatients}</Typography>
                      <Typography variant="body2">Verified</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setReportDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={generateReport}
            disabled={generatingReport}
            startIcon={generatingReport ? <CircularProgress size={20} /> : <DateRange />}
          >
            {generatingReport ? 'Generating...' : 'Generate Report'}
          </Button>
          {reportData && (
            <>
              <Button
                variant="contained"
                startIcon={<PictureAsPdf />}
                onClick={() => exportReport('pdf')}
                sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
              >
                Export PDF
              </Button>
              <Button
                variant="contained"
                startIcon={<TableChart />}
                onClick={() => exportReport('csv')}
                sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
              >
                Export CSV
              </Button>
              <Button
                variant="contained"
                startIcon={<FileDownload />}
                onClick={() => exportReport('json')}
                sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#0d47a1' } }}
              >
                Export JSON
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DoctorPatients;