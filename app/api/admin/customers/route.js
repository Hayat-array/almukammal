
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order'; // ADD THIS MODEL!
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    await dbConnect();
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });

    // YOUR EXISTING ADMIN CHECK!
    const decoded = await verifyAdmin(request);
    if (!decoded) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    // 🔥 YOUR REAL CUSTOMERS FROM ORDERS!
    const customers = await Order.aggregate([
      {
        $group: {
          _id: '$customer._id',
          name: { $first: '$customer.name' },
          email: { $first: '$customer.email' },
          phone: { $first: '$customer.phone' },
          address: { $first: '$customer.address' },
          city: { $first: '$customer.city' },
          country: { $first: '$customer.country' },
          postalCode: { $first: '$customer.postalCode' },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    console.log(`👥 Loaded ${customers.length} REAL customers from database`);

    return NextResponse.json({ customers, total: customers.length });

  } catch (error) {
    console.error('Customers Error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}