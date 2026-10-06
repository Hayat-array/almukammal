import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Shipment from '@/models/Shipment';
import { rescheduleShipment } from '@/lib/logisticsService';
import { verifyUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const { trackingId } = await params;
    const body = await request.json();
    const { requestedDate, timeSlot, reason } = body;

    if (!requestedDate) {
      return NextResponse.json(
        { success: false, error: 'A valid rescheduled delivery date is required.' },
        { status: 400 }
      );
    }

    await dbConnect();
    const shipment = await Shipment.findOne({ trackingId });
    if (!shipment) {
      return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
    }

    const authUser = await verifyUser(request);
    const requestedBy = authUser?.name || shipment.destination?.fullName || 'Customer';

    const updated = await rescheduleShipment(shipment._id, {
      requestedDate,
      timeSlot: timeSlot || 'Standard Delivery (10:00 AM - 06:00 PM)',
      reason: reason || 'Customer requested reschedule',
      requestedBy
    });

    return NextResponse.json({
      success: true,
      message: 'Delivery successfully rescheduled',
      estimatedDelivery: updated.estimatedDeliveryWindow?.etaText
    });
  } catch (error) {
    console.error('[RESCHEDULE_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reschedule delivery' },
      { status: 500 }
    );
  }
}
