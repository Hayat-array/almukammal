import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to verify admin token
function verifyAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET - Fetch all customers (users with role 'user')
export async function GET(request) {
  const admin = verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    // Fetch all users with role 'user'
    const customers = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    console.log(`👥 Loaded ${customers.length} customers from database`);

    return NextResponse.json({
      success: true,
      customers: customers.map(customer => ({
        _id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address ? [customer.address.street, customer.address.city, customer.address.country].filter(Boolean).join(', ') || 'N/A' : 'N/A',
        city: customer.address?.city || '',
        country: customer.address?.country || 'UAE',
        createdAt: customer.createdAt,
        emailVerified: customer.emailVerified || false
      })),
      total: customers.length
    });

  } catch (error) {
    console.error('Customers Error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}