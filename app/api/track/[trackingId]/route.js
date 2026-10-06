import { NextResponse } from 'next/server';
import { getPublicTrackingData } from '@/lib/logisticsService';
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter';

export async function GET(request, { params }) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`track:ip:${ip}`, 45, 60); // 45 lookups per min
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many tracking requests. Please slow down.' },
        { status: 429 }
      );
    }

    const { trackingId } = await params;
    if (!trackingId) {
      return NextResponse.json({ success: false, error: 'Tracking ID is required' }, { status: 400 });
    }

    const trackingData = await getPublicTrackingData(trackingId.trim());

    if (!trackingData) {
      return NextResponse.json(
        { success: false, error: 'No shipment or order found matching this tracking reference.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tracking: trackingData
    });
  } catch (error) {
    console.error('[TRACKING_API_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Unable to retrieve tracking information at this time.' },
      { status: 500 }
    );
  }
}
