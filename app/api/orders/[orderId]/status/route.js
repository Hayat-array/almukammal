import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import Order from '@/models/Order';

// ✅ USER UPDATE OWN ORDER STATUS
export async function PATCH(request, { params }) {
  try {
    const { orderId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const { status } = await request.json();

    if (!token || !orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    await dbConnect();

    // ✅ USER CAN ONLY UPDATE OWN ORDERS
    const order = await Order.findOneAndUpdate(
      { _id: orderId, 'customer.email': decoded.email },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log(`✅ USER: Updated order ${orderId} to ${status}`);
    return NextResponse.json({ success: true, order });

  } catch (error) {
    console.error('❌ Update Order Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}