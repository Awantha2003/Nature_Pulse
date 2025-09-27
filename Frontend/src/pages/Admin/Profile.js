import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  TextField,
  Button,
  Avatar,
  IconButton,
  Divider,
  Grid,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
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
  Chip,
  Fade,
  Zoom,
  Slide,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
  Badge,
  Stack,
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
  AdminPanelSettings,
  CheckCircle,
  Warning,
  Info,
  Delete,
  CloudUpload,
  Visibility,
  VisibilityOff,
  Lock,
  LockOpen,
  Settings,
  Notifications,
  Language,
  Palette,
  AccountCircle,
  Badge as BadgeIcon,
  Work,
  School,
  Home,
  Public,
  Lock as LockIcon,
  VerifiedUser,
  Timeline,
  Assessment,
  TrendingUp,
  Group,
  LocalHospital,
  ShoppingCart,
  Assignment,
  Analytics,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const AdminProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
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
    role: 'admin',
    isActive: true,
    lastLogin: '',
    createdAt: '',
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'en',
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || '',
        profileImage: user.profileImage || '',
        role: user.role || 'admin',
        isActive: user.isActive !== false,
        lastLogin: user.lastLogin || '',
        createdAt: user.createdAt || '',
        preferences: {
          theme: user.preferences?.theme || 'light',
          notifications: user.preferences?.notifications !== false,
          language: user.preferences?.language || 'en',
        },
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
    setActiveTab(newValue);
  };

  const renderPersonalInfo = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="label"
                size="small"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                <PhotoCamera />
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleImageUpload}
                />
              </IconButton>
            }
          >
            <Avatar
              src={profileData.profileImage ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${profileData.profileImage}` : ''}
              sx={{ width: 120, height: 120, fontSize: '3rem' }}
            >
              {profileData.firstName ? profileData.firstName[0] : 'A'}
            </Avatar>
          </Badge>
          <Box sx={{ ml: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {editing ? (
                <TextField
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  variant="standard"
                  placeholder="First Name"
                  sx={{ mr: 1, minWidth: 150 }}
                />
              ) : (
                profileData.firstName || 'Admin'
              )}
              {' '}
              {editing ? (
                <TextField
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  variant="standard"
                  placeholder="Last Name"
                  sx={{ minWidth: 150 }}
                />
              ) : (
                profileData.lastName || 'User'
              )}
            </Typography>
            <Chip
              icon={<AdminPanelSettings />}
              label="Administrator"
              color="primary"
              variant="outlined"
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {profileData.email}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              value={profileData.email}
              disabled
              InputProps={{
                startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!editing}>
              <InputLabel>Gender</InputLabel>
              <Select
                value={profileData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                startAdornment={<Person sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
                <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              multiline
              rows={3}
              value={profileData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={!editing}
              InputProps={{
                startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />,
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        {editing ? (
          <>
            <Button
              onClick={() => setEditing(false)}
              startIcon={<Cancel />}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button
            onClick={() => setEditing(true)}
            variant="contained"
            startIcon={<Edit />}
          >
            Edit Profile
          </Button>
        )}
      </CardActions>
    </Card>
  );

  const renderSecuritySettings = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Security sx={{ mr: 1 }} />
          Security Settings
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Change Password
            </Typography>
            <Grid container spacing={2}>
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
              sx={{ mt: 2 }}
              startIcon={saving ? <CircularProgress size={20} /> : <Lock />}
            >
              {saving ? 'Changing...' : 'Change Password'}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderPreferences = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Settings sx={{ mr: 1 }} />
          Preferences
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Theme</InputLabel>
              <Select
                value={profileData.preferences.theme}
                onChange={(e) => handleInputChange('preferences.theme', e.target.value)}
                startAdornment={<Palette sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="auto">Auto</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={profileData.preferences.language}
                onChange={(e) => handleInputChange('preferences.language', e.target.value)}
                startAdornment={<Language sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={profileData.preferences.notifications}
                  onChange={(e) => handleInputChange('preferences.notifications', e.target.checked)}
                />
              }
              label="Enable Notifications"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderAccountInfo = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AccountCircle sx={{ mr: 1 }} />
          Account Information
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <List>
          <ListItem>
            <ListItemIcon>
              <BadgeIcon />
            </ListItemIcon>
            <ListItemText
              primary="Role"
              secondary={profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
            />
            <Chip
              icon={<AdminPanelSettings />}
              label="Administrator"
              color="primary"
              size="small"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color={profileData.isActive ? 'success' : 'error'} />
            </ListItemIcon>
            <ListItemText
              primary="Account Status"
              secondary={profileData.isActive ? 'Active' : 'Inactive'}
            />
            <Chip
              label={profileData.isActive ? 'Active' : 'Inactive'}
              color={profileData.isActive ? 'success' : 'error'}
              size="small"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CalendarToday />
            </ListItemIcon>
            <ListItemText
              primary="Member Since"
              secondary={profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Timeline />
            </ListItemIcon>
            <ListItemText
              primary="Last Login"
              secondary={profileData.lastLogin ? new Date(profileData.lastLogin).toLocaleString() : 'N/A'}
            />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  const renderAdminStats = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Assessment sx={{ mr: 1 }} />
          Admin Statistics
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Group color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">
                1,234
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <LocalHospital color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">
                89
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Doctors
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <ShoppingCart color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                456
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Products
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Assignment color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main">
                2,345
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Appointments
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderDangerZone = () => (
    <Card sx={{ mb: 3, border: '1px solid', borderColor: 'error.main' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
          <Warning sx={{ mr: 1 }} />
          Danger Zone
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Alert severity="warning" sx={{ mb: 2 }}>
          These actions are irreversible. Please proceed with caution.
        </Alert>

        <Button
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={() => setDeleteDialog(true)}
          disabled={saving}
        >
          Deactivate Account
        </Button>
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
            Admin Profile 👤
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your administrator profile and account settings
          </Typography>
        </Box>
      </Fade>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Personal Info" icon={<Person />} />
          <Tab label="Security" icon={<Security />} />
          <Tab label="Preferences" icon={<Settings />} />
          <Tab label="Account" icon={<AccountCircle />} />
          <Tab label="Statistics" icon={<Assessment />} />
        </Tabs>
      </Box>

      {activeTab === 0 && renderPersonalInfo()}
      {activeTab === 1 && renderSecuritySettings()}
      {activeTab === 2 && renderPreferences()}
      {activeTab === 3 && (
        <>
          {renderAccountInfo()}
          {renderDangerZone()}
        </>
      )}
      {activeTab === 4 && renderAdminStats()}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Deactivate Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate your account? This action cannot be undone.
            You will be logged out and will need to contact support to reactivate your account.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={saving}
          >
            {saving ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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

export default AdminProfile;
