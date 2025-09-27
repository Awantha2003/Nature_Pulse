const express = require('express');
const HealthLog = require('../models/HealthLog');
const { protect, checkActive } = require('../middleware/auth');
const { validateHealthLog, validatePagination, validateMongoId, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Helper function to transform frontend data to match backend model structure
const transformHealthLogData = (data, userId) => {
  const transformed = {
    date: data.date,
    vitalSigns: {},
    symptoms: data.symptoms || [],
    notes: data.notes,
    tags: data.tags || []
  };
  
  // Only set user field for new records (not updates)
  if (userId) {
    transformed.user = userId;
  }

  // Transform vital signs
  if (data.vitalSigns) {
    // Blood pressure
    if (data.vitalSigns.bloodPressure) {
      transformed.vitalSigns.bloodPressure = {};
      if (data.vitalSigns.bloodPressure.systolic && data.vitalSigns.bloodPressure.systolic !== '') {
        transformed.vitalSigns.bloodPressure.systolic = parseInt(data.vitalSigns.bloodPressure.systolic);
      }
      if (data.vitalSigns.bloodPressure.diastolic && data.vitalSigns.bloodPressure.diastolic !== '') {
        transformed.vitalSigns.bloodPressure.diastolic = parseInt(data.vitalSigns.bloodPressure.diastolic);
      }
    }

    // Heart rate
    if (data.vitalSigns.heartRate && data.vitalSigns.heartRate !== '') {
      transformed.vitalSigns.heartRate = {
        value: parseInt(data.vitalSigns.heartRate),
        unit: 'bpm'
      };
    }

    // Temperature
    if (data.vitalSigns.temperature && data.vitalSigns.temperature !== '') {
      const tempValue = parseFloat(data.vitalSigns.temperature);
      // If temperature is in Celsius range (20-45), convert to Fahrenheit
      // If temperature is in Fahrenheit range (68-113), keep as is
      let finalTemp, unit;
      if (tempValue >= 20 && tempValue <= 45) {
        // Celsius to Fahrenheit conversion
        finalTemp = (tempValue * 9/5) + 32;
        unit = '°F';
      } else if (tempValue >= 68 && tempValue <= 113) {
        // Already in Fahrenheit
        finalTemp = tempValue;
        unit = '°F';
      } else {
        // Default to the entered value and assume Fahrenheit
        finalTemp = tempValue;
        unit = '°F';
      }
      
      transformed.vitalSigns.temperature = {
        value: finalTemp,
        unit: unit
      };
    }

    // Weight
    if (data.vitalSigns.weight && data.vitalSigns.weight !== '') {
      transformed.vitalSigns.weight = {
        value: parseFloat(data.vitalSigns.weight),
        unit: 'lbs'
      };
    }

    // Height
    if (data.vitalSigns.height && data.vitalSigns.height !== '') {
      transformed.vitalSigns.height = {
        value: parseFloat(data.vitalSigns.height),
        unit: 'inches'
      };
    }

    // Blood sugar
    if (data.vitalSigns.bloodSugar && data.vitalSigns.bloodSugar !== '') {
      transformed.vitalSigns.bloodSugar = {
        value: parseFloat(data.vitalSigns.bloodSugar),
        unit: 'mg/dL',
        type: 'random'
      };
    }
  }

  // Transform mood (convert string to number)
  if (data.mood && data.mood !== '') {
    const moodMap = {
      'excellent': 10,
      'good': 8,
      'fair': 6,
      'poor': 4,
      'terrible': 2
    };
    transformed.mood = moodMap[data.mood] || parseInt(data.mood) || 5;
  }

  // Transform energy level (convert string to number)
  if (data.energyLevel && data.energyLevel !== '') {
    const energyMap = {
      'high': 10,
      'medium': 6,
      'low': 3,
      'very-low': 1
    };
    transformed.energyLevel = energyMap[data.energyLevel] || parseInt(data.energyLevel) || 5;
  }

  // Transform sleep data
  if (data.sleep) {
    transformed.sleep = {};
    if (data.sleep.duration && data.sleep.duration !== '') {
      transformed.sleep.duration = parseFloat(data.sleep.duration);
    }
    if (data.sleep.quality && data.sleep.quality !== '') {
      transformed.sleep.quality = data.sleep.quality;
    }
  }

  // Transform exercise data
  if (data.exercise) {
    transformed.exercise = {};
    if (data.exercise.type && data.exercise.type !== '') {
      transformed.exercise.type = data.exercise.type;
    }
    if (data.exercise.duration && data.exercise.duration !== '') {
      transformed.exercise.duration = parseFloat(data.exercise.duration);
    }
    if (data.exercise.intensity && data.exercise.intensity !== '') {
      transformed.exercise.intensity = data.exercise.intensity;
    }
  }

  // Transform nutrition data
  if (data.nutrition) {
    transformed.nutrition = {};
    if (data.nutrition.waterIntake && data.nutrition.waterIntake !== '') {
      // The schema expects waterIntake to have value and unit structure
      transformed.nutrition.waterIntake = {
        value: parseFloat(data.nutrition.waterIntake),
        unit: 'oz'
      };
    }
    if (data.nutrition.supplements && data.nutrition.supplements !== '') {
      transformed.nutrition.supplements = data.nutrition.supplements;
    }
    if (data.nutrition.meals && data.nutrition.meals !== '') {
      transformed.nutrition.meals = data.nutrition.meals;
    }
  }

  // Transform medications
  if (data.medications && Array.isArray(data.medications)) {
    // Frontend sends array of medication objects, use them directly
    transformed.medications = data.medications;
  } else if (data.medications && typeof data.medications === 'string' && data.medications !== '') {
    // Handle string format (comma-separated)
    transformed.medications = [{
      name: data.medications,
      taken: true
    }];
  }


  return transformed;
};

// Helper function to transform backend data to frontend format
const transformHealthLogForFrontend = (log) => {
  const transformed = log.toObject();
  
  // Transform vital signs for frontend display
  if (transformed.vitalSigns) {
    // Weight: convert {value: 90, unit: 'lbs'} to 90
    if (transformed.vitalSigns.weight && transformed.vitalSigns.weight.value) {
      transformed.vitalSigns.weight = transformed.vitalSigns.weight.value;
    }
    
    // Heart rate: convert {value: 100, unit: 'bpm'} to 100
    if (transformed.vitalSigns.heartRate && transformed.vitalSigns.heartRate.value) {
      transformed.vitalSigns.heartRate = transformed.vitalSigns.heartRate.value;
    }
    
    // Temperature: convert {value: 98.6, unit: '°F'} to 98.6
    if (transformed.vitalSigns.temperature && transformed.vitalSigns.temperature.value) {
      transformed.vitalSigns.temperature = transformed.vitalSigns.temperature.value;
    }
    
    // Blood pressure: keep as object but ensure it exists
    if (transformed.vitalSigns.bloodPressure) {
      transformed.vitalSigns.bloodPressure = {
        systolic: transformed.vitalSigns.bloodPressure.systolic || '',
        diastolic: transformed.vitalSigns.bloodPressure.diastolic || ''
      };
    }
  }
  
  // Transform mood: convert numeric to string
  if (transformed.mood && typeof transformed.mood === 'number') {
    const moodMap = {
      10: 'excellent',
      8: 'good',
      6: 'fair',
      4: 'poor',
      2: 'terrible'
    };
    transformed.mood = moodMap[transformed.mood] || 'fair';
  }
  
  // Transform energy level: convert numeric to string
  if (transformed.energyLevel && typeof transformed.energyLevel === 'number') {
    const energyMap = {
      10: 'high',
      6: 'medium',
      3: 'low',
      1: 'very-low'
    };
    transformed.energyLevel = energyMap[transformed.energyLevel] || 'medium';
  }

  // Transform sleep data for frontend
  if (transformed.sleep) {
    if (transformed.sleep.duration && typeof transformed.sleep.duration === 'number') {
      transformed.sleep.duration = transformed.sleep.duration.toString();
    }
  }

  // Transform exercise data for frontend
  if (transformed.exercise) {
    if (transformed.exercise.duration && typeof transformed.exercise.duration === 'number') {
      transformed.exercise.duration = transformed.exercise.duration.toString();
    }
  }

  // Transform nutrition data for frontend
  if (transformed.nutrition && transformed.nutrition.waterIntake && transformed.nutrition.waterIntake.value) {
    transformed.nutrition.waterIntake = transformed.nutrition.waterIntake.value.toString();
  }

  // Transform medications for frontend
  if (transformed.medications && Array.isArray(transformed.medications) && transformed.medications.length > 0) {
    transformed.medications = transformed.medications.map(med => med.name).join(', ');
  }

  // Transform symptoms for frontend
  if (transformed.symptoms && Array.isArray(transformed.symptoms)) {
    transformed.symptoms = transformed.symptoms.join(', ');
  }
  
  return transformed;
};

// @route   POST /api/health-tracker/logs
// @desc    Create a new health log entry
// @access  Private
router.post('/logs', protect, checkActive, validateHealthLog, handleValidationErrors, async (req, res) => {
  try {
    const healthLogData = transformHealthLogData(req.body, req.user._id);

    // Check if log already exists for this date
    const existingLog = await HealthLog.findOne({
      user: req.user._id,
      date: new Date(req.body.date || Date.now()).toDateString()
    });

    if (existingLog) {
      return res.status(400).json({
        status: 'error',
        message: 'Health log already exists for this date. Use PUT to update.'
      });
    }

    const healthLog = await HealthLog.create(healthLogData);

    // Transform log for frontend
    const transformedLog = transformHealthLogForFrontend(healthLog);

    res.status(201).json({
      status: 'success',
      message: 'Health log created successfully',
      data: { healthLog: transformedLog }
    });
  } catch (error) {
    console.error('Create health log error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create health log'
    });
  }
});

