# Al Mukammal — Database & Data Architecture Documentation

**Database Engine:** MongoDB  
**Object Data Modeling (ODM):** Mongoose 8.x  
**Connection Pooling:** Cached Promise Singleton (`lib/mongodb.js`)  
**Currency Standard:** AED (United Arab Emirates Dirham)  

---

## 1. Database Collections Overview

The database comprises 7 core collections supporting customer management, catalog browsing, shopping carts, order fulfillment, promotional discounts, and operational configurations:

```
+----------------+      +-------------------+      +-----------------+
|      User      |<-----+       Order       |----->|  ProductModel   |
| (Customers &   |  1:N | (Sales &          | N:M  | (Laptops, Specs,|
|  Administrators|      |  Fulfillment)     |      |  Variants)      |
+----------------+      +-------------------+      +-----------------+
        ^                        ^
        | 1:1                    |
        v                        |
+----------------+               |
|      Cart      |               |
| (Session Cart  |               |
|  Persistence)  |               |
+----------------+               |
                                 |
+----------------+      +-------------------+      +-----------------+
|     Coupon     |      |     Discount      |      |  GlobalSetting  |
| (Promo codes,  |      | (Catalog-wide     |      | (Delivery rules,|
|  Min orders)   |      |  & category rules)|      |  Store status)  |
+----------------+      +-------------------+      +-----------------+
```

---

## 2. Collection Schemas & Field Specifications

### 2.1 `User` Collection (`models/User.js`)
Stores customer and staff accounts, authentication credentials, profile data, address book, and security tokens.

| Field | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | System | Auto-generated | Unique record identifier |
| `name` | String | Yes | Trimmed | User's full display name |
| `email` | String | Yes | Unique, lowercase, trimmed | User's primary login and notification email |
| `password` | String | Yes | Bcrypt hash (min 60 chars) | Salted bcrypt password hash |
| `dob` | Date | Yes | Valid date | Date of birth (used as secondary security verification) |
| `role` | String | No | Enum: `['user', 'admin', 'manager']`, default: `'user'` | Access control role |
| `phone` | String | No | - | Contact phone number |
| `address` | Object | No | Embedded `{ street, city, state, zipCode, country }` | Primary shipping address |
| `savedAddresses` | Array | No | Subdocument array | Customer's address book |
| `wishlist` | Array | No | Refs to `Product` ObjectId | Array of favorited product IDs |
| `emailVerified` | Boolean| No | Default: `false` | Email verification flag |
| `resetToken` | String | No | - | One-time password reset token |
| `resetTokenExpiry` | Date | No | - | Expiration timestamp for resetToken |
| `createdAt` | Date | System | Default: `Date.now` | Account creation timestamp |
| `updatedAt` | Date | System | Default: `Date.now` | Last profile update timestamp |

**Indexes:**
- `{ email: 1 }` (Unique index)
- `{ role: 1 }` (Index for admin/customer segment queries)

---

### 2.2 `ProductModel` Collection (`models/ProductModel.js`)
Represents the core catalog items (laptops, desktops, accessories) including technical specs, multi-angle images, and color variants.

| Field | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | System | Auto-generated | MongoDB primary key |
| `id` | Number | No | Sparse, Unique | Legacy numeric identifier for backward compatibility |
| `name` | String | Yes | Trimmed | Product title (e.g., "Apple MacBook Pro 16\" M3 Max") |
| `description` | String | Yes | - | Short marketing overview |
| `detailedDescription` | String | No | Default: `''` | Full markdown/HTML product specifications description |
| `price` | Number | Yes | Min: `0` | Base selling price in AED |
| `comparePrice` | Number | No | Default: `0` | Strikethrough/original MSRP in AED |
| `image` | String | No | Default: `'placeholder.jpg'` | Main thumbnail image filename or URL |
| `images` | Array | No | Array of Strings | Gallery images (main, side, back, ports) |
| `category` | String | No | Default: `'Laptops'` | Product category |
| `brand` | String | No | Trimmed | Brand identifier (Apple, Dell, HP, Lenovo, ASUS, MSI) |
| `specs` | Object | No | Embedded `{ cpu, ram, storage, display, gpu, battery, weight, os }` | Technical laptop specifications |
| `features` | Array | No | Array of Strings | Bulleted highlights (e.g. "Thunderbolt 4", "120Hz ProMotion") |
| `colors` | Array | No | Array of Strings | Available color variants (e.g. "Space Grey", "Silver") |
| `imageColorMap` | Array | No | Array of `{ url, color }` | Maps each image to a specific color variant |
| `warranty` | String | No | Default: `'1 Year Manufacturer Warranty'` | Warranty coverage statement |
| `stock` | Number | No | Default: `0`, Min: `0` | Current inventory count |
| `sku` | String | No | Trimmed | Stock keeping unit code |
| `tags` | Array | No | Array of Strings | Search keywords and tags |
| `isActive` | Boolean| No | Default: `true` | Visibility toggle in public storefront |
| `ratings` | Object | No | `{ average: Number, count: Number }` | Customer review aggregate |
| `createdAt` | Date | System | Default: `Date.now` | Ingestion timestamp |
| `updatedAt` | Date | System | Default: `Date.now` | Last modification timestamp |

**Indexes:**
- `{ category: 1, brand: 1, price: 1 }` (Compound filter index)
- `{ name: "text", description: "text", brand: "text" }` (Full-text search index)
- `{ createdAt: -1 }` (Newest arrivals sorting)

---

### 2.3 `Order` Collection (`models/Order.js`)
Encapsulates finalized sales orders, line items, customer contact, fulfillment status, and delivery logistics.

