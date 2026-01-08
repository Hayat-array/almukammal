'use client';

import { useState, useEffect } from 'react';
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

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'admin') {
            router.replace('/admin');
          } else {
            router.replace('/');
          }
        } catch (e) {
          // invalid json, ignore
        }
      }
    }
  }, []);
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await login(formData.email.trim().toLowerCase(), formData.password, false);

      if (result.success) {
        setSuccess('Welcome back! Redirecting...');
        setTimeout(() => {
          router.push(redirect);
          router.refresh();
        }, 1000);
      } else {
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
        {/* Animated Background */}
        <div className="animated-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>

        {/* Floating Particles */}
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${(i * 5.3) % 100}%`,
              animationDelay: `${(i * 0.7) % 15}s`,
              animationDuration: `${15 + (i * 0.5) % 10}s`
            }}></div>
          ))}
        </div>

        {/* Glass Card */}
        <div className="glass-card">
          {/* Header with Icon */}
          <div className="card-header">
            <div className="icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="card-title">Welcome Back</h1>
            <p className="card-subtitle">Sign in to continue your journey</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="message success-message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="message error-message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="email" className="input-label">Email Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  placeholder="user@almukammal.com"
                  className="modern-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  placeholder="Enter your password"
                  className="modern-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="forgot-password">
              <Link href="/auth/forgot-password" className="forgot-link">
                <span className="icon">🔑</span>
                Forgot password?
              </Link>
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="card-footer">
            <p className="footer-text">
              Don't have an account? <Link href={`/auth/register?redirect=${encodeURIComponent(redirect)}`} className="footer-link">Sign up</Link>
            </p>
            <div className="divider"></div>
            <p className="footer-text admin-footer">
              Admin? <Link href="/auth/admin/login" className="admin-link">Login here</Link>
            </p>
          </div>
        </div>

        <style jsx>{`
          .auth-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
          }

          .animated-bg {
            position: absolute;
            inset: 0;
            overflow: hidden;
          }

          .gradient-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.5;
            animation: float 20s ease-in-out infinite;
          }

          .orb-1 {
            width: 500px;
            height: 500px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            top: -10%;
            left: -10%;
            animation-delay: 0s;
          }

          .orb-2 {
            width: 400px;
            height: 400px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            bottom: -10%;
            right: -10%;
            animation-delay: 7s;
          }

          .orb-3 {
            width: 350px;
            height: 350px;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation-delay: 14s;
          }

          @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }

          .particles {
            position: absolute;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
          }

          .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            animation: rise linear infinite;
          }

          @keyframes rise {
            0% {
              bottom: -10px;
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              bottom: 100vh;
              opacity: 0;
            }
          }

          .glass-card {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 360px;
            background: white;
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 1.5rem 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.6s ease-out;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .card-header {
            text-align: center;
            margin-bottom: 1rem;
          }

          .icon-wrapper {
            width: 52px;
            height: 52px;
            margin: 0 auto 0.75rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
            animation: pulse 2s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }

          .card-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.25rem;
            letter-spacing: -0.5px;
          }

          .card-subtitle {
            color: #6b7280;
            font-size: 0.75rem;
          }

          .message {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.625rem 0.875rem;
            border-radius: 8px;
            margin-bottom: 0.75rem;
            font-size: 0.8125rem;
            animation: slideIn 0.3s ease-out;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .success-message {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #10b981;
          }

          .error-message {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
          }

          .auth-form {
            margin-bottom: 1rem;
          }

          .input-group {
            margin-bottom: 0.75rem;
          }

          .input-label {
            display: block;
            color: #374151;
            font-size: 0.8125rem;
            font-weight: 600;
            margin-bottom: 0.3rem;
            letter-spacing: 0.3px;
          }

          .input-wrapper {
            position: relative;
          }

          .input-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
            pointer-events: none;
            transition: color 0.3s;
          }

          .modern-input {
            width: 100%;
            padding: 0.625rem 0.875rem 0.625rem 2.75rem;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            color: #1f2937;
            font-size: 0.8125rem;
            outline: none;
            transition: all 0.3s;
          }

          .modern-input::placeholder {
            color: #9ca3af;
          }

          .modern-input:focus {
            background: white;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }

          .modern-input:focus + .input-icon,
          .input-wrapper:focus-within .input-icon {
            color: #667eea;
          }

          .modern-input:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .forgot-password {
            text-align: center;
            margin-bottom: 0.75rem;
            font-weight: bold;
            color: #8750ba;
          }

          .forgot-link {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.5rem 1rem;
            background: rgba(135, 80, 186, 0.08);
            border: 1.5px solid #8750ba;
            border-radius: 20px;
            font-size: 0.8125rem;
            text-decoration: none;
            transition: all 0.3s ease;
            font-weight: bold !important;
            color: #8750ba !important;
            position: relative;
          }

          .forgot-link .icon {
            font-size: 1rem;
            animation: wiggle 2s ease-in-out infinite;
          }

          @keyframes wiggle {
            0%, 100% { transform: rotate(0deg); }
            10%, 30% { transform: rotate(-10deg); }
            20%, 40% { transform: rotate(10deg); }
          }

          .forgot-link:hover {
            background: #8750ba;
            color: white !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(135, 80, 186, 0.4);
          }

          .forgot-link:hover .icon {
            animation: bounce 0.6s ease-in-out;
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }

          .submit-btn {
            width: 100%;
            padding: 0.7rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }

          .submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
          }

          .submit-btn:active:not(:disabled) {
            transform: translateY(0);
          }

          .submit-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .card-footer {
            text-align: center;
          }

          .footer-text {
            color: #6b7280;
            font-size: 0.8125rem;
            margin-bottom: 0.375rem;
          }

          .footer-link {
            color: #667eea;
            font-weight: 600;
            text-decoration: none;
            transition: color 0.3s;
          }

          .footer-link:hover {
            color: #764ba2;
          }

          .divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
            margin: 1rem 0;
          }

          .admin-footer {
            margin-bottom: 0;
          }

          .admin-link {
            color: #f5576c;
            font-weight: 600;
            text-decoration: none;
            transition: color 0.3s;
          }

          .admin-link:hover {
            color: #f093fb;
          }

          @media (max-width: 640px) {
            .glass-card {
              padding: 1.25rem 1.25rem;
              max-width: 320px;
            }

            .card-title {
              font-size: 1.25rem;
            }

            .gradient-orb {
              filter: blur(60px);
            }
          }
        `}</style>
      </div>
    </ClientLayout>
  );
}
