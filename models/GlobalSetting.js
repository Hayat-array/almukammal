import mongoose from 'mongoose';

const GlobalSettingSchema = new mongoose.Schema({
    delivery: {
        type: {
            type: String,
            enum: ['flat', 'amount-based', 'free', 'distance-based'], // distance-based placeholder for future
            default: 'flat',
        },
        baseCost: {
            type: Number,
            default: 20,
        },
        freeDeliveryThreshold: {
            type: Number,
            default: 5000,
        },
        isActive: {
            type: Boolean,
            default: true,
        }
    },
    store: {
        isOpen: {
            type: Boolean,
            default: true,
        },
        closeMessage: {
            type: String,
            default: 'Our store is currently closed for maintenance. Please check back later.',
        },
        operatingHours: {
            enabled: { type: Boolean, default: false },
            start: { type: String, default: '09:00' },
            end: { type: String, default: '22:00' }
        },
        minOrderValue: {
            type: Number,
            default: 0,
        },
        maxOrderLimit: {
            type: Number,
            default: 0, // 0 means no limit
        }
    },
    blockedUsers: {
        type: [String], // Array of User emails or IDs
        default: [],
    }
}, { timestamps: true });

// Ensure only one settings document exists usually, but schema supports it.
export default mongoose.models.GlobalSetting || mongoose.model('GlobalSetting', GlobalSettingSchema);
