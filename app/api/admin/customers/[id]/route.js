
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order'; // ADD THIS MODEL!
import { verifyAdmin } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });

    // YOUR EXISTING ADMIN CHECK!
    const decoded = await verifyAdmin(request);
    if (!decoded) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    // 🔥 YOUR REAL CUSTOMER ORDERS!
    const orders = await Order.find({ 'customer._id': id })
      .populate('customer', 'name email phone address city country postalCode')
      .sort({ orderDate: -1 });

    const customer = orders[0]?.customer;

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    console.log(`👤 Loaded: ${customer.name} (${orders.length} orders)`);

    return NextResponse.json({ 
      customer, 
      orders,
      totalSpent: orders.reduce((sum, o) => sum + o.totalAmount, 0)
    });

  } catch (error) {
    console.error('Customer Detail Error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}