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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Fab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Stack,
  Paper,
  Stepper,
  Step,
  StepLabel,
  FormHelperText,
  InputAdornment
} from '@mui/material';
import {
  HealthAndSafety,
  TrendingUp,
  Add,
  MonitorHeart,
  Scale,
  Psychology,
  Edit,
  Delete,
  Timeline,
  CheckCircle,
  Error,
  Warning,
  Close,
  Assessment,
  Download,
  PictureAsPdf,
  TableChart
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ValidatedTextField, ValidatedSelect } from '../../components/Validation';
import useFormValidation from '../../hooks/useFormValidation';
import { validateHealthLog } from '../../utils/validation';

const PatientHealth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState(null);
  const [healthLogs, setHealthLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [reportStartDate, setReportStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
  const [reportEndDate, setReportEndDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Initial form data
  const initialFormData = {
    date: new Date(),
    vitalSigns: {
      bloodPressure: { systolic: '', diastolic: '' },
      heartRate: '',
      temperature: '',
      weight: '',
      height: '',
      bloodSugar: ''
    },
    symptoms: [],
    mood: '',
    energyLevel: '',
    sleep: {
      duration: '',
      quality: ''
    },
    exercise: {
      type: '',
      duration: '',
      intensity: ''
    },
    nutrition: {
      meals: '',
      waterIntake: '',
      supplements: ''
    },
    medications: '',
    notes: '',
    tags: []
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
    validateOnChange: false,
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
      console.log('Health data response:', response.data);
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
      setHealthLogs(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      console.error('Health logs error:', err);
      setHealthLogs([]); // Ensure it's always an array
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!isValid) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    try {
      setLoading(true);
      if (editingLog) {
        await api.put(`/health-tracker/logs/${editingLog._id}`, formData);
      } else {
        await api.post('/health-tracker/logs', formData);
      }
      setOpenDialog(false);
      setEditingLog(null);
      resetForm();
      fetchHealthLogs();
      fetchHealthData();
      setError(null);
    } catch (err) {
      setError('Failed to save health log');
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    const editData = {
      date: new Date(log.date),
      vitalSigns: log.vitalSigns || initialFormData.vitalSigns,
      symptoms: log.symptoms || [],
      mood: log.mood || '',
      energyLevel: log.energyLevel || '',
      sleep: log.sleep || initialFormData.sleep,
      exercise: log.exercise || initialFormData.exercise,
      nutrition: log.nutrition || initialFormData.nutrition,
      medications: log.medications || '',
      notes: log.notes || '',
      tags: log.tags || []
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

  // Custom handler for numeric fields to prevent non-numeric input
  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    // Allow numbers, decimal point, and empty string
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleChange(e);
    }
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

  // Report generation functions
  const generateReportData = () => {
    if (!Array.isArray(healthLogs) || !healthLogs.length) return null;

    const filteredLogs = healthLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= reportStartDate && logDate <= reportEndDate;
    });

    if (filteredLogs.length === 0) return null;

    // Calculate statistics
    const weights = filteredLogs.map(log => log.vitalSigns?.weight).filter(w => w && !isNaN(w));
    const heartRates = filteredLogs.map(log => log.vitalSigns?.heartRate).filter(h => h && !isNaN(h));
    const temperatures = filteredLogs.map(log => log.vitalSigns?.temperature).filter(t => t && !isNaN(t));
    const moods = filteredLogs.map(log => log.mood).filter(m => m);
    const energyLevels = filteredLogs.map(log => log.energyLevel).filter(e => e);
    const sleepDurations = filteredLogs.map(log => log.sleep?.duration).filter(s => s && !isNaN(s));

    const moodValues = { excellent: 5, good: 4, fair: 3, poor: 2, terrible: 1 };
    const energyValues = { high: 4, medium: 3, low: 2, 'very-low': 1 };

    const avgMood = moods.length > 0 ? 
      (moods.reduce((sum, mood) => sum + (moodValues[mood] || 0), 0) / moods.length).toFixed(1) : 0;
    
    const avgEnergy = energyLevels.length > 0 ? 
      (energyLevels.reduce((sum, energy) => sum + (energyValues[energy] || 0), 0) / energyLevels.length).toFixed(1) : 0;

    return {
      period: {
        start: reportStartDate.toLocaleDateString(),
        end: reportEndDate.toLocaleDateString(),
        days: Math.ceil((reportEndDate - reportStartDate) / (1000 * 60 * 60 * 24)) + 1
      },
      summary: {
        totalLogs: filteredLogs.length,
        avgWeight: weights.length > 0 ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : 'N/A',
        minWeight: weights.length > 0 ? Math.min(...weights).toFixed(1) : 'N/A',
        maxWeight: weights.length > 0 ? Math.max(...weights).toFixed(1) : 'N/A',
        avgHeartRate: heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : 'N/A',
        avgTemperature: temperatures.length > 0 ? (temperatures.reduce((a, b) => a + b, 0) / temperatures.length).toFixed(1) : 'N/A',
        avgMood: avgMood,
        avgEnergy: avgEnergy,
        avgSleepDuration: sleepDurations.length > 0 ? (sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length).toFixed(1) : 'N/A'
      },
      logs: filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  };

  const handleGenerateReport = () => {
    const data = generateReportData();
    setReportData(data);
  };

  const downloadPDF = () => {
    if (!reportData) return;

    // Create a simple text-based report for now
    const reportText = `
HEALTH REPORT
=============

Period: ${reportData.period.start} to ${reportData.period.end}
Total Days: ${reportData.period.days}
Total Logs: ${reportData.summary.totalLogs}

SUMMARY STATISTICS
==================
Average Weight: ${reportData.summary.avgWeight} kg
Weight Range: ${reportData.summary.minWeight} - ${reportData.summary.maxWeight} kg
Average Heart Rate: ${reportData.summary.avgHeartRate} bpm
Average Temperature: ${reportData.summary.avgTemperature}°C
Average Mood: ${reportData.summary.avgMood}/5
Average Energy: ${reportData.summary.avgEnergy}/4
Average Sleep: ${reportData.summary.avgSleepDuration} hours

RECENT LOGS
===========
${reportData.logs.slice(0, 10).map(log => `
Date: ${new Date(log.date).toLocaleDateString()}
Weight: ${log.vitalSigns?.weight || 'N/A'} kg
Heart Rate: ${log.vitalSigns?.heartRate || 'N/A'} bpm
Temperature: ${log.vitalSigns?.temperature || 'N/A'}°C
Mood: ${log.mood || 'N/A'}
Energy: ${log.energyLevel || 'N/A'}
Sleep: ${log.sleep?.duration || 'N/A'} hours
Notes: ${log.notes || 'None'}
---`).join('')}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-report-${reportData.period.start}-to-${reportData.period.end}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (!reportData) return;

    const headers = ['Date', 'Weight (kg)', 'Heart Rate (bpm)', 'Temperature (°C)', 'Mood', 'Energy Level', 'Sleep Duration (hrs)', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...reportData.logs.map(log => [
        new Date(log.date).toLocaleDateString(),
        log.vitalSigns?.weight || '',
        log.vitalSigns?.heartRate || '',
        log.vitalSigns?.temperature || '',
        log.mood || '',
        log.energyLevel || '',
        log.sleep?.duration || '',
        (log.notes || '').replace(/,/g, ';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-data-${reportData.period.start}-to-${reportData.period.end}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Simplified form - no steps needed

  const getMoodColor = (mood) => {
    switch (mood) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'fair': return '#FFC107';
      case 'poor': return '#FF9800';
      case 'terrible': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getEnergyColor = (level) => {
    switch (level) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'low': return '#FF9800';
      case 'very-low': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  // Generate chart data from health logs
  const generateChartData = () => {
    if (!Array.isArray(healthLogs) || !healthLogs.length) return [];
    
    return healthLogs.slice(-30).map(log => ({
      date: new Date(log.date).toLocaleDateString(),
      weight: log.vitalSigns?.weight || 0,
      heartRate: log.vitalSigns?.heartRate || 0,
      temperature: log.vitalSigns?.temperature || 0,
      energyLevel: log.energyLevel === 'high' ? 4 : log.energyLevel === 'medium' ? 3 : log.energyLevel === 'low' ? 2 : 1,
      mood: log.mood === 'excellent' ? 5 : log.mood === 'good' ? 4 : log.mood === 'fair' ? 3 : log.mood === 'poor' ? 2 : 1
    }));
  };

  const chartData = generateChartData();

  if (loading) {
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

  const dashboard = healthData?.dashboard || {};
  const recentLogs = Array.isArray(healthLogs) ? healthLogs.slice(0, 5) : [];
  
  // Debug logging
  console.log('Dashboard data:', dashboard);
  console.log('Health logs:', healthLogs);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
            Health Tracker 💊
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Monitor your health metrics and track your wellness journey
          </Typography>
        </Box>
      </Fade>

        {/* Health Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Zoom in timeout={1000}>
              <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <MonitorHeart sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {dashboard.currentStreak || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Day Streak
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Zoom in timeout={1200}>
              <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Scale sx={{ fontSize: 40, color: 'info.main', mb: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {dashboard.currentWeight || '--'} kg
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Weight
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Zoom in timeout={1400}>
              <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Psychology sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {dashboard.avgMood || '--'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Mood
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Zoom in timeout={1600}>
              <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {dashboard.avgEnergy || '--'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Energy
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        {/* Health Trends Chart */}
        <Card sx={{ borderRadius: '20px', overflow: 'hidden', mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Health Trends (Last 30 Days)
            </Typography>
            {chartData.length > 0 ? (
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis stroke="#666" />
                    <RechartsTooltip 
                      contentStyle={{ 
                        borderRadius: '10px',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#4CAF50" 
                      fill="#4CAF50" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="heartRate" 
                      stroke="#2196F3" 
                      fill="#2196F3" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="energyLevel" 
                      stroke="#FF9800" 
                      fill="#FF9800" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            ) : (
      <Box sx={{ textAlign: 'center', py: 8 }}>
                <Timeline sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No health data yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start logging your health metrics to see trends
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Health Report Generation */}
        <Card sx={{ borderRadius: '20px', overflow: 'hidden', mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Assessment sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Generate Health Report
              </Typography>
            </Box>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Create a comprehensive health report for any date range to track your progress and share with healthcare providers.
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Start Date"
                  value={reportStartDate}
                  onChange={(newValue) => setReportStartDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: 'Select the start date for your report'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="End Date"
                  value={reportEndDate}
                  onChange={(newValue) => setReportEndDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: 'Select the end date for your report'
                    }
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<Assessment />}
                onClick={handleGenerateReport}
                disabled={generatingReport}
                sx={{ borderRadius: '15px' }}
              >
                {generatingReport ? 'Generating...' : 'Generate Report'}
              </Button>
              
              {reportData && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<PictureAsPdf />}
                    onClick={downloadPDF}
                    sx={{ borderRadius: '15px' }}
                  >
                    Download PDF
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<TableChart />}
                    onClick={downloadCSV}
                    sx={{ borderRadius: '15px' }}
                  >
                    Download CSV
                  </Button>
                </>
              )}
            </Box>

            {/* Report Preview */}
            {reportData && (
              <Box sx={{ mt: 3, p: 3, bgcolor: 'grey.50', borderRadius: '15px' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  📊 Report Preview
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Period Summary
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Period:</strong> {reportData.period.start} to {reportData.period.end}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Total Days:</strong> {reportData.period.days}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Total Logs:</strong> {reportData.summary.totalLogs}
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Health Metrics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Avg Weight:</strong> {reportData.summary.avgWeight} kg
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Weight Range:</strong> {reportData.summary.minWeight} - {reportData.summary.maxWeight} kg
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Avg Heart Rate:</strong> {reportData.summary.avgHeartRate} bpm
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Avg Temperature:</strong> {reportData.summary.avgTemperature}°C
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Avg Mood:</strong> {reportData.summary.avgMood}/5
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Avg Energy:</strong> {reportData.summary.avgEnergy}/4
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Avg Sleep:</strong> {reportData.summary.avgSleepDuration} hours
                    </Typography>
                  </Grid>
                </Grid>

                {reportData.logs.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Recent Entries ({Math.min(5, reportData.logs.length)} of {reportData.logs.length})
                    </Typography>
                    <List dense>
                      {reportData.logs.slice(0, 5).map((log, index) => (
                        <ListItem key={log._id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <HealthAndSafety sx={{ color: getMoodColor(log.mood) }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={new Date(log.date).toLocaleDateString()}
                            secondary={
                              <Box>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {log.vitalSigns?.weight && (
                                    <Chip 
                                      icon={<Scale />} 
                                      label={`${log.vitalSigns.weight}kg`} 
                                      size="small" 
                                      variant="outlined"
                                    />
                                  )}
                                  {log.vitalSigns?.heartRate && (
                                    <Chip 
                                      icon={<MonitorHeart />} 
                                      label={`${log.vitalSigns.heartRate}bpm`} 
                                      size="small" 
                                      variant="outlined"
                                    />
                                  )}
                                  {log.mood && (
                                    <Chip 
                                      label={log.mood} 
                                      size="small" 
                                      sx={{ 
                                        backgroundColor: getMoodColor(log.mood),
                                        color: 'white'
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}

            {reportData === null && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Assessment sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No data available for selected period
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try selecting a different date range or add some health logs first.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Recent Health Logs */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Recent Health Logs
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenDialog(true)}
                    sx={{ borderRadius: '15px' }}
                  >
                    Add Log
                  </Button>
                </Box>
                
                {recentLogs.length > 0 ? (
                  <List>
                    {recentLogs.map((log, index) => (
                      <React.Fragment key={log._id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <HealthAndSafety sx={{ color: getMoodColor(log.mood) }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={new Date(log.date).toLocaleDateString()}
                            secondary={
                              <Box>
                                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                  {log.vitalSigns?.weight && (
                                    <Chip 
                                      icon={<Scale />} 
                                      label={`${log.vitalSigns.weight}kg`} 
                                      size="small" 
                                      variant="outlined"
                                    />
                                  )}
                                  {log.vitalSigns?.heartRate && (
                                    <Chip 
                                      icon={<MonitorHeart />} 
                                      label={`${log.vitalSigns.heartRate}bpm`} 
                                      size="small" 
                                      variant="outlined"
                                    />
                                  )}
                                  {log.mood && (
                                    <Chip 
                                      label={log.mood} 
                                      size="small" 
                                      sx={{ 
                                        backgroundColor: getMoodColor(log.mood),
                                        color: 'white'
                                      }}
                                    />
                                  )}
                                </Box>
                                {log.notes && (
                                  <Typography variant="body2" color="text.secondary">
                                    {log.notes}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <Box>
                            <IconButton onClick={() => handleEdit(log)}>
                              <Edit />
                            </IconButton>
                            <IconButton onClick={() => handleDelete(log._id)} color="error">
                              <Delete />
                            </IconButton>
                          </Box>
                        </ListItem>
                        {index < recentLogs.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <HealthAndSafety sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No health logs yet
        </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Start tracking your health metrics to build a comprehensive health profile.
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddNew}
          sx={{ borderRadius: '15px' }}
        >
                      Add Your First Log
        </Button>
      </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Health Goals
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Weight Goal</Typography>
                      <Typography variant="body2">75%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={75} sx={{ height: 8, borderRadius: 4 }} />
                  </Box>
                  
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Exercise Goal</Typography>
                      <Typography variant="body2">60%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={60} sx={{ height: 8, borderRadius: 4 }} />
                  </Box>
                  
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Sleep Goal</Typography>
                      <Typography variant="body2">80%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={80} sx={{ height: 8, borderRadius: 4 }} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Add/Edit Health Log Dialog */}
        <Dialog open={openDialog} onClose={handleClose} maxWidth="lg" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                {editingLog ? 'Edit Health Log' : 'Add New Health Log'}
              </Typography>
              <IconButton onClick={handleClose} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <form onSubmit={handleSubmit}>
            <DialogContent>
              {/* Error Alert */}
              {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Simplified Single-Page Form */}
              
              {/* Basic Information */}
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                📅 Basic Information
              </Typography>
              <Grid container spacing={3}>
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
              </Grid>

              {/* Vital Signs */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                ❤️ Vital Signs
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Blood Pressure (mmHg)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
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
              </Grid>

              {/* Wellness */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                😊 Wellness
              </Typography>
              <Grid container spacing={3}>
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
              </Grid>

              {/* Nutrition */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                🥗 Nutrition
              </Typography>
              <Grid container spacing={3}>
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
              </Grid>

              {/* Additional Info */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                📝 Additional Information
              </Typography>
              <Grid container spacing={3}>
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
                disabled={!isValid || loading}
                sx={{ borderRadius: '15px' }}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
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
            right: 24,
            background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
            }
          }}
          onClick={handleAddNew}
        >
          <Add />
        </Fab>
    </Container>
    </LocalizationProvider>
  );
};

export default PatientHealth;                   