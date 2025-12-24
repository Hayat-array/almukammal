const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laptop-store';

async function removeNumericIdField() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Product = mongoose.connection.collection('products');

        // Check how many products have numeric id field
        const withNumericId = await Product.countDocuments({ id: { $exists: true, $type: 'number' } });
        console.log(`📊 Found ${withNumericId} products with numeric id field`);

        if (withNumericId === 0) {
            console.log('✅ No numeric id fields to remove!');
            await mongoose.connection.close();
            return;
        }

        // Remove the numeric id field from all products
        console.log('🗑️  Removing numeric id field from all products...');
        const result = await Product.updateMany(
            { id: { $exists: true, $type: 'number' } },
            { $unset: { id: "" } }
        );

        console.log(`✅ Removed numeric id field from ${result.modifiedCount} products`);

        // Verify
        const remaining = await Product.countDocuments({ id: { $exists: true, $type: 'number' } });
        console.log(`📊 Remaining products with numeric id: ${remaining}`);

        if (remaining === 0) {
            console.log('✅ All numeric id fields removed successfully!');
            console.log('📝 Products now only have MongoDB _id field');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

removeNumericIdField();
