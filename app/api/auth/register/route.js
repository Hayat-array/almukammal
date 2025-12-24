
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request) {
  try {
    console.log('Starting registration process...');

    await dbConnect();
    console.log('Database connected successfully');

    const body = await request.json();
    console.log('Request body received:', {
      name: body.name,
      email: body.email,
      password: '[HIDDEN]',
      phone: body.phone
    });

    const { name, email, password, phone, address, dob } = body;

    // Validate required fields
    if (!name || !email || !password || !phone) {
      console.log('Missing required fields');
      return NextResponse.json(
        {
          success: false,
          message: 'All fields are required'
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password must be at least 6 characters'
        },
        { status: 400 }
      );
    }

    // Check if user exists
    console.log('Checking for existing user with email:', email);
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return NextResponse.json(
        {
          success: false,
          message: 'User already exists with this email'
        },
        { status: 409 }
      );
    }

    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    console.log('Creating new user...');
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      address: address || '',
      dob: dob || null,
      role: 'user',
    });
    console.log('User created successfully:', user._id);

    // Create token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password
    const userResponse = {
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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    console.log('Registration successful for user:', user.email);

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: userResponse,
      token: token,
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error details:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Export other HTTP methods if needed
export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}