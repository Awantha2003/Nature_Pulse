const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'Medical license number is required'],
    unique: true,
    trim: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true
  },
  qualifications: [{
    degree: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    }
  }],
  experience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: [0, 'Experience cannot be negative']
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: [0, 'Consultation fee cannot be negative']
  },
  languages: [{
    type: String,
    trim: true
  }],
  availability: {
    monday: {
      isAvailable: { type: Boolean, default: false },
      startTime: String,
      endTime: String,
      breakStart: String,
      breakEnd: String,
      slotDuration: { type: Number, default: 30 }, // in minutes
      maxAppointments: { type: Number, default: 20 }
    },
    tuesday: {
      isAvailable: { type: Boolean, default: false },
      startTime: String,
      endTime: String,
      breakStart: String,
      breakEnd: String,
      slotDuration: { type: Number, default: 30 },
      maxAppointments: { type: Number, default: 20 }
    },
    wednesday: {
      isAvailable: { type: Boolean, default: false },
      startTime: String,
      endTime: String,
      breakStart: String,
      breakEnd: String,
      slotDuration: { type: Number, default: 30 },
      maxAppointments: { type: Number, default: 20 }
    },
    thursday: {
      isAvailable: { type: Boolean, default: false },
      startTime: String,
      endTime: String,
      breakStart: String,
      breakEnd: String,
      slotDuration: { type: Number, default: 30 },
      maxAppointments: { type: Number, default: 20 }
    },
    friday: {
      isAvailable: { type: Boolean, default: false },
      startTime: String,
      endTime: String,
      breakStart: String,
      breakEnd: String,
      slotDuration: { type: Number, default: 30 },
      maxAppointments: { type: Number, default: 20 }
    },
    saturday: {
      isAvailable: { type: Boolean, default: false },
      startTime: String,
      endTime: String,
      breakStart: String,
      breakEnd: String,
      slotDuration: { type: Number, default: 30 },
      maxAppointments: { type: Number, default: 20 }
    },
    sunday: {
      isAvailable: { type: Boolean, default: false },
      startTime: String,
      endTime: String,
      breakStart: String,
      breakEnd: String,
      slotDuration: { type: Number, default: 30 },
      maxAppointments: { type: Number, default: 20 }
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    documentType: {
      type: String,
      enum: ['license', 'degree', 'id_proof', 'other']
    },
    documentUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalConsultations: {
    type: Number,
    default: 0
  },
  isAcceptingNewPatients: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for doctor's full name
doctorSchema.virtual('fullName', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Index for better query performance
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ isVerified: 1 });
doctorSchema.index({ 'rating.average': -1 });
doctorSchema.index({ consultationFee: 1 });

// Instance method to get available time slots for a specific date
doctorSchema.methods.getAvailableSlots = function(date) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()];
  const dayAvailability = this.availability[dayName];
  
  if (!dayAvailability || !dayAvailability.isAvailable) {
    return [];
  }

  const slots = [];
  const startTime = dayAvailability.startTime;
  const endTime = dayAvailability.endTime;
  const breakStart = dayAvailability.breakStart;
  const breakEnd = dayAvailability.breakEnd;
  const slotDuration = dayAvailability.slotDuration || 30;

  // Convert time to minutes for easier calculation
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const breakStartMinutes = breakStart ? timeToMinutes(breakStart) : null;
  const breakEndMinutes = breakEnd ? timeToMinutes(breakEnd) : null;

  // Generate time slots
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
    const timeSlot = minutesToTime(minutes);
    
    // Skip break time
    if (breakStartMinutes && breakEndMinutes && 
        minutes >= breakStartMinutes && minutes < breakEndMinutes) {
      continue;
    }

    slots.push(timeSlot);
  }

  return slots;
};

// Instance method to check if doctor is available on a specific date and time
doctorSchema.methods.isAvailableAt = function(date, time) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()];
  const dayAvailability = this.availability[dayName];
  
  if (!dayAvailability || !dayAvailability.isAvailable) {
    return false;
  }

  const availableSlots = this.getAvailableSlots(date);
  return availableSlots.includes(time);
};

// Pre-save middleware to update user role
doctorSchema.pre('save', async function(next) {
  if (this.isNew) {
    await mongoose.model('User').findByIdAndUpdate(
      this.user,
      { role: 'doctor' }
    );
  }
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema);
