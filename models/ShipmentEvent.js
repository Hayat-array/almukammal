import mongoose from 'mongoose';

const shipmentEventSchema = new mongoose.Schema({
  eventId: {
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
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    index: true
  },
  previousStatus: {
    type: String,
    default: null
  },
  actorType: {
    type: String,
    enum: ['customer', 'delivery_partner', 'admin', 'operations', 'system'],
    default: 'system'
  },
  actorId: {
    type: String,
    default: null
  },
  actorName: {
    type: String,
    default: ''
  },
  location: {
    name: { type: String, default: 'Dubai, UAE' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Immutable append-only
});

shipmentEventSchema.index({ shipment: 1, createdAt: 1 });
shipmentEventSchema.index({ trackingId: 1, createdAt: 1 });

export default mongoose.models.ShipmentEvent || mongoose.model('ShipmentEvent', shipmentEventSchema);
