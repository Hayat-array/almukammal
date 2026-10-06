# 🚚 AL MUKAMMAL — Production Logistics & Delivery Management Architecture

## 1. Executive Summary
This document specifies the end-to-end commerce and fulfillment architecture for **AL MUKAMMAL COMPUTERS & REQUISITES TRADING L.L.C** (Dubai, UAE). The platform upgrades Al Mukammal from a storefront into an enterprise-grade fulfillment system covering order lifecycle tracking, delivery partner management, live GPS/ETA updates, failure and exception workflows, proof-of-delivery verification, and AI-powered customer care.

---

## 2. Core Architectural Principles
1. **Single Source of Truth:**
   The MongoDB database and server-side state machine are authoritative. No client (customer, delivery driver, or admin) can force an arbitrary status change.
2. **Zero-Trust Role-Based Access Control (RBAC):**
   - `customer`: Can only view/track their own orders, request rescheduling, and generate/verify delivery OTPs.
   - `delivery_partner`: Can only view assigned shipments, report location, record attempts, and complete deliveries with proof.
   - `operations` / `admin` / `super_admin`: Full operational control, partner assignment, exception resolution, and audit inspection.
   - `support_agent`: Customer support ticket management and verified order inquiry.
3. **Additive & Backwards-Compatible:**
   Existing orders, products, users, payments, and carts continue functioning without schema rupture or legacy record mutation. Historical orders without shipment records are treated as `legacy_completed` without synthetic history fabrication.
4. **Resilience & Offline Idempotency:**
   Delivery partner network drops in UAE underground parking or elevators will not lose state or duplicate events. State changes require unique idempotency keys (`idempotencyKey`).
5. **Real-Time Efficiency:**
   Real-time event streaming via Server-Sent Events (SSE) `/api/shipments/[id]/stream` and controlled location polling intervals (`LOCATION_UPDATE_INTERVAL_SECONDS = 15s`) prevent battery drain and excessive database writes.

---

## 3. High-Level System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT SURFACES                                   |
|                                                                                   |
|  [Customer Web]          [Delivery Partner PWA]       [Admin Command Center]      |
|  - /orders               - /delivery/dashboard        - /admin/logistics          |
|  - /track/[trackingId]   - /delivery/shipments/[id]   - /admin/orders             |
|  - Customer Care Bot     - Offline Queue & Sync       - Partner Dispatch          |
+---------+--------------------------+----------------------------+-----------------+
          |                          |                            |
          | HTTP / SSE               | HTTP / Idempotency         | HTTP / RBAC
          v                          v                            v
+-----------------------------------------------------------------------------------+
|                               NEXT.JS API ENGINE                                  |
|                                                                                   |
|  [Auth Middleware & RBAC]         [Order & Shipment Service]   [State Machine]    |
|  - verifyUser / verifyAdmin       - Strict Validation          - Pre/Post Guards  |
|  - verifyDeliveryPartner          - Status Transition Engine   - Transition Matrix|
|                                                                                   |
|  [Location Ingestion]             [Notification Dispatcher]    [Customer Care Bot]|
|  - Throttled Rate Limiting        - Email (SMTP/Nodemailer)    - Grounded Tools   |
|  - Accuracy & Coordinates Check   - WhatsApp Deep-Link         - RAG Knowledge    |
|  - SSE Broadcaster                - In-App Alerts              - Ticket Escalator |
+------------------------------------+----------------------------------------------+
                                     |
                                     v
+-----------------------------------------------------------------------------------+
|                              MONGODB ATLAS DATA LAYER                             |
|                                                                                   |
|  - orders (Extended with shipment ref, trackingId, deliveryMeta)                  |
|  - shipments (TrackingId, driver ref, status, ETA, currentCoords, pod)            |
|  - shipment_events (Immutable append-only audit trail & status history)           |
|  - delivery_partners (Vehicle, zone, active status, rating, currentCoords)        |
|  - delivery_attempts (Attempt #, timestamp, reason, coordinates, remarks)         |
|  - support_tickets (Customer tickets, priority, category, thread)                 |
+-----------------------------------------------------------------------------------+
```

---

## 4. End-to-End Fulfillment Lifecycle
1. **Order Placed (`pending`):** Customer checks out with server-side pricing verification.
2. **Order Confirmed (`confirmed`):** Payment verified or Cash on Delivery approved.
3. **Processing (`processing`):** Warehouse fulfillment prepares laptop, inspects battery/specs.
4. **Packed (`packed`):** Security tape applied, package dimensions and weight logged.
5. **Shipment Created & Assigned (`ready_for_shipment` -> `assigned`):** Delivery Partner assigned based on UAE zone (e.g., Deira, Downtown, Dubai Marina, Sharjah).
6. **Driver Pickup (`picked_up` / `in_transit`):** Delivery partner scans or confirms pickup.
7. **Out for Delivery (`out_for_delivery`):** Customer receives notification + live tracking enabled.
8. **Delivery Attempt & Proof of Delivery (`delivered`):**
   - Driver arrives at customer destination.
   - Driver inputs customer 6-digit Delivery OTP or collects signature/photo.
   - Server verifies OTP and marks shipment & order as `delivered`.
9. **Exception Path (`undelivered`):**
   - If customer unreachable or wrong address, driver logs structured reason (`CUSTOMER_UNAVAILABLE`, `WRONG_ADDRESS`, etc.).
   - Operations reviews and customer reschedules delivery window.
   - Max 3 attempts before `RETURN_TO_ORIGIN` (RTO).

---

## 5. Technology Selection Rationale
- **Database:** MongoDB Atlas (existing native database). Extensible Mongoose schemas with 2dsphere geospatial indexing for driver coordinates.
- **Real-Time Communication:** Server-Sent Events (SSE). Seamlessly works over standard HTTP/2 in Next.js App Router without requiring external WebSocket infrastructure or port modifications on Render/Node servers.
- **State Validation:** Pure, deterministic TypeScript/JavaScript transition matrix with zero external dependencies.
- **Offline Storage:** Client-side IndexedDB / LocalStorage queue with automatic retry on network reconnection.