// @route   GET /api/health-tracker/logs
// @desc    Get user's health logs
// @access  Private
router.get('/logs', protect, checkActive, validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { startDate, endDate, category } = req.query;

    // Build filter
    const filter = { user: req.user._id };
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const healthLogs = await HealthLog.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await HealthLog.countDocuments(filter);

    // Transform logs for frontend
    const transformedLogs = healthLogs.map(log => transformHealthLogForFrontend(log));

    res.status(200).json({
      status: 'success',
      data: {
        healthLogs: transformedLogs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalLogs: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get health logs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch health logs'
    });
  }
});

// @route   GET /api/health-tracker/logs/:id
// @desc    Get specific health log
// @access  Private
router.get('/logs/:id', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const healthLog = await HealthLog.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!healthLog) {
      return res.status(404).json({
        status: 'error',
        message: 'Health log not found'
      });
    }

    // Transform log for frontend
    const transformedLog = transformHealthLogForFrontend(healthLog);

    res.status(200).json({
      status: 'success',
      data: { healthLog: transformedLog }
    });
  } catch (error) {
    console.error('Get health log error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch health log'
    });
  }
});

// @route   PUT /api/health-tracker/logs/:id
// @desc    Update health log
// @access  Private
router.put('/logs/:id', protect, checkActive, validateMongoId('id'), validateHealthLog, handleValidationErrors, async (req, res) => {
  try {
    // For updates, we don't need to transform the user field
    const healthLogData = transformHealthLogData(req.body, null);
    // Remove user field from update data
    delete healthLogData.user;
    
    const healthLog = await HealthLog.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      healthLogData,
      { new: true, runValidators: true }
    );

    if (!healthLog) {
      return res.status(404).json({
        status: 'error',
        message: 'Health log not found'
      });
    }

    // Transform log for frontend
    const transformedLog = transformHealthLogForFrontend(healthLog);

    res.status(200).json({
      status: 'success',
      message: 'Health log updated successfully',
      data: { healthLog: transformedLog }
    });
  } catch (error) {
    console.error('Update health log error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update health log'
    });
  }
});

