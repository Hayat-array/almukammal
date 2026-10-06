# Changelog — Al Mukammal

All notable changes to the **Al Mukammal** platform are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] — Vercel Production Hardening & Security Patch (October 2026)

### Fixed & Hardened
- **Vercel Build Command Failure (Exit 127):** Eliminated Windows-specific `cmd /c` wrapper in `package.json`, standardizing all scripts to native cross-platform binaries (`next build`, `next dev`).
- **Security Vulnerability Upgrade:** Upgraded `next` and `eslint-config-next` from vulnerable `15.1.4` (CVE-2025-66478) to patched release `15.1.12`.
- **Node Engine Compatibility:** Declared `"engines": { "node": ">=18.18.0" }` in `package.json` for verified runtime stability across Node.js 18, 20, 22, and 24.
- **Dependency Hygiene:** Safely removed unused deprecated legacy packages (`multer`, `gridfs-stream`, `seed`, `breeze`) and removed dead prototype `routes/products.js`.
- **ESLint JSX Standards:** Resolved unescaped entity warnings in JSX across `coupons`, `bulk-import`, `forgot-password`, `login`, `verify-otp`, and `Footer.js`.
- **TypeScript Modernization:** Modernized `tsconfig.json` compiler options to `target: "ES2022"` with zero deprecation warnings.
- **Verification:** Verified complete test suite passing (36 auth & OTP integration tests + 56 logistics fulfillment tests = 92 passed, 0 failed).

## [1.0.0] — Production Release (October 2026)

### Added
- **System Documentation Suite (10 Core Architectural Documents):**
  - [PROJECT_AUDIT.md](file:///e:/Al_MUKAMMAL_PART_2/PROJECT_AUDIT.md): Systematic vulnerability, architecture, and module audit.
  - [ARCHITECTURE.md](file:///e:/Al_MUKAMMAL_PART_2/ARCHITECTURE.md): Layered system architecture, request flows, and routing maps.
  - [DATABASE_DOCUMENTATION.md](file:///e:/Al_MUKAMMAL_PART_2/DATABASE_DOCUMENTATION.md): Schema, relationship, indexing, and migration manual.
  - [API_DOCUMENTATION.md](file:///e:/Al_MUKAMMAL_PART_2/API_DOCUMENTATION.md): Complete REST API endpoint reference.
  - [BUSINESS_LOGIC.md](file:///e:/Al_MUKAMMAL_PART_2/BUSINESS_LOGIC.md): Commercial rules, pricing, discounts, and regional business flows.
  - [SECURITY_AUDIT.md](file:///e:/Al_MUKAMMAL_PART_2/SECURITY_AUDIT.md): Threat assessment and vulnerability remediation details.
  - [PERFORMANCE_AUDIT.md](file:///e:/Al_MUKAMMAL_PART_2/PERFORMANCE_AUDIT.md): Core Web Vitals targets, query optimization, and caching.
  - [PRODUCTION_CHECKLIST.md](file:///e:/Al_MUKAMMAL_PART_2/PRODUCTION_CHECKLIST.md): Pre-launch operational verification checklist.
  - [DEPLOYMENT.md](file:///e:/Al_MUKAMMAL_PART_2/DEPLOYMENT.md): Comprehensive production hosting guide for Vercel, Docker, and Ubuntu VPS + PM2/Nginx.
  - [TODO.md](file:///e:/Al_MUKAMMAL_PART_2/TODO.md): 100% completed engineering backlog.
- **Juspay-Inspired Modern Design System:**
  - Token-based design system (`design-tokens.css`) defining royal blue / electric indigo color hierarchies, sleek dark surfaces, fluid clamp typography, and micro-interactions.
  - Floating dark rounded pill container with backdrop blur, interactive mega-menu flyout, dynamic cart counter, and user profile quick-actions.
  - Modern ProductCard with hardware specification pills (CPU, RAM, GPU, Storage), AED pricing, discount badges, and smooth hover glow.
  - Global SVG Toast notification system (`Toast.js`) replacing disruptive browser `alert()` popups.
  - Corporate UAE showroom footer with store hours, WhatsApp direct links, and UAE trust badges.
- **Administrative Experience:**
  - Built high-conversion Admin Command Center (`app/admin/page.js`) with live revenue in AED, total orders counter, pending order alerts, and recent orders feed.
  - Built Orders Control Center (`app/admin/orders/page.js`) with status switcher calling `PATCH /api/admin/orders/[orderId]`, search, filtering, and modal order inspection.
  - Built dedicated Laptop Inventory Management (`app/admin/products/page.js`) with add laptop modal, spec badges, delete action, and link to bulk CSV import.
- **Customer Experience:**
  - Rebuilt Customer Profile (`app/profile/page.js`) into clean, tabbed layout: Personal Information, 7 Emirates UAE Address Book, Password Management, and Danger Zone with DOB security challenge.
  - Streamlined Checkout (`app/checkout/page.js`) with server-side validation and WhatsApp auto-message generator.
  - Customer Orders page (`app/orders/page.js`) with timeline badges, item breakdown, and support links.
- **Environment & Deployment:**
  - Comprehensive `.env.example` documenting all configuration keys.
  - Production build certified with `npm run build` exiting with code 0 across 61 routes.

### Changed
- **Security & Authorization Hardening:**
  - Edge routing guard in root `middleware.js` to protect admin, user, and checkout routes.
  - Authoritative server-side price recalculation in `POST /api/orders` to eliminate financial tampering.
  - Cryptographic JWT verification across all administrative endpoints.
  - Fixed async/await bug on token verification in `app/api/admin/orders/[orderId]/route.js`.
  - Added `GET` endpoint to `app/api/user/profile/route.js` to fetch fresh user data directly from MongoDB.

### Removed
- **Dead Code & Redundancy:**
  - Pruned bloated `components/carts.js` (7,597 lines / 360KB of repetitive commented code) and `components/carts.css`.
  - Removed duplicate `app/api/auth/signup` in favor of standard `register`.
  - Removed dangerous fallback secrets and password/DOB console logs from auth routes.

---

## [0.1.0] — Initial Baseline Prototype (Prior State)
- Basic Next.js App Router setup with MongoDB Mongoose connection.
- Product catalog for laptops with specs, color variants, and image gallery.
- Dual-track NextAuth and custom JWT authentication.
- Client-side cart stored in browser localStorage.
- Basic admin dashboard pages for orders, coupons, discounts, and settings.
- WhatsApp order forwarding.
