/**
 * 🔄 AL MUKAMMAL — Deterministic Order & Shipment State Machine Engine
 * Strict server-side transition validator with immutable rules and guards.
 */

export const ORDER_STATES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  PACKED: 'packed',
  READY_FOR_SHIPMENT: 'ready_for_shipment',
  SHIPPED: 'shipped',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  RETURN_REQUESTED: 'return_requested',
  RETURNED: 'returned',
  REFUNDED: 'refunded'
};

export const ORDER_TRANSITIONS = {
  [ORDER_STATES.PENDING]: [ORDER_STATES.CONFIRMED, ORDER_STATES.PROCESSING, ORDER_STATES.CANCELLED, ORDER_STATES.FAILED],
  [ORDER_STATES.CONFIRMED]: [ORDER_STATES.PROCESSING, ORDER_STATES.CANCELLED],
  [ORDER_STATES.PROCESSING]: [ORDER_STATES.PACKED, ORDER_STATES.SHIPPED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.PACKED]: [ORDER_STATES.READY_FOR_SHIPMENT, ORDER_STATES.SHIPPED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.READY_FOR_SHIPMENT]: [ORDER_STATES.SHIPPED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.SHIPPED]: [ORDER_STATES.IN_TRANSIT, ORDER_STATES.OUT_FOR_DELIVERY, ORDER_STATES.DELIVERED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.IN_TRANSIT]: [ORDER_STATES.OUT_FOR_DELIVERY, ORDER_STATES.DELIVERED, ORDER_STATES.SHIPPED],
  [ORDER_STATES.OUT_FOR_DELIVERY]: [ORDER_STATES.DELIVERED, ORDER_STATES.IN_TRANSIT],
  [ORDER_STATES.DELIVERED]: [ORDER_STATES.RETURN_REQUESTED],
  [ORDER_STATES.RETURN_REQUESTED]: [ORDER_STATES.RETURNED, ORDER_STATES.DELIVERED],
  [ORDER_STATES.RETURNED]: [ORDER_STATES.REFUNDED],
  [ORDER_STATES.CANCELLED]: [],
  [ORDER_STATES.FAILED]: [ORDER_STATES.PENDING],
  [ORDER_STATES.REFUNDED]: []
};

export const SHIPMENT_STATES = {
  CREATED: 'CREATED',
  ASSIGNMENT_PENDING: 'ASSIGNMENT_PENDING',
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED_AT_DESTINATION: 'ARRIVED_AT_DESTINATION',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERY_ATTEMPTED: 'DELIVERY_ATTEMPTED',
  DELIVERED: 'DELIVERED',
  UNDELIVERED: 'UNDELIVERED',
  RESCHEDULED: 'RESCHEDULED',
  RETURN_TO_ORIGIN: 'RETURN_TO_ORIGIN',
  RETURNED: 'RETURNED'
};

export const SHIPMENT_TRANSITIONS = {
  [SHIPMENT_STATES.CREATED]: [SHIPMENT_STATES.ASSIGNMENT_PENDING, SHIPMENT_STATES.ASSIGNED],
  [SHIPMENT_STATES.ASSIGNMENT_PENDING]: [SHIPMENT_STATES.ASSIGNED, SHIPMENT_STATES.CREATED],
  [SHIPMENT_STATES.ASSIGNED]: [SHIPMENT_STATES.PICKED_UP, SHIPMENT_STATES.ASSIGNMENT_PENDING],
  [SHIPMENT_STATES.PICKED_UP]: [SHIPMENT_STATES.IN_TRANSIT, SHIPMENT_STATES.OUT_FOR_DELIVERY],
  [SHIPMENT_STATES.IN_TRANSIT]: [SHIPMENT_STATES.ARRIVED_AT_DESTINATION, SHIPMENT_STATES.OUT_FOR_DELIVERY],
  [SHIPMENT_STATES.ARRIVED_AT_DESTINATION]: [SHIPMENT_STATES.OUT_FOR_DELIVERY, SHIPMENT_STATES.DELIVERY_ATTEMPTED, SHIPMENT_STATES.DELIVERED],
  [SHIPMENT_STATES.OUT_FOR_DELIVERY]: [SHIPMENT_STATES.ARRIVED_AT_DESTINATION, SHIPMENT_STATES.DELIVERY_ATTEMPTED, SHIPMENT_STATES.DELIVERED, SHIPMENT_STATES.UNDELIVERED],
  [SHIPMENT_STATES.DELIVERY_ATTEMPTED]: [SHIPMENT_STATES.OUT_FOR_DELIVERY, SHIPMENT_STATES.UNDELIVERED, SHIPMENT_STATES.RESCHEDULED],
  [SHIPMENT_STATES.UNDELIVERED]: [SHIPMENT_STATES.RESCHEDULED, SHIPMENT_STATES.RETURN_TO_ORIGIN],
  [SHIPMENT_STATES.RESCHEDULED]: [SHIPMENT_STATES.ASSIGNED, SHIPMENT_STATES.OUT_FOR_DELIVERY, SHIPMENT_STATES.IN_TRANSIT],
  [SHIPMENT_STATES.RETURN_TO_ORIGIN]: [SHIPMENT_STATES.RETURNED],
  [SHIPMENT_STATES.DELIVERED]: [],
  [SHIPMENT_STATES.RETURNED]: []
};

