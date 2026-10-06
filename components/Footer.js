'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer-root">
      <div className="footer-container">
        {/* Top Trust Pillars Strip (Dark Surface Rounded Cards) */}
        <div className="trust-grid">
          <div className="trust-card">
            <span className="trust-icon" aria-hidden="true">🛡️</span>
            <div>
              <h4 className="trust-title">1-Year UAE Warranty</h4>
              <p className="trust-desc">Official manufacturer &amp; local warranty</p>
            </div>
          </div>
          <div className="trust-card">
            <span className="trust-icon" aria-hidden="true">🚚</span>
            <div>
              <h4 className="trust-title">Express UAE Delivery</h4>
              <p className="trust-desc">Dubai, Abu Dhabi, Sharjah &amp; all Emirates</p>
            </div>
          </div>
          <div className="trust-card">
            <span className="trust-icon" aria-hidden="true">💬</span>
            <div>
              <h4 className="trust-title">WhatsApp Consultation</h4>
              <p className="trust-desc">Direct engineer &amp; hardware guidance</p>
            </div>
          </div>
          <div className="trust-card">
            <span className="trust-icon" aria-hidden="true">✨</span>
            <div>
              <h4 className="trust-title">100% Authentic</h4>
              <p className="trust-desc">Brand new sealed factory hardware</p>
            </div>
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="footer-main-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <div className="footer-logo">
              <div className="footer-logo-frame">
                <img
                  src="/logo-mark.png"
                  alt="Al Mukammal Logo"
                  className="footer-logo-img"
                />
              </div>
              <div className="logo-titles">
                <span className="logo-main">ALMUKAMMAL</span>
                <span className="logo-sub">COMPUTERS & REQUISITES TRADING L.L.C</span>
              </div>
            </div>
            <p className="footer-about">
              Dubai's premier boutique showroom for high-performance laptops, custom mobile workstations, and executive computing. Serving enterprise clients and enthusiasts across the United Arab Emirates.
            </p>
            <div className="footer-contact-pills">
              <a
                href="https://wa.me/971509550121"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-pill whatsapp-pill"
              >
                <span>💬</span> WhatsApp: +971 50 955 0121
              </a>
              <a
                href="/#showroom-location"
                className="contact-pill location-pill"
                title="View Al Mukammal Flagship Showroom & Directions"
              >
                <span>📍</span> Showroom: Deira, Dubai, UAE
              </a>
            </div>
          </div>

          {/* Column 2: Laptop Collections */}
          <div className="footer-nav-col">
            <h5 className="footer-col-title">LAPTOP COLLECTIONS</h5>
            <ul className="footer-link-list">
              <li><Link href="/products?category=Gaming">Gaming Beasts (RTX 40-Series)</Link></li>
              <li><Link href="/products?brand=Apple">Apple MacBooks (M3 Pro &amp; Max)</Link></li>
              <li><Link href="/products?category=Ultrabook">Executive Ultrabooks</Link></li>
              <li><Link href="/products?category=Workstation">Engineering Workstations</Link></li>
              <li><Link href="/products?sort=newest">Latest 2026 Arrivals</Link></li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div className="footer-nav-col">
            <h5 className="footer-col-title">CLIENT SERVICES</h5>
            <ul className="footer-link-list">
              <li><Link href="/orders">Track Order Status</Link></li>
              <li><Link href="/cart">View Shopping Cart</Link></li>
              <li><Link href="/profile">Account &amp; UAE Addresses</Link></li>
              <li><Link href="/delivery/signup">Fleet Partner Onboarding</Link></li>
              <li><a href="https://wa.me/971509550121" target="_blank" rel="noopener noreferrer">Corporate Procurement</a></li>
            </ul>
          </div>

          {/* Column 4: Operational Hours */}
          <div className="footer-nav-col">
            <h5 className="footer-col-title">SHOWROOM HOURS</h5>
            <div className="hours-block">
              <div className="hours-row">
                <span className="days">Mon - Sat:</span>
                <span className="time">09:00 AM – 10:00 PM (GST)</span>
              </div>
              <div className="hours-row">
                <span className="days">Sunday:</span>
                <span className="time">04:00 PM – 10:00 PM (GST)</span>
              </div>
            </div>
            <div className="currency-note">
              <span>🇦🇪</span> Currency: United Arab Emirates Dirham (AED)
            </div>
            <div className="admin-access-link">
              <Link href="/auth/admin/login">Staff &amp; Admin Portal →</Link>
            </div>
            <div className="admin-access-link" style={{ marginTop: '6px' }}>
              <Link href="/delivery/login">Delivery Courier Portal →</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="copyright-text">
            © {new Date().getFullYear()} ALMUKAMMAL COMPUTERS & REQUISITES TRADING L.L.C. Commercial registration in Dubai, UAE.
          </p>
          <div className="legal-links">
            <span className="legal-tag">Trade License: Registered Dubai, UAE</span>
            <span className="legal-tag">Authoritative Price Validation</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-root {
          background: #0B0B0D;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          color: #9BA1A6;
          padding: 64px 20px 28px;
          margin-top: 80px;
        }

        .footer-container {
          max-width: var(--max-width-site, 1280px);
          margin: 0 auto;
        }

        /* Trust Grid */
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          padding-bottom: 48px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 48px;
        }

        .trust-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #14161A;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 18px;
          padding: 18px 20px;
          transition: border-color 0.2s;
        }

        .trust-card:hover {
          border-color: rgba(255, 255, 255, 0.16);
        }

        .trust-icon {
          font-size: 1.6rem;
          line-height: 1;
        }

        .trust-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 3px 0;
          letter-spacing: -0.01em;
        }

        .trust-desc {
          font-size: 0.775rem;
          color: #9BA1A6;
          margin: 0;
        }

        /* Main Grid */
        .footer-main-grid {
          display: grid;
          grid-template-columns: 2fr 1.2fr 1.2fr 1.4fr;
          gap: 40px;
          margin-bottom: 48px;
        }

        .footer-brand-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .footer-logo-frame {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #0B0B0D;
          border: 1px solid rgba(8, 102, 255, 0.4);
          box-shadow: 0 4px 14px rgba(8, 102, 255, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .footer-logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .logo-titles {
          display: flex;
          flex-direction: column;
        }

        .logo-main {
          font-size: 1rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.04em;
        }

        .logo-sub {
          font-size: 0.65rem;
          color: #9BA1A6;
          font-weight: 600;
          letter-spacing: 0.08em;
        }

        .footer-about {
          font-size: 0.85rem;
          line-height: 1.6;
          color: #9BA1A6;
          margin: 0;
          max-width: 380px;
        }

        .footer-contact-pills {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }

        .contact-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          padding: 7px 14px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #E5E7EB;
          text-decoration: none;
          transition: background 0.15s;
        }

        .whatsapp-pill:hover {
          background: rgba(37, 211, 102, 0.12);
          border-color: rgba(37, 211, 102, 0.3);
          color: #25D366;
        }

        /* Nav Columns */
        .footer-nav-col {
          display: flex;
          flex-direction: column;
        }

        .footer-col-title {
          font-size: 0.75rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.08em;
          margin: 0 0 16px 0;
        }

        .footer-link-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-link-list li a {
          font-size: 0.85rem;
          color: #9BA1A6;
          text-decoration: none;
          transition: color 0.15s, transform 0.15s;
          display: inline-block;
        }

        .footer-link-list li a:hover {
          color: #ffffff;
          transform: translateX(2px);
        }

        /* Hours Block */
        .hours-block {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 14px;
        }

        .hours-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 8px;
        }

        .hours-row:last-child {
          margin-bottom: 0;
        }

        .days {
          font-size: 0.725rem;
          color: #0866FF;
          font-weight: 700;
        }

        .time {
          font-size: 0.775rem;
          color: #E5E7EB;
        }

        .currency-note {
          font-size: 0.775rem;
          color: #9BA1A6;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .admin-access-link a {
          font-size: 0.775rem;
          color: #60a5fa;
          text-decoration: none;
          font-weight: 600;
        }

        .admin-access-link a:hover {
          text-decoration: underline;
        }

        /* Bottom Bar */
        .footer-bottom-bar {
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .copyright-text {
          font-size: 0.775rem;
          color: #6B7280;
          margin: 0;
        }

        .legal-links {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .legal-tag {
          font-size: 0.725rem;
          color: #6B7280;
        }

        @media (max-width: 992px) {
          .footer-main-grid {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
        }

        @media (max-width: 640px) {
          .footer-root {
            padding: 44px 16px 24px;
            margin-top: 48px;
          }

          .footer-main-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .trust-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            padding-bottom: 32px;
            margin-bottom: 32px;
          }

          .trust-card {
            padding: 14px 16px;
          }

          .footer-contact-pills {
            flex-direction: column;
            align-items: flex-start;
          }

          .footer-bottom-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>
    </footer>
  );
}
