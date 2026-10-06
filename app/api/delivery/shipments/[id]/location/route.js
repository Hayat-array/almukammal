import { NextResponse } from 'next/server';
import { updateShipmentLocation } from '@/lib/logisticsService';
import { verifyDeliveryPartner } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function POST(request, { params }) {
  try {
    const auth = await verifyDeliveryPartner(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;

    // Rate-limit GPS updates: max 1 per 10s per driver to protect battery and server
    const rateLimit = checkRateLimit(`loc:driver:${auth.userId}`, 6, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, throttled: true, error: 'Location update rate-limited (minimum 10s interval).' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { lat, lng, accuracy, heading, speed } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ success: false, error: 'Valid numerical coordinates required.' }, { status: 400 });
    }

    const updated = await updateShipmentLocation(id, { lat, lng, accuracy, heading, speed });

    return NextResponse.json({
      success: true,
      location: updated
    });
  } catch (error) {
    console.error('[LOCATION_INGEST_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update delivery location.' },
      { status: 400 }
    );
  }
}
