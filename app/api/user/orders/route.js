// C:\lap\laptop\Al_MUKAMMAL\app\api\user\orders\route.js

import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' }, 
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' }, 
        { status: 401 }
      );
    }

    await dbConnect();
    
    const orders = await Order.find({ 
      'customer.email': decoded.email 
    }).sort({ createdAt: -1 }).lean();
    
    return NextResponse.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('❌ User Orders API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' }, 
      { status: 500 }
    );
  }
}