const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        sparse: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    detailedDescription: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        required: true
    },
    comparePrice: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        default: 'placeholder.jpg'
    },
    images: [{
        type: String
    }],
    category: {
        type: String,
        default: 'Laptops'
    },
    brand: {
        type: String,
        default: ''
    },
    specs: {
        cpu: String,
        ram: String,
        storage: String,
        display: String,
        gpu: String,
        battery: String,
        weight: String,
        os: String
    },
    features: [{
        type: String
    }],
    colors: [{
        type: String
    }],
    imageColorMap: [{
        url: String,
        color: String
    }],
    warranty: {
        type: String,
        default: '1 Year Manufacturer Warranty'
    },
    stock: {
        type: Number,
        default: 0
    },
    sku: {
        type: String,
        default: ''
    },
    tags: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    ratings: {
        average: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
ProductSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);
