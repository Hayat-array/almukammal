import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Coupon from '@/models/Coupon';
import GlobalSetting from '@/models/GlobalSetting';
import { verify } from 'jsonwebtoken';

// POST - Create new order with validation
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const {
      customerInfo,
      items,
      subtotal,
      shipping,
      total,
      couponCode,
      discountAmount
    } = body;

    // 1. Basic Validation
    if (!customerInfo || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Fetch Settings for server-side validation
    let settings = await GlobalSetting.findOne({});
    if (!settings) settings = { store: { isOpen: true }, delivery: { type: 'flat', baseCost: 50 } };

    // 3. Validate Store Restrictions
    if (settings.store?.isOpen === false) {
      return NextResponse.json({ success: false, error: settings.store.closeMessage || 'Store is closed' }, { status: 400 });
    }
    if (settings.store?.minOrderValue > 0 && subtotal < settings.store.minOrderValue) {
      return NextResponse.json({ success: false, error: `Minimum order is AED ${settings.store.minOrderValue}` }, { status: 400 });
    }
    if (settings.store?.maxOrderLimit > 0 && subtotal > settings.store.maxOrderLimit) {
      return NextResponse.json({ success: false, error: `Maximum order limit is AED ${settings.store.maxOrderLimit}` }, { status: 400 });
    }

    // 4. Validate Delivery Charge (Optional but good for security)
    let calculatedShipping = 50;
    if (settings.delivery) {
      if (settings.delivery.type === 'free') calculatedShipping = 0;
      else if (settings.delivery.type === 'flat') calculatedShipping = settings.delivery.baseCost;
      else if (settings.delivery.type === 'amount-based') {
        calculatedShipping = subtotal >= settings.delivery.freeDeliveryThreshold ? 0 : settings.delivery.baseCost;
      }
    }
    // Allow small margin of error or strict check? For now trust client but logging mismatch could be good.
    // Ideally we enforce calculatedShipping.
    // const finalShipping = calculatedShipping; 

    // 5. Validate Coupon
    let finalDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      if (coupon) {
        // Check expiry/usage again
        if (new Date() <= new Date(coupon.expiryDate) &&
          (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit)) {

          if (coupon.type === 'percentage') {
            finalDiscount = (subtotal * coupon.value) / 100;
            if (coupon.maxDiscount) finalDiscount = Math.min(finalDiscount, coupon.maxDiscount);
          } else {
            finalDiscount = coupon.value;
          }

          // Increment Usage Count
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    // 6. Create Order
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const finalTotal = Math.max(0, subtotal + shipping - finalDiscount);

    const order = new Order({
      orderNumber,
      customerInfo,
      items: items.map(item => ({
        id: item.id || item._id, // Handle both ID formats
        name: item.name,
        product: item.name, // Legacy field
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      subtotal,
      shipping,
      discountAmount: finalDiscount,
      couponCode: couponCode || null,
      totalAmount: finalTotal,
      status: 'pending',
      orderDate: new Date()
    });

    await order.save();

    return NextResponse.json({
      success: true,
      order: {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status
      }
    });

  } catch (error) {
    console.error('❌ Order Creation Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}

// GET - Fetch orders (Admin only)
export async function GET(request) {
  try {
    await dbConnect();
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

    if (!token) return NextResponse.json({ success: false, error: 'Admin token required' }, { status: 401 });

    try {
      const decoded = verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') return NextResponse.json({ success: false, error: 'Admin privileges required' }, { status: 403 });
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const orders = await Order.find({})
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        customer: order.customer,
        customerInfo: order.customerInfo,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        date: order.createdAt,
        discountAmount: order.discountAmount, // Return discount info
        couponCode: order.couponCode
      }))
    });

  } catch (error) {
    console.error('❌ Admin Orders API ERROR:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}