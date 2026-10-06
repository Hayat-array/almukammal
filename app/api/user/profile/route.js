import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
import { verifyUser } from '@/lib/auth';

// GET - Retrieve user profile
export async function GET(request) {
    try {
        const decoded = await verifyUser(request);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await UserModel.findById(decoded.userId).select('-password');
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({
            error: 'Failed to fetch profile',
            details: error.message
        }, { status: 500 });
    }
}

// PUT - Update user profile
export async function PUT(request) {
    try {
        const decoded = await verifyUser(request);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const updates = await request.json();

        // Security: Don't allow changing email or role or password through this endpoint
        delete updates.email;
        delete updates.role;
        delete updates.password;

        // Update user
        const updatedUser = await UserModel.findByIdAndUpdate(
            decoded.userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({
            error: 'Failed to update profile',
            details: error.message
        }, { status: 500 });
    }
}

