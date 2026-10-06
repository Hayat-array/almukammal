import mongoose from 'mongoose';

const deliveryAttemptSchema = new mongoose.Schema({
  attemptId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  shipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    required: true,
    index: true
  },
  trackingId: {
    type: String,
    required: true,
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  attemptNumber: {
    type: Number,
    required: true
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner'
  },
  deliveryPartnerName: String,
  outcome: {
    type: String,
    enum: ['SUCCESS', 'FAILED'],
    required: true
  },
  reason: {
    type: String,
    enum: [
      'CUSTOMER_UNAVAILABLE',
      'WRONG_ADDRESS',
      'CUSTOMER_REQUESTED_RESCHEDULE',
      'ADDRESS_NOT_SERVICEABLE',
      'PHONE_UNREACHABLE',
      'DELIVERY_REFUSED',
      'DAMAGED_PACKAGE',
      'PACKAGE_LOST',
      'WEATHER_OR_OPERATIONAL_DELAY',
      'VEHICLE_ISSUE',
      'OTHER',
      'NONE'
    ],
    default: 'NONE'
  },
  remarks: {
    type: String,
    default: ''
  },
  location: {
    lat: Number,
    lng: Number,
    accuracy: Number
  },
  photoProofUrl: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

export default mongoose.models.DeliveryAttempt || mongoose.model('DeliveryAttempt', deliveryAttemptSchema);
