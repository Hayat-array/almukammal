
// app/api/admin/carts/[userId]/route.js
// Create this in a separate file: app/api/admin/carts/[userId]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Cart from '@/models/Cart';
import { verifyToken } from '@/lib/auth';

export async function DELETE(request, { params }) {
  try {
    const { userId } = await params;

    // Verify admin authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await connectDB();

    // Delete the cart
    const deletedCart = await Cart.findOneAndDelete({ userId });

    if (!deletedCart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cart deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting cart:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}