import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DeliveryPartner from '@/models/DeliveryPartner';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const partners = await DeliveryPartner.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      partners: partners.map(p => ({
        id: p._id.toString(),
        name: p.name,
        code: p.partnerCode,
        phone: p.phone,
        vehicleType: p.vehicleType,
        vehiclePlate: p.vehiclePlate,
        assignedZones: p.assignedZones,
        isOnline: p.isOnline,
        status: p.currentStatus,
        activeDeliveriesCount: p.activeDeliveriesCount,
        completedDeliveriesCount: p.completedDeliveriesCount,
        rating: p.rating
      }))
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to retrieve delivery partners' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, email, phone, password, vehicleType, vehiclePlate, assignedZones } = body;

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, phone, and password are required' }, { status: 400 });
    }

    await dbConnect();

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone.trim(),
        role: 'delivery_partner',
        dob: new Date('1995-01-01'),
        emailVerified: true,
        verificationMethod: 'admin_provisioned',
        verificationSource: 'admin'
      });
      await user.save();
    } else {
      user.role = 'delivery_partner';
      await user.save();
    }

    // Check if partner profile exists
    let partner = await DeliveryPartner.findOne({ user: user._id });
    if (!partner) {
      const partnerCode = `DRV-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      partner = new DeliveryPartner({
        user: user._id,
        partnerCode,
        name: name.trim(),
        phone: phone.trim(),
        vehicleType: vehicleType || 'VAN',
        vehiclePlate: vehiclePlate || 'Dubai Private Fleet',
        assignedZones: assignedZones || ['Deira', 'Bur Dubai', 'Downtown'],
        isOnline: true,
        currentStatus: 'AVAILABLE'
      });
      await partner.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery partner registered successfully',
      partner: {
        id: partner._id.toString(),
        name: partner.name,
        code: partner.partnerCode,
        phone: partner.phone
      }
    }, { status: 201 });
  } catch (error) {
    console.error('[PARTNER_PROVISION_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create partner' }, { status: 500 });
  }
}
