'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Authentic technical vector icons (Apple Silicon logo, RTX Gaming, Featherweight Ultrabook, CAD Studio Workstation)
const renderCategoryIcon = (key, size = 18) => {
  switch (key) {
    case 'apple':
      return (
        <svg viewBox="0 0 170 170" width={size} height={size} fill="currentColor" aria-label="Apple Silicon">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.85-11.7-14.44-6.41-10.23-11.45-21.72-15.11-34.46-3.66-12.74-5.5-24.87-5.5-36.4 0-14.77 3.75-27.13 11.25-37.07 7.5-9.94 17.06-15.02 28.68-15.24 4.58 0 9.87 1.25 15.86 3.76 5.99 2.5 10.02 3.82 12.09 3.96 2.08-.14 6.33-1.46 12.74-3.96 6.42-2.51 11.48-3.71 15.18-3.61 10.74.54 19.49 4.35 26.24 11.43 6.75 7.08 10.97 15.68 12.67 25.8-9.46 5.76-14.1 13.91-13.91 24.45.2 8.7 3.53 16.03 10 22 6.47 5.97 14.18 9.35 23.13 10.14-2.28 6.96-5.06 13.99-8.34 21.09zM119.22 31.84c0-7.72 2.76-14.93 8.28-21.64 5.52-6.71 12.28-10.79 20.28-12.24.2 1.3.31 2.39.31 3.26 0 7.72-2.87 15.03-8.61 21.94-5.74 6.9-12.65 10.84-20.73 11.81-.31-1.09-.47-2.14-.47-3.13z"/>
        </svg>
      );
    case 'gaming':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="RTX Gaming">
          <rect x="2" y="6" width="20" height="12" rx="5" />
          <path d="M6 12h4m-2-2v4m9-2h.01m-2.5-2h.01m0 4h.01" strokeWidth="2.5" />
        </svg>
      );
    case 'ultrabook':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Executive Ultrabook">
          <rect x="4" y="4" width="16" height="11" rx="2" />
          <path d="M2 19h20M9 19v1a1 1 0 001 1h4a1 1 0 001-1v-1" />
        </svg>
      );
    case 'workstation':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Pro Workstation">
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <path d="M9 9h6v6H9z" />
          <path d="M9 1v4m6-4v4m-6 14v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4" />
        </svg>
      );
    default:
      return null;
  }
};

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaCategory, setActiveMegaCategory] = useState(0);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const profileRef = useRef(null);
  const megaMenuRef = useRef(null);
  const vipModalRef = useRef(null);
  const searchInputRef = useRef(null);
  const lastScrollY = useRef(0);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Scroll detection: elevation + smart hide on scroll down, show on scroll up
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Elevated appearance
          setIsScrolled(currentScrollY > 15);

          // Top boundary: always show when near top of the page
          if (currentScrollY <= 60) {
            setIsVisible(true);
          } else if (currentScrollY > lastScrollY.current && currentScrollY > 90) {
            // Scrolling DOWN -> hide navbar (unless user has an active open menu)
            if (!isMegaMenuOpen && !isProfileOpen && !isSearchOpen && !isMobileMenuOpen) {
              setIsVisible(false);
            }
          } else if (currentScrollY < lastScrollY.current - 4) {
            // Scrolling UP -> reveal navbar smoothly
            setIsVisible(true);
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMegaMenuOpen, isProfileOpen, isSearchOpen, isMobileMenuOpen]);

  // Sync Cart Count
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const items = JSON.parse(savedCart);
          const count = Array.isArray(items) ? items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
          setCartCount(count);
        } else {
          setCartCount(0);
        }
      } catch {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target)) {
        setIsMegaMenuOpen(false);
      }
      if (vipModalRef.current && !vipModalRef.current.contains(e.target)) {
        setIsVipModalOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when toggled
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
    setIsMegaMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const megaCategories = [
    {
      title: 'Gaming Beasts',
      tag: 'RTX 40-Series',
      subtitle: 'Liquid Metal • 240Hz QHD+ Displays',
      description: 'Ultra high-refresh QHD displays, liquid metal vapor cooling, and Intel Core i9 / AMD Ryzen 9 silicon tuned for competitive esports.',
      filter: 'category=Gaming',
      iconKey: 'gaming',
      specs: ['RTX 4090 / 4080', 'Up to 240Hz G-Sync', '64GB DDR5 Ready', 'Same-Day Dubai Delivery']
    },
    {
      title: 'Apple MacBooks',
      tag: 'M3 Pro & Max',
      subtitle: 'Apple Silicon • Liquid Retina XDR',
      description: 'Revolutionary energy efficiency, Liquid Retina XDR displays, and unified memory bandwidth for video editors and developers.',
      filter: 'brand=Apple',
      iconKey: 'apple',
      specs: ['Up to 22h Battery', '120Hz ProMotion XDR', '128GB Unified Memory', 'Apple UAE Warranty']
    },
    {
      title: 'Executive Ultrabooks',
      tag: 'Under 1.2kg Chassis',
      subtitle: 'Intel Core Ultra NPU • OLED 2.8K',
      description: 'Military-spec magnesium chassis, OLED touch displays, Intel Core Ultra NPU processors, and biometric security for corporate leadership.',
      filter: 'category=Ultrabook',
      iconKey: 'ultrabook',
      specs: ['OLED 2.8K Touch', 'Intel AI Boost NPU', 'Thunderbolt 4 Ports', 'All-Day Mobility']
    },
    {
      title: 'Pro Workstations',
      tag: 'CAD & 3D Studio',
      subtitle: 'ISV Certified • NVIDIA RTX Ada',
      description: 'ISV-certified architectural platforms with ECC memory, dual NVMe slots, and dedicated NVIDIA RTX Ada Generation graphics.',
      filter: 'category=Workstation',
      iconKey: 'workstation',
      specs: ['ECC Error-Correcting', 'NVIDIA Studio Drivers', 'Multi-Display 8K Out', 'VIP Studio Support']
    }
  ];

  const activeCategoryData = megaCategories[activeMegaCategory] || megaCategories[0];

  return (
    <header className={`navbar-header-root ${isScrolled ? 'is-scrolled' : ''} ${!isVisible ? 'is-hidden' : ''} ${isMobileMenuOpen ? 'menu-open' : ''}`}>
      <div className="navbar-pill-container">
        {/* Main Floating Pill Navigation Bar */}
        <nav className="nav-pill" aria-label="Main Navigation">
          {/* Brand Logo */}
          <Link href="/" className="nav-brand" aria-label="Al Mukammal Home">
            <div className="brand-logo-frame">
              <img
                src="/logo-mark.png"
                alt="Al Mukammal"
                className="brand-logo-img"
              />
            </div>
            <div className="brand-text">
              <span className="brand-name">AL MUKAMMAL</span>
              <span className="brand-sub">COMPUTERS & REQUISITES TRADING L.L.C</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="nav-links-desktop">
            <Link
              href="/products"
              className={`nav-link-item ${pathname === '/products' ? 'is-active' : ''}`}
            >
              All Laptops
            </Link>

            <Link
              href="/track"
              className={`nav-link-item ${pathname?.startsWith('/track') ? 'is-active' : ''}`}
            >
              Track Order
            </Link>

            {/* Mega Menu Trigger */}
            <div
              className="mega-menu-trigger-wrapper"
              ref={megaMenuRef}
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <button
                type="button"
                className={`nav-link-item mega-btn ${isMegaMenuOpen ? 'is-open' : ''}`}
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                aria-expanded={isMegaMenuOpen}
              >
                <span>Categories</span>
                <svg
                  className={`chevron-icon ${isMegaMenuOpen ? 'rotate' : ''}`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Mega Menu Floating Surface */}
              {isMegaMenuOpen && (
                <div className="mega-menu-dropdown" role="menu">
                  <div className="mega-menu-inner">
                    {/* LEFT COLUMN: Categories Selector List */}
                    <div className="mega-left-col">
                      <div className="mega-col-header">
                        <span>SELECT PERFORMANCE TIER</span>
                      </div>
                      <div className="mega-list">
                        {megaCategories.map((cat, idx) => (
                          <div
                            key={idx}
                            className={`mega-item-row ${activeMegaCategory === idx ? 'is-selected' : ''}`}
                            onMouseEnter={() => setActiveMegaCategory(idx)}
                            onClick={() => {
                              router.push(`/products?${cat.filter}`);
                              setIsMegaMenuOpen(false);
                            }}
                          >
                            <span className="mega-item-icon-box">
                              {renderCategoryIcon(cat.iconKey, 18)}
                            </span>
                            <div className="mega-item-text">
                              <span className="mega-item-title">{cat.title}</span>
                              <span className="mega-item-tag">{cat.tag}</span>
                            </div>
                            <span className="mega-item-arrow">→</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Contextual Dynamic Preview */}
                    <div className="mega-right-col">
                      <div className="mega-preview-card">
                        <div className="mega-preview-badge">
                          <span>{activeCategoryData.tag}</span>
                        </div>
                        <div className="mega-preview-header-wrap">
                          <span className="mega-preview-icon-chip">
                            {renderCategoryIcon(activeCategoryData.iconKey, 20)}
                          </span>
                          <h4 className="mega-preview-title">{activeCategoryData.title}</h4>
                        </div>
                        <p className="mega-preview-desc">{activeCategoryData.description}</p>

                        <div className="mega-specs-grid">
                          {activeCategoryData.specs.map((spec, sIdx) => (
                            <div key={sIdx} className="mega-spec-chip">
                              <span className="spec-dot" />
                              <span>{spec}</span>
                            </div>
                          ))}
                        </div>

                        <Link
                          href={`/products?${activeCategoryData.filter}`}
                          className="mega-preview-cta"
                          onClick={() => setIsMegaMenuOpen(false)}
                        >
                          <span>Explore {activeCategoryData.title}</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/orders"
              className={`nav-link-item ${pathname === '/orders' ? 'is-active' : ''}`}
            >
              Track Order
            </Link>

            <div className="vip-desk-wrapper" ref={vipModalRef}>
              <button
                type="button"
                onClick={() => setIsVipModalOpen(!isVipModalOpen)}
                className={`nav-link-item concierge-pill ${isVipModalOpen ? 'is-open' : ''}`}
                aria-expanded={isVipModalOpen}
                aria-label="Dubai VIP Desk & Showroom Live Location"
              >
                <span className="pulse-dot" />
                <span>Dubai VIP Desk</span>
              </button>

              {/* VIP Desk & Showroom Live Location Popover */}
              {isVipModalOpen && (
                <div className="vip-desk-popover">
                  <div className="vip-popover-header">
                    <div className="vip-header-badge">
                      <span className="pulse-dot-green" />
                      <span>DUBAI VIP DESK • LIVE NOW</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVipModalOpen(false)}
                      className="vip-close-btn"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <h3 className="vip-popover-title">
                    Live Showroom Location &amp; VIP Consultation
                  </h3>
                  <p className="vip-popover-desc">
                    Connect directly with our hardware specialists on WhatsApp or navigate straight to our flagship Dubai showroom.
                  </p>

                  <div className="vip-actions-grid">
                    {/* Primary WhatsApp Live Location Pin Action */}
                    <a
                      href="https://wa.me/971509550121?text=Hello%20ALMUKAMMAL%20Team,%20please%20send%20me%20your%20Dubai%20Showroom%20live%20location%20pin%20and%20laptop%20consultation"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vip-action-btn whatsapp-action"
                    >
                      <div className="vip-btn-icon-box wa-box">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z" />
                        </svg>
                      </div>
                      <div className="vip-btn-content">
                        <span className="vip-btn-title">Chat on WhatsApp</span>
                        <span className="vip-btn-subtitle">Request Showroom Live Location Pin &amp; Advice</span>
                      </div>
                      <span className="vip-arrow">→</span>
                    </a>

                    {/* Google Maps Showroom Directions */}
                    <a
                      href="https://maps.google.com/?q=Al+Mukammal+Computer+Trading+LLC+Deira+Dubai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vip-action-btn maps-action"
                    >
                      <div className="vip-btn-icon-box maps-box">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                      </div>
                      <div className="vip-btn-content">
                        <span className="vip-btn-title">Open in Google Maps</span>
                        <span className="vip-btn-subtitle">Turn-by-turn navigation to Deira Showroom</span>
                      </div>
                      <span className="vip-arrow">→</span>
                    </a>
                  </div>

                  {/* Showroom Meta Card */}
                  <div className="vip-showroom-card">
                    <div className="vip-thumb-wrap">
                      <img
                        src="/showroom-dubai.jpg"
                        alt="ALMUKAMMAL Dubai Showroom"
                        className="vip-thumb-img"
                      />
                    </div>
                    <div className="vip-showroom-details">
                      <div className="vip-loc-name">
                        📍 Deira Computer Market, Near Sabkha &amp; Naif, Dubai
                      </div>
                      <div className="vip-timing">
                        🕒 Mon–Sat: 09:00 AM – 10:00 PM • Sun: 04:00 PM – 10:00 PM
                      </div>
                      <div className="vip-phone">
                        📞 Direct Line: <a href="tel:+971509550121">+971 50 955 0121</a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="nav-actions">
            {/* Search Trigger */}
            <button
              type="button"
              className="action-icon-btn"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Toggle Search"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            {/* Shopping Cart Link & Pill Badge */}
            <Link href="/cart" className="cart-pill-link" aria-label="View Shopping Cart">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartCount > 0 && <span className="cart-counter-badge">{cartCount}</span>}
            </Link>

            {/* User Profile Dropdown */}
            <div className="profile-dropdown-wrapper" ref={profileRef}>
              {user ? (
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="user-avatar-btn"
                  aria-label="User Account Menu"
                >
                  <span className="avatar-initials">
                    {(user.name || 'User').charAt(0).toUpperCase()}
                  </span>
                </button>
              ) : (
                <Link href="/auth/login" className="login-pill-btn" aria-label="Sign In">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                  </svg>
                  <span>Sign In</span>
                </Link>
              )}

              {/* Profile Dropdown Menu */}
              {isProfileOpen && user && (
                <div className="profile-menu-dropdown" role="menu" aria-label="User Account Menu">
                  {/* User Profile Header Card */}
                  <div className="profile-user-card">
                    <div className="profile-avatar-badge">
                      <span>{(user.name || 'User').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="profile-user-meta">
                      <span className="profile-display-name">{user.name || 'Al Mukammal Member'}</span>
                      <span className="profile-display-email">{user.email}</span>
                      <div className={`profile-role-chip ${user.role === 'admin' ? 'role-chip-admin' : 'role-chip-customer'}`}>
                        <span className="role-pulse-dot" />
                        <span>{user.role === 'admin' ? 'Verified Administrator' : 'Valued Customer'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-menu-divider" />

                  {/* Navigation Links Group */}
                  <div className="profile-links-list">
                    <Link
                      href="/profile"
                      className="profile-nav-link"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <div className="profile-icon-box">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div className="profile-link-content">
                        <span className="link-title">My Profile &amp; Address</span>
                        <span className="link-desc">Manage account &amp; UAE address</span>
                      </div>
                      <span className="profile-link-arrow">→</span>
                    </Link>

                    <Link
                      href="/orders"
                      className="profile-nav-link"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <div className="profile-icon-box">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                      </div>
                      <div className="profile-link-content">
                        <span className="link-title">Order History</span>
                        <span className="link-desc">Track active &amp; past deliveries</span>
                      </div>
                      <span className="profile-link-arrow">→</span>
                    </Link>

                    <Link
                      href="/track"
                      className="profile-nav-link"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <div className="profile-icon-box">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                        </svg>
                      </div>
                      <div className="profile-link-content">
                        <span className="link-title">Track Any Order</span>
                        <span className="link-desc">Live dispatch &amp; courier radar</span>
                      </div>
                      <span className="profile-link-arrow">→</span>
                    </Link>

                    {user.role === 'delivery_partner' && (
                      <Link
                        href="/delivery"
                        className="profile-nav-link"
                        style={{ borderLeft: '3px solid #10b981' }}
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <div className="profile-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        </div>
                        <div className="profile-link-content">
                          <span className="link-title" style={{ color: '#059669', fontWeight: 700 }}>Driver Delivery Portal</span>
                          <span className="link-desc">Assigned runs &amp; GPS console</span>
                        </div>
                        <span className="profile-link-arrow">→</span>
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <>
                        <Link
                          href="/admin/logistics"
                          className="profile-nav-link admin-nav-link"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <div className="profile-icon-box icon-box-admin" style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <rect x="1" y="3" width="15" height="13" />
                              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                              <circle cx="5.5" cy="18.5" r="2.5" />
                              <circle cx="18.5" cy="18.5" r="2.5" />
                            </svg>
                          </div>
                          <div className="profile-link-content">
                            <span className="link-title" style={{ color: '#2563eb' }}>Fleet Logistics Hub</span>
                            <span className="link-desc">Live dispatch &amp; couriers</span>
                          </div>
                          <span className="profile-link-arrow">→</span>
                        </Link>

                        <Link
                          href="/auth/admin/main"
                          className="profile-nav-link admin-nav-link"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <div className="profile-icon-box icon-box-admin">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                          </div>
                          <div className="profile-link-content">
                            <span className="link-title link-title-admin">Admin Command Center</span>
                            <span className="link-desc">Catalog, stock &amp; orders</span>
                          </div>
                          <span className="profile-link-arrow">→</span>
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="profile-menu-divider" />

                  {/* Sign Out Button */}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                      router.push('/');
                    }}
                    className="profile-logout-btn"
                  >
                    <div className="logout-icon-box">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </div>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Mobile Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                {isMobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Expandable Inline Search Bar */}
        {isSearchOpen && (
          <div className="search-bar-expand">
            <form onSubmit={handleSearch} className="search-form">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9BA1A6" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search models, GPUs (e.g. RTX 4080, M3 Max, OLED)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-submit-pill">
                Search
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="search-close-btn"
                aria-label="Close search"
              >
                ✕
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation Drawer Sheet */}
        {isMobileMenuOpen && (
          <div className="mobile-drawer-sheet">
            <div className="mobile-drawer-inner">
              {/* Primary Direct Catalog Link */}
              <Link
                href="/products"
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="drawer-icon-bubble">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </span>
                <div className="drawer-link-text-wrap">
                  <span className="drawer-primary-text">All Laptops Catalog</span>
                  <span className="drawer-secondary-text">Browse complete UAE showroom stock</span>
                </div>
                <span className="drawer-chevron">→</span>
              </Link>

              {/* Categorized Performance Section */}
              <div className="mobile-categories-group">
                <div className="mobile-group-heading">
                  <span className="mobile-group-title">PERFORMANCE CLASSIFICATIONS</span>
                  <span className="mobile-group-badge">SELECT TIER</span>
                </div>

                <div className="mobile-category-cards-grid">
                  {megaCategories.map((cat, idx) => (
                    <Link
                      key={idx}
                      href={`/products?${cat.filter}`}
                      className="mobile-category-item"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className={`mobile-cat-icon-frame cat-${cat.iconKey}`}>
                        {renderCategoryIcon(cat.iconKey, 20)}
                      </div>
                      <div className="mobile-cat-details">
                        <div className="mobile-cat-headline">
                          <span className="mobile-cat-name">{cat.title}</span>
                          <span className="mobile-cat-tag-pill">{cat.tag}</span>
                        </div>
                        <span className="mobile-cat-subtext">{cat.subtitle}</span>
                      </div>
                      <span className="mobile-cat-arrow-cue">→</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Order Tracking */}
              <Link
                href="/orders"
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="drawer-icon-bubble">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </span>
                <div className="drawer-link-text-wrap">
                  <span className="drawer-primary-text">Track Your Order</span>
                  <span className="drawer-secondary-text">Live courier & delivery status</span>
                </div>
                <span className="drawer-chevron">→</span>
              </Link>

              {/* VIP Concierge WhatsApp with Live Showroom Location */}
              <a
                href="https://wa.me/971509550121?text=Hello%20ALMUKAMMAL%20Team,%20please%20send%20me%20your%20Dubai%20Showroom%20live%20location%20pin%20and%20laptop%20consultation"
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-nav-link mobile-whatsapp-card"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="drawer-icon-bubble whatsapp-bubble">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z" />
                  </svg>
                </span>
                <div className="drawer-link-text-wrap">
                  <div className="whatsapp-title-row">
                    <span className="drawer-primary-text whatsapp-text">WhatsApp VIP Desk</span>
                    <span className="live-status-badge">ONLINE</span>
                  </div>
                  <span className="drawer-secondary-text">Request Live Location Pin &amp; Advice</span>
                </div>
                <span className="drawer-chevron">→</span>
              </a>

              {/* Showroom Directions */}
              <a
                href="https://maps.google.com/?q=Al+Mukammal+Computer+Trading+LLC+Deira+Dubai"
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="drawer-icon-bubble">📍</span>
                <div className="drawer-link-text-wrap">
                  <span className="drawer-primary-text">Dubai Showroom (Google Maps)</span>
                  <span className="drawer-secondary-text">Deira Computer Market Directions</span>
                </div>
                <span className="drawer-chevron">→</span>
              </a>

              {/* User Account / Auth Section */}
              {user ? (
                <div className="mobile-drawer-auth-box">
                  <Link
                    href="/profile"
                    className="mobile-nav-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="drawer-icon-bubble user-bubble">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                    <div className="drawer-link-text-wrap">
                      <span className="drawer-primary-text">{user.name || 'My Profile'}</span>
                      <span className="drawer-secondary-text">{user.email}</span>
                    </div>
                    <span className="drawer-chevron">→</span>
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      href="/auth/admin/main"
                      className="mobile-nav-link admin-card-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="drawer-icon-bubble admin-bubble">⚡</span>
                      <div className="drawer-link-text-wrap">
                        <span className="drawer-primary-text admin-text">Admin Command Center</span>
                        <span className="drawer-secondary-text">Catalog &amp; Order Operations</span>
                      </div>
                      <span className="drawer-chevron">→</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                      router.push('/');
                    }}
                    className="mobile-signout-btn"
                  >
                    <span>Sign Out ({user.name})</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="mobile-login-drawer-btn"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                  </svg>
                  <span>Sign In / Create Account</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .navbar-header-root {
          position: sticky;
          top: 14px;
          left: 0;
          right: 0;
          z-index: 1000;
          width: 100%;
          padding: 0 16px;
          pointer-events: none; /* Allows clicks around the pill */
          transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
        }

        .navbar-header-root.is-hidden {
          transform: translateY(-135%);
          opacity: 0;
          pointer-events: none;
        }

        .navbar-header-root.menu-open {
          z-index: 10005 !important;
          pointer-events: auto !important;
        }

        .navbar-pill-container {
          max-width: var(--max-width-site, 1280px);
          margin: 0 auto;
          position: relative;
          pointer-events: auto;
        }

        /* The Signature Charcoal Rounded Pill */
        .nav-pill {
          background: rgba(11, 11, 13, 0.94);
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: var(--radius-full, 9999px);
          padding: 8px 30px 8px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 20px 48px -10px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .is-scrolled .nav-pill {
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 24px 52px -6px rgba(0, 0, 0, 0.6);
        }

        /* Brand (Enlarged and Enhanced) */
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #ffffff !important;
          flex-shrink: 0;
        }

        .brand-logo-frame {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #0B0B0D;
          border: 1.5px solid rgba(8, 102, 255, 0.45);
          box-shadow: 0 4px 16px rgba(8, 102, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .nav-brand:hover .brand-logo-frame {
          transform: scale(1.06);
          box-shadow: 0 6px 22px rgba(8, 102, 255, 0.65);
          border-color: #2B8CFF;
        }

        .brand-logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-name {
          font-size: 1.08rem;
          font-weight: 900;
          letter-spacing: 0.035em;
          color: #ffffff !important;
          line-height: 1.1;
          white-space: nowrap;
        }

        .brand-sub {
          font-size: 0.64rem;
          letter-spacing: 0.08em;
          color: #A1A7B0;
          font-weight: 700;
          margin-top: 1px;
        }

        /* Desktop Nav Links */
        .nav-links-desktop {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-link-item {
          color: #F3F4F6 !important;
          font-size: 0.92rem;
          font-weight: 650;
          padding: 8px 18px;
          border-radius: var(--radius-full, 9999px);
          text-decoration: none !important;
          transition: color 0.15s, background-color 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .nav-link-item span {
          color: inherit !important;
        }

        .nav-link-item:hover,
        .nav-link-item.is-active {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.12);
        }

        .mega-btn {
          font-family: inherit;
        }

        .chevron-icon {
          color: #E5E7EB;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .chevron-icon.rotate {
          transform: rotate(180deg);
        }

        .concierge-pill {
          background: rgba(8, 102, 255, 0.15) !important;
          border: 1.5px solid rgba(8, 102, 255, 0.45) !important;
          color: #93c5fd !important;
          font-weight: 700;
          font-size: 0.88rem;
          padding: 8px 18px;
        }

        .concierge-pill:hover {
          background: #0866FF !important;
          border-color: #0866FF !important;
          color: #ffffff !important;
          box-shadow: 0 4px 16px rgba(8, 102, 255, 0.45);
          transform: translateY(-1px);
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 10px #10B981;
        }

        .pulse-dot-green {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 8px #10B981;
          display: inline-block;
        }

        .vip-desk-wrapper {
          position: relative;
        }

        .vip-desk-popover {
          position: absolute;
          top: calc(100% + 14px);
          right: -40px;
          width: 440px;
          max-width: 90vw;
          background: #0B0B0D;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 24px;
          padding: 22px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(8, 102, 255, 0.25);
          backdrop-filter: blur(28px);
          animation: vipEnter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 1000;
          text-align: left;
        }

        @keyframes vipEnter {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .vip-popover-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .vip-header-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 0.72rem;
          font-weight: 850;
          color: #10B981;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 4px 10px;
          border-radius: 9999px;
        }

        .vip-close-btn {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: #94A3B8;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.15s;
        }

        .vip-close-btn:hover {
          background: rgba(255, 255, 255, 0.16);
          color: #ffffff;
        }

        .vip-popover-title {
          font-size: 1.15rem;
          font-weight: 850;
          color: #ffffff;
          margin: 0 0 6px 0;
          letter-spacing: -0.01em;
        }

        .vip-popover-desc {
          font-size: 0.82rem;
          color: #94A3B8;
          line-height: 1.45;
          margin: 0 0 16px 0;
        }

        .vip-actions-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
        }

        .vip-action-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 16px;
          background: #151922;
          border: 1px solid rgba(255, 255, 255, 0.08);
          text-decoration: none;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .vip-action-btn:hover {
          background: #1A2234;
          border-color: #0866FF;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(8, 102, 255, 0.25);
        }

        .vip-btn-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .wa-box {
          background: #25D366;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35);
        }

        .maps-box {
          background: #0866FF;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(8, 102, 255, 0.35);
        }

        .vip-btn-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .vip-btn-title {
          font-size: 0.92rem;
          font-weight: 750;
          color: #ffffff;
        }

        .vip-btn-subtitle {
          font-size: 0.74rem;
          color: #94A3B8;
        }

        .vip-arrow {
          color: #64748B;
          font-size: 1.1rem;
          font-weight: 700;
          transition: transform 0.15s, color 0.15s;
        }

        .vip-action-btn:hover .vip-arrow {
          color: #0866FF;
          transform: translateX(3px);
        }

        .vip-showroom-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 12px;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .vip-thumb-wrap {
          width: 68px;
          height: 68px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .vip-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .vip-showroom-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .vip-loc-name {
          font-size: 0.78rem;
          font-weight: 750;
          color: #E2E8F0;
          line-height: 1.35;
        }

        .vip-timing {
          font-size: 0.72rem;
          color: #94A3B8;
        }

        .vip-phone {
          font-size: 0.73rem;
          color: #38BDF8;
          font-weight: 700;
        }

        .vip-phone a {
          color: inherit;
          text-decoration: underline;
        }

        /* Mega Menu Dropdown */
        .mega-menu-trigger-wrapper {
          position: relative;
        }

        .mega-menu-dropdown {
          position: absolute;
          top: calc(100% + 14px);
          left: 50%;
          transform: translateX(-50%);
          width: 760px;
          background: #0B0B0D;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 24px 56px -12px rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(24px);
          animation: megaEnter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          color: #ffffff;
        }

        @keyframes megaEnter {
          from {
            opacity: 0;
            transform: translate(-50%, 8px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .mega-menu-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .mega-left-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mega-col-header {
          font-size: 0.7rem;
          font-weight: 700;
          color: #9BA1A6;
          letter-spacing: 0.08em;
          padding: 0 8px 6px;
        }

        .mega-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mega-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s;
          border: 1px solid transparent;
        }

        .mega-item-row:hover,
        .mega-item-row.is-selected {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .mega-item-row.is-selected {
          border-color: rgba(8, 102, 255, 0.35);
          background: rgba(8, 102, 255, 0.08);
        }

        .mega-item-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #93C5FD;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }

        .mega-item-row:hover .mega-item-icon-box,
        .mega-item-row.is-selected .mega-item-icon-box {
          background: rgba(8, 102, 255, 0.2);
          border-color: rgba(8, 102, 255, 0.45);
          color: #ffffff;
        }

        .mega-preview-header-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .mega-preview-icon-chip {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(8, 102, 255, 0.15);
          border: 1px solid rgba(8, 102, 255, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #93C5FD;
          flex-shrink: 0;
        }

        .mega-item-text {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .mega-item-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #ffffff;
        }

        .mega-item-tag {
          font-size: 0.725rem;
          color: #9BA1A6;
        }

        .mega-item-arrow {
          font-size: 0.85rem;
          color: #0866FF;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.15s, transform 0.15s;
        }

        .mega-item-row.is-selected .mega-item-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* Right Preview Panel */
        .mega-right-col {
          background: #14161A;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 18px;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }

        .mega-preview-badge span {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #0866FF;
          background: rgba(8, 102, 255, 0.12);
          padding: 3px 10px;
          border-radius: 9999px;
          border: 1px solid rgba(8, 102, 255, 0.25);
          margin-bottom: 10px;
        }

        .mega-preview-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 8px 0;
        }

        .mega-preview-desc {
          font-size: 0.825rem;
          line-height: 1.5;
          color: #9BA1A6;
          margin: 0 0 16px 0;
        }

        .mega-specs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 20px;
        }

        .mega-spec-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.725rem;
          color: #E5E7EB;
          background: rgba(255, 255, 255, 0.04);
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .spec-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #0866FF;
          flex-shrink: 0;
        }

        .mega-preview-cta {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 9999px;
          background: #0866FF;
          color: #ffffff;
          font-size: 0.825rem;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.15s, transform 0.15s;
        }

        .mega-preview-cta:hover {
          background: #0756D6;
          transform: translateY(-1px);
        }

        /* Right Nav Actions */
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .action-icon-btn,
        :global(.cart-pill-link) {
          width: 42px !important;
          height: 42px !important;
          border-radius: 50% !important;
          background: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.16) !important;
          color: #F3F4F6 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          text-decoration: none !important;
          position: relative !important;
          flex-shrink: 0 !important;
          transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s !important;
        }

        .action-icon-btn:hover,
        :global(.cart-pill-link:hover) {
          background: rgba(255, 255, 255, 0.18) !important;
          border-color: rgba(255, 255, 255, 0.32) !important;
          color: #ffffff !important;
          transform: translateY(-1px) !important;
        }

        .cart-counter-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #0866FF;
          color: #ffffff;
          font-size: 0.675rem;
          font-weight: 800;
          min-width: 20px;
          height: 20px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #0B0B0D;
        }

        .user-avatar-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0866FF 0%, #2B8CFF 100%);
          border: 2px solid rgba(255, 255, 255, 0.28);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          box-shadow: 0 4px 14px rgba(8, 102, 255, 0.4);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .user-avatar-btn:hover {
          transform: scale(1.06);
          box-shadow: 0 6px 20px rgba(8, 102, 255, 0.6);
        }

        :global(.login-pill-btn) {
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 9px 20px !important;
          border-radius: 9999px !important;
          background: linear-gradient(135deg, #0866FF 0%, #2B8CFF 100%) !important;
          color: #ffffff !important;
          font-size: 0.88rem !important;
          font-weight: 750 !important;
          text-decoration: none !important;
          box-shadow: 0 4px 14px rgba(8, 102, 255, 0.4) !important;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s !important;
          flex-shrink: 0 !important;
          margin-left: 6px !important;
        }

        :global(.login-pill-btn:hover) {
          background: linear-gradient(135deg, #0756D6 0%, #1A75FF 100%) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 6px 20px rgba(8, 102, 255, 0.55) !important;
        }

        :global(.login-pill-btn span) {
          color: #ffffff !important;
        }

        .avatar-initials {
          font-size: 0.95rem;
          font-weight: 850;
          color: #ffffff;
        }

        /* Profile Dropdown */
        .profile-dropdown-wrapper {
          position: relative;
        }

        .profile-menu-dropdown {
          position: absolute;
          top: calc(100% + 14px);
          right: 0;
          width: 310px;
          background: rgba(14, 15, 19, 0.96);
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 24px;
          padding: 16px;
          box-shadow: 0 24px 60px -10px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(8, 102, 255, 0.18);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          animation: profileEnter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 1010;
        }

        @keyframes profileEnter {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Profile Header User Card */
        .profile-user-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 8px;
        }

        .profile-avatar-badge {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0866FF 0%, #2B8CFF 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
          font-weight: 850;
          color: #ffffff;
          flex-shrink: 0;
          border: 2px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 4px 14px rgba(8, 102, 255, 0.4);
        }

        .profile-user-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .profile-display-name {
          font-size: 0.95rem;
          font-weight: 800;
          color: #ffffff !important;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-display-email {
          font-size: 0.76rem;
          color: #9BA1A6 !important;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 1px;
        }

        .profile-role-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.68rem;
          font-weight: 750;
          padding: 3px 9px;
          border-radius: 9999px;
          margin-top: 6px;
          width: fit-content;
          letter-spacing: 0.04em;
        }

        .role-chip-admin {
          background: rgba(8, 102, 255, 0.16);
          color: #60a5fa !important;
          border: 1px solid rgba(8, 102, 255, 0.35);
        }

        .role-chip-customer {
          background: rgba(16, 185, 129, 0.14);
          color: #34d399 !important;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .role-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 8px currentColor;
        }

        .profile-menu-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 10px 0;
        }

        .profile-links-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* Profile Nav Links with :global support for Next.js <Link> */
        .profile-menu-dropdown :global(.profile-nav-link),
        .profile-nav-link {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          padding: 10px 12px !important;
          border-radius: 14px !important;
          color: #F3F4F6 !important;
          text-decoration: none !important;
          background: transparent !important;
          border: 1px solid transparent !important;
          width: 100% !important;
          box-sizing: border-box !important;
          cursor: pointer !important;
          transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease !important;
        }

        .profile-menu-dropdown :global(.profile-nav-link:hover),
        .profile-nav-link:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          transform: translateX(2px) !important;
          color: #ffffff !important;
        }

        .profile-menu-dropdown :global(.profile-nav-link.admin-nav-link),
        .profile-nav-link.admin-nav-link {
          background: rgba(8, 102, 255, 0.08) !important;
          border-color: rgba(8, 102, 255, 0.25) !important;
        }

        .profile-menu-dropdown :global(.profile-nav-link.admin-nav-link:hover),
        .profile-nav-link.admin-nav-link:hover {
          background: rgba(8, 102, 255, 0.16) !important;
          border-color: #0866FF !important;
        }

        .profile-menu-dropdown :global(.profile-icon-box),
        .profile-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #9BA1A6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: color 0.15s, background 0.15s, border-color 0.15s;
        }

        .profile-menu-dropdown :global(.profile-nav-link:hover .profile-icon-box),
        .profile-nav-link:hover .profile-icon-box {
          color: #60a5fa;
          background: rgba(8, 102, 255, 0.18);
          border-color: rgba(8, 102, 255, 0.35);
        }

        .profile-menu-dropdown :global(.icon-box-admin),
        .icon-box-admin {
          color: #60a5fa;
          background: rgba(8, 102, 255, 0.16);
          border-color: rgba(8, 102, 255, 0.35);
        }

        .profile-menu-dropdown :global(.profile-link-content),
        .profile-link-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
          text-align: left;
        }

        .profile-menu-dropdown :global(.link-title),
        .link-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #F3F4F6 !important;
          line-height: 1.25;
        }

        .profile-menu-dropdown :global(.link-title-admin),
        .link-title-admin {
          color: #60a5fa !important;
        }

        .profile-menu-dropdown :global(.link-desc),
        .link-desc {
          font-size: 0.72rem;
          color: #9BA1A6 !important;
          line-height: 1.3;
          margin-top: 2px;
        }

        .profile-menu-dropdown :global(.profile-link-arrow),
        .profile-link-arrow {
          font-size: 0.95rem;
          color: #6B7280;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.15s ease, transform 0.15s ease, color 0.15s ease;
        }

        .profile-menu-dropdown :global(.profile-nav-link:hover .profile-link-arrow),
        .profile-nav-link:hover .profile-link-arrow {
          opacity: 1;
          transform: translateX(0);
          color: #60a5fa;
        }

        /* Logout Action Button */
        .profile-logout-btn {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          width: 100% !important;
          padding: 10px 12px !important;
          border-radius: 14px !important;
          background: rgba(239, 68, 68, 0.08) !important;
          border: 1px solid rgba(239, 68, 68, 0.18) !important;
          color: #f87171 !important;
          font-size: 0.88rem !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          box-sizing: border-box !important;
          text-align: left !important;
          transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease, color 0.15s ease !important;
        }

        .profile-logout-btn:hover {
          background: rgba(239, 68, 68, 0.16) !important;
          border-color: rgba(239, 68, 68, 0.4) !important;
          color: #fca5a5 !important;
          transform: translateY(-1px) !important;
        }

        .logout-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }

        .profile-logout-btn:hover .logout-icon-box {
          background: rgba(239, 68, 68, 0.24);
          color: #ffffff;
        }

        .mobile-hamburger-btn {
          display: none;
          background: none;
          border: none;
          color: #ffffff;
          cursor: pointer;
          padding: 6px;
        }

        /* Expandable Search */
        .search-bar-expand {
          margin-top: 10px;
          background: #0B0B0D;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          padding: 8px 18px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
          animation: searchSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes searchSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .search-form {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 0.9rem;
          outline: none;
          font-family: inherit;
        }

        .search-input::placeholder {
          color: #6B7280;
        }

        .search-submit-pill {
          background: #0866FF;
          border: none;
          color: #ffffff;
          padding: 6px 16px;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
        }

        .search-close-btn {
          background: none;
          border: none;
          color: #9BA1A6;
          cursor: pointer;
          font-size: 1rem;
        }

        /* Mobile Drawer Sheet - Crystal Clear High-Contrast Styling */
        .mobile-drawer-sheet {
          margin-top: 10px;
          background: rgba(13, 14, 18, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 24px;
          padding: 16px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(8, 102, 255, 0.15);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          animation: searchSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          color: #FFFFFF !important;
          max-height: calc(100vh - 90px);
          max-height: calc(100dvh - 90px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          pointer-events: auto;
        }

        .mobile-drawer-sheet::-webkit-scrollbar {
          width: 5px;
        }

        .mobile-drawer-sheet::-webkit-scrollbar-track {
          background: transparent;
        }

        .mobile-drawer-sheet::-webkit-scrollbar-thumb {
          background: rgba(8, 102, 255, 0.45);
          border-radius: 9999px;
        }

        .mobile-drawer-sheet {
          scrollbar-width: thin;
          scrollbar-color: rgba(8, 102, 255, 0.45) transparent;
        }

        .mobile-drawer-inner {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        :global(.mobile-nav-link) {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          padding: 12px 14px !important;
          border-radius: 14px !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: #FFFFFF !important;
          text-decoration: none !important;
          transition: background 0.18s, border-color 0.18s, transform 0.15s !important;
        }

        :global(.mobile-nav-link:hover) {
          background: rgba(255, 255, 255, 0.09) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          transform: translateY(-1px) !important;
        }

        .drawer-icon-bubble {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #93C5FD;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .drawer-link-text-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .drawer-primary-text {
          font-size: 0.94rem;
          font-weight: 700;
          color: #FFFFFF !important;
          line-height: 1.25;
        }

        .drawer-secondary-text {
          font-size: 0.74rem;
          color: #9CA3AF !important;
          margin-top: 2px;
          line-height: 1.3;
        }

        .drawer-chevron {
          font-size: 0.95rem;
          color: #93C5FD;
          font-weight: 700;
          transition: transform 0.15s;
        }

        :global(.mobile-nav-link:hover) .drawer-chevron {
          transform: translateX(3px);
          color: #FFFFFF;
        }

        /* Categorized Performance Section in Mobile Drawer */
        .mobile-categories-group {
          margin: 6px 0;
          padding: 10px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mobile-group-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px 4px;
        }

        .mobile-group-title {
          font-size: 0.72rem;
          font-weight: 800;
          color: #9CA3AF;
          letter-spacing: 0.08em;
        }

        .mobile-group-badge {
          font-size: 0.65rem;
          font-weight: 750;
          color: #60A5FA;
          letter-spacing: 0.06em;
          background: rgba(8, 102, 255, 0.15);
          border: 1px solid rgba(8, 102, 255, 0.3);
          padding: 2px 7px;
          border-radius: 9999px;
        }

        .mobile-category-cards-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        :global(.mobile-category-item) {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          padding: 10px 12px !important;
          border-radius: 12px !important;
          background: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: #FFFFFF !important;
          text-decoration: none !important;
          transition: background 0.15s, border-color 0.15s, transform 0.15s !important;
        }

        :global(.mobile-category-item:hover) {
          background: rgba(8, 102, 255, 0.12) !important;
          border-color: rgba(8, 102, 255, 0.35) !important;
          transform: translateX(2px) !important;
        }

        .mobile-cat-icon-frame {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .mobile-cat-icon-frame.cat-apple {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.15);
        }

        .mobile-cat-icon-frame.cat-gaming {
          color: #34D399;
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.18);
        }

        .mobile-cat-icon-frame.cat-ultrabook {
          color: #60A5FA;
          background: rgba(8, 102, 255, 0.12);
          border-color: rgba(8, 102, 255, 0.3);
          box-shadow: 0 0 12px rgba(8, 102, 255, 0.18);
        }

        .mobile-cat-icon-frame.cat-workstation {
          color: #C084FC;
          background: rgba(168, 85, 247, 0.12);
          border-color: rgba(168, 85, 247, 0.3);
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.18);
        }

        .mobile-cat-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .mobile-cat-headline {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .mobile-cat-name {
          font-size: 0.92rem;
          font-weight: 750;
          color: #FFFFFF !important;
          line-height: 1.2;
        }

        .mobile-cat-tag-pill {
          font-size: 0.68rem;
          font-weight: 750;
          color: #60A5FA !important;
          background: rgba(8, 102, 255, 0.14);
          border: 1px solid rgba(8, 102, 255, 0.3);
          padding: 2px 7px;
          border-radius: 9999px;
          white-space: nowrap;
        }

        .mobile-cat-subtext {
          font-size: 0.72rem;
          color: #9CA3AF !important;
          margin-top: 2px;
          line-height: 1.3;
        }

        .mobile-cat-arrow-cue {
          font-size: 0.85rem;
          color: #60A5FA;
          opacity: 0.65;
          font-weight: 700;
          transition: opacity 0.15s, transform 0.15s;
        }

        :global(.mobile-category-item:hover) .mobile-cat-arrow-cue {
          opacity: 1;
          transform: translateX(3px);
          color: #FFFFFF;
        }

        /* WhatsApp Card in Drawer */
        .whatsapp-bubble {
          background: rgba(37, 211, 102, 0.15);
          border-color: rgba(37, 211, 102, 0.35);
          color: #25D366;
        }

        .whatsapp-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .whatsapp-text {
          color: #25D366 !important;
        }

        .live-status-badge {
          font-size: 0.62rem;
          font-weight: 800;
          color: #10B981;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 1px 6px;
          border-radius: 9999px;
          letter-spacing: 0.05em;
        }

        /* Mobile Login Drawer Button */
        :global(.mobile-login-drawer-btn) {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 10px !important;
          width: 100% !important;
          padding: 12px 18px !important;
          border-radius: 9999px !important;
          background: linear-gradient(135deg, #0866FF 0%, #2B8CFF 100%) !important;
          color: #FFFFFF !important;
          font-size: 0.92rem !important;
          font-weight: 750 !important;
          text-decoration: none !important;
          box-shadow: 0 6px 20px rgba(8, 102, 255, 0.45) !important;
          margin-top: 4px !important;
          transition: background 0.18s, transform 0.15s !important;
        }

        :global(.mobile-login-drawer-btn:hover) {
          background: linear-gradient(135deg, #0756D6 0%, #1A75FF 100%) !important;
          transform: translateY(-1px) !important;
        }

        :global(.mobile-login-drawer-btn span) {
          color: #FFFFFF !important;
        }

        /* Mobile Signout */
        .mobile-signout-btn {
          width: 100%;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #F87171;
          padding: 11px;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 4px;
          transition: background 0.15s;
        }

        .mobile-signout-btn:hover {
          background: rgba(239, 68, 68, 0.22);
          color: #FFFFFF;
        }

        .user-bubble {
          background: linear-gradient(135deg, #0866FF 0%, #2B8CFF 100%);
          color: #FFFFFF;
          font-weight: 800;
        }

        .admin-bubble {
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.35);
          color: #F59E0B;
        }

        .admin-text {
          color: #FBBF24 !important;
        }

        /* Responsive Breakpoints & Sizing Adjustments */
        @media (max-width: 1024px) {
          .nav-links-desktop {
            gap: 4px;
          }
          .nav-link-item {
            padding: 8px 12px;
            font-size: 0.86rem;
          }
        }

        @media (max-width: 900px) {
          .nav-links-desktop {
            display: none;
          }

          .mobile-hamburger-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.16);
            color: #ffffff;
            cursor: pointer;
            transition: background 0.15s, transform 0.15s;
            flex-shrink: 0;
          }

          .mobile-hamburger-btn:hover {
            background: rgba(255, 255, 255, 0.18);
            transform: translateY(-1px);
          }

          .nav-pill {
            padding: 8px 22px 8px 18px;
          }

          .nav-actions {
            gap: 12px;
          }
        }

        @media (max-width: 640px) {
          .navbar-header-root {
            top: 8px;
            padding: 0 10px;
          }

          .nav-pill {
            padding: 6px 14px 6px 10px;
          }

          .nav-brand {
            gap: 8px;
          }

          .brand-logo-frame {
            width: 36px;
            height: 36px;
            border-radius: 10px;
          }

          .brand-name {
            font-size: 0.92rem;
            white-space: nowrap;
          }

          .brand-sub {
            display: none; /* Keep clean single line on mobile */
          }

          .nav-actions {
            gap: 8px;
            align-items: center;
          }

          .action-icon-btn,
          :global(.cart-pill-link),
          .user-avatar-btn,
          .mobile-hamburger-btn {
            width: 36px !important;
            height: 36px !important;
          }

          .cart-counter-badge {
            min-width: 17px;
            height: 17px;
            font-size: 0.625rem;
            top: -3px;
            right: -3px;
          }

          :global(.login-pill-btn) {
            width: 36px !important;
            height: 36px !important;
            padding: 0 !important;
            border-radius: 50% !important;
            justify-content: center !important;
            margin-left: 0 !important;
            box-shadow: 0 2px 10px rgba(8, 102, 255, 0.35) !important;
          }

          :global(.login-pill-btn span) {
            display: none !important;
          }

          :global(.login-pill-btn svg) {
            margin: 0 !important;
          }

          .profile-menu-dropdown {
            width: calc(100vw - 24px) !important;
            max-width: 320px !important;
            right: -6px !important;
            padding: 14px !important;
            border-radius: 20px !important;
          }
        }

        @media (max-width: 380px) {
          .navbar-header-root {
            padding: 0 6px;
          }

          .nav-pill {
            padding: 5px 10px 5px 8px;
          }

          .brand-logo-frame {
            width: 32px;
            height: 32px;
          }

          .brand-name {
            font-size: 0.82rem;
          }

          .nav-actions {
            gap: 6px;
          }

          .action-icon-btn,
          :global(.cart-pill-link),
          .user-avatar-btn,
          :global(.login-pill-btn),
          .mobile-hamburger-btn {
            width: 32px !important;
            height: 32px !important;
          }
        }
      `}</style>
    </header>
  );
}
