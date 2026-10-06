import mongoose from 'mongoose';

const deliveryPartnerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  partnerCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['MOTORBIKE', 'VAN', 'CAR'],
    default: 'VAN'
  },
  vehiclePlate: {
    type: String,
    default: ''
  },
  assignedZones: {
    type: [String],
    default: ['Deira', 'Bur Dubai', 'Downtown', 'Business Bay', 'Sharjah']
  },
  isOnline: {
    type: Boolean,
    default: false,
    index: true
  },
  currentStatus: {
    type: String,
    enum: ['AVAILABLE', 'ON_DELIVERY', 'OFFLINE'],
    default: 'OFFLINE',
    index: true
  },
  currentLocation: {
    lat: { type: Number, default: 25.2723 },
    lng: { type: Number, default: 55.3021 },
    accuracy: { type: Number, default: 10 },
    updatedAt: { type: Date, default: Date.now }
  },
  activeDeliveriesCount: {
    type: Number,
    default: 0
  },
  completedDeliveriesCount: {
    type: Number,
    default: 0
  },
  failedDeliveriesCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 5.0
  }
}, { timestamps: true });

export default mongoose.models.DeliveryPartner || mongoose.model('DeliveryPartner', deliveryPartnerSchema);
