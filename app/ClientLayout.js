'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import CustomerCareWidget from '@/components/CustomerCareWidget';
import { ToastProvider } from '@/components/Toast';
import './design-tokens.css';

export default function ClientLayout({ children }) {
  return (
    <div className="site-wrapper">
      <Navbar />
      <main className="site-main">
        {children}
      </main>
      <Footer />
      <CookieConsent />
      <CustomerCareWidget />

      <style jsx global>{`
        .site-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-default, #FFFFFF);
          color: var(--text-primary, #080808);
        }

        .site-main {
          flex: 1;
          width: 100%;
        }
      `}</style>
    </div>
  );
}