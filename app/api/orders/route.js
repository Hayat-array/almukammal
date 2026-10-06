import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import ProductModel from '@/models/ProductModel';
import Coupon from '@/models/Coupon';
import Discount from '@/models/Discount';
import GlobalSetting from '@/models/GlobalSetting';
import { verifyAdmin, verifyUser } from '@/lib/auth';
import { createShipmentForOrder } from '@/lib/logisticsService';

// POST - Create new order with strict server-side financial recalculation
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { customerInfo, items, couponCode } = body;

    // 1. Basic Input Validation
    if (!customerInfo || !customerInfo.fullName || !customerInfo.phone) {
      return NextResponse.json({ success: false, error: 'Customer contact details are required' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart cannot be empty' }, { status: 400 });
    }

    // 2. Optional Authenticated User Binding
    const authUser = await verifyUser(request);

    // 3. Operational Store Status Verification
    let settings = await GlobalSetting.findOne({});
    if (!settings) {
      settings = {
        store: { isOpen: true, minOrderValue: 0, maxOrderLimit: 0 },
        delivery: { type: 'flat', baseCost: 20, freeDeliveryThreshold: 5000 }
      };
    }

    if (settings.store?.isOpen === false) {
      return NextResponse.json({
        success: false,
        error: settings.store.closeMessage || 'The store is temporarily closed for orders.'
      }, { status: 400 });
    }

    // 4. Retrieve Authoritative Product Data from DB
    const itemIds = items.map(item => item.id || item._id).filter(Boolean);
    const dbProducts = await ProductModel.find({ _id: { $in: itemIds } }).lean();
    const productMap = new Map(dbProducts.map(p => [p._id.toString(), p]));

    // Fetch active discounts to determine valid promotional pricing
    const now = new Date();
    const activeDiscounts = await Discount.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).lean();

    let calculatedSubtotal = 0;
    const verifiedItems = [];

    for (const clientItem of items) {
      const pid = (clientItem.id || clientItem._id || '').toString();
      const dbProd = productMap.get(pid);

      if (!dbProd) {
        return NextResponse.json({
          success: false,
          error: `Product "${clientItem.name || pid}" is no longer available in catalog.`
        }, { status: 400 });
      }

      const qty = Math.max(1, parseInt(clientItem.quantity, 10) || 1);
      
      // Determine applicable discount
      const prodDiscount = activeDiscounts.find(d => d.type === 'product' && d.target === pid);
      const catDiscount = activeDiscounts.find(d => d.type === 'category' && d.target?.toLowerCase() === dbProd.category?.toLowerCase());
      const siteDiscount = activeDiscounts.find(d => d.type === 'site-wide');
      const discountRule = prodDiscount || catDiscount || siteDiscount;

      let effectivePrice = dbProd.price;
      if (discountRule) {
        const discountAmt = discountRule.valueType === 'percentage'
          ? (dbProd.price * discountRule.value) / 100
          : discountRule.value;
        effectivePrice = Math.max(0, dbProd.price - discountAmt);
      }

      calculatedSubtotal += (effectivePrice * qty);

      verifiedItems.push({
        id: dbProd._id.toString(),
        name: dbProd.name,
        product: dbProd.name,
        quantity: qty,
        price: effectivePrice,
        image: dbProd.image || 'placeholder.jpg'
      });
    }

    // 5. Store Limit Validations
    if (settings.store?.minOrderValue > 0 && calculatedSubtotal < settings.store.minOrderValue) {
      return NextResponse.json({
        success: false,
        error: `Minimum order requirement is AED ${settings.store.minOrderValue.toLocaleString()}`
      }, { status: 400 });
    }

    if (settings.store?.maxOrderLimit > 0 && calculatedSubtotal > settings.store.maxOrderLimit) {
      return NextResponse.json({
        success: false,
        error: `Maximum single order limit is AED ${settings.store.maxOrderLimit.toLocaleString()}`
      }, { status: 400 });
    }

    // 6. Calculate Delivery Fee
    let calculatedShipping = 20;
    if (settings.delivery) {
      if (settings.delivery.type === 'free') {
        calculatedShipping = 0;
      } else if (settings.delivery.type === 'flat') {
        calculatedShipping = settings.delivery.baseCost || 20;
      } else if (settings.delivery.type === 'amount-based') {
        const threshold = settings.delivery.freeDeliveryThreshold || 5000;
        calculatedShipping = calculatedSubtotal >= threshold ? 0 : (settings.delivery.baseCost || 20);
      }
    }

    // 7. Validate Coupon
    let verifiedDiscount = 0;
    let appliedCouponCode = null;

    if (couponCode && typeof couponCode === 'string') {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true
      });

      if (coupon) {
        const expiry = new Date(coupon.expiryDate);
        expiry.setHours(23, 59, 59, 999);

        const isDateValid = now <= expiry;
        const isMinOrderMet = calculatedSubtotal >= (coupon.minOrderValue || 0);
        const isQuotaAvailable = coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit;

        if (isDateValid && isMinOrderMet && isQuotaAvailable) {
          if (coupon.type === 'percentage') {
            verifiedDiscount = (calculatedSubtotal * coupon.value) / 100;
            if (coupon.maxDiscount) {
              verifiedDiscount = Math.min(verifiedDiscount, coupon.maxDiscount);
            }
          } else {
            verifiedDiscount = coupon.value;
          }

          verifiedDiscount = Math.min(verifiedDiscount, calculatedSubtotal);
          appliedCouponCode = coupon.code;

          // Increment coupon usage
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    // 8. Authoritative Final Total
    const finalTotal = Math.max(0, calculatedSubtotal + calculatedShipping - verifiedDiscount);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const order = new Order({
      orderNumber,
      customer: authUser?.userId || null,
      customerInfo: {
        fullName: customerInfo.fullName.trim(),
        email: customerInfo.email?.trim() || authUser?.email || '',
        phone: customerInfo.phone?.trim() || '',
        address: customerInfo.address?.trim() || '',
        city: customerInfo.city?.trim() || 'Dubai',
        state: customerInfo.state?.trim() || '',
        country: customerInfo.country?.trim() || 'UAE',
        town: customerInfo.town?.trim() || '',
        notes: customerInfo.notes?.trim() || ''
      },
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      shipping: calculatedShipping,
      discountAmount: verifiedDiscount,
      couponCode: appliedCouponCode,
      totalAmount: finalTotal,
      status: 'pending',
      orderDate: new Date()
    });

    await order.save();

    // Auto-initialize logistics manifest & tracking for modern order
    try {
      const { shipment } = await createShipmentForOrder(order._id);
      order.trackingNumber = shipment.trackingId;
      order.shipment = shipment._id;
    } catch (logisticsErr) {
      console.warn('[LOGISTICS_INIT_WARN] Could not auto-generate shipment immediately:', logisticsErr.message);
    }

    return NextResponse.json({
      success: true,
      order: {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber || '',
        subtotal: order.subtotal,
        shipping: order.shipping,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
        status: order.status,
        orderDate: order.orderDate
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Order Creation Server Error:', error);
    return NextResponse.json({ success: false, error: 'Internal error processing order' }, { status: 500 });
  }
}

// GET - Fetch orders (Admin only)
export async function GET(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin privileges required' }, { status: 403 });
    }

    await dbConnect();
    const orders = await Order.find({})
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        customer: order.customer,
        customerInfo: order.customerInfo,
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        discountAmount: order.discountAmount || 0,
        couponCode: order.couponCode,
        totalAmount: order.totalAmount,
        status: order.status,
        date: order.createdAt,
        trackingNumber: order.trackingNumber || ''
      }))
    });

  } catch (error) {
    console.error('Admin Orders Fetch Error:', error);
    return NextResponse.json({ success: false, error: 'Server error retrieving orders' }, { status: 500 });
  }
}