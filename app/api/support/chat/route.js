import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Shipment from '@/models/Shipment';
import SupportTicket from '@/models/SupportTicket';
import { getPublicTrackingData, rescheduleShipment } from '@/lib/logisticsService';
import { verifyUser } from '@/lib/auth';

const STORE_POLICIES = {
  shipping: 'Al Mukammal provides express UAE courier dispatch within 24 to 48 hours for Dubai, Sharjah, and Ajman, and 48 to 72 hours for Abu Dhabi and Northern Emirates. Orders over AED 5,000 qualify for complimentary delivery; otherwise, a flat AED 20 fee applies.',
  warranty: 'All commercial laptops and workstations include our 1-Year Comprehensive Hardware Warranty covering motherboard, RAM, storage, display, and charging systems, serviced directly at our Deira flagship showroom.',
  returns: 'Unopened items in original packaging can be returned within 14 days of delivery. For any transit damage or hardware discrepancies, notify our team within 72 hours for an immediate showroom exchange.',
  showroom: 'Al Mukammal Computers & Requisites Trading L.L.C is located at Al Sabkha Road, Naif, Deira Computer Market, Dubai. Showroom hours: Sat–Thu 9:00 AM – 10:30 PM, Fri 4:00 PM – 10:30 PM. Contact WhatsApp: +971 50 955 0121.'
};

