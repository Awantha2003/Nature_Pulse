const Notification = require('../models/Notification');
const { sendEmail } = require('./email');

class NotificationService {
  // Send appointment booking notification
  static async sendAppointmentBookingNotification(appointment) {
    try {
      // Send to patient
      await Notification.createAppointmentNotification(
        appointment.patient._id,
        'appointment_booking',
        {
          appointmentId: appointment._id,
          doctorId: appointment.doctor._id,
          doctorName: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
          date: appointment.appointmentDate.toDateString(),
          time: appointment.appointmentTime,
          amount: appointment.payment.amount
        }
      );

      // Send to doctor
      await Notification.createAppointmentNotification(
        appointment.doctor.user._id,
        'appointment_booking',
        {
          appointmentId: appointment._id,
          patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          date: appointment.appointmentDate.toDateString(),
          time: appointment.appointmentTime,
          amount: appointment.payment.amount
        }
      );

      // Send email notifications
      await this.sendEmailNotification(appointment, 'booking');
    } catch (error) {
      console.error('Error sending appointment booking notification:', error);
    }
  }

  // Send appointment confirmation notification
  static async sendAppointmentConfirmationNotification(appointment) {
    try {
      await Notification.createAppointmentNotification(
        appointment.patient._id,
        'appointment_confirmation',
        {
          appointmentId: appointment._id,
          doctorId: appointment.doctor._id,
          doctorName: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
          date: appointment.appointmentDate.toDateString(),
          time: appointment.appointmentTime
        }
      );

      await this.sendEmailNotification(appointment, 'confirmation');
    } catch (error) {
      console.error('Error sending appointment confirmation notification:', error);
    }
  }

  // Send appointment cancellation notification
  static async sendAppointmentCancellationNotification(appointment, cancelledBy) {
    try {
      const isPatient = cancelledBy.toString() === appointment.patient._id.toString();
      const recipientId = isPatient ? appointment.doctor.user._id : appointment.patient._id;
      const recipientName = isPatient ? 
        `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}` :
        `${appointment.patient.firstName} ${appointment.patient.lastName}`;

      await Notification.createAppointmentNotification(
        recipientId,
        'appointment_cancellation',
        {
          appointmentId: appointment._id,
          doctorName: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
          patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          date: appointment.appointmentDate.toDateString(),
          time: appointment.appointmentTime,
          cancelledBy: isPatient ? 'patient' : 'doctor',
          reason: appointment.cancellationReason
        }
      );

      await this.sendEmailNotification(appointment, 'cancellation');
    } catch (error) {
      console.error('Error sending appointment cancellation notification:', error);
    }
  }

  // Send appointment reminder notification
  static async sendAppointmentReminderNotification(appointment) {
    try {
      await Notification.createAppointmentNotification(
        appointment.patient._id,
        'appointment_reminder',
        {
          appointmentId: appointment._id,
          doctorId: appointment.doctor._id,
          doctorName: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
          date: appointment.appointmentDate.toDateString(),
          time: appointment.appointmentTime
        }
      );

      await this.sendEmailNotification(appointment, 'reminder');
    } catch (error) {
      console.error('Error sending appointment reminder notification:', error);
    }
  }

  // Send payment success notification
  static async sendPaymentSuccessNotification(appointment) {
    try {
      await Notification.create({
        user: appointment.patient._id,
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Your payment of $${appointment.payment.amount} for the appointment with Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName} has been processed successfully.`,
        data: {
          appointmentId: appointment._id,
          amount: appointment.payment.amount,
          transactionId: appointment.payment.transactionId
        },
        channels: [
          { type: 'in_app', sent: true, sentAt: new Date(), status: 'delivered' },
          { type: 'email', status: 'pending' }
        ]
      });

      await this.sendEmailNotification(appointment, 'payment_success');
    } catch (error) {
      console.error('Error sending payment success notification:', error);
    }
  }

  // Send payment failed notification
  static async sendPaymentFailedNotification(appointment, error) {
    try {
      await Notification.create({
        user: appointment.patient._id,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `Your payment for the appointment with Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName} has failed. Please try again.`,
        data: {
          appointmentId: appointment._id,
          amount: appointment.payment.amount,
          error: error.message
        },
        channels: [
          { type: 'in_app', sent: true, sentAt: new Date(), status: 'delivered' },
          { type: 'email', status: 'pending' }
        ]
      });

      await this.sendEmailNotification(appointment, 'payment_failed');
    } catch (error) {
      console.error('Error sending payment failed notification:', error);
    }
  }

  // Send email notification
  static async sendEmailNotification(appointment, type) {
    try {
      const templates = {
        booking: {
          subject: 'Appointment Booked Successfully',
          template: 'appointmentBooking'
        },
        confirmation: {
          subject: 'Appointment Confirmed',
          template: 'appointmentConfirmation'
        },
        cancellation: {
          subject: 'Appointment Cancelled',
          template: 'appointmentCancellation'
        },
        reminder: {
          subject: 'Appointment Reminder',
          template: 'appointmentReminder'
        },
        payment_success: {
          subject: 'Payment Successful',
          template: 'paymentSuccess'
        },
        payment_failed: {
          subject: 'Payment Failed',
          template: 'paymentFailed'
        }
      };

      const template = templates[type];
      if (!template) return;

      const emailData = {
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        doctorName: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        appointmentDate: appointment.appointmentDate.toDateString(),
        appointmentTime: appointment.appointmentTime,
        appointmentType: appointment.type,
        reason: appointment.reason,
        amount: appointment.payment.amount,
        meetingLink: appointment.meetingLink,
        cancellationReason: appointment.cancellationReason
      };

      await sendEmail({
        email: appointment.patient.email,
        subject: template.subject,
        template: template.template,
        data: emailData
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Schedule appointment reminders
  static async scheduleAppointmentReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const appointments = await Appointment.find({
        appointmentDate: {
          $gte: tomorrow,
          $lt: dayAfter
        },
        status: { $in: ['scheduled', 'confirmed'] }
      }).populate('patient doctor.user');

      for (const appointment of appointments) {
        // Schedule reminder for 24 hours before
        const reminderTime = new Date(appointment.appointmentDate);
        reminderTime.setHours(
          parseInt(appointment.appointmentTime.split(':')[0]) - 24,
          parseInt(appointment.appointmentTime.split(':')[1])
        );

        if (reminderTime > new Date()) {
          await Notification.create({
            user: appointment.patient._id,
            type: 'appointment_reminder',
            title: 'Appointment Reminder',
            message: `Reminder: You have an appointment with Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName} tomorrow at ${appointment.appointmentTime}.`,
            data: {
              appointmentId: appointment._id,
              doctorId: appointment.doctor._id,
              date: appointment.appointmentDate.toDateString(),
              time: appointment.appointmentTime
            },
            scheduledFor: reminderTime,
            channels: [
              { type: 'in_app', status: 'pending' },
              { type: 'email', status: 'pending' },
              { type: 'sms', status: 'pending' }
            ]
          });
        }
      }
    } catch (error) {
      console.error('Error scheduling appointment reminders:', error);
    }
  }

  // Get user notifications
  static async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const notifications = await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments({ user: userId });
      const unreadCount = await Notification.countDocuments({ 
        user: userId, 
        isRead: false 
      });

      return {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          unreadCount,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        user: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.markAsRead();
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  static async markAllNotificationsAsRead(userId) {
    try {
      await Notification.updateMany(
        { user: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
