import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { verifyAdmin } from '@/lib/auth';

// PATCH - Admin update order status or tracking number
export async function PATCH(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const { orderId } = await params;
    const body = await request.json();
    const { status, trackingNumber } = body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    await dbConnect();

    const updateFields = { updatedAt: new Date() };
    if (status) updateFields.status = status;
    if (trackingNumber !== undefined) updateFields.trackingNumber = trackingNumber;

    const order = await Order.findByIdAndUpdate(
      orderId,
      updateFields,
      { new: true }
    ).populate('customer', 'name email');

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        customer: order.customer,
        customerInfo: order.customerInfo,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        orderDate: order.orderDate || order.createdAt,
        trackingNumber: order.trackingNumber || ''
      },
      message: `Order status updated to ${order.status}`
    });

  } catch (error) {
    console.error('Admin Update Order Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// GET - Single order detail for admin
export async function GET(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const { orderId } = await params;
    await dbConnect();

    const order = await Order.findById(orderId).populate('customer', 'name email phone');
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error retrieving order' }, { status: 500 });
  }
}