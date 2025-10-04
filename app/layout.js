'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './globals.css';
import './RootLayout.css';

export default function RootLayout({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Update cart count
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalItems);
    };

    updateCartCount();

    // Listen for storage changes
    window.addEventListener('storage', updateCartCount);
    
    // Custom event for cart updates
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <html lang="en">
      <head>
        <title>AL MUKAMMAL COMPUTER TRADING LLC - Premium Laptops</title>
        <meta name="description" content="Discover the best laptops for gaming, business, and creative work. Latest technology, competitive prices, and exceptional performance." />
        <link rel="icon" href="/favicon.png" />
      </head>
      <body className="layout-body">
        {/* Navigation */}
        <nav className="navigation">
          <div className="nav-container">
            <div className="nav-content">
              <Link href="/" className="logo-link">
                <div className="logo-icon">
                  <div className="logo-img"></div>
                </div>
                <span className="logo-text">
                  AL MUKAMMAL COMPUTER TRADING LLC
                </span>
              </Link>
              
              {/* Search Bar */}
              <div className="search-container">
                <form onSubmit={handleSearch} className="search-form">
                  <div className={`search-input-wrapper ${isSearchFocused ? 'focused' : ''}`}>
                    <input
                      type="text"
                      placeholder="Search laptops (e.g., Gaming Beast, i7, RTX, 16GB...)"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                      className="search-input"
                    />
                    <button type="submit" className="search-button">
                      <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>

              <div className="nav-links">
                <Link href="/" className="nav-link">
                  Home
                </Link>
                <Link href="/products" className="nav-link">
                  Products
                </Link>
                <Link href="/cart" className="cart-link">
                  <span className="cart-icon">🛒
                    {cartCount > 0 && (
                    <span className="cart-badge"><sup className='cartcount'> {cartCount} </sup></span>
                  )}
                  </span>
                  <span className="cart-text">Cart</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">{children}</main>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-container">
            <div className="footer-content">
              <h3 className="footer-title">AL MUKAMMAL COMPUTER TRADING LLC</h3>
              <p className="footer-description">
                Your trusted partner for premium laptops and computing solutions. 
                We bring you the latest technology with exceptional service.
              </p>
              <div className="footer-contact">
                <span>📞 +971 50 955 0121</span>
                <span>✉️ info.almukammal@gmail.com</span>
              </div>
              <div className="footer-bottom">
                <p>&copy; 2025 AL MUKAMMAL COMPUTER TRADING LLC. All rights reserved. Premium laptop solutions.</p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}