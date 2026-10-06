# ⚡ Al Mukammal Computer Trading LLC — Production E-Commerce Platform

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_Mongoose-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Market](https://img.shields.io/badge/Market-United_Arab_Emirates_(AED)-red?style=for-the-badge)](https://almukammal.ae)

A state-of-the-art, enterprise-grade e-commerce application designed for **Al Mukammal Computer Trading LLC** (Dubai, United Arab Emirates). Engineered specifically for high-ticket premium laptop and workstation retail with server-side pricing validation, zero-trust order processing, Juspay-inspired design aesthetics, and automated UAE WhatsApp order dispatches.

---

## 🏛️ System Documentation Index

Comprehensive technical documentation is maintained in the repository:

1. [PROJECT_AUDIT.md](file:///e:/Al_MUKAMMAL_PART_2/PROJECT_AUDIT.md) — Comprehensive technical audit, vulnerability discovery, and remediation log.
2. [ARCHITECTURE.md](file:///e:/Al_MUKAMMAL_PART_2/ARCHITECTURE.md) — Full-stack system architecture, data flows, and edge security routing.
3. [DATABASE_DOCUMENTATION.md](file:///e:/Al_MUKAMMAL_PART_2/DATABASE_DOCUMENTATION.md) — Mongoose schemas, compound indexes, constraints, and ER diagram.
4. [API_DOCUMENTATION.md](file:///e:/Al_MUKAMMAL_PART_2/API_DOCUMENTATION.md) — Exhaustive REST API specification with request/response schemas.
5. [BUSINESS_LOGIC.md](file:///e:/Al_MUKAMMAL_PART_2/BUSINESS_LOGIC.md) — UAE commercial logic, discount precedence, shipping tiers, WhatsApp dispatch.
6. [SECURITY_AUDIT.md](file:///e:/Al_MUKAMMAL_PART_2/SECURITY_AUDIT.md) — OWASP Top 10 remediation, cryptographic token handling, input sanitization.
7. [PERFORMANCE_AUDIT.md](file:///e:/Al_MUKAMMAL_PART_2/PERFORMANCE_AUDIT.md) — Core Web Vitals targets, caching headers, payload optimization.
8. [PRODUCTION_CHECKLIST.md](file:///e:/Al_MUKAMMAL_PART_2/PRODUCTION_CHECKLIST.md) — Pre-launch verification checklist for commercial handover.
9. [DEPLOYMENT.md](file:///e:/Al_MUKAMMAL_PART_2/DEPLOYMENT.md) — Production hosting guides for Vercel, Docker, and Ubuntu VPS + PM2/Nginx.
10. [TODO.md](file:///e:/Al_MUKAMMAL_PART_2/TODO.md) — Master sprint backlog and completed feature tracker.

---

## 🚀 Key Architectural Highlights

### 1. Modern Juspay-Inspired Design Aesthetics
- **Dark Surface Palette:** Rich `#0b0f19` canvas, elevated `#111827` cards, subtle glassmorphic borders (`rgba(255, 255, 255, 0.08)`).
- **Accents:** Electric Indigo (`#6366f1`) and Royal Blue (`#2563eb`) with dynamic interactive glows.
- **Pill Radius System:** Fluid rounded buttons (`var(--radius-pill)`), floating navbar pill, spec badges, and filter chips.
- **Fluid Typography:** CSS `clamp()` scaling for sharp, crisp reading across smartphones (375px), tablets, and 4K displays.
- **Micro-Interactions:** Smooth CSS hover translates, focus glows, and custom SVG toast notifications replacing native alerts.

### 2. Hardened Production Security
- **Server-Side Price Validation:** The checkout API (`POST /api/orders`) never trusts client prices. It re-queries MongoDB for authoritative item costs, verifies active discounts, validates promotional coupon eligibility, checks store threshold rules, and computes shipping server-side.
- **Edge Route Guards:** `middleware.js` strictly validates JWT signatures and role claims (`admin`, `manager`) before allowing access to `/admin/*`, preventing unauthorized access.
- **Cryptographic Token Handling:** JWT secrets are cryptographically enforced in production (`getJwtSecret()` throws fatal errors if absent).
- **Secondary Identity Challenge:** User accounts require Date of Birth (`dob`), utilized as a second factor for sensitive account deletions and password resets.

### 3. Tailored UAE Commercial Workflows
- **Currency:** Formatted universally in AED (United Arab Emirates Dirham).
- **7 Emirates Delivery:** Dedicated address selector covering Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain.
- **WhatsApp Order Dispatch:** Every confirmed order instantly generates a WhatsApp consultation and tracking link to the official showroom line: `+971 50 955 0121`.
- **Dynamic Delivery Thresholds:** Configurable free delivery thresholds (e.g. Free shipping above AED 1,000) managed through `/admin/settings`.

---

## 💻 Tech Stack

- **Framework:** Next.js 15.5.4 (App Router)
- **UI Engine:** React 19.1.0 with React DOM 19
- **Styling:** Modular Vanilla CSS & Design Tokens (`app/design-tokens.css`)
- **Database:** MongoDB 6.0+ via Mongoose 8.19
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) & `bcryptjs` password hashing
- **Deployment Runtimes:** Node.js 20+, Vercel Serverless Edge, or Docker

---

## 🛠️ Getting Started (Local Development)

### Prerequisites
- Node.js 18.18+ or 20 LTS installed
- MongoDB running locally or a MongoDB Atlas URI

### 1. Clone & Install Dependencies
```bash
git clone <repo-url> al-mukammal
cd al-mukammal
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in `MONGODB_URI` and `JWT_SECRET`.

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📁 Repository Structure

```
├── app/
│   ├── admin/               # Admin portal (Dashboard, Orders, Products, Coupons, Settings)
│   ├── api/                 # Secure REST API endpoints (Orders, Auth, Products, User)
│   ├── auth/                # Login, Register, Forgot Password
│   ├── cart/                # Shopping cart with coupon engine
│   ├── checkout/            # UAE 7 Emirates checkout & WhatsApp dispatch
│   ├── orders/              # Customer order tracking & history
│   ├── products/            # Product catalog & product detail
│   ├── profile/             # Customer profile & UAE address manager
│   ├── ClientLayout.js      # Global layout wrapper with Navbar & Footer
│   ├── design-tokens.css    # Juspay-inspired CSS tokens
│   ├── layout.js            # Root App Router layout
│   └── page.js              # High-conversion Homepage
├── components/
│   ├── Footer.js            # UAE showroom corporate footer
│   ├── Navbar.js            # Floating pill navigation with category mega-menu
│   ├── ProductCard.js       # Premium laptop product card with specs
│   └── Toast.js             # Global toast notification provider
├── contexts/
│   ├── AuthContext.js       # Client authentication & session sync
│   └── CartContext.js       # Persistent cart state & discount calculation
├── lib/
│   ├── auth.js              # Server auth utilities & JWT verification
│   └── mongodb.js           # Cached Mongoose connection handler
├── models/
│   ├── Coupon.js            # Promotional coupon schema
│   ├── Discount.js          # Campaign discount schema
│   ├── Order.js             # Customer order schema
│   ├── ProductModel.js      # Laptop inventory schema
│   ├── Setting.js           # Store settings & shipping thresholds
│   └── User.js              # User account & DOB schema
└── middleware.js            # Edge routing guards
```

---

## 📞 Client Handover & Support

**Commercial Entity:** Al Mukammal Computer Trading LLC  
**Headquarters:** Dubai, United Arab Emirates  
**Official WhatsApp:** [+971 50 955 0121](https://wa.me/971509550121)  
**Status:** Commercial Production-Ready
