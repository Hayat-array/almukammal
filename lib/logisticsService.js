import crypto from 'crypto';
import dbConnect from './mongodb.js';
import Order from '../models/Order.js';
import Shipment from '../models/Shipment.js';
import ShipmentEvent from '../models/ShipmentEvent.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import DeliveryAttempt from '../models/DeliveryAttempt.js';
import {
  validateShipmentTransition,
  validateOrderTransition,
  mapShipmentToOrderStatus,
  SHIPMENT_STATES,
  ORDER_STATES
} from './orderStateMachine.js';

const OTP_SECRET = process.env.OTP_SECRET || process.env.JWT_SECRET || 'almukammal-logistics-secret';

// SSE subscribers map: trackingId -> Set<ResponseController>
const sseSubscribers = new Map();

/**
 * Register SSE client for live shipment updates
 */
export function subscribeToShipment(trackingId, controller) {
  if (!sseSubscribers.has(trackingId)) {
    sseSubscribers.set(trackingId, new Set());
  }
  sseSubscribers.get(trackingId).add(controller);
}

/**
 * Unregister SSE client
 */
export function unsubscribeFromShipment(trackingId, controller) {
  const subscribers = sseSubscribers.get(trackingId);
  if (subscribers) {
    subscribers.delete(controller);
    if (subscribers.size === 0) {
      sseSubscribers.delete(trackingId);
    }
  }
}

/**
 * Broadcast payload to active SSE listeners
 */
export function broadcastShipmentUpdate(trackingId, data) {
  const subscribers = sseSubscribers.get(trackingId);
  if (subscribers) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const controller of subscribers) {
      try {
        controller.enqueue(new TextEncoder().encode(message));
      } catch {
        subscribers.delete(controller);
      }
    }
  }
}

/**
 * Cryptographic Delivery OTP Generator & Hasher
 */
export function generateDeliveryOtp() {
  const rawOtp = crypto.randomInt(100000, 999999).toString();
  const otpHash = crypto.createHmac('sha256', OTP_SECRET).update(rawOtp).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours valid window
  return { rawOtp, otpHash, expiresAt };
}

export function verifyDeliveryOtpHash(candidateOtp, storedHash) {
  if (!candidateOtp || !storedHash) return false;
  const candidateHash = crypto.createHmac('sha256', OTP_SECRET).update(candidateOtp.trim()).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(storedHash));
}

/**
 * Generate human-friendly, high-entropy tracking identifier
 */
export function generateTrackingId() {
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  const time = Date.now().toString().slice(-4);
  return `TRK-${time}-${rand}-AE`;
}

/**
 * 1. Create Shipment for an Order
 */
export async function createShipmentForOrder(orderId, options = {}) {
  await dbConnect();
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  if (order.shipment) {
    const existing = await Shipment.findById(order.shipment);
    if (existing) return existing;
  }

  const trackingId = generateTrackingId();
  const { rawOtp, otpHash, expiresAt } = generateDeliveryOtp();

  const shipment = new Shipment({
    trackingId,
    order: order._id,
    orderNumber: order.orderNumber,
    customer: order.customer || null,
    status: SHIPMENT_STATES.CREATED,
    origin: {
      hubName: 'Al Mukammal Central Showroom Hub',
      address: 'Al Sabkha Road, Naif, Deira, Dubai, UAE',
      city: 'Dubai',
      coordinates: { lat: 25.2723, lng: 55.3021 }
    },
    destination: {
      fullName: order.customerInfo?.fullName || 'Valued Customer',
      phone: order.customerInfo?.phone || '',
      address: order.customerInfo?.address || 'Dubai, UAE',
      city: order.customerInfo?.city || 'Dubai',
      area: order.customerInfo?.state || order.customerInfo?.town || '',
      notes: order.customerInfo?.notes || '',
      coordinates: { lat: 25.2048, lng: 55.2708 }
    },
    estimatedDeliveryWindow: {
      from: new Date(Date.now() + 24 * 60 * 60 * 1000),
      to: new Date(Date.now() + 48 * 60 * 60 * 1000),
      etaText: 'Scheduled within 24-48 hours'
    }
  });

  await shipment.save();

  // Link to order
  order.shipment = shipment._id;
  order.trackingNumber = trackingId;
  order.deliveryOtpHash = otpHash;
  order.deliveryOtpExpiresAt = expiresAt;
  await order.save();

  // Create initial audit event
  await createShipmentEvent({
    shipmentId: shipment._id,
    trackingId,
    orderId: order._id,
    status: SHIPMENT_STATES.CREATED,
    title: 'Shipment Manifest Created',
    description: `Package registered at Al Mukammal Deira Hub. Tracking ID ${trackingId} assigned.`,
    actorType: options.actorType || 'system',
    actorId: options.actorId || 'system',
    actorName: options.actorName || 'Al Mukammal Dispatch'
  });

  return { shipment, rawDeliveryOtp: rawOtp };
}

