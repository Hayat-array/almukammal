
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Cart from '@/models/Cart';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request) {
  try {
    console.log('🔄 Starting carts fetch request...');
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.userId);
    } catch (err) {
      console.log('❌ Token verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    await dbConnect();
    console.log('✅ Database connected');

    // Verify admin
    const adminUser = await User.findById(decoded.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      console.log('❌ User is not admin:', adminUser?.role);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('✅ Admin verification passed');

    // Get all carts with user information
    const carts = await Cart.find({})
      .populate('userId', 'name email')
      .sort({ updatedAt: -1 });

    console.log(`✅ Found ${carts.length} carts in database`);

    // Format EXACTLY for YOUR FRONTEND!
    const formattedCarts = carts.map(cart => {
      const user = cart.userId;
      return {
        userId: user?._id?.toString() || 'unknown',
        userName: user?.name || 'Unknown User',
        userEmail: user?.email || 'No email',
        items: cart.items || [],
        totalItems: cart.totalItems || 0,
        totalPrice: cart.totalPrice || 0,
        updatedAt: cart.updatedAt,
        createdAt: cart.createdAt
      };
    });

    console.log('✅ Sending formatted carts data');
    
    return NextResponse.json({
      success: true,
      carts: formattedCarts,
      count: formattedCarts.length
    });

  } catch (error) {
    console.error('❌ Admin carts fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch carts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    await dbConnect();

    const adminUser = await User.findById(decoded.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await Cart.findOneAndDelete({ userId });

    if (!result) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cart deleted successfully'
    });

  } catch (error) {
    console.error('Cart deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete cart' }, { status: 500 });
  }
}