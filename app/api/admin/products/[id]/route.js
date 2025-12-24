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

// GET - Fetch product by ID
export async function GET(request, context) {
    const admin = verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const params = await context.params;
        await dbConnect();
        const product = await ProductModel.findById(params.id);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ product });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}

// PATCH - Update product
export async function PATCH(request, context) {
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

        // Handle Images (Unified List from Refactored Frontend)
        const uploadDir = path.join(process.cwd(), 'public');
        const updatedImages = [];
        const imageColorMap = [];

        let i = 0;
        // Check up to 100 images (safe limit)
        while (i < 100) {
            const file = formData.get(`image_${i}`);
            const url = formData.get(`imageUrl_${i}`);
            const color = formData.get(`imageColor_${i}`);

            // If no file and no URL found at this index, we assume end of list
            // (Frontend sends indices sequentially: 0, 1, 2...)
            if (!file && !url) {
                // Double check next index just in case of gaps, but usually safe to break
                if (!formData.has(`image_${i}`) && !formData.has(`imageUrl_${i}`)) {
                    break;
                }
            }

            let finalFilename = '';

            if (file && file.size > 0) {
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const timestamp = Date.now();
                const ext = file.name.split('.').pop();
                const filename = `laptop-${timestamp}-img-${i}.${ext}`;
                const filepath = path.join(uploadDir, filename);
                fs.writeFileSync(filepath, buffer);
                finalFilename = filename;
            } else if (url && url.length > 0) {
                finalFilename = url;
            }

            if (finalFilename) {
                updatedImages.push(finalFilename);
                // Handle Map
                if (color && color !== 'All' && color !== 'null') {
                    imageColorMap.push({ url: finalFilename, color });
                }
            }
            i++;
        }

        product.imageColorMap = imageColorMap;

        // If we have images, update the product.images array
        // We do NOT strictly merge with old images here because the frontend sends the FULL state.
        // The frontend 'url' field contains the existing filename for unchanged images.
        if (updatedImages.length > 0) {
            product.images = updatedImages;
            // First image is always the main thumbnail
            product.image = updatedImages[0];
        } else {
            // If user deleted all images
            product.images = [];
            product.image = 'placeholder.jpg';
        }

        // Update specs
        const specs = {};
        if (formData.get('cpu')) specs.cpu = formData.get('cpu');
        if (formData.get('ram')) specs.ram = formData.get('ram');
        if (formData.get('storage')) specs.storage = formData.get('storage');
        if (formData.get('display')) specs.display = formData.get('display');
        if (formData.get('gpu')) specs.gpu = formData.get('gpu');
        if (formData.get('battery')) specs.battery = formData.get('battery');
        if (formData.get('weight')) specs.weight = formData.get('weight');
        if (formData.get('os')) specs.os = formData.get('os');

        if (Object.keys(specs).length > 0) {
            product.specs = { ...(product.specs || {}), ...specs };
        }

        // Update colors
        const colorsString = formData.get('colors');
        if (colorsString !== null) {
            const colorsArray = colorsString.split(',').map(c => c.trim()).filter(Boolean);
            product.colors = colorsArray;
            console.log('Saving colors:', colorsArray);
        }

        await product.save();
        console.log('Product saved successfully:', product._id);

        return NextResponse.json({
            success: true,
            product,
            message: 'Product updated successfully'
        });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

// DELETE - Remove product
export async function DELETE(request, context) {
    const admin = verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const params = await context.params;
        await dbConnect();
        const product = await ProductModel.findByIdAndDelete(params.id);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
