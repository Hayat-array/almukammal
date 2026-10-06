import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
import { verifyUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// DELETE - Delete user account with password and DOB verification
export async function DELETE(request) {

  try {
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { password, dateOfBirth } = await request.json();

    if (!password || !dateOfBirth) {
      return NextResponse.json({
        error: 'Password and date of birth are required'
      }, { status: 400 });
    }

    // Get user with password
    const dbUser = await UserModel.findById(user.userId);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, dbUser.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 403 });
    }

    // Verify date of birth
    if (dbUser.dob) {
      const userDOB = new Date(dbUser.dob).toISOString().split('T')[0];
      const providedDOB = new Date(dateOfBirth).toISOString().split('T')[0];

      if (userDOB !== providedDOB) {
        return NextResponse.json({ error: 'Invalid date of birth' }, { status: 403 });
      }
    }

    // Delete user
    await UserModel.findByIdAndDelete(user.userId);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({
      error: 'Failed to delete account',
      details: error.message
    }, { status: 500 });
  }
}