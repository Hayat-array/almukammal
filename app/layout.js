
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/Toast';

import './globals.css';
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  title: 'ALMUKAMMAL COMPUTERS & REQUISITES TRADING L.L.C - Premium Laptops in Dubai',
  description: 'Discover the best laptops for gaming, business, and creative work. Latest technology, competitive prices, and exceptional performance in Dubai, UAE.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '64x64' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/logo-mark.png', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  other: {
    'font-display': 'swap',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
