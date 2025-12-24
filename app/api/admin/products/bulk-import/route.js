import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProductModel from '@/models/ProductModel';
import jwt from 'jsonwebtoken';

// Verify admin authentication
async function verifyAdmin(request) {
    try {
        // Check cookie first
        let token = request.cookies.get('adminToken')?.value;

        // If no cookie, check Authorization header
        if (!token) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) return null;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.role === 'admin' ? decoded : null;
    } catch {
        return null;
    }
}

// POST - Bulk import products
export async function POST(request) {
    try {
        // Verify admin
        const admin = await verifyAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { products } = await request.json();

        // Validate input
        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({
                error: 'Invalid input. Expected array of products.'
            }, { status: 400 });
        }

        // Validate each product has required fields
        const errors = [];
        const validProducts = [];

        products.forEach((product, index) => {
            const productErrors = [];

            if (!product.name) productErrors.push('name is required');
            if (!product.price || product.price <= 0) productErrors.push('valid price is required');
            if (!product.description) productErrors.push('description is required');

            if (productErrors.length > 0) {
                errors.push({
                    index,
                    name: product.name || 'Unknown',
                    errors: productErrors
                });
            } else {
                // Prepare product for insertion
                validProducts.push({
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    brand: product.brand || 'Unknown',
                    category: product.category || 'Laptop',
                    specs: product.specs || {},
                    stock: product.stock || 0,
                    image: product.image || '/placeholder.jpg',
                    images: product.images || [],
                    colors: product.colors || [],
                    warranty: product.warranty || '1 year',
                    ratings: product.ratings || { average: 0, count: 0 },
                    imageColorMap: product.imageColorMap || {}
                });
            }
        });

        // If there are validation errors, return them
        if (errors.length > 0) {
            return NextResponse.json({
                success: false,
                message: `${errors.length} product(s) have validation errors`,
                errors,
                validCount: validProducts.length,
                totalCount: products.length
            }, { status: 400 });
        }

        // Insert all valid products
        const result = await ProductModel.insertMany(validProducts, { ordered: false });

        return NextResponse.json({
            success: true,
            message: `Successfully imported ${result.length} products`,
            imported: result.length,
            products: result.map(p => ({
                id: p._id.toString(),
                name: p.name,
                price: p.price
            }))
        });

    } catch (error) {
        console.error('Bulk import error:', error);

        // Handle duplicate key errors
        if (error.code === 11000) {
            return NextResponse.json({
                success: false,
                error: 'Some products already exist (duplicate names)',
                details: error.message
            }, { status: 400 });
        }

        return NextResponse.json({
            success: false,
            error: 'Failed to import products',
            details: error.message
        }, { status: 500 });
    }
}
