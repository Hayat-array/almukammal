const mongoose = require('mongoose');

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

async function fixAllProductImages() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

        // Get all products
        const products = await Product.find({});
        console.log(`📦 Found ${products.length} products`);

        // Valid uploaded images in public folder
        const validImages = [
            'laptop-1765871030785-hvv87h.png',
            'laptop-1765871030789-i2met.webp',
            'laptop-1765871030794-meh8wk.png',
            'laptop-1765871030797-ujhzga.jpg',
            'placeholder.jpg'
        ];

        let updated = 0;

        for (const product of products) {
            let needsUpdate = false;
            const updates = {};

            // Fix main image if it's invalid
            if (!product.image || !validImages.includes(product.image)) {
                updates.image = 'placeholder.jpg';
                needsUpdate = true;
            }

            // Fix images array
            if (product.images && product.images.length > 0) {
                const validProductImages = product.images.filter(img => validImages.includes(img));

                if (validProductImages.length === 0) {
                    updates.images = [];
                    needsUpdate = true;
                } else if (validProductImages.length !== product.images.length) {
                    updates.images = validProductImages;
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                await Product.findByIdAndUpdate(product._id, updates);
                updated++;

                if (updated <= 10) {
                    console.log(`  ✅ Fixed: ${product.name}`);
                    console.log(`     Old image: ${product.image} → New: ${updates.image || product.image}`);
                }
            }
        }

        console.log(`\n✅ Updated ${updated} products with correct image paths`);
        console.log(`📊 ${products.length - updated} products already had valid images`);

        // Verify
        const withPlaceholder = await Product.countDocuments({ image: 'placeholder.jpg' });
        const withUploaded = await Product.countDocuments({ image: { $regex: /^laptop-/ } });

        console.log(`\n📊 Final Status:`);
        console.log(`   Placeholder: ${withPlaceholder}`);
        console.log(`   Uploaded images: ${withUploaded}`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

fixAllProductImages();
