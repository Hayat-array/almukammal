import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import GlobalSetting from '@/models/GlobalSetting';
import { verify } from 'jsonwebtoken';

const checkAdmin = (request) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    if (!token) return false;
    try {
        const decoded = verify(token, JWT_SECRET);
        return decoded.role === 'admin';
    } catch (e) {
        return false;
    }
};

export async function GET(request) {
    // Allow public access to read settings (for delivery charges display etc)
    // BUT sensitive admin data might need filtering if we had any.
    // For now, settings like "Is Store Open" need to be public.
    // However, the USER asked for "Admin APIs". 
    // I will make a separate Public API or just allow getting settings publicly but writing only by Admin.
    // Let's protect WRITE, allow READ (or maybe READ secure for full details, and Public endpoint for partial).

    // The User requirement says "Admin APIs (CRUD)".
    // I will protect this route fully for Management, and create a separate public route later or handle conditional logic.
    // Actually, for the Admin Dashboard, we want full access.
    if (!checkAdmin(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        // Use findOne because we only have one settings document
        let settings = await GlobalSetting.findOne({});
        if (!settings) {
            settings = await GlobalSetting.create({}); // Create default if missing
        }
        return NextResponse.json({ success: true, settings });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    if (!checkAdmin(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const body = await request.json();

        // Update the single settings document. upsert=true ensures it's created if missing.
        // We update the fields provided in body.
        const settings = await GlobalSetting.findOneAndUpdate({}, body, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        });

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
