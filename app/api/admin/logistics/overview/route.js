import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Shipment from '@/models/Shipment';
import DeliveryPartner from '@/models/DeliveryPartner';
import DeliveryAttempt from '@/models/DeliveryAttempt';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    await dbConnect();

    const [
      totalShipments,
      unassignedCount,
      outForDeliveryCount,
      deliveredCount,
      exceptionsCount,
      activePartnersCount,
      partnersList,
      recentShipments
    ] = await Promise.all([
      Shipment.countDocuments(),
      Shipment.countDocuments({ status: { $in: ['CREATED', 'ASSIGNMENT_PENDING'] } }),
      Shipment.countDocuments({ status: 'OUT_FOR_DELIVERY' }),
      Shipment.countDocuments({ status: 'DELIVERED' }),
      Shipment.countDocuments({ status: { $in: ['DELIVERY_ATTEMPTED', 'UNDELIVERED', 'RETURN_TO_ORIGIN'] } }),
      DeliveryPartner.countDocuments({ isOnline: true }),
      DeliveryPartner.find({}).sort({ activeDeliveriesCount: -1 }).limit(10).lean(),
      Shipment.find({})
        .populate('order', 'orderNumber totalAmount')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
    ]);

    const successRate = totalShipments > 0 ? Math.round((deliveredCount / totalShipments) * 100) : 100;

    return NextResponse.json({
      success: true,
      metrics: {
        totalShipments,
        unassignedCount,
        outForDeliveryCount,
        deliveredCount,
        exceptionsCount,
        activePartnersCount,
        successRate
      },
      partners: partnersList.map(p => ({
        id: p._id.toString(),
        name: p.name,
        code: p.partnerCode,
        phone: p.phone,
        vehicleType: p.vehicleType,
        isOnline: p.isOnline,
        status: p.currentStatus,
        activeCount: p.activeDeliveriesCount,
        completedCount: p.completedDeliveriesCount,
        rating: p.rating
      })),
      recentShipments: recentShipments.map(s => ({
        id: s._id.toString(),
        trackingId: s.trackingId,
        orderNumber: s.orderNumber,
        status: s.status,
        customerName: s.destination?.fullName,
        destinationCity: s.destination?.city,
        destinationArea: s.destination?.area,
        deliveryPartnerName: s.deliveryPartnerName || 'Unassigned',
        attemptsCount: s.deliveryAttemptsCount,
        hasException: s.activeException?.resolved === false,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('[ADMIN_LOGISTICS_OVERVIEW_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to load logistics overview.' }, { status: 500 });
  }
}
