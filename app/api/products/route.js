import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProductModel from '@/models/ProductModel';

// GET - Fetch all products (public endpoint) with active discounts
export async function GET(request) {
    try {
        await dbConnect();

        // Fetch products and active discounts in parallel - OPTIMIZED with lean()
        const [products, activeDiscounts] = await Promise.all([
            ProductModel.find({}).select('-id').sort({ createdAt: -1 }).lean(),
            import('@/models/Discount').then(mod => mod.default.find({
                isActive: true,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() }
            }).lean())
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

        // Add caching headers for better performance
        return NextResponse.json({ products: productsData }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
