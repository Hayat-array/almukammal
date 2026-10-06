# Al Mukammal — System Architecture Documentation

**Status:** Current Architecture vs. Target Target Production Architecture  
**Platform:** Next.js 15 App Router, React 19, MongoDB (Mongoose), Node.js  
**Domain:** UAE E-Commerce Platform for Laptops & Electronics  

---

## 1. High-Level Architecture Overview

Al Mukammal is constructed as a monolithic full-stack application utilizing the **Next.js App Router**. Both frontend client/server components and backend RESTful API route handlers reside within the unified repository.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  - Next.js 15 React 19 Client Components                                          |
|  - Modern Design System (Juspay-Inspired Dark Surface, Indigo/Royal Blue Accent)  |
|  - Global State: AuthContext, CartContext, Notification System                    |
+----------------------------------------+------------------------------------------+
                                         | HTTPS (JSON / REST API)
                                         v
+-----------------------------------------------------------------------------------+
|                              EDGE / MIDDLEWARE TIER                               |
|  - middleware.js (JWT Validation, Role-Based Route Guards, Session Redirection)   |
+----------------------------------------+------------------------------------------+
                                         | Internal Route Dispatch
                                         v
+-----------------------------------------------------------------------------------+
|                                BACKEND API TIER                                   |
|  - App Router Route Handlers (`app/api/*`)                                        |
|  - Authentication & Authorization: JWT Verification & Role Assertion              |
|  - Business Services & Validation: Order Pricing, Coupon Engine, Store Status     |
|  - Input Sanitization & Error Formatting                                          |
+----------------------------------------+------------------------------------------+
                                         | Mongoose ODM
                                         v
+-----------------------------------------------------------------------------------+
|                                 DATABASE TIER                                     |
|  - MongoDB Atlas / Enterprise Database                                            |
|  - Collections: Users, Products, Orders, Carts, Coupons, Discounts, Settings      |
|  - Singleton Connection Pool (`lib/mongodb.js`) with Cached Promise               |
+-----------------------------------------------------------------------------------+
```

---

## 2. Layered Architecture & Separation of Concerns

To guarantee maintainability, testability, and scalability, the application enforces a strict unidirectional layered flow:

```
[ UI Layer ] ──> [ Component Layer ] ──> [ State & Context Layer ] ──> [ Client API Layer ]
                                                                             │
                                                                             ▼ (HTTP/JSON)
