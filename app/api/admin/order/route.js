import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { verifyAdmin } from '@/lib/auth';

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
        _id: order._id?.toString(),
        orderNumber: order.orderNumber,
        customer: order.customer,
        customerInfo: order.customerInfo,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status || 'pending',
        orderDate: order.orderDate || order.createdAt,
        trackingNumber: order.trackingNumber || ''
      }))
    });
  } catch (error) {
    console.error('Admin Orders Fetch Error:', error);
    return NextResponse.json({ success: false, error: 'Server error fetching orders' }, { status: 500 });
  }
}