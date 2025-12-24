import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const { userId, resetToken, newPassword } = await request.json();

        if (!userId || !resetToken || !newPassword) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { message: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find user and verify reset token
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid reset request' },
                { status: 404 }
            );
        }

        // Check if token matches and is not expired
        if (user.resetToken !== resetToken) {
            return NextResponse.json(
                { message: 'Invalid reset token' },
                { status: 401 }
            );
        }

        if (user.resetTokenExpiry < Date.now()) {
            return NextResponse.json(
                { message: 'Reset token has expired. Please request a new one.' },
                { status: 401 }
            );
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset token
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
