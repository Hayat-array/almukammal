'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '../../ClientLayout';

export default function DeliveryPartnerLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide your driver email address and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          isDeliveryLogin: true
        })
      });

      const data = await res.json();

      if (data.needsVerification) {
        // Redirect unverified driver to OTP verification
        router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email || email.trim())}&purpose=registration&redirect=/delivery`);
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Driver credentials verification failed.');
      }

      // Persist auth in client storage & cookies
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `user_role=${data.user?.role || 'delivery_partner'}; path=/; max-age=604800; SameSite=Lax`;
        if (login) {
          login(email.trim(), password, false, true);
        }
      }

      // Redirect directly to the driver console
      router.push('/delivery');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Unable to connect to delivery portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="driver-auth-page">
        <div className="driver-auth-card">
          {/* Header Badge */}
          <div className="driver-badge-top">
            <span className="driver-badge-icon">🚚</span>
            <span className="driver-badge-text">AL MUKAMMAL FLEET LOGISTICS</span>
          </div>

          <h1 className="driver-auth-title">Courier &amp; Driver Portal</h1>
          <p className="driver-auth-subtitle">
            Sign in to access your assigned UAE deliveries, GPS navigation, and Proof-of-Delivery console.
          </p>

          {error && (
            <div className="driver-error-banner" role="alert">
              <span className="err-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="driver-form">
            <div className="driver-field">
              <label htmlFor="driver-email">Driver Email Address</label>
              <div className="driver-input-box">
                <input
                  id="driver-email"
                  type="email"
                  placeholder="driver@almukammal.ae"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="driver-field">
              <div className="driver-label-row">
                <label htmlFor="driver-password">Access Password</label>
              </div>
              <div className="driver-input-box">
                <input
                  id="driver-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-pwd-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="driver-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="driver-btn-loading">
                  <span className="driver-spinner" /> Connecting to Dispatch...
                </span>
              ) : (
                'Sign In to Delivery Console →'
              )}
            </button>
          </form>

          {/* Registration Hook */}
          <div className="driver-footer-box">
            <div className="driver-signup-prompt">
              <span>New Courier or Fleet Partner?</span>
              <Link href="/delivery/signup" className="driver-signup-link">
                Register as Delivery Partner →
              </Link>
            </div>

            <div className="driver-divider" />

            <div className="driver-alt-links">
              <Link href="/auth/admin/login" className="driver-alt-link">
                Admin Logistics Desk
              </Link>
              <span className="dot-sep">•</span>
              <Link href="/auth/login" className="driver-alt-link">
                Customer Sign In
              </Link>
              <span className="dot-sep">•</span>
              <Link href="/track" className="driver-alt-link">
                Public Order Tracking
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .driver-auth-page {
          min-height: 85vh;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px 80px;
        }

        .driver-auth-card {
          width: 100%;
          max-width: 460px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 36px 32px;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.07);
        }

        .driver-badge-top {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0f172a;
          color: #ffffff;
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 20px;
        }

        .driver-badge-icon {
          font-size: 14px;
        }

        .driver-auth-title {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin: 0 0 8px;
        }

        .driver-auth-subtitle {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin: 0 0 24px;
        }

        .driver-error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .driver-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .driver-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .driver-field label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .driver-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .driver-input-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .driver-input-box input {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          font-size: 14px;
          color: #0f172a;
          background: #ffffff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .driver-input-box input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .toggle-pwd-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
        }

        .driver-submit-btn {
          height: 50px;
          background: #0f172a;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 8px;
        }

        .driver-submit-btn:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }

        .driver-submit-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
        }

        .driver-btn-loading {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .driver-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .driver-footer-box {
          margin-top: 28px;
          text-align: center;
        }

        .driver-signup-prompt {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          color: #64748b;
        }

        .driver-signup-link {
          color: #2563eb;
          font-weight: 700;
          text-decoration: none;
        }

        .driver-signup-link:hover {
          text-decoration: underline;
        }

        .driver-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 20px 0;
        }

        .driver-alt-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 12px;
        }

        .driver-alt-link {
          color: #64748b;
          text-decoration: none;
        }

        .driver-alt-link:hover {
          color: #0f172a;
        }

        .dot-sep {
          color: #cbd5e1;
        }
      `}</style>
    </ClientLayout>
  );
}
