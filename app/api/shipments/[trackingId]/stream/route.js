import { subscribeToShipment, unsubscribeFromShipment } from '@/lib/logisticsService';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { trackingId } = await params;

  if (!trackingId) {
    return new Response('Tracking ID is required', { status: 400 });
  }

  let clientController = null;

  const stream = new ReadableStream({
    start(controller) {
      clientController = controller;
      subscribeToShipment(trackingId, controller);

      // Send initial heartbeat
      const connectMsg = `data: ${JSON.stringify({ type: 'CONNECTED', trackingId, time: new Date() })}\n\n`;
      controller.enqueue(new TextEncoder().encode(connectMsg));
    },
    cancel() {
      if (clientController) {
        unsubscribeFromShipment(trackingId, clientController);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
