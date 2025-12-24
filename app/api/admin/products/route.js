import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import dbConnect from '@/lib/mongodb';
import ProductModel from '@/models/ProductModel';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to verify admin token
function verifyAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET - Fetch all products
export async function GET(request) {
  const admin = verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const products = await ProductModel.find({}).sort({ createdAt: -1 });

    // Convert MongoDB documents to plain objects with id field
    const productsData = products.map(product => ({
      id: product._id.toString(),
      _id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      images: product.images,
      specs: product.specs,
      createdAt: product.createdAt
    }));

    return NextResponse.json({ products: productsData });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST - Add new product
export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    // Extract product data
    const name = formData.get('name');
    const description = formData.get('description');
    const price = parseFloat(formData.get('price'));
    const cpu = formData.get('cpu');
    const ram = formData.get('ram');
    const storage = formData.get('storage');
    const display = formData.get('display');
    const gpu = formData.get('gpu');

    // Extract URLs if provided
    const mainImageUrl = formData.get('mainImageUrl');
    const sideImageUrl = formData.get('sideImageUrl');
    const backImageUrl = formData.get('backImageUrl');

    const uploadDir = path.join(process.cwd(), 'public');
    const savedImages = [];

    // 1. Process primary pairs (main, side, back)
    const primaryPairs = [
      { key: 'mainImage', file: formData.get('mainImage'), url: formData.get('mainImageUrl'), index: 0 },
      { key: 'sideImage', file: formData.get('sideImage'), url: formData.get('sideImageUrl'), index: 1 },
      { key: 'backImage', file: formData.get('backImage'), url: formData.get('backImageUrl'), index: 2 }
    ];

    for (const { key, file, url, index } of primaryPairs) {
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const timestamp = Date.now();
        const ext = file.name.split('.').pop();
        const filename = `laptop-${timestamp}-${key}.${ext}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);
        savedImages[index] = filename;
      } else if (url && url.length > 0) {
        savedImages[index] = url;
      }
    }

    // 2. Handle unlimited additional images
    let extraIdx = 0;
    while (extraIdx < 50) {
      const file = formData.get(`additionalImage_${extraIdx}`);
      const url = formData.get(`additionalImageUrl_${extraIdx}`);

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const timestamp = Date.now();
        const ext = file.name.split('.').pop();
        const filename = `laptop-${timestamp}-extra-${extraIdx}.${ext}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);
        savedImages.push(filename);
      } else if (url && url.length > 0) {
        savedImages.push(url);
      }
      extraIdx++;
      if (!formData.has(`additionalImage_${extraIdx}`) && !formData.has(`additionalImageUrl_${extraIdx}`)) break;
    }

    // Extract colors
    const colorsString = formData.get('colors');
    const colors = colorsString ? colorsString.split(',').map(c => c.trim()).filter(Boolean) : [];

    // Connect to MongoDB
    await dbConnect();

    // Create new product in MongoDB
    const newProduct = await ProductModel.create({
      name,
      description,
      price,
      image: savedImages[0] || 'placeholder.jpg',
      images: savedImages.length > 0 ? savedImages : ['placeholder.jpg'],
      colors,
      specs: {
        cpu,
        ram,
        storage,
        display,
        gpu
      }
    });

    return NextResponse.json({
      success: true,
      product: {
        id: newProduct._id.toString(),
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        image: newProduct.image,
        images: newProduct.images,
        specs: newProduct.specs
      },
      message: 'Product added successfully to MongoDB'
    });
  } catch (error) {
    console.error('Error adding product:', error);
    return NextResponse.json({ error: 'Failed to add product', details: error.message }, { status: 500 });
  }
}

// DELETE - Remove product
export async function DELETE(request) {
  const admin = verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId } = await request.json();

    await dbConnect();
    await ProductModel.findByIdAndDelete(productId);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully from MongoDB'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
