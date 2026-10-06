'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ClientLayout from '@/app/ClientLayout';

export default function AdminForgotPassword() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: '', dob: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [userId, setUserId] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleVerifyDOB = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          dob: formData.dob,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResetToken(data.resetToken);
        setUserId(data.userId);
        setStep(2);
      } else {
        setError(data.message || 'Staff verification failed. Please check your details.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          resetToken,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push('/auth/admin/login?msg=password_reset_success');
      } else {
        setError(data.message || 'Password reset failed. Please try again.');
      }
    } catch (err) {
      console.error('Reset error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="auth-container">
        <div className="auth-card">
          <div className="card-header">
            <div className="admin-lock-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="admin-tag">Staff Credential Recovery</div>
            <h1 className="card-title">Reset Admin Key</h1>
            <p className="card-subtitle">
              {step === 1 ? 'Verify administrator email and security Date of Birth' : 'Set a new secure administrator password'}
            </p>

            <div className="stepper-dots">
              <span className={`step-dot ${step >= 1 ? 'is-active' : ''}`}>1</span>
              <div className={`step-line ${step >= 2 ? 'is-active' : ''}`}></div>
              <span className={`step-dot ${step === 2 ? 'is-active' : ''}`}>2</span>
            </div>
          </div>

          {error && (
            <div className="message error-message">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleVerifyDOB} className="auth-form">
              <div className="input-group">
                <label htmlFor="email" className="input-label">Admin Email Address</label>
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
                <label htmlFor="dob" className="input-label">Date of Birth (Security Question)</label>
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

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Verifying Admin Identity...' : 'Continue to Reset'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="input-group">
                <label htmlFor="newPassword" className="input-label">New Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    placeholder="Min. 6 characters"
                    className="modern-input"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword" className="input-label">Confirm New Password</label>
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
                    placeholder="Confirm new password"
                    className="modern-input"
                    disabled={loading}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          )}

          <div className="card-footer">
            <p className="footer-text">
              Return to <Link href="/auth/admin/login" className="footer-link">Staff Login</Link>
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

          .admin-lock-badge {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: #0B0B0D;
            color: #ffffff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 14px;
            box-shadow: 0 8px 24px rgba(11, 11, 13, 0.25);
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

          .stepper-dots {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 18px;
          }

          .step-dot {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 750;
            background: #F1F5F9;
            color: #64748B;
            border: 1.5px solid #E2E8F0;
          }

          .step-dot.is-active {
            background: #0866FF;
            color: #FFFFFF;
            border-color: #0866FF;
          }

          .step-line {
            width: 32px;
            height: 2px;
            background: #E2E8F0;
          }

          .step-line.is-active {
            background: #0866FF;
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

            .card-title {
              font-size: 1.4rem;
            }
          }
        `}</style>
      </div>
    </ClientLayout>
  );
}
