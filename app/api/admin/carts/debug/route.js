
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Cart from '@/models/Cart';
import User from '@/models/User';

export async function GET(request) {
  try {
    await dbConnect();
    
    const users = await User.find({}).select('name email role');
    const carts = await Cart.find({}).populate('userId', 'name email');
    
    return NextResponse.json({
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role
      })),
      carts: carts.map(c => ({
        userId: c.userId?._id,
        userName: c.userId?.name,
        itemsCount: c.items?.length || 0
      })),
      totalUsers: users.length,
      totalCarts: carts.length,
      adminUsers: users.filter(u => u.role === 'admin').length
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}