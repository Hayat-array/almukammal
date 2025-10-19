// C:\lap\laptop\Al_MUKAMMAL\app\api\user\orders\[orderId]\route.js

import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import Order from '@/models/Order';

export async function PATCH(request, { params }) {
  try {
    const { orderId } = params;
    const authHeader = request.headers.get('authorization');
    const { status } = await request.json();

    if (!authHeader || !orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' }, 
        { status: 401 }
      );
    }

    await dbConnect();
    
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

    return NextResponse.json({ success: true, order });

  } catch (error) {
    console.error('❌ Update Order Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' }, 
      { status: 500 }
    );
  }
}