import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

export async function POST(request) {
    try {
        await dbConnect();
        const { code, cartTotal, userId } = await request.json();

        if (!code) {
            return NextResponse.json({ success: false, error: 'Coupon code required' });
        }

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true
        });

        if (!coupon) {
            return NextResponse.json({ success: false, error: 'Invalid coupon code' });
        }

        // Check Expiry - Set expiry to end of day (23:59:59)
        const expiryDate = new Date(coupon.expiryDate);
        expiryDate.setHours(23, 59, 59, 999); // End of the expiry day
        if (new Date() > expiryDate) {
            return NextResponse.json({ success: false, error: 'Coupon has expired' });
        }

        // Check Min Order
        if (cartTotal < coupon.minOrderValue) {
            return NextResponse.json({
                success: false,
                error: `Minimum order of AED ${coupon.minOrderValue} required`
            });
        }

        // Check Usage Limit (Global)
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            return NextResponse.json({ success: false, error: 'Coupon usage limit reached' });
        }

        // Check User Specific (Future implementation, strictly required by user?)
        // User requested "Applicable users (all / specific users)"
        if (coupon.applicableTo && !coupon.applicableTo.includes('all')) {
            if (!userId || !coupon.applicableTo.includes(userId)) {
                return NextResponse.json({ success: false, error: 'This coupon is not valid for your account' });
            }
        }

        // Calculate Discount
        let discountAmount = 0;
        if (coupon.type === 'percentage') {
            discountAmount = (cartTotal * coupon.value) / 100;
            if (coupon.maxDiscount) {
                discountAmount = Math.min(discountAmount, coupon.maxDiscount);
            }
        } else {
            discountAmount = coupon.value;
        }

        // Ensure discount doesn't exceed total
        discountAmount = Math.min(discountAmount, cartTotal);

        return NextResponse.json({
            success: true,
            coupon: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                amount: discountAmount
            }
        });

    } catch (error) {
        console.error('Coupon validation error:', error);
        return NextResponse.json({ success: false, error: 'Server error validating coupon' }, { status: 500 });
    }
}
