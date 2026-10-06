# 🗄️ AL MUKAMMAL — Delivery & Logistics Data Models

## 1. Overview
The database schema extends existing MongoDB models (`Order`, `User`) and introduces dedicated logistics collections (`Shipment`, `ShipmentEvent`, `DeliveryPartner`, `DeliveryAttempt`, `SupportTicket`).

---

## 2. Model Extensions

### 1. `models/Order.js` (Additive Extension)
Existing properties are preserved. New fields added:
```javascript
// Extended Order Schema Additions
{
  // Links to dedicated shipment document
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  trackingNumber: { type: String, index: true },
  
  // Extended lifecycle statuses while retaining legacy enum compat
  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'processing', 'packed',
      'ready_for_shipment', 'shipped', 'in_transit',
      'out_for_delivery', 'delivered', 'cancelled', 'failed',
      'return_requested', 'returned', 'refunded'
    ],
    default: 'pending',
    index: true
  },
  
  // Flag indicating modern logistics tracking is active
  shipmentTrackingEnabled: { type: Boolean, default: true },
  
  // Delivery proof OTP (hashedHMAC SHA-256)
  deliveryOtpHash: { type: String, select: false },
  deliveryOtpExpiresAt: { type: Date }
}
```

### 2. `models/User.js` (Role Extension)
```javascript
role: {
  type: String,
  enum: ['user', 'admin', 'manager', 'delivery_partner', 'support_agent', 'operations'],
  default: 'user'
}
```

---

## 3. Dedicated Logistics Collections

### 3. `models/Shipment.js`
```javascript
{
  trackingId: { type: String, required: true, unique: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  status: {
    type: String,
    enum: [
      'CREATED', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'PICKED_UP',
      'IN_TRANSIT', 'ARRIVED_AT_DESTINATION', 'OUT_FOR_DELIVERY',
      'DELIVERY_ATTEMPTED', 'DELIVERED', 'UNDELIVERED', 'RESCHEDULED',
      'RETURN_TO_ORIGIN', 'RETURNED'
    ],
    default: 'CREATED',
    index: true
  },
  
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner' },
  
  origin: {
    hubName: { type: String, default: 'Al Mukammal Central Hub - Deira' },
    address: { type: String, default: 'Al Sabkha Road, Naif, Deira, Dubai, UAE' },
    coordinates: { lat: Number, lng: Number }
  },
  
  destination: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    area: String,
    coordinates: { lat: Number, lng: Number },
    notes: String
  },
  
  currentLocation: {
    lat: Number,
    lng: Number,
    accuracy: Number,
    heading: Number,
    speed: Number,
    updatedAt: Date
  },
  
  estimatedDeliveryWindow: {
    from: Date,
    to: Date,
    etaText: String
  },
  
  deliveryAttemptsCount: { type: Number, default: 0 },
  maxDeliveryAttempts: { type: Number, default: 3 },
  
  proofOfDelivery: {
    method: { type: String, enum: ['OTP', 'SIGNATURE', 'PHOTO', 'STAFF_OVERRIDE'] },
    verifiedAt: Date,
    receivedBy: String,
    signatureUrl: String,
    photoUrl: String
  },
  
  rescheduleHistory: [{
    requestedDate: Date,
    timeSlot: String,
    reason: String,
    requestedBy: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  activeException: {
    code: String,
    reason: String,
    timestamp: Date,
    resolved: Boolean
  }
}
```

### 4. `models/ShipmentEvent.js` (Append-Only Event Ledger)
```javascript
{
  eventId: { type: String, required: true, unique: true },
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  status: { type: String, required: true },
  previousStatus: { type: String },
  actorType: { type: String, enum: ['customer', 'delivery_partner', 'admin', 'system'] },
  actorId: String,
  location: {
    name: String,
    lat: Number,
    lng: Number
  },
  title: String,
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now, index: true }
}
```

### 5. `models/DeliveryPartner.js`
```javascript
{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  partnerCode: { type: String, required: true, unique: true },
  name: String,
  phone: String,
  vehicleType: { type: String, enum: ['MOTORBIKE', 'VAN', 'CAR'], default: 'VAN' },
  vehiclePlate: String,
  assignedZones: [String],
  isOnline: { type: Boolean, default: false },
  currentStatus: { type: String, enum: ['AVAILABLE', 'ON_DELIVERY', 'OFFLINE'], default: 'OFFLINE' },
  currentLocation: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [lng, lat] for 2dsphere
    updatedAt: Date
  },
  activeDeliveriesCount: { type: Number, default: 0 },
  completedDeliveriesCount: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 }
}
```

### 6. `models/SupportTicket.js`
```javascript
{
  ticketId: { type: String, required: true, unique: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  category: {
    type: String,
    enum: [
      'ORDER_DELAY', 'ORDER_TRACKING', 'DELIVERY_FAILED', 'PACKAGE_DAMAGED',
      'PACKAGE_NOT_RECEIVED', 'WRONG_PRODUCT', 'RETURN', 'REFUND', 'PAYMENT', 'OTHER'
    ],
    default: 'ORDER_TRACKING'
  },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
  subject: String,
  messages: [{
    senderType: { type: String, enum: ['customer', 'support_agent', 'bot', 'system'] },
    senderName: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}
```
