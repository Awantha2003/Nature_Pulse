import React, { useState, useEffect, useMemo } from 'react';
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
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Tabs,
  Tab,
  Badge
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
  Flag,
  GpsFixed,
  Share,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { ValidatedTextField, ValidatedSelect } from '../../components/Validation';
import { validateHealthLog, validateHealthGoal, isFormValid } from '../../utils/validation';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const HealthTracker = () => {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState(null);
  const [healthLogs, setHealthLogs] = useState([]);
  const [healthGoals, setHealthGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [goalFieldErrors, setGoalFieldErrors] = useState({});
  const [openGoalDialog, setOpenGoalDialog] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Form state for health logs
  const [formData, setFormData] = useState({
    date: new Date(),
    vitalSigns: {
      bloodPressure: { systolic: '', diastolic: '' },
      heartRate: '',
      temperature: '',
      weight: '',
      height: '',
      bloodSugar: ''
    },
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
  });

  // Form state for health goals
  const [goalFormData, setGoalFormData] = useState({
    title: '',
    description: '',
    category: '',
    type: '',
    targetMetric: {
      name: '',
      unit: '',
      targetValue: '',
      currentValue: 0
    },
    timeframe: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    priority: 'medium',
    reminders: {
      enabled: false,
      frequency: 'daily',
      time: '09:00'
    }
  });

  // Validation handlers for health logs
  const handleHealthLogChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parentKey, childKey] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parentKey]: {
          ...prev[parentKey],
          [childKey]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Real-time validation for nested fields
    const updatedFormData = name.includes('.') 
      ? {
          ...formData,
          [name.split('.')[0]]: {
            ...formData[name.split('.')[0]],
            [name.split('.')[1]]: value
          }
        }
      : { ...formData, [name]: value };
    
    // Validate the specific field
    const errors = validateHealthLog(updatedFormData);
    if (errors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: errors[name]
      }));
    } else {
      // Clear error if validation passes
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleHealthLogBlur = (e) => {
    const { name } = e.target;
    const errors = validateHealthLog(formData);
    if (errors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: errors[name] }));
    }
  };

  // Validation handlers for health goals
  const handleGoalChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parentKey, childKey] = name.split('.');
      setGoalFormData(prev => ({
        ...prev,
        [parentKey]: {
          ...prev[parentKey],
          [childKey]: value,
        },
      }));
    } else {
      setGoalFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear field error when user starts typing
    if (goalFieldErrors[name]) {
      setGoalFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleGoalBlur = (e) => {
    const { name } = e.target;
    const errors = validateHealthGoal(goalFormData);
    if (errors[name]) {
      setGoalFieldErrors(prev => ({ ...prev, [name]: errors[name] }));
    }
  };

  // Real-time validation - only validate specific fields on change
  useEffect(() => {
    // Only validate if there are changes to specific fields
    const errors = validateHealthLog(formData);
    setFieldErrors(errors);
  }, [formData]);

  // Reset form when dialog opens for new entry
  useEffect(() => {
    if (openDialog && !editingLog) {
      resetForm();
    }
  }, [openDialog, editingLog]);

  useEffect(() => {
    const errors = validateHealthGoal(goalFormData);
    setGoalFieldErrors(errors);
  }, [goalFormData]);

  useEffect(() => {
    console.log('HealthTracker mounted, user:', user);
    console.log('Token in localStorage:', localStorage.getItem('token'));
    console.log('HealthTracker version: 3.0 - Enhanced with all CRUD operations + Validation');
    console.log('Form fields available:', Object.keys(formData));
    console.log('Cache busting timestamp:', new Date().toISOString());
    fetchHealthData();
    fetchHealthLogs();
    fetchHealthGoals();
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      console.log('Fetching health data...');
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
      console.log('Fetching health logs...');
      const response = await api.get('/health-tracker/logs');
      console.log('Health logs response:', response.data);
      setHealthLogs(Array.isArray(response.data.data.healthLogs) ? response.data.data.healthLogs : []);
    } catch (err) {
      console.error('Health logs error:', err);
      setHealthLogs([]);
    }
  };

  const fetchHealthGoals = async () => {
    try {
      const response = await api.get('/health-goals');
      setHealthGoals(response.data.data.healthGoals || []);
    } catch (err) {
      console.error('Health goals error:', err);
      setHealthGoals([]);
    }
  };

  // Helper functions to convert string values to numbers for backend
  const convertMoodToNumber = (moodString) => {
    const moodMap = {
      'excellent': 10,
      'good': 7,
      'fair': 5,
      'poor': 3,
      'terrible': 1
    };
    return moodMap[moodString] || 5;
  };

  const convertEnergyToNumber = (energyString) => {
    const energyMap = {
      'high': 8,
      'medium': 5,
      'low': 3,
      'very-low': 1
    };
    return energyMap[energyString] || 5;
  };

  // Helper functions to convert numbers back to strings for frontend display
  const convertNumberToMood = (moodNumber) => {
    if (moodNumber >= 9) return 'excellent';
    if (moodNumber >= 7) return 'good';
    if (moodNumber >= 5) return 'fair';
    if (moodNumber >= 3) return 'poor';
    return 'terrible';
  };

  const convertNumberToEnergy = (energyNumber) => {
    if (energyNumber >= 7) return 'high';
    if (energyNumber >= 5) return 'medium';
    if (energyNumber >= 3) return 'low';
    return 'very-low';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setValidationErrors({});
    
    // Validate form before submission
    if (!validateForm()) {
      setValidationErrors(fieldErrors);
      setError('Please fix the validation errors before submitting.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      console.log('Submitting health log:', formData);
      
      // Transform form data to match backend model structure
      const transformedData = {
        date: formData.date,
        mood: formData.mood ? convertMoodToNumber(formData.mood) : undefined,
        energyLevel: formData.energyLevel ? convertEnergyToNumber(formData.energyLevel) : undefined,
        vitalSigns: {
          bloodPressure: {
            systolic: formData.vitalSigns.bloodPressure.systolic ? parseInt(formData.vitalSigns.bloodPressure.systolic) : undefined,
            diastolic: formData.vitalSigns.bloodPressure.diastolic ? parseInt(formData.vitalSigns.bloodPressure.diastolic) : undefined
          },
          heartRate: formData.vitalSigns.heartRate ? parseInt(formData.vitalSigns.heartRate) : undefined,
          temperature: formData.vitalSigns.temperature ? parseFloat(formData.vitalSigns.temperature) : undefined,
          weight: formData.vitalSigns.weight ? parseFloat(formData.vitalSigns.weight) : undefined,
          height: formData.vitalSigns.height ? parseFloat(formData.vitalSigns.height) : undefined
        },
        sleep: {
          duration: formData.sleep.duration ? parseFloat(formData.sleep.duration) : undefined,
          quality: formData.sleep.quality ? convertMoodToNumber(formData.sleep.quality) : undefined
        },
        exercise: {
          type: formData.exercise.type || undefined,
          duration: formData.exercise.duration ? parseFloat(formData.exercise.duration) : undefined,
          intensity: formData.exercise.intensity || undefined
        },
        nutrition: {
          waterIntake: formData.nutrition.waterIntake ? parseFloat(formData.nutrition.waterIntake) : undefined,
          meals: formData.nutrition.meals ? [{
            type: 'breakfast',
            description: formData.nutrition.meals,
            time: new Date().toISOString()
          }] : undefined,
          supplements: formData.nutrition.supplements ? formData.nutrition.supplements.split(',').map(s => s.trim()).filter(s => s).map(supplement => ({
            name: supplement,
            time: new Date().toISOString()
          })) : undefined
        },
        medications: formData.medications && typeof formData.medications === 'string' ? formData.medications.split(',').map(m => m.trim()).filter(m => m).map(med => ({
          name: med,
          taken: true
        })) : [],
        notes: formData.notes || undefined
      };
      
      console.log('Transformed data:', transformedData);
      console.log('Vital signs structure (flat values for express-validator):');
      console.log('- heartRate:', transformedData.vitalSigns.heartRate, '(should be number)');
      console.log('- temperature:', transformedData.vitalSigns.temperature, '(should be number)');
      console.log('- weight:', transformedData.vitalSigns.weight, '(should be number)');
      console.log('- height:', transformedData.vitalSigns.height, '(should be number)');
      
      if (editingLog) {
        console.log('Updating existing health log:', editingLog._id);
        const response = await api.put(`/health-tracker/logs/${editingLog._id}`, transformedData);
        console.log('Update response:', response.data);
        setSuccessMessage('Health log updated successfully!');
      } else {
        console.log('Creating new health log');
        const response = await api.post('/health-tracker/logs', transformedData);
        console.log('Create response:', response.data);
        setSuccessMessage('Health log saved successfully!');
      }
      
      // Close dialog and reset form
      setOpenDialog(false);
      setEditingLog(null);
      resetForm();
      setFieldErrors({});
      setValidationErrors([]);
      
      // Refresh data
      console.log('Refreshing data after save...');
      await fetchHealthLogs();
      await fetchHealthData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Save error:', err);
      if (err.response?.data?.message) {
        setError(`Failed to save health log: ${err.response.data.message}`);
      } else if (err.response?.data?.errors) {
        // Handle validation errors from backend
        setValidationErrors(Array.isArray(err.response.data.errors) ? err.response.data.errors : []);
        setError('Please fix the validation errors below.');
      } else {
        setError('Failed to save health log. Please check your input and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await api.put(`/health-goals/${editingGoal._id}`, goalFormData);
      } else {
        await api.post('/health-goals', goalFormData);
      }
      setOpenGoalDialog(false);
      setEditingGoal(null);
      resetGoalForm();
      setFieldErrors({});
      setValidationErrors([]);
      fetchHealthGoals();
      setSuccessMessage('Health goal saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Save goal error:', err);
      if (err.response?.data?.message) {
        setError(`Failed to save health goal: ${err.response.data.message}`);
      } else if (err.response?.data?.errors) {
        // Handle validation errors from backend
        setValidationErrors(Array.isArray(err.response.data.errors) ? err.response.data.errors : []);
        setError('Please fix the validation errors below.');
      } else {
        setError('Failed to save health goal. Please check your input and try again.');
      }
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    
    // Transform tags from string back to array if needed
    const tags = Array.isArray(log.tags) ? log.tags : 
                (typeof log.tags === 'string' ? log.tags.split(',').map(t => t.trim()).filter(t => t) : []);
    
    // Transform medications from string back to string (it's stored as string in frontend)
    const medications = typeof log.medications === 'string' ? log.medications : 
                       (Array.isArray(log.medications) ? log.medications.map(med => med.name).join(', ') : '');
    
    setFormData({
      date: new Date(log.date),
      vitalSigns: {
        bloodPressure: {
          systolic: log.vitalSigns?.bloodPressure?.systolic || '',
          diastolic: log.vitalSigns?.bloodPressure?.diastolic || ''
        },
        heartRate: log.vitalSigns?.heartRate?.value || log.vitalSigns?.heartRate || '',
        temperature: log.vitalSigns?.temperature?.value || log.vitalSigns?.temperature || '',
        weight: log.vitalSigns?.weight?.value || log.vitalSigns?.weight || '',
        height: log.vitalSigns?.height?.value || log.vitalSigns?.height || '',
        bloodSugar: log.vitalSigns?.bloodSugar?.value || log.vitalSigns?.bloodSugar || ''
      },
      mood: log.mood ? convertNumberToMood(log.mood) : '',
      energyLevel: log.energyLevel ? convertNumberToEnergy(log.energyLevel) : '',
      sleep: {
        duration: log.sleep?.duration || '',
        quality: log.sleep?.quality ? convertNumberToMood(log.sleep.quality) : ''
      },
      exercise: {
        type: log.exercise?.type || '',
        duration: log.exercise?.duration || '',
        intensity: log.exercise?.intensity || ''
      },
      nutrition: {
        meals: log.nutrition?.meals?.[0]?.description || '',
        waterIntake: log.nutrition?.waterIntake || '',
        supplements: log.nutrition?.supplements?.map(s => s.name).join(', ') || ''
      },
      medications: medications,
      notes: log.notes || '',
      tags: tags
    });
    setOpenDialog(true);
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalFormData({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      type: goal.type,
      targetMetric: goal.targetMetric,
      timeframe: goal.timeframe,
      priority: goal.priority,
      reminders: goal.reminders
    });
    setOpenGoalDialog(true);
  };

  const handleDelete = async (logId) => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete this health log? This action cannot be undone.')) {
      setIsDeleting(logId);
      setError(null);
      
      try {
        console.log('Deleting health log:', logId);
        await api.delete(`/health-tracker/logs/${logId}`);
        console.log('Health log deleted successfully');
        setSuccessMessage('Health log deleted successfully!');
        
        // Refresh data
        await fetchHealthLogs();
        await fetchHealthData();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error('Delete error:', err);
        if (err.response?.data?.message) {
          setError(`Failed to delete health log: ${err.response.data.message}`);
        } else {
          setError('Failed to delete health log. Please try again.');
        }
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await api.delete(`/health-goals/${goalId}`);
      fetchHealthGoals();
    } catch (err) {
      setError('Failed to delete health goal');
      console.error('Delete goal error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date(),
      vitalSigns: {
        bloodPressure: { systolic: '', diastolic: '' },
        heartRate: '',
        temperature: '',
        weight: '',
        height: '',
        bloodSugar: ''
      },
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
    });
    setFieldErrors({});
    setValidationErrors({});
  };

  // Sample data function removed
  const fillSampleData = () => {
    console.log('Filling sample data...');
    
    // Create a simple, guaranteed-to-work sample data
    const simpleSampleData = {
      date: new Date(),
      vitalSigns: {
        bloodPressure: { systolic: '120', diastolic: '80' },
        heartRate: '72',
        temperature: '98.6',
        weight: '150',
        height: '70',
        bloodSugar: '95'
      },
      mood: 'good',
      energyLevel: 'medium',
      sleep: {
        duration: '7.5',
        quality: 'good'
      },
      exercise: {
        type: 'cardio',
        duration: '30',
        intensity: 'moderate'
      },
      nutrition: {
        meals: 'Healthy breakfast with oatmeal and berries',
        waterIntake: '64',
        supplements: 'Vitamin D, Omega-3'
      },
      medications: 'Vitamin D',
      notes: 'Feeling good today',
      tags: ['healthy', 'active']
    };
    
    console.log('Setting simple sample data:', simpleSampleData);
    setFormData(simpleSampleData);
    setFieldErrors({});
    setValidationErrors({});
    setError('');
    console.log('Simple sample data set successfully');
    return;
    
    const sampleDataOptions = [
      {
        date: new Date(),
        vitalSigns: {
          bloodPressure: { systolic: '120', diastolic: '80' },
          heartRate: '72',
          temperature: '98.6',
          weight: '154', // 70kg = 154lbs
          height: '69', // 175cm = 69 inches
          bloodSugar: '95'
        },
        mood: 'good',
        energyLevel: 'medium',
        sleep: {
          duration: '7.5',
          quality: 'good'
        },
        exercise: {
          type: 'cardio',
          duration: '30',
          intensity: 'moderate'
        },
        nutrition: {
          meals: 'Breakfast: Oatmeal with berries, Lunch: Grilled chicken salad, Dinner: Salmon with vegetables',
          waterIntake: '64',
          supplements: 'Vitamin D, Omega-3, Multivitamin'
        },
        medications: 'Vitamin D, Omega-3',
        notes: 'Feeling good today, had a great workout and ate healthy meals',
        tags: ['healthy', 'active', 'wellness']
      },
      {
        date: new Date(),
        vitalSigns: {
          bloodPressure: { systolic: '115', diastolic: '75' },
          heartRate: '68',
          temperature: '98.4',
          weight: '150', // 68kg = 150lbs
          height: '67', // 170cm = 67 inches
          bloodSugar: '88'
        },
        mood: 'excellent',
        energyLevel: 'high',
        sleep: {
          duration: '8.0',
          quality: 'excellent'
        },
        exercise: {
          type: 'strength',
          duration: '45',
          intensity: 'high'
        },
        nutrition: {
          meals: 'Breakfast: Greek yogurt with granola, Lunch: Quinoa bowl with vegetables, Dinner: Lean beef with sweet potato',
          waterIntake: '72',
          supplements: 'Protein powder, Creatine, B-complex'
        },
        medications: 'Protein powder, Creatine',
        notes: 'Excellent day! Hit new personal records in the gym and felt very energetic',
        tags: ['gym', 'strength', 'energetic']
      },
      {
        date: new Date(),
        vitalSigns: {
          bloodPressure: { systolic: '125', diastolic: '82' },
          heartRate: '75',
          temperature: '98.8',
          weight: '159', // 72kg = 159lbs
          height: '71', // 180cm = 71 inches
          bloodSugar: '102'
        },
        mood: 'fair',
        energyLevel: 'low',
        sleep: {
          duration: '6.0',
          quality: 'fair'
        },
        exercise: {
          type: 'yoga',
          duration: '20',
          intensity: 'low'
        },
        nutrition: {
          meals: 'Breakfast: Toast with avocado, Lunch: Soup and salad, Dinner: Pasta with vegetables',
          waterIntake: '48',
          supplements: 'Magnesium, Ashwagandha'
        },
        medications: 'Magnesium, Ashwagandha',
        notes: 'Had a stressful day at work, feeling a bit tired. Yoga helped me relax',
        tags: ['stress', 'relaxation', 'tired']
      }
    ];
    
    // Randomly select one of the sample data options
    const randomIndex = Math.floor(Math.random() * sampleDataOptions.length);
    const sampleData = sampleDataOptions[randomIndex];
    
    console.log('Selected sample data:', sampleData);
    console.log('Sample data structure check:');
    console.log('- mood type:', typeof sampleData.mood, 'value:', sampleData.mood);
    console.log('- energyLevel type:', typeof sampleData.energyLevel, 'value:', sampleData.energyLevel);
    console.log('- sleep.quality type:', typeof sampleData.sleep.quality, 'value:', sampleData.sleep.quality);
    console.log('- tags type:', typeof sampleData.tags, 'value:', sampleData.tags);
    setFormData(sampleData);
    setFieldErrors({});
    setValidationErrors({});
    setError('');
    console.log('Sample data set successfully');
  };

  const resetGoalForm = () => {
    setGoalFormData({
      title: '',
      description: '',
      category: '',
      type: '',
      targetMetric: {
        name: '',
        unit: '',
        targetValue: '',
        currentValue: 0
      },
      timeframe: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      priority: 'medium',
      reminders: {
        enabled: false,
        frequency: 'daily',
        time: '09:00'
      }
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'active': return '#2196F3';
      case 'paused': return '#FF9800';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  // Use centralized validation function
  const validateForm = () => {
    const errors = validateHealthLog(formData);
    setFieldErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log('Form is valid:', isValid);
    return isValid;
  };


  // Generate chart data from health logs
  const chartData = useMemo(() => {
    if (!Array.isArray(healthLogs) || !healthLogs.length) return [];
    
    return healthLogs.slice(-30).map(log => ({
      date: new Date(log.date).toLocaleDateString(),
      weight: log.vitalSigns?.weight || 0,
      heartRate: log.vitalSigns?.heartRate || 0,
      temperature: log.vitalSigns?.temperature || 0,
      bloodPressure: log.vitalSigns?.bloodPressure?.systolic || 0,
      sleep: log.sleep?.duration || 0,
      energyLevel: log.energyLevel === 'high' ? 4 : log.energyLevel === 'medium' ? 3 : log.energyLevel === 'low' ? 2 : 1,
      mood: log.mood === 'excellent' ? 5 : log.mood === 'good' ? 4 : log.mood === 'fair' ? 3 : log.mood === 'poor' ? 2 : 1
    }));
  }, [healthLogs]);
  const activeGoals = healthGoals.filter(goal => goal.status === 'active');
  const completedGoals = healthGoals.filter(goal => goal.status === 'completed');

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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl">
        {/* Success Message */}
        {successMessage && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

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
              Monitor your health metrics, track goals, and view your wellness journey
            </Typography>
          </Box>
        </Fade>

        {/* Tabs for different sections */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab 
              label={
                <Badge badgeContent={recentLogs.length} color="primary">
                  Health Logs
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={activeGoals.length} color="secondary">
                  Health Goals
                </Badge>
              } 
            />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        {/* Health Logs Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Health Overview Cards */}
            <Grid size={{ xs: 12 }}>
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
            </Grid>

            {/* Health Trends Chart */}
            <Grid size={{ xs: 12 }}>
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
                             name="Weight (kg)"
                           />
                           <Area 
                             type="monotone" 
                             dataKey="heartRate" 
                             stroke="#2196F3" 
                             fill="#2196F3" 
                             fillOpacity={0.6}
                             name="Heart Rate (bpm)"
                           />
                           <Area 
                             type="monotone" 
                             dataKey="temperature" 
                             stroke="#F44336" 
                             fill="#F44336" 
                             fillOpacity={0.6}
                             name="Temperature (°F)"
                           />
                           <Area 
                             type="monotone" 
                             dataKey="bloodPressure" 
                             stroke="#9C27B0" 
                             fill="#9C27B0" 
                             fillOpacity={0.6}
                             name="Blood Pressure (mmHg)"
                           />
                           <Area 
                             type="monotone" 
                             dataKey="sleep" 
                             stroke="#FF9800" 
                             fill="#FF9800" 
                             fillOpacity={0.6}
                             name="Sleep (hours)"
                           />
                           <Area 
                             type="monotone" 
                             dataKey="energyLevel" 
                             stroke="#FFC107" 
                             fill="#FFC107" 
                             fillOpacity={0.6}
                             name="Energy Level"
                           />
                           <Area 
                             type="monotone" 
                             dataKey="mood" 
                             stroke="#00BCD4" 
                             fill="#00BCD4" 
                             fillOpacity={0.6}
                             name="Mood"
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
            </Grid>

            {/* Recent Health Logs */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Recent Health Logs
                    </Typography>
                     <Button
                       variant="contained"
                       startIcon={<Add />}
                       onClick={() => {
                         console.log('Opening Add Health Log dialog - Enhanced version with 15+ fields');
                         setError(null);
                         setSuccessMessage(null);
                         resetForm();
                         setOpenDialog(true);
                       }}
                       sx={{ borderRadius: '15px' }}
                     >
                       Add Enhanced Log
                     </Button>
                     <Button
                       variant="outlined"
                       startIcon={<Refresh />}
                       onClick={() => {
                         console.log('Force refresh - clearing cache');
                         window.location.reload();
                       }}
                       sx={{ borderRadius: '15px', ml: 2 }}
                     >
                       Force Refresh
                     </Button>
                  </Box>
                  
                  {recentLogs.length > 0 ? (
                    <List>
                      {recentLogs.map((log, index) => (
                        <React.Fragment key={log._id}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon>
                              <HealthAndSafety sx={{ color: 'primary.main' }} />
                            </ListItemIcon>
                            <ListItemText
                              component="div"
                              primary={new Date(log.date).toLocaleDateString()}
                              secondary={
                                <Box component="div">
                                   <Box component="div" sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
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
                                     {log.vitalSigns?.temperature && (
                                       <Chip 
                                         label={`${log.vitalSigns.temperature}°F`} 
                                         size="small" 
                                         variant="outlined"
                                       />
                                     )}
                                     {log.mood && (
                                       <Chip 
                                         label={log.mood} 
                                         size="small" 
                                         color="primary"
                                       />
                                     )}
                                     {log.energyLevel && (
                                       <Chip 
                                         label={`Energy: ${log.energyLevel}`} 
                                         size="small" 
                                         color="secondary"
                                       />
                                     )}
                                     {log.sleep?.duration && (
                                       <Chip 
                                         label={`Sleep: ${log.sleep.duration}h`} 
                                         size="small" 
                                         variant="outlined"
                                       />
                                     )}
                                   </Box>
                                   {log.medications && (
                                     <Box sx={{ mb: 1 }}>
                                       <Typography variant="body2" color="text.secondary" component="span">
                                         <strong>Medications:</strong> {log.medications}
                                       </Typography>
                                     </Box>
                                   )}
                                  {log.notes && (
                                    <Typography variant="body2" color="text.secondary" component="span">
                                      {log.notes}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                             <Box>
                               <IconButton 
                                 onClick={() => handleEdit(log)}
                                 disabled={isDeleting === log._id}
                               >
                                 <Edit />
                               </IconButton>
                               <IconButton 
                                 onClick={() => handleDelete(log._id)} 
                                 color="error"
                                 disabled={isDeleting === log._id}
                               >
                                 {isDeleting === log._id ? (
                                   <CircularProgress size={20} />
                                 ) : (
                                   <Delete />
                                 )}
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
                        onClick={() => {
             setError(null);
             setSuccessMessage(null);
             resetForm();
             setOpenDialog(true);
           }}
                        sx={{ borderRadius: '15px' }}
                      >
                        Add Your First Log
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Health Goals Tab */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card sx={{ borderRadius: '20px', overflow: 'hidden', mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Health Goals
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setOpenGoalDialog(true)}
                      sx={{ borderRadius: '15px' }}
                    >
                      Add Goal
                    </Button>
                  </Box>

                  {healthGoals.length > 0 ? (
                    <Grid container spacing={3}>
                      {healthGoals.map((goal) => (
                        <Grid size={{ xs: 12, md: 6, xl: 4 }} key={goal._id}>
                          <Card sx={{ borderRadius: '15px', overflow: 'hidden', height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                                  {goal.title}
                                </Typography>
                                <Chip 
                                  label={goal.status} 
                                  size="small" 
                                  sx={{ 
                                    backgroundColor: getStatusColor(goal.status),
                                    color: 'white',
                                    textTransform: 'capitalize'
                                  }}
                                />
                              </Box>

                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {goal.description}
                              </Typography>

                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">Progress</Typography>
                                  <Typography variant="body2">{goal.progress.percentage}%</Typography>
                                </Box>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={goal.progress.percentage} 
                                  sx={{ height: 8, borderRadius: 4 }}
                                />
                              </Box>

                              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Chip 
                                  icon={<Flag />} 
                                  label={goal.category.replace('_', ' ')} 
                                  size="small" 
                                  variant="outlined"
                                />
                                <Chip 
                                  icon={<GpsFixed />} 
                                  label={goal.priority} 
                                  size="small" 
                                  sx={{ 
                                    backgroundColor: getPriorityColor(goal.priority),
                                    color: 'white'
                                  }}
                                />
                              </Box>

                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Target: {goal.targetMetric.targetValue} {goal.targetMetric.unit}
                              </Typography>

                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton onClick={() => handleEditGoal(goal)} size="small">
                                  <Edit />
                                </IconButton>
                                <IconButton onClick={() => handleDeleteGoal(goal._id)} color="error" size="small">
                                  <Delete />
                                </IconButton>
                                <IconButton size="small">
                                  <Share />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <GpsFixed sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No health goals yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Set your first health goal to start tracking your wellness journey.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setOpenGoalDialog(true)}
                        sx={{ borderRadius: '15px' }}
                      >
                        Create Your First Goal
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Analytics Tab - Health Trends */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                    Health Trends & Analytics
                  </Typography>
                  
                  {healthLogs && healthLogs.length > 0 ? (
                    <Box sx={{ height: 400, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <YAxis />
                          <RechartsTooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value, name) => [value, name]}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="weight" 
                            stackId="1"
                            stroke="#4CAF50" 
                            fill="#4CAF50" 
                            fillOpacity={0.6}
                            name="Weight (kg)"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="heartRate" 
                            stackId="2"
                            stroke="#2196F3" 
                            fill="#2196F3" 
                            fillOpacity={0.6}
                            name="Heart Rate (bpm)"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="temperature" 
                            stackId="3"
                            stroke="#F44336" 
                            fill="#F44336" 
                            fillOpacity={0.6}
                            name="Temperature (°F)"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="bloodPressure" 
                            stackId="4"
                            stroke="#9C27B0" 
                            fill="#9C27B0" 
                            fillOpacity={0.6}
                            name="Blood Pressure (mmHg)"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="sleep" 
                            stackId="5"
                            stroke="#FF9800" 
                            fill="#FF9800" 
                            fillOpacity={0.6}
                            name="Sleep (hours)"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="energyLevel" 
                            stackId="6"
                            stroke="#FFC107" 
                            fill="#FFC107" 
                            fillOpacity={0.6}
                            name="Energy Level"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="mood" 
                            stackId="7"
                            stroke="#00BCD4" 
                            fill="#00BCD4" 
                            fillOpacity={0.6}
                            name="Mood"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Timeline sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Health Data Available
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Start logging your health data to see trends and analytics.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Health Statistics */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Health Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                          {healthLogs?.length || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Logs
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                          {dashboard.currentStreak || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Day Streak
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
                        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                          {dashboard.avgMood || '--'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Avg Mood
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                        <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                          {dashboard.avgEnergy || '--'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Avg Energy
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Recent Health Logs Summary */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Recent Health Logs
                  </Typography>
                  {healthLogs && healthLogs.length > 0 ? (
                    <List>
                      {healthLogs.slice(0, 5).map((log, index) => (
                        <ListItem key={log._id} sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {new Date(log.date).getDate()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            component="div"
                            primary={new Date(log.date).toLocaleDateString()}
                            secondary={
                              <Box component="div" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {log.vitalSigns?.weight && (
                                  <Chip label={`${log.vitalSigns.weight}kg`} size="small" />
                                )}
                                {log.mood && (
                                  <Chip label={log.mood} size="small" color="primary" />
                                )}
                                {log.energyLevel && (
                                  <Chip label={log.energyLevel} size="small" color="secondary" />
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No health logs available
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Add/Edit Health Log Dialog */}
        <Dialog open={openDialog} onClose={() => {
          setOpenDialog(false);
          setEditingLog(null);
          resetForm();
          setFieldErrors({});
          setValidationErrors([]);
          setError(null);
        }} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingLog ? `Edit Health Log - ${new Date(editingLog.date).toLocaleDateString()}` : 'Add New Health Log'}
            <Typography variant="caption" display="block" color="text.secondary">
              Enhanced Health Tracker v3.0 - Complete CRUD Operations + Validation (15+ Fields)
            </Typography>
            <Typography variant="caption" display="block" color="primary" sx={{ mt: 1 }}>
              Cache Bust: {new Date().toLocaleTimeString()}
            </Typography>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              {/* Validation Error Summary */}
              {Object.keys(validationErrors).length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Please fix the following errors:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </Alert>
              )}
              
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Date *"
                    value={formData.date instanceof Date ? formData.date : new Date(formData.date)}
                    onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                    format="yyyy-MM-dd"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!fieldErrors.date,
                        helperText: fieldErrors.date || 'Select the date for this health log'
                      }
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedSelect
                    fullWidth
                    id="mood"
                    name="mood"
                    label="Mood"
                    value={formData.mood || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['mood']}
                    helperText="How are you feeling today?"
                  >
                    <MenuItem value="excellent">Excellent</MenuItem>
                    <MenuItem value="good">Good</MenuItem>
                    <MenuItem value="fair">Fair</MenuItem>
                    <MenuItem value="poor">Poor</MenuItem>
                    <MenuItem value="terrible">Terrible</MenuItem>
                  </ValidatedSelect>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedSelect
                    fullWidth
                    id="energyLevel"
                    name="energyLevel"
                    label="Energy Level"
                    value={formData.energyLevel || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['energyLevel']}
                    helperText="Rate your energy level today"
                  >
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="very-low">Very Low</MenuItem>
                  </ValidatedSelect>
                </Grid>

                {/* Blood Pressure */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Systolic Pressure (mmHg)"
                    type="number"
                    name="vitalSigns.bloodPressure.systolic"
                    value={formData.vitalSigns.bloodPressure.systolic || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['vitalSigns.bloodPressure.systolic']}
                    helperText="Normal range: 90-140 mmHg"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Diastolic Pressure (mmHg)"
                    type="number"
                    name="vitalSigns.bloodPressure.diastolic"
                    value={formData.vitalSigns.bloodPressure.diastolic || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['vitalSigns.bloodPressure.diastolic']}
                    helperText="Normal range: 60-90 mmHg"
                  />
                </Grid>
                
                {fieldErrors.bloodPressure && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {fieldErrors.bloodPressure}
                    </Alert>
                  </Grid>
                )}

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Heart Rate (bpm)"
                    type="number"
                    name="vitalSigns.heartRate"
                    value={formData.vitalSigns.heartRate || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['vitalSigns.heartRate']}
                    helperText="Normal range: 60-100 bpm"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Temperature (°C or °F)"
                    type="number"
                    placeholder="e.g., 37°C or 98.6°F"
                    name="vitalSigns.temperature"
                    value={formData.vitalSigns.temperature || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['vitalSigns.temperature']}
                    helperText="Enter temperature in Celsius (20-45) or Fahrenheit (68-113)"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Weight (kg)"
                    type="number"
                    name="vitalSigns.weight"
                    value={formData.vitalSigns.weight || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['vitalSigns.weight']}
                    helperText="Enter weight in kilograms"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Height (cm)"
                    type="number"
                    name="vitalSigns.height"
                    value={formData.vitalSigns.height || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['vitalSigns.height']}
                    helperText="Enter height in centimeters"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Blood Sugar (mg/dL)"
                    type="number"
                    name="vitalSigns.bloodSugar"
                    value={formData.vitalSigns.bloodSugar || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['vitalSigns.bloodSugar']}
                    helperText="Normal range: 70-140 mg/dL"
                  />
                </Grid>

                {/* Sleep Tracking */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Sleep Duration (hours)"
                    type="number"
                    name="sleep.duration"
                    value={formData.sleep.duration || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['sleep.duration']}
                    helperText="Recommended: 7-9 hours"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedSelect
                    fullWidth
                    id="sleep.quality"
                    name="sleep.quality"
                    label="Sleep Quality"
                    value={formData.sleep.quality || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['sleep.quality']}
                    helperText="Rate your sleep quality"
                  >
                    <MenuItem value="excellent">Excellent</MenuItem>
                    <MenuItem value="good">Good</MenuItem>
                    <MenuItem value="fair">Fair</MenuItem>
                    <MenuItem value="poor">Poor</MenuItem>
                    <MenuItem value="terrible">Terrible</MenuItem>
                  </ValidatedSelect>
                </Grid>

                {/* Exercise Tracking */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Exercise Type"
                    name="exercise.type"
                    value={formData.exercise.type || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['exercise.type']}
                    helperText="e.g., cardio, strength, yoga"
                    placeholder="e.g., cardio, strength, yoga"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Duration (minutes)"
                    type="number"
                    name="exercise.duration"
                    value={formData.exercise.duration || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['exercise.duration']}
                    helperText="Recommended: 30-60 minutes"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <ValidatedSelect
                    fullWidth
                    id="exercise.intensity"
                    name="exercise.intensity"
                    label="Intensity"
                    value={formData.exercise.intensity || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['exercise.intensity']}
                    helperText="Rate the intensity of your exercise"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="moderate">Moderate</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="very-high">Very High</MenuItem>
                  </ValidatedSelect>
                </Grid>

                {/* Nutrition Tracking */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Water Intake (oz)"
                    type="number"
                    name="nutrition.waterIntake"
                    value={formData.nutrition.waterIntake || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['nutrition.waterIntake']}
                    helperText="Recommended: 64-128 oz daily"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Supplements"
                    name="nutrition.supplements"
                    value={formData.nutrition.supplements || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['nutrition.supplements']}
                    helperText="List supplements separated by commas"
                    placeholder="e.g., Vitamin D, Omega-3"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Meals Description"
                    multiline
                    rows={2}
                    name="nutrition.meals"
                    value={formData.nutrition.meals || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['nutrition.meals']}
                    helperText="Describe your meals for the day"
                    placeholder="Describe your meals for the day..."
                  />
                </Grid>

                {/* Medications */}
                <Grid size={{ xs: 12 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Medications"
                    name="medications"
                    value={formData.medications || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['medications']}
                    helperText="List medications taken today"
                    placeholder="List any medications taken today..."
                  />
                </Grid>


                {/* Tags */}
                <Grid size={{ xs: 12 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Tags"
                    name="tags"
                    value={formData.tags ? formData.tags.join(', ') : ''}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                      setFormData({
                        ...formData,
                        tags: tags
                      });
                      // Trigger validation
                      const updatedFormData = { ...formData, tags: tags };
                      const errors = validateHealthLog(updatedFormData);
                      if (errors.tags) {
                        setFieldErrors(prev => ({ ...prev, tags: errors.tags }));
                      } else {
                        setFieldErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.tags;
                          return newErrors;
                        });
                      }
                    }}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['tags']}
                    helperText="Enter tags separated by commas (e.g., headache, fatigue, stress)"
                    placeholder="e.g., headache, fatigue, stress"
                  />
                </Grid>

                <Grid size={12}>
                  <ValidatedTextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['notes']}
                    helperText="Additional notes about your health today"
                    placeholder="Additional notes about your health today..."
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => {
                setOpenDialog(false);
                setEditingLog(null);
                resetForm();
                setFieldErrors({});
                setValidationErrors([]);
                setError(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={resetForm}
                variant="outlined"
                sx={{ borderRadius: '15px', mr: 1 }}
                disabled={isSubmitting}
              >
                Reset
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                sx={{ borderRadius: '15px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : null}
                {editingLog ? 'Update' : 'Save'} Log
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Add/Edit Health Goal Dialog */}
        <Dialog open={openGoalDialog} onClose={() => setOpenGoalDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingGoal ? 'Edit Health Goal' : 'Add Health Goal'}
          </DialogTitle>
          <form onSubmit={handleGoalSubmit}>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Goal Title"
                    value={goalFormData.title}
                    onChange={(e) => setGoalFormData({ ...goalFormData, title: e.target.value })}
                    required
                    error={Array.isArray(validationErrors) && validationErrors.some(err => err.path === 'title')}
                    helperText={Array.isArray(validationErrors) && validationErrors.find(err => err.path === 'title')?.msg || 'Enter a descriptive title for your goal (3-100 characters)'}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={goalFormData.description}
                    onChange={(e) => setGoalFormData({ ...goalFormData, description: e.target.value })}
                    error={Array.isArray(validationErrors) && validationErrors.some(err => err.path === 'description')}
                    helperText={Array.isArray(validationErrors) && validationErrors.find(err => err.path === 'description')?.msg || 'Describe your goal in detail (10-500 characters)'}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={goalFormData.category}
                      onChange={(e) => setGoalFormData({ ...goalFormData, category: e.target.value })}
                      required
                    >
                      <MenuItem value="weight_management">Weight Management</MenuItem>
                      <MenuItem value="fitness">Fitness</MenuItem>
                      <MenuItem value="nutrition">Nutrition</MenuItem>
                      <MenuItem value="sleep">Sleep</MenuItem>
                      <MenuItem value="mental_health">Mental Health</MenuItem>
                      <MenuItem value="medication_adherence">Medication Adherence</MenuItem>
                      <MenuItem value="symptom_management">Symptom Management</MenuItem>
                      <MenuItem value="vital_signs">Vital Signs</MenuItem>
                      <MenuItem value="lifestyle">Lifestyle</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={goalFormData.type}
                      onChange={(e) => setGoalFormData({ ...goalFormData, type: e.target.value })}
                      required
                    >
                      <MenuItem value="increase">Increase</MenuItem>
                      <MenuItem value="decrease">Decrease</MenuItem>
                      <MenuItem value="maintain">Maintain</MenuItem>
                      <MenuItem value="achieve">Achieve</MenuItem>
                      <MenuItem value="track">Track</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Target Metric Name"
                    value={goalFormData.targetMetric.name}
                    onChange={(e) => setGoalFormData({
                      ...goalFormData,
                      targetMetric: { ...goalFormData.targetMetric, name: e.target.value }
                    })}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Unit"
                    value={goalFormData.targetMetric.unit}
                    onChange={(e) => setGoalFormData({
                      ...goalFormData,
                      targetMetric: { ...goalFormData.targetMetric, unit: e.target.value }
                    })}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Target Value"
                    type="number"
                    value={goalFormData.targetMetric.targetValue}
                    onChange={(e) => setGoalFormData({
                      ...goalFormData,
                      targetMetric: { ...goalFormData.targetMetric, targetValue: e.target.value }
                    })}
                    required
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={goalFormData.priority}
                      onChange={(e) => setGoalFormData({ ...goalFormData, priority: e.target.value })}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="End Date"
                    value={goalFormData.timeframe.endDate instanceof Date ? goalFormData.timeframe.endDate : new Date(goalFormData.timeframe.endDate)}
                    onChange={(newValue) => setGoalFormData({
                      ...goalFormData,
                      timeframe: { ...goalFormData.timeframe, endDate: newValue }
                    })}
                    format="yyyy-MM-dd"
                    slotProps={{
                      textField: {
                        fullWidth: true
                      }
                    }}
                    required
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setOpenGoalDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" sx={{ borderRadius: '15px' }}>
                {editingGoal ? 'Update' : 'Save'} Goal
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
          onClick={() => {
            console.log('Opening Add Health Log dialog from FAB - Enhanced version');
            setError(null);
            setSuccessMessage(null);
            resetForm();
            setOpenDialog(true);
          }}
        >
          <Add />
        </Fab>
      </Container>
    </LocalizationProvider>
  );
};

export default HealthTracker;