| Field | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | System | Auto-generated | MongoDB primary key |
| `orderNumber` | String | Yes | Unique | Human-readable order identifier (e.g. `ORD-1718000-XYZ`) |
| `customer` | ObjectId | No | Ref: `User` | Account reference for registered customers |
| `customerInfo` | Object | Yes | Embedded `{ fullName, email, phone, address, city, state, country, town, notes }` | Snapshot of customer details at time of purchase |
| `items` | Array | Yes | Array of `{ id, name, product, quantity, price, image }` | Immutable line item snapshots |
| `subtotal` | Number | Yes | Min: `0` | Verified item sum in AED |
| `shipping` | Number | No | Default: `0` | Calculated delivery fee in AED |
| `discountAmount` | Number | No | Default: `0` | Promotional discount deducted in AED |
| `couponCode` | String | No | - | Applied coupon code (if any) |
| `totalAmount` | Number | Yes | Min: `0` | Grand total payable in AED |
| `status` | String | No | Enum: `['pending', 'processing', 'shipped', 'delivered', 'cancelled']`, default: `'pending'` | Fulfillment stage |
| `trackingNumber` | String | No | - | Shipping carrier courier tracking number |
| `estimatedDelivery` | Date | No | - | Expected fulfillment date |
| `orderDate` | Date | No | Default: `Date.now` | Order placement timestamp |

**Indexes:**
- `{ orderNumber: 1 }` (Unique index)
- `{ "customerInfo.email": 1, createdAt: -1 }` (Customer history lookup)
- `{ customer: 1, createdAt: -1 }` (User ID history lookup)
- `{ status: 1, createdAt: -1 }` (Admin order pipeline index)

---

### 2.4 `Cart` Collection (`models/Cart.js`)
Maintains server-side cart persistence for authenticated users across multiple devices and browsers.

| Field | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | System | Auto-generated | MongoDB primary key |
| `userId` | ObjectId | Yes | Unique, Ref: `User` | Owner user ID |
| `items` | Array | Yes | Array of `{ id, name, description, price, quantity, image }` | Selected cart items |
| `totalItems` | Number | No | Pre-save computed | Total item quantity |
| `totalPrice` | Number | No | Pre-save computed | Aggregate cart sum |
| `updatedAt` | Date | System | Auto-managed | Last interaction timestamp |

---

### 2.5 `Coupon` Collection (`models/Coupon.js`)
Manages promotional coupons for marketing campaigns.

| Field | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `code` | String | Yes | Unique, uppercase, trimmed | Promo code (e.g. `SAVE10`, `EID2026`) |
| `type` | String | Yes | Enum: `['flat', 'percentage']` | Discount calculation model |
| `value` | Number | Yes | Min: `0` | Amount in AED or discount percentage |
| `minOrderValue` | Number | No | Default: `0` | Minimum subtotal required in AED |
| `maxDiscount` | Number | No | Default: `null` | Cap on percentage discount in AED |
| `startDate` | Date | No | Default: `Date.now` | Validity start timestamp |
| `expiryDate` | Date | Yes | - | Expiration timestamp |
| `usageLimit` | Number | No | Default: `null` (Unlimited) | Global redemption ceiling |
| `usedCount` | Number | No | Default: `0` | Total redemption count |
| `isActive` | Boolean| No | Default: `true` | Enable/disable toggle |
| `applicableTo` | Array | No | Default: `['all']` | Targeted user IDs or `'all'` |

---

### 2.6 `Discount` Collection (`models/Discount.js`)
Provides automatic catalog promotional rules without requiring promo codes.

| Field | Type | Required | Constraints / Default | Description |
|---|---|---|---|---|
| `name` | String | Yes | Trimmed | Promo campaign title (e.g. "Ramadan Laptop Sale") |
| `type` | String | Yes | Enum: `['product', 'category', 'site-wide']` | Target scope |
| `target` | String | No | Product ID or category name | Specific entity target |
| `value` | Number | Yes | Positive number | Discount quantity |
| `valueType` | String | No | Enum: `['flat', 'percentage']`, default: `'percentage'` | Value format |
| `startDate` | Date | No | Default: `Date.now` | Start datetime |
| `endDate` | Date | Yes | - | End datetime |
| `isActive` | Boolean| No | Default: `true` | Active status toggle |

---

### 2.7 `GlobalSetting` Collection (`models/GlobalSetting.js`)
Configures platform-wide operational rules, delivery fee logic, and operating hours.

| Field | Type | Description |
|---|---|---|
| `delivery.type` | String (`'flat'`, `'amount-based'`, `'free'`) | Delivery cost model |
| `delivery.baseCost` | Number (Default: `20`) | Default shipping fee in AED |
| `delivery.freeDeliveryThreshold` | Number (Default: `5000`) | Free shipping qualification threshold |
| `store.isOpen` | Boolean (Default: `true`) | Global store ordering toggle |
| `store.closeMessage` | String | Message shown when orders are suspended |
| `store.operatingHours` | `{ enabled, start, end }` | Time window for placing orders |
| `store.minOrderValue` | Number (Default: `0`) | Minimum checkout requirement |
| `store.maxOrderLimit` | Number (Default: `0`) | Maximum single checkout limit |
| `blockedUsers` | Array of Strings | Blacklisted customer identifiers |

---

## 3. Data Integrity & Migration Safeguards

1. **Non-Destructive Schema Evolution:** Any schema updates must add optional fields or provide default fallbacks to preserve existing database records.
2. **Atomic Incrementing:** Coupon `usedCount` and order creation use atomic operations to eliminate race conditions under concurrent load.
3. **No Drop Database Scripts in Production:** All migration scripts must verify target collections and perform dry-runs before updating live documents.
