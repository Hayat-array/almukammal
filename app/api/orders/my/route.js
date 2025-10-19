import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth'; // Your auth helper
import { dbConnect } from '@/lib/mongodb'; // Your DB helper
import Order from '@/models/Order'; // Your Order model

// ✅ DYNAMIC USER ORDERS - ONLY THEIR ORDERS FROM DB!
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' }, 
        { status: 401 }
      );
    }

    // ✅ VERIFY USER TOKEN
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' }, 
        { status: 401 }
      );
    }

    // ✅ CONNECT DB
    await dbConnect();

    // ✅ FETCH USER'S ORDERS ONLY FROM DB
    const orders = await Order.find({ 
      customer: { email: decoded.email } // Match user's email
    }).sort({ orderDate: -1 }).lean();
    
    console.log(`✅ USER ORDERS: Loaded ${orders.length} from DB`);
    
    return NextResponse.json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('❌ User Orders API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' }, 
      { status: 500 }
    );
  }
}