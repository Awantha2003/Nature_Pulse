const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor is required']
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required']
  },
  duration: {
    type: Number,
    default: 30, // in minutes
    min: [15, 'Duration must be at least 15 minutes'],
    max: [120, 'Duration cannot exceed 120 minutes']
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine'],
    default: 'consultation'
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  reason: {
    type: String,
    required: [true, 'Reason for appointment is required'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  prescription: {
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    recommendations: [String],
    followUpDate: Date,
    notes: String
  },
  payment: {
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet', 'demo_card']
    },
    transactionId: String,
    paidAt: Date
  },
  meetingLink: {
    type: String,
    default: ''
  },
  isVirtual: {
    type: Boolean,
    default: false
  },
  location: {
    type: {
      type: String,
      enum: ['clinic', 'hospital', 'virtual', 'home'],
      default: 'clinic'
    },
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push']
    },
    sentAt: Date,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed']
    }
  }],
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for appointment duration in hours
appointmentSchema.virtual('durationInHours').get(function() {
  return this.duration / 60;
});

// Virtual for appointment status color
appointmentSchema.virtual('statusColor').get(function() {
  const statusColors = {
    'scheduled': 'blue',
    'confirmed': 'green',
    'in-progress': 'orange',
    'completed': 'green',
    'cancelled': 'red',
    'no-show': 'gray'
  };
  return statusColors[this.status] || 'gray';
});

// Index for better query performance
appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ doctor: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });
appointmentSchema.index({ 'payment.status': 1 });

// Pre-save middleware to validate appointment time
appointmentSchema.pre('save', function(next) {
  // Check if appointment date is today or in the future (only compare date, not time)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const appointmentDate = new Date(this.appointmentDate);
  appointmentDate.setHours(0, 0, 0, 0); // Reset time to start of day
  
  if (appointmentDate < today) {
    return next(new Error('Appointment date cannot be in the past'));
  }
  
  // Check if appointment time is valid (basic validation)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(this.appointmentTime)) {
    return next(new Error('Invalid appointment time format'));
  }
  
  next();
});

// Static method to find appointments by date range
appointmentSchema.statics.findByDateRange = function(startDate, endDate, doctorId = null) {
  const query = {
    appointmentDate: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (doctorId) {
    query.doctor = doctorId;
  }
  
  return this.find(query).populate('patient doctor');
};

// Instance method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  appointmentDateTime.setHours(
    parseInt(this.appointmentTime.split(':')[0]),
    parseInt(this.appointmentTime.split(':')[1])
  );
  
  const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);
  
  return hoursUntilAppointment > 5 && ['scheduled', 'confirmed'].includes(this.status);
};

module.exports = mongoose.model('Appointment', appointmentSchema);
