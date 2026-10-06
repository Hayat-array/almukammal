import { NextResponse } from 'next/server';
import { recordDeliveryAttempt } from '@/lib/logisticsService';
import { verifyDeliveryPartner } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const auth = await verifyDeliveryPartner(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason, remarks, location, photoProofUrl } = body;

    if (!reason) {
      return NextResponse.json({ success: false, error: 'Structured exception reason is required.' }, { status: 400 });
    }

    const attempt = await recordDeliveryAttempt(id, {
      outcome: 'FAILED',
      reason,
      remarks,
      location,
      photoProofUrl,
      actor: {
        userId: auth.userId,
        name: auth.name || 'Fleet Driver',
        role: 'delivery_partner'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Delivery attempt #${attempt.attemptNumber} logged as failed (${reason}).`,
      attemptNumber: attempt.attemptNumber,
      reason: attempt.reason
    });
  } catch (error) {
    console.error('[DELIVERY_EXCEPTION_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record delivery exception.' },
      { status: 400 }
    );
  }
}
