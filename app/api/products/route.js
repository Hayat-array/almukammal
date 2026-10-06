import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProductModel from '@/models/ProductModel';
import Discount from '@/models/Discount';

// In-memory cache for fast sub-10ms responses
let cachedProductsData = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

export function invalidateProductsCache() {
    cachedProductsData = null;
    lastCacheTime = 0;
}

// GET - Fetch all products (public endpoint) with active discounts
export async function GET(request) {
    try {
        const now = Date.now();
        if (cachedProductsData && (now - lastCacheTime < CACHE_TTL_MS)) {
            return NextResponse.json({ products: cachedProductsData }, {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                    'X-Cache': 'HIT',
                }
            });
        }

        await dbConnect();

        // Fetch products and active discounts in parallel with lean projection
        const [products, activeDiscounts] = await Promise.all([
            ProductModel.find({})
                .select('name description price comparePrice image images specs brand category warranty stock ratings createdAt')
                .sort({ createdAt: -1 })
                .lean(),
            Discount.find({
                isActive: true,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() }
            }).lean()
        ]);

        // Helper to find best discount for a product
        const applyDiscount = (product) => {
            let bestDiscount = null;
            let finalPrice = product.price;

            // 1. Site-wide discounts (lowest priority, but check all)
            const siteWide = activeDiscounts.find(d => d.type === 'site-wide');

            // 2. Category discounts
            const categoryDiscount = activeDiscounts.find(d => d.type === 'category' && d.target?.toLowerCase() === product.category?.toLowerCase());

            // 3. Product specific (highest priority)
            const productDiscount = activeDiscounts.find(d => d.type === 'product' && d.target === product._id.toString());

            // Determine which rule applies (Product > Category > Site-wide)
            // Or maybe we want the BEST value? Usually specific overrides general.
            // Let's stick to Specific Overrides General rule.
            const discountRule = productDiscount || categoryDiscount || siteWide;

            if (discountRule) {
                let discountAmount = 0;
                if (discountRule.valueType === 'percentage') {
                    discountAmount = (product.price * discountRule.value) / 100;
                } else {
                    discountAmount = discountRule.value;
                }

                finalPrice = Math.max(0, product.price - discountAmount); // Prevent negative price
                bestDiscount = {
                    name: discountRule.name,
                    amount: discountAmount,
                    type: discountRule.valueType,
                    value: discountRule.value
                };
            }

            return { finalPrice, bestDiscount };
        };

        // Convert MongoDB documents to plain objects and apply discounts
        const productsData = products.map(product => {
            const { finalPrice, bestDiscount } = applyDiscount(product);

            return {
                id: product._id.toString(),
                _id: product._id.toString(),
                name: product.name,
                description: product.description,
                price: product.price, // Original Price
                discountedPrice: bestDiscount ? finalPrice : null, // Discounted Price (if any)
                discountBadge: bestDiscount ? (bestDiscount.type === 'percentage' ? `${bestDiscount.value}% OFF` : `AED ${bestDiscount.value} OFF`) : null,
                image: product.image,
                images: product.images,
                specs: product.specs,
                brand: product.brand,
                category: product.category,
                warranty: product.warranty,
                stock: product.stock,
                ratings: product.ratings,
                createdAt: product.createdAt
            };
        });

        // Save to in-memory cache
        cachedProductsData = productsData;
        lastCacheTime = Date.now();

        // Add caching headers for better performance
        return NextResponse.json({ products: productsData }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                'X-Cache': 'MISS',
            }
        });
    } catch (error) {
        console.error('SERVER ERROR fetching products:', error);
        console.error('Error Stack:', error.stack);
        return NextResponse.json(
            { error: 'Failed to fetch products', details: error.message },
            { status: 500 }
        );
    }
}
