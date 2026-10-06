import { NextResponse } from 'next/server';
import { verifyOtpChallenge, createResetAuthorization } from '@/lib/otp';
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const { email, otp } = body;

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
        { success: false, message: 'Verification code must be 6 digits.' },
        { status: 400 }
      );
    }

    // Rate limiting: max 10 verification attempts per 10 minutes per IP+email
    const rateLimit = checkRateLimit(`verify-reset:${normalizedEmail}:${ip}`, 10, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many incorrect attempts. Please wait before trying again.'
        },
        { status: 429 }
      );
    }

    // Verify OTP against password_reset challenge
    const verification = await verifyOtpChallenge({
      email: normalizedEmail,
      purpose: 'password_reset',
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

    // Issue a short-lived reset authorization token
    const resetAuthToken = await createResetAuthorization(verification.challenge._id);

    return NextResponse.json({
      success: true,
      message: 'Verification code confirmed. You may now set your new password.',
      resetAuthToken,
    });

  } catch (error) {
    console.error('Verify reset OTP error:', error.message);
    return NextResponse.json(
      { success: false, message: 'An error occurred during verification. Please try again.' },
      { status: 500 }
    );
  }
}
