import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth'; // Your auth utility

export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Delete user from database (replace with your DB logic)
    // await prisma.user.delete({ where: { id: user.id } });
    
    // For demo - simulate deletion
    console.log(`🗑️ DELETED USER: ${user.email}`);

    return NextResponse.json({ 
      message: 'Account deleted successfully',
      deletedUser: user.email 
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}