# 📡 AL MUKAMMAL — Tracking & Logistics API Specification

## 1. Overview
The logistics API suite provides secured, authenticated, and role-authorized endpoints for customers, delivery partners, and store operations.

---

## 2. Customer & Public Tracking Endpoints

### `GET /api/track/[trackingId]`
- **Access:** Public with Verification / Authenticated Customer.
- **Description:** Returns the public tracking timeline, status, masked customer destination, driver first name, and estimated delivery window.
- **Privacy Protections:**
  - Masked customer name (e.g., `H***t A*i`).
  - Masked phone number (e.g., `+971 50 *** **21`).
  - Masked address (e.g., `Deira Sector 4, Dubai`).
  - No internal staff notes, database ObjectIds, or payment card details returned.
- **Response Structure:**
  ```json
  {
    "success": true,
    "tracking": {
      "trackingId": "TRK-982143-AE",
      "orderNumber": "ORD-123456-7890",
      "status": "OUT_FOR_DELIVERY",
      "orderDate": "2026-10-06T10:00:00.000Z",
      "estimatedDelivery": "Today, 5:30 PM",
      "items": [{ "name": "Lenovo ThinkPad P1 Gen 6", "quantity": 1 }],
      "deliveryPartner": {
        "name": "Ahmed (Al Mukammal Fleet)",
        "vehicleType": "VAN",
        "phoneMasked": "+971 50 *** 9012"
      },
      "timeline": [
        { "status": "ORDER_PLACED", "time": "10:00 AM", "completed": true },
        { "status": "PROCESSING", "time": "11:30 AM", "completed": true },
        { "status": "PACKED", "time": "01:15 PM", "completed": true },
        { "status": "OUT_FOR_DELIVERY", "time": "03:45 PM", "current": true },
        { "status": "DELIVERED", "time": "Est. 05:30 PM", "upcoming": true }
      ],
      "liveLocation": {
        "lat": 25.276987,
        "lng": 55.296249,
        "lastUpdated": "2026-10-06T15:50:00.000Z"
      }
    }
  }
  ```

### `GET /api/shipments/[trackingId]/stream` (Server-Sent Events)
- **Access:** Authenticated Customer / Assigned Driver / Operations.
- **Protocol:** `text/event-stream`.
- **Description:** Streams live GPS updates and state changes in real time.

---

## 3. Delivery Partner Operations Endpoints

### `GET /api/delivery/assignments`
- **Access:** Delivery Partner (`role === 'delivery_partner'`).
- **Description:** Retrieves shipments assigned to the authenticated driver.
- **Query Params:** `filter=active | completed | all`.

### `POST /api/delivery/shipments/[id]/transition`
- **Access:** Delivery Partner.
- **Headers:** `Idempotency-Key: <UUID>`.
- **Payload:**
  ```json
  {
    "toStatus": "PICKED_UP | OUT_FOR_DELIVERY | ARRIVED_AT_DESTINATION",
    "location": { "lat": 25.27, "lng": 55.30 },
    "remarks": "Driver on route to customer"
  }
  ```

### `POST /api/delivery/shipments/[id]/location`
- **Access:** Delivery Partner.
- **Rate Limit:** 1 update per 15 seconds.
- **Payload:**
  ```json
  {
    "lat": 25.2745,
    "lng": 55.3012,
    "accuracy": 8.5,
    "heading": 180,
    "speed": 42
  }
  ```

### `POST /api/delivery/shipments/[id]/complete` (Proof of Delivery)
- **Access:** Delivery Partner.
- **Payload:**
  ```json
  {
    "deliveryOtp": "492019",
    "receivedBy": "Customer in person",
    "signature": "data:image/png;base64,...",
    "idempotencyKey": "pod_8f3a_99b"
  }
  ```

### `POST /api/delivery/shipments/[id]/exception`
- **Access:** Delivery Partner.
- **Payload:**
  ```json
  {
    "reason": "CUSTOMER_UNAVAILABLE | WRONG_ADDRESS | PHONE_UNREACHABLE",
    "remarks": "Called twice, customer phone switched off at building gate",
    "location": { "lat": 25.27, "lng": 55.30 }
  }
  ```

---

## 4. Admin Logistics Management Endpoints

### `GET /api/admin/logistics/overview`
- **Access:** Admin / Operations.
- **Description:** High-level metrics: unassigned shipments, active drivers, success rate, SLA compliance.

### `POST /api/admin/shipments/[id]/assign`
- **Access:** Admin / Operations.
- **Payload:** `{ "deliveryPartnerId": "..." }`.

### `POST /api/admin/shipments/[id]/reschedule`
- **Access:** Admin / Operations.
- **Payload:** `{ "date": "2026-10-07", "timeSlot": "Morning (10AM - 2PM)", "reason": "Customer requested" }`.
