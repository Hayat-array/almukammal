'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ClientLayout from '@/app/ClientLayout';

export default function ForgotPassword() {
  const router = useRouter();

  // 1: Enter email, 2: Enter 6-digit OTP, 3: Enter new password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetAuthToken, setResetAuthToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Timer states for Step 2
  const [expirySeconds, setExpirySeconds] = useState(300);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Auto focus first OTP slot when entering step 2
  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  // Timers for Step 2
  useEffect(() => {
    if (step !== 2) return;
    const interval = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step !== 2) return;
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
  }, [step, cooldownSeconds]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // STEP 1: Request Password Reset Code
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setInfoMsg(data.message || 'If an account exists for this email, a verification code has been sent.');
        setExpirySeconds(300);
        setCooldownSeconds(60);
        setStep(2);
      } else {
        setError(data.message || 'Unable to request password reset. Please try again.');
      }
    } catch (err) {
      console.error('Request reset error:', err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Slot navigation
  const handleOtpChange = (index, value) => {
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

    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    const fullCode = newOtp.join('');
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode);
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
      handleVerifyOtp(pastedData);
    }
  };

  // STEP 2: Verify Password Reset OTP
  const handleVerifyOtp = async (codeOverride) => {
    const code = codeOverride || otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: code,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResetAuthToken(data.resetAuthToken);
        setInfoMsg('Code verified. Please choose a new secure password.');
        setStep(3);
      } else {
        setError(data.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      console.error('Verify reset OTP error:', err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    if (!canResend) return;
    setError('');
    setInfoMsg('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          purpose: 'password_reset',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setInfoMsg(data.message || 'A new verification code has been sent.');
        setOtp(['', '', '', '', '', '']);
        setExpirySeconds(300);
        setCooldownSeconds(data.cooldownSeconds || 60);
        setCanResend(false);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      } else {
        setError(data.message || 'Failed to resend code. Please try again.');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('A network error occurred. Please try again.');
    }
  };

  // STEP 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          resetAuthToken,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push('/auth/login?msg=password_reset_success');
      } else {
        setError(data.message || 'Password reset failed. Please request a new code.');
      }
    } catch (err) {
      console.error('Reset error:', err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="auth-container">
        <div className="auth-card">
          {/* Header */}
          <div className="card-header">
            <div className="brand-wrap">
              <Link href="/" className="brand-gem-badge" title="Al Mukammal Computer Trading">
                <img src="/logo-mark.png" alt="Al Mukammal" className="brand-gem-img" />
              </Link>
            </div>
            <h1 className="card-title">Reset Password</h1>
            <p className="card-subtitle">
              {step === 1 && 'Enter your registered email to receive a verification code'}
              {step === 2 && 'Enter the 6-digit verification code sent to your inbox'}
              {step === 3 && 'Create a new secure password for your account'}
            </p>

            {/* Email Chip */}
            {step === 2 && email && (
              <div className="email-badge-wrap">
                <div className="email-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span>{email}</span>
                </div>
              </div>
            )}

            {/* Stepper Indicator */}
            <div className="stepper-dots">
              <span className={`step-dot ${step >= 1 ? 'is-active' : ''}`}>1</span>
              <div className={`step-line ${step >= 2 ? 'is-active' : ''}`}></div>
              <span className={`step-dot ${step >= 2 ? 'is-active' : ''}`}>2</span>
              <div className={`step-line ${step >= 3 ? 'is-active' : ''}`}></div>
              <span className={`step-dot ${step === 3 ? 'is-active' : ''}`}>3</span>
            </div>
          </div>

          {/* Info Banner */}
          {infoMsg && (
            <div className="message info-message">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>{infoMsg}</span>
            </div>
          )}

          {error && (
            <div className="message error-message">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Email Input */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="auth-form">
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
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    required
                    placeholder="name@example.com"
                    className="modern-input"
                    disabled={loading}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="submit-btn" style={{ width: '100%', marginTop: '8px' }}>
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* STEP 2: Enter 6-digit OTP */}
          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="auth-form">
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
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e.key)}
                    onPaste={handlePaste}
                    disabled={loading}
                    className={`otp-slot ${digit ? 'is-filled' : ''}`}
                  />
                ))}
              </div>

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

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6 || expirySeconds <= 0}
                className="submit-btn"
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  'Verify Code & Continue'
                )}
              </button>

              <div className="resend-wrap">
                <span>Didn't receive the email? </span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="resend-btn"
                  >
                    Resend Code
                  </button>
                ) : (
                  <span className="cooldown-text">Resend in {formatTimer(cooldownSeconds)}</span>
                )}
              </div>

              {/* Spam Mail Notice */}
              <div className="spam-notice-card">
                <div className="spam-notice-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="spam-notice-content">
                  <span className="spam-notice-title">Can't find your reset email?</span>
                  <span className="spam-notice-desc">
                    Please check your <strong>Spam</strong> or <strong>Junk</strong> folder. In case your code was sent there, mark it as <em>"Not Spam"</em> so future emails arrive directly in your inbox.
                  </span>
                </div>
              </div>
            </form>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 3 && (
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
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                    required
                    placeholder="At least 6 characters"
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
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    required
                    placeholder="Repeat new password"
                    className="modern-input"
                    disabled={loading}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="submit-btn" style={{ width: '100%', marginTop: '8px' }}>
                {loading ? 'Saving New Password...' : 'Reset Password & Log In'}
              </button>
            </form>
          )}

          {/* Footer Back Link */}
          <div className="card-footer">
            <Link href="/auth/login" className="auth-link">
              ← Return to Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Scoped CSS Matching Al Mukammal Design System */}
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

        .stepper-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .step-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 750;
          background: #F1F5F9;
          color: #64748B;
          border: 1.5px solid #E2E8F0;
          transition: all 0.2s ease;
        }

        .step-dot.is-active {
          background: #0866FF;
          color: #FFFFFF;
          border-color: #0866FF;
          box-shadow: 0 4px 12px rgba(8, 102, 255, 0.3);
        }

        .step-line {
          width: 32px;
          height: 2px;
          background: #E2E8F0;
          transition: all 0.2s ease;
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
          line-height: 1.4;
        }

        .info-message {
          background: #EFF6FF;
          color: #1E40AF;
          border: 1px solid #BFDBFE;
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

        .otp-slot-container {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin: 10px 0 6px;
        }

        .otp-slot {
          width: 52px;
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
          color: #0866FF;
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

        .resend-wrap {
          text-align: center;
          font-size: 0.85rem;
          color: #64748B;
          margin-top: 14px;
        }

        .resend-btn {
          background: none;
          border: none;
          color: #0866FF;
          font-weight: 750;
          cursor: pointer;
          padding: 0;
          font-size: inherit;
          text-decoration: underline;
          transition: color 0.15s;
        }

        .resend-btn:hover {
          color: #0052CC;
        }

        .cooldown-text {
          color: #94A3B8;
          font-weight: 600;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
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

        .auth-link {
          color: #64748B;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.88rem;
          transition: color 0.15s;
        }

        .auth-link:hover {
          color: #0866FF;
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 32px 20px;
            border-radius: 22px;
          }

          .otp-slot {
            width: 44px;
            height: 56px;
            font-size: 1.35rem;
            border-radius: 12px;
          }
        }
      `}</style>
    </ClientLayout>
  );
}
