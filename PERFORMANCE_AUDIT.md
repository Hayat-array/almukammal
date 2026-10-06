# Al Mukammal — Performance Audit & Optimization Plan

**Platform:** Next.js 15, React 19, MongoDB Atlas  
**Target:** Sub-second Page Transitions, Core Web Vitals Green Zone, High Scalability  

---

## 1. Current Bottlenecks & Audit Findings

### 1.1 Dead Code & Bundle Bloat
- **Issue:** `components/carts.js` contained 7,597 lines (360KB) of code due to 8 identical commented iterations of an old admin carts component.
- **Impact:** Slows IDE indexing, increases repository weight, and poses bundle leakage risks if referenced.
- **Action:** Delete `components/carts.js` and implement a clean, 120-line modern cart management component.

### 1.2 Unpaginated Database Queries
- **Issue:** `app/api/products/route.js` executed `ProductModel.find({}).sort({ createdAt: -1 }).lean()`, pulling the entire product database into memory on every request.
- **Impact:** Works with 30 items, but degrades dramatically at 1,000+ items, causing high server memory consumption and slow TTFB (Time to First Byte).
- **Action:** Implement database-level cursor pagination (`skip()` / `limit()`) with compound indexes on `{ category: 1, brand: 1, price: 1 }`.

### 1.3 Permissive Image Configuration
- **Issue:** `next.config.mjs` contained `remotePatterns: [{ protocol: 'https', hostname: '**' }]`.
- **Impact:** Allowing arbitrary hostnames exposes Next.js image optimization servers to Server-Side Request Forgery (SSRF) and unbounded cache bloat.
- **Action:** Restrict image domains to verified CDN sources, Cloudinary/AWS S3 buckets, and local paths.

### 1.4 Client-Side Re-render Loops in Layout & Profile
- **Issue:** `ClientLayout.js` and `app/profile/page.js` had multiple event listeners on `storage` and `cartUpdated`, performing synchronous `localStorage` JSON parsing on every window event without throttling.
- **Impact:** UI micro-stutters and unnecessary re-renders across all pages.
- **Action:** Consolidate into a memoized `CartContext` with unified event dispatching.

---

## 2. Core Web Vitals Targets

| Metric | Current Estimate | Production Target | Optimization Technique |
|---|---|---|---|
| **LCP (Largest Contentful Paint)** | 2.4s | **< 1.2s** | Optimized hero imagery, priority flag on hero images, pre-warmed DB connection |
| **INP (Interaction to Next Paint)** | 180ms | **< 80ms** | Debounced search inputs, lightweight DOM trees, CSS hardware acceleration |
| **CLS (Cumulative Layout Shift)** | 0.12 | **< 0.02** | Fixed aspect-ratio containers for laptop images and skeleton placeholders |
| **TTFB (Time to First Byte)** | 850ms | **< 200ms** | S-maxage caching headers (`stale-while-revalidate`), connection pooling |

---

## 3. Caching & Scaling Architecture

```
User Request
     │
     ▼
Next.js Edge / CDN Cache ──[ Cache Hit (s-maxage: 60s) ]──> Instant 200 Response
     │
     ▼ [ Cache Miss / Stale ]
MongoDB Query via Singleton Pool (`lib/mongodb.js`)
     │
     ▼
Return optimized JSON payload & update CDN cache in background
```

1. **Static Catalog Caching:** Catalog product list responses use `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.
2. **Dynamic Admin Isolation:** Administrative routes explicitly use `Cache-Control: no-store` to prevent caching confidential business metrics.
3. **Database Connection Pooling:** Reusable mongoose promise prevents opening a new TCP handshake on every serverless invocation.
