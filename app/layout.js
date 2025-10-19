
import { AuthProvider } from '@/contexts/AuthContext';

import './globals.css';
export const metadata = {
  title: 'AL MUKAMMAL COMPUTER TRADING LLC - Premium Laptops',
  description: 'Discover the best laptops for gaming, business, and creative work. Latest technology, competitive prices, and exceptional performance.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
