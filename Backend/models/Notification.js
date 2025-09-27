const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['appointment_booking', 'appointment_confirmation', 'appointment_cancellation', 'appointment_reminder', 'payment_success', 'payment_failed', 'appointment_reschedule'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  data: {
    appointmentId: mongoose.Schema.Types.ObjectId,
    doctorId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    date: Date,
    time: String,
    // Additional metadata
    metadata: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  channels: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'in_app'],
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending'
    },
    error: String
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  scheduledFor: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ createdAt: -1 });

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Static method to create appointment notification
notificationSchema.statics.createAppointmentNotification = async function(userId, type, appointmentData) {
  const notificationTemplates = {
    appointment_booking: {
      title: 'Appointment Booked',
      message: `Your appointment with Dr. ${appointmentData.doctorName} has been booked for ${appointmentData.date} at ${appointmentData.time}.`
    },
    appointment_confirmation: {
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${appointmentData.doctorName} on ${appointmentData.date} at ${appointmentData.time} has been confirmed.`
    },
    appointment_cancellation: {
      title: 'Appointment Cancelled',
      message: `Your appointment with Dr. ${appointmentData.doctorName} on ${appointmentData.date} at ${appointmentData.time} has been cancelled.`
    },
    appointment_reminder: {
      title: 'Appointment Reminder',
      message: `Reminder: You have an appointment with Dr. ${appointmentData.doctorName} tomorrow at ${appointmentData.time}.`
    },
    appointment_reschedule: {
      title: 'Appointment Rescheduled',
      message: `Your appointment with Dr. ${appointmentData.doctorName} has been rescheduled to ${appointmentData.date} at ${appointmentData.time}.`
    }
  };

  const template = notificationTemplates[type];
  if (!template) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  return await this.create({
    user: userId,
    type,
    title: template.title,
    message: template.message,
    data: appointmentData,
    channels: [
      { type: 'in_app', sent: true, sentAt: new Date(), status: 'delivered' },
      { type: 'email', status: 'pending' },
      { type: 'sms', status: 'pending' }
    ]
  });
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method to send via specific channel
notificationSchema.methods.sendViaChannel = async function(channelType) {
  const channel = this.channels.find(c => c.type === channelType);
  if (!channel) {
    throw new Error(`Channel ${channelType} not found`);
  }

  try {
    // Here you would integrate with actual email/SMS services
    // For now, we'll just mark as sent
    channel.sent = true;
    channel.sentAt = new Date();
    channel.status = 'sent';
    
    await this.save();
    return true;
  } catch (error) {
    channel.status = 'failed';
    channel.error = error.message;
    await this.save();
    throw error;
  }
};

module.exports = mongoose.model('Notification', notificationSchema);
