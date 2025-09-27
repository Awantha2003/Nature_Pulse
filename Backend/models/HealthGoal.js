const mongoose = require('mongoose');

const healthGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [200, 'Goal title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Goal category is required'],
    enum: [
      'weight_management',
      'fitness',
      'nutrition',
      'sleep',
      'mental_health',
      'medication_adherence',
      'symptom_management',
      'vital_signs',
      'lifestyle',
      'other'
    ]
  },
  type: {
    type: String,
    required: [true, 'Goal type is required'],
    enum: ['increase', 'decrease', 'maintain', 'achieve', 'track']
  },
  targetMetric: {
    name: {
      type: String,
      required: [true, 'Target metric name is required']
    },
    unit: {
      type: String,
      required: [true, 'Target metric unit is required']
    },
    targetValue: {
      type: Number,
      required: [true, 'Target value is required']
    },
    currentValue: {
      type: Number,
      default: 0
    }
  },
  timeframe: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    duration: {
      type: Number, // in days
      required: [true, 'Duration is required']
    }
  },
  milestones: [{
    title: {
      type: String,
      required: true
    },
    targetValue: {
      type: Number,
      required: true
    },
    achieved: {
      type: Boolean,
      default: false
    },
    achievedDate: Date,
    description: String
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    streak: {
      type: Number,
      default: 0
    },
    bestStreak: {
      type: Number,
      default: 0
    }
  },
  reminders: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    time: String, // HH:MM format
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  sharing: {
    isShared: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  notes: [{
    date: {
      type: Date,
      default: Date.now
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Note cannot exceed 500 characters']
    },
    type: {
      type: String,
      enum: ['progress', 'milestone', 'challenge', 'achievement', 'general'],
      default: 'general'
    }
  }],
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days remaining
healthGoalSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const endDate = new Date(this.timeframe.endDate);
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for days elapsed
healthGoalSchema.virtual('daysElapsed').get(function() {
  const now = new Date();
  const startDate = new Date(this.timeframe.startDate);
  const diffTime = now - startDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for completion status
healthGoalSchema.virtual('isOverdue').get(function() {
  return this.status === 'active' && new Date() > new Date(this.timeframe.endDate);
});

// Index for better query performance
healthGoalSchema.index({ user: 1, status: 1 });
healthGoalSchema.index({ user: 1, category: 1 });
healthGoalSchema.index({ 'timeframe.endDate': 1 });
healthGoalSchema.index({ status: 1 });

// Pre-save middleware to calculate progress
healthGoalSchema.pre('save', function(next) {
  if (this.targetMetric.currentValue !== undefined && this.targetMetric.targetValue !== undefined) {
    let progressPercentage = 0;
    
    switch (this.type) {
      case 'increase':
        progressPercentage = Math.min(100, (this.targetMetric.currentValue / this.targetMetric.targetValue) * 100);
        break;
      case 'decrease':
        // For decrease goals, we need to know the starting value
        // This would need to be tracked separately or calculated from health logs
        progressPercentage = Math.min(100, ((this.targetMetric.targetValue - this.targetMetric.currentValue) / this.targetMetric.targetValue) * 100);
        break;
      case 'maintain':
        // For maintain goals, progress is based on consistency
        progressPercentage = this.progress.percentage; // Keep existing or calculate based on consistency
        break;
      case 'achieve':
        progressPercentage = this.targetMetric.currentValue >= this.targetMetric.targetValue ? 100 : 0;
        break;
      case 'track':
        // For tracking goals, progress is based on data entry consistency
        progressPercentage = this.progress.percentage;
        break;
    }
    
    this.progress.percentage = Math.round(progressPercentage);
    
    // Update status based on progress
    if (this.progress.percentage >= 100 && this.status === 'active') {
      this.status = 'completed';
    }
  }
  
  next();
});

// Static method to get user's goal statistics
healthGoalSchema.statics.getUserGoalStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalGoals: { $sum: 1 },
        activeGoals: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedGoals: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageProgress: { $avg: '$progress.percentage' },
        overdueGoals: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'active'] },
                  { $gt: ['$$NOW', '$timeframe.endDate'] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

// Static method to get goals by category
healthGoalSchema.statics.getGoalsByCategory = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageProgress: { $avg: '$progress.percentage' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('HealthGoal', healthGoalSchema);
