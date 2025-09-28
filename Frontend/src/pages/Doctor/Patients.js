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
    </Container>
  );
};

export default DoctorPatients;