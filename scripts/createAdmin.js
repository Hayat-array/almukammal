
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Update with your MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/laptop-store'; // Change to your database name

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
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

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Updating password...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Update the existing admin with new password
      await User.findOneAndUpdate(
        { email: adminEmail },
        {
          $set: {
            password: hashedPassword,
            role: 'admin',
            name: 'System Administrator'
          }
        }
      );
      
      console.log('✅ Admin password updated successfully!');
      
      // Verify the update
      const verifyAdmin = await User.findOne({ email: adminEmail });
      console.log('\n📋 Verification:');
      console.log('   Email:', verifyAdmin.email);
      console.log('   Role:', verifyAdmin.role);
      console.log('   Password exists:', !!verifyAdmin.password);
      console.log('   Password hash length:', verifyAdmin.password?.length);
      console.log('   Password starts with $2a$ or $2b$:', verifyAdmin.password?.startsWith('$2'));
      
    } else {
      // Create new admin user
      console.log('📝 Creating new admin user...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const adminUser = new User({
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
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
    console.log('\n⚠️  IMPORTANT: Change these credentials after first login!\n');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

createAdmin();
