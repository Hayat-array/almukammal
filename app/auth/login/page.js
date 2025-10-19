
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '../../ClientLayout';

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
      // Use the auth context login function
      const result = await login(formData.email.trim().toLowerCase(), formData.password);
      
      if (result.success) {
        setSuccess('Welcome back! Redirecting...');
        
        // Use the redirect parameter or default to home
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
      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="login-title">User Login</h1>
            <p className="login-subtitle">Welcome back to your account</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="success-message">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="user@almukammal.com"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="form-input"
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="login-button"
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="login-footer">
            <p className="footer-text">
              Don't have an account?
            </p>
            <Link 
              href={`/auth/register?redirect=${encodeURIComponent(redirect)}`}
              className="footer-link"
            >
              Sign up here
            </Link>
          </div>

          {/* Admin Link */}
          <div className="admin-section">
            <p className="admin-text">
              Admin?{' '}
              <Link 
                href="/auth/admin/login"
                className="admin-link"
              >
                Login as Admin
              </Link>
            </p>
          </div>
        </div>

        <style jsx>{`
          .login-container {
            min-height: 80vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2rem 1rem;
          }

          .login-card {
            background: white;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            padding: 2.5rem;
            width: 100%;
            max-width: 28rem;
          }

          .login-header {
            text-align: center;
            margin-bottom: 1.5rem;
          }

          .login-icon {
            background: #667eea;
            color: white;
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
          }

          .login-title {
            font-size: 2rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 0.5rem;
          }

          .login-subtitle {
            color: #6b7280;
            font-size: 0.875rem;
          }

          .success-message {
            background: #d1fae5;
            border: 1px solid #10b981;
            color: #065f46;
            padding: 0.75rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .error-message {
            background: #fee2e2;
            border: 1px solid #ef4444;
            color: #991b1b;
            padding: 0.75rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
            font-size: 0.875rem;
          }

          .form-group {
            margin-bottom: 1.25rem;
          }

          .form-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.5rem;
          }

          .form-input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 1rem;
            outline: none;
            transition: border-color 0.2s;
          }

          .form-input:focus {
            border-color: #667eea;
          }

          .form-input:disabled {
            background-color: #f9fafb;
            cursor: not-allowed;
          }

          .login-button {
            width: 100%;
            background: #667eea;
            color: white;
            padding: 0.875rem;
            border-radius: 0.5rem;
            border: none;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }

          .login-button:hover:not(:disabled) {
            background: #5a67d8;
          }

          .login-button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }

          .button-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .login-footer {
            text-align: center;
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e5e7eb;
          }

          .footer-text {
            color: #6b7280;
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
          }

          .footer-link {
            color: #667eea;
            font-weight: 600;
            text-decoration: none;
            font-size: 0.875rem;
          }

          .footer-link:hover {
            text-decoration: underline;
          }

          .admin-section {
            text-align: center;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
          }

          .admin-text {
            color: #6b7280;
            font-size: 0.75rem;
          }

          .admin-link {
            color: #dc2626;
            font-weight: 600;
            text-decoration: none;
          }

          .admin-link:hover {
            text-decoration: underline;
          }
        `}</style>
      </div>
    </ClientLayout>
  );
}