[ Database Layer ] <── [ Data Models ] <── [ Business/Service Layer ] <── [ Route Handlers ]
```

### 2.1 UI & Component Layer (`components/`, `app/*/`)
- **Philosophy:** UI components are purely presentational and reactive. They consume data via props and trigger actions via defined state callbacks.
- **Design Tokens:** Centralized color variables, typography scales (`clamp()`), spacing standards, and responsive breakpoints.
- **Component Primitives:** Reusable components (`Navbar`, `Footer`, `ProductCard`, `Button`, `Modal`, `Badge`, `EmptyState`, `Skeleton`) prevent CSS fragmentation.

### 2.2 State Management Layer (`contexts/`)
- **`AuthContext`:** Tracks authenticated user identity, role (`user`, `admin`, `manager`), token lifecycle, and session cookies.
- **`CartContext`:** Provides optimistic UI updates for cart items with local storage persistence and server-side synchronization for logged-in accounts.
- **Window Events:** Cross-tab synchronization via `storage` and `cartUpdated` events.

### 2.3 API & Service Layer (`app/api/`, `lib/`)
- **Authentication Handlers:** Secure JWT issuance and verification; password hashing via `bcryptjs`.
- **Validation:** Independent server-side validation using structured rules before any write operation.
- **Response Standardization:** Predictable API responses for success and error states.

### 2.4 Data Tier (`models/`, `lib/mongodb.js`)
- **Connection Management:** Reusable singleton connection caching to prevent connection exhaustion across serverless functions.
- **Mongoose Schemas:** Schema enforcement, pre-save middleware for timestamps and subtotal computations, and sparse unique indexes.

---

## 3. Request Lifecycle & Routing Architecture

### 3.1 Public Customer Routes
- `/` — Landing page with hero banner, high-conversion categories, stats, and featured laptops.
- `/products` — Product catalog with multi-facet filters (brand, price range, CPU, specs) and sorting.
- `/products/[id]` — Product detail page with interactive color-variant galleries, technical specifications, and add-to-cart controls.
- `/auth/login`, `/auth/register`, `/auth/forgot-password` — Customer onboarding and authentication.

### 3.2 Protected Customer Routes (Requires `role === 'user' || 'admin'`)
- `/cart` — Shopping cart overview, quantity adjustments, and promotional coupon calculation.
- `/checkout` — Delivery details collection, store operating hours validation, server price calculation, and WhatsApp dispatch.
- `/orders` — Historical customer order tracking with real-time status display.
- `/profile` — User profile settings, multi-country address book, and security settings.

### 3.3 Protected Administrative Routes (Requires `role === 'admin'`)
- `/admin` — Consolidated admin control center with top-line business metrics.
- `/admin/products` — Product catalog management (create, update, delete, specs, color variant mapping, bulk import).
- `/admin/orders` — Order pipeline inspection, fulfillment updates (pending -> processing -> shipped -> delivered -> cancelled).
- `/admin/customers` — Customer registry, role modifications, and engagement records.
- `/admin/coupons` & `/admin/discounts` — Promotional engines for percentage/flat discounts and promo codes.
- `/admin/settings` — Store operating hours, emergency close banners, minimum order thresholds, and delivery fee configurations.

---

## 4. Authentication & Security Flow

```
Customer/Admin Login Request
          │
          ▼
POST /api/auth/login
  ├── Input validation (email & password presence)
  ├── DB Lookup: User.findOne({ email })
  ├── Bcrypt password comparison
  ├── Role assertion: Check if admin route vs customer route matches user.role
  └── Success:
        ├── Generate cryptographically signed JWT with { userId, email, role } (7d expiry)
        ├── Return sanitized user object (omitting password and internal tokens)
        └── Client stores JWT in localStorage and synchronization cookie
          │
          ▼
Subsequent API Requests
  ├── Request Header: Authorization: Bearer <token>
  ├── Handled by verifyToken(token) or verifyAdmin(request) in lib/auth.js
  ├── Decoded token verified against process.env.JWT_SECRET
  └── Route Handler executes authorized business logic
```

---

## 5. Order & Financial Data Flow

```
1. Customer clicks "Checkout" in Cart
   │
2. Client submits cart payload + delivery address + coupon code to POST /api/orders
   │
3. SERVER-SIDE FINANCIAL AUDIT:
   ├── Verify Store Status: GlobalSetting.store.isOpen === true
   ├── Check minimum/maximum order limits
   ├── Retrieve live product documents from DB for each item in cart
   ├── Recalculate Subtotal using DB prices (rejecting any client-tampered price)
   ├── Validate Coupon: Check active status, date range, usage limit, and min order
   ├── Calculate Delivery Fee based on GlobalSetting rules (flat / threshold-free)
   └── Compute final total: (Verified Subtotal + Verified Shipping - Verified Coupon)
   │
4. Atomic Order Record Creation:
   ├── Save Order in MongoDB with status: 'pending' and generated orderNumber
   ├── If Coupon used, increment coupon.usedCount atomically
   └── If user authenticated, associate customer: user._id
   │
5. Confirmation & Client Dispatch:
   ├── Respond with { success: true, order: { orderNumber, totalAmount, ... } }
   ├── Clear customer active cart
   └── Generate formatted WhatsApp order dispatch message (+971 50 955 0121)
```

---

## 6. Target Production Quality Attributes

| Quality Attribute | Target Standard | Strategy |
|---|---|---|
| **Performance** | Sub-1s page loads, 90+ Lighthouse score | Server-side rendering, image optimization (`next/image`), lean asset bundle |
| **Security** | Zero critical vulnerabilities | Strict JWT signature checks, input validation, CORS protection, sanitize sensitive logs |
| **Reliability** | 99.9% uptime | Resilient DB connection retry, graceful fallback defaults, robust error boundaries |
| **Maintainability** | Clean modular codebase | Separation of concerns, typed interfaces, single-responsibility components |
| **Branding & UX** | High-end modern SaaS / Fintech feel | Juspay-inspired dark surface navigation, royal blue/electric indigo accents, fluid typography |
