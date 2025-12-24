import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const { email, dob } = await request.json();

        if (!email || !dob) {
            return NextResponse.json(
                { message: 'Email and date of birth are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return NextResponse.json(
                { message: 'No account found with this email' },
                { status: 404 }
            );
        }

        // Verify DOB
        const userDob = new Date(user.dob).toISOString().split('T')[0];
        const providedDob = new Date(dob).toISOString().split('T')[0];

        if (userDob !== providedDob) {
            return NextResponse.json(
                { message: 'Date of birth does not match our records' },
                { status: 401 }
            );
        }

        // Generate a temporary reset token (valid for 15 minutes)
        const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

        // Store reset token in user document (you may want to add these fields to schema)
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Identity verified. You can now reset your password.',
            resetToken,
            userId: user._id
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
