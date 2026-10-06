import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { createOtpChallenge } from '@/lib/otp';
import { sendRegistrationOtpEmail, sendPasswordResetOtpEmail, sendEmailChangeOtpEmail } from '@/lib/mailer';
import { checkCooldown, checkRateLimit, getClientIp } from '@/lib/rateLimiter';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const { email, purpose = 'registration' } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check 60-second resend cooldown
    const cooldown = checkCooldown(`resend:${normalizedEmail}`, 60);
    if (!cooldown.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Please wait ${cooldown.waitSeconds} seconds before requesting a new code.`,
          waitSeconds: cooldown.waitSeconds,
        },
        { status: 429 }
      );
    }

    // Rate limit: max 5 resend requests per 15 minutes per IP
    const rateLimit = checkRateLimit(`resend:ip:${ip}`, 5, 900);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many requests. Please wait a while before requesting another code.',
        },
        { status: 429 }
      );
    }

    await dbConnect();

    if (purpose === 'registration') {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Account not found. Please register first.' },
          { status: 404 }
        );
      }

      if (user.emailVerified) {
        return NextResponse.json(
          { success: false, message: 'This email is already verified. Please sign in.' },
          { status: 400 }
        );
      }

      const { rawOtp, expiryMinutes, cooldownSeconds } = await createOtpChallenge({
        email: normalizedEmail,
        purpose: 'registration',
      });

      const emailResult = await sendRegistrationOtpEmail({
        to: normalizedEmail,
        otp: rawOtp,
        expiryMinutes,
      });

      if (!emailResult.success) {
        return NextResponse.json(
          { success: false, message: 'Failed to deliver email. Please try again in a moment.' },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'A new verification code has been sent to your email.',
        cooldownSeconds,
      });
    }

    if (purpose === 'password_reset') {
      const user = await User.findOne({ email: normalizedEmail });

      // Account enumeration protection: always return success
      if (user) {
        const { rawOtp, expiryMinutes, cooldownSeconds } = await createOtpChallenge({
          email: normalizedEmail,
          purpose: 'password_reset',
        });

        await sendPasswordResetOtpEmail({
          to: normalizedEmail,
          otp: rawOtp,
          expiryMinutes,
        });

        return NextResponse.json({
          success: true,
          message: 'If an account exists for this email, a verification code has been sent.',
          cooldownSeconds,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'If an account exists for this email, a verification code has been sent.',
        cooldownSeconds: 60,
      });
    }

    if (purpose === 'email_change') {
      const { rawOtp, expiryMinutes, cooldownSeconds } = await createOtpChallenge({
        email: normalizedEmail,
        purpose: 'email_change',
      });

      await sendEmailChangeOtpEmail({
        to: normalizedEmail,
        otp: rawOtp,
        expiryMinutes,
      });

      return NextResponse.json({
        success: true,
        message: 'A new verification code has been sent to your new email address.',
        cooldownSeconds,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid verification purpose specified.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Resend OTP error:', error.message);
    return NextResponse.json(
      { success: false, message: 'An error occurred while resending the code. Please try again.' },
      { status: 500 }
    );
  }
}
