import mongoose from 'mongoose';
import products from '../data/products.js';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laptop-store';

// Product Schema
const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        default: 'placeholder.jpg'
    },
    images: [{
        type: String
    }],
    specs: {
        cpu: String,
        ram: String,
        storage: String,
        display: String,
        gpu: String
    },
    brand: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        default: 'Laptops'
    },
    warranty: {
        type: String,
        default: '1 Year Warranty'
    },
    stock: {
        type: Number,
        default: 10
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

async function migrateProducts() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

        // Clear existing products
        console.log('🗑️  Clearing existing products...');
        await Product.deleteMany({});
        console.log('✅ Cleared existing products');

        // Import products from file
        console.log(`📦 Importing ${products.length} products...`);

        let successCount = 0;
        let errorCount = 0;

        for (const product of products) {
            try {
                await Product.create({
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    image: product.image || 'placeholder.jpg',
                    images: product.images || [product.image || 'placeholder.jpg'],
                    specs: {
                        cpu: product.specs?.cpu || '',
                        ram: product.specs?.ram || '',
                        storage: product.specs?.storage || '',
                        display: product.specs?.display || '',
                        gpu: product.specs?.gpu || ''
                    },
                    brand: product.brand || '',
                    category: product.category || 'Laptops',
                    warranty: product.warranty || '1 Year Warranty',
                    stock: product.stock || 10
                });
                successCount++;
                if (successCount % 100 === 0) {
                    console.log(`✅ Imported ${successCount} products...`);
                }
            } catch (err) {
                errorCount++;
                console.error(`❌ Failed to import: ${product.name}`, err.message);
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Successfully imported: ${successCount} products`);
        console.log(`   ❌ Failed: ${errorCount} products`);
        console.log(`   📦 Total in file: ${products.length} products`);

        // Verify count in database
        const dbCount = await Product.countDocuments();
        console.log(`   💾 Products in MongoDB: ${dbCount}`);

        console.log('\n🎉 Migration completed successfully!');

    } catch (err) {
        console.error('❌ Migration error:', err);
        console.error(err.stack);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

migrateProducts();
