import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { verifyToken } from '@/lib/auth';

// ✅ ADMIN UPDATE ORDER STATUS
export async function PATCH(request, { params }) {
  try {
    const { orderId } = params;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Admin token required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Verify admin token
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    // Update order (admin can update any order)
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('customer', 'name email');

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log(`✅ ADMIN: Updated order ${orderId} to ${status}`);
    
    return NextResponse.json({
      success: true,
      order: {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        customer: order.customer,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        orderDate: order.createdAt,
        trackingNumber: order.trackingNumber
      }
    });

  } catch (error) {
    console.error('❌ Admin Update Order Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}