/**
 * 2. Immutable Event Ledger Logging
 */
export async function createShipmentEvent({
  shipmentId,
  trackingId,
  orderId,
  status,
  previousStatus = null,
  title,
  description = '',
  actorType = 'system',
  actorId = 'system',
  actorName = 'System',
  location = { name: 'Dubai, UAE' },
  metadata = {}
}) {
  await dbConnect();
  const eventId = `evt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const event = new ShipmentEvent({
    eventId,
    shipment: shipmentId,
    trackingId,
    order: orderId,
    status,
    previousStatus,
    title,
    description,
    actorType,
    actorId,
    actorName,
    location,
    metadata
  });

  await event.save();

  // Trigger real-time broadcast
  broadcastShipmentUpdate(trackingId, {
    type: 'STATUS_CHANGE',
    status,
    title,
    description,
    timestamp: event.createdAt
  });

  return event;
}

/**
 * 3. Transition Shipment State with Validation & Guards
 */
export async function transitionShipment({
  shipmentId,
  nextStatus,
  actorType = 'system',
  actorId = 'system',
  actorName = 'System',
  location = null,
  remarks = '',
  metadata = {},
  proofOfDelivery = null,
  reason = null
}) {
  await dbConnect();
  const shipment = await Shipment.findById(shipmentId).populate('order');
  if (!shipment) throw new Error('Shipment not found');

  const prevStatus = shipment.status;

  // Validate via state machine
  const validation = validateShipmentTransition(prevStatus, nextStatus, {
    proofOfDelivery,
    deliveryOtp: metadata?.deliveryOtp,
    bypassProof: metadata?.bypassProof,
    reason
  });

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (validation.noop) {
    return shipment;
  }

  shipment.status = nextStatus;

  if (proofOfDelivery) {
    shipment.proofOfDelivery = {
      method: proofOfDelivery.method || 'OTP',
      verifiedAt: new Date(),
      receivedBy: proofOfDelivery.receivedBy || 'Recipient',
      signatureUrl: proofOfDelivery.signatureUrl || '',
      photoUrl: proofOfDelivery.photoUrl || '',
      remarks: remarks || ''
    };
  }

  if (reason) {
    shipment.activeException = {
      code: reason,
      reason: remarks || reason,
      timestamp: new Date(),
      resolved: false
    };
  } else if (nextStatus === SHIPMENT_STATES.DELIVERED) {
    if (shipment.activeException) {
      shipment.activeException.resolved = true;
    }
  }

  if (metadata?.deliveryAttemptsCount != null) {
    shipment.deliveryAttemptsCount = metadata.deliveryAttemptsCount;
  }

  await shipment.save();

  // Log audit event
  await createShipmentEvent({
    shipmentId: shipment._id,
    trackingId: shipment.trackingId,
    orderId: shipment.order._id,
    status: nextStatus,
    previousStatus: prevStatus,
    title: `Shipment ${nextStatus.replace(/_/g, ' ')}`,
    description: remarks || `Status changed from ${prevStatus} to ${nextStatus}`,
    actorType,
    actorId,
    actorName,
    location: location || { name: 'Dubai, UAE' },
    metadata
  });

  // Synchronize Order status
  const correspondingOrderStatus = mapShipmentToOrderStatus(nextStatus);
  if (correspondingOrderStatus) {
    const order = await Order.findById(shipment.order._id);
    if (order) {
      const orderVal = validateOrderTransition(order.status, correspondingOrderStatus);
      if (orderVal.valid && !orderVal.noop) {
        order.status = correspondingOrderStatus;
        await order.save();
      }
    }
  }

  return shipment;
}

/**
 * 4. Assign Delivery Partner to Shipment
 */
export async function assignDeliveryPartnerToShipment(shipmentId, partnerId, actor = {}) {
  await dbConnect();
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw new Error('Shipment not found');

  const partner = await DeliveryPartner.findById(partnerId);
  if (!partner) throw new Error('Delivery partner not found');

  shipment.deliveryPartner = partner._id;
  shipment.deliveryPartnerName = partner.name;
  shipment.deliveryPartnerPhone = partner.phone;
  await shipment.save();

  // Transition to ASSIGNED
  const updatedShipment = await transitionShipment({
    shipmentId,
    nextStatus: SHIPMENT_STATES.ASSIGNED,
    actorType: actor.role || 'admin',
    actorId: actor.userId || 'admin',
    actorName: actor.name || 'Operations Manager',
    remarks: `Assigned to delivery partner ${partner.name} (${partner.partnerCode})`,
    metadata: { partnerId: partner._id.toString(), partnerCode: partner.partnerCode }
  });

  partner.activeDeliveriesCount += 1;
  await partner.save();

  return updatedShipment;
}

/**
 * 5. Ingest GPS Location Update from Delivery Partner
 */
export async function updateShipmentLocation(shipmentId, { lat, lng, accuracy = 10, heading = null, speed = null }) {
  await dbConnect();
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Valid latitude and longitude numbers are required');
  }

  // Sanity check coordinates (UAE bounding box approximately 22-27N, 51-57E)
  if (lat < 20 || lat > 28 || lng < 50 || lng > 58) {
    throw new Error('Coordinates outside serviceable territory');
  }

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw new Error('Shipment not found');

  const locObj = {
    lat,
    lng,
    accuracy,
    heading,
    speed,
    updatedAt: new Date()
  };

  shipment.currentLocation = locObj;
  await shipment.save();

  // If partner is attached, update partner location too
  if (shipment.deliveryPartner) {
    await DeliveryPartner.findByIdAndUpdate(shipment.deliveryPartner, {
      currentLocation: locObj
    });
  }

  // Real-time broadcast
  broadcastShipmentUpdate(shipment.trackingId, {
    type: 'LOCATION_UPDATE',
    location: locObj
  });

  return locObj;
}

/**
 * 6. Record Delivery Attempt (Exception Tracking)
 */
export async function recordDeliveryAttempt(shipmentId, { outcome, reason, remarks = '', location = null, actor = {} }) {
  await dbConnect();
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw new Error('Shipment not found');

  shipment.deliveryAttemptsCount = (shipment.deliveryAttemptsCount || 0) + 1;
  const attemptNum = shipment.deliveryAttemptsCount;

  const attempt = new DeliveryAttempt({
    attemptId: `att_${Date.now()}_${attemptNum}`,
    shipment: shipment._id,
    trackingId: shipment.trackingId,
    order: shipment.order,
    attemptNumber: attemptNum,
    deliveryPartner: shipment.deliveryPartner || null,
    deliveryPartnerName: shipment.deliveryPartnerName || '',
    outcome: outcome || 'FAILED',
    reason: reason || 'CUSTOMER_UNAVAILABLE',
    remarks,
    location
  });

  await attempt.save();

  // Determine transition
  let nextStatus = SHIPMENT_STATES.DELIVERY_ATTEMPTED;
  if (attemptNum >= (shipment.maxDeliveryAttempts || 3)) {
    nextStatus = SHIPMENT_STATES.RETURN_TO_ORIGIN;
  }

  await transitionShipment({
    shipmentId,
    nextStatus,
    actorType: actor.role || 'delivery_partner',
    actorId: actor.userId || 'driver',
    actorName: actor.name || 'Delivery Partner',
    location,
    remarks: `Delivery attempt #${attemptNum} failed: ${reason}. ${remarks}`,
    reason,
    metadata: { deliveryAttemptsCount: attemptNum }
  });

  return attempt;
}

/**
 * 7. Verify and Complete Proof of Delivery
 */
export async function completeDeliveryWithProof(shipmentId, { deliveryOtp = null, receivedBy = 'Recipient', signatureUrl = '', photoUrl = '', remarks = '', actor = {} }) {
  await dbConnect();
  const shipment = await Shipment.findById(shipmentId).populate('order');
  if (!shipment) throw new Error('Shipment not found');

  const order = await Order.findById(shipment.order._id).select('+deliveryOtpHash');
  if (!order) throw new Error('Associated order not found');

  let verifiedMethod = 'STAFF_OVERRIDE';

  if (deliveryOtp) {
    const isValid = verifyDeliveryOtpHash(deliveryOtp, order.deliveryOtpHash);
    if (!isValid) {
      throw new Error('Invalid delivery confirmation OTP. Please check the 6-digit code with the customer.');
    }
    verifiedMethod = 'OTP';
  } else if (signatureUrl) {
    verifiedMethod = 'SIGNATURE';
  } else if (photoUrl) {
    verifiedMethod = 'PHOTO';
  }

  await transitionShipment({
    shipmentId,
    nextStatus: SHIPMENT_STATES.DELIVERED,
    actorType: actor.role || 'delivery_partner',
    actorId: actor.userId || 'driver',
    actorName: actor.name || 'Delivery Partner',
    remarks: remarks || `Successfully delivered via ${verifiedMethod}`,
    proofOfDelivery: {
      method: verifiedMethod,
      receivedBy,
      signatureUrl,
      photoUrl,
      remarks
    }
  });

  // Increment completed deliveries for partner
  if (shipment.deliveryPartner) {
    await DeliveryPartner.findByIdAndUpdate(shipment.deliveryPartner, {
      $inc: { completedDeliveriesCount: 1, activeDeliveriesCount: -1 }
    });
  }

  return { success: true, message: 'Delivery successfully verified and marked DELIVERED' };
}

