import { NextResponse } from 'next/server';
import { completeDeliveryWithProof } from '@/lib/logisticsService';
import { verifyDeliveryPartner } from '@/lib/auth';

const completedIdempotencyCache = new Map();

export async function POST(request, { params }) {
  try {
    const auth = await verifyDeliveryPartner(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const idempotencyKey = request.headers.get('Idempotency-Key') || body.idempotencyKey;

    if (idempotencyKey && completedIdempotencyCache.has(idempotencyKey)) {
      return NextResponse.json(completedIdempotencyCache.get(idempotencyKey));
    }

    const { deliveryOtp, receivedBy, signatureUrl, photoUrl, remarks } = body;

    const result = await completeDeliveryWithProof(id, {
      deliveryOtp,
      receivedBy: receivedBy || 'Customer in person',
      signatureUrl,
      photoUrl,
      remarks,
      actor: {
        userId: auth.userId,
        name: auth.name || 'Fleet Driver',
        role: 'delivery_partner'
      }
    });

    const responsePayload = {
      success: true,
      message: 'Proof of Delivery verified. Order completed successfully.',
      status: 'DELIVERED'
    };

    if (idempotencyKey) {
      completedIdempotencyCache.set(idempotencyKey, responsePayload);
      setTimeout(() => completedIdempotencyCache.delete(idempotencyKey), 60 * 60 * 1000);
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('[DELIVERY_COMPLETE_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed. Could not complete delivery.' },
      { status: 400 }
    );
  }
}
