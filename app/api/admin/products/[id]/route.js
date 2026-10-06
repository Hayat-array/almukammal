import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import ProductModel from '@/models/ProductModel';
import { verifyAdmin } from '@/lib/auth';

// Helper to find product by ObjectId or numeric id
async function findProduct(id) {
    if (mongoose.Types.ObjectId.isValid(id)) {
        const found = await ProductModel.findById(id);
        if (found) return found;
    }
    if (!isNaN(id)) {
        return await ProductModel.findOne({ id: Number(id) });
    }
    return null;
}

// GET - Fetch product by ID
export async function GET(request, context) {
    const admin = await verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    try {
        const params = await context.params;
        await dbConnect();
        const product = await findProduct(params.id);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, product });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}

// PATCH - Update product
export async function PATCH(request, context) {
    const admin = await verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    try {
        const params = await context.params;
        await dbConnect();
        const product = await findProduct(params.id);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const contentType = request.headers.get('content-type') || '';

        // Check if JSON request
        if (contentType.includes('application/json')) {
            const data = await request.json();
            if (data.name) product.name = data.name.trim();
            if (data.description !== undefined) product.description = data.description;
            if (data.price !== undefined) product.price = Number(data.price);
            if (data.stock !== undefined) product.stock = Number(data.stock);
            if (data.brand !== undefined) product.brand = data.brand;
            if (data.category !== undefined) product.category = data.category;
            if (data.warranty !== undefined) product.warranty = data.warranty;
            if (data.specs) product.specs = { ...(product.specs || {}), ...data.specs };
            if (data.colors) {
                product.colors = Array.isArray(data.colors)
                    ? data.colors
                    : data.colors.split(',').map(c => c.trim()).filter(Boolean);
            }
            if (Array.isArray(data.images)) {
                product.images = data.images;
                if (data.images.length > 0) product.image = data.images[0];
            }
            product.updatedAt = new Date();
            await product.save();
            return NextResponse.json({ success: true, product, message: 'Product updated successfully' });
        }

        // Form-data request
        const formData = await request.formData();

        // 1. Core Fields (Name, Price, Description, Stock, Brand, Category, Warranty)
        if (formData.has('name') && formData.get('name')) {
            product.name = formData.get('name').toString().trim();
        }
        if (formData.has('description')) {
            product.description = formData.get('description').toString();
        }
        if (formData.has('price')) {
            const p = parseFloat(formData.get('price'));
            if (!isNaN(p)) product.price = p;
        }
        if (formData.has('stock')) {
            const s = parseInt(formData.get('stock'), 10);
            if (!isNaN(s)) product.stock = s;
        }
        if (formData.has('brand')) {
            product.brand = formData.get('brand').toString().trim();
        }
        if (formData.has('category')) {
            product.category = formData.get('category').toString().trim();
        }
        if (formData.has('warranty')) {
            product.warranty = formData.get('warranty').toString().trim();
        }

        // 2. Hardware Specifications
        const specs = { ...(product.specs || {}) };
        const specKeys = ['cpu', 'ram', 'storage', 'display', 'gpu', 'battery', 'weight', 'os'];
        specKeys.forEach(k => {
            if (formData.has(k)) {
                specs[k] = formData.get(k).toString();
            }
        });
        product.specs = specs;

        // 3. Color Variants
        if (formData.has('colors')) {
            const colorsString = formData.get('colors').toString();
            product.colors = colorsString.split(',').map(c => c.trim()).filter(Boolean);
        }

        // 4. Unified Image Management
        const uploadDir = path.join(process.cwd(), 'public');
        const updatedImages = [];
        const imageColorMap = [];

        let i = 0;
        while (i < 100) {
            const file = formData.get(`image_${i}`);
            const url = formData.get(`imageUrl_${i}`);
            const color = formData.get(`imageColor_${i}`);

            if (!file && !url) {
                if (!formData.has(`image_${i}`) && !formData.has(`imageUrl_${i}`)) {
                    break;
                }
            }

            let finalFilename = '';

            if (file && typeof file === 'object' && file.size > 0 && typeof file.arrayBuffer === 'function') {
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const timestamp = Date.now();
                const ext = file.name ? file.name.split('.').pop() : 'jpg';
                const filename = `laptop-${timestamp}-img-${i}.${ext}`;
                const filepath = path.join(uploadDir, filename);
                fs.writeFileSync(filepath, buffer);
                finalFilename = filename;
            } else if (url && url.length > 0) {
                // If it's already a clean filename or URL
                finalFilename = url.toString().replace(/^\/+/, '');
            }

            if (finalFilename) {
                updatedImages.push(finalFilename);
                if (color && color !== 'All' && color !== 'null') {
                    imageColorMap.push({ url: finalFilename, color: color.toString() });
                }
            }
            i++;
        }

        if (updatedImages.length > 0) {
            product.images = updatedImages;
            product.image = updatedImages[0];
            product.imageColorMap = imageColorMap;
        }

        product.updatedAt = new Date();
        await product.save();

        return NextResponse.json({
            success: true,
            product,
            message: 'Product updated successfully'
        });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Failed to update product: ' + (error.message || 'Server error') }, { status: 500 });
    }
}

// DELETE - Remove product
export async function DELETE(request, context) {
    const admin = await verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    try {
        const params = await context.params;
        await dbConnect();
        const product = await findProduct(params.id);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        await ProductModel.findByIdAndDelete(product._id);

        return NextResponse.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
