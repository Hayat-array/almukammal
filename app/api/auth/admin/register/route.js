import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const { name, email, password, adminSecret } = await request.json();

        // 1. Validate Secret Key
        if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
            return NextResponse.json(
                { error: 'Invalid Admin Secret Key' },
                { status: 403 }
            );
        }

        await dbConnect();

        // 2. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        // 3. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create Admin User
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'admin',
            dob: new Date(), // Default DOB since it's required by model but not crucial for admin initially? Or should we ask?
            // Let's assume we might need to ask or just set a placeholder.
            // Looking at User model, dob is required.
        });

        return NextResponse.json({
            message: 'Admin registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Admin Registration Error:', error);
        return NextResponse.json(
            { error: error.message || 'Registration failed' },
            { status: 500 }
        );
    }
}
