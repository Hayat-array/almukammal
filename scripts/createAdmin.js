const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laptop-store';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  dob: Date,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  createdAt: { type: Date, default: Date.now },
});

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const adminEmail = 'admin@almukammal.com';
    const adminPassword = 'admin123';
    const adminDOB = new Date('1990-01-01'); // Default DOB for admin

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Updating password and DOB...');

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      // Update the existing admin
      await User.findOneAndUpdate(
        { email: adminEmail },
        {
          $set: {
            password: hashedPassword,
            role: 'admin',
            name: 'System Administrator',
            dob: adminDOB
          }
        }
      );

      console.log('✅ Admin updated successfully!');

    } else {
      // Create new admin user
      console.log('📝 Creating new admin user...');

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const adminUser = new User({
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        dob: adminDOB,
        role: 'admin',
        phone: '+971501234567',
        address: {
          street: 'Office Address',
          city: 'Dubai',
          state: 'Dubai',
          zipCode: '00000',
          country: 'UAE',
        },
        createdAt: new Date(),
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n🔐 Admin Login Credentials:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('   DOB: 1990-01-01 (for password reset)');
    console.log('\n⚠️  IMPORTANT: Change these credentials after first login!\n');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

createAdmin();
