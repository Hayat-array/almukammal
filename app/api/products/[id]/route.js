import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProductModel from '@/models/ProductModel';

const productDetailCache = new Map();
const DETAIL_CACHE_TTL = 60 * 1000; // 60s cache

// GET - Fetch single product by ID (public endpoint)
export async function GET(request, context) {
    try {
        const params = await context.params;
        const productId = params.id;

        // Validate MongoDB ObjectId format (24 hex characters)
        if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
            return NextResponse.json({
                error: 'Invalid product ID format',
                message: 'Product ID must be a valid MongoDB ObjectId'
            }, { status: 400 });
        }

        // Check in-memory cache
        const cached = productDetailCache.get(productId);
        if (cached && (Date.now() - cached.timestamp < DETAIL_CACHE_TTL)) {
            return NextResponse.json({ product: cached.data }, {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
                    'X-Cache': 'HIT',
                }
            });
        }

        await dbConnect();

        // Find product by MongoDB _id, exclude numeric id field using .lean() for maximum speed
        const product = await ProductModel.findById(productId).select('-id').lean();

        if (!product) {
            return NextResponse.json({
                error: 'Product not found',
                message: 'No product exists with this ID'
            }, { status: 404 });
        }

        // Convert to plain object
        const productData = {
            id: product._id.toString(),
            _id: product._id.toString(),
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            images: product.images || [],
            specs: product.specs || {},
            brand: product.brand,
            category: product.category,
            warranty: product.warranty,
            stock: product.stock || 0,
            colors: product.colors || [],
            imageColorMap: product.imageColorMap || [],
            ratings: product.ratings || { average: 0, count: 0 },
            createdAt: product.createdAt
        };

        // Save to in-memory cache
        productDetailCache.set(productId, { data: productData, timestamp: Date.now() });

        return NextResponse.json({ product: productData }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
                'X-Cache': 'MISS',
            }
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({
            error: 'Failed to fetch product',
            message: error.message
        }, { status: 500 });
    }
}
