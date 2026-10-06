# Al Mukammal — Production Readiness Checklist

**Goal:** Zero-Downtime, Commercial Delivery to Client  
**Sign-off Standard:** Senior Full-Stack Architect, Security Engineer, DevOps & QA Leads  

---

## 1. Security & Access Control
- [ ] **No Hardcoded Secrets:** Verify all secrets (`JWT_SECRET`, `ADMIN_SECRET_KEY`, `MONGODB_URI`) are loaded exclusively from environment variables.
- [ ] **Strong Secret Entropy:** Confirm `JWT_SECRET` is at least 32 characters in production.
- [ ] **Edge Route Guards:** `middleware.js` active in repository root and protecting `/admin/*`, `/profile/*`, `/orders/*`, `/checkout/*`.
- [ ] **Cryptographic Verification:** No substring token checks (`token.includes('admin')` completely eradicated).
- [ ] **Server-Side Financial Authority:** `POST /api/orders` strictly verifies and recalculates item prices and subtotals against live MongoDB documents.
- [ ] **File Upload Hardening:** Strict MIME type whitelist (`image/jpeg`, `image/png`, `image/webp`), sanitized filenames, size caps (< 5MB).
- [ ] **Console Sanitization:** No passwords, hashes, tokens, or personal identifiers logged to server console.
- [ ] **CORS & Headers:** Security headers configured (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).

---

## 2. Database & Data Integrity
- [ ] **Indexes Applied:** Compound index on `{ category: 1, brand: 1, price: 1 }` and text index on `{ name: "text", description: "text" }`.
- [ ] **Connection Pooling:** Singleton connection caching verified in `lib/mongodb.js` to prevent connection exhaustion.
- [ ] **Safe Schema Migrations:** No automated drop collection or destructive scripts in deployment pipelines.
- [ ] **Concurrency Safeguards:** Atomic increments on coupon redemption and order counter.

---

## 3. Business Functionality & User Experience
- [ ] **Commercial Branding:** "Al Mukammal Computer Trading LLC" consistently branded across all client surfaces.
- [ ] **Currency Standard:** AED currency formatting strictly verified across all product cards, detail views, cart, and checkout summaries.
- [ ] **WhatsApp Order Flow:** Formatted WhatsApp URL properly opens with customer details, order number, line items, and AED total.
- [ ] **Responsive Design:** Verified on Mobile (375px, 390px), Tablet (768px, 1024px), Laptop (1280px), and Desktop (1440px+).
- [ ] **UI Feedback:** Professional toasts/modals replace all raw browser `alert()` and `confirm()` calls.
- [ ] **Skeleton & Empty States:** Graceful loading skeletons and helpful empty states for carts, order history, and search results.

---

## 4. Administration & Operations
- [ ] **Unified Dashboard:** All administrative operations accessible from `/admin` without dead routes.
- [ ] **Order Status Management:** Admin can change order statuses (`pending` -> `processing` -> `shipped` -> `delivered` -> `cancelled`) with instant UI reflection.
- [ ] **Store Status Toggle:** Toggling `isOpen: false` in Admin Settings immediately disables checkout and displays informational banner.
- [ ] **Coupon & Discount Engine:** Creation, validation, and auto-expiration verified.

---

## 5. Build & Deployment Readiness
- [ ] **Next.js Production Build:** `npm run build` completes successfully with 0 errors.
- [ ] **Dead Code Cleared:** `components/carts.js` and commented legacy files pruned.
- [ ] **Environment Documentation:** Complete `.env.example` created with all necessary keys and explanatory comments.
- [ ] **Deployment Guide:** Complete `DEPLOYMENT.md` detailing Vercel, Node/Docker, and PM2 deployment methods.
