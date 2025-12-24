const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laptop-store';

async function testAPIResponse() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const Product = mongoose.connection.collection('products');

        // Get first product with and without id field
        const productWithId = await Product.findOne({});
        const productWithoutId = await Product.findOne({}, { projection: { id: 0 } });

        console.log('📦 Product WITH id field:');
        console.log(`   _id: ${productWithId._id}`);
        console.log(`   id: ${productWithId.id || 'NOT SET'}`);
        console.log(`   name: ${productWithId.name}`);

        console.log('\n📦 Product WITHOUT id field (projected):');
        console.log(`   _id: ${productWithoutId._id}`);
        console.log(`   id: ${productWithoutId.id || 'NOT SET'}`);
        console.log(`   name: ${productWithoutId.name}`);

        console.log('\n🔗 Correct link should be:');
        console.log(`   /products/${productWithId._id}`);

        console.log('\n✅ If API uses .select("-id"), it should return:');
        console.log(`   { id: "${productWithId._id}", _id: "${productWithId._id}", ... }`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

testAPIResponse();
