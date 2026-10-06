'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '../../ClientLayout';

export default function DeliveryPartnerSignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    dob: '1995-01-01',
    vehicleType: 'VAN',
    vehiclePlate: '',
    assignedZone: 'Dubai'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password) {
      setError('Please complete all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/delivery/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          dob: formData.dob,
          vehicleType: formData.vehicleType,
          vehiclePlate: formData.vehiclePlate.trim() || 'DXB-PENDING',
          assignedZones: [formData.assignedZone]
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Driver registration failed.');
      }

      if (data.needsVerification) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email || formData.email)}&purpose=registration&redirect=/delivery`);
        }, 800);
        return;
      }

      setSuccess(true);

      // Persist auth token if provided
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (login) {
          login(data.token, data.user);
        }
      }

      setTimeout(() => {
        router.push('/delivery');
      }, 1000);
    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="driver-signup-page">
        <div className="driver-signup-card">
          {/* Header */}
          <div className="driver-badge-top">
            <span className="driver-badge-icon">🚚</span>
            <span className="driver-badge-text">FLEET ONBOARDING</span>
          </div>

          <h1 className="driver-signup-title">Join Al Mukammal Fleet</h1>
          <p className="driver-signup-subtitle">
            Register as an authorized delivery courier to receive daily laptop deliveries across Dubai &amp; UAE.
          </p>

          {error && (
            <div className="driver-error-banner" role="alert">
              <span className="err-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="driver-success-banner" role="status">
              <span className="success-icon">✓</span>
              <span>Fleet account created successfully! Launching your delivery console...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="driver-signup-form">
            {/* Full Name */}
            <div className="driver-field">
              <label htmlFor="reg-name">Full Name (as on Emirates ID)</label>
              <input
                id="reg-name"
                name="name"
                type="text"
                placeholder="e.g. Rashid Al Nuaimi"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email & Phone Grid */}
            <div className="driver-form-row">
              <div className="driver-field">
                <label htmlFor="reg-email">Driver Email Address</label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="driver@almukammal.ae"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="driver-field">
                <label htmlFor="reg-phone">UAE Mobile Contact</label>
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  placeholder="+971 50 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password & DOB */}
            <div className="driver-form-row">
              <div className="driver-field">
                <label htmlFor="reg-password">Password (min 6 chars)</label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="driver-field">
                <label htmlFor="reg-dob">Date of Birth</label>
                <input
                  id="reg-dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Vehicle Type & Plate */}
            <div className="driver-form-row">
              <div className="driver-field">
                <label htmlFor="reg-vehicleType">Vehicle Type</label>
                <select
                  id="reg-vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                >
                  <option value="VAN">Courier Van (Standard &amp; Bulk)</option>
                  <option value="MOTORBIKE">Motorbike (Express Run)</option>
                  <option value="CAR">Sedan Car (Executive)</option>
                </select>
              </div>

              <div className="driver-field">
                <label htmlFor="reg-plate">Vehicle Plate Number</label>
                <input
                  id="reg-plate"
                  name="vehiclePlate"
                  type="text"
                  placeholder="e.g. DXB-K-94182"
                  value={formData.vehiclePlate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Operating Emirate */}
            <div className="driver-field">
              <label htmlFor="reg-zone">Primary Operating Emirate</label>
              <select
                id="reg-zone"
                name="assignedZone"
                value={formData.assignedZone}
                onChange={handleChange}
              >
                <option value="Dubai">Dubai (Deira, Downtown, Marina, Business Bay)</option>
                <option value="Sharjah">Sharjah &amp; Northern Emirates</option>
                <option value="Abu Dhabi">Abu Dhabi Capital &amp; Al Ain</option>
                <option value="Ajman">Ajman &amp; Umm Al Quwain</option>
              </select>
            </div>

            <button
              type="submit"
              className="driver-signup-submit-btn"
              disabled={loading || success}
            >
              {loading ? (
                <span className="driver-btn-loading">
                  <span className="driver-spinner" /> Registering Driver Profile...
                </span>
              ) : (
                'Complete Fleet Registration & Launch Console →'
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="driver-footer-box">
            <div className="driver-signin-prompt">
              <span>Already registered as an authorized courier?</span>
              <Link href="/delivery/login" className="driver-signin-link">
                Sign In to Driver Console →
              </Link>
            </div>

            <div className="driver-divider" />

            <div className="driver-alt-links">
              <Link href="/delivery" className="driver-alt-link">
                Delivery Console
              </Link>
              <span className="dot-sep">•</span>
              <Link href="/auth/login" className="driver-alt-link">
                Customer Storefront
              </Link>
              <span className="dot-sep">•</span>
              <Link href="/track" className="driver-alt-link">
                Track Order
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .driver-signup-page {
          min-height: 85vh;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px 80px;
        }

        .driver-signup-card {
          width: 100%;
          max-width: 580px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 36px 32px;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.07);
        }

        .driver-badge-top {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0f172a;
          color: #ffffff;
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 20px;
        }

        .driver-badge-icon {
          font-size: 14px;
        }

        .driver-signup-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin: 0 0 8px;
        }

        .driver-signup-subtitle {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin: 0 0 24px;
        }

        .driver-error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .driver-success-banner {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .driver-signup-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .driver-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 600px) {
          .driver-form-row {
            grid-template-columns: 1fr;
          }
        }

        .driver-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .driver-field label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .driver-field input,
        .driver-field select {
          height: 46px;
          padding: 0 14px;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          font-size: 13px;
          color: #0f172a;
          background: #ffffff;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .driver-field input:focus,
        .driver-field select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .driver-signup-submit-btn {
          width: 100%;
          min-height: 52px;
          background: linear-gradient(135deg, #0866FF 0%, #0052CC 100%);
          color: #ffffff;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 14px;
          box-shadow: 0 10px 25px -4px rgba(8, 102, 255, 0.42);
          touch-action: manipulation;
        }

        .driver-signup-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #0756D6 0%, #0045B0 100%);
          transform: translateY(-2px);
          box-shadow: 0 14px 32px -2px rgba(8, 102, 255, 0.55);
        }

        .driver-signup-submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .driver-signup-submit-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .driver-btn-loading {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .driver-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .driver-footer-box {
          margin-top: 26px;
          text-align: center;
        }

        .driver-signin-prompt {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          color: #64748b;
        }

        .driver-signin-link {
          color: #2563eb;
          font-weight: 700;
          text-decoration: none;
        }

        .driver-signin-link:hover {
          text-decoration: underline;
        }

        .driver-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 18px 0;
        }

        .driver-alt-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 12px;
        }

        .driver-alt-link {
          color: #64748b;
          text-decoration: none;
        }

        .driver-alt-link:hover {
          color: #0f172a;
        }

        .dot-sep {
          color: #cbd5e1;
        }
      `}</style>
    </ClientLayout>
  );
}
