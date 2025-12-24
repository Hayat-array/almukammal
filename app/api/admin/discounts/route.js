import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Discount from '@/models/Discount';
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
    if (!checkAdmin(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const discounts = await Discount.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, discounts });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    if (!checkAdmin(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const body = await request.json();
        const discount = await Discount.create(body);
        return NextResponse.json({ success: true, discount });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(request) {
    if (!checkAdmin(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        await dbConnect();
        await Discount.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
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
        const { id, ...updateData } = body;
        const discount = await Discount.findByIdAndUpdate(id, updateData, { new: true });
        return NextResponse.json({ success: true, discount });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
