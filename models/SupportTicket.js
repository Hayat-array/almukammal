import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  customerEmail: {
    type: String,
    required: true,
    index: true
  },
  customerName: String,
  customerPhone: String,
  orderNumber: {
    type: String,
    index: true
  },
  trackingId: {
    type: String,
    index: true
  },
  category: {
    type: String,
    enum: [
      'ORDER_DELAY',
      'ORDER_TRACKING',
      'DELIVERY_FAILED',
      'PACKAGE_DAMAGED',
      'PACKAGE_NOT_RECEIVED',
      'WRONG_PRODUCT',
      'RETURN',
      'REFUND',
      'PAYMENT',
      'ACCOUNT',
      'OTHER'
    ],
    default: 'ORDER_TRACKING',
    index: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
    index: true
  },
  subject: {
    type: String,
    required: true
  },
  messages: [{
    messageId: { type: String, default: () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` },
    senderType: {
      type: String,
      enum: ['customer', 'support_agent', 'bot', 'system'],
      required: true
    },
    senderName: { type: String, default: 'Customer Care' },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  resolutionNotes: String,
  resolvedAt: Date
}, { timestamps: true });

export default mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
