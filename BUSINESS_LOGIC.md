# Al Mukammal — Business Logic Documentation

**Entity:** Al Mukammal Computer Trading LLC  
**Market:** United Arab Emirates (UAE) & GCC Region  
**Currency:** AED (United Arab Emirates Dirham, د.إ)  
**Primary Lines of Business:** High-performance laptops (Gaming, Ultrabooks, Workstations), custom electronics, and tech accessories.  

---

## 1. Core Commercial Rules

### 1.1 Currency & Pricing
1. All official prices, compare prices, discounts, and delivery fees are calculated and denominated in **AED (UAE Dirham)**.
2. Prices are stored in database records as clean floating-point numbers without currency symbols.
3. Display format on client surfaces: `AED X,XXX` (e.g. `AED 4,999`).

### 1.2 Catalog Discount Precedence Hierarchy
When multiple discount promotions are active simultaneously, the system resolves priority using the **Specific Overrides General** rule:

```
[ Tier 1: Product-Specific Discount ]  <-- Highest Precedence (Overrides all)
                  │
                  ▼
[ Tier 2: Category Discount ]          <-- Medium Precedence (Applied if no Tier 1)
                  │
                  ▼
[ Tier 3: Site-Wide Discount ]         <-- Lowest Precedence (Applied if no Tier 1 or 2)
```

- **Calculation:**
  - If `valueType === 'percentage'`: `discountAmount = (price * value) / 100`
  - If `valueType === 'flat'`: `discountAmount = value`
  - Final product price cannot drop below `0 AED`.

### 1.3 Coupon Promotion Engine
1. **Promo Code Case-Insensitivity:** Codes are normalized to uppercase (`SAVE10`, `EID2026`).
2. **Date Validity:** A coupon is valid between `startDate` and `expiryDate` (calculated inclusive of the expiry day up to 23:59:59.999).
3. **Minimum Order Requirement:** Subtotal must be equal to or greater than `coupon.minOrderValue`.
4. **Percentage Capping:** If `maxDiscount` is configured, a percentage discount cannot exceed this cap in AED.
5. **Usage Quota:** If `usageLimit` is defined, coupons are rejected once `usedCount >= usageLimit`. On successful order creation, `usedCount` is incremented.

---

## 2. Fulfillment & Delivery Fee Logic

Delivery fee rules are managed dynamically in `GlobalSetting`:

```
               [ Cart Subtotal ]
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
[ Subtotal >= Threshold ]    [ Subtotal < Threshold ]
  (e.g., AED 5,000)            (e.g., < AED 5,000)
       │                               │
       ▼                               ▼
Delivery Fee: AED 0 (FREE)   Delivery Fee: Flat Fee (e.g., AED 20 - 50)
```

- When `delivery.type === 'free'`, delivery is complimentary for all orders.
- When `delivery.type === 'flat'`, `delivery.baseCost` is applied regardless of subtotal.
- When `delivery.type === 'amount-based'`, delivery is free above `freeDeliveryThreshold`, otherwise `delivery.baseCost`.

---

## 3. Store Operational Rules & Restrictions

1. **Store Operational Status:** If `GlobalSetting.store.isOpen === false`, customer checkout is immediately disabled with an informational banner displaying `closeMessage`.
2. **Operating Hours:** When enabled, orders are accepted only within the designated business window (e.g. `09:00` to `22:00` Gulf Standard Time).
3. **Minimum / Maximum Order Limits:**
   - Orders below `minOrderValue` are rejected.
   - Orders exceeding `maxOrderLimit` are rejected or flagged for manual enterprise sales review.

---

## 4. WhatsApp Order Integration Workflow

A signature commercial feature of retail in the UAE is direct WhatsApp messaging with customer support for delivery scheduling, order confirmation, and payment customization:

```
Customer Submits Checkout Form
              │
              ▼
Server Validates & Creates Order in MongoDB (Status: 'pending')
              │
              ▼
Client Generates Formatted WhatsApp Message Link:
https://wa.me/971509550121?text=*NEW%20ORDER*...
              │
              ├── Order Number & Customer Name
              ├── Contact Phone & Delivery Address
              ├── Ordered Line Items with Specs & Quantities
              ├── Subtotal, Shipping Fee, and Applied Discounts
              └── Total Amount in AED
              │
              ▼
Opens WhatsApp in New Tab for Immediate Dispatch to Al Mukammal Sales Desk
```

---

## 5. Customer Identity & Verification Rules

1. **Date of Birth (DOB) as Secondary Security Anchor:**
   - Required during customer registration.
   - Used as security challenge for forgotten passwords and account deletion to prevent unauthorized access.
2. **Role Separation:**
   - `user`: Standard retail customer; can browse, cart, place orders, view order history.
   - `manager`: Administrative assistant; can manage products, inventory, and view analytics.
   - `admin`: Full platform control; can edit settings, modify user roles, delete records, view revenue.
3. **Dual Login Isolation:**
   - Admin accounts are barred from standard customer checkout and redirected to `/admin`.
   - Customer accounts are blocked from accessing administrative routes.

---

## 6. Order Status Lifecycle

```
[ pending ] ──> [ processing ] ──> [ shipped ] ──> [ delivered ]
     │                │
     └──> [ cancelled ] <──┘
```

- **`pending`**: Order placed by customer; awaiting inventory allocation and phone confirmation.
- **`processing`**: Order confirmed, laptop packaged, invoice prepared.
- **`shipped`**: Courier dispatched with `trackingNumber`.
- **`delivered`**: Successfully handed over to customer.
- **`cancelled`**: Cancelled by customer or admin due to out-of-stock or non-response.
