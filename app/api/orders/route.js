
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb'; // ✅ FIXED! YOUR NAME!
import Order from '@/models/Order';

// ✅ ADMIN ORDERS API - WORKS WITH YOUR MONGODB!
export async function GET(request) {
  try {
    // Connect to MongoDB (YOUR CODE!)
    await dbConnect();

    // ✅ ADMIN CHECK - PROTECTED!
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Admin token required' },
        { status: 401 }
      );
    }

    // ✅ SIMPLE ADMIN CHECK (MOCK - REPLACE LATER)
    const isAdmin = token.includes('admin'); // Simple check
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch ALL orders
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
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        orderDate: order.createdAt,
        trackingNumber: order.trackingNumber
      }))
    });

  } catch (error) {
    console.error('❌ Admin Orders API ERROR:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}