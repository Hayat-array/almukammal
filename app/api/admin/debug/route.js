import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Cart from '@/models/Cart';
import User from '@/models/User';

export async function GET(request) {
  try {
    console.log('🔧 Debug route called');
    await dbConnect();
    
    const users = await User.find({}).select('name email role');
    const carts = await Cart.find({}).populate('userId', 'name email');
    
    const debugInfo = {
      users: users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role
      })),
      carts: carts.map(c => ({
        userId: c.userId?._id?.toString(),
        userName: c.userId?.name,
        userEmail: c.userId?.email,
        itemsCount: c.items?.length || 0,
        items: c.items || []
      })),
      totals: {
        totalUsers: users.length,
        totalCarts: carts.length,
        adminUsers: users.filter(u => u.role === 'admin').length,
        cartsWithItems: carts.filter(c => c.items && c.items.length > 0).length
      }
    };

    console.log('📊 Debug info:', debugInfo.totals);
    
    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('❌ Debug route error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}