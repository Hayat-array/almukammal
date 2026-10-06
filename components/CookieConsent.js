'use client';

import React, { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('al_mukammal_cookie_consent');
      if (!consent) {
        // Small delay so it smoothly slides in without blocking initial paint
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('al_mukammal_cookie_consent', 'accepted');
    } catch {}
    setVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('al_mukammal_cookie_consent', 'essential_only');
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      className="cookie-banner-wrapper"
      role="region"
      aria-label="Cookie consent"
    >
      <div className="cookie-banner-content">
        <div className="cookie-banner-icon" aria-hidden="true">
          🍪
        </div>
        <div className="cookie-banner-text">
          <p className="cookie-title">UAE Privacy &amp; Cookies</p>
          <p className="cookie-desc">
            We use essential cookies to maintain your shopping cart, verify authentication, and optimize laptop consultation across the Emirates.
          </p>
        </div>
      </div>

      <div className="cookie-banner-actions">
        <button
          type="button"
          onClick={handleDecline}
          className="btn-cookie-secondary"
        >
          Essential Only
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="btn-cookie-primary"
        >
          Accept All
        </button>
      </div>

      <style jsx>{`
        .cookie-banner-wrapper {
          position: fixed;
          bottom: 24px;
          left: 24px;
          right: auto;
          max-width: 440px;
          width: calc(100vw - 48px);
          z-index: 9998;
          background: #0B0B0D;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 18px 20px;
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.45);
          display: flex;
          flex-direction: column;
          gap: 14px;
          animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          color: #ffffff;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .cookie-banner-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .cookie-banner-icon {
          font-size: 1.35rem;
          line-height: 1;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .cookie-banner-text {
          flex: 1;
        }

        .cookie-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 3px 0;
          letter-spacing: -0.01em;
        }

        .cookie-desc {
          font-size: 0.775rem;
          line-height: 1.45;
          color: #9BA1A6;
          margin: 0;
        }

        .cookie-banner-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .btn-cookie-secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #E5E7EB;
          font-size: 0.775rem;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 9999px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }

        .btn-cookie-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .btn-cookie-primary {
          background: #0866FF;
          border: none;
          color: #ffffff;
          font-size: 0.775rem;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 9999px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(8, 102, 255, 0.35);
          transition: background 0.15s, transform 0.15s;
        }

        .btn-cookie-primary:hover {
          background: #0756D6;
          transform: translateY(-1px);
        }

        @media (max-width: 480px) {
          .cookie-banner-wrapper {
            bottom: 16px;
            left: 16px;
            right: 16px;
            width: auto;
            max-width: none;
            padding: 16px;
          }
        }
      `}</style>
    </aside>
  );
}
