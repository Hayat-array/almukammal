'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ClientLayout from '@/app/ClientLayout';

export default function AdminRegister() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        adminSecret: '',
        dob: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
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

        try {
            const response = await fetch('/api/auth/admin/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    adminSecret: formData.adminSecret,
                    dob: formData.dob
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Success
            router.push('/auth/login?msg=admin_registered');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ClientLayout>
            <div className="auth-container">
                {/* Animated Background - reused logic */}
                <div className="animated-bg">
                    <div className="gradient-orb orb-1"></div>
                    <div className="gradient-orb orb-2"></div>
                </div>

                <div className="glass-card">
                    <div className="card-header">
                        <div className="icon-wrapper admin-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h1 className="card-title">Admin Access</h1>
                        <p className="card-subtitle">Register new administrator account</p>
                    </div>

                    {error && (
                        <div className="message error-message">
                            <span>⚠️ {error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <label className="input-label">Admin Secret Key</label>
                            <input
                                type="password"
                                name="adminSecret"
                                value={formData.adminSecret}
                                onChange={handleChange}
                                required
                                placeholder="Enter provided secret key"
                                className="modern-input secret-input"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-grid">
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="modern-input"
                                    disabled={loading}
                                />
                            </div>

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
                        </div>

                        <div className="input-group">
                            <label className="input-label">Date of Birth</label>
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                required
                                className="modern-input"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-grid">
                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Min 6 chars"
                                    className="modern-input"
                                    disabled={loading}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Confirm</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="modern-input"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="submit-btn admin-btn">
                            {loading ? 'Registering...' : 'Create Admin Account'}
                        </button>
                    </form>

                    <div className="card-footer">
                        <p className="footer-label">Already have an account?</p>
                        <div className="login-options">
                            <Link href="/auth/login" className="footer-link user-link"style={{color:"red"}}>
                                Login as User
                            </Link>
                            <span className="divider">|</span>
                            <Link href="/auth/admin/login" className="footer-link admin-link " style={{color:"red"}}>
                                Login as Admin
                            </Link>
                        </div>
                    </div>
                </div>

                <style jsx>{`
          /* Reusing valid CSS from register page plus admin specifics */
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
            max-width: 400px;
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
            margin-bottom: 0.75rem;
          }
          .input-group {
            margin-bottom: 0;
          }
          .form-grid {
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: 0.75rem;
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
          .secret-input {
            border-color: #fca5a5;
            background: #fef2f2;
          }
          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .submit-btn.admin-btn {
            width: 100%;
            padding: 0.875rem;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.2s;
            margin-top: 1rem;
          }
          .submit-btn.admin-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(220, 38, 38, 0.3);
          }
          .error-message {
            background: #fee2e2;
            color: #b91c1c;
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            text-align: center;
            font-size: 0.875rem;
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