export const DELIVERY_EXCEPTION_REASONS = [
  'CUSTOMER_UNAVAILABLE',
  'WRONG_ADDRESS',
  'CUSTOMER_REQUESTED_RESCHEDULE',
  'ADDRESS_NOT_SERVICEABLE',
  'PHONE_UNREACHABLE',
  'DELIVERY_REFUSED',
  'DAMAGED_PACKAGE',
  'PACKAGE_LOST',
  'WEATHER_OR_OPERATIONAL_DELAY',
  'VEHICLE_ISSUE',
  'OTHER'
];

/**
 * Validate order status transition
 */
export function validateOrderTransition(currentStatus, nextStatus) {
  const normCurrent = (currentStatus || 'pending').toLowerCase();
  const normNext = (nextStatus || '').toLowerCase();

  if (normCurrent === normNext) {
    return { valid: true, noop: true };
  }

  const allowed = ORDER_TRANSITIONS[normCurrent] || [];
  if (!allowed.includes(normNext)) {
    return {
      valid: false,
      error: `Invalid order status transition from "${normCurrent}" to "${normNext}". Allowed transitions: ${allowed.join(', ') || 'None (Terminal state)'}`
    };
  }

  return { valid: true };
}

/**
 * Validate shipment status transition
 */
export function validateShipmentTransition(currentStatus, nextStatus, payload = {}) {
  const curr = currentStatus ? currentStatus.toUpperCase() : 'CREATED';
  const next = nextStatus ? nextStatus.toUpperCase() : '';

  if (curr === next) {
    return { valid: true, noop: true };
  }

  const allowed = SHIPMENT_TRANSITIONS[curr] || [];
  if (!allowed.includes(next)) {
    return {
      valid: false,
      error: `Invalid shipment status transition from "${curr}" to "${next}". Allowed transitions: ${allowed.join(', ') || 'None (Terminal state)'}`
    };
  }

  // Pre-condition guards
  if (next === SHIPMENT_STATES.DELIVERED) {
    if (!payload.proofOfDelivery && !payload.deliveryOtp && !payload.bypassProof) {
      return {
        valid: false,
        error: 'Proof of delivery or customer delivery OTP is required to mark shipment as DELIVERED.'
      };
    }
  }

  if (next === SHIPMENT_STATES.DELIVERY_ATTEMPTED || next === SHIPMENT_STATES.UNDELIVERED) {
    if (!payload.reason || !DELIVERY_EXCEPTION_REASONS.includes(payload.reason)) {
      return {
        valid: false,
        error: `A valid exception reason is required. Must be one of: ${DELIVERY_EXCEPTION_REASONS.join(', ')}`
      };
    }
  }

  return { valid: true };
}

/**
 * Derive synchronized order status from shipment status
 */
export function mapShipmentToOrderStatus(shipmentStatus) {
  switch (shipmentStatus) {
    case SHIPMENT_STATES.CREATED:
    case SHIPMENT_STATES.ASSIGNMENT_PENDING:
      return ORDER_STATES.READY_FOR_SHIPMENT;
    case SHIPMENT_STATES.ASSIGNED:
    case SHIPMENT_STATES.PICKED_UP:
    case SHIPMENT_STATES.IN_TRANSIT:
      return ORDER_STATES.SHIPPED;
    case SHIPMENT_STATES.OUT_FOR_DELIVERY:
    case SHIPMENT_STATES.ARRIVED_AT_DESTINATION:
      return ORDER_STATES.OUT_FOR_DELIVERY;
    case SHIPMENT_STATES.DELIVERED:
      return ORDER_STATES.DELIVERED;
    case SHIPMENT_STATES.RETURNED:
      return ORDER_STATES.RETURNED;
    case SHIPMENT_STATES.DELIVERY_ATTEMPTED:
    case SHIPMENT_STATES.UNDELIVERED:
    case SHIPMENT_STATES.RESCHEDULED:
    case SHIPMENT_STATES.RETURN_TO_ORIGIN:
    default:
      return null; // Keep existing order status, do not downgrade
  }
}
