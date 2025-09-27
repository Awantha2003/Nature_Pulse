const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config({ path: './config.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Create admin user
const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@naturepulse.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@naturepulse.com');
      console.log('Password: admin123');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const admin = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@naturepulse.com',
      password: hashedPassword,
      phone: '+1234567890',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'other',
      address: {
        street: '123 Admin Street',
        city: 'Admin City',
        state: 'Admin State',
        zipCode: '12345',
        country: 'Admin Country'
      },
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      lastLogin: new Date()
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@naturepulse.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 User ID:', admin._id);
    console.log('👤 Role: admin');
    console.log('');
    console.log('You can now login to the admin panel using these credentials.');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
};

// Main function
const main = async () => {
  console.log('🚀 Starting admin seeding process...');
  console.log('');
  
  await connectDB();
  await createAdmin();
  
  console.log('');
  console.log('✅ Admin seeding process completed!');
  console.log('You can now close this process.');
  
  // Close database connection
  await mongoose.connection.close();
  process.exit(0);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run the main function
main();
