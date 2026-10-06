import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import DeliveryPartner from '@/models/DeliveryPartner';
import jwt from 'jsonwebtoken';
import { verifyOtpChallenge } from '@/lib/otp';
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const { email, otp, purpose = 'registration' } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and verification code are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json(
        { success: false, message: 'Verification code must be exactly 6 digits.' },
        { status: 400 }
      );
    }

    // Rate limiting: max 10 attempts per 10 minutes per IP+email
    const rateLimit = checkRateLimit(`verify:${normalizedEmail}:${ip}`, 10, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many verification attempts. Please wait ${Math.ceil(rateLimit.resetInSeconds / 60)} minutes before trying again.`
        },
        { status: 429 }
      );
    }

    // Verify OTP against the challenge stored in DB
    const verification = await verifyOtpChallenge({
      email: normalizedEmail,
      purpose,
      rawOtp: cleanOtp,
    });

    if (!verification.valid) {
      return NextResponse.json(
        {
          success: false,
          message: verification.error,
          code: verification.code,
          remainingAttempts: verification.remainingAttempts,
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Handling for registration flow
    if (purpose === 'registration') {
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Account not found. Please register again.' },
          { status: 404 }
        );
      }

      // Mark email verified
      user.emailVerified = true;
      user.verificationTimestamp = new Date();
      await user.save();

      // If delivery partner, activate fleet profile
      if (user.role === 'delivery_partner') {
        await DeliveryPartner.findOneAndUpdate(
          { user: user._id },
          { isOnline: true, currentStatus: 'AVAILABLE' }
        );
      }

      // Sign JWT session token
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        emailVerified: true,
        verificationMethod: user.verificationMethod,
        createdAt: user.createdAt,
      };

      return NextResponse.json({
        success: true,
        message: 'Email verified successfully! Your account is now active.',
        token,
        user: userResponse,
      });
    }

    // Handling for email change flow
    if (purpose === 'email_change') {
      const newEmail = verification.challenge?.metadata?.newEmail;
      const userId = verification.challenge?.metadata?.userId;

      if (!newEmail || !userId) {
        return NextResponse.json(
          { success: false, message: 'Invalid email change verification session.' },
          { status: 400 }
        );
      }

      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
      }

      user.email = newEmail.toLowerCase().trim();
      user.emailVerified = true;
      user.verificationTimestamp = new Date();
      await user.save();

      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        success: true,
        message: 'Your email address has been updated successfully.',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid verification purpose.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('OTP verification error:', error.message);
    return NextResponse.json(
      { success: false, message: 'An error occurred during verification. Please try again.' },
      { status: 500 }
    );
  }
}
