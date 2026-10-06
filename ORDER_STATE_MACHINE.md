# 🔄 AL MUKAMMAL — Order & Shipment State Machine

## 1. Overview
To ensure commercial integrity, no arbitrary status updates are permitted. Every transition must satisfy explicit state-machine guards executed strictly on the server.

---

## 2. Order States & Transitions

### Defined Order States:
- `PENDING`: Initial state upon checkout. Awaiting payment capture or cash confirmation.
- `CONFIRMED`: Payment captured or COD order verified by store.
- `PROCESSING`: Store warehouse team is preparing and testing hardware.
- `PACKED`: Order boxed, tamper-evident seal applied, ready for dispatch.
- `READY_FOR_SHIPMENT`: Awaiting carrier/driver assignment.
- `SHIPPED`: Handed over to logistics carrier or assigned delivery partner.
- `IN_TRANSIT`: Moving between distribution hubs or en route to customer sector.
- `OUT_FOR_DELIVERY`: On the vehicle with the delivery partner for final-mile delivery.
- `DELIVERED`: Successfully handed over with validated Proof of Delivery.
- `CANCELLED`: Order aborted before dispatch.
- `FAILED`: Payment failure or technical error.
- `RETURN_REQUESTED`: Customer requested return within policy window.
- `RETURNED`: Hardware returned to Deira showroom and inspected.
- `REFUNDED`: Funds returned to customer account/card.

### Order Transition Matrix:
```javascript
export const ORDER_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'FAILED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['READY_FOR_SHIPMENT', 'CANCELLED'],
  READY_FOR_SHIPMENT: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'SHIPPED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'IN_TRANSIT'],
  DELIVERED: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURNED', 'DELIVERED'],
  RETURNED: ['REFUNDED'],
  CANCELLED: [],
  FAILED: ['PENDING'],
  REFUNDED: []
};
```

---

## 3. Shipment States & Transitions

### Defined Shipment States:
- `CREATED`: Manifest created in system.
- `ASSIGNMENT_PENDING`: Waiting for a driver to be selected.
- `ASSIGNED`: Delivery partner assigned and notified.
- `PICKED_UP`: Partner took possession at showroom/warehouse.
- `IN_TRANSIT`: Driver on route through UAE highway/zones.
- `ARRIVED_AT_DESTINATION`: Driver within 100m of customer building.
- `OUT_FOR_DELIVERY`: Active delivery in progress.
- `DELIVERY_ATTEMPTED`: Knocked/called but customer unavailable.
- `DELIVERED`: Delivered with verified OTP / Signature.
- `UNDELIVERED`: Delivery failed after attempt window.
- `RESCHEDULED`: Customer agreed to new delivery date/time slot.
- `RETURN_TO_ORIGIN`: 3 failed attempts, returning package to Deira hub.
- `RETURNED`: Package received back at Al Mukammal showroom.

### Shipment Transition Matrix:
```javascript
export const SHIPMENT_TRANSITIONS = {
  CREATED: ['ASSIGNMENT_PENDING', 'ASSIGNED'],
  ASSIGNMENT_PENDING: ['ASSIGNED', 'CREATED'],
  ASSIGNED: ['PICKED_UP', 'ASSIGNMENT_PENDING'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['ARRIVED_AT_DESTINATION', 'OUT_FOR_DELIVERY'],
  ARRIVED_AT_DESTINATION: ['OUT_FOR_DELIVERY', 'DELIVERY_ATTEMPTED', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_ATTEMPTED', 'UNDELIVERED'],
  DELIVERY_ATTEMPTED: ['OUT_FOR_DELIVERY', 'UNDELIVERED', 'RESCHEDULED'],
  UNDELIVERED: ['RESCHEDULED', 'RETURN_TO_ORIGIN'],
  RESCHEDULED: ['ASSIGNED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT'],
  RETURN_TO_ORIGIN: ['RETURNED'],
  DELIVERED: [],
  RETURNED: []
};
```

---

## 4. State Transition Rules & Guards
1. **Immutable History:** Every transition generates an immutable record in `ShipmentEvent` with:
   - `orderId`, `shipmentId`, `fromStatus`, `toStatus`
   - `actorType`: `'system' | 'admin' | 'delivery_partner' | 'customer'`
   - `actorId`, `timestamp`, `location`, `remarks`, `metadata`
2. **Delivery Proof Guard:** Transition to `DELIVERED` MUST provide either a valid 6-digit delivery OTP or verified driver signature token.
3. **Delivery Attempt Guard:** Transition to `DELIVERY_ATTEMPTED` or `UNDELIVERED` MUST specify a structured reason from `DELIVERY_EXCEPTION_REASONS`.
4. **Idempotency Guard:** Repeated submissions with the same `idempotencyKey` return the previous state result without re-executing transition side-effects.
