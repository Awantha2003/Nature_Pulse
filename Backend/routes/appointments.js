const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { protect, restrictTo, checkActive } = require('../middleware/auth');
const { validateAppointment, validatePagination, validateMongoId, handleValidationErrors } = require('../middleware/validation');
const { sendEmail } = require('../utils/email');
const NotificationService = require('../utils/notifications');

const router = express.Router();

// @route   POST /api/appointments
// @desc    Book a new appointment
// @access  Private (Patient only)
router.post('/', protect, checkActive, restrictTo('patient'), validateAppointment, handleValidationErrors, async (req, res) => {
  try {
    const { doctor, appointmentDate, appointmentTime, reason, symptoms, type, isVirtual, location } = req.body;

    // Check if doctor exists and is verified
    const doctorDoc = await Doctor.findById(doctor).populate('user');
    if (!doctorDoc || !doctorDoc.isVerified) {
      return res.status(404).json({
        status: 'error',
        message: '👨‍⚕️ Doctor not found or not yet verified. Please select a different doctor or try again later.',
        suggestions: [
          'Choose a different doctor from the list',
          'Check back later when the doctor is verified',
          'Contact support if this issue persists'
        ]
      });
    }

    // Check if doctor is accepting new patients
    if (!doctorDoc.isAcceptingNewPatients) {
      return res.status(400).json({
        status: 'error',
        message: '🚫 Dr. ' + doctorDoc.user.firstName + ' is currently not accepting new patients. Their schedule might be full.',
        suggestions: [
          'Try booking with a different doctor',
          'Check back later when they start accepting new patients',
          'Contact the doctor directly for urgent cases'
        ]
      });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      doctor: doctor,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        status: 'error',
        message: '📅 This time slot is already booked by another patient. Please choose a different time.',
        suggestions: [
          'Select a different time slot',
          'Try booking for a different day',
          'Check the doctor\'s availability for more options'
        ]
      });
    }

    // Check if patient has conflicting appointment
    const patientConflict = await Appointment.findOne({
      patient: req.user._id,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (patientConflict) {
      return res.status(400).json({
        status: 'error',
        message: '⏰ Oops! You already have an appointment scheduled at this time. Please choose a different time slot or check your existing appointments.',
        suggestions: [
          'Try selecting a different time slot',
          'Check your existing appointments in the dashboard',
          'Consider booking for a different day'
        ]
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctor,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      reason: reason,
      symptoms: symptoms ? (Array.isArray(symptoms) ? symptoms : [symptoms]) : [],
      type: type || 'consultation',
      isVirtual: isVirtual || false,
      location: location || { type: 'clinic' },
      payment: {
        amount: doctorDoc.consultationFee
      }
    });

    // Populate appointment data
    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', populate: { path: 'user', select: 'firstName lastName email phone' } }
    ]);

    // Send notifications
    try {
      await NotificationService.sendAppointmentBookingNotification(appointment);
    } catch (notificationError) {
      console.error('Notification sending failed:', notificationError);
      // Don't fail appointment creation if notification fails
    }

    res.status(201).json({
      status: 'success',
      message: 'Appointment booked successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to book appointment'
    });
  }
});

