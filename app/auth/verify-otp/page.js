'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/app/ClientLayout';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp, resendOtp } = useAuth();

  const emailParam = searchParams.get('email') || '';
  const purposeParam = searchParams.get('purpose') || 'registration';
  const redirectParam = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Expiration countdown (default 5 minutes: 300 seconds)
  const [expirySeconds, setExpirySeconds] = useState(300);
  // Resend cooldown countdown (default 60 seconds)
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Auto-focus the first slot on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Sync email if query param changes
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Expiration countdown timer
  useEffect(() => {
    if (expirySeconds <= 0) return;
    const interval = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [expirySeconds]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) {
      setCanResend(true);
      return;
    }
    setCanResend(false);
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (index, value) => {
    const numericValue = value.replace(/\D/g, '');

    if (!numericValue) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const singleDigit = numericValue.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = singleDigit;
    setOtp(newOtp);
    if (error) setError('');

    // Advance to next input slot
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // Auto submit on completing 6th digit
    const fullOtp = newOtp.join('');
    if (fullOtp.length === 6) {
      submitOtp(fullOtp);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    if (error) setError('');

    const focusIndex = Math.min(pastedData.length, 5);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    }

    if (pastedData.length === 6) {
      submitOtp(pastedData);
    }
  };

  const submitOtp = async (codeToVerify) => {
    const fullCode = codeToVerify || otp.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    if (!email) {
      setError('Please provide your registered email address.');
      return;
    }

    if (expirySeconds <= 0) {
      setError('This verification code has expired. Please request a new code.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await verifyOtp({
      email: email.trim().toLowerCase(),
      otp: fullCode,
      purpose: purposeParam,
    });

    if (result.success) {
      setSuccessMsg('Email verified successfully! Activating your account...');
      setTimeout(() => {
        router.push(redirectParam);
        router.refresh();
      }, 900);
    } else {
      setError(result.error || 'Verification failed. Please check the code and try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email || resending) return;

    setError('');
    setSuccessMsg('');
    setResending(true);

    const result = await resendOtp({
      email: email.trim().toLowerCase(),
      purpose: purposeParam,
    });

    setResending(false);

    if (result.success) {
      setSuccessMsg(result.message || 'A new verification code has been dispatched.');
      setOtp(['', '', '', '', '', '']);
      setExpirySeconds(300);
      setCooldownSeconds(result.cooldownSeconds || 60);
      setCanResend(false);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } else {
      setError(result.message || 'Unable to resend verification code. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="card-header">
          <div className="brand-wrap">
            <Link href="/" className="brand-gem-badge" title="Al Mukammal Computer Trading">
              <img src="/logo-mark.png" alt="Al Mukammal" className="brand-gem-img" />
            </Link>
          </div>
          <h1 className="card-title">Verify Your Email</h1>
          <p className="card-subtitle">
            Enter the 6-digit verification code sent to your inbox
          </p>

          {/* Email Chip */}
          <div className="email-badge-wrap">
            <div className="email-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>{email || 'your email'}</span>
            </div>
          </div>
        </div>

        {/* Success Message Banner */}
        {successMsg && (
          <div className="message success-message">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Message Banner */}
        {error && (
          <div className="message error-message">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Fallback Email Input if missing */}
        {!emailParam && (
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="emailInput" className="input-label">Account Email Address</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                type="email"
                id="emailInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="modern-input"
              />
            </div>
          </div>
        )}

        {/* 6-Digit Visual Input Slots */}
        <form onSubmit={(e) => { e.preventDefault(); submitOtp(); }} className="auth-form">
          <div className="otp-slot-container">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                value={digit}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e.key)}
                onPaste={handlePaste}
                disabled={loading}
                className={`otp-slot ${digit ? 'is-filled' : ''}`}
              />
            ))}
          </div>

          {/* Expiration Timer Indicator */}
          <div className="timer-bar">
            <span className="timer-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Expires in: <strong className={expirySeconds < 60 ? 'timer-urgent' : ''}>{formatTimer(expirySeconds)}</strong>
            </span>
            <span className="single-use-badge">Single-use</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || otp.join('').length !== 6 || expirySeconds <= 0}
          >
            {loading ? (
              <>
                <span className="spinner" />
                <span>Verifying Code...</span>
              </>
            ) : (
              'Verify & Activate Account'
            )}
          </button>
        </form>

        {/* Pro-Tip: Spam / Junk folder notice */}
        <div className="spam-notice-card">
          <div className="spam-notice-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="spam-notice-content">
            <span className="spam-notice-title">Can't find your code?</span>
            <span className="spam-notice-desc">
              Please check your <strong>Spam</strong> or <strong>Junk</strong> folder. In case your OTP was delivered there, mark it as <em>"Not Spam"</em> so future emails arrive directly in your Primary inbox.
            </span>
          </div>
        </div>

        {/* Resend & Secondary Navigation */}
        <div className="card-footer">
          <p className="resend-text">
            Didn't receive the email code?{' '}
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="resend-action-btn"
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            ) : (
              <span className="cooldown-notice">
                Resend in {formatTimer(cooldownSeconds)}
              </span>
            )}
          </p>

          <div className="footer-links">
            <Link href="/auth/register" className="auth-link">
              ← Change Email / Back
            </Link>
            <span className="link-divider">•</span>
            <Link href="/auth/login" className="auth-link">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Scoped CSS 100% Identical to Al Mukammal Auth Design System */}
      <style jsx>{`
        .auth-container {
          min-height: calc(100vh - 120px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px 80px;
          background: var(--bg-canvas, #F7F8FA);
          position: relative;
        }

        .auth-card {
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.08));
          border-radius: 28px;
          padding: 40px 36px;
          box-shadow: 0 20px 48px -12px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(0, 0, 0, 0.03);
          position: relative;
        }

        .card-header {
          text-align: center;
          margin-bottom: 24px;
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

        .email-badge-wrap {
          display: flex;
          justify-content: center;
          margin-top: 12px;
        }

        .email-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 9999px;
          font-size: 0.82rem;
          font-weight: 650;
          color: #0F172A;
          max-width: 90%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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
          line-height: 1.4;
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
          gap: 18px;
        }

        .otp-slot-container {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin: 8px 0;
        }

        .otp-slot {
          width: 54px;
          height: 64px;
          text-align: center;
          font-size: 1.6rem;
          font-weight: 850;
          color: #0F172A;
          background: #F8FAFC;
          border: 2px solid #E2E8F0;
          border-radius: 16px;
          outline: none;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: inherit;
        }

        .otp-slot:focus {
          background: #FFFFFF;
          border-color: #0866FF;
          box-shadow: 0 0 0 4px rgba(8, 102, 255, 0.14);
          transform: translateY(-2px);
        }

        .otp-slot.is-filled {
          border-color: #0866FF;
          background: #FFFFFF;
        }

        .timer-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 2px;
          font-size: 0.82rem;
          color: #64748B;
        }

        .timer-text {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .timer-urgent {
          color: #EF4444;
          font-weight: 750;
        }

        .single-use-badge {
          background: #F1F5F9;
          color: #475569;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
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
          width: 100%;
          margin-top: 6px;
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
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
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

        .spam-notice-card {
          margin-top: 18px;
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          border-radius: 14px;
          padding: 12px 14px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          text-align: left;
        }

        .spam-notice-icon {
          color: #D97706;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .spam-notice-content {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .spam-notice-title {
          font-size: 0.82rem;
          font-weight: 750;
          color: #92400E;
        }

        .spam-notice-desc {
          font-size: 0.78rem;
          color: #B45309;
          line-height: 1.45;
        }

        .spam-notice-desc strong {
          color: #78350F;
          font-weight: 750;
        }

        .spam-notice-desc em {
          font-style: normal;
          color: #92400E;
          font-weight: 700;
        }

        .card-footer {
          margin-top: 26px;
          padding-top: 20px;
          border-top: 1px solid #F1F5F9;
          text-align: center;
        }

        .resend-text {
          font-size: 0.88rem;
          color: #64748B;
          margin: 0 0 14px 0;
        }

        .resend-action-btn {
          background: none;
          border: none;
          color: #0866FF;
          font-weight: 750;
          cursor: pointer;
          padding: 0;
          font-size: 0.88rem;
          text-decoration: underline;
          transition: color 0.15s;
        }

        .resend-action-btn:hover {
          color: #0756D6;
        }

        .cooldown-notice {
          color: #94A3B8;
          font-weight: 650;
        }

        .footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 0.84rem;
        }

        .auth-link {
          color: #64748B;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.15s;
        }

        .auth-link:hover {
          color: #0866FF;
        }

        .link-divider {
          color: #CBD5E1;
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 32px 20px;
            border-radius: 22px;
          }

          .otp-slot-container {
            gap: 6px;
          }

          .otp-slot {
            width: 44px;
            height: 56px;
            font-size: 1.35rem;
            border-radius: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <ClientLayout>
      <Suspense fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 600 }}>
          Loading verification portal...
        </div>
      }>
        <VerifyOtpContent />
      </Suspense>
    </ClientLayout>
  );
}
