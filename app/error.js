// app/error.js
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import './NotFound.css';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-icon">🚨</div>
        <h1 className="not-found-title">Something went wrong!</h1>
        <p className="not-found-description">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>
        <div className="not-found-actions">
          <button 
            onClick={reset}
            className="not-found-button primary"
            type="button"
          >
            🔄 Try Again
          </button>
          <Link href="/" className="not-found-button secondary">
            🏠 Go Home
          </Link>
          <Link href="/products" className="not-found-button tertiary">
            📦 Browse Products
          </Link>
        </div>
        <div className="support-info">
          <p>If the problem continues, contact our support team:</p>
          <div className="contact-info">
            <span>📞 +971 50 955 0121</span>
            <span>✉️ info.almukammal@gmail.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}