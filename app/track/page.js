'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ClientLayout from '../ClientLayout';

export default function TrackOrderSearchPage() {
  const [trackingInput, setTrackingInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    setLoading(true);
    router.push(`/track/${encodeURIComponent(trackingInput.trim().toUpperCase())}`);
  };

  return (
    <ClientLayout>
      <div className="track-search-root">
        <div className="track-search-container">
          {/* Header Badge */}
          <div className="track-badge">
            <span className="pulse-dot" />
            <span>Al Mukammal UAE Live Logistics</span>
          </div>

          <h1 className="track-heading">Track Your Order</h1>
          <p className="track-subheading">
            Enter your <strong>Tracking ID</strong> (e.g. <code>TRK-1234-AE</code>) or <strong>Order Number</strong> (e.g. <code>ORD-982143-...</code>) for real-time delivery progress and live courier GPS.
          </p>

          {/* Search Card */}
          <div className="search-card">
            <form onSubmit={handleSearch} className="search-form">
              <div className="input-wrap">
                <svg className="search-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="Enter Tracking ID or Order # (e.g. TRK-... or ORD-...)"
                  className="tracking-input"
                  required
                />
              </div>

              <button type="submit" disabled={loading || !trackingInput.trim()} className="track-submit-btn">
                {loading ? 'Locating Package...' : 'Track Package →'}
              </button>
            </form>

            <div className="quick-help">
              <span>Have an account?</span>
              <Link href="/orders" className="orders-link">
                View My Order History
              </Link>
            </div>
          </div>

          {/* Delivery Guarantee Value Props */}
          <div className="props-grid">
            <div className="prop-card">
              <div className="prop-icon">🚚</div>
              <h3>Express UAE Dispatch</h3>
              <p>Same-day or next-day courier delivery across Dubai, Sharjah, and Ajman.</p>
            </div>

            <div className="prop-card">
              <div className="prop-icon">🔒</div>
              <h3>Tamper-Proof Security</h3>
              <p>Every commercial laptop is dispatched in sealed, anti-shock packaging.</p>
            </div>

            <div className="prop-card">
              <div className="prop-icon">📍</div>
              <h3>Live Courier Updates</h3>
              <p>Track your shipment status in real time right up to handover verification.</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .track-search-root {
          min-height: 85vh;
          background: #ffffff;
          padding: 60px 20px 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .track-search-container {
          max-width: 820px;
          width: 100%;
          text-align: center;
        }

        .track-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 750;
          color: #1D4ED8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 20px;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2563EB;
          box-shadow: 0 0 10px #2563EB;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }

        .track-heading {
          font-size: clamp(2.4rem, 4.5vw, 3.4rem);
          font-weight: 900;
          color: #0F172A;
          letter-spacing: -0.03em;
          margin: 0 0 16px;
        }

        .track-subheading {
          font-size: 1.05rem;
          color: #475569;
          line-height: 1.6;
          margin: 0 auto 40px;
          max-width: 620px;
        }

        .track-subheading code {
          background: #F1F5F9;
          padding: 2px 8px;
          border-radius: 6px;
          color: #0F172A;
          font-weight: 700;
        }

        .search-card {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 28px;
          padding: 32px;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.07);
          margin-bottom: 60px;
        }

        .search-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        @media (min-width: 640px) {
          .search-form {
            flex-direction: row;
          }
        }

        .input-wrap {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        :global(.search-icon) {
          position: absolute;
          left: 20px;
          color: #94A3B8;
        }

        .tracking-input {
          width: 100%;
          background: #F8FAFC;
          border: 2px solid #E2E8F0;
          border-radius: 9999px;
          padding: 16px 20px 16px 54px;
          font-size: 1.02rem;
          color: #0F172A;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .tracking-input:focus {
          background: #FFFFFF;
          border-color: #0866FF;
          box-shadow: 0 0 0 4px rgba(8, 102, 255, 0.15);
        }

        .track-submit-btn {
          background: #0B0B0D;
          color: #FFFFFF;
          border: none;
          border-radius: 9999px;
          padding: 16px 32px;
          font-size: 1rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          white-space: nowrap;
        }

        .track-submit-btn:hover:not(:disabled) {
          background: #0866FF;
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(8, 102, 255, 0.3);
        }

        .quick-help {
          margin-top: 20px;
          font-size: 0.9rem;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .orders-link {
          color: #0866FF;
          font-weight: 700;
          text-decoration: underline;
        }

        .props-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 24px;
          text-align: left;
        }

        .prop-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 24px;
        }

        .prop-icon {
          font-size: 1.8rem;
          margin-bottom: 12px;
        }

        .prop-card h3 {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 8px;
        }

        .prop-card p {
          font-size: 0.88rem;
          color: #64748B;
          line-height: 1.5;
          margin: 0;
        }
      `}</style>
    </ClientLayout>
  );
}
