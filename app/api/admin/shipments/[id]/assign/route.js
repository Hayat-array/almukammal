import { NextResponse } from 'next/server';
import { assignDeliveryPartnerToShipment } from '@/lib/logisticsService';
import { verifyAdmin } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { partnerId } = await request.json();

    if (!partnerId) {
      return NextResponse.json({ success: false, error: 'Delivery partner ID is required' }, { status: 400 });
    }

    const updated = await assignDeliveryPartnerToShipment(id, partnerId, {
      userId: admin.userId,
      name: admin.name || 'Operations Lead',
      role: 'admin'
    });

    return NextResponse.json({
      success: true,
      message: `Shipment assigned to partner ${updated.deliveryPartnerName}`,
      shipment: {
        id: updated._id,
        trackingId: updated.trackingId,
        status: updated.status,
        partnerName: updated.deliveryPartnerName
      }
    });
  } catch (error) {
    console.error('[SHIPMENT_ASSIGN_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Assignment failed' }, { status: 400 });
  }
}
