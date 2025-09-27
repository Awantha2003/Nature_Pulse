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
  Autocomplete,
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
  MedicalServices,
  Assignment,
  History,
  Delete,
  Add,
  CheckCircle,
  Warning,
  Info,
  Work,
  School,
  Language,
  AttachMoney,
  Schedule,
  Star,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const DoctorProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [profileData, setProfileData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    dateOfBirth: '',
    gender: '',
    profileImage: '',
    
    // Professional Info
    specialization: '',
    bio: '',
    consultationFee: '',
    languages: [],
    experience: '',
    education: [],
    certifications: [],
    isAcceptingNewPatients: true,
    
    // Availability
    availability: {
      monday: { isAvailable: false, startTime: '', endTime: '' },
      tuesday: { isAvailable: false, startTime: '', endTime: '' },
      wednesday: { isAvailable: false, startTime: '', endTime: '' },
      thursday: { isAvailable: false, startTime: '', endTime: '' },
      friday: { isAvailable: false, startTime: '', endTime: '' },
      saturday: { isAvailable: false, startTime: '', endTime: '' },
      sunday: { isAvailable: false, startTime: '', endTime: '' },
    },
    
    // Preferences
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

  const [educationDialog, setEducationDialog] = useState(false);
  const [certificationDialog, setCertificationDialog] = useState(false);
  const [newEducation, setNewEducation] = useState({
    degree: '',
    institution: '',
    year: '',
  });
  const [newCertification, setNewCertification] = useState({
    name: '',
    issuer: '',
    year: '',
  });

  const specializations = [
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Hematology',
    'Infectious Disease',
    'Nephrology',
    'Neurology',
    'Oncology',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Rheumatology',
    'Urology',
    'General Practice',
    'Internal Medicine',
    'Family Medicine',
    'Emergency Medicine',
    'Anesthesiology',
    'Radiology',
    'Pathology',
    'Surgery',
    'Orthopedics',
    'Ophthalmology',
    'ENT',
    'Gynecology',
    'Obstetrics',
  ];

  const languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Russian',
    'Chinese',
    'Japanese',
    'Korean',
    'Arabic',
    'Hindi',
    'Bengali',
    'Tamil',
    'Telugu',
    'Marathi',
    'Gujarati',
    'Punjabi',
    'Urdu',
    'Malayalam',
  ];

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: (user.address && typeof user.address === 'object') ? user.address : {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || '',
        profileImage: user.profileImage || '',
        specialization: user.specialization || '',
        bio: user.bio || '',
        consultationFee: user.consultationFee || '',
        languages: user.languages || [],
        experience: user.experience || '',
        education: user.education || [],
        certifications: user.certifications || [],
        isAcceptingNewPatients: user.isAcceptingNewPatients !== undefined ? user.isAcceptingNewPatients : true,
        availability: (user.availability && typeof user.availability === 'object') ? user.availability : {
          monday: { isAvailable: false, startTime: '', endTime: '' },
          tuesday: { isAvailable: false, startTime: '', endTime: '' },
          wednesday: { isAvailable: false, startTime: '', endTime: '' },
          thursday: { isAvailable: false, startTime: '', endTime: '' },
          friday: { isAvailable: false, startTime: '', endTime: '' },
          saturday: { isAvailable: false, startTime: '', endTime: '' },
          sunday: { isAvailable: false, startTime: '', endTime: '' },
        },
        preferences: (user.preferences && typeof user.preferences === 'object') ? user.preferences : {
          notifications: true,
          emailUpdates: true,
          smsUpdates: false,
        },
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const keys = field.split('.');
      setProfileData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        // Navigate to the parent object
        for (let i = 0; i < keys.length - 1; i++) {
          // Ensure the current property is an object, not a string
          if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        // Set the final value
        current[keys[keys.length - 1]] = value;
        return newData;
      });
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

  const handleAddEducation = () => {
    if (newEducation.degree && newEducation.institution && newEducation.year) {
      setProfileData(prev => ({
        ...prev,
        education: [...prev.education, { ...newEducation }],
      }));
      setNewEducation({ degree: '', institution: '', year: '' });
      setEducationDialog(false);
    }
  };

  const handleRemoveEducation = (index) => {
    setProfileData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const handleAddCertification = () => {
    if (newCertification.name && newCertification.issuer && newCertification.year) {
      setProfileData(prev => ({
        ...prev,
        certifications: [...prev.certifications, { ...newCertification }],
      }));
      setNewCertification({ name: '', issuer: '', year: '' });
      setCertificationDialog(false);
    }
  };

  const handleRemoveCertification = (index) => {
    setProfileData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
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
          <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'center' }}>
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
              Dr. {profileData.firstName} {profileData.lastName}
            </Typography>
            <Chip label="Doctor" color="info" sx={{ mt: 1 }} />
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Street Address"
                  value={profileData.address?.street || ''}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="City"
                  value={profileData.address?.city || ''}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  disabled={!editing}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="State"
                  value={profileData.address?.state || ''}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  disabled={!editing}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Zip Code"
                  value={profileData.address?.zipCode || ''}
                  onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                  disabled={!editing}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Country"
                  value={profileData.address?.country || ''}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                  disabled={!editing}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderProfessionalInfo = () => (
    <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Professional Information
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth disabled={!editing}>
              <InputLabel>Specialization</InputLabel>
              <Select
                value={profileData.specialization}
                label="Specialization"
                onChange={(e) => handleInputChange('specialization', e.target.value)}
              >
                {specializations.map((spec) => (
                  <MenuItem key={spec} value={spec}>
                    {spec}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Consultation Fee (LKR)"
              type="number"
              value={profileData.consultationFee}
              onChange={(e) => handleInputChange('consultationFee', e.target.value)}
              disabled={!editing}
              InputProps={{
                startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Years of Experience"
              type="number"
              value={profileData.experience}
              onChange={(e) => handleInputChange('experience', e.target.value)}
              disabled={!editing}
              InputProps={{
                startAdornment: <Work sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              multiple
              options={languages}
              value={profileData.languages}
              onChange={(event, newValue) => handleInputChange('languages', newValue)}
              disabled={!editing}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Languages"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <Language sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Bio"
              multiline
              rows={4}
              value={profileData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              disabled={!editing}
              placeholder="Tell patients about your experience, approach to care, and what makes you unique..."
              helperText={`${(profileData.bio || '').length}/500 characters`}
              inputProps={{
                maxLength: 500
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={profileData.isAcceptingNewPatients}
                  onChange={(e) => handleInputChange('isAcceptingNewPatients', e.target.checked)}
                  disabled={!editing}
                />
              }
              label="Accepting New Patients"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderAvailability = () => (
    <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Availability Schedule
        </Typography>

        {Object.entries(profileData.availability).map(([day, schedule]) => (
          <Box key={day} sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={schedule.isAvailable}
                  onChange={(e) => handleInputChange(`availability.${day}.isAvailable`, e.target.checked)}
                  disabled={!editing}
                />
              }
              label={day.charAt(0).toUpperCase() + day.slice(1)}
            />
            {schedule.isAvailable && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => handleInputChange(`availability.${day}.startTime`, e.target.value)}
                    disabled={!editing}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="End Time"
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => handleInputChange(`availability.${day}.endTime`, e.target.value)}
                    disabled={!editing}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        ))}
      </CardContent>
    </Card>
  );

  const renderEducation = () => (
    <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Education & Certifications
          </Typography>
          <Button
            startIcon={<Add />}
            onClick={() => setEducationDialog(true)}
            sx={{ borderRadius: '25px' }}
          >
            Add Education
          </Button>
        </Box>

        {profileData.education.length > 0 ? (
          <List>
            {profileData.education.map((edu, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <School color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={edu.degree || 'Degree'}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {edu.institution || 'Institution'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {edu.year || 'Year'}
                        </Typography>
                      </Box>
                    }
                  />
                  <IconButton color="error" onClick={() => handleRemoveEducation(index)}>
                    <Delete />
                  </IconButton>
                </ListItem>
                {index < profileData.education.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <School sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No education records
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add your educational background and certifications
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Certifications
          </Typography>
          <Button
            startIcon={<Add />}
            onClick={() => setCertificationDialog(true)}
            sx={{ borderRadius: '25px' }}
          >
            Add Certification
          </Button>
        </Box>

        {profileData.certifications.length > 0 ? (
          <List>
            {profileData.certifications.map((cert, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Star color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={cert.name || 'Certification Name'}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {cert.issuer || 'Issuing Organization'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {cert.year || 'Year'}
                        </Typography>
                      </Box>
                    }
                  />
                  <IconButton color="error" onClick={() => handleRemoveCertification(index)}>
                    <Delete />
                  </IconButton>
                </ListItem>
                {index < profileData.certifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Star sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No certifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add your professional certifications
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

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
            <Grid size={{ xs: 12, md: 4 }}>
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
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
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
            Doctor Profile 👨‍⚕️
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage your professional profile and practice settings
          </Typography>
        </Box>
      </Fade>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="profile tabs">
          <Tab icon={<Person />} label="Personal Info" />
          <Tab icon={<Work />} label="Professional" />
          <Tab icon={<Schedule />} label="Availability" />
          <Tab icon={<School />} label="Education" />
          <Tab icon={<Notifications />} label="Preferences" />
          <Tab icon={<Security />} label="Security" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderPersonalInfo()}
      {activeTab === 1 && renderProfessionalInfo()}
      {activeTab === 2 && renderAvailability()}
      {activeTab === 3 && renderEducation()}
      {activeTab === 4 && renderPreferences()}
      {activeTab === 5 && renderSecurity()}

      {/* Add Education Dialog */}
      <Dialog open={educationDialog} onClose={() => setEducationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Education</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Degree"
                value={newEducation.degree}
                onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Institution"
                value={newEducation.institution}
                onChange={(e) => setNewEducation(prev => ({ ...prev, institution: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={newEducation.year}
                onChange={(e) => setNewEducation(prev => ({ ...prev, year: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEducationDialog(false)}>Cancel</Button>
          <Button onClick={handleAddEducation} variant="contained">Add Education</Button>
        </DialogActions>
      </Dialog>

      {/* Add Certification Dialog */}
      <Dialog open={certificationDialog} onClose={() => setCertificationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Certification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Certification Name"
                value={newCertification.name}
                onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Issuing Organization"
                value={newCertification.issuer}
                onChange={(e) => setNewCertification(prev => ({ ...prev, issuer: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={newCertification.year}
                onChange={(e) => setNewCertification(prev => ({ ...prev, year: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertificationDialog(false)}>Cancel</Button>
          <Button onClick={handleAddCertification} variant="contained">Add Certification</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your account? This action cannot be undone.
            All your data, including patient records and appointment history, will be permanently removed.
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

export default DoctorProfile;