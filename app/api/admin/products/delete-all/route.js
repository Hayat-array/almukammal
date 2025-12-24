import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ProductModel from '@/models/ProductModel';
import UserModel from '@/models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Verify admin authentication
async function verifyAdmin(request) {
    try {
        let token = request.cookies.get('adminToken')?.value;

        if (!token) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) return null;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.role === 'admin' ? decoded : null;
    } catch {
        return null;
    }
}

// DELETE - Delete all products with password and DOB verification
export async function POST(request) {
    try {
        // Verify admin
        const admin = await verifyAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { password, dateOfBirth } = await request.json();

        // Validate inputs
        if (!password || !dateOfBirth) {
            return NextResponse.json({
                error: 'Password and date of birth are required'
            }, { status: 400 });
        }

        // Get admin user from database
        const adminUser = await UserModel.findById(admin.userId);
        if (!adminUser) {
            return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, adminUser.password);
        if (!isPasswordValid) {
            return NextResponse.json({
                error: 'Invalid password'
            }, { status: 403 });
        }

        // Verify date of birth
        if (adminUser.dob) {
            const adminDOB = new Date(adminUser.dob).toISOString().split('T')[0];
            const providedDOB = new Date(dateOfBirth).toISOString().split('T')[0];

            if (adminDOB !== providedDOB) {
                return NextResponse.json({
                    error: 'Invalid date of birth'
                }, { status: 403 });
            }
        } else {
            // If admin doesn't have DOB set, just verify password is enough
            console.log('Admin DOB not set, skipping DOB verification');
        }

        // Count products before deletion
        const count = await ProductModel.countDocuments();

        // Delete all products
        const result = await ProductModel.deleteMany({});

        return NextResponse.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} products`,
            deletedCount: result.deletedCount,
            previousCount: count
        });

    } catch (error) {
        console.error('Delete all products error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to delete products',
            details: error.message
        }, { status: 500 });
    }
}
