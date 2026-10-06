'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/app/ClientLayout';

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

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

    const result = await login(formData.email, formData.password, 'admin');

    if (result.success) {
      router.push('/admin');
    } else {
      setError(result.error || 'Invalid administrator credentials');
    }

    setLoading(false);
  };

  return (
    <ClientLayout>
      <div className="auth-container">
        <div className="auth-card">
          <div className="card-header">
            <div className="admin-brand-wrap">
              <Link href="/" className="admin-brand-link" title="Al Mukammal Computer Trading">
                <img src="/logo-mark.png" alt="Al Mukammal" className="admin-brand-logo" />
              </Link>
            </div>
            <div className="admin-tag">Al Mukammal Operations</div>
            <h1 className="card-title">Staff Command Access</h1>
            <p className="card-subtitle">Restricted to authorized store leadership</p>
          </div>

          {error && (
            <div className="message error-message">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="email" className="input-label">Admin Email</label>
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
                  placeholder="admin@almukammal.ae"
                  className="modern-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="input-group">
              <div className="label-row">
                <label htmlFor="password" className="input-label">Password</label>
                <Link href="/auth/admin/forgot-password" className="forgot-link">
                  Recovery?
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
              {loading ? 'Authenticating...' : 'Enter Command Center'}
            </button>
          </form>

          <div className="card-footer">
            <div className="login-options">
              <Link href="/auth/login" className="footer-link">
                ← Customer Login
              </Link>
              <span className="dot-sep">•</span>
              <Link href="/auth/admin/register" className="admin-register-link">
                Register New Admin
              </Link>
            </div>
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

          .admin-brand-wrap {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 16px;
          }

          :global(.admin-brand-link),
          .admin-brand-link {
            width: 60px !important;
            height: 60px !important;
            border-radius: 16px !important;
            background: #080808 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 8px 24px rgba(8, 102, 255, 0.3) !important;
            border: 2px solid rgba(8, 102, 255, 0.45) !important;
            overflow: hidden !important;
            text-decoration: none !important;
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease !important;
            flex-shrink: 0 !important;
          }

          :global(.admin-brand-link:hover),
          .admin-brand-link:hover {
            transform: translateY(-2px) scale(1.05) !important;
            border-color: #2B8CFF !important;
            box-shadow: 0 12px 28px rgba(8, 102, 255, 0.5) !important;
          }

          .admin-brand-logo {
            width: 100%;
            height: 100%;
            max-width: 60px;
            max-height: 60px;
            object-fit: cover;
            display: block;
          }

          .admin-tag {
            display: inline-block;
            font-size: 0.68rem;
            font-weight: 800;
            color: #0866FF;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            background: rgba(8, 102, 255, 0.08);
            padding: 3px 10px;
            border-radius: 9999px;
            margin-bottom: 10px;
          }

          .card-title {
            font-size: 1.65rem;
            font-weight: 850;
            color: #080808;
            letter-spacing: -0.02em;
            margin: 0 0 6px 0;
          }

          .card-subtitle {
            font-size: 0.88rem;
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
            margin-top: 8px;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
          }

          .submit-btn:hover:not(:disabled) {
            background: #0866FF;
            box-shadow: 0 10px 28px rgba(8, 102, 255, 0.32);
            transform: translateY(-1px);
          }

          .card-footer {
            margin-top: 28px;
            text-align: center;
            border-top: 1px solid #F1F5F9;
            padding-top: 20px;
          }

          .login-options {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            font-size: 0.85rem;
          }

          .dot-sep {
            color: #CBD5E1;
          }

          .footer-link {
            color: #64748B;
            font-weight: 600;
            text-decoration: none;
          }

          .footer-link:hover {
            color: #0866FF;
          }

          .admin-register-link {
            color: #0866FF;
            font-weight: 700;
            text-decoration: none;
          }

          .admin-register-link:hover {
            text-decoration: underline;
          }

          @media (max-width: 640px) {
            .auth-card {
              padding: 30px 20px;
              border-radius: 24px;
            }

            .card-title {
              font-size: 1.4rem;
            }
          }
        `}</style>
      </div>
    </ClientLayout>
  );
}