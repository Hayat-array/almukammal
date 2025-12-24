const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laptop-store';

async function checkProductImages() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Product = mongoose.connection.collection('products');

        // Get products with uploaded images (not placeholder)
        const productsWithImages = await Product.find({
            image: { $regex: /^laptop-/, $options: 'i' }
        }).toArray();

        console.log(`\n📸 Products with uploaded images: ${productsWithImages.length}`);

        productsWithImages.forEach((p, i) => {
            console.log(`\n${i + 1}. ${p.name}`);
            console.log(`   Main image: ${p.image}`);
            if (p.images && p.images.length > 0) {
                console.log(`   Gallery: ${p.images.length} images`);
                p.images.forEach((img, idx) => {
                    console.log(`     ${idx + 1}. ${img}`);
                });
            }
        });

        // Check products with placeholder
        const withPlaceholder = await Product.countDocuments({
            image: 'placeholder.jpg'
        });
        console.log(`\n📊 Products with placeholder: ${withPlaceholder}`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

checkProductImages();
