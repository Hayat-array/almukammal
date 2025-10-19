import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    await dbConnect();

    // Verify admin
    const adminUser = await User.findById(decoded.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get statistics
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const customerCount = await User.countDocuments({ role: 'user' });

    const stats = {
      users: totalUsers,
      admins: adminCount,
      customers: customerCount,
      orders: 0, // Add order count when Order model is ready
      pendingOrders: 0,
      completedOrders: 0,
      totalRevenue: 0
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}


/*
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User'; // Assuming you have a User model
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const [
      totalUsers,
      totalOrders,
      pendingOrders,
      completedOrders,
      revenueData
    ] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const stats = {
      users: totalUsers,
      admins: await User.countDocuments({ role: 'admin' }),
      customers: await User.countDocuments({ role: 'user' }),
      orders: totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: revenueData[0]?.total || 0
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('❌ Admin Stats API ERROR:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}*/