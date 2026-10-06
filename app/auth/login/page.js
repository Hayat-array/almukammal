'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/app/ClientLayout';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const queryMsg = searchParams.get('msg');

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
    setSuccess('');

    try {
      const result = await login(formData.email, formData.password, false);

      if (result.success) {
        setSuccess('Welcome back! Redirecting...');
        setTimeout(() => {
          router.push(redirect);
          router.refresh();
        }, 800);
      } else {
        if (result.needsVerification) {
          router.push(`/auth/verify-otp?email=${encodeURIComponent(result.email || formData.email)}&purpose=registration&redirect=${encodeURIComponent(redirect)}`);
          return;
        }
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="auth-container">
        {/* Luxury Modern Auth Card */}
        <div className="auth-card">
          {/* Header */}
          <div className="card-header">
            <div className="brand-wrap">
              <Link href="/" className="brand-gem-badge" title="Al Mukammal Computer Trading">
                <img src="/logo-mark.png" alt="Al Mukammal" className="brand-gem-img" />
              </Link>
            </div>
            <h1 className="card-title">Welcome Back</h1>
            <p className="card-subtitle">Sign in to your Al Mukammal account</p>
          </div>

          {/* Success Banner */}
          {(success || queryMsg === 'admin_registered') && (
            <div className="message success-message">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success || 'Admin registration successful! Please log in.'}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="message error-message">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="email" className="input-label">Email Address</label>
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

            <div className="input-group">
              <div className="label-row">
                <label htmlFor="password" className="input-label">Password</label>
                <Link href="/auth/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>
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
                  placeholder="••••••••"
                  className="modern-input"
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
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
              Don&apos;t have an account? <Link href={`/auth/register?redirect=${encodeURIComponent(redirect)}`} className="footer-link">Create Account</Link>
            </p>
            <div className="divider"></div>
            <p className="footer-text admin-footer">
              Authorized Personnel? <Link href="/auth/admin/login" className="admin-link">Staff Login</Link>
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
            max-width: 440px;
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

          .success-message {
            background: #ECFDF5;
            color: #065F46;
            border: 1px solid #A7F3D0;
          }

          .error-message {
            background: #FEF2F2;
            color: #991B1B;
            border: 1px solid #FECACA;
          }

          .auth-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .input-group {
            display: flex;
            flex-direction: column;
            gap: 7px;
          }

          .label-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .input-label {
            font-size: 0.78rem;
            font-weight: 750;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .forgot-link {
            font-size: 0.8rem;
            font-weight: 600;
            color: #0866FF;
            text-decoration: none;
            transition: color 0.15s;
          }

          .forgot-link:hover {
            color: #0756D6;
            text-decoration: underline;
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
            padding: 13px 18px 13px 46px;
            font-size: 0.92rem;
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
            width: 100%;
            min-height: 52px;
            background: linear-gradient(135deg, #0866FF 0%, #0052CC 100%);
            color: #FFFFFF;
            border: none;
            border-radius: 9999px;
            padding: 14px 24px;
            font-size: 1rem;
            font-weight: 800;
            letter-spacing: 0.02em;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 10px;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 10px 25px -4px rgba(8, 102, 255, 0.42), 0 2px 6px rgba(0, 0, 0, 0.08);
            touch-action: manipulation;
          }

          .submit-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #0756D6 0%, #0045B0 100%);
            box-shadow: 0 14px 32px -2px rgba(8, 102, 255, 0.55);
            transform: translateY(-2px);
          }

          .submit-btn:active:not(:disabled) {
            transform: scale(0.98);
          }

          .submit-btn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
            transform: none;
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
            margin-top: 28px;
            text-align: center;
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

          .divider {
            height: 1px;
            background: #F1F5F9;
            margin: 18px 0;
          }

          .admin-link {
            color: #0B0B0D;
            font-weight: 700;
            text-decoration: none;
            padding: 4px 10px;
            background: #F1F5F9;
            border-radius: 9999px;
            font-size: 0.8rem;
            margin-left: 6px;
            transition: all 0.15s;
          }

          .admin-link:hover {
            background: #0B0B0D;
            color: #FFFFFF;
          }

          @media (max-width: 640px) {
            .auth-container {
              padding: 24px 12px 60px;
            }

            .auth-card {
              padding: 28px 18px;
              border-radius: 24px;
            }

            .card-title {
              font-size: 1.45rem;
            }

            .modern-input {
              font-size: 16px !important; /* Prevents iOS auto-zoom on mobile */
              padding: 13px 16px 13px 44px;
            }

            .submit-btn {
              min-height: 52px;
              font-size: 1rem;
              border-radius: 14px;
              box-shadow: 0 8px 24px rgba(8, 102, 255, 0.4);
            }
          }
        `}</style>
      </div>
    </ClientLayout>
  );
}
