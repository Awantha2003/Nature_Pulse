import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Fab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  LinearProgress,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  LocalHospital as HealthIcon,
  Favorite as HeartIcon,
  WbSunny as SunIcon,
  Nightlight as MoonIcon,
  FitnessCenter as ExerciseIcon,
  Restaurant as FoodIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { ValidatedTextField, ValidatedSelect, useFormValidation, validateHealthLog } from '../../utils/validation';

const PatientHealthSimple = () => {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState(null);
  const [healthLogs, setHealthLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  // Initial form data
  const initialFormData = {
    date: new Date(),
    vitalSigns: {
      bloodPressure: { systolic: '', diastolic: '' },
      heartRate: '',
      temperature: '',
      weight: '',
      height: ''
    },
    mood: '',
    energyLevel: '',
    sleep: {
      duration: '',
      quality: ''
    },
    exercise: {
      duration: '',
      intensity: ''
    },
    nutrition: {
      waterIntake: '',
      supplements: '',
      meals: ''
    },
    medications: '',
    notes: ''
  };

  // Use form validation hook
  const {
    formData,
    fieldErrors,
    isValid,
    handleChange,
    handleBlur,
    resetForm,
    setFormData,
    updateFormData
  } = useFormValidation(initialFormData, validateHealthLog, {
    validateOnChange: true,
    validateOnBlur: true,
    clearErrorsOnChange: true
  });

  useEffect(() => {
    fetchHealthData();
    fetchHealthLogs();
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/health-tracker/summary');
      setHealthData(response.data.data);
    } catch (err) {
      setError('Failed to load health data');
      console.error('Health data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthLogs = async () => {
    try {
      const response = await api.get('/health-tracker/logs');
      setHealthLogs(response.data.data);
    } catch (err) {
      setError('Failed to load health logs');
      console.error('Health logs error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isValid) {
      setError('Please fix all validation errors before submitting');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const logData = {
        date: formData.date,
        vitalSigns: {
          bloodPressure: {
            systolic: parseInt(formData.vitalSigns.bloodPressure.systolic),
            diastolic: parseInt(formData.vitalSigns.bloodPressure.diastolic)
          },
          heartRate: parseInt(formData.vitalSigns.heartRate),
          temperature: parseFloat(formData.vitalSigns.temperature),
          weight: parseFloat(formData.vitalSigns.weight),
          height: parseFloat(formData.vitalSigns.height)
        },
        mood: formData.mood,
        energyLevel: formData.energyLevel,
        sleep: {
          duration: parseFloat(formData.sleep.duration),
          quality: formData.sleep.quality
        },
        exercise: {
          duration: parseInt(formData.exercise.duration),
          intensity: formData.exercise.intensity
        },
        nutrition: {
          waterIntake: parseInt(formData.nutrition.waterIntake),
          supplements: formData.nutrition.supplements,
          meals: formData.nutrition.meals
        },
        medications: formData.medications,
        notes: formData.notes
      };

      if (editingLog) {
        await api.put(`/health-tracker/logs/${editingLog._id}`, logData);
      } else {
        await api.post('/health-tracker/logs', logData);
      }

      fetchHealthLogs();
      fetchHealthData();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save health log');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    const editData = {
      date: new Date(log.date),
      vitalSigns: log.vitalSigns || initialFormData.vitalSigns,
      mood: log.mood || '',
      energyLevel: log.energyLevel || '',
      sleep: log.sleep || initialFormData.sleep,
      exercise: log.exercise || initialFormData.exercise,
      nutrition: log.nutrition || initialFormData.nutrition,
      medications: log.medications || '',
      notes: log.notes || ''
    };
    setFormData(editData);
    setOpenDialog(true);
  };

  const handleAddNew = () => {
    setEditingLog(null);
    resetForm();
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEditingLog(null);
    setError(null);
  };

  const handleDelete = async (logId) => {
    try {
      await api.delete(`/health-tracker/logs/${logId}`);
      fetchHealthLogs();
      fetchHealthData();
    } catch (err) {
      setError('Failed to delete health log');
      console.error('Delete error:', err);
    }
  };

  // Custom handler for numeric fields
  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleChange(e);
    }
  };

  if (loading && !healthData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Health Tracker
      </Typography>

      {/* Health Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <HeartIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Blood Pressure</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {healthData?.avgBloodPressure ? `${Math.round(healthData.avgBloodPressure)}` : '--'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average mmHg
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <HealthIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Heart Rate</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {healthData?.avgHeartRate ? `${Math.round(healthData.avgHeartRate)}` : '--'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average bpm
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SunIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Energy Level</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {healthData?.avgEnergyLevel ? `${Math.round(healthData.avgEnergyLevel)}` : '--'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average level
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1 }}>
                <MoonIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Sleep</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {healthData?.avgSleepDuration ? `${Math.round(healthData.avgSleepDuration)}h` : '--'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average duration
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Health Logs */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Recent Health Logs</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
            >
              Add New Log
            </Button>
          </Box>

          {healthLogs.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No health logs yet
              </Typography>
              <Button variant="outlined" onClick={handleAddNew}>
                Add Your First Log
              </Button>
            </Box>
          ) : (
            <List>
              {healthLogs.slice(0, 5).map((log) => (
                <ListItem key={log._id} divider>
                  <ListItemText
                    primary={new Date(log.date).toLocaleDateString()}
                    secondary={
                      <Box>
                        <Chip
                          label={`BP: ${log.vitalSigns?.bloodPressure?.systolic || '--'}/${log.vitalSigns?.bloodPressure?.diastolic || '--'}`}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                        <Chip
                          label={`HR: ${log.vitalSigns?.heartRate || '--'} bpm`}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                        <Chip
                          label={`Energy: ${log.energyLevel || '--'}`}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => handleEdit(log)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(log._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Health Log Dialog */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {editingLog ? 'Edit Health Log' : 'Add New Health Log'}
            </Typography>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid size={12}>
                <Typography variant="h6" gutterBottom>
                  📅 Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid size={12}>
                <DatePicker
                  label="Date *"
                  value={formData.date}
                  onChange={(newValue) => updateFormData({ date: newValue })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!fieldErrors.date,
                      helperText: fieldErrors.date || 'Select the date for this health log'
                    }
                  }}
                />
              </Grid>

              {/* Vital Signs */}
              <Grid size={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  ❤️ Vital Signs
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Blood Pressure (mmHg)
                </Typography>
                <Box display="flex" gap={1}>
                  <ValidatedTextField
                    fullWidth
                    label="Systolic *"
                    type="number"
                    name="vitalSigns.bloodPressure.systolic"
                    value={formData.vitalSigns.bloodPressure.systolic}
                    onChange={handleNumericChange}
                    onBlur={handleBlur}
                    error={fieldErrors['vitalSigns.bloodPressure.systolic']}
                    helperText="50-250"
                    inputProps={{ min: 50, max: 250, step: 1 }}
                  />
                  <ValidatedTextField
                    fullWidth
                    label="Diastolic *"
                    type="number"
                    name="vitalSigns.bloodPressure.diastolic"
                    value={formData.vitalSigns.bloodPressure.diastolic}
                    onChange={handleNumericChange}
                    onBlur={handleBlur}
                    error={fieldErrors['vitalSigns.bloodPressure.diastolic']}
                    helperText="30-150"
                    inputProps={{ min: 30, max: 150, step: 1 }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedTextField
                  fullWidth
                  label="Heart Rate (bpm) *"
                  type="number"
                  name="vitalSigns.heartRate"
                  value={formData.vitalSigns.heartRate}
                  onChange={handleNumericChange}
                  onBlur={handleBlur}
                  error={fieldErrors['vitalSigns.heartRate']}
                  helperText="40-200"
                  inputProps={{ min: 40, max: 200 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedTextField
                  fullWidth
                  label="Temperature (°C) *"
                  type="number"
                  name="vitalSigns.temperature"
                  value={formData.vitalSigns.temperature}
                  onChange={handleNumericChange}
                  onBlur={handleBlur}
                  error={fieldErrors['vitalSigns.temperature']}
                  helperText="25-45"
                  inputProps={{ min: 25, max: 45, step: 0.1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedTextField
                  fullWidth
                  label="Weight (kg) *"
                  type="number"
                  name="vitalSigns.weight"
                  value={formData.vitalSigns.weight}
                  onChange={handleNumericChange}
                  onBlur={handleBlur}
                  error={fieldErrors['vitalSigns.weight']}
                  helperText="20-300"
                  inputProps={{ min: 20, max: 300, step: 0.1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedTextField
                  fullWidth
                  label="Height (cm) *"
                  type="number"
                  name="vitalSigns.height"
                  value={formData.vitalSigns.height}
                  onChange={handleNumericChange}
                  onBlur={handleBlur}
                  error={fieldErrors['vitalSigns.height']}
                  helperText="50-250"
                  inputProps={{ min: 50, max: 250, step: 0.1 }}
                />
              </Grid>

              {/* Wellness */}
              <Grid size={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  😊 Wellness
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedSelect
                  fullWidth
                  label="Mood *"
                  name="mood"
                  value={formData.mood}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={fieldErrors.mood}
                  helperText="How are you feeling?"
                >
                  <MenuItem value="excellent">😊 Excellent</MenuItem>
                  <MenuItem value="good">😌 Good</MenuItem>
                  <MenuItem value="fair">😐 Fair</MenuItem>
                  <MenuItem value="poor">😔 Poor</MenuItem>
                  <MenuItem value="terrible">😢 Terrible</MenuItem>
                </ValidatedSelect>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedSelect
                  fullWidth
                  label="Energy Level *"
                  name="energyLevel"
                  value={formData.energyLevel}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={fieldErrors.energyLevel}
                  helperText="Select your energy level"
                >
                  <MenuItem value="high">⚡ High</MenuItem>
                  <MenuItem value="medium">🔋 Medium</MenuItem>
                  <MenuItem value="low">🔋 Low</MenuItem>
                  <MenuItem value="very-low">🔋 Very Low</MenuItem>
                </ValidatedSelect>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedTextField
                  fullWidth
                  label="Sleep Duration (hours) *"
                  type="number"
                  name="sleep.duration"
                  value={formData.sleep.duration}
                  onChange={handleNumericChange}
                  onBlur={handleBlur}
                  error={fieldErrors['sleep.duration']}
                  helperText="0-24 hours"
                  inputProps={{ min: 0, max: 24, step: 0.5 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedSelect
                  fullWidth
                  label="Sleep Quality *"
                  name="sleep.quality"
                  value={formData.sleep.quality}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={fieldErrors['sleep.quality']}
                  helperText="Rate your sleep quality"
                >
                  <MenuItem value="excellent">😴 Excellent</MenuItem>
                  <MenuItem value="good">😌 Good</MenuItem>
                  <MenuItem value="fair">😐 Fair</MenuItem>
                  <MenuItem value="poor">😔 Poor</MenuItem>
                  <MenuItem value="terrible">😢 Terrible</MenuItem>
                </ValidatedSelect>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedTextField
                  fullWidth
                  label="Exercise Duration (minutes) *"
                  type="number"
                  name="exercise.duration"
                  value={formData.exercise.duration}
                  onChange={handleNumericChange}
                  onBlur={handleBlur}
                  error={fieldErrors['exercise.duration']}
                  helperText="0-300 minutes"
                  inputProps={{ min: 0, max: 300 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedSelect
                  fullWidth
                  label="Exercise Intensity *"
                  name="exercise.intensity"
                  value={formData.exercise.intensity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={fieldErrors['exercise.intensity']}
                  helperText="How intense was your workout?"
                >
                  <MenuItem value="low">🟢 Low</MenuItem>
                  <MenuItem value="moderate">🟡 Moderate</MenuItem>
                  <MenuItem value="high">🔴 High</MenuItem>
                </ValidatedSelect>
              </Grid>

              {/* Nutrition */}
              <Grid size={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  🥗 Nutrition
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedTextField
                  fullWidth
                  label="Water Intake (oz) *"
                  type="number"
                  name="nutrition.waterIntake"
                  value={formData.nutrition.waterIntake}
                  onChange={handleNumericChange}
                  onBlur={handleBlur}
                  error={fieldErrors['nutrition.waterIntake']}
                  helperText="0-300 oz"
                  inputProps={{ min: 0, max: 300 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <ValidatedTextField
                  fullWidth
                  label="Supplements"
                  name="nutrition.supplements"
                  value={formData.nutrition.supplements}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={fieldErrors['nutrition.supplements']}
                  helperText="Optional - max 200 chars"
                  multiline
                  rows={2}
                  inputProps={{ maxLength: 200 }}
                />
              </Grid>

              <Grid size={12}>
                <ValidatedTextField
                  fullWidth
                  label="Meals Description"
                  name="nutrition.meals"
                  value={formData.nutrition.meals}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={fieldErrors['nutrition.meals']}
                  helperText="Optional - describe your meals today"
                  multiline
                  rows={3}
                  inputProps={{ maxLength: 500 }}
                />
              </Grid>

              {/* Additional Info */}
              <Grid size={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  📝 Additional Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid size={12}>
                <ValidatedTextField
                  fullWidth
                  label="Medications"
                  name="medications"
                  value={formData.medications}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={fieldErrors.medications}
                  helperText="Optional - list any medications taken"
                  multiline
                  rows={2}
                  inputProps={{ maxLength: 300 }}
                />
              </Grid>

              <Grid size={12}>
                <ValidatedTextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={fieldErrors.notes}
                  helperText="Optional - additional health notes"
                  multiline
                  rows={3}
                  inputProps={{ maxLength: 1000 }}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !isValid}
            >
              {loading ? 'Saving...' : (editingLog ? 'Update' : 'Save')} Log
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add health log"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24
        }}
        onClick={handleAddNew}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default PatientHealthSimple;

