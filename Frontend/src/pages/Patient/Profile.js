import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  IconButton,
  Divider,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Fade,
  Zoom,
  Slide,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Person,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Security,
  Notifications,
  HealthAndSafety,
  MedicalServices,
  Assignment,
  History,
  Delete,
  Add,
  CheckCircle,
  Warning,
  Info,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const PatientProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [medicalHistoryDialog, setMedicalHistoryDialog] = useState(false);
  const [newMedicalRecord, setNewMedicalRecord] = useState({
    condition: '',
    date: '',
    notes: ''
  });
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    profileImage: '',
    medicalHistory: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    preferences: {
      notifications: true,
      emailUpdates: true,
      smsUpdates: false,
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      console.log('Loading user data:', user);
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        profileImage: user.profileImage || '',
        medicalHistory: user.medicalHistory || [
          {
            id: 1,
            condition: 'Hypertension',
            date: '2023-01-15',
            notes: 'Diagnosed with high blood pressure, currently on medication'
          },
          {
            id: 2,
            condition: 'Diabetes Type 2',
            date: '2022-06-20',
            notes: 'Controlled with diet and medication'
          }
        ],
        emergencyContact: user.emergencyContact || {
          name: 'John Doe',
          phone: '+1-555-0123',
          relationship: 'Spouse',
        },
        preferences: user.preferences || {
          notifications: true,
          emailUpdates: true,
          smsUpdates: false,
        },
      });
      console.log('Profile data set:', {
        medicalHistory: user.medicalHistory || [
          {
            id: 1,
            condition: 'Hypertension',
            date: '2023-01-15',
            notes: 'Diagnosed with high blood pressure, currently on medication'
          },
          {
            id: 2,
            condition: 'Diabetes Type 2',
            date: '2022-06-20',
            notes: 'Controlled with diet and medication'
          }
        ],
        emergencyContact: user.emergencyContact || {
          name: 'John Doe',
          phone: '+1-555-0123',
          relationship: 'Spouse',
        }
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.put('/users/profile', profileData);
      
      if (response.data.status === 'success') {
        updateUser(response.data.data.user);
        setEditing(false);
        setSnackbar({
          open: true,
          message: 'Profile updated successfully!',
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update profile',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      setLoading(true);
      const response = await api.post('/users/profile/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        setProfileData(prev => ({
          ...prev,
          profileImage: response.data.data.profileImage,
        }));
        setSnackbar({
          open: true,
          message: 'Profile image updated successfully!',
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to upload image',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'New passwords do not match',
        severity: 'error',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data.status === 'success') {
        setSnackbar({
          open: true,
          message: 'Password changed successfully!',
          severity: 'success',
        });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
      console.error('Error response:', error.response);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to change password',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      await api.delete('/users/deactivate', {
        data: { password: 'current_password' }, // In real app, ask for password
      });
      
      setSnackbar({
        open: true,
        message: 'Account deactivated successfully',
        severity: 'success',
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to deactivate account',
        severity: 'error',
      });
    } finally {
      setSaving(false);
      setDeleteDialog(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    console.log('Tab changed to:', newValue);
    setActiveTab(newValue);
  };

  const handleAddMedicalRecord = () => {
    if (newMedicalRecord.condition.trim()) {
      const updatedMedicalHistory = [...profileData.medicalHistory, {
        ...newMedicalRecord,
        id: Date.now() // Simple ID generation
      }];
      
      setProfileData(prev => ({
        ...prev,
        medicalHistory: updatedMedicalHistory
      }));
      
      setNewMedicalRecord({
        condition: '',
        date: '',
        notes: ''
      });
      setMedicalHistoryDialog(false);
      
      setSnackbar({
        open: true,
        message: 'Medical record added successfully!',
        severity: 'success',
      });
    }
  };

  const handleDeleteMedicalRecord = (index) => {
    const updatedMedicalHistory = profileData.medicalHistory.filter((_, i) => i !== index);
    setProfileData(prev => ({
      ...prev,
      medicalHistory: updatedMedicalHistory
    }));
    
    setSnackbar({
      open: true,
      message: 'Medical record deleted successfully!',
      severity: 'success',
    });
  };

  const renderPersonalInfo = () => (
    <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1 }}>
            Personal Information
          </Typography>
          {!editing ? (
            <Button
              startIcon={<Edit />}
              onClick={() => setEditing(true)}
              sx={{ borderRadius: '25px' }}
            >
              Edit Profile
            </Button>
          ) : (
            <Box>
              <Button
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving}
                sx={{ mr: 1, borderRadius: '25px' }}
              >
                {saving ? <CircularProgress size={20} /> : 'Save'}
              </Button>
              <Button
                startIcon={<Cancel />}
                onClick={() => setEditing(false)}
                sx={{ borderRadius: '25px' }}
              >
                Cancel
              </Button>
            </Box>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={profileData.profileImage ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${profileData.profileImage}` : ''}
                sx={{ width: 120, height: 120, mb: 2 }}
              />
              {editing && (
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                  component="label"
                >
                  <PhotoCamera />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </IconButton>
              )}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {profileData.firstName} {profileData.lastName}
            </Typography>
            <Chip label="Patient" color="primary" sx={{ mt: 1 }} />
          </Grid>

          <Grid xs={12} md={8}>
            <Grid container spacing={3}>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  disabled={!editing}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <FormControl fullWidth disabled={!editing}>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={profileData.gender}
                    label="Gender"
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={3}
                  value={profileData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary', mt: 1 }} />,
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderMedicalHistory = () => {
    console.log('Rendering Medical History:', profileData.medicalHistory);
    return (
      <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Medical History
            </Typography>
          <Button
            startIcon={<Add />}
            onClick={() => setMedicalHistoryDialog(true)}
            sx={{ borderRadius: '25px' }}
          >
            Add Record
          </Button>
          </Box>

        {profileData.medicalHistory.length > 0 ? (
          <List>
            {profileData.medicalHistory.map((record, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <MedicalServices color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={record.condition || 'Medical Condition'}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {record.date || 'Date not specified'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {record.notes || 'No additional notes'}
                        </Typography>
                      </Box>
                    }
                  />
                  <IconButton 
                    color="error"
                    onClick={() => handleDeleteMedicalRecord(index)}
                  >
                    <Delete />
                  </IconButton>
                </ListItem>
                {index < profileData.medicalHistory.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <HealthAndSafety sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No medical history recorded
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add your medical records to help doctors provide better care
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
    );
  };

  const renderEmergencyContact = () => {
    console.log('Rendering Emergency Contact:', profileData.emergencyContact);
    return (
      <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Emergency Contact
            </Typography>
            {!editing && (
              <Button
                startIcon={<Edit />}
                onClick={() => setEditing(true)}
                sx={{ borderRadius: '25px' }}
              >
                Edit Contact
              </Button>
            )}
          </Box>

          {editing && (
            <Box sx={{ mb: 3 }}>
              <Button
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving}
                sx={{ mr: 1, borderRadius: '25px' }}
              >
                {saving ? <CircularProgress size={20} /> : 'Save Changes'}
              </Button>
              <Button
                startIcon={<Cancel />}
                onClick={() => setEditing(false)}
                sx={{ borderRadius: '25px' }}
              >
                Cancel
              </Button>
            </Box>
          )}

          {!editing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper sx={{ p: 3, backgroundColor: 'grey.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {profileData.emergencyContact.name || 'No name provided'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Phone sx={{ mr: 2, color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body1">
                    {profileData.emergencyContact.phone || 'No phone provided'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Assignment sx={{ mr: 2, color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body1">
                    {profileData.emergencyContact.relationship || 'No relationship specified'}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Name"
                  value={profileData.emergencyContact.name}
                  onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                  disabled={!editing}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={profileData.emergencyContact.phone}
                  onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                  disabled={!editing}
                />
              </Grid>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="Relationship"
                  value={profileData.emergencyContact.relationship}
                  onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                  disabled={!editing}
                />
              </Grid>
            </Grid>
          )}
      </CardContent>
    </Card>
    );
  };

  const renderPreferences = () => (
    <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Preferences & Settings
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={profileData.preferences.notifications}
                onChange={(e) => handleInputChange('preferences.notifications', e.target.checked)}
                disabled={!editing}
              />
            }
            label="Push Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={profileData.preferences.emailUpdates}
                onChange={(e) => handleInputChange('preferences.emailUpdates', e.target.checked)}
                disabled={!editing}
              />
            }
            label="Email Updates"
          />
          <FormControlLabel
            control={
              <Switch
                checked={profileData.preferences.smsUpdates}
                onChange={(e) => handleInputChange('preferences.smsUpdates', e.target.checked)}
                disabled={!editing}
              />
            }
            label="SMS Updates"
          />
        </Box>
      </CardContent>
    </Card>
  );

  const renderSecurity = () => (
    <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Security & Privacy
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Security sx={{ mr: 1 }} />
            Change Password
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Current Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={saving || !passwordData.currentPassword || !passwordData.newPassword}
            sx={{ mt: 2, borderRadius: '25px' }}
            startIcon={saving ? <CircularProgress size={20} /> : <Security />}
          >
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Delete color="error" sx={{ mr: 1 }} />
            Delete Account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Permanently delete your account and all data. This action cannot be undone.
          </Typography>
          <Button 
            variant="outlined" 
            color="error"
            onClick={() => setDeleteDialog(true)}
            sx={{ borderRadius: '25px' }}
          >
            Delete Account
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg">
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
            My Profile 👤
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage your personal information and account settings
          </Typography>
        </Box>
      </Fade>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="profile tabs">
          <Tab icon={<Person />} label="Personal Info" />
          <Tab icon={<HealthAndSafety />} label="Medical History" />
          <Tab icon={<Assignment />} label="Emergency Contact" />
          <Tab icon={<Notifications />} label="Preferences" />
          <Tab icon={<Security />} label="Security" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderPersonalInfo()}
      {activeTab === 1 && renderMedicalHistory()}
      {activeTab === 2 && renderEmergencyContact()}
      {activeTab === 3 && renderPreferences()}
      {activeTab === 4 && renderSecurity()}

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your account? This action cannot be undone.
            All your data, including medical records and appointment history, will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteAccount} 
            color="error" 
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Medical History Dialog */}
      <Dialog open={medicalHistoryDialog} onClose={() => setMedicalHistoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Medical Record</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Medical Condition"
              value={newMedicalRecord.condition}
              onChange={(e) => setNewMedicalRecord(prev => ({ ...prev, condition: e.target.value }))}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={newMedicalRecord.date}
              onChange={(e) => setNewMedicalRecord(prev => ({ ...prev, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={newMedicalRecord.notes}
              onChange={(e) => setNewMedicalRecord(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this condition..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMedicalHistoryDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddMedicalRecord}
            variant="contained"
            disabled={!newMedicalRecord.condition.trim()}
          >
            Add Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PatientProfile;