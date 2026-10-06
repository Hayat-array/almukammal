# 🛡️ AL MUKAMMAL — Logistics & Delivery Security Architecture

## 1. Zero-Trust Security Strategy
Commercial logistics involves physical assets (high-ticket laptops, workstations) and personal customer data. This document outlines the security controls protecting all delivery and logistics surfaces.

---

## 2. Protection Against Top Vulnerabilities

### 1. Insecure Direct Object References (IDOR)
- **Vulnerability:** Attacker guesses sequential order/shipment IDs to harvest delivery addresses or hijack delivery statuses.
- **Defense:**
  - Public tracking uses cryptographic nanoid tracking numbers: `TRK-XXXXXX-AE` with high entropy.
  - APIs strictly enforce session ownership:
    ```javascript
    const isOwner = shipment.customer?.toString() === user._id.toString();
    const isAssignedDriver = shipment.deliveryPartner?.user?.toString() === user._id.toString();
    const isAdmin = ['admin', 'manager', 'operations'].includes(user.role);
    if (!isOwner && !isAssignedDriver && !isAdmin) {
      return NextResponse.json({ error: 'Access forbidden' }, { status: 403 });
    }
    ```

### 2. Location & PII Privacy
- Delivery partner exact GPS is only retained during active `OUT_FOR_DELIVERY` operations.
- Historical route coordinates are aggregated and stripped of sub-meter precision after 7 days.
- Public tracking responses mask customer phone numbers, street addresses, and full names.

### 3. Proof of Delivery (PoD) Integrity
- Delivery confirmation OTPs are 6-digit cryptographically generated integers valid for 15 minutes.
- Stored as HMAC-SHA256 hashes (`deliveryOtpHash`), preventing database leakage.
- Brute-force protection: Max 5 incorrect attempts before the OTP is invalidated and requires driver supervisor override.

### 4. Idempotency & Replay Attack Defense
- All state-altering partner requests (`POST /complete`, `POST /transition`) accept an `Idempotency-Key` header.
- Cached in Redis or memory store with a 24-hour TTL to ensure duplicate submissions (e.g. from mobile retries) result in a safe no-op.

### 5. Rate Limiting
- Public tracking lookup: 30 requests / min per IP.
- GPS location ingestion: 1 update per 15 seconds per delivery partner.
- Delivery OTP verification: 5 attempts per order.
