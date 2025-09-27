const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/naturepulse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const updateDoctorsAvailability = async () => {
  try {
    console.log('Updating doctors without availability data...');
    
    // Find doctors without availability data
    const doctorsWithoutAvailability = await Doctor.find({
      $or: [
        { availability: { $exists: false } },
        { availability: null },
        { availability: {} }
      ]
    });

    console.log(`Found ${doctorsWithoutAvailability.length} doctors without availability data`);

    const defaultAvailability = {
      monday: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 30 },
      tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 30 },
      wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 30 },
      thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 30 },
      friday: { isAvailable: true, startTime: '09:00', endTime: '17:00', slotDuration: 30 },
      saturday: { isAvailable: false, startTime: '09:00', endTime: '17:00', slotDuration: 30 },
      sunday: { isAvailable: false, startTime: '09:00', endTime: '17:00', slotDuration: 30 }
    };

    // Update each doctor
    for (const doctor of doctorsWithoutAvailability) {
      await Doctor.findByIdAndUpdate(doctor._id, {
        availability: defaultAvailability
      });
      console.log(`Updated availability for doctor: ${doctor._id}`);
    }

    console.log('All doctors updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating doctors:', error);
    process.exit(1);
  }
};

updateDoctorsAvailability();
