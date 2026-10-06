import mongoose from 'mongoose';
import dbConnect from '../lib/mongodb.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Shipment from '../models/Shipment.js';
import ShipmentEvent from '../models/ShipmentEvent.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import DeliveryAttempt from '../models/DeliveryAttempt.js';
import SupportTicket from '../models/SupportTicket.js';
import {
  ORDER_STATES,
  SHIPMENT_STATES,
  validateOrderTransition,
  validateShipmentTransition,
  mapShipmentToOrderStatus
} from '../lib/orderStateMachine.js';
import {
  createShipmentForOrder,
  assignDeliveryPartnerToShipment,
  updateShipmentLocation,
  recordDeliveryAttempt,
  completeDeliveryWithProof,
  rescheduleShipment,
  generateDeliveryOtp,
  verifyDeliveryOtpHash
} from '../lib/logisticsService.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('🚚 RUNNING PRODUCTION LOGISTICS & FULFILLMENT INTEGRATION SUITE');
  console.log('================================================================\n');

  await dbConnect();

  // ---------------------------------------------------------------------------
  // SUITE 1: Finite State Machine Determinism & Guards
  // ---------------------------------------------------------------------------
  console.log('\n--- 1. Order & Shipment State Machine Transition Guards ---');
  
  // Valid transitions
  assert(validateOrderTransition(ORDER_STATES.PENDING, ORDER_STATES.CONFIRMED).valid, 'Valid order transition: pending -> confirmed');
  assert(validateOrderTransition(ORDER_STATES.CONFIRMED, ORDER_STATES.PROCESSING).valid, 'Valid order transition: confirmed -> processing');
  assert(validateOrderTransition(ORDER_STATES.PROCESSING, ORDER_STATES.PACKED).valid, 'Valid order transition: processing -> packed');
  assert(validateOrderTransition(ORDER_STATES.PACKED, ORDER_STATES.SHIPPED).valid, 'Valid order transition: packed -> shipped');
  assert(validateOrderTransition(ORDER_STATES.SHIPPED, ORDER_STATES.OUT_FOR_DELIVERY).valid, 'Valid order transition: shipped -> out_for_delivery');
  assert(validateOrderTransition(ORDER_STATES.OUT_FOR_DELIVERY, ORDER_STATES.DELIVERED).valid, 'Valid order transition: out_for_delivery -> delivered');

  // Invalid forbidden transitions
  assert(!validateOrderTransition(ORDER_STATES.PENDING, ORDER_STATES.DELIVERED).valid, 'Invalid transition blocked: pending -> delivered');
  assert(!validateOrderTransition(ORDER_STATES.CONFIRMED, ORDER_STATES.DELIVERED).valid, 'Invalid transition blocked: confirmed -> delivered');
  assert(!validateOrderTransition(ORDER_STATES.DELIVERED, ORDER_STATES.PROCESSING).valid, 'Invalid transition blocked: delivered -> processing');

  // Shipment State transitions
  assert(validateShipmentTransition(SHIPMENT_STATES.CREATED, SHIPMENT_STATES.ASSIGNED).valid, 'Valid shipment transition: created -> assigned');
  assert(validateShipmentTransition(SHIPMENT_STATES.ASSIGNED, SHIPMENT_STATES.PICKED_UP).valid, 'Valid shipment transition: assigned -> picked_up');
  assert(validateShipmentTransition(SHIPMENT_STATES.PICKED_UP, SHIPMENT_STATES.IN_TRANSIT).valid, 'Valid shipment transition: picked_up -> in_transit');
  assert(validateShipmentTransition(SHIPMENT_STATES.IN_TRANSIT, SHIPMENT_STATES.OUT_FOR_DELIVERY).valid, 'Valid shipment transition: in_transit -> out_for_delivery');
  assert(validateShipmentTransition(SHIPMENT_STATES.OUT_FOR_DELIVERY, SHIPMENT_STATES.DELIVERED, { bypassProof: true }).valid, 'Valid shipment transition: out_for_delivery -> delivered');
  assert(validateShipmentTransition(SHIPMENT_STATES.OUT_FOR_DELIVERY, SHIPMENT_STATES.DELIVERY_ATTEMPTED, { reason: 'CUSTOMER_UNAVAILABLE' }).valid, 'Valid shipment transition: out_for_delivery -> delivery_attempted');
  assert(validateShipmentTransition(SHIPMENT_STATES.DELIVERY_ATTEMPTED, SHIPMENT_STATES.RESCHEDULED).valid, 'Valid shipment transition: delivery_attempted -> rescheduled');
  assert(validateShipmentTransition(SHIPMENT_STATES.RESCHEDULED, SHIPMENT_STATES.OUT_FOR_DELIVERY).valid, 'Valid shipment transition: rescheduled -> out_for_delivery');

  // Invalid shipment transitions
  assert(!validateShipmentTransition(SHIPMENT_STATES.CREATED, SHIPMENT_STATES.DELIVERED).valid, 'Invalid shipment transition blocked: created -> delivered');
  assert(!validateShipmentTransition(SHIPMENT_STATES.ASSIGNED, SHIPMENT_STATES.DELIVERED).valid, 'Invalid shipment transition blocked: assigned -> delivered');

  // Status mapping
  assert(mapShipmentToOrderStatus(SHIPMENT_STATES.OUT_FOR_DELIVERY) === ORDER_STATES.OUT_FOR_DELIVERY, 'Shipment status correctly maps to Order status');
  assert(mapShipmentToOrderStatus(SHIPMENT_STATES.DELIVERED) === ORDER_STATES.DELIVERED, 'Shipment delivered correctly maps to Order delivered');

  // ---------------------------------------------------------------------------
  // SUITE 2: Order & Shipment Provisioning
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. End-to-End Order Creation & Shipment Manifest Provisioning ---');

  const testCustomer = await User.create({
    name: 'Al Mukammal VIP Buyer',
    email: `vip_buyer_${Date.now()}@example.com`,
    password: 'HashedPasswordTest123!',
    dob: new Date('1995-05-15'),
    role: 'user',
    emailVerified: true
  });

  const { rawOtp, otpHash, expiresAt } = generateDeliveryOtp();
  assert(/^\d{6}$/.test(rawOtp), 'Delivery OTP is 6 digits');
  assert(verifyDeliveryOtpHash(rawOtp, otpHash), 'Delivery OTP verification succeeds with correct HMAC');
  assert(!verifyDeliveryOtpHash('123456', otpHash), 'Delivery OTP verification fails with incorrect OTP');

  const testOrder = await Order.create({
    orderNumber: `AM-TEST-${Date.now().toString().slice(-6)}`,
    customer: testCustomer._id,
    customerInfo: {
      fullName: testCustomer.name,
      email: testCustomer.email,
      phone: '+971501234567',
      address: 'Sheikh Zayed Road, Floor 44, Tower 1',
      city: 'Dubai',
      state: 'Dubai',
      country: 'United Arab Emirates'
    },
    items: [
      {
        product: new mongoose.Types.ObjectId().toString(),
        name: 'MacBook Pro 16 M3 Max (36GB/1TB)',
        price: 13999,
        quantity: 1
      }
    ],
    subtotal: 13999,
    shipping: 0,
    totalAmount: 13999,
    status: ORDER_STATES.CONFIRMED,
    deliveryOtpHash: otpHash,
    deliveryOtpExpiresAt: expiresAt
  });

  assert(testOrder._id != null, 'Test order successfully persisted');

  const { shipment, rawDeliveryOtp } = await createShipmentForOrder(testOrder._id);

  assert(shipment != null, 'Shipment manifest provisioned for order');
  assert(shipment.trackingId.startsWith('TRK-'), `Unique AWB generated: ${shipment.trackingId}`);
  assert(shipment.status === SHIPMENT_STATES.CREATED, 'Initial shipment state is CREATED');
  assert(shipment.order.toString() === testOrder._id.toString(), 'Shipment references correct order ID');

  const initialEvent = await ShipmentEvent.findOne({ shipment: shipment._id });
  assert(initialEvent != null, 'Immutable audit event created in ShipmentEvent ledger');
  assert(initialEvent.status === SHIPMENT_STATES.CREATED, 'Audit event records status CREATED');

  // ---------------------------------------------------------------------------
  // SUITE 3: Delivery Partner Fleet Profile & Assignment
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Delivery Partner Fleet Management & Assignment ---');

  const driverUser = await User.create({
    name: 'Rashid Al Nuaimi (Fleet Driver #09)',
    email: `driver_${Date.now()}@almukammal.ae`,
    password: 'DriverPassword123!',
    dob: new Date('1992-08-20'),
    role: 'delivery_partner',
    emailVerified: true
  });

  const deliveryPartner = await DeliveryPartner.create({
    user: driverUser._id,
    partnerCode: `AM-DRV-${Date.now().toString().slice(-4)}`,
    name: driverUser.name,
    phone: '+971559876543',
    vehicleType: 'VAN',
    plateNumber: 'DXB-K-94182',
    operatingZones: ['Dubai', 'Sharjah'],
    currentStatus: 'AVAILABLE',
    activeDeliveriesCount: 0
  });

  assert(deliveryPartner != null, 'Delivery partner driver profile created');
  assert(deliveryPartner.currentStatus === 'AVAILABLE', 'Driver status is initially AVAILABLE');

  // Assign delivery partner to shipment
  const assignedShipment = await assignDeliveryPartnerToShipment(
    shipment._id,
    deliveryPartner._id,
    { role: 'admin', userId: 'admin-1', name: 'Operations Desk' }
  );

  assert(assignedShipment.status === SHIPMENT_STATES.ASSIGNED, 'Shipment state updated to ASSIGNED');
  assert(assignedShipment.deliveryPartner.toString() === deliveryPartner._id.toString(), 'Delivery partner linked on shipment');

  const updatedDriver = await DeliveryPartner.findById(deliveryPartner._id);
  assert(updatedDriver.activeDeliveriesCount === 1, 'Driver active delivery count incremented');

  // ---------------------------------------------------------------------------
  // SUITE 4: Live GPS Location Broadcasting & Validation
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Driver Live Location Updates & Spatial Telemetry ---');

  const locUpdateResult = await updateShipmentLocation(
    assignedShipment._id,
    {
      lat: 25.2048,
      lng: 55.2708,
      speed: 48,
      heading: 120,
      accuracy: 5
    }
  );

  assert(locUpdateResult.lat === 25.2048, 'Latitude correctly recorded in Dubai coordinates');
  assert(locUpdateResult.lng === 55.2708, 'Longitude correctly recorded');
  assert(locUpdateResult.updatedAt != null, 'Location timestamp recorded');

  // Advance shipment and order through workflow: PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY
  assignedShipment.status = SHIPMENT_STATES.PICKED_UP;
  await assignedShipment.save();
  assignedShipment.status = SHIPMENT_STATES.IN_TRANSIT;
  await assignedShipment.save();
  assignedShipment.status = SHIPMENT_STATES.OUT_FOR_DELIVERY;
  await assignedShipment.save();

  // Advance order to out_for_delivery according to lifecycle
  testOrder.status = ORDER_STATES.OUT_FOR_DELIVERY;
  await testOrder.save();

  // ---------------------------------------------------------------------------
  // SUITE 5: Delivery Exception & Structured Failure Logging
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Delivery Exception & Structured Failure Attempt Logging ---');

  // Simulate driver attempting delivery but customer unavailable
  const attempt = await recordDeliveryAttempt(assignedShipment._id, {
    outcome: 'FAILED',
    reason: 'CUSTOMER_UNAVAILABLE',
    remarks: 'Customer did not respond at villa intercom; phone unreachable after 3 calls.',
    location: { lat: 25.2048, lng: 55.2708 },
    actor: { role: 'delivery_partner', userId: driverUser._id.toString(), name: driverUser.name }
  });

  assert(attempt.outcome === 'FAILED', 'Delivery attempt outcome recorded as FAILED');
  assert(attempt.reason === 'CUSTOMER_UNAVAILABLE', 'Structured reason accurately logged');
  assert(attempt.attemptNumber === 1, 'Attempt record #1 stored in DeliveryAttempt model');

  const reloadedShipment = await Shipment.findById(assignedShipment._id);
  assert(reloadedShipment.status === SHIPMENT_STATES.DELIVERY_ATTEMPTED, 'Shipment marked as DELIVERY_ATTEMPTED');
  assert(reloadedShipment.deliveryAttemptsCount === 1, 'Attempt counter incremented to 1');

  // ---------------------------------------------------------------------------
  // SUITE 6: Rescheduling Workflow
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Delivery Rescheduling Workflow ---');

  await rescheduleShipment(assignedShipment._id, {
    requestedDate: '2026-10-08',
    timeSlot: 'AFTERNOON_14_TO_18',
    reason: 'Customer requested afternoon slot via concierge.',
    requestedBy: 'Customer'
  });

  const rescheduledShipment = await Shipment.findById(assignedShipment._id);
  assert(rescheduledShipment.status === SHIPMENT_STATES.RESCHEDULED, 'Shipment transitioned to RESCHEDULED');
  assert(rescheduledShipment.rescheduleHistory.length === 1, 'Reschedule history logged');
  assert(rescheduledShipment.rescheduleHistory[0].timeSlot === 'AFTERNOON_14_TO_18', 'Time slot recorded correctly');

  // Transition back to OUT_FOR_DELIVERY for retry attempt #2
  rescheduledShipment.status = SHIPMENT_STATES.OUT_FOR_DELIVERY;
  await rescheduledShipment.save();

  // ---------------------------------------------------------------------------
  // SUITE 7: Proof of Delivery (PoD) with Cryptographic Single-Use OTP
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Proof of Delivery (PoD) Single-Use OTP Verification ---');

  // Reload order to fetch current deliveryOtpHash
  const currentOrder = await Order.findById(testOrder._id).select('+deliveryOtpHash');

  // Invalid OTP attempt must fail
  let invalidOtpPassed = false;
  try {
    await completeDeliveryWithProof(rescheduledShipment._id, {
      deliveryOtp: '000000', // incorrect OTP
      receivedBy: 'Wrong Person',
      actor: { role: 'delivery_partner', userId: driverUser._id.toString(), name: driverUser.name }
    });
    invalidOtpPassed = true;
  } catch (err) {
    assert(err.message.includes('Invalid delivery confirmation OTP'), 'Incorrect delivery OTP rejected with secure error');
  }
  assert(!invalidOtpPassed, 'Incorrect OTP is not allowed to complete delivery');

  // Correct OTP attempt must succeed
  const deliveryComplete = await completeDeliveryWithProof(rescheduledShipment._id, {
    deliveryOtp: rawDeliveryOtp,
    receivedBy: 'Al Mukammal VIP Buyer',
    actor: { role: 'delivery_partner', userId: driverUser._id.toString(), name: driverUser.name }
  });

  assert(deliveryComplete.success === true, 'Delivery successfully verified');

  const deliveredShipment = await Shipment.findById(rescheduledShipment._id);
  assert(deliveredShipment.status === SHIPMENT_STATES.DELIVERED, 'Shipment successfully marked DELIVERED');
  assert(deliveredShipment.proofOfDelivery?.method === 'OTP', 'PoD marked as OTP method');

  const finalOrder = await Order.findById(testOrder._id);
  assert(finalOrder.status === ORDER_STATES.DELIVERED, 'Parent Order updated to DELIVERED atomically');

  // ---------------------------------------------------------------------------
  // SUITE 8: Customer Support Ticket Ledger
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Customer Support Ticket Creation & Ledger ---');

  const ticket = await SupportTicket.create({
    ticketId: `TCK-TEST-${Date.now().toString().slice(-6)}`,
    customer: testCustomer._id,
    customerEmail: testCustomer.email,
    order: testOrder._id,
    category: 'ORDER_TRACKING',
    priority: 'HIGH',
    status: 'OPEN',
    subject: 'VIP Express Delivery Inquiry',
    messages: [
      {
        senderType: 'customer',
        senderName: testCustomer.name,
        message: 'Please ensure luxury gift packaging is included.'
      }
    ]
  });

  assert(ticket != null, 'Support ticket successfully persisted in database');
  assert(ticket.ticketId.startsWith('TCK-'), `Ticket ID generated: ${ticket.ticketId}`);
  assert(ticket.status === 'OPEN', 'Ticket initial status is OPEN');

  // Cleanup test artifacts
  await SupportTicket.deleteMany({ customer: testCustomer._id });
  await DeliveryAttempt.deleteMany({ shipment: shipment._id });
  await ShipmentEvent.deleteMany({ shipment: shipment._id });
  await Shipment.deleteMany({ order: testOrder._id });
  await Order.deleteMany({ customer: testCustomer._id });
  await DeliveryPartner.deleteMany({ user: driverUser._id });
  await User.deleteMany({ email: { $in: [testCustomer.email, driverUser.email] } });

  console.log('\n======================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
