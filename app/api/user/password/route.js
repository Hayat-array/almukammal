import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
import { verifyUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// PUT - Change password
export async function PUT(request) {

    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({
                error: 'Current password and new password are required'
            }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({
                error: 'New password must be at least 8 characters'
            }, { status: 400 });
        }

        // Get user with password
        const dbUser = await UserModel.findById(user.userId);
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, dbUser.password);

        console.log('Password verification:', {
            userId: user.userId,
            email: dbUser.email,
            isPasswordValid,
            hasPassword: !!dbUser.password
        });

        if (!isPasswordValid) {
            return NextResponse.json({
                error: 'Current password is incorrect. Please check and try again.'
            }, { status: 403 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        dbUser.password = hashedPassword;
        await dbUser.save();

        console.log('Password updated successfully for user:', dbUser.email);

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json({
            error: 'Failed to change password',
            details: error.message
        }, { status: 500 });
    }
}
