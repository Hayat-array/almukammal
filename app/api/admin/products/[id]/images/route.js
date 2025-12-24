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

// POST - Add images to existing product
export async function POST(request, context) {
    const admin = verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const params = await context.params;
        const formData = await request.formData();

        await dbConnect();
        const product = await ProductModel.findById(params.id);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const uploadDir = path.join(process.cwd(), 'public');
        const newImages = [];

        // Process all items in formData
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('image') && value instanceof File && value.size > 0) {
                const bytes = await value.arrayBuffer();
                const buffer = Buffer.from(bytes);

                // Generate unique filename
                const timestamp = Date.now();
                const ext = value.name.split('.').pop();
                const filename = `laptop-${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;
                const filepath = path.join(uploadDir, filename);

                fs.writeFileSync(filepath, buffer);
                newImages.push(filename);
            } else if (key === 'url' && value) {
                newImages.push(value);
            }
        }

        // Add new images to product
        product.images = [...product.images, ...newImages];

        // Update main image if it's the first image
        if (!product.image || product.image === 'placeholder.jpg') {
            product.image = newImages[0] || 'placeholder.jpg';
        }

        await product.save();

        return NextResponse.json({
            success: true,
            images: newImages,
            product,
            message: `${newImages.length} image(s) added successfully`
        });
    } catch (error) {
        console.error('Error adding images:', error);
        return NextResponse.json({ error: 'Failed to add images' }, { status: 500 });
    }
}

// DELETE - Remove specific image from product
export async function DELETE(request, context) {
    const admin = verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const params = await context.params;
        const { imageFilename } = await request.json();

        await dbConnect();
        const product = await ProductModel.findById(params.id);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Remove image from array
        product.images = product.images.filter(img => img !== imageFilename);

        // Update main image if it was deleted
        if (product.image === imageFilename) {
            product.image = product.images[0] || 'placeholder.jpg';
        }

        // Delete physical file
        const filepath = path.join(process.cwd(), 'public', imageFilename);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        await product.save();

        return NextResponse.json({
            success: true,
            product,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
    }
}
