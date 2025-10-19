'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import './RootLayout.css';

export default function ClientLayout({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalItems);
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
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

  const getInitial = () => {
    if (!user || !user.name) return 'U';
    return user.name.charAt(0).toUpperCase();
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    // If on admin page, redirect to home after logout
    if (pathname.startsWith('/auth/admin') || pathname.startsWith('/admin')) {
      router.push('/');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  };

  const handleNavigation = (path) => {
    closeMobileMenu();
    router.push(path);
  };

  return (
    <div className="layout-body">
      {/* Navigation */}
      <nav className="navigation">
        <div className="nav-container">
          <div className="nav-content">
            <Link href="/" className="logo-link" onClick={closeMobileMenu}>
              <div className="logo-icon">
                <div className="logo-img"></div>
              </div>
              <span className="logo-text">
                AL MUKAMMAL COMPUTER TRADING LLC
              </span>
            </Link>
            
            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-button" 
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <svg className="mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            
            {/* Search Bar */}
            <div className="search-container">
              <form onSubmit={handleSearch} className="search-form">
                <div className={`search-input-wrapper ${isSearchFocused ? 'focused' : ''}`}>
                  <input
                    type="text"
                    placeholder="Search laptops (e.g., Gaming Beast, i7, RTX, 16GB...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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

            <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
              <Link href="/" className="nav-link" onClick={closeMobileMenu}>
                Home
              </Link>
              <Link href="/products" className="nav-link" onClick={closeMobileMenu}>
                Products
              </Link>

              {/* Profile Avatar with Dropdown */}
              <div className="profile-container" ref={profileRef}>
                <button 
                  className={`profile-avatar ${user ? 'logged-in' : 'logged-out'}`}
                  onClick={toggleProfile}
                  style={{
                    background: user && user.role === 'admin' ? '#dc2626' : '#3b82f6'
                  }}
                  title={user ? user.name : "Profile"}
                >
                  {getInitial()}
                </button>
                
                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="profile-dropdown">
                    {!user ? (
                      // Not logged in state
                      <div className="profile-dropdown-guest">
                        <div className="dropdown-header">
                          <div className="dropdown-title">Welcome!</div>
                          <div className="dropdown-subtitle">Sign in to access your account</div>
                        </div>
                        
                        <div className="dropdown-divider"></div>
                        
                        <button 
                          className="dropdown-item"
                          onClick={() => handleNavigation('/auth/login')}
                        >
                          <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          User Login
                        </button>
                        
                        <button 
                          className="dropdown-item admin-item"
                          onClick={() => handleNavigation('/auth/admin/main')}
                        >
                          <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Admin Login
                        </button>
                        
                        <button 
                          className="dropdown-item"
                          onClick={() => handleNavigation('/auth/register')}
                        >
                          <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Create Account
                        </button>
                      </div>
                    ) : (
                      // Logged in state
                      <div className="profile-dropdown-user">
                        {/* User Info */}
                        <div className="profile-header">
                          <div 
                            className="profile-dropdown-avatar"
                            style={{
                              background: user.role === 'admin' ? '#dc2626' : '#3b82f6'
                            }}
                          >
                            {getInitial()}
                          </div>
                          <div className="profile-info">
                            <div className="profile-name">{user.name}</div>
                            <div className="profile-email">{user.email}</div>
                            <div className="profile-role">
                              <span className={`role-badge ${user.role}`}>
                                {user.role === 'admin' ? '🔥 Administrator' : '👤 Customer'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="dropdown-divider"></div>
                        
                        {/* Cart */}
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            if (user?.role === 'admin') {
                              handleNavigation('/carts');
                            } else if (user) {
                              handleNavigation('/cart');
                            } else {
                              handleNavigation('/auth/login');
                            }
                          }}
                        >
                          <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          My Cart
                          {cartCount > 0 && (
                            <span className="cart-badge-dropdown">{cartCount}</span>
                          )}
                        </button>
                        
                        {/* Menu Items */}
                        <button 
                          className="dropdown-item"
                          onClick={() => handleNavigation('/profile')}
                        >
                          <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {user.role === 'admin' ? '👨‍💻 System Admin' : '👤 My Profile'}
                        </button>

                        <button 
                          className="dropdown-item"
                          onClick={() => handleNavigation(user.role === 'admin' ? '/order' : '/orders')}
                        >
                          <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          {user.role === 'admin' ? '📦 Order Management' : '📦 My Orders'}
                        </button>

                        {/* 🔥 NEW ADMIN CUSTOMER MANAGEMENT */}
                        {user.role === 'admin' && (
                          <button 
                            className="dropdown-item admin-item"
                            onClick={() => handleNavigation('/admin/customers')}
                          >
                            <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            👥 Customer Management
                          </button>
                        )}

                        {user.role === 'admin' && (
                          <button 
                            className="dropdown-item admin-item"
                            onClick={() => handleNavigation('/auth/admin/main')}
                          >
                            <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            🛠️ Admin Dashboard
                          </button>
                        )}

                        <div className="dropdown-divider"></div>

                        {/* Logout */}
                        <button 
                          className="dropdown-item logout-item"
                          onClick={handleLogout}
                        >
                          <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          🚪 Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
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

      <style jsx>{`
        .cart-badge-dropdown {
          background: #dc2626;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          margin-left: auto;
        }
      `}</style>
    </div>
  );
}