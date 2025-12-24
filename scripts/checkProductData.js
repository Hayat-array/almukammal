const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laptop-store';

async function checkProductData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Product = mongoose.connection.collection('products');

        // Get first 3 products
        const products = await Product.find({}).limit(3).toArray();

        console.log('\n📦 First 3 Products:');
        products.forEach((p, i) => {
            console.log(`\n${i + 1}. ${p.name}`);
            console.log(`   _id: ${p._id}`);
            console.log(`   id field: ${p.id || 'NOT SET'}`);
            console.log(`   image: ${p.image}`);
        });

        console.log('\n🔗 Correct URL format should be:');
        console.log(`   http://localhost:3000/products/${products[0]._id}`);
        console.log('\n❌ Wrong URL format (numeric):');
        console.log(`   http://localhost:3000/products/1`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

checkProductData();
