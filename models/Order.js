
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  product: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  image: String
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Optional for guest checkout
  },
  customerInfo: {
    fullName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    country: String,
    town: String,
    notes: String
  },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  shipping: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'processing', 'packed',
      'ready_for_shipment', 'shipped', 'in_transit',
      'out_for_delivery', 'delivered', 'cancelled', 'failed',
      'return_requested', 'returned', 'refunded'
    ],
    default: 'pending'
  },
  shipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    required: false
  },
  trackingNumber: { type: String, index: true },
  estimatedDelivery: Date,
  orderDate: Date,
  shipmentTrackingEnabled: { type: Boolean, default: true },
  deliveryOtpHash: { type: String, select: false },
  deliveryOtpExpiresAt: { type: Date },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String, default: null }
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', orderSchema);