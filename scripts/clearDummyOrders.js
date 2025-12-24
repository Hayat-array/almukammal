const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laptop-store';

// Order Schema (same as in model)
const OrderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    trackingNumber: String,
    estimatedDelivery: Date
}, { timestamps: true });

async function clearDummyOrders() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

        // Count existing orders
        const beforeCount = await Order.countDocuments();
        console.log(`📦 Found ${beforeCount} orders in database`);

        if (beforeCount === 0) {
            console.log('✅ No orders to clear - database is clean!');
            await mongoose.connection.close();
            return;
        }

        // List all orders
        const orders = await Order.find({});
        console.log('\n📋 Current orders:');
        orders.forEach(order => {
            console.log(`  - ${order.orderNumber}: ${order.status} (${order.totalAmount})`);
        });

        // Clear all orders (they're all dummy/test orders)
        console.log('\n🗑️  Clearing all dummy orders...');
        const result = await Order.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} dummy orders`);

        // Verify
        const afterCount = await Order.countDocuments();
        console.log(`\n📊 Final count: ${afterCount} orders`);

        if (afterCount === 0) {
            console.log('✅ Database is now clean - ready for real customer orders!');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

clearDummyOrders();
