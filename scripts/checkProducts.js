const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laptop-store';

async function checkProducts() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Product = mongoose.connection.collection('products');

        // Get first 5 products
        const products = await Product.find({}).limit(5).toArray();

        console.log('\n📦 First 5 products:');
        products.forEach((p, i) => {
            console.log(`\n${i + 1}. ${p.name}`);
            console.log(`   _id: ${p._id}`);
            console.log(`   id: ${p.id || 'NOT SET'}`);
            console.log(`   image: ${p.image}`);
        });

        // Count total
        const total = await Product.countDocuments();
        console.log(`\n📊 Total products: ${total}`);

        // Check how many have id field
        const withId = await Product.countDocuments({ id: { $exists: true } });
        console.log(`📊 Products with 'id' field: ${withId}`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

checkProducts();
