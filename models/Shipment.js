import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    required: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  status: {
    type: String,
    enum: [
      'CREATED',
      'ASSIGNMENT_PENDING',
      'ASSIGNED',
      'PICKED_UP',
      'IN_TRANSIT',
      'ARRIVED_AT_DESTINATION',
      'OUT_FOR_DELIVERY',
      'DELIVERY_ATTEMPTED',
      'DELIVERED',
      'UNDELIVERED',
      'RESCHEDULED',
      'RETURN_TO_ORIGIN',
      'RETURNED'
    ],
    default: 'CREATED',
    index: true
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner',
    required: false
  },
  deliveryPartnerName: { type: String, default: '' },
  deliveryPartnerPhone: { type: String, default: '' },
  
  origin: {
    hubName: { type: String, default: 'Al Mukammal Central Showroom Hub' },
    address: { type: String, default: 'Al Sabkha Road, Naif, Deira, Dubai, United Arab Emirates' },
    city: { type: String, default: 'Dubai' },
    coordinates: {
      lat: { type: Number, default: 25.2723 },
      lng: { type: Number, default: 55.3021 }
    }
  },
  
  destination: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, default: 'Dubai' },
    area: { type: String, default: '' },
    notes: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: 25.2048 },
      lng: { type: Number, default: 55.2708 }
    }
  },
  
  currentLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    accuracy: { type: Number, default: null },
    heading: { type: Number, default: null },
    speed: { type: Number, default: null },
    updatedAt: { type: Date, default: null }
  },
  
  estimatedDeliveryWindow: {
    from: { type: Date, default: null },
    to: { type: Date, default: null },
    etaText: { type: String, default: 'Pending dispatch schedule' }
  },
  
  deliveryAttemptsCount: { type: Number, default: 0 },
  maxDeliveryAttempts: { type: Number, default: 3 },
  
  proofOfDelivery: {
    method: {
      type: String,
      enum: ['OTP', 'SIGNATURE', 'PHOTO', 'STAFF_OVERRIDE', null],
      default: null
    },
    verifiedAt: { type: Date, default: null },
    receivedBy: { type: String, default: '' },
    signatureUrl: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    remarks: { type: String, default: '' }
  },
  
  rescheduleHistory: [{
    requestedDate: Date,
    timeSlot: String,
    reason: String,
    requestedBy: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  activeException: {
    code: { type: String, default: null },
    reason: { type: String, default: null },
    timestamp: { type: Date, default: null },
    resolved: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Composite indexes for high-throughput queries
shipmentSchema.index({ status: 1, deliveryPartner: 1 });
shipmentSchema.index({ customer: 1, createdAt: -1 });

export default mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);
