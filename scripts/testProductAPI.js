const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laptop-store';

async function testProductAPI() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Product = mongoose.connection.collection('products');

        // Get first product
        const firstProduct = await Product.findOne({});

        if (firstProduct) {
            console.log('\n📦 First Product Found:');
            console.log(`   Name: ${firstProduct.name}`);
            console.log(`   _id: ${firstProduct._id}`);
            console.log(`   Image: ${firstProduct.image}`);

            console.log('\n🔗 Test this URL:');
            console.log(`   http://localhost:3000/products/${firstProduct._id}`);

            console.log('\n🔗 Or test API directly:');
            console.log(`   http://localhost:3000/api/products/${firstProduct._id}`);
        } else {
            console.log('❌ No products found in database!');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

testProductAPI();
