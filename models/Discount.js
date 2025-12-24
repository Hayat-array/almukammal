import mongoose from 'mongoose';

const DiscountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a discount name'],
        trim: true,
    },
    type: {
        type: String,
        enum: ['product', 'category', 'site-wide'],
        required: true,
    },
    target: {
        type: String,
        // For 'product', this is the Product ID
        // For 'category', this is the Category Name
        // For 'site-wide', this can be null or ignored
        default: null,
    },
    value: {
        type: Number,
        required: true,
    },
    valueType: {
        type: String,
        enum: ['flat', 'percentage'],
        default: 'percentage',
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

export default mongoose.models.Discount || mongoose.model('Discount', DiscountSchema);
