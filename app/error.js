'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Application runtime error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '75vh',
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
        padding: '48px 32px'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>
          Something went wrong
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '24px' }}>
          An unexpected error occurred while loading this page.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              borderRadius: '9999px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
          <Link
            href="/"
            style={{
              padding: '12px 24px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
