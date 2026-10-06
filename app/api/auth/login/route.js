import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request) {
  try {
    const ip = getClientIp(request);

    // Rate limit: max 15 login attempts per 15 minutes per IP
    const rateLimit = checkRateLimit(`login:ip:${ip}`, 15, 900);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many login attempts. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const { email, password, isAdminLogin, isDeliveryLogin } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user by normalized email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Role-based login enforcement:
    // Only enforce admin privileges when accessing the restricted admin portal
    const isExplicitAdminLogin = isAdminLogin === true || isAdminLogin === 'admin';
    if (isExplicitAdminLogin && user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Access denied. Administrator privileges required to access the admin portal.' },
        { status: 403 }
      );
    }

    // Only enforce delivery partner privileges when accessing the delivery portal
    if (isDeliveryLogin && user.role !== 'delivery_partner' && user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Access denied. Delivery partner credentials required to access this driver portal.' },
        { status: 403 }
      );
    }

    // Check if user has a password
    if (!user.password) {
      return NextResponse.json(
        { message: 'Account configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Enforce email verification for new accounts
    // Legacy users have emailVerified: true and bypass this check
    if (user.emailVerified === false) {
      return NextResponse.json(
        {
          success: false,
          needsVerification: true,
          email: user.email,
          message: 'Your email address is not yet verified. Please enter your verification code to activate your account.',
        },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password) and token
    return NextResponse.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        postalCode: user.postalCode,
        dob: user.dob,
        emailVerified: user.emailVerified,
        verificationMethod: user.verificationMethod,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    return NextResponse.json(
      { message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