// @route   DELETE /api/health-tracker/logs/:id
// @desc    Delete health log
// @access  Private
router.delete('/logs/:id', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const healthLog = await HealthLog.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!healthLog) {
      return res.status(404).json({
        status: 'error',
        message: 'Health log not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Health log deleted successfully'
    });
  } catch (error) {
    console.error('Delete health log error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete health log'
    });
  }
});

// @route   GET /api/health-tracker/trends
// @desc    Get health trends and analytics
// @access  Private
router.get('/trends', protect, checkActive, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get health trends
    const trends = await HealthLog.getHealthTrends(req.user._id, startDate, endDate);

    // Get recent logs for detailed analysis
    const recentLogs = await HealthLog.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Calculate additional metrics
    const metrics = {
      totalLogs: recentLogs.length,
      averageMood: 0,
      averageEnergy: 0,
      averageSleepDuration: 0,
      averageSleepQuality: 0,
      bloodPressureReadings: [],
      weightReadings: [],
      heartRateReadings: [],
      symptomFrequency: {}
    };

    if (recentLogs.length > 0) {
      // Calculate averages
      const moodValues = recentLogs.filter(log => log.mood).map(log => log.mood);
      const energyValues = recentLogs.filter(log => log.energyLevel).map(log => log.energyLevel);
      const sleepDurationValues = recentLogs.filter(log => log.sleep?.duration).map(log => log.sleep.duration);
      const sleepQualityValues = recentLogs.filter(log => log.sleep?.quality).map(log => log.sleep.quality);

      metrics.averageMood = moodValues.length > 0 ? 
        (moodValues.reduce((sum, val) => sum + val, 0) / moodValues.length).toFixed(1) : 0;
      
      metrics.averageEnergy = energyValues.length > 0 ? 
        (energyValues.reduce((sum, val) => sum + val, 0) / energyValues.length).toFixed(1) : 0;
      
      metrics.averageSleepDuration = sleepDurationValues.length > 0 ? 
        (sleepDurationValues.reduce((sum, val) => sum + val, 0) / sleepDurationValues.length).toFixed(1) : 0;
      
      metrics.averageSleepQuality = sleepQualityValues.length > 0 ? 
        (sleepQualityValues.reduce((sum, val) => sum + val, 0) / sleepQualityValues.length).toFixed(1) : 0;

      // Collect vital signs data
      recentLogs.forEach(log => {
        if (log.vitalSigns?.bloodPressure?.systolic && log.vitalSigns?.bloodPressure?.diastolic) {
          metrics.bloodPressureReadings.push({
            date: log.date,
            systolic: log.vitalSigns.bloodPressure.systolic,
            diastolic: log.vitalSigns.bloodPressure.diastolic
          });
        }

        if (log.vitalSigns?.weight?.value) {
          metrics.weightReadings.push({
            date: log.date,
            weight: log.vitalSigns.weight.value
          });
        }

        if (log.vitalSigns?.heartRate?.value) {
          metrics.heartRateReadings.push({
            date: log.date,
            heartRate: log.vitalSigns.heartRate.value
          });
        }

        // Count symptom frequency
        if (log.symptoms && log.symptoms.length > 0) {
          log.symptoms.forEach(symptom => {
            metrics.symptomFrequency[symptom.name] = (metrics.symptomFrequency[symptom.name] || 0) + 1;
          });
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        period: `${period} days`,
        startDate,
        endDate,
        trends: trends[0] || {},
        metrics,
        recentLogs: recentLogs.slice(-10) // Last 10 logs
      }
    });
  } catch (error) {
    console.error('Get health trends error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch health trends'
    });
  }
});

