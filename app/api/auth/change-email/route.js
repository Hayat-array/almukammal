import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { createOtpChallenge } from '@/lib/otp';
import { sendEmailChangeOtpEmail } from '@/lib/mailer';
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request) {
  try {
    const ip = getClientIp(request);

    // Extract Bearer token or cookie token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid or expired session' }, { status: 401 });
    }

    const { newEmail } = await request.json();

    if (!newEmail || typeof newEmail !== 'string') {
      return NextResponse.json({ success: false, message: 'New email address is required' }, { status: 400 });
    }

    const normalizedNewEmail = newEmail.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedNewEmail)) {
      return NextResponse.json({ success: false, message: 'Please provide a valid email address' }, { status: 400 });
    }

    // Rate limiting: max 5 email change attempts per 15 min per IP
    const rateLimit = checkRateLimit(`change-email:ip:${ip}`, 5, 900);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    await dbConnect();

    // Check if new email is already in use by any other account
    const existing = await User.findOne({ email: normalizedNewEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'This email address is already registered to another account' },
        { status: 409 }
      );
    }

    // Create OTP challenge sent to the NEW email address
    const { rawOtp, expiryMinutes } = await createOtpChallenge({
      email: normalizedNewEmail,
      purpose: 'email_change',
      metadata: {
        userId: decoded.userId,
        newEmail: normalizedNewEmail,
      },
    });

    const mailResult = await sendEmailChangeOtpEmail({
      to: normalizedNewEmail,
      otp: rawOtp,
      expiryMinutes,
    });

    if (!mailResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unable to deliver verification code to new email. Please try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'A verification code has been sent to your new email address.',
      newEmail: normalizedNewEmail,
    });

  } catch (error) {
    console.error('Change email error:', error.message);
    return NextResponse.json(
      { success: false, message: 'An error occurred while initiating email change.' },
      { status: 500 }
    );
  }
}
