import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { verifyAndConsumeResetAuthorization } from '@/lib/otp';
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const { email, resetAuthToken, newPassword } = body;

    if (!email || !resetAuthToken || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'All fields are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate password criteria
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Rate limiting: max 5 password reset submissions per 15 minutes per IP
    const rateLimit = checkRateLimit(`reset-pass:ip:${ip}`, 5, 900);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Atomically verify and consume the reset authorization token
    const tokenCheck = await verifyAndConsumeResetAuthorization({
      email: normalizedEmail,
      token: resetAuthToken,
    });

    if (!tokenCheck.valid) {
      return NextResponse.json(
        { success: false, message: tokenCheck.error },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unable to locate account.' },
        { status: 404 }
      );
    }

    // Hash the new password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    // Clear any legacy reset token fields if present
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });

  } catch (error) {
    console.error('Reset password error:', error.message);
    return NextResponse.json(
      { success: false, message: 'An error occurred while resetting your password. Please try again.' },
      { status: 500 }
    );
  }
}