// @route   GET /api/health-tracker/summary
// @desc    Get health summary for dashboard
// @access  Private
router.get('/summary', protect, checkActive, async (req, res) => {
  try {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get today's log
    const todayLog = await HealthLog.findOne({
      user: req.user._id,
      date: today.toDateString()
    });

    // Get weekly summary
    const weeklyLogs = await HealthLog.find({
      user: req.user._id,
      date: { $gte: weekAgo, $lte: today }
    }).sort({ date: -1 });

    // Calculate weekly averages
    const weeklyMetrics = {
      averageMood: 0,
      averageEnergy: 0,
      averageSleepDuration: 0,
      totalSymptoms: 0,
      logCount: weeklyLogs.length
    };

    if (weeklyLogs.length > 0) {
      const moodValues = weeklyLogs.filter(log => log.mood).map(log => log.mood);
      const energyValues = weeklyLogs.filter(log => log.energyLevel).map(log => log.energyLevel);
      const sleepValues = weeklyLogs.filter(log => log.sleep?.duration).map(log => log.sleep.duration);
      const symptomCount = weeklyLogs.reduce((total, log) => total + (log.symptoms?.length || 0), 0);

      weeklyMetrics.averageMood = moodValues.length > 0 ? 
        (moodValues.reduce((sum, val) => sum + val, 0) / moodValues.length).toFixed(1) : 0;
      
      weeklyMetrics.averageEnergy = energyValues.length > 0 ? 
        (energyValues.reduce((sum, val) => sum + val, 0) / energyValues.length).toFixed(1) : 0;
      
      weeklyMetrics.averageSleepDuration = sleepValues.length > 0 ? 
        (sleepValues.reduce((sum, val) => sum + val, 0) / sleepValues.length).toFixed(1) : 0;
      
      weeklyMetrics.totalSymptoms = symptomCount;
    }

    // Get latest vital signs
    const latestVitals = await HealthLog.findOne({
      user: req.user._id,
      $or: [
        { 'vitalSigns.bloodPressure.systolic': { $exists: true } },
        { 'vitalSigns.heartRate.value': { $exists: true } },
        { 'vitalSigns.weight.value': { $exists: true } }
      ]
    }).sort({ date: -1 });

    // Transform data for frontend dashboard
    const dashboard = {
      currentStreak: weeklyLogs.length,
      currentWeight: latestVitals?.weight?.value || null,
      avgMood: weeklyMetrics.averageMood > 0 ? weeklyMetrics.averageMood : null,
      avgEnergy: weeklyMetrics.averageEnergy > 0 ? weeklyMetrics.averageEnergy : null,
      avgSleep: weeklyMetrics.averageSleepDuration > 0 ? weeklyMetrics.averageSleepDuration : null,
      totalSymptoms: weeklyMetrics.totalSymptoms,
      logCount: weeklyMetrics.logCount
    };

    res.status(200).json({
      status: 'success',
      data: {
        dashboard,
        todayLog,
        weeklyMetrics,
        latestVitals: latestVitals?.vitalSigns || null,
        streak: weeklyLogs.length // Consecutive days with logs
      }
    });
  } catch (error) {
    console.error('Get health summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch health summary'
    });
  }
});