// @route   GET /api/appointments
// @desc    Get user's appointments
// @access  Private
router.get('/', protect, checkActive, validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { status, type, startDate, endDate } = req.query;

    // Build filter based on user role
    let filter = {};
    
    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          status: 'error',
          message: 'Doctor profile not found'
        });
      }
      filter.doctor = doctor._id;
    } else if (req.user.role === 'admin') {
      // Admin can see all appointments
    } else {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Add additional filters
    if (status) {
      filter.status = status;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (startDate || endDate) {
      filter.appointmentDate = {};
      if (startDate) filter.appointmentDate.$gte = new Date(startDate);
      if (endDate) filter.appointmentDate.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(filter)
      .populate([
        { path: 'patient', select: 'firstName lastName email phone' },
        { path: 'doctor', populate: { path: 'user', select: 'firstName lastName email phone' } }
      ])
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        appointments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalAppointments: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch appointments'
    });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get('/:id', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate([
        { path: 'patient', select: 'firstName lastName email phone dateOfBirth gender' },
        { path: 'doctor', populate: { path: 'user', select: 'firstName lastName email phone' } }
      ]);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Check if user has access to this appointment
    const hasAccess = 
      appointment.patient._id.toString() === req.user._id.toString() ||
      (req.user.role === 'doctor' && appointment.doctor.user._id.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { appointment }
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch appointment'
    });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private
router.put('/:id', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate([
        { path: 'patient', select: 'firstName lastName email phone' },
        { path: 'doctor', populate: { path: 'user', select: 'firstName lastName email phone' } }
      ]);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Check if user has permission to update this appointment
    const canUpdate = 
      appointment.patient._id.toString() === req.user._id.toString() ||
      (req.user.role === 'doctor' && appointment.doctor.user._id.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';

    if (!canUpdate) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Determine allowed updates based on user role and appointment status
    const allowedUpdates = [];
    
    if (req.user.role === 'patient') {
      if (['scheduled', 'confirmed'].includes(appointment.status)) {
        allowedUpdates.push('appointmentDate', 'appointmentTime', 'reason', 'symptoms');
      }
    } else if (req.user.role === 'doctor') {
      allowedUpdates.push('status', 'notes', 'prescription', 'meetingLink');
    } else if (req.user.role === 'admin') {
      allowedUpdates.push('status', 'notes', 'prescription', 'meetingLink', 'appointmentDate', 'appointmentTime');
    }

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Validate appointment time change
    if (updates.appointmentDate || updates.appointmentTime) {
      const newDate = updates.appointmentDate || appointment.appointmentDate;
      const newTime = updates.appointmentTime || appointment.appointmentTime;

      // Check for conflicts
      const conflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctor: appointment.doctor,
        appointmentDate: new Date(newDate),
        appointmentTime: newTime,
        status: { $in: ['scheduled', 'confirmed'] }
      });

      if (conflict) {
        return res.status(400).json({
          status: 'error',
          message: 'This time slot is already booked'
        });
      }
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', populate: { path: 'user', select: 'firstName lastName email phone' } }
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Appointment updated successfully',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update appointment'
    });
  }
});

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancel appointment
// @access  Private
router.put('/:id/cancel', protect, checkActive, validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const appointment = await Appointment.findById(req.params.id)
      .populate([
        { path: 'patient', select: 'firstName lastName email phone' },
        { path: 'doctor', populate: { path: 'user', select: 'firstName lastName email phone' } }
      ]);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Check if user can cancel this appointment
    const canCancel = 
      appointment.patient._id.toString() === req.user._id.toString() ||
      (req.user.role === 'doctor' && appointment.doctor.user._id.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';

    if (!canCancel) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Check if appointment can be cancelled
    if (!appointment.canBeCancelled()) {
      return res.status(400).json({
        status: 'error',
        message: 'Appointment cannot be cancelled. Please contact support.'
      });
    }

    // Update appointment
    appointment.status = 'cancelled';
    appointment.cancellationReason = reason || 'No reason provided';
    appointment.cancelledBy = req.user._id;
    appointment.cancelledAt = new Date();

    await appointment.save();

    // Populate for response
    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email phone' },
      { path: 'doctor', populate: { path: 'user', select: 'firstName lastName email phone' } }
    ]);

    // Send cancellation notification
    try {
      await NotificationService.sendAppointmentCancellationNotification(appointment, req.user._id);
    } catch (notificationError) {
      console.error('Cancellation notification failed:', notificationError);
    }

    res.status(200).json({
      status: 'success',
      message: 'Appointment cancelled successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel appointment'
    });
  }
});

// @route   GET /api/appointments/doctor/:doctorId/availability
// @desc    Get doctor's available time slots
// @access  Private
router.get('/doctor/:doctorId/availability', protect, checkActive, validateMongoId('doctorId'), handleValidationErrors, async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        status: 'error',
        message: 'Date is required'
      });
    }

    const doctor = await Doctor.findById(req.params.doctorId).populate('user');
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    const requestedDate = new Date(date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[requestedDate.getDay()]; // Get day name
    const dayAvailability = doctor.availability[dayName];

    if (!dayAvailability || !dayAvailability.isAvailable) {
      return res.status(200).json({
        status: 'success',
        data: {
          available: false,
          message: '📅 Dr. ' + doctor.user.firstName + ' is not available on this day. Please select a different date or check their availability schedule.'
        }
      });
    }

    // Get existing appointments for this date
    const existingAppointments = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: requestedDate,
      status: { $in: ['scheduled', 'confirmed'] }
    }).select('appointmentTime');

    const bookedTimes = existingAppointments.map(apt => apt.appointmentTime);

    // Use the doctor's method to get available slots
    const allAvailableSlots = doctor.getAvailableSlots(requestedDate);
    
    // Filter out booked slots
    const availableSlots = allAvailableSlots.filter(slot => !bookedTimes.includes(slot));

    res.status(200).json({
      status: 'success',
      data: {
        available: true,
        date: requestedDate.toISOString().split('T')[0],
        availableSlots,
        doctorInfo: {
          name: doctor.user.firstName + ' ' + doctor.user.lastName,
          specialization: doctor.specialization,
          consultationFee: doctor.consultationFee
        }
      }
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch availability'
    });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment (Admin only)
// @access  Private (Admin only)
router.delete('/:id', protect, checkActive, restrictTo('admin'), validateMongoId('id'), handleValidationErrors, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete appointment'
    });
  }
});

module.exports = router;
