import { NextResponse } from 'next/server';
import { transitionShipment } from '@/lib/logisticsService';
import { verifyDeliveryPartner } from '@/lib/auth';

// In-memory idempotency cache (keyed by idempotencyKey)
const idempotencyCache = new Map();

export async function POST(request, { params }) {
  try {
    const auth = await verifyDeliveryPartner(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Delivery partner role required.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const idempotencyKey = request.headers.get('Idempotency-Key') || body.idempotencyKey;

    if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
      const cached = idempotencyCache.get(idempotencyKey);
      return NextResponse.json(cached);
    }

    const { toStatus, location, remarks, metadata } = body;

    if (!toStatus) {
      return NextResponse.json({ success: false, error: 'Target status (toStatus) is required.' }, { status: 400 });
    }

    const updated = await transitionShipment({
      shipmentId: id,
      nextStatus: toStatus,
      actorType: 'delivery_partner',
      actorId: auth.userId,
      actorName: auth.name || 'Fleet Driver',
      location,
      remarks: remarks || `Delivery partner updated state to ${toStatus}`,
      metadata: { ...metadata, idempotencyKey }
    });

    const responsePayload = {
      success: true,
      shipmentId: updated._id,
      trackingId: updated.trackingId,
      status: updated.status,
      message: `Shipment successfully transitioned to ${updated.status}`
    };

    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, responsePayload);
      // Evict after 1 hour
      setTimeout(() => idempotencyCache.delete(idempotencyKey), 60 * 60 * 1000);
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('[DELIVERY_TRANSITION_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Status transition rejected.' },
      { status: 400 }
    );
  }
}