// @route   POST /api/health-tracker/logs/:id/share
// @desc    Share health log with doctor
// @access  Private
router.post('/logs/:id/share', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({
        status: 'error',
        message: 'Doctor ID is required'
      });
    }

    const healthLog = await HealthLog.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!healthLog) {
      return res.status(404).json({
        status: 'error',
        message: 'Health log not found'
      });
    }

    // Add doctor to sharedWith array if not already present
    if (!healthLog.sharedWith.includes(doctorId)) {
      healthLog.sharedWith.push(doctorId);
      healthLog.isShared = true;
      await healthLog.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Health log shared successfully',
      data: { healthLog }
    });
  } catch (error) {
    console.error('Share health log error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to share health log'
    });
  }
});

// @route   GET /api/health-tracker/shared-logs
// @desc    Get health logs shared with current doctor
// @access  Private (Doctor only)
router.get('/shared-logs', protect, checkActive, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Doctors only.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sharedLogs = await HealthLog.find({
      sharedWith: req.user._id,
      isShared: true
    })
    .populate('user', 'firstName lastName email')
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

    const total = await HealthLog.countDocuments({
      sharedWith: req.user._id,
      isShared: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        sharedLogs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalLogs: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get shared logs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch shared logs'
    });
  }
});

module.exports = router;
