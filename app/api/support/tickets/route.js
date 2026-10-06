import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';
import { verifyUser, verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    const authUser = await verifyUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    await dbConnect();
    const isAdmin = authUser.role === 'admin' || authUser.role === 'manager' || authUser.role === 'support_agent';

    const query = isAdmin ? {} : { customerEmail: authUser.email.toLowerCase().trim() };
    const tickets = await SupportTicket.find(query).sort({ updatedAt: -1 }).limit(50).lean();

    return NextResponse.json({
      success: true,
      tickets: tickets.map(t => ({
        ticketId: t.ticketId,
        orderNumber: t.orderNumber || '',
        category: t.category,
        priority: t.priority,
        status: t.status,
        subject: t.subject,
        customerName: t.customerName,
        customerEmail: t.customerEmail,
        messagesCount: t.messages?.length || 0,
        messages: t.messages || [],
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }))
    });
  } catch (error) {
    console.error('[SUPPORT_TICKETS_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve support tickets' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await verifyUser(request);
    const body = await request.json();
    const { orderNumber, category, priority, subject, message, customerEmail, customerName, customerPhone } = body;

    const email = authUser?.email || customerEmail;
    if (!email || !subject || !message) {
      return NextResponse.json({ success: false, error: 'Email, subject, and message are required' }, { status: 400 });
    }

    await dbConnect();

    const ticketId = `TKT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const ticket = new SupportTicket({
      ticketId,
      customer: authUser?.userId || null,
      customerEmail: email.toLowerCase().trim(),
      customerName: customerName || authUser?.name || 'Customer',
      customerPhone: customerPhone || '',
      orderNumber: orderNumber || '',
      category: category || 'ORDER_TRACKING',
      priority: priority || 'MEDIUM',
      status: 'OPEN',
      subject: subject.trim(),
      messages: [{
        senderType: authUser ? 'customer' : 'customer',
        senderName: customerName || authUser?.name || 'Customer',
        message: message.trim(),
        timestamp: new Date()
      }]
    });

    await ticket.save();

    return NextResponse.json({
      success: true,
      message: 'Support ticket successfully opened.',
      ticket: {
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    }, { status: 201 });
  } catch (error) {
    console.error('[SUPPORT_TICKETS_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to create support ticket' }, { status: 500 });
  }
}
