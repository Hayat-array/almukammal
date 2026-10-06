import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { createOtpChallenge } from '@/lib/otp';
import { sendRegistrationOtpEmail } from '@/lib/mailer';
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter';

export async function POST(request) {
  try {
    const ip = getClientIp(request);

    // Rate limit: max 10 registration attempts per 15 minutes per IP
    const rateLimit = checkRateLimit(`register:ip:${ip}`, 10, 900);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many registration attempts. Please try again in ${Math.ceil(rateLimit.resetInSeconds / 60)} minutes.`
        },
        { status: 429 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const { name, email, password, phone, address, dob } = body;

    // Strict input validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid full name (minimum 2 characters).' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail) || normalizedEmail.length > 254) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Phone number is required.' },
        { status: 400 }
      );
    }

    // Format address properly to ensure no subdocument CastErrors
    const formattedAddress = typeof address === 'string'
      ? { street: address.trim(), city: 'Dubai', country: 'United Arab Emirates' }
      : (address || {});

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      // If user exists and is already verified, block duplicate registration
      if (existingUser.emailVerified) {
        return NextResponse.json(
          {
            success: false,
            message: 'An account with this email address already exists. Please sign in.'
          },
          { status: 409 }
        );
      }

      // If user exists but is NOT verified, update their details and re-send OTP
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      existingUser.name = name.trim();
      existingUser.password = hashedPassword;
      existingUser.phone = phone.trim();
      if (address) existingUser.address = formattedAddress;
      if (dob) existingUser.dob = new Date(dob);
      existingUser.verificationMethod = 'otp_smtp';
      existingUser.verificationSource = 'email_otp';
      await existingUser.save();

      // Generate OTP and send email
      const { rawOtp, expiryMinutes } = await createOtpChallenge({
        email: normalizedEmail,
        purpose: 'registration'
      });

      const emailResult = await sendRegistrationOtpEmail({
        to: normalizedEmail,
        otp: rawOtp,
        expiryMinutes
      });

      if (!emailResult.success) {
        return NextResponse.json(
          {
            success: false,
            message: emailResult.error || 'Failed to send verification code. Please check your email address or SMTP settings.'
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          needsVerification: true,
          email: normalizedEmail,
          message: 'A 6-digit verification code has been sent to your email.'
        },
        { status: 200 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new unverified user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
      address: formattedAddress,
      dob: dob ? new Date(dob) : null,
      role: 'user',
      emailVerified: false,
      verificationMethod: 'otp_smtp',
      verificationSource: 'email_otp',
      verificationTimestamp: null,
    });

    // Generate secure OTP challenge on the server
    const { rawOtp, expiryMinutes } = await createOtpChallenge({
      email: normalizedEmail,
      purpose: 'registration',
    });

    // Send OTP via SMTP
    const emailResult = await sendRegistrationOtpEmail({
      to: normalizedEmail,
      otp: rawOtp,
      expiryMinutes,
    });

    if (!emailResult.success) {
      // Clean up the pending user so registration is not left in a broken state
      await User.findByIdAndDelete(newUser._id);
      return NextResponse.json(
        {
          success: false,
          message: emailResult.error || 'Unable to deliver verification code. Please check your email or SMTP settings.',
        },
        { status: 503 }
      );
    }

    // Respond without sensitive information and without issuing a JWT
    return NextResponse.json(
      {
        success: true,
        needsVerification: true,
        email: normalizedEmail,
        message: 'Registration initiated. A 6-digit verification code has been sent to your email.',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration processing error:', error.message);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while creating your account. Please try again.'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}