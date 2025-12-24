import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please provide a coupon code'],
        unique: true,
        uppercase: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['flat', 'percentage'],
        required: [true, 'Please provide a coupon type'],
    },
    value: {
        type: Number,
        required: [true, 'Please provide a coupon value'],
    },
    minOrderValue: {
        type: Number,
        default: 0,
    },
    maxDiscount: {
        type: Number,
        default: null, // Null means no limit for percentage
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    expiryDate: {
        type: Date,
        required: [true, 'Please provide an expiry date'],
    },
    usageLimit: {
        type: Number,
        default: null, // Null means unlimited
    },
    usedCount: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    applicableTo: {
        type: [String], // Array of User IDs or ['all']
        default: ['all'],
    },
}, { timestamps: true });

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
