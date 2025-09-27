const mongoose = require('mongoose');

const healthLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  vitalSigns: {
    bloodPressure: {
      systolic: {
        type: Number,
        min: [50, 'Systolic pressure must be at least 50'],
        max: [250, 'Systolic pressure cannot exceed 250']
      },
      diastolic: {
        type: Number,
        min: [30, 'Diastolic pressure must be at least 30'],
        max: [150, 'Diastolic pressure cannot exceed 150']
      },
      unit: {
        type: String,
        default: 'mmHg'
      }
    },
    heartRate: {
      value: {
        type: Number,
        min: [30, 'Heart rate must be at least 30'],
        max: [220, 'Heart rate cannot exceed 220']
      },
      unit: {
        type: String,
        default: 'bpm'
      }
    },
    temperature: {
      value: {
        type: Number,
        min: [80, 'Temperature must be at least 80°F'],
        max: [115, 'Temperature cannot exceed 115°F']
      },
      unit: {
        type: String,
        default: '°F'
      }
    },
    weight: {
      value: {
        type: Number,
        min: [20, 'Weight must be at least 20 lbs'],
        max: [1000, 'Weight cannot exceed 1000 lbs']
      },
      unit: {
        type: String,
        default: 'lbs'
      }
    },
    height: {
      value: {
        type: Number,
        min: [24, 'Height must be at least 24 inches'],
        max: [96, 'Height cannot exceed 96 inches']
      },
      unit: {
        type: String,
        default: 'inches'
      }
    },
    bloodSugar: {
      value: {
        type: Number,
        min: [50, 'Blood sugar must be at least 50'],
        max: [500, 'Blood sugar cannot exceed 500']
      },
      unit: {
        type: String,
        default: 'mg/dL'
      },
      type: {
        type: String,
        enum: ['fasting', 'post-meal', 'random'],
        default: 'random'
      }
    }
  },
  symptoms: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    },
    duration: {
      type: String,
      enum: ['minutes', 'hours', 'days', 'weeks'],
      required: true
    },
    description: {
      type: String,
      maxlength: [200, 'Symptom description cannot exceed 200 characters']
    }
  }],
  mood: {
    type: Number,
    min: 1,
    max: 10,
    description: 'Mood scale from 1 (very poor) to 10 (excellent)'
  },
  energyLevel: {
    type: Number,
    min: 1,
    max: 10,
    description: 'Energy level from 1 (very low) to 10 (very high)'
  },
  sleep: {
    duration: {
      type: Number,
      min: [0, 'Sleep duration cannot be negative'],
      max: [24, 'Sleep duration cannot exceed 24 hours']
    },
    quality: {
      type: Number,
      min: 1,
      max: 10,
      description: 'Sleep quality from 1 (very poor) to 10 (excellent)'
    },
    bedtime: String,
    wakeTime: String
  },
  exercise: {
    type: {
      type: String,
      enum: ['cardio', 'strength', 'yoga', 'walking', 'running', 'cycling', 'swimming', 'other']
    },
    duration: {
      type: Number,
      min: [0, 'Exercise duration cannot be negative'],
      max: [480, 'Exercise duration cannot exceed 8 hours']
    },
    intensity: {
      type: String,
      enum: ['low', 'moderate', 'high']
    },
    description: String
  },
  nutrition: {
    meals: [{
      type: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack']
      },
      time: String,
      description: String,
      calories: Number
    }],
    waterIntake: {
      value: {
        type: Number,
        min: [0, 'Water intake cannot be negative'],
        max: [200, 'Water intake cannot exceed 200 oz']
      },
      unit: {
        type: String,
        default: 'oz'
      }
    },
    supplements: [{
      name: String,
      dosage: String,
      time: String
    }]
  },
  medications: [{
    name: {
      type: String,
      required: true
    },
    dosage: String,
    time: String,
    taken: {
      type: Boolean,
      default: false
    },
    sideEffects: [String]
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for BMI calculation
healthLogSchema.virtual('bmi').get(function() {
  if (this.vitalSigns.weight && this.vitalSigns.height) {
    const weightInKg = this.vitalSigns.weight.value * 0.453592; // Convert lbs to kg
    const heightInM = this.vitalSigns.height.value * 0.0254; // Convert inches to meters
    return (weightInKg / (heightInM * heightInM)).toFixed(1);
  }
  return null;
});

// Virtual for blood pressure category
healthLogSchema.virtual('bloodPressureCategory').get(function() {
  if (!this.vitalSigns.bloodPressure.systolic || !this.vitalSigns.bloodPressure.diastolic) {
    return null;
  }
  
  const systolic = this.vitalSigns.bloodPressure.systolic;
  const diastolic = this.vitalSigns.bloodPressure.diastolic;
  
  if (systolic < 120 && diastolic < 80) return 'Normal';
  if (systolic < 130 && diastolic < 80) return 'Elevated';
  if (systolic < 140 || diastolic < 90) return 'High Blood Pressure Stage 1';
  if (systolic < 180 || diastolic < 120) return 'High Blood Pressure Stage 2';
  return 'Hypertensive Crisis';
});

// Index for better query performance
healthLogSchema.index({ user: 1, date: -1 });
healthLogSchema.index({ date: -1 });
healthLogSchema.index({ 'symptoms.name': 1 });
healthLogSchema.index({ isShared: 1 });

// Pre-save middleware to validate data
healthLogSchema.pre('save', function(next) {
  // Validate blood pressure
  if (this.vitalSigns.bloodPressure.systolic && this.vitalSigns.bloodPressure.diastolic) {
    if (this.vitalSigns.bloodPressure.systolic <= this.vitalSigns.bloodPressure.diastolic) {
      return next(new Error('Systolic pressure must be higher than diastolic pressure'));
    }
  }
  
  // Validate sleep duration
  if (this.sleep.duration && this.sleep.duration > 24) {
    return next(new Error('Sleep duration cannot exceed 24 hours'));
  }
  
  next();
});

// Static method to get health trends
healthLogSchema.statics.getHealthTrends = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        avgBloodPressure: {
          $avg: {
            $add: [
              '$vitalSigns.bloodPressure.systolic',
              '$vitalSigns.bloodPressure.diastolic'
            ]
          }
        },
        avgHeartRate: { $avg: '$vitalSigns.heartRate.value' },
        avgWeight: { $avg: '$vitalSigns.weight.value' },
        avgMood: { $avg: '$mood' },
        avgEnergyLevel: { $avg: '$energyLevel' },
        avgSleepDuration: { $avg: '$sleep.duration' },
        avgSleepQuality: { $avg: '$sleep.quality' }
      }
    }
  ]);
};

module.exports = mongoose.model('HealthLog', healthLogSchema);
