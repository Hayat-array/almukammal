'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import ClientLayout from './ClientLayout';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products', {
          cache: 'no-store',
          headers: { 'Pragma': 'no-cache' }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            setProducts(data.products);
          } else {
            setError('No products currently available in inventory.');
          }
        } else {
          setError('Failed to fetch showroom products.');
        }
      } catch {
        setError('Connection error loading catalog.');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const featuredProducts = useMemo(() => {
    if (activeCategoryFilter === 'all') {
      return products.slice(0, 8);
    }
    return products
      .filter(p => (p.category || '').toLowerCase() === activeCategoryFilter.toLowerCase() || (p.brand || '').toLowerCase() === activeCategoryFilter.toLowerCase())
      .slice(0, 8);
  }, [products, activeCategoryFilter]);

  const brands = [
    { name: 'Apple', tag: 'MacBook Pro & Air M3' },
    { name: 'ASUS ROG', tag: 'Zephyrus & Strix Scar' },
    { name: 'Lenovo Legion', tag: 'Legion Pro 7 & 9i' },
    { name: 'Dell Alienware', tag: 'm16 & m18 Gen 2' },
    { name: 'HP Omen', tag: 'Omen Transcend OLED' },
    { name: 'Razer Blade', tag: 'Blade 16 & 18 Dual-Mode' },
    { name: 'MSI Gaming', tag: 'Titan 18 HX & Raider' }
  ];

  const collections = [
    {
      id: 'gaming',
      title: 'Gaming Titans',
      badge: 'RTX 4090 / 4080',
      description: 'Up to 175W max TGP, liquid metal cooling, 240Hz QHD+ displays, and desktop-grade mechanical switches.',
      specs: 'Up to Core i9-14900HX • 64GB DDR5 • 4TB Gen4 SSD',
      link: '/products?category=Gaming',
      accentColor: '#0866FF'
    },
    {
      id: 'apple',
      title: 'Apple Silicon Suite',
      badge: 'M3 Pro & M3 Max',
      description: 'Up to 22-hour battery endurance, Liquid Retina XDR displays with 1,600 nits peak HDR, and massive unified memory.',
      specs: '128GB Unified Memory • 16-Core CPU • 40-Core GPU',
      link: '/products?brand=Apple',
      accentColor: '#080808'
    },
    {
      id: 'ultrabook',
      title: 'Executive Ultrabooks',
      badge: 'Under 1.2kg Chassis',
      description: 'Military-grade CNC aluminum and magnesium chassis, 2.8K OLED touchscreens, and Intel Core Ultra AI NPU chips.',
      specs: 'Intel Core Ultra 7/9 • Wi-Fi 7 • Intel Evo Certified',
      link: '/products?category=Ultrabook',
      accentColor: '#0866FF'
    },
    {
      id: 'workstation',
      title: 'CAD & Studio Workstations',
      badge: 'ISV Certified',
      description: 'Engineered for Blender 3D, Maya, AutoCAD, DaVinci Resolve, and local LLM execution with ECC error-correcting memory.',
      specs: 'NVIDIA RTX 5000 Ada • ISV Certification • 128GB RAM',
      link: '/products?category=Workstation',
      accentColor: '#080808'
    }
  ];

  return (
    <ClientLayout>
      <div className="home-wrapper">

        {/* ===================================================================
            SECTION 1: HERO (DOMINANT WHITE BASE + HIGH-CONTRAST BLACK TYPOGRAPHY)
            Clean, architectural whitespace with purposeful product visual
            =================================================================== */}
        <section className="hero-section">
          {/* Subtle Ambient Blue Radial Glow behind product */}
          <div className="hero-ambient-glow" aria-hidden="true" />

          <div className="hero-content-container">
            {/* Small Blue Eyebrow Tag */}
            <div className="hero-eyebrow-pill">
              <span className="eyebrow-pulse-dot" />
              <span className="eyebrow-text">DUBAI PREMIER HIGH-PERFORMANCE LAPTOP SHOWROOM</span>
            </div>

            {/* Hero Main Heading */}
            <h1 className="hero-main-title">
              Engineered for extreme performance.
              <span className="hero-title-accent"> Delivered across the UAE.</span>
            </h1>

            {/* Subhead Description */}
            <p className="hero-subtitle">
              Authentic factory-sealed flagship laptops from Apple, ASUS ROG, Lenovo Legion, and Alienware. Configured with genuine 1-year UAE local warranty and white-glove same-day delivery.
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div className="hero-actions-group">
              <Link href="/products" className="btn-primary-black">
                <span>Explore UAE Inventory</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              <a
                href="https://wa.me/971509550121?text=Hello%20Al%20Mukammal,%20I%20am%20looking%20for%20a%20laptop%20recommendation"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary-outline"
              >
                <span>💬 WhatsApp Sales Desk</span>
              </a>
            </div>

            {/* Hero Showcase Display Stage (Architectural Floating Container) */}
            <div className="hero-visual-stage">
              <div className="stage-card">
                <div className="stage-topbar">
                  <div className="stage-window-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-amber" />
                    <span className="dot dot-emerald" />
                  </div>
                  <span className="stage-topbar-title">AL MUKAMMAL PERFORMANCE LAB • 2026 BENCHMARKS</span>
                  <span className="stage-topbar-status">AUTHENTIC UAE STOCK</span>
                </div>

                <div className="stage-body">
                  <div className="stage-layout-grid">
                    <div className="stage-text-side">
                      <div className="stage-headline-block">
                        <span className="stage-badge-pill">FLAGSHIP ARCHITECTURE</span>
                        <h3 className="stage-banner-h3">Intel Core i9 14th Gen &amp; Apple M3 Max</h3>
                        <p className="stage-banner-p">
                          Equipped with NVIDIA GeForce RTX 4090 16GB GDDR6, up to 64GB 5600MHz DDR5 RAM, and 4TB PCIe Gen4 NVMe storage.
                        </p>
                      </div>

                      <div className="stage-metrics-row">
                        <div className="stage-metric-box">
                          <span className="metric-val">175W</span>
                          <span className="metric-lbl">Max Graphic TGP</span>
                        </div>
                        <div className="stage-metric-box">
                          <span className="metric-val">240Hz</span>
                          <span className="metric-lbl">QHD+ Mini-LED</span>
                        </div>
                        <div className="stage-metric-box">
                          <span className="metric-val">1 Year</span>
                          <span className="metric-lbl">Official UAE Warranty</span>
                        </div>
                        <div className="stage-metric-box">
                          <span className="metric-val">Same Day</span>
                          <span className="metric-lbl">Express Delivery</span>
                        </div>
                      </div>
                    </div>

                    <div className="stage-visual-side">
                      <div className="stage-hero-showcase">
                        <img
                          src="/brand-hero.jpg"
                          alt="Al Mukammal Performance Rig"
                          className="stage-hero-artwork"
                        />
                        <div className="stage-art-badge">
                          <span className="art-badge-dot" />
                          <span>AL MUKAMMAL RIG • 2026 EDITION</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 2: LIGHT GRAY MARQUEE / AUTHORIZED BRAND PARTNERS
            Restrained, professional horizontal brand showcase
            =================================================================== */}
        <section className="brands-ticker-section">
          <div className="ticker-label-wrap">
            <span className="ticker-eyebrow">DIRECT SHOWROOM IMPORTER &amp; RETAILER</span>
          </div>
          <div className="ticker-track">
            {brands.concat(brands).map((brand, i) => (
              <div key={i} className="ticker-item">
                <span className="ticker-brand-name">{brand.name}</span>
                <span className="ticker-brand-sep">•</span>
                <span className="ticker-brand-tag">{brand.tag}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ===================================================================
            SECTION 3: CURATED EDITORIAL TIERS (WHITE BASE + ASYMMETRICAL CARDS)
            Varied 2x2 grid with high visual hierarchy
            =================================================================== */}
        <section className="collections-section">
          <div className="content-container">
            <div className="section-heading-block">
              <span className="section-eyebrow-blue">PERFORMANCE CLASSIFICATION</span>
              <h2 className="section-title-large">Engineered for Specialized Demands</h2>
              <p className="section-subtitle-text">
                Every machine is hand-inspected by hardware technicians in Dubai before customer dispatch.
              </p>
            </div>

            <div className="collections-grid">
              {collections.map(col => (
                <Link href={col.link} key={col.id} className="collection-card">
                  <div className="col-top-row">
                    <span className="col-badge">{col.badge}</span>
                    <span className="col-arrow-circle">→</span>
                  </div>
                  <h3 className="col-title">{col.title}</h3>
                  <p className="col-desc">{col.description}</p>
                  <div className="col-specs-footer">
                    <span className="specs-indicator-dot" />
                    <span className="specs-text">{col.specs}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 4: STRATEGIC DARK ANCHOR (DEEP CHARCOAL #0B0B0D)
            Communicates Extreme Hardware Engineering, Thermal Dynamics & Specs
            =================================================================== */}
        <section className="dark-engineering-section">
          <div className="dark-ambient-radial" aria-hidden="true" />
          <div className="content-container">
            <div className="dark-section-header">
              <span className="dark-tag-blue">EXTREME THERMAL &amp; SILICON ARCHITECTURE</span>
              <h2 className="dark-title-large">Desktop-Class Power In a Portable Form Factor</h2>
              <p className="dark-desc-text">
                We select laptops featuring vapor chamber liquid metal cooling to sustain full boost clock frequencies without thermal throttling in high-demand environments.
              </p>
            </div>

            <div className="dark-cards-grid">
              <div className="dark-tech-card">
                <div className="dark-card-icon">⚡</div>
                <h4 className="dark-card-title">175W Full GPU Subsystem</h4>
                <p className="dark-card-desc">
                  Full wattage Ada Lovelace graphics chips delivering unconstrained tensor cores for gaming, machine learning models, and real-time raytracing.
                </p>
                <div className="dark-card-stat">
                  <span className="stat-num">16GB</span>
                  <span className="stat-unit">VRAM GDDR6</span>
                </div>
              </div>

              <div className="dark-tech-card">
                <div className="dark-card-icon">❄️</div>
                <h4 className="dark-card-title">Vapor Chamber &amp; Liquid Metal</h4>
                <p className="dark-card-desc">
                  Thermal conductivity up to 73 W/mK ensures peak CPU multi-core sustained turbo without acoustic disturbance in studio environments.
                </p>
                <div className="dark-card-stat">
                  <span className="stat-num">-15°C</span>
                  <span className="stat-unit">Core Temperature</span>
                </div>
              </div>

              <div className="dark-tech-card">
                <div className="dark-card-icon">🖥️</div>
                <h4 className="dark-card-title">Color-Calibrated Displays</h4>
                <p className="dark-card-desc">
                  Factory calibrated Mini-LED and OLED panels covering 100% DCI-P3 color space with Pantone and Dolby Vision certification.
                </p>
                <div className="dark-card-stat">
                  <span className="stat-num">1,600</span>
                  <span className="stat-unit">Nits Peak HDR</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 5: LIVE SHOWROOM CATALOG (WHITE BASE + REUSABLE CARDS)
            Filterable product showcase with real-time database models
            =================================================================== */}
        <section className="catalog-showcase-section">
          <div className="content-container">
            <div className="catalog-header-split">
              <div>
                <span className="section-eyebrow-blue">CURRENT INVENTORY</span>
                <h2 className="section-title-large">Featured Showroom Models</h2>
                <p className="section-subtitle-text">
                  Direct pricing in AED with verified manufacturer specs and official warranty.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="filter-pills-row">
                {[
                  { id: 'all', label: 'All Laptops' },
                  { id: 'gaming', label: 'Gaming (RTX)' },
                  { id: 'apple', label: 'Apple MacBooks' },
                  { id: 'ultrabook', label: 'Ultrabooks' },
                  { id: 'workstation', label: 'Workstations' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveCategoryFilter(filter.id)}
                    className={`filter-pill-btn ${activeCategoryFilter === filter.id ? 'is-active' : ''}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            {loading ? (
              <div className="catalog-loading-state">
                <div className="catalog-spinner" />
                <p>Loading UAE showroom inventory...</p>
              </div>
            ) : error ? (
              <div className="catalog-error-state">
                <span className="error-icon">⚠️</span>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="btn-retry-catalog"
                >
                  Reload Showroom
                </button>
              </div>
            ) : (
              <div className="products-grid-showcase">
                {featuredProducts.map(product => (
                  <ProductCard
                    key={product.id || product._id}
                    product={product}
                    variant="light"
                  />
                ))}
              </div>
            )}

            <div className="catalog-view-all-row">
              <Link href="/products" className="btn-explore-full-catalog">
                <span>View Complete Laptop Catalog ({products.length})</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 6: THE AL MUKAMMAL UAE ADVANTAGE (LIGHT GRAY #F7F8FA)
            4 Pillars: Delivery, Warranty, Custom Spec Upgrades, Authentic Stock
            =================================================================== */}
        <section className="uae-advantage-section">
          <div className="content-container">
            <div className="section-heading-block centered">
              <span className="section-eyebrow-blue">LOCAL UAE EXCELLENCE</span>
              <h2 className="section-title-large">Why Leading UAE Clients Choose Al Mukammal</h2>
              <p className="section-subtitle-text max-center">
                We combine competitive pricing with direct showroom accountability in Dubai.
              </p>
            </div>

            <div className="advantage-pillars-grid">
              <div className="advantage-box">
                <span className="adv-icon">🇦🇪</span>
                <h4 className="adv-title">All 7 Emirates Covered</h4>
                <p className="adv-desc">
                  Same-day express delivery in Dubai &amp; Sharjah. Next-day delivery across Abu Dhabi, Ajman, RAK, Fujairah, and Umm Al Quwain.
                </p>
              </div>

              <div className="advantage-box">
                <span className="adv-icon">🛡️</span>
                <h4 className="adv-title">1-Year Hardware Warranty</h4>
                <p className="adv-desc">
                  Every machine comes backed by official hardware coverage. Local warranty repairs and replacements handled directly in the UAE.
                </p>
              </div>

              <div className="advantage-box">
                <span className="adv-icon">🛠️</span>
                <h4 className="adv-title">Custom Studio Upgrades</h4>
                <p className="adv-desc">
                  Need 64GB RAM or dual 4TB NVMe SSDs? Our in-house engineers upgrade and burn-in test machines before shipping without voiding warranty.
                </p>
              </div>

              <div className="advantage-box">
                <span className="adv-icon">💳</span>
                <h4 className="adv-title">Secure Order Verification</h4>
                <p className="adv-desc">
                  Order online with cryptographic server-side price protection, transparent AED billing, and instant WhatsApp consultation tracking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 7: DUBAI FLAGSHIP SHOWROOM & LIVE DIRECTIONS (WHITE BASE + BLUE ACCENT)
            Interactive showroom presence with real photography, GPS directions & metrics
            =================================================================== */}
        <section className="showroom-location-section" id="showroom-location">
          <div className="content-container">
            <div className="location-split-layout">
              {/* LEFT SIDE: Coverage Badge, Highlighted Heading, Metrics, and Direction Actions */}
              <div className="location-info-col">
                <div className="location-eyebrow-wrap">
                  <span className="location-eyebrow-pill">COVERAGE &amp; DUBAI SHOWROOM</span>
                </div>

                <h2 className="location-main-title">
                  Visit our <span className="title-highlight-blue">flagship showroom</span> in Dubai
                </h2>

                <p className="location-description">
                  Experience flagship computing before you purchase. Visit our premier showroom in Deira for hands-on laptop benchmarking, custom thermal &amp; RAM upgrades, and immediate same-day order collection.
                </p>

                {/* Big Counter Metrics (matching user reference: 300+ / 50+) */}
                <div className="location-metrics-grid">
                  <div className="loc-metric-block">
                    <span className="loc-metric-val">Same-Day</span>
                    <span className="loc-metric-sub">In-Store Collection &amp; Setup</span>
                  </div>
                  <div className="loc-metric-block">
                    <span className="loc-metric-val">7 Days</span>
                    <span className="loc-metric-sub">Open for Walk-in Consultation</span>
                  </div>
                  <div className="loc-metric-block">
                    <span className="loc-metric-val">100%</span>
                    <span className="loc-metric-sub">Official UAE Warranty Stock</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="location-cta-group">
                  <a
                    href="https://maps.google.com/?q=Al+Mukammal+Computer+Trading+LLC+Deira+Dubai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-location-primary"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <span>Get Directions on Google Maps</span>
                  </a>

                  <a
                    href="https://wa.me/971509550121?text=Hello%20Al%20Mukammal,%20please%20send%20me%20your%20exact%20showroom%20location%20pin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-location-secondary"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z" />
                    </svg>
                    <span>Send WhatsApp Live Location Pin</span>
                  </a>
                </div>

                {/* Showroom Logistics Tags */}
                <div className="location-chips-row">
                  <div className="loc-chip-pill">
                    <span className="loc-chip-icon">📍</span>
                    <span>Deira Computer Market, Near Sabkha &amp; Naif, Dubai</span>
                  </div>
                  <div className="loc-chip-pill">
                    <span className="loc-chip-icon">🚇</span>
                    <span>5-Min Walk from Baniyas Square / Union Metro</span>
                  </div>
                  <div className="loc-chip-pill">
                    <span className="loc-chip-icon">🕒</span>
                    <span>Mon - Sat: 9:00 AM - 10:00 PM • Sun: 4:00 PM - 10:00 PM</span>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: Map Dot-Matrix Graphic + Authentic Shop Photo Showcase */}
              <div className="location-visual-col">
                {/* Dot Matrix Ambient Graphic */}
                <div className="dot-matrix-canvas" aria-hidden="true">
                  <svg className="matrix-svg" viewBox="0 0 500 350" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="dotPattern" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
                      <circle cx="3" cy="3" r="2.2" fill="#E2E8F0" />
                    </pattern>
                    <rect width="500" height="350" fill="url(#dotPattern)" opacity="0.85" />
                    <circle cx="370" cy="130" r="48" stroke="#0866FF" strokeWidth="1" strokeDasharray="4 4" opacity="0.35" />
                    <circle cx="370" cy="130" r="82" stroke="#0866FF" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
                    <circle cx="370" cy="130" r="118" stroke="#0866FF" strokeWidth="1" strokeDasharray="4 4" opacity="0.1" />
                  </svg>
                </div>

                {/* Main Showroom Photo Card */}
                <div className="showroom-visual-card">
                  {/* Real Showroom Photography */}
                  <div className="showroom-img-frame">
                    <img
                      src="/showroom-dubai.jpg"
                      alt="Al Mukammal Computer Trading Dubai Flagship Showroom"
                      className="showroom-img"
                    />
                    <div className="showroom-img-gradient" />

                    {/* Live Status Badge */}
                    <div className="showroom-live-pill">
                      <span className="live-dot-pulse" />
                      <span>OPEN TODAY • WALK-INS WELCOME</span>
                    </div>

                    {/* Showroom Title Overlay */}
                    <div className="showroom-overlay-meta">
                      <span className="showroom-overlay-title">AL MUKAMMAL FLAGSHIP</span>
                      <span className="showroom-overlay-sub">DEIRA • DUBAI • UNITED ARAB EMIRATES</span>
                    </div>
                  </div>

                  {/* Interactive Map & Direct Navigation Bar */}
                  <div className="showroom-bottom-bar">
                    <div className="showroom-gps-info">
                      <div className="gps-pin-bubble">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                      </div>
                      <div className="gps-text-wrap">
                        <span className="gps-name">Al Mukammal Computer Trading LLC</span>
                        <span className="gps-coords">Coordinates: 25.2711° N, 55.3075° E • Deira Showroom</span>
                      </div>
                    </div>

                    <a
                      href="https://maps.google.com/?q=Al+Mukammal+Computer+Trading+LLC+Deira+Dubai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-showroom-open-maps"
                    >
                      <span>Open in Maps</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 8: VIP SHOWROOM & WHATSAPP CONSULTATION (SOFT BLUE TINT #EAF3FF)
            High-converting final section before footer
            =================================================================== */}
        <section className="consultation-section">
          <div className="content-container">
            <div className="consultation-card">
              <div className="consultation-content">
                <span className="consultation-badge">DUBAI SALES CONCIERGE</span>
                <h2 className="consultation-title">
                  Need tailored advice or custom laptop specifications?
                </h2>
                <p className="consultation-desc">
                  Speak directly with an Al Mukammal hardware specialist in Dubai. We guide you through GPU TDPs, panel color spaces, and corporate bulk requirements.
                </p>
                <div className="consultation-meta-row">
                  <span>📍 Showroom: Deira / Bur Dubai, UAE</span>
                  <span>•</span>
                  <span>⚡ Average response time: &lt; 5 minutes</span>
                </div>
              </div>

              <div className="consultation-cta-box">
                <a
                  href="https://wa.me/971509550121?text=Hello%20Al%20Mukammal,%20I%20would%20like%20expert%20guidance%20on%20choosing%20a%20laptop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp-large"
                >
                  <span className="wa-icon">💬</span>
                  <span>Chat on WhatsApp</span>
                </a>
                <span className="wa-phone-text">+971 50 955 0121</span>
              </div>
            </div>
          </div>
        </section>

      </div>

      <style jsx>{`
        .home-wrapper {
          background-color: var(--bg-default, #FFFFFF);
          color: var(--text-primary, #080808);
          overflow-x: hidden;
        }

        .content-container {
          max-width: var(--max-width-site, 1280px);
          margin: 0 auto;
          padding: 0 20px;
        }

        /* ===================================================================
           HERO SECTION (WHITE BASE + CRISP CONTRAST)
           =================================================================== */
        .hero-section {
          position: relative;
          padding: 104px 20px 80px;
          background: #FFFFFF;
          display: flex;
          justify-content: center;
          overflow: hidden;
        }

        .hero-ambient-glow {
          position: absolute;
          top: 120px;
          left: 50%;
          transform: translateX(-50%);
          width: 720px;
          height: 380px;
          background: radial-gradient(circle, rgba(8, 102, 255, 0.08) 0%, transparent 70%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .hero-content-container {
          position: relative;
          z-index: 1;
          max-width: var(--max-width-hero, 1140px);
          width: 100%;
          margin: 0 auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Eyebrow Pill */
        .hero-eyebrow-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--blue-soft, #EAF3FF);
          border: 1px solid rgba(8, 102, 255, 0.2);
          border-radius: var(--radius-full, 9999px);
          padding: 6px 14px;
          margin-bottom: 24px;
        }

        .eyebrow-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--blue-primary, #0866FF);
          box-shadow: 0 0 8px var(--blue-primary, #0866FF);
        }

        .eyebrow-text {
          font-size: 0.725rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--blue-primary, #0866FF);
        }

        /* Main Headline */
        .hero-main-title {
          font-size: clamp(2.4rem, 4.8vw + 0.5rem, 4.25rem);
          font-weight: 850;
          line-height: 1.12;
          letter-spacing: -0.035em;
          color: #080808;
          max-width: 960px;
          margin: 0 0 20px 0;
        }

        .hero-title-accent {
          color: var(--blue-primary, #0866FF);
        }

        .hero-subtitle {
          font-size: clamp(1rem, 1.4vw + 0.2rem, 1.2rem);
          line-height: 1.6;
          color: var(--text-secondary, #5F6368);
          max-width: 780px;
          margin: 0 auto 36px;
        }

        /* Action Buttons */
        .hero-actions-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 56px;
        }

        .btn-primary-black {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #080808;
          color: #FFFFFF;
          padding: 14px 28px;
          border-radius: var(--radius-full, 9999px);
          font-size: 0.925rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 8px 20px -4px rgba(8, 8, 8, 0.25);
          transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }

        .btn-primary-black:hover {
          background: var(--blue-primary, #0866FF);
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -4px rgba(8, 102, 255, 0.35);
        }

        .btn-secondary-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid var(--border-main, #E5E7EB);
          color: #080808;
          padding: 14px 26px;
          border-radius: var(--radius-full, 9999px);
          font-size: 0.925rem;
          font-weight: 600;
          text-decoration: none;
          transition: border-color 0.2s, background-color 0.2s, transform 0.2s;
        }

        .btn-secondary-outline:hover {
          border-color: #080808;
          background: var(--bg-secondary, #F7F8FA);
          transform: translateY(-1px);
        }

        /* Hero Visual Stage */
        .hero-visual-stage {
          width: 100%;
          max-width: 980px;
        }

        .stage-card {
          background: #FFFFFF;
          border: 1px solid var(--border-main, #E5E7EB);
          border-radius: var(--radius-xl, 32px);
          box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(0, 0, 0, 0.02);
          overflow: hidden;
          text-align: left;
        }

        .stage-topbar {
          background: var(--bg-secondary, #F7F8FA);
          border-bottom: 1px solid var(--border-subtle, #EEF0F3);
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.725rem;
        }

        .stage-window-dots {
          display: flex;
          gap: 6px;
        }

        .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .dot-red { background: #EF4444; }
        .dot-amber { background: #F59E0B; }
        .dot-emerald { background: #10B981; }

        .stage-topbar-title {
          font-weight: 700;
          color: var(--text-secondary, #5F6368);
          letter-spacing: 0.04em;
        }

        .stage-topbar-status {
          font-weight: 700;
          color: var(--blue-primary, #0866FF);
          letter-spacing: 0.04em;
        }

        .stage-body {
          padding: 32px 36px;
          background: #FFFFFF;
        }

        .stage-layout-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 32px;
          align-items: center;
        }

        .stage-text-side {
          display: flex;
          flex-direction: column;
        }

        .stage-headline-block {
          margin-bottom: 24px;
        }

        .stage-visual-side {
          display: flex;
          justify-content: center;
        }

        .stage-hero-showcase {
          position: relative;
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          background: #080808;
          box-shadow: 0 16px 36px -6px rgba(8, 102, 255, 0.22), 0 4px 12px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(8, 102, 255, 0.25);
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }

        .stage-hero-showcase:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 20px 45px -4px rgba(8, 102, 255, 0.3);
          border-color: rgba(8, 102, 255, 0.45);
        }

        .stage-hero-artwork {
          width: 100%;
          height: 230px;
          object-fit: cover;
          display: block;
        }

        .stage-art-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(8, 8, 8, 0.78);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(8, 102, 255, 0.3);
          border-radius: 9999px;
          padding: 6px 14px;
          font-size: 0.68rem;
          font-weight: 750;
          color: #FFFFFF;
          letter-spacing: 0.06em;
        }

        .art-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0866FF;
          box-shadow: 0 0 8px #0866FF;
        }

        .stage-badge-pill {
          display: inline-block;
          font-size: 0.675rem;
          font-weight: 800;
          color: var(--blue-primary, #0866FF);
          background: var(--blue-soft, #EAF3FF);
          padding: 3px 10px;
          border-radius: 9999px;
          margin-bottom: 10px;
          letter-spacing: 0.06em;
        }

        .stage-banner-h3 {
          font-size: 1.55rem;
          font-weight: 800;
          color: #080808;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }

        .stage-banner-p {
          font-size: 0.925rem;
          color: var(--text-secondary, #5F6368);
          margin: 0;
          max-width: 680px;
        }

        .stage-metrics-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          padding-top: 20px;
          border-top: 1px solid var(--border-subtle, #EEF0F3);
        }

        .stage-metric-box {
          display: flex;
          flex-direction: column;
        }

        .metric-val {
          font-size: 1.35rem;
          font-weight: 850;
          color: #080808;
          letter-spacing: -0.02em;
        }

        .metric-lbl {
          font-size: 0.725rem;
          color: var(--text-muted, #9AA0A6);
          font-weight: 600;
          margin-top: 2px;
        }

        /* ===================================================================
           SECTION 2: BRAND TICKER (LIGHT GRAY #F7F8FA)
           =================================================================== */
        .brands-ticker-section {
          background: var(--bg-secondary, #F7F8FA);
          border-top: 1px solid var(--border-main, #E5E7EB);
          border-bottom: 1px solid var(--border-main, #E5E7EB);
          padding: 20px 0;
          overflow: hidden;
          position: relative;
        }

        .ticker-label-wrap {
          text-align: center;
          margin-bottom: 12px;
        }

        .ticker-eyebrow {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted, #9AA0A6);
          letter-spacing: 0.1em;
        }

        .ticker-track {
          display: flex;
          width: max-content;
          animation: tickerScroll 35s linear infinite;
        }

        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .brands-ticker-section:hover .ticker-track {
          animation-play-state: paused;
        }

        .ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 0 28px;
          white-space: nowrap;
        }

        .ticker-brand-name {
          font-size: 0.95rem;
          font-weight: 800;
          color: #080808;
        }

        .ticker-brand-sep {
          color: #CBD5E1;
        }

        .ticker-brand-tag {
          font-size: 0.8rem;
          color: var(--text-secondary, #5F6368);
          font-weight: 500;
        }

        /* ===================================================================
           SECTION 3: COLLECTIONS (WHITE BASE)
           =================================================================== */
        .collections-section {
          padding: 96px 0;
          background: #FFFFFF;
        }

        .section-heading-block {
          margin-bottom: 48px;
        }

        .section-heading-block.centered {
          text-align: center;
        }

        .section-eyebrow-blue {
          display: inline-block;
          font-size: 0.725rem;
          font-weight: 800;
          color: var(--blue-primary, #0866FF);
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }

        .section-title-large {
          font-size: clamp(1.8rem, 2.8vw + 0.2rem, 2.75rem);
          font-weight: 850;
          letter-spacing: -0.03em;
          color: #080808;
          margin: 0 0 12px 0;
        }

        .section-subtitle-text {
          font-size: 1.05rem;
          color: var(--text-secondary, #5F6368);
          margin: 0;
          max-width: 620px;
          line-height: 1.6;
        }

        .section-subtitle-text.max-center {
          margin: 0 auto;
        }

        .collections-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .collection-card {
          background: var(--bg-secondary, #F7F8FA);
          border: 1px solid var(--border-main, #E5E7EB);
          border-radius: var(--radius-lg, 24px);
          padding: 32px 28px;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.25s ease;
        }

        .collection-card:hover {
          transform: translateY(-5px);
          background: #FFFFFF;
          border-color: #080808;
          box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.08);
        }

        .col-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .col-badge {
          font-size: 0.725rem;
          font-weight: 700;
          color: var(--blue-primary, #0866FF);
          background: var(--blue-soft, #EAF3FF);
          padding: 4px 10px;
          border-radius: var(--radius-full, 9999px);
        }

        .col-arrow-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 1px solid var(--border-main, #E5E7EB);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          color: #080808;
          transition: transform 0.2s, background-color 0.2s, color 0.2s;
        }

        .collection-card:hover .col-arrow-circle {
          background: #080808;
          color: #FFFFFF;
          transform: translateX(3px);
        }

        .col-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #080808;
          margin: 0 0 10px 0;
          letter-spacing: -0.02em;
        }

        .col-desc {
          font-size: 0.875rem;
          line-height: 1.55;
          color: var(--text-secondary, #5F6368);
          margin: 0 0 24px 0;
          flex: 1;
        }

        .col-specs-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 14px;
          border-top: 1px solid var(--border-subtle, #EEF0F3);
        }

        .specs-indicator-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--blue-primary, #0866FF);
          flex-shrink: 0;
        }

        .specs-text {
          font-size: 0.75rem;
          color: var(--text-muted, #9AA0A6);
          font-weight: 600;
        }

        /* ===================================================================
           SECTION 4: STRATEGIC DARK ANCHOR (#0B0B0D)
           =================================================================== */
        .dark-engineering-section {
          background: #0B0B0D;
          color: #FFFFFF;
          padding: 100px 0;
          position: relative;
          overflow: hidden;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .dark-ambient-radial {
          position: absolute;
          top: -120px;
          right: 15%;
          width: 600px;
          height: 350px;
          background: radial-gradient(circle, rgba(8, 102, 255, 0.12) 0%, transparent 70%);
          filter: blur(90px);
          pointer-events: none;
        }

        .dark-section-header {
          max-width: 760px;
          margin-bottom: 56px;
        }

        .dark-tag-blue {
          font-size: 0.725rem;
          font-weight: 800;
          color: #60a5fa;
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 12px;
        }

        .dark-title-large {
          font-size: clamp(2rem, 3.2vw + 0.2rem, 3rem);
          font-weight: 850;
          color: #FFFFFF;
          letter-spacing: -0.03em;
          margin: 0 0 16px 0;
        }

        .dark-desc-text {
          font-size: 1.05rem;
          line-height: 1.6;
          color: #9BA1A6;
          margin: 0;
        }

        .dark-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .dark-tech-card {
          background: #14161A;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-lg, 24px);
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          transition: border-color 0.2s, transform 0.2s;
        }

        .dark-tech-card:hover {
          border-color: rgba(8, 102, 255, 0.4);
          transform: translateY(-4px);
        }

        .dark-card-icon {
          font-size: 2rem;
          margin-bottom: 16px;
          line-height: 1;
        }

        .dark-card-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0 0 10px 0;
          letter-spacing: -0.01em;
        }

        .dark-card-desc {
          font-size: 0.875rem;
          line-height: 1.6;
          color: #9BA1A6;
          margin: 0 0 24px 0;
          flex: 1;
        }

        .dark-card-stat {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .stat-num {
          font-size: 1.8rem;
          font-weight: 850;
          color: #FFFFFF;
          letter-spacing: -0.03em;
        }

        .stat-unit {
          font-size: 0.8rem;
          color: #60a5fa;
          font-weight: 700;
          text-transform: uppercase;
        }

        /* ===================================================================
           SECTION 5: LIVE SHOWROOM CATALOG (WHITE BASE)
           =================================================================== */
        .catalog-showcase-section {
          padding: 96px 0;
          background: #FFFFFF;
        }

        .catalog-header-split {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
          margin-bottom: 48px;
        }

        .filter-pills-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-pill-btn {
          background: var(--bg-secondary, #F7F8FA);
          border: 1px solid var(--border-main, #E5E7EB);
          color: var(--text-secondary, #5F6368);
          padding: 8px 18px;
          border-radius: var(--radius-full, 9999px);
          font-size: 0.825rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .filter-pill-btn:hover {
          color: #080808;
          border-color: #080808;
        }

        .filter-pill-btn.is-active {
          background: #080808;
          border-color: #080808;
          color: #FFFFFF;
        }

        .products-grid-showcase {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .catalog-loading-state,
        .catalog-error-state {
          padding: 80px 20px;
          text-align: center;
          color: var(--text-muted, #9AA0A6);
        }

        .catalog-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-main, #E5E7EB);
          border-top-color: var(--blue-primary, #0866FF);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .btn-retry-catalog {
          margin-top: 14px;
          padding: 8px 20px;
          border-radius: var(--radius-full, 9999px);
          background: #080808;
          color: #FFFFFF;
          border: none;
          font-weight: 700;
          cursor: pointer;
        }

        .catalog-view-all-row {
          text-align: center;
        }

        .btn-explore-full-catalog {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          border-radius: var(--radius-full, 9999px);
          background: var(--bg-secondary, #F7F8FA);
          border: 1px solid var(--border-main, #E5E7EB);
          color: #080808;
          font-size: 0.925rem;
          font-weight: 700;
          text-decoration: none;
          transition: background-color 0.2s, border-color 0.2s, transform 0.2s;
        }

        .btn-explore-full-catalog:hover {
          background: #080808;
          border-color: #080808;
          color: #FFFFFF;
          transform: translateY(-2px);
        }

        /* ===================================================================
           SECTION 6: UAE ADVANTAGE PILLARS (LIGHT GRAY #F7F8FA)
           =================================================================== */
        .uae-advantage-section {
          padding: 96px 0;
          background: var(--bg-secondary, #F7F8FA);
          border-top: 1px solid var(--border-main, #E5E7EB);
          border-bottom: 1px solid var(--border-main, #E5E7EB);
        }

        .advantage-pillars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }

        .advantage-box {
          background: #FFFFFF;
          border: 1px solid var(--border-main, #E5E7EB);
          border-radius: var(--radius-lg, 24px);
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-subtle, 0 1px 2px rgba(0,0,0,0.04));
        }

        .adv-icon {
          font-size: 2rem;
          margin-bottom: 16px;
          line-height: 1;
        }

        .adv-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #080808;
          margin: 0 0 10px 0;
          letter-spacing: -0.01em;
        }

        .adv-desc {
          font-size: 0.875rem;
          line-height: 1.6;
          color: var(--text-secondary, #5F6368);
          margin: 0;
        }

        /* ===================================================================
           SECTION 7: CONSULTATION CALLOUT (SOFT BLUE TINT #EAF3FF)
           =================================================================== */
        .consultation-section {
          padding: 80px 0;
          background: #FFFFFF;
        }

        .consultation-card {
          background: var(--blue-soft, #EAF3FF);
          border: 1px solid rgba(8, 102, 255, 0.22);
          border-radius: var(--radius-xl, 32px);
          padding: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 36px;
        }

        .consultation-content {
          max-width: 660px;
        }

        .consultation-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--blue-primary, #0866FF);
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }

        .consultation-title {
          font-size: clamp(1.6rem, 2.4vw + 0.2rem, 2.25rem);
          font-weight: 850;
          color: #080808;
          letter-spacing: -0.025em;
          margin: 0 0 12px 0;
        }

        .consultation-desc {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--text-secondary, #5F6368);
          margin: 0 0 16px 0;
        }

        .consultation-meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.8rem;
          color: var(--text-muted, #9AA0A6);
          font-weight: 600;
          flex-wrap: wrap;
        }

        .consultation-cta-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .btn-whatsapp-large {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #25D366;
          color: #FFFFFF;
          padding: 16px 32px;
          border-radius: var(--radius-full, 9999px);
          font-size: 1rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 8px 24px -4px rgba(37, 211, 102, 0.4);
          transition: background-color 0.15s, transform 0.15s;
        }

        .btn-whatsapp-large:hover {
          background: #1EBE5D;
          transform: translateY(-2px);
        }

        .wa-icon {
          font-size: 1.25rem;
        }

        .wa-phone-text {
          font-size: 0.775rem;
          color: var(--text-secondary, #5F6368);
          font-weight: 600;
        }

        /* ===================================================================
           SHOWROOM LOCATION & DIRECTIONS SECTION STYLES
           =================================================================== */
        .showroom-location-section {
          padding: 88px 0 80px;
          background: #FFFFFF;
          border-top: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
          border-bottom: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
          position: relative;
          overflow: hidden;
        }

        .location-split-layout {
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          gap: 56px;
          align-items: center;
        }

        .location-info-col {
          display: flex;
          flex-direction: column;
        }

        .location-eyebrow-wrap {
          margin-bottom: 18px;
        }

        .location-eyebrow-pill {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 800;
          color: #0866FF;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: rgba(8, 102, 255, 0.08);
          border: 1px solid rgba(8, 102, 255, 0.22);
          padding: 5px 14px;
          border-radius: 9999px;
        }

        .location-main-title {
          font-size: clamp(2.1rem, 3.8vw, 3.1rem);
          font-weight: 850;
          letter-spacing: -0.03em;
          color: #080808;
          line-height: 1.14;
          margin: 0 0 18px 0;
        }

        .title-highlight-blue {
          color: #0866FF;
          position: relative;
        }

        .location-description {
          font-size: 1.02rem;
          line-height: 1.65;
          color: #475569;
          margin: 0 0 32px 0;
          max-width: 580px;
        }

        /* Metrics grid matching reference design */
        .location-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          padding: 24px 0;
          margin-bottom: 32px;
          border-top: 1px solid rgba(0, 0, 0, 0.07);
          border-bottom: 1px solid rgba(0, 0, 0, 0.07);
        }

        .loc-metric-block {
          display: flex;
          flex-direction: column;
        }

        .loc-metric-val {
          font-size: 2.1rem;
          font-weight: 900;
          color: #080808;
          letter-spacing: -0.035em;
          line-height: 1.1;
        }

        .loc-metric-sub {
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748B;
          margin-top: 4px;
          line-height: 1.35;
        }

        /* Buttons & Actions */
        .location-cta-group {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .btn-location-primary {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: #0866FF;
          color: #FFFFFF !important;
          font-size: 0.94rem;
          font-weight: 750;
          padding: 13px 24px;
          border-radius: 9999px;
          text-decoration: none;
          box-shadow: 0 8px 24px -4px rgba(8, 102, 255, 0.45);
          transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
        }

        .btn-location-primary:hover {
          background: #0756D6;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -4px rgba(8, 102, 255, 0.55);
        }

        .btn-location-secondary {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: rgba(37, 211, 102, 0.12);
          border: 1.5px solid rgba(37, 211, 102, 0.35);
          color: #15803D !important;
          font-size: 0.94rem;
          font-weight: 750;
          padding: 12px 22px;
          border-radius: 9999px;
          text-decoration: none;
          transition: background 0.18s, transform 0.15s, border-color 0.18s;
        }

        .btn-location-secondary:hover {
          background: #25D366;
          color: #FFFFFF !important;
          border-color: #25D366;
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(37, 211, 102, 0.35);
        }

        /* Chips */
        .location-chips-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .loc-chip-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 0.84rem;
          font-weight: 600;
          color: #334155;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          padding: 7px 14px;
          border-radius: 10px;
          width: fit-content;
        }

        .loc-chip-icon {
          font-size: 1rem;
        }

        /* RIGHT COLUMN: Visual Map Canvas + Showroom Photo Card */
        .location-visual-col {
          position: relative;
          display: flex;
          justify-content: center;
        }

        .dot-matrix-canvas {
          position: absolute;
          inset: -30px -40px;
          pointer-events: none;
          z-index: 1;
        }

        .matrix-svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .showroom-visual-card {
          position: relative;
          z-index: 2;
          width: 100%;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 24px;
          box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.14), 0 2px 10px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
        }

        .showroom-visual-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 32px 72px -16px rgba(0, 0, 0, 0.2);
        }

        .showroom-img-frame {
          position: relative;
          width: 100%;
          height: 290px;
          overflow: hidden;
          background: #0B0B0D;
        }

        .showroom-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .showroom-visual-card:hover .showroom-img {
          transform: scale(1.03);
        }

        .showroom-img-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, transparent 40%, rgba(0, 0, 0, 0.75) 100%);
          pointer-events: none;
        }

        .showroom-live-pill {
          position: absolute;
          top: 16px;
          left: 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(11, 11, 13, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 6px 12px;
          border-radius: 9999px;
          z-index: 3;
        }

        .live-dot-pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 10px #10B981;
        }

        .showroom-overlay-meta {
          position: absolute;
          bottom: 18px;
          left: 20px;
          right: 20px;
          z-index: 3;
          display: flex;
          flex-direction: column;
        }

        .showroom-overlay-title {
          font-size: 1.15rem;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: 0.04em;
          line-height: 1.2;
        }

        .showroom-overlay-sub {
          font-size: 0.72rem;
          font-weight: 750;
          color: #93C5FD;
          letter-spacing: 0.08em;
          margin-top: 3px;
        }

        .showroom-bottom-bar {
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: #FFFFFF;
        }

        .showroom-gps-info {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }

        .gps-pin-bubble {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(8, 102, 255, 0.1);
          color: #0866FF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .gps-text-wrap {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .gps-name {
          font-size: 0.88rem;
          font-weight: 750;
          color: #080808;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .gps-coords {
          font-size: 0.72rem;
          color: #64748B;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .btn-showroom-open-maps {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #080808;
          color: #FFFFFF !important;
          font-size: 0.82rem;
          font-weight: 750;
          padding: 9px 16px;
          border-radius: 9999px;
          text-decoration: none;
          flex-shrink: 0;
          transition: background 0.15s, transform 0.15s;
        }

        .btn-showroom-open-maps:hover {
          background: #0866FF;
          transform: translateY(-1px);
        }

        /* Responsive */
        @media (max-width: 960px) {
          .location-split-layout {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .location-description {
            max-width: 100%;
          }
        }
        @media (max-width: 900px) {
          .stage-layout-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .stage-hero-artwork {
            height: 200px;
          }

          .stage-metrics-row {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }

          .consultation-card {
            padding: 32px 24px;
          }
        }

        @media (max-width: 600px) {
          .hero-section {
            padding: 48px 16px 60px;
          }

          .stage-body {
            padding: 24px 18px;
          }

          .stage-hero-artwork {
            height: 170px;
          }

          .catalog-header-split {
            flex-direction: column;
            align-items: flex-start;
          }

          .consultation-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .btn-whatsapp-large {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </ClientLayout>
  );
}