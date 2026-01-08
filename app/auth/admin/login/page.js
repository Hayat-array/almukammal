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
      router.push('/admin/dashboard');
    } else {
      setError(result.error || 'Invalid credentials');
    }

    setLoading(false);
  };

  return (
    <ClientLayout>
      <div className="auth-container">
        {/* Animated Background */}
        <div className="animated-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
        </div>

        <div className="glass-card">
          <div className="card-header">
            <div className="icon-wrapper admin-icon">
              {/* Lock Icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="card-title">Admin Login</h1>
            <p className="card-subtitle">Secure access for administrators</p>
          </div>

          {error && (
            <div className="message error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="modern-input"
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="modern-input"
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} className="submit-btn admin-btn">
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>

          <div className="card-footer">
            <p className="footer-label">Don't have an access?</p>
            <div className="login-options">
              <Link href="/auth/login" className="footer-link user-link">
                Login as User
              </Link>
              <span className="divider">|</span>
              <Link href="/auth/admin/register" className="footer-link admin-link" style={{ color: "red" }}>
                Register as Admin
              </Link>
            </div>
          </div>
        </div>

        <style jsx>{`
          .auth-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #450a0a 100%);
            padding: 2rem;
            position: relative;
            overflow: hidden;
          }
          .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            padding: 1rem;
            border-radius: 12px;
            width: 100%;
            max-width: 340px; /* Slightly smaller than register */
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            z-index: 10;
          }
          .icon-wrapper.admin-icon {
            background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 0.25rem;
            color: white;
            box-shadow: 0 5px 15px rgba(220, 38, 38, 0.3);
          }
          .card-title {
            text-align: center;
            font-size: 1.1rem;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 0.1rem;
          }
          .card-subtitle {
            text-align: center;
            color: #64748b;
            font-size: 0.7rem;
            margin-bottom: 1rem;
          }
          .input-group {
            margin-bottom: 0.5rem;
          }
          .input-label {
            display: block;
            font-size: 0.7rem;
            font-weight: 600;
            color: #475569;
            margin-bottom: 0.1rem;
          }
          .modern-input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 0.85rem;
            transition: all 0.2s;
          }
          .modern-input:focus {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
            outline: none;
          }
          .submit-btn.admin-btn {
            width: 100%;
            padding: 0.6rem;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: transform 0.2s;
            margin-top: 0.75rem;
          }
          .submit-btn.admin-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(220, 38, 38, 0.3);
          }
          .error-message {
            background: #fee2e2;
            color: #b91c1c;
            padding: 0.5rem;
            border-radius: 6px;
            margin-bottom: 0.75rem;
            text-align: center;
            font-size: 0.75rem;
            font-weight: 500;
          }
           .card-footer {
             margin-top: 1rem;
             text-align: center;
             border-top: 1px solid #f1f5f9;
             padding-top: 1rem;
          }
          .footer-label {
            color: #64748b;
            font-size: 0.75rem;
            margin-bottom: 0.5rem;
          }
          .login-options {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            align-items: center;
            font-size: 0.8rem;
          }
          .footer-link {
             text-decoration: none;
             font-weight: 600;
             transition: color 0.2s;
          }
          .user-link {
             color: #475569;
          }
          .user-link:hover {
             color: #1e293b;
             text-decoration: underline;
          }
          .admin-link {
             color: #dc2626;
          }
          .admin-link:hover {
             color: #991b1b;
             text-decoration: underline;
          }
          .divider {
            color: #cbd5e1;
          }
          
           .animated-bg { position: absolute; inset: 0; }
           .gradient-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.4; }
           .orb-1 { width: 400px; height: 400px; background: #ef4444; top: -10%; right: -10%; }
           .orb-2 { width: 300px; height: 300px; background: #3b82f6; bottom: -10%; left: -10%; }
        `}</style>
      </div>
    </ClientLayout>
  );
}