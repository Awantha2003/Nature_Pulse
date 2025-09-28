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
  FormHelperText,
  Chip,
  Select,
  MenuItem,
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
  Refresh,
  Assessment,
  Download,
  PictureAsPdf,
  TableChart
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { ValidatedTextField, ValidatedSelect } from '../../components/Validation';
import { validateHealthLog, validateHealthGoal } from '../../utils/validation';
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
  const [reportStartDate, setReportStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
  const [reportEndDate, setReportEndDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
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
    console.log('Health log change:', name, value);
    console.log('Current formData before update:', formData);
    
    // Define numeric fields that should only accept numbers
    const numericFields = [
      'vitalSigns.bloodPressure.systolic',
      'vitalSigns.bloodPressure.diastolic', 
      'vitalSigns.heartRate',
      'vitalSigns.temperature',
      'vitalSigns.weight',
      'vitalSigns.height',
      'sleep.duration',
      'exercise.duration',
      'nutrition.waterIntake'
    ];
    
    // Check if this is a numeric field and validate input
    if (numericFields.includes(name)) {
      // Only allow numbers, decimal point, and empty string
      if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
        return; // Don't update if invalid input
      }
    }
    
    if (name.includes('.')) {
      const parts = name.split('.');
      console.log('Nested field parts:', parts);
      
      if (parts.length === 3) {
        // Handle deeply nested fields like vitalSigns.bloodPressure.systolic
        const [parentKey, childKey, grandChildKey] = parts;
        console.log('Deeply nested field:', parentKey, childKey, grandChildKey);
        setFormData(prev => {
          const newData = {
            ...prev,
            [parentKey]: {
              ...prev[parentKey],
              [childKey]: {
                ...prev[parentKey]?.[childKey],
                [grandChildKey]: value,
              },
            },
          };
          console.log('Updated formData (deeply nested):', newData);
          return newData;
        });
      } else if (parts.length === 2) {
        // Handle regular nested fields like vitalSigns.heartRate
        const [parentKey, childKey] = parts;
        console.log('Regular nested field:', parentKey, childKey);
        setFormData(prev => {
          const newData = {
            ...prev,
            [parentKey]: {
              ...prev[parentKey],
              [childKey]: value,
            },
          };
          console.log('Updated formData (nested):', newData);
          return newData;
        });
      }
    } else {
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: value,
        };
        console.log('Updated formData (simple):', newData);
        return newData;
      });
    }
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleHealthLogBlur = (e) => {
    const { name, value } = e.target;
    console.log('Field blur:', name, value);
    
    // Validate the entire form to get proper nested object validation
    const allErrors = validateHealthLog(formData);
    setFieldErrors(allErrors);
  };

  // Real-time validation for blood pressure fields
  const handleBloodPressureChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow numbers
    if (value !== '' && !/^\d*$/.test(value)) {
      return;
    }
    
    // Update the form data
    handleHealthLogChange(e);
    
    // If both systolic and diastolic are filled, validate immediately
    if (name === 'vitalSigns.bloodPressure.systolic' && formData.vitalSigns?.bloodPressure?.diastolic) {
      const systolic = parseInt(value);
      const diastolic = parseInt(formData.vitalSigns.bloodPressure.diastolic);
      if (!isNaN(systolic) && !isNaN(diastolic)) {
        const errors = validateHealthLog({ ...formData, vitalSigns: { ...formData.vitalSigns, bloodPressure: { ...formData.vitalSigns.bloodPressure, [name.split('.')[2]]: value } } });
        setFieldErrors(prev => ({ ...prev, ...errors }));
      }
    } else if (name === 'vitalSigns.bloodPressure.diastolic' && formData.vitalSigns?.bloodPressure?.systolic) {
      const systolic = parseInt(formData.vitalSigns.bloodPressure.systolic);
      const diastolic = parseInt(value);
      if (!isNaN(systolic) && !isNaN(diastolic)) {
        const errors = validateHealthLog({ ...formData, vitalSigns: { ...formData.vitalSigns, bloodPressure: { ...formData.vitalSigns.bloodPressure, [name.split('.')[2]]: value } } });
        setFieldErrors(prev => ({ ...prev, ...errors }));
      }
    }
  };

  // Real-time validation for height field
  const handleHeightChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow numbers and decimal point
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return;
    }
    
    // Update the form data
    handleHealthLogChange(e);
    
    // Validate height immediately
    if (value !== '') {
      const height = parseFloat(value);
      if (!isNaN(height)) {
        let errorMessage = '';
        if (height < 50) {
          errorMessage = 'Height must be at least 50 cm (20 inches)';
        } else if (height > 250) {
          errorMessage = 'Height cannot exceed 250 cm (98 inches)';
        }
        
        setFieldErrors(prev => ({
          ...prev,
          [name]: errorMessage || undefined
        }));
      }
    } else {
      // Clear error when field is empty
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Real-time validation for exercise type field
  const handleExerciseTypeChange = (e) => {
    const { name, value } = e.target;
    
    // Valid exercise types from backend enum
    const validExerciseTypes = ['cardio', 'strength', 'yoga', 'walking', 'running', 'cycling', 'swimming', 'other'];
    
    // Check for comma-separated values and show error
    if (value.includes(',')) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: 'Please enter only one exercise type (no commas)'
      }));
      return;
    }
    
    // Update the form data
    handleHealthLogChange(e);
    
    // Validate against allowed values
    if (value !== '') {
      const lowerValue = value.toLowerCase().trim();
      if (!validExerciseTypes.includes(lowerValue)) {
        setFieldErrors(prev => ({
          ...prev,
          [name]: `Please enter a valid exercise type: ${validExerciseTypes.join(', ')}`
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          [name]: undefined
        }));
      }
    } else {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Real-time validation for heart rate field
  const handleHeartRateChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow numbers
    if (value !== '' && !/^\d*$/.test(value)) {
      return;
    }
    
    // Update the form data
    handleHealthLogChange(e);
    
    // Validate heart rate immediately
    if (value !== '') {
      const heartRate = parseInt(value);
      if (!isNaN(heartRate)) {
        let errorMessage = '';
        if (heartRate < 40) {
          errorMessage = 'Heart rate must be at least 40 bpm';
        } else if (heartRate > 200) {
          errorMessage = 'Heart rate cannot exceed 200 bpm';
        }
        
        setFieldErrors(prev => ({
          ...prev,
          [name]: errorMessage || undefined
        }));
      }
    } else {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Real-time validation for temperature field
  const handleTemperatureChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow numbers and decimal point
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return;
    }
    
    // Update the form data
    handleHealthLogChange(e);
    
    // Validate temperature immediately
    if (value !== '') {
      const temperature = parseFloat(value);
      if (!isNaN(temperature)) {
        let errorMessage = '';
        if (temperature < 25) {
          errorMessage = 'Temperature must be at least 25°C (77°F)';
        } else if (temperature > 45) {
          errorMessage = 'Temperature cannot exceed 45°C (113°F)';
        }
        
        setFieldErrors(prev => ({
          ...prev,
          [name]: errorMessage || undefined
        }));
      }
    } else {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Real-time validation for weight field
  const handleWeightChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow numbers and decimal point
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return;
    }
    
    // Update the form data
    handleHealthLogChange(e);
    
    // Validate weight immediately
    if (value !== '') {
      const weight = parseFloat(value);
      if (!isNaN(weight)) {
        let errorMessage = '';
        if (weight < 20) {
          errorMessage = 'Weight must be at least 20 kg (44 lbs)';
        } else if (weight > 300) {
          errorMessage = 'Weight cannot exceed 300 kg (660 lbs)';
        }
        
        setFieldErrors(prev => ({
          ...prev,
          [name]: errorMessage || undefined
        }));
      }
    } else {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Real-time validation for exercise duration field
  const handleExerciseDurationChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow numbers
    if (value !== '' && !/^\d*$/.test(value)) {
      return;
    }
    
    // Update the form data
    handleHealthLogChange(e);
    
    // Validate exercise duration immediately
    if (value !== '') {
      const duration = parseInt(value);
      if (!isNaN(duration)) {
        let errorMessage = '';
        if (duration < 0) {
          errorMessage = 'Exercise duration cannot be negative';
        } else if (duration > 480) {
          errorMessage = 'Exercise duration cannot exceed 480 minutes (8 hours)';
        }
        
        setFieldErrors(prev => ({
          ...prev,
          [name]: errorMessage || undefined
        }));
      }
    } else {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Real-time validation for water intake field
  const handleWaterIntakeChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow numbers and decimal point
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return;
    }
    
    // Update the form data
    handleHealthLogChange(e);
    
    // Validate water intake immediately
    if (value !== '') {
      const waterIntake = parseFloat(value);
      if (!isNaN(waterIntake)) {
        let errorMessage = '';
        if (waterIntake < 0) {
          errorMessage = 'Water intake cannot be negative';
        } else if (waterIntake > 20) {
          errorMessage = 'Water intake cannot exceed 20 liters per day';
        }
        
        setFieldErrors(prev => ({
          ...prev,
          [name]: errorMessage || undefined
        }));
      }
    } else {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Real-time validation for sleep duration field
  const handleSleepDurationChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow numbers and decimal point
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return;
    }
    
    // Update the form data
    handleHealthLogChange(e);
    
    // Validate sleep duration immediately
    if (value !== '') {
      const duration = parseFloat(value);
      if (!isNaN(duration)) {
        let errorMessage = '';
        if (duration < 0) {
          errorMessage = 'Sleep duration cannot be negative';
        } else if (duration > 24) {
          errorMessage = 'Sleep duration cannot exceed 24 hours';
        }
        
        setFieldErrors(prev => ({
          ...prev,
          [name]: errorMessage || undefined
        }));
      }
    } else {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Real-time validation for health goal fields
  const handleGoalTitleChange = (e) => {
    const { value } = e.target;
    setGoalFormData({ ...goalFormData, title: value });
    
    if (value !== '') {
      let errorMessage = '';
      if (value.length < 5) {
        errorMessage = 'Goal title must be at least 5 characters long';
      } else if (value.length > 100) {
        errorMessage = 'Goal title must be no more than 100 characters';
      }
      
      setFieldErrors(prev => ({
        ...prev,
        'goal.title': errorMessage || undefined
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        'goal.title': undefined
      }));
    }
  };

  const handleGoalDescriptionChange = (e) => {
    const { value } = e.target;
    setGoalFormData({ ...goalFormData, description: value });
    
    if (value !== '') {
      let errorMessage = '';
      if (value.length < 10) {
        errorMessage = 'Goal description must be at least 10 characters long';
      } else if (value.length > 500) {
        errorMessage = 'Goal description must be no more than 500 characters';
      }
      
      setFieldErrors(prev => ({
        ...prev,
        'goal.description': errorMessage || undefined
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        'goal.description': undefined
      }));
    }
  };

  const handleGoalTargetMetricNameChange = (e) => {
    const { value } = e.target;
    setGoalFormData({
      ...goalFormData,
      targetMetric: { ...goalFormData.targetMetric, name: value }
    });
    
    if (value !== '') {
      let errorMessage = '';
      if (value.length < 2) {
        errorMessage = 'Metric name must be at least 2 characters long';
      } else if (value.length > 50) {
        errorMessage = 'Metric name must be no more than 50 characters';
      }
      
      setFieldErrors(prev => ({
        ...prev,
        'goal.targetMetric.name': errorMessage || undefined
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        'goal.targetMetric.name': undefined
      }));
    }
  };

  const handleGoalTargetMetricUnitChange = (e) => {
    const { value } = e.target;
    setGoalFormData({
      ...goalFormData,
      targetMetric: { ...goalFormData.targetMetric, unit: value }
    });
    
    if (value !== '') {
      let errorMessage = '';
      if (value.length < 1) {
        errorMessage = 'Unit is required';
      } else if (value.length > 20) {
        errorMessage = 'Unit must be no more than 20 characters';
      }
      
      setFieldErrors(prev => ({
        ...prev,
        'goal.targetMetric.unit': errorMessage || undefined
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        'goal.targetMetric.unit': undefined
      }));
    }
  };

  const handleGoalTargetValueChange = (e) => {
    const { value } = e.target;
    
    // Only allow numbers and decimal point
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return;
    }
    
    setGoalFormData({
      ...goalFormData,
      targetMetric: { ...goalFormData.targetMetric, targetValue: value }
    });
    
    if (value !== '') {
      const targetValue = parseFloat(value);
      if (!isNaN(targetValue)) {
        let errorMessage = '';
        if (targetValue <= 0) {
          errorMessage = 'Target value must be greater than 0';
        } else if (targetValue > 10000) {
          errorMessage = 'Target value cannot exceed 10,000';
        }
        
        setFieldErrors(prev => ({
          ...prev,
          'goal.targetMetric.targetValue': errorMessage || undefined
        }));
      }
    } else {
      setFieldErrors(prev => ({
        ...prev,
        'goal.targetMetric.targetValue': undefined
      }));
    }
  };

  const handleGoalEndDateChange = (newValue) => {
    setGoalFormData({
      ...goalFormData,
      timeframe: { ...goalFormData.timeframe, endDate: newValue }
    });
    
    if (newValue) {
      const targetDate = new Date(newValue);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let errorMessage = '';
      if (isNaN(targetDate.getTime())) {
        errorMessage = 'Please enter a valid target date';
      } else if (targetDate < today) {
        errorMessage = 'Target date cannot be in the past';
      } else if (targetDate > new Date(today.getTime() + (365 * 24 * 60 * 60 * 1000))) {
        errorMessage = 'Target date cannot be more than 1 year in the future';
      }
      
      setFieldErrors(prev => ({
        ...prev,
        'goal.timeframe.endDate': errorMessage || undefined
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        'goal.timeframe.endDate': undefined
      }));
    }
  };

  const handleGoalCategoryChange = (e) => {
    const { value } = e.target;
    setGoalFormData({ ...goalFormData, category: value });
    
    // Clear any existing category error
    setFieldErrors(prev => ({
      ...prev,
      'goal.category': undefined
    }));
  };

  const handleGoalTypeChange = (e) => {
    const { value } = e.target;
    setGoalFormData({ ...goalFormData, type: value });
    
    // Clear any existing type error
    setFieldErrors(prev => ({
      ...prev,
      'goal.type': undefined
    }));
  };

  const handleGoalPriorityChange = (e) => {
    const { value } = e.target;
    setGoalFormData({ ...goalFormData, priority: value });
    
    // Clear any existing priority error
    setFieldErrors(prev => ({
      ...prev,
      'goal.priority': undefined
    }));
  };

  // Real-time validation - only validate specific fields on change
  // Removed automatic validation on every formData change to prevent input blocking

  // Reset form when dialog opens for new entry
  useEffect(() => {
    if (openDialog && !editingLog) {
      console.log('Resetting form for new entry');
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
        mood: formData.mood || undefined,
        energyLevel: formData.energyLevel || undefined,
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
          quality: formData.sleep.quality || undefined
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
      console.error('Error response:', err.response?.data);
      
      if (err.response?.data?.message) {
        setError(`Failed to save health log: ${err.response.data.message}`);
      } else if (err.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors = err.response.data.errors;
        console.log('Backend validation errors:', backendErrors);
        
        // Convert backend errors to frontend field errors
        const fieldErrors = {};
        if (Array.isArray(backendErrors)) {
          backendErrors.forEach(error => {
            if (error.path) {
              fieldErrors[error.path] = error.msg;
            }
          });
        } else if (typeof backendErrors === 'object') {
          // Handle mongoose validation errors
          Object.keys(backendErrors).forEach(key => {
            const error = backendErrors[key];
            if (error.message) {
              // Map backend field names to frontend field names
              let frontendField = key;
              if (key === 'vitalSigns.height.value') {
                frontendField = 'vitalSigns.height';
              } else if (key === 'exercise.type') {
                frontendField = 'exercise.type';
              }
              fieldErrors[frontendField] = error.message;
            }
          });
        }
        
        console.log('Mapped field errors:', fieldErrors);
        setFieldErrors(fieldErrors);
        setValidationErrors(Array.isArray(backendErrors) ? backendErrors : []);
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
    console.log('Resetting form data');
    const newFormData = {
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
    };
    console.log('New form data:', newFormData);
    setFormData(newFormData);
    setFieldErrors({});
    setValidationErrors({});
  };

  // Sample data function removed
  // Removed unused fillSampleData function
  const _fillSampleData = () => {
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
    // Removed unreachable code after return statement
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

  // Use centralized validation function
  const validateForm = () => {
    const errors = validateHealthLog(formData);
    setFieldErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log('Form is valid:', isValid);
    if (!isValid) {
      console.log('Validation errors:', errors);
    }
    return isValid;
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
  // Removed unused completedGoals variable

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

            {/* Health Report Generation */}
            <Grid size={{ xs: 12 }}>
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
        }} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h5" component="div">
                  {editingLog ? `Edit Health Log` : 'Add New Health Log'}
            </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track your daily health metrics and wellness
            </Typography>
              </Box>
              <Chip 
                label={editingLog ? "Edit Mode" : "New Entry"} 
                color={editingLog ? "warning" : "primary"} 
                size="small"
              />
            </Box>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ p: 3 }}>
              {/* Error Display */}
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
              
              {/* Success Message */}
              {successMessage && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  {successMessage}
                </Alert>
              )}

              {/* Form Sections */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                
                {/* Basic Information Section */}
                <Card sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    📅 Basic Information
                  </Typography>
                  <Grid container spacing={3}>
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
                  {fieldErrors.date && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2, display: 'block', fontSize: '0.75rem' }}>
                      {fieldErrors.date}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedSelect
                    fullWidth
                    id="mood"
                    name="mood"
                    label="Mood *"
                    value={formData.mood || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['mood']}
                    helperText={fieldErrors['mood'] ? fieldErrors['mood'] : "How are you feeling today?"}
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
                    id="energyLevel"
                    name="energyLevel"
                    label="Energy Level *"
                    value={formData.energyLevel || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['energyLevel']}
                    helperText={fieldErrors['energyLevel'] ? fieldErrors['energyLevel'] : "Rate your energy level today"}
                  >
                    <MenuItem value="high">⚡ High</MenuItem>
                    <MenuItem value="medium">🔋 Medium</MenuItem>
                    <MenuItem value="low">🔋 Low</MenuItem>
                    <MenuItem value="very-low">🔋 Very Low</MenuItem>
                  </ValidatedSelect>
                </Grid>
                  </Grid>
                </Card>

                {/* Vital Signs Section */}
                <Card sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    ❤️ Vital Signs
                  </Typography>
                  <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Systolic Pressure (mmHg) *"
                    name="vitalSigns.bloodPressure.systolic"
                    value={formData.vitalSigns.bloodPressure.systolic || ''}
                    onChange={handleBloodPressureChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['vitalSigns.bloodPressure.systolic']}
                    helperText={fieldErrors['vitalSigns.bloodPressure.systolic'] ? fieldErrors['vitalSigns.bloodPressure.systolic'] : "Range: 50-250 mmHg (Normal: 90-140 mmHg)"}
                    placeholder="Enter systolic pressure"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Diastolic Pressure (mmHg) *"
                    name="vitalSigns.bloodPressure.diastolic"
                    value={formData.vitalSigns.bloodPressure.diastolic || ''}
                    onChange={handleBloodPressureChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['vitalSigns.bloodPressure.diastolic']}
                    helperText={fieldErrors['vitalSigns.bloodPressure.diastolic'] ? fieldErrors['vitalSigns.bloodPressure.diastolic'] : "Range: 30-150 mmHg (Normal: 60-90 mmHg)"}
                    placeholder="Enter diastolic pressure"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                    <Typography variant="body2">
                      <strong>💡 Tip:</strong> Systolic pressure (top number) should always be higher than diastolic pressure (bottom number). 
                      Normal blood pressure is typically 120/80 mmHg or lower.
                    </Typography>
                  </Alert>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Heart Rate (bpm) *"
                    name="vitalSigns.heartRate"
                    value={formData.vitalSigns.heartRate || ''}
                    onChange={handleHeartRateChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['vitalSigns.heartRate']}
                    helperText={fieldErrors['vitalSigns.heartRate'] ? fieldErrors['vitalSigns.heartRate'] : "Normal range: 60-100 bpm"}
                    placeholder="Enter heart rate"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Temperature (°C or °F) *"
                    name="vitalSigns.temperature"
                    value={formData.vitalSigns.temperature || ''}
                    onChange={handleTemperatureChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['vitalSigns.temperature']}
                    helperText={fieldErrors['vitalSigns.temperature'] ? fieldErrors['vitalSigns.temperature'] : "Enter temperature in Celsius (25-45) or Fahrenheit (77-113)"}
                    placeholder="e.g., 37°C or 98.6°F"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Weight (kg) *"
                    name="vitalSigns.weight"
                    value={formData.vitalSigns.weight || ''}
                    onChange={handleWeightChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['vitalSigns.weight']}
                    helperText={fieldErrors['vitalSigns.weight'] ? fieldErrors['vitalSigns.weight'] : "Enter weight in kilograms (20-300 kg)"}
                    placeholder="Enter weight"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Height (cm) *"
                    name="vitalSigns.height"
                    value={formData.vitalSigns.height || ''}
                    onChange={handleHeightChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['vitalSigns.height']}
                    helperText={fieldErrors['vitalSigns.height'] ? fieldErrors['vitalSigns.height'] : "Enter height in centimeters (50-250 cm)"}
                    placeholder="Enter height"
                  />
                </Grid>
                </Grid>
                </Card>

                {/* Sleep & Exercise Section */}
                <Card sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    😴 Sleep & Exercise
                  </Typography>
                  <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Sleep Duration (hours) *"
                    type="number"
                    name="sleep.duration"
                    value={formData.sleep.duration || ''}
                    onChange={handleSleepDurationChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['sleep.duration']}
                    helperText={fieldErrors['sleep.duration'] ? fieldErrors['sleep.duration'] : "Recommended: 7-9 hours (max 24 hours)"}
                    placeholder="Enter sleep duration"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedSelect
                    fullWidth
                    id="sleep.quality"
                    name="sleep.quality"
                    label="Sleep Quality *"
                    value={formData.sleep.quality || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['sleep.quality']}
                    helperText={fieldErrors['sleep.quality'] ? fieldErrors['sleep.quality'] : "Rate your sleep quality"}
                  >
                    <MenuItem value="excellent">😴 Excellent</MenuItem>
                    <MenuItem value="good">😌 Good</MenuItem>
                    <MenuItem value="fair">😐 Fair</MenuItem>
                    <MenuItem value="poor">😔 Poor</MenuItem>
                    <MenuItem value="terrible">😢 Terrible</MenuItem>
                  </ValidatedSelect>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <ValidatedSelect
                    fullWidth
                    id="exercise.type"
                    label="Exercise Type *"
                    name="exercise.type"
                    value={formData.exercise.type || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['exercise.type']}
                    helperText={fieldErrors['exercise.type'] ? fieldErrors['exercise.type'] : "Select exercise type"}
                  >
                    <MenuItem value="">Select exercise type</MenuItem>
                    <MenuItem value="cardio">Cardio</MenuItem>
                    <MenuItem value="strength">Strength Training</MenuItem>
                    <MenuItem value="yoga">Yoga</MenuItem>
                    <MenuItem value="walking">Walking</MenuItem>
                    <MenuItem value="running">Running</MenuItem>
                    <MenuItem value="cycling">Cycling</MenuItem>
                    <MenuItem value="swimming">Swimming</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </ValidatedSelect>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Duration (minutes) *"
                    type="number"
                    name="exercise.duration"
                    value={formData.exercise.duration || ''}
                    onChange={handleExerciseDurationChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['exercise.duration']}
                    helperText={fieldErrors['exercise.duration'] ? fieldErrors['exercise.duration'] : "Recommended: 30-60 minutes (max 480 minutes)"}
                    placeholder="Enter duration"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <ValidatedSelect
                    fullWidth
                    id="exercise.intensity"
                    name="exercise.intensity"
                    label="Intensity *"
                    value={formData.exercise.intensity || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['exercise.intensity']}
                    helperText={fieldErrors['exercise.intensity'] ? fieldErrors['exercise.intensity'] : "Rate the intensity of your exercise"}
                  >
                    <MenuItem value="low">🟢 Low</MenuItem>
                    <MenuItem value="moderate">🟡 Moderate</MenuItem>
                    <MenuItem value="high">🔴 High</MenuItem>
                    <MenuItem value="very-high">🔴 Very High</MenuItem>
                  </ValidatedSelect>
                </Grid>
                  </Grid>
                </Card>

                {/* Nutrition & Notes Section */}
                <Card sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    🥗 Nutrition & Notes
                  </Typography>
                  <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Water Intake (oz) *"
                    type="number"
                    name="nutrition.waterIntake"
                    value={formData.nutrition.waterIntake || ''}
                    onChange={handleWaterIntakeChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['nutrition.waterIntake']}
                    helperText={fieldErrors['nutrition.waterIntake'] ? fieldErrors['nutrition.waterIntake'] : "Recommended: 64-128 oz daily (max 676 oz)"}
                    placeholder="Enter water intake"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Supplements *"
                    name="nutrition.supplements"
                    value={formData.nutrition.supplements || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['nutrition.supplements']}
                    helperText={fieldErrors['nutrition.supplements'] ? fieldErrors['nutrition.supplements'] : "Max 200 characters - List supplements separated by commas"}
                    placeholder="e.g., Vitamin D, Omega-3"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Meals Description *"
                    multiline
                    rows={2}
                    name="nutrition.meals"
                    value={formData.nutrition.meals || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['nutrition.meals']}
                    helperText={fieldErrors['nutrition.meals'] ? fieldErrors['nutrition.meals'] : "Max 500 characters - Describe your meals for the day"}
                    placeholder="Describe your meals for the day..."
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Medications *"
                    name="medications"
                    value={formData.medications || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['medications']}
                    helperText={fieldErrors['medications'] ? fieldErrors['medications'] : "Max 300 characters - List medications taken today"}
                    placeholder="List any medications taken today..."
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Tags *"
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
                    helperText={fieldErrors['tags'] ? fieldErrors['tags'] : "Max 200 characters total, each tag max 50 chars - Enter tags separated by commas (e.g., headache, fatigue, stress)"}
                    placeholder="e.g., headache, fatigue, stress"
                  />
                </Grid>
                <Grid size={12}>
                  <ValidatedTextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes *"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleHealthLogChange}
                    onBlur={handleHealthLogBlur}
                    error={fieldErrors['notes']}
                    helperText={fieldErrors['notes'] ? fieldErrors['notes'] : "Max 1000 characters - Additional notes about your health today"}
                    placeholder="Additional notes about your health today..."
                  />
                </Grid>
              </Grid>
                </Card>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button 
                onClick={() => {
                  setOpenDialog(false);
                  setEditingLog(null);
                  resetForm();
                  setFieldErrors({});
                  setValidationErrors([]);
                  setError(null);
                }}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Cancel
              </Button>
              <Button 
                onClick={resetForm}
                variant="outlined"
                sx={{ borderRadius: 2 }}
                disabled={isSubmitting}
              >
                Clear Form
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                sx={{ borderRadius: 2 }}
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isSubmitting ? 'Saving...' : (editingLog ? 'Update Log' : 'Save Log')}
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
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Goal Title *"
                    value={goalFormData.title}
                    onChange={handleGoalTitleChange}
                    error={fieldErrors['goal.title']}
                    helperText={fieldErrors['goal.title'] ? fieldErrors['goal.title'] : 'Enter a descriptive title for your goal (5-100 characters)'}
                    placeholder="e.g., Lose 10 pounds, Run 5K, Improve sleep quality"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <ValidatedTextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description *"
                    value={goalFormData.description}
                    onChange={handleGoalDescriptionChange}
                    error={fieldErrors['goal.description']}
                    helperText={fieldErrors['goal.description'] ? fieldErrors['goal.description'] : 'Describe your goal in detail (10-500 characters)'}
                    placeholder="Describe what you want to achieve, why it's important, and how you plan to reach it..."
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={!!fieldErrors['goal.category']}>
                    <InputLabel>Category *</InputLabel>
                    <Select
                      value={goalFormData.category}
                      onChange={handleGoalCategoryChange}
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
                    {fieldErrors['goal.category'] && (
                      <FormHelperText error>{fieldErrors['goal.category']}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={!!fieldErrors['goal.type']}>
                    <InputLabel>Type *</InputLabel>
                    <Select
                      value={goalFormData.type}
                      onChange={handleGoalTypeChange}
                      required
                    >
                      <MenuItem value="increase">Increase</MenuItem>
                      <MenuItem value="decrease">Decrease</MenuItem>
                      <MenuItem value="maintain">Maintain</MenuItem>
                      <MenuItem value="achieve">Achieve</MenuItem>
                      <MenuItem value="track">Track</MenuItem>
                    </Select>
                    {fieldErrors['goal.type'] && (
                      <FormHelperText error>{fieldErrors['goal.type']}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Target Metric Name *"
                    value={goalFormData.targetMetric.name}
                    onChange={handleGoalTargetMetricNameChange}
                    error={fieldErrors['goal.targetMetric.name']}
                    helperText={fieldErrors['goal.targetMetric.name'] ? fieldErrors['goal.targetMetric.name'] : 'What you want to measure (2-50 characters)'}
                    placeholder="e.g., Weight, Steps, Sleep Hours, Water Intake"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Unit *"
                    value={goalFormData.targetMetric.unit}
                    onChange={handleGoalTargetMetricUnitChange}
                    error={fieldErrors['goal.targetMetric.unit']}
                    helperText={fieldErrors['goal.targetMetric.unit'] ? fieldErrors['goal.targetMetric.unit'] : 'Unit of measurement (1-20 characters)'}
                    placeholder="e.g., kg, lbs, steps, hours, oz, miles"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <ValidatedTextField
                    fullWidth
                    label="Target Value *"
                    type="number"
                    value={goalFormData.targetMetric.targetValue}
                    onChange={handleGoalTargetValueChange}
                    error={fieldErrors['goal.targetMetric.targetValue']}
                    helperText={fieldErrors['goal.targetMetric.targetValue'] ? fieldErrors['goal.targetMetric.targetValue'] : 'Your target value (0-10,000)'}
                    placeholder="e.g., 70, 10000, 8, 64"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={!!fieldErrors['goal.priority']}>
                    <InputLabel>Priority *</InputLabel>
                    <Select
                      value={goalFormData.priority}
                      onChange={handleGoalPriorityChange}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="critical">Critical</MenuItem>
                    </Select>
                    {fieldErrors['goal.priority'] && (
                      <FormHelperText error>{fieldErrors['goal.priority']}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="End Date *"
                    value={goalFormData.timeframe.endDate instanceof Date ? goalFormData.timeframe.endDate : new Date(goalFormData.timeframe.endDate)}
                    onChange={handleGoalEndDateChange}
                    format="yyyy-MM-dd"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!fieldErrors['goal.timeframe.endDate'],
                        helperText: fieldErrors['goal.timeframe.endDate'] ? fieldErrors['goal.timeframe.endDate'] : 'When do you want to achieve this goal?'
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
