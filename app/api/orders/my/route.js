
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import jwt from 'jsonwebtoken';

// GET - Fetch current user's orders only
export async function GET(request) {
  try {
    await dbConnect();

    // Get token from Authorization header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Decode token to get user info
    let userEmail;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      userEmail = decoded.email;
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email not found in token' },
        { status: 400 }
      );
    }

    // Fetch orders where customerInfo.email matches the logged-in user's email
    const orders = await Order.find({
      'customerInfo.email': userEmail
    })
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        customerInfo: order.customerInfo,
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        totalAmount: order.totalAmount,
        status: order.status,
        orderDate: order.orderDate || order.createdAt,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery
      }))
    });

  } catch (error) {
    console.error('❌ User Orders API ERROR:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}