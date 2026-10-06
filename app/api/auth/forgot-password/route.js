import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { createOtpChallenge } from '@/lib/otp';
import { sendPasswordResetOtpEmail } from '@/lib/mailer';
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter';

export async function POST(request) {
  try {
    const ip = getClientIp(request);

    // Rate limiting: max 5 forgot-password requests per 15 min per IP
    const rateLimit = checkRateLimit(`forgot-password:ip:${ip}`, 5, 900);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many password reset requests. Please wait a few minutes before trying again.'
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await dbConnect();

    // Check if user exists (without revealing status to the client)
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Generate OTP challenge for password reset
      const { rawOtp, expiryMinutes } = await createOtpChallenge({
        email: normalizedEmail,
        purpose: 'password_reset',
      });

      // Send password reset email via SMTP
      await sendPasswordResetOtpEmail({
        to: normalizedEmail,
        otp: rawOtp,
        expiryMinutes,
      });
    }

    // Generic safe response to defend against user enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, a verification code has been sent.',
      email: normalizedEmail,
    });

  } catch (error) {
    console.error('Forgot password processing error:', error.message);
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request. Please try again.' },
      { status: 500 }
    );
  }
}
