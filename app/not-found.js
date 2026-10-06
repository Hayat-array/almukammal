'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
      textAlign: 'center',
      background: '#0b0f19',
      color: '#ffffff'
    }}>
      <div style={{
        maxWidth: '540px',
        background: '#111827',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '48px 32px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          fontSize: '4.5rem',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          marginBottom: '16px'
        }}>
          404
        </div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: '#ffffff',
          marginBottom: '12px'
        }}>
          Page Not Found
        </h2>
        <p style={{
          color: '#94a3b8',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          marginBottom: '32px'
        }}>
          The laptop model, order link, or resource you are looking for does not exist or may have been relocated.
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.875rem'
            }}
          >
            Back to Showroom
          </Link>
          <Link
            href="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            Browse Laptops
          </Link>
        </div>
      </div>
    </div>
  );
}
