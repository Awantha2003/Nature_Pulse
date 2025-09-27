import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Fab
} from '@mui/material';
import {
  Save,
  Edit,
  Delete,
  Add,
  Schedule,
  CheckCircle,
  Cancel,
  Info,
  ExpandMore,
  ContentCopy,
  RestoreFromTrash,
  AccessTime,
  EventAvailable
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const AvailabilityManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [tempAvailability, setTempAvailability] = useState({});
  const [quickSetupOpen, setQuickSetupOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile');
      
      if (response.data.status === 'success') {
        const doctorData = response.data.data.doctor;
        if (doctorData) {
          setDoctor(doctorData);
          setAvailability(doctorData.availability || {});
          console.log('Doctor profile loaded:', doctorData);
        } else {
          setError('Doctor profile not found. Please complete your doctor registration first.');
        }
      }
    } catch (err) {
      console.error('Fetch doctor profile error:', err);
      setError('Failed to fetch doctor profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      setSaving(true);
      setError(null);

      // Get the doctor ID from the current doctor profile
      if (!doctor || !doctor._id) {
        setError('Doctor profile not found. Please complete your doctor registration first.');
        return;
      }

      console.log('Saving availability for doctor:', doctor._id);
      console.log('Current doctor state before save:', JSON.stringify(doctor, null, 2));
      console.log('Availability data:', JSON.stringify(availability, null, 2));

      const requestData = {
        availability: availability
      };
      console.log('Request data being sent:', JSON.stringify(requestData, null, 2));

      const response = await api.put(`/users/doctors/${doctor._id}/availability`, requestData);

      console.log('Save response:', JSON.stringify(response.data, null, 2));

      if (response.data.status === 'success') {
        setSuccess('Availability updated successfully');
        // Update local state with the saved availability
        console.log('Updating local state with saved availability:', response.data.data.availability);
        setDoctor(prev => ({
          ...prev,
          availability: response.data.data.availability
        }));
        console.log('Local state updated successfully');
        
        // Verify the state was updated
        setTimeout(() => {
          console.log('Doctor state after update (delayed check):', JSON.stringify(doctor, null, 2));
        }, 100);
      }
    } catch (err) {
      console.error('Save availability error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  const handleEditDay = (day) => {
    setSelectedDay(day);
    const dayAvailability = availability[day];
    setTempAvailability({
      isAvailable: dayAvailability?.isAvailable || false,
      startTime: dayAvailability?.startTime || '09:00',
      endTime: dayAvailability?.endTime || '17:00',
      breakStart: dayAvailability?.breakStart || '',
      breakEnd: dayAvailability?.breakEnd || '',
      slotDuration: dayAvailability?.slotDuration || 30,
      maxAppointments: dayAvailability?.maxAppointments || 20
    });
    setEditDialogOpen(true);
  };

  const handleSaveDay = () => {
    setAvailability({
      ...availability,
      [selectedDay]: tempAvailability
    });
    setEditDialogOpen(false);
  };

  const handleToggleDay = (day) => {
    const currentDay = availability[day];
    const isCurrentlyAvailable = currentDay?.isAvailable || false;
    
    setAvailability({
      ...availability,
      [day]: {
        ...currentDay,
        isAvailable: !isCurrentlyAvailable,
        // If enabling availability, set default values
        ...(isCurrentlyAvailable ? {} : {
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 30,
          maxAppointments: 20
        })
      }
    });
  };

  const generateTimeSlots = (startTime, endTime, slotDuration) => {
    const slots = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    while (start < end) {
      slots.push(start.toTimeString().slice(0, 5));
      start.setMinutes(start.getMinutes() + slotDuration);
    }
    
    return slots;
  };

  const getAvailabilityStatus = (day) => {
    const dayAvailability = availability[day];
    if (!dayAvailability || !dayAvailability.isAvailable) {
      return { status: 'Unavailable', color: 'error' };
    }
    
    // Use maxAppointments if available, otherwise calculate from time slots
    const maxAppointments = dayAvailability.maxAppointments;
    let slotsCount;
    
    if (maxAppointments) {
      slotsCount = maxAppointments;
    } else {
      // Fallback to calculating from time slots
      const slots = generateTimeSlots(
        dayAvailability.startTime,
        dayAvailability.endTime,
        dayAvailability.slotDuration
      );
      slotsCount = slots.length;
    }
    
    return {
      status: `${slotsCount} slots available`,
      color: 'success'
    };
  };

  // Quick setup templates
  const quickSetupTemplates = [
    {
      name: 'Standard Business Hours',
      description: 'Monday-Friday, 9 AM - 5 PM',
      template: {
        monday: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 30, maxAppointments: 16 },
        tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 30, maxAppointments: 16 },
        wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 30, maxAppointments: 16 },
        thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 30, maxAppointments: 16 },
        friday: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 30, maxAppointments: 16 },
        saturday: { isAvailable: false },
        sunday: { isAvailable: false }
      }
    },
    {
      name: 'Extended Hours',
      description: 'Monday-Saturday, 8 AM - 8 PM',
      template: {
        monday: { isAvailable: true, startTime: '08:00', endTime: '20:00', slotDuration: 30, maxAppointments: 24 },
        tuesday: { isAvailable: true, startTime: '08:00', endTime: '20:00', slotDuration: 30, maxAppointments: 24 },
        wednesday: { isAvailable: true, startTime: '08:00', endTime: '20:00', slotDuration: 30, maxAppointments: 24 },
        thursday: { isAvailable: true, startTime: '08:00', endTime: '20:00', slotDuration: 30, maxAppointments: 24 },
        friday: { isAvailable: true, startTime: '08:00', endTime: '20:00', slotDuration: 30, maxAppointments: 24 },
        saturday: { isAvailable: true, startTime: '08:00', endTime: '20:00', slotDuration: 30, maxAppointments: 24 },
        sunday: { isAvailable: false }
      }
    },
    {
      name: 'Weekend Focus',
      description: 'Friday-Sunday, flexible hours',
      template: {
        monday: { isAvailable: false },
        tuesday: { isAvailable: false },
        wednesday: { isAvailable: false },
        thursday: { isAvailable: false },
        friday: { isAvailable: true, startTime: '10:00', endTime: '18:00', slotDuration: 30, maxAppointments: 16 },
        saturday: { isAvailable: true, startTime: '10:00', endTime: '18:00', slotDuration: 30, maxAppointments: 16 },
        sunday: { isAvailable: true, startTime: '10:00', endTime: '18:00', slotDuration: 30, maxAppointments: 16 }
      }
    }
  ];

  const applyQuickSetup = (template) => {
    setAvailability(template.template);
    setQuickSetupOpen(false);
    setSuccess(`Applied ${template.name} template`);
  };

  const copyDaySchedule = (sourceDay, targetDay) => {
    if (availability[sourceDay]) {
      setAvailability({
        ...availability,
        [targetDay]: { ...availability[sourceDay] }
      });
      setSuccess(`Copied ${sourceDay} schedule to ${targetDay}`);
    }
  };

  const clearDaySchedule = (day) => {
    setAvailability({
      ...availability,
      [day]: { isAvailable: false }
    });
    setSuccess(`Cleared ${day} schedule`);
  };

  const toggleDaySelection = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const applyBulkSettings = (settings) => {
    const newAvailability = { ...availability };
    selectedDays.forEach(day => {
      newAvailability[day] = {
        ...newAvailability[day],
        ...settings,
        isAvailable: true
      };
    });
    setAvailability(newAvailability);
    setBulkEditOpen(false);
    setSelectedDays([]);
    setSuccess(`Applied settings to ${selectedDays.length} days`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Availability Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage your availability schedule and time slots
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Quick Setup Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
                Quick Setup Templates
              </Typography>
              <Button
                variant="outlined"
                startIcon={<EventAvailable />}
                onClick={() => setQuickSetupOpen(true)}
              >
                Choose Template
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Get started quickly with pre-configured schedules or customize your own
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {quickSetupTemplates.map((template, index) => (
                <Chip
                  key={index}
                  label={template.name}
                  onClick={() => applyQuickSetup(template)}
                  variant="outlined"
                  color="primary"
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Weekly Schedule</Typography>
                  <Stack direction="row" spacing={1}>
                    {selectedDays.length > 0 && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setBulkEditOpen(true)}
                      >
                        Bulk Edit ({selectedDays.length})
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveAvailability}
                      disabled={saving}
                    >
                      {saving ? <CircularProgress size={20} /> : 'Save Changes'}
                    </Button>
                  </Stack>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Typography variant="body2" color="text.secondary">
                            Select
                          </Typography>
                        </TableCell>
                        <TableCell>Day</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Time Slots</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {days.map((day) => {
                        const dayAvailability = availability[day.key];
                        const status = getAvailabilityStatus(day.key);
                        const isSelected = selectedDays.includes(day.key);
                        
                        return (
                          <TableRow 
                            key={day.key}
                            sx={{ 
                              backgroundColor: isSelected ? 'action.selected' : 'inherit',
                              '&:hover': { backgroundColor: 'action.hover' }
                            }}
                          >
                            <TableCell padding="checkbox">
                              <IconButton
                                size="small"
                                onClick={() => toggleDaySelection(day.key)}
                                color={isSelected ? 'primary' : 'default'}
                              >
                                {isSelected ? <CheckCircle /> : <Add />}
                              </IconButton>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={dayAvailability?.isAvailable || false}
                                      onChange={() => handleToggleDay(day.key)}
                                      color="primary"
                                    />
                                  }
                                  label={
                                    <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                                      {day.label}
                                    </Typography>
                                  }
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={status.status}
                                color={status.color}
                                size="small"
                                icon={status.color === 'success' ? <CheckCircle /> : <Cancel />}
                              />
                            </TableCell>
                            <TableCell>
                              {dayAvailability?.isAvailable ? (
                                <Box>
                                  <Typography variant="body2" fontWeight={500}>
                                    {dayAvailability.startTime} - {dayAvailability.endTime}
                                  </Typography>
                                  {dayAvailability.breakStart && dayAvailability.breakEnd && (
                                    <Typography variant="caption" color="text.secondary">
                                      Break: {dayAvailability.breakStart} - {dayAvailability.breakEnd}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {dayAvailability.slotDuration}min slots • Max: {dayAvailability.maxAppointments}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  Not available
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.5}>
                                <Tooltip title="Edit Schedule">
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditDay(day.key)}
                                      disabled={!dayAvailability?.isAvailable}
                                      color="primary"
                                    >
                                      <Edit />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                {dayAvailability?.isAvailable && (
                                  <>
                                    <Tooltip title="Copy to other days">
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          const otherDays = days.filter(d => d.key !== day.key);
                                          // For demo, copy to next day
                                          const nextDay = otherDays.find(d => !availability[d.key]?.isAvailable);
                                          if (nextDay) copyDaySchedule(day.key, nextDay.key);
                                        }}
                                        color="secondary"
                                      >
                                        <ContentCopy />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Clear Schedule">
                                      <IconButton
                                        size="small"
                                        onClick={() => clearDaySchedule(day.key)}
                                        color="error"
                                      >
                                        <RestoreFromTrash />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Stats
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Available Days
                  </Typography>
                  <Typography variant="h6">
                    {days.filter(day => availability[day.key]?.isAvailable).length} / 7
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Weekly Slots
                  </Typography>
                  <Typography variant="h6">
                    {days.reduce((total, day) => {
                      const dayAvailability = availability[day.key];
                      if (!dayAvailability?.isAvailable) return total;
                      
                      const slots = generateTimeSlots(
                        dayAvailability.startTime,
                        dayAvailability.endTime,
                        dayAvailability.slotDuration
                      );
                      
                      return total + slots.length;
                    }, 0)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Consultation Fee
                  </Typography>
                  <Typography variant="h6" color="primary">
                    LKR {doctor?.consultationFee || 0}
                  </Typography>
                </Box>

                <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <Info sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    <strong>Tip:</strong> Set your availability to match your working hours. 
                    Patients can only book appointments during your available time slots.
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Setup Dialog */}
        <Dialog open={quickSetupOpen} onClose={() => setQuickSetupOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Choose a Quick Setup Template</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select a pre-configured schedule template to get started quickly. You can always customize it later.
            </Typography>
            <Grid container spacing={2}>
              {quickSetupTemplates.map((template, index) => (
                <Grid xs={12} md={4} key={index}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer', 
                      '&:hover': { boxShadow: 3 },
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                    onClick={() => applyQuickSetup(template)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {template.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Object.entries(template.template).map(([day, settings]) => (
                          <Chip
                            key={day}
                            label={day.charAt(0).toUpperCase() + day.slice(1, 3)}
                            size="small"
                            color={settings.isAvailable ? 'success' : 'default'}
                            variant={settings.isAvailable ? 'filled' : 'outlined'}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQuickSetupOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Edit Dialog */}
        <Dialog open={bulkEditOpen} onClose={() => setBulkEditOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Bulk Edit Selected Days</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Apply the same settings to: {selectedDays.map(day => days.find(d => d.key === day)?.label).join(', ')}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid xs={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="time"
                  defaultValue="09:00"
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => setTempAvailability(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </Grid>
              <Grid xs={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="time"
                  defaultValue="17:00"
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => setTempAvailability(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </Grid>
              <Grid xs={6}>
                <TextField
                  fullWidth
                  label="Slot Duration (minutes)"
                  type="number"
                  defaultValue={30}
                  onChange={(e) => setTempAvailability(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                  inputProps={{ min: 15, max: 120, step: 15 }}
                />
              </Grid>
              <Grid xs={6}>
                <TextField
                  fullWidth
                  label="Max Appointments"
                  type="number"
                  defaultValue={20}
                  onChange={(e) => setTempAvailability(prev => ({ ...prev, maxAppointments: parseInt(e.target.value) }))}
                  inputProps={{ min: 1, max: 50 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkEditOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => applyBulkSettings(tempAvailability)} 
              variant="contained"
            >
              Apply to Selected Days
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Day Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit {days.find(d => d.key === selectedDay)?.label} Schedule</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid xs={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="time"
                  value={tempAvailability.startTime || ''}
                  onChange={(e) => setTempAvailability({
                    ...tempAvailability,
                    startTime: e.target.value
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid xs={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="time"
                  value={tempAvailability.endTime || ''}
                  onChange={(e) => setTempAvailability({
                    ...tempAvailability,
                    endTime: e.target.value
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid xs={6}>
                <TextField
                  fullWidth
                  label="Break Start"
                  type="time"
                  value={tempAvailability.breakStart || ''}
                  onChange={(e) => setTempAvailability({
                    ...tempAvailability,
                    breakStart: e.target.value
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid xs={6}>
                <TextField
                  fullWidth
                  label="Break End"
                  type="time"
                  value={tempAvailability.breakEnd || ''}
                  onChange={(e) => setTempAvailability({
                    ...tempAvailability,
                    breakEnd: e.target.value
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid xs={6}>
                <TextField
                  fullWidth
                  label="Slot Duration (minutes)"
                  type="number"
                  value={tempAvailability.slotDuration || 30}
                  onChange={(e) => setTempAvailability({
                    ...tempAvailability,
                    slotDuration: parseInt(e.target.value) || 30
                  })}
                  inputProps={{ min: 15, max: 120, step: 15 }}
                />
              </Grid>
              <Grid xs={6}>
                <TextField
                  fullWidth
                  label="Max Appointments"
                  type="number"
                  value={tempAvailability.maxAppointments || 20}
                  onChange={(e) => setTempAvailability({
                    ...tempAvailability,
                    maxAppointments: parseInt(e.target.value) || 20
                  })}
                  inputProps={{ min: 1, max: 50 }}
                />
              </Grid>
            </Grid>

            {tempAvailability.startTime && tempAvailability.endTime && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Preview Time Slots:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {generateTimeSlots(
                    tempAvailability.startTime,
                    tempAvailability.endTime,
                    tempAvailability.slotDuration
                  ).map((slot) => (
                    <Chip
                      key={slot}
                      label={slot}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDay} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default AvailabilityManagement;
