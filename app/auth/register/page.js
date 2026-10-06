'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/app/ClientLayout';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    dob: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);

    if (result.success) {
      if (result.needsVerification) {
        router.push(`/auth/verify-otp?email=${encodeURIComponent(result.email || formData.email)}&purpose=registration&redirect=${encodeURIComponent(redirect)}`);
        return;
      }
      router.push(redirect);
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <ClientLayout>
      <div className="auth-container">
        {/* Luxury Modern Register Card */}
        <div className="auth-card">
          {/* Header */}
          <div className="card-header">
            <div className="brand-wrap">
              <Link href="/" className="brand-gem-badge" title="Al Mukammal Computer Trading">
                <img src="/logo-mark.png" alt="Al Mukammal" className="brand-gem-img" />
              </Link>
            </div>
            <h1 className="card-title">Create Account</h1>
            <p className="card-subtitle">Join Al Mukammal Computer Trading LLC</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="message error-message">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="name" className="input-label">Full Name *</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Full name"
                    className="modern-input"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="email" className="input-label">Email Address *</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="name@example.com"
                    className="modern-input"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="phone" className="input-label">Phone / WhatsApp *</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+971 50 000 0000"
                    className="modern-input"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="dob" className="input-label">Date of Birth *</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                    className="modern-input"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="address" className="input-label">UAE Delivery Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, Building, Apartment, City (e.g. Dubai Marina)"
                  className="modern-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="password" className="input-label">Password *</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Min. 6 characters"
                    className="modern-input"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword" className="input-label">Confirm Password *</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Re-enter password"
                    className="modern-input"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="card-footer">
            <p className="footer-text">
              Already have an account? <Link href={`/auth/login?redirect=${encodeURIComponent(redirect)}`} className="footer-link">Sign In</Link>
            </p>
          </div>
        </div>

        <style jsx>{`
          .auth-container {
            min-height: calc(100vh - 80px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 16px 80px;
            background: var(--bg-canvas, #F7F8FA);
            position: relative;
          }

          .auth-card {
            width: 100%;
            max-width: 580px;
            background: #ffffff;
            border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
            border-radius: 28px;
            padding: 40px 36px;
            box-shadow: 0 20px 48px -12px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(0, 0, 0, 0.03);
            position: relative;
          }

          .card-header {
            text-align: center;
            margin-bottom: 28px;
          }

          .brand-wrap {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 16px;
          }

          :global(.brand-gem-badge),
          .brand-gem-badge {
            width: 58px !important;
            height: 58px !important;
            border-radius: 16px !important;
            background: #080808 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 8px 24px rgba(8, 102, 255, 0.28) !important;
            border: 2px solid rgba(8, 102, 255, 0.4) !important;
            overflow: hidden !important;
            text-decoration: none !important;
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease !important;
            flex-shrink: 0 !important;
          }

          :global(.brand-gem-badge:hover),
          .brand-gem-badge:hover {
            transform: translateY(-2px) scale(1.04) !important;
            border-color: #0866FF !important;
            box-shadow: 0 12px 28px rgba(8, 102, 255, 0.45) !important;
          }

          .brand-gem-img {
            width: 100%;
            height: 100%;
            max-width: 58px;
            max-height: 58px;
            object-fit: cover;
            display: block;
          }

          .card-title {
            font-size: 1.75rem;
            font-weight: 850;
            color: #080808;
            letter-spacing: -0.02em;
            margin: 0 0 6px 0;
          }

          .card-subtitle {
            font-size: 0.9rem;
            color: #64748B;
            margin: 0;
          }

          .message {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            border-radius: 14px;
            font-size: 0.88rem;
            font-weight: 600;
            margin-bottom: 20px;
          }

          .error-message {
            background: #FEF2F2;
            color: #991B1B;
            border: 1px solid #FECACA;
          }

          .auth-form {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .input-group {
            display: flex;
            flex-direction: column;
            gap: 7px;
          }

          .input-label {
            font-size: 0.78rem;
            font-weight: 750;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          :global(.input-icon) {
            position: absolute;
            left: 16px;
            color: #94A3B8;
            pointer-events: none;
          }

          .modern-input {
            width: 100%;
            background: #F8FAFC;
            border: 1.5px solid #E2E8F0;
            border-radius: 9999px;
            padding: 12px 18px 12px 46px;
            font-size: 0.9rem;
            color: #0F172A;
            transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
            outline: none;
            font-family: inherit;
          }

          .modern-input:focus {
            background: #FFFFFF;
            border-color: #0866FF;
            box-shadow: 0 0 0 4px rgba(8, 102, 255, 0.12);
          }

          .modern-input::placeholder {
            color: #94A3B8;
          }

          .submit-btn {
            background: #0B0B0D;
            color: #FFFFFF;
            border: none;
            border-radius: 9999px;
            padding: 14px 24px;
            font-size: 0.95rem;
            font-weight: 750;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 10px;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
          }

          .submit-btn:hover:not(:disabled) {
            background: #0866FF;
            box-shadow: 0 10px 28px rgba(8, 102, 255, 0.32);
            transform: translateY(-1px);
          }

          .submit-btn:active:not(:disabled) {
            transform: translateY(0);
          }

          .submit-btn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
          }

          .spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: #FFFFFF;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .card-footer {
            margin-top: 24px;
            text-align: center;
            border-top: 1px solid #F1F5F9;
            padding-top: 20px;
          }

          .footer-text {
            color: #64748B;
            font-size: 0.88rem;
            margin: 0;
          }

          .footer-link {
            color: #0866FF;
            font-weight: 700;
            text-decoration: none;
          }

          .footer-link:hover {
            text-decoration: underline;
          }

          @media (max-width: 640px) {
            .auth-card {
              padding: 30px 20px;
              border-radius: 24px;
            }

            .form-grid {
              grid-template-columns: 1fr;
              gap: 14px;
            }

            .card-title {
              font-size: 1.5rem;
            }
          }
        `}</style>
      </div>
    </ClientLayout>
  );
}