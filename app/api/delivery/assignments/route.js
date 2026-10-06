import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Shipment from '@/models/Shipment';
import DeliveryPartner from '@/models/DeliveryPartner';
import { verifyDeliveryPartner } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await verifyDeliveryPartner(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Delivery partner access required.' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'active'; // 'active' | 'completed' | 'all'

    // Find delivery partner profile for this user
    let partner = await DeliveryPartner.findOne({ user: auth.userId });
    
    // Auto-create partner record if admin/manager is testing
    if (!partner && (auth.role === 'admin' || auth.role === 'manager')) {
      partner = await DeliveryPartner.findOne({});
    }

    if (!partner) {
      return NextResponse.json({
        success: true,
        assignments: [],
        partner: null,
        message: 'No active delivery partner profile linked to this account.'
      });
    }

    let statusQuery = {};
    if (filter === 'active') {
      statusQuery = {
        status: {
          $in: [
            'ASSIGNED',
            'PICKED_UP',
            'IN_TRANSIT',
            'ARRIVED_AT_DESTINATION',
            'OUT_FOR_DELIVERY',
            'DELIVERY_ATTEMPTED',
            'RESCHEDULED'
          ]
        }
      };
    } else if (filter === 'completed') {
      statusQuery = { status: { $in: ['DELIVERED', 'RETURNED'] } };
    }

    const query = {
      $or: [
        { deliveryPartner: partner._id, ...statusQuery },
        // Also allow unassigned shipments if driver is looking for available pickups
        ...(filter === 'available' ? [{ status: 'ASSIGNMENT_PENDING' }] : [])
      ]
    };

    const shipments = await Shipment.find(query)
      .populate('order', 'orderNumber totalAmount items subtotal')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      partner: {
        id: partner._id,
        name: partner.name,
        code: partner.partnerCode,
        isOnline: partner.isOnline,
        status: partner.currentStatus,
        activeCount: partner.activeDeliveriesCount,
        completedCount: partner.completedDeliveriesCount
      },
      assignments: shipments.map(s => ({
        _id: s._id.toString(),
        trackingId: s.trackingId,
        orderNumber: s.orderNumber,
        status: s.status,
        customerName: s.destination?.fullName,
        customerPhone: s.destination?.phone,
        address: s.destination?.address,
        city: s.destination?.city,
        area: s.destination?.area,
        notes: s.destination?.notes,
        totalAmount: s.order?.totalAmount || 0,
        itemsCount: s.order?.items?.length || 1,
        items: s.order?.items || [],
        attemptsCount: s.deliveryAttemptsCount,
        activeException: s.activeException,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('[DELIVERY_ASSIGNMENTS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve delivery assignments.' },
      { status: 500 }
    );
  }
}