/**
 * 8. Reschedule Delivery
 */
export async function rescheduleShipment(shipmentId, { requestedDate, timeSlot = 'Standard (10AM - 6PM)', reason = 'Customer requested', requestedBy = 'Customer' }) {
  await dbConnect();
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw new Error('Shipment not found');

  shipment.rescheduleHistory.push({
    requestedDate: new Date(requestedDate),
    timeSlot,
    reason,
    requestedBy
  });

  shipment.estimatedDeliveryWindow = {
    from: new Date(requestedDate),
    to: new Date(new Date(requestedDate).getTime() + 8 * 60 * 60 * 1000),
    etaText: `Rescheduled for ${new Date(requestedDate).toDateString()} (${timeSlot})`
  };

  await shipment.save();

  await transitionShipment({
    shipmentId,
    nextStatus: SHIPMENT_STATES.RESCHEDULED,
    actorType: 'customer',
    actorName: requestedBy,
    remarks: `Delivery rescheduled to ${new Date(requestedDate).toDateString()} (${timeSlot}): ${reason}`
  });

  return shipment;
}

/**
 * 9. Public / Customer Tracking Information (Sanitized)
 */
export async function getPublicTrackingData(trackingIdOrOrderNumber) {
  await dbConnect();
  const query = trackingIdOrOrderNumber.startsWith('TRK-')
    ? { trackingId: trackingIdOrOrderNumber }
    : { orderNumber: trackingIdOrOrderNumber };

  let shipment = await Shipment.findOne(query).populate('order');

  // If no shipment exists yet, check if order exists (pre-logistics legacy order or freshly placed)
  if (!shipment) {
    const order = await Order.findOne({ orderNumber: trackingIdOrOrderNumber });
    if (!order) return null;

    // Auto-create shipment for modern order if not yet generated
    const res = await createShipmentForOrder(order._id);
    shipment = res.shipment;
  }

  const events = await ShipmentEvent.find({ shipment: shipment._id }).sort({ createdAt: 1 });

  // Mask PII
  const maskText = (str) => {
    if (!str || str.length <= 3) return '***';
    return `${str.slice(0, 2)}***${str.slice(-1)}`;
  };

  const maskPhone = (phone) => {
    if (!phone) return '***';
    const clean = phone.replace(/\s+/g, '');
    return `${clean.slice(0, 5)} *** **${clean.slice(-2)}`;
  };

  return {
    trackingId: shipment.trackingId,
    orderNumber: shipment.orderNumber,
    status: shipment.status,
    createdAt: shipment.createdAt,
    estimatedDelivery: shipment.estimatedDeliveryWindow?.etaText || 'Scheduled soon',
    destinationCity: shipment.destination?.city || 'Dubai',
    destinationArea: shipment.destination?.area || 'Deira',
    customerMaskedName: maskText(shipment.destination?.fullName),
    customerMaskedPhone: maskPhone(shipment.destination?.phone),
    deliveryPartner: shipment.deliveryPartnerName
      ? {
          name: shipment.deliveryPartnerName.split(' ')[0] + ' (Al Mukammal Fleet)',
          phoneMasked: maskPhone(shipment.deliveryPartnerPhone),
          vehicleType: 'Fleet Van'
        }
      : null,
    currentLocation: shipment.status === SHIPMENT_STATES.OUT_FOR_DELIVERY ? shipment.currentLocation : null,
    deliveryAttemptsCount: shipment.deliveryAttemptsCount,
    activeException: shipment.activeException?.resolved === false ? shipment.activeException : null,
    timeline: events.map(e => ({
      eventId: e.eventId,
      status: e.status,
      title: e.title,
      description: e.description,
      location: e.location?.name || 'Dubai, UAE',
      timestamp: e.createdAt
    }))
  };
}
