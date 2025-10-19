// routes/products.js
const express = require('express');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');
const { ProductModel, sampleProducts } = require('../models/Product');
const connectDB = require('../config/database');

const router = express.Router();

// GridFS Storage for Images
const storage = new GridFsStorage({
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce',
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({ storage });

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await ProductModel.find().sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST new product with images
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const images = req.files.map(file => ({
      filename: file.filename,
      path: file.id.toString(),
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    const product = new ProductModel({
      ...req.body,
      images
    });

    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Seed sample data
router.post('/seed', async (req, res) => {
  try {
    await connectDB();
    await ProductModel.deleteMany({});
    await ProductModel.insertMany(sampleProducts);
    const count = await ProductModel.countDocuments();
    res.json({ success: true, message: `${count} products seeded successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;