const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laptop-store';

async function listProducts() {
    try {
        await mongoose.connect(MONGODB_URI);
        const Product = mongoose.connection.collection('products');
        const products = await Product.find({}, { projection: { name: 1, brand: 1 } }).toArray();

        console.log('--- PRODUCT LIST ---');
        products.forEach(p => {
            console.log(`"${p.name}" | Brand: ${p.brand}`);
        });
        console.log('--------------------');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

listProducts();