export async function POST(request) {
  try {
    const authUser = await verifyUser(request);
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const lower = message.toLowerCase().trim();
    await dbConnect();

    // 1. INTENT RECOGNITION & TOOL CALLING

    // Intent A: Live Order Inquiry / Tracking
    const isOrderQuery = lower.includes('order') || lower.includes('track') || lower.includes('where is') || lower.includes('delivery') || lower.includes('eta') || lower.includes('status');
    const orderMatch = message.match(/ORD-[\w-]+/i) || message.match(/TRK-[\w-]+/i);

    if (isOrderQuery) {
      if (!authUser) {
        if (orderMatch) {
          const publicTrack = await getPublicTrackingData(orderMatch[0].toUpperCase());
          if (publicTrack) {
            return NextResponse.json({
              success: true,
              reply: `Here is the current live status for **${publicTrack.orderNumber}**:\n\n• **Status:** ${publicTrack.status.replace(/_/g, ' ')}\n• **Tracking ID:** ${publicTrack.trackingId}\n• **Estimated Delivery:** ${publicTrack.estimatedDelivery}\n• **Destination Area:** ${publicTrack.destinationArea}, ${publicTrack.destinationCity}\n\nYou can view the full interactive GPS timeline on our [Live Tracking Portal](/track/${publicTrack.trackingId}).`,
              toolUsed: 'getPublicTrackingData',
              trackingId: publicTrack.trackingId
            });
          }
        }

        return NextResponse.json({
          success: true,
          reply: 'To check your personal order status and live delivery GPS, please [sign in to your account](/auth/login) or provide your tracking number (e.g. `TRK-...` or `ORD-...`).',
          requiresAuth: true
        });
      }

      // Authenticated customer: fetch their real active orders
      const userOrders = await Order.find({
        $or: [
          { customer: authUser.userId },
          { 'customerInfo.email': authUser.email.toLowerCase().trim() }
        ]
      }).sort({ createdAt: -1 }).limit(3).lean();

      if (userOrders.length === 0) {
        return NextResponse.json({
          success: true,
          reply: `I checked your account records, but no active orders were found under **${authUser.email}**. If you placed an order as a guest, please share your Order Number (e.g., \`ORD-...\`) or tracking code so I can look it up for you.`
        });
      }

      // If user specified an order, look up that exact one
      let targetOrder = userOrders[0];
      if (orderMatch) {
        const matched = userOrders.find(o => 
          o.orderNumber.toLowerCase() === orderMatch[0].toLowerCase() ||
          o.trackingNumber?.toLowerCase() === orderMatch[0].toLowerCase()
        );
        if (matched) targetOrder = matched;
      }

      // Fetch live shipment tracking data
      const trackData = await getPublicTrackingData(targetOrder.trackingNumber || targetOrder.orderNumber);

      const itemsSummary = targetOrder.items?.map(i => `${i.quantity || 1}x ${i.name}`).join(', ') || 'High-performance laptop';

      return NextResponse.json({
        success: true,
        reply: `Here is the live status for your latest order **#${targetOrder.orderNumber}** (${itemsSummary}):\n\n• **Current Stage:** ${trackData?.status?.replace(/_/g, ' ') || targetOrder.status.toUpperCase()}\n• **Tracking Reference:** ${trackData?.trackingId || targetOrder.trackingNumber || 'Pending Hub Dispatch'}\n• **Delivery Estimate:** ${trackData?.estimatedDelivery || 'Within 24–48 hours'}\n• **Destination:** ${targetOrder.customerInfo?.address || 'Dubai, UAE'}\n\n👉 [Click here to view live map & progress on your Tracking Page](/track/${trackData?.trackingId || targetOrder.orderNumber})`,
        toolUsed: 'getAuthenticatedOrderTracking',
        trackingId: trackData?.trackingId || targetOrder.orderNumber
      });
    }

    // Intent B: Delivery Rescheduling
    if (lower.includes('reschedule') || lower.includes('change date') || lower.includes('change time') || lower.includes('not available')) {
      if (!authUser) {
        return NextResponse.json({
          success: true,
          reply: 'To reschedule a delivery, please [sign in to your account](/auth/login) or view your order on our [Track Order page](/track) to select an updated time slot.'
        });
      }

      const activeOrder = await Order.findOne({
        $or: [
          { customer: authUser.userId },
          { 'customerInfo.email': authUser.email.toLowerCase().trim() }
        ],
        status: { $in: ['shipped', 'in_transit', 'out_for_delivery', 'processing'] }
      }).sort({ createdAt: -1 });

      if (activeOrder && activeOrder.trackingNumber) {
        return NextResponse.json({
          success: true,
          reply: `I found your active order **#${activeOrder.orderNumber}**. You can easily reschedule delivery to tomorrow or another preferred date directly on your [Order Tracking Dashboard](/track/${activeOrder.trackingNumber}). Would you like me to open a support request for a specific time window?`,
          canReschedule: true,
          trackingId: activeOrder.trackingNumber
        });
      }

      return NextResponse.json({
        success: true,
        reply: 'I could not find an active in-transit order under your account to reschedule. Please provide your order number or let me know if you would like me to connect you with our Dubai support desk.'
      });
    }

    // Intent C: Return / Refund / Damage / Complaint
    if (lower.includes('return') || lower.includes('refund') || lower.includes('damage') || lower.includes('broken') || lower.includes('not received') || lower.includes('complaint')) {
      // Auto-escalation: create ticket
      let createdTicket = null;
      if (authUser) {
        const ticketId = `TKT-${Date.now().toString().slice(-6)}`;
        const ticket = new SupportTicket({
          ticketId,
          customer: authUser.userId,
          customerEmail: authUser.email,
          customerName: authUser.name || 'Customer',
          category: lower.includes('damage') ? 'PACKAGE_DAMAGED' : (lower.includes('not received') ? 'PACKAGE_NOT_RECEIVED' : 'RETURN'),
          priority: 'HIGH',
          status: 'OPEN',
          subject: `Automated Bot Escalation: ${message.slice(0, 50)}...`,
          messages: [{
            senderType: 'customer',
            senderName: authUser.name || 'Customer',
            message: message.trim(),
            timestamp: new Date()
          }]
        });
        await ticket.save();
        createdTicket = ticket;
      }

      return NextResponse.json({
        success: true,
        reply: `I understand this is an important concern regarding your purchase. Our policy guarantees a **14-day return window** and **72-hour immediate replacement for any transit damage**.\n\n${createdTicket ? `✅ I have opened priority Support Ticket **#${createdTicket.ticketId}** for store leadership review.\n\n` : ''}For immediate priority resolution, you can also speak directly with our senior technicians at our Deira Computer Market showroom via WhatsApp: [💬 Chat on WhatsApp with Dubai VIP Desk](https://wa.me/971509550121?text=${encodeURIComponent(`Hello Al Mukammal Support, I am inquiring regarding: ${message}`)})`,
        escalated: true,
        ticketId: createdTicket?.ticketId
      });
    }

    // Intent D: Policy Inquiries (Shipping, Warranty, Showroom location)
    if (lower.includes('warranty') || lower.includes('guarantee')) {
      return NextResponse.json({
        success: true,
        reply: `**Al Mukammal Hardware Warranty:**\n${STORE_POLICIES.warranty}\n\nAll laptops undergo our 32-point inspection before packing. If you need hardware support or repairs, our technicians are available daily at our Deira showroom.`
      });
    }

    if (lower.includes('shipping') || lower.includes('delivery cost') || lower.includes('how long')) {
      return NextResponse.json({
        success: true,
        reply: `**Delivery & Shipping Policy:**\n${STORE_POLICIES.shipping}\n\nAll shipments are securely packaged with tamper-evident seals and tracked in real time.`
      });
    }

    if (lower.includes('location') || lower.includes('showroom') || lower.includes('store') || lower.includes('address') || lower.includes('timing') || lower.includes('hours')) {
      return NextResponse.json({
        success: true,
        reply: `**Al Mukammal Dubai Showroom:**\n${STORE_POLICIES.showroom}\n\n[📍 View Live Location & Directions on Google Maps](https://maps.google.com/?q=Al+Mukammal+Computer+Trading+Dubai)`
      });
    }

    // Default Fallback
    return NextResponse.json({
      success: true,
      reply: `Hello! I am your **Al Mukammal Customer Care Assistant**. I can help you with:\n\n1. 🚚 **Tracking an active delivery** (enter your order number or tracking code)\n2. 📅 **Rescheduling delivery**\n3. 🛡️ **Warranty & Return guidelines**\n4. 📍 **Store hours & Showroom directions**\n5. 👨‍💼 **Opening a support ticket or chatting with our Dubai VIP Desk**\n\nHow may I assist you with your order today?`
    });

  } catch (error) {
    console.error('[SUPPORT_CHAT_ERROR]', error);
    return NextResponse.json({
      success: false,
      reply: 'I am experiencing a momentary connection issue. You can reach our Dubai team directly via WhatsApp at +971 50 955 0121.'
    }, { status: 500 });
  }
}
