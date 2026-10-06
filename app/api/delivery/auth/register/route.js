import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import DeliveryPartner from '@/models/DeliveryPartner';
import bcrypt from 'bcryptjs';
import { createOtpChallenge } from '@/lib/otp';
import { sendRegistrationOtpEmail } from '@/lib/mailer';
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter';

export async function POST(request) {
  try {
    const ip = getClientIp(request);

    // Rate limit: max 10 driver registration attempts per 15 minutes per IP
    const rateLimit = checkRateLimit(`delivery_register:ip:${ip}`, 10, 900);
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
    const {
      name,
      email,
      password,
      phone,
      dob,
      vehicleType = 'VAN',
      vehiclePlate = '',
      assignedZones = ['Dubai']
    } = body;

    // Strict input validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Full name is required (minimum 2 characters).' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Valid email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
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

    if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
      return NextResponse.json(
        { success: false, message: 'A valid UAE phone number is required (e.g. +971 50 123 4567).' },
        { status: 400 }
      );
    }

    // Resolve date of birth
    let parsedDob = new Date('1995-01-01');
    if (dob) {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        parsedDob = d;
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // If user exists and is already verified, block duplicate registration
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { success: false, message: 'An account with this email address already exists. Please sign in to the driver portal.' },
          { status: 409 }
        );
      }

      // If user exists but is NOT verified, update their driver details and resend OTP
      existingUser.name = name.trim();
      existingUser.password = hashedPassword;
      existingUser.phone = phone.trim();
      existingUser.dob = parsedDob;
      existingUser.role = 'delivery_partner';
      existingUser.verificationMethod = 'otp_smtp';
      existingUser.verificationSource = 'email_otp';
      await existingUser.save();

      // Ensure DeliveryPartner record exists
      let partner = await DeliveryPartner.findOne({ user: existingUser._id });
      if (!partner) {
        const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
        const partnerCode = `AM-DRV-${Date.now().toString().slice(-4)}${randomSuffix}`;
        partner = await DeliveryPartner.create({
          user: existingUser._id,
          partnerCode,
          name: existingUser.name,
          phone: existingUser.phone,
          vehicleType: ['MOTORBIKE', 'VAN', 'CAR'].includes(vehicleType) ? vehicleType : 'VAN',
          vehiclePlate: vehiclePlate.trim() || 'DXB-PENDING',
          assignedZones: Array.isArray(assignedZones) && assignedZones.length > 0 ? assignedZones : ['Dubai'],
          isOnline: false,
          currentStatus: 'OFFLINE',
          activeDeliveriesCount: 0,
          completedDeliveriesCount: 0
        });
      }

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
            message: emailResult.error || 'Failed to send verification code to your email. Please check your email or SMTP settings.'
          },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        needsVerification: true,
        email: normalizedEmail,
        message: 'A 6-digit verification code has been sent to your email.'
      }, { status: 200 });
    }

    // 1. Create New Unverified Driver User
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
      dob: parsedDob,
      role: 'delivery_partner',
      emailVerified: false,
      verificationMethod: 'otp_smtp',
      verificationSource: 'email_otp'
    });

    // 2. Create Driver Fleet Profile
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const partnerCode = `AM-DRV-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const newPartner = await DeliveryPartner.create({
      user: newUser._id,
      partnerCode,
      name: newUser.name,
      phone: newUser.phone,
      vehicleType: ['MOTORBIKE', 'VAN', 'CAR'].includes(vehicleType) ? vehicleType : 'VAN',
      vehiclePlate: vehiclePlate.trim() || 'DXB-PENDING',
      assignedZones: Array.isArray(assignedZones) && assignedZones.length > 0 ? assignedZones : ['Dubai'],
      isOnline: false,
      currentStatus: 'OFFLINE',
      activeDeliveriesCount: 0,
      completedDeliveriesCount: 0
    });

    // 3. Generate Cryptographic OTP
    const { rawOtp, expiryMinutes } = await createOtpChallenge({
      email: normalizedEmail,
      purpose: 'registration'
    });

    // 4. Dispatch Email with OTP
    const emailResult = await sendRegistrationOtpEmail({
      to: normalizedEmail,
      otp: rawOtp,
      expiryMinutes
    });

    if (!emailResult.success) {
      // Clean up unverified pending records if email failed to send
      await DeliveryPartner.findByIdAndDelete(newPartner._id);
      await User.findByIdAndDelete(newUser._id);
      return NextResponse.json(
        {
          success: false,
          message: emailResult.error || 'Unable to deliver verification code. Please check your email address or SMTP configuration.'
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      needsVerification: true,
      email: normalizedEmail,
      message: 'A 6-digit verification code has been sent to your email. Please verify to activate your courier account.'
    }, { status: 200 });

  } catch (error) {
    console.error('Delivery registration error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to complete delivery partner registration.' },
      { status: 500 }
    );
  }
}
