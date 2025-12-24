const mongoose = require('mongoose');
const products = require('../data/products.js');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laptop-store';

const ProductSchema = new mongoose.Schema({
    id: Number,
    name: String,
    description: String,
    price: Number,
    image: String,
    images: [String],
    specs: Object,
    brand: String,
    category: String,
    warranty: String,
    stock: Number,
    ratings: Object
}, { timestamps: true });

async function updateProductIds() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

        console.log(`📦 Updating ${products.length} products with id field...`);

        let updated = 0;
        for (const productData of products) {
            // Find product by name (or other unique field)
            const product = await Product.findOne({ name: productData.name });

            if (product && !product.id) {
                product.id = productData.id;
                await product.save();
                updated++;

                if (updated <= 10) {
                    console.log(`  ✅ Updated: ${product.name} (id: ${productData.id})`);
                }
            }
        }

        console.log(`\n✅ Updated ${updated} products with id field`);

        // Verify
        const withId = await Product.countDocuments({ id: { $exists: true } });
        console.log(`📊 Products with 'id' field: ${withId}`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

updateProductIds();
