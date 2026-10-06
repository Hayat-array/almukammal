
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required'],
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager', 'delivery_partner', 'support_agent', 'operations'],
    default: 'user',
  },
  phone: {
    type: String,
  },
  address: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  savedAddresses: [{
    label: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: Boolean,
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  emailVerified: {
    type: Boolean,
    default: false,
  },
  verificationMethod: {
    type: String,
    enum: ['otp_smtp', 'legacy_migrated', 'admin_provisioned', null],
    default: null,
  },
  verificationSource: {
    type: String,
    enum: ['email_otp', 'legacy', 'admin', null],
    default: null,
  },
  verificationTimestamp: {
    type: Date,
    default: null,
  },
  resetToken: String,
  resetTokenExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
UserSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
