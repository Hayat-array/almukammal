'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import ClientLayout from '../ClientLayout';

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCart(Array.isArray(parsed) ? parsed : []);
      } else {
        setCart([]);
      }
    } catch {
      setCart([]);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        addToast('Please log in to view your shopping cart', 'info');
        router.push('/auth/login?redirect=/cart');
      }
      return;
    }

    loadCartFromStorage();
    setLoading(false);

    const handleSync = () => loadCartFromStorage();
    window.addEventListener('cartUpdated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('cartUpdated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [authLoading, user ? user._id : null]);

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    const updated = cart.map(item =>
      (item.id || item._id) === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (productId, name) => {
    const updated = cart.filter(item => (item.id || item._id) !== productId);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
    addToast(`Removed "${name}" from cart`, 'info');
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
    addToast('Cart cleared', 'info');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 1)), 0);
  const freeThreshold = 5000;
  const isFreeDelivery = subtotal >= freeThreshold;
  const shipping = cart.length === 0 ? 0 : (isFreeDelivery ? 0 : 20);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discountAmount = (subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount) discountAmount = Math.min(discountAmount, appliedCoupon.maxDiscount);
    } else {
      discountAmount = appliedCoupon.value;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const grandTotal = Math.max(0, subtotal + shipping - discountAmount);
  const amountToFreeDelivery = Math.max(0, freeThreshold - subtotal);
  const freeDeliveryProgress = Math.min(100, (subtotal / freeThreshold) * 100);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    setCouponError('');

    try {
      const res = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), cartTotal: subtotal, userId: user?._id })
      });
      const data = await res.json();

      if (res.ok && data.success && data.coupon) {
        setAppliedCoupon(data.coupon);
        addToast(`Promo code "${data.coupon.code}" applied!`, 'success');
      } else {
        setCouponError(data.error || 'Invalid promotional code');
        addToast(data.error || 'Invalid coupon', 'error');
      }
    } catch {
      setCouponError('Network error validating coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  if (loading || authLoading) {
    return (
      <ClientLayout>
        <div className="cart-loading">
          <div className="spinner"></div>
          <p>Retrieving your shopping cart...</p>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="cart-page-root">
        <div className="cart-container">
          <div className="cart-header">
            <h1 className="cart-title">Shopping Cart</h1>
            <p className="cart-subtitle">Review selected laptops before proceeding to delivery details</p>
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart-card">
              <span className="empty-cart-icon">🛒</span>
              <h2>Your Cart is Currently Empty</h2>
              <p>Explore our curated Dubai inventory of gaming beasts, executive ultrabooks, and MacBooks.</p>
              <Link href="/products" className="browse-btn">
                Explore Available Laptops →
              </Link>
            </div>
          ) : (
            <div className="cart-layout-grid">
              {/* Left Column: Cart Items List */}
              <div className="items-column">
                {/* Free Delivery Meter */}
                <div className="delivery-meter-card">
                  <div className="meter-label">
                    {isFreeDelivery ? (
                      <span className="meter-success">🎉 Congratulations! You have unlocked Free UAE Delivery</span>
                    ) : (
                      <span>Add <strong>AED {amountToFreeDelivery.toLocaleString()}</strong> more to unlock <strong>Free Express Delivery</strong></span>
                    )}
                  </div>
                  <div className="meter-bar-track">
                    <div className="meter-bar-fill" style={{ width: `${freeDeliveryProgress}%` }}></div>
                  </div>
                </div>

                <div className="cart-items-wrapper">
                  {cart.map((item) => {
                    const itemId = item.id || item._id;
                    return (
                      <div key={itemId} className="cart-item-card">
                        <div className="item-thumb-box">
                          <img
                            src={item.image || '/placeholder.jpg'}
                            alt={item.name}
                            className="item-thumb"
                            onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                          />
                        </div>

                        <div className="item-info">
                          <h3 className="item-title">{item.name}</h3>
                          {item.selectedColor && (
                            <span className="item-variant">Color: {item.selectedColor}</span>
                          )}
                          <div className="item-unit-price">
                            AED {Number(item.price).toLocaleString()} each
                          </div>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="item-stepper">
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            className="qty-btn"
                          >
                            −
                          </button>
                          <span className="qty-num">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                            className="qty-btn"
                          >
                            +
                          </button>
                        </div>

                        {/* Item Total Price */}
                        <div className="item-subtotal">
                          AED {(Number(item.price) * item.quantity).toLocaleString()}
                        </div>

                        {/* Remove Action */}
                        <button
                          onClick={() => removeItem(itemId, item.name)}
                          className="item-remove-btn"
                          aria-label="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="cart-actions-bottom">
                  <button onClick={clearCart} className="clear-cart-btn">
                    Clear Cart
                  </button>
                  <Link href="/products" className="continue-link">
                    ← Continue Shopping
                  </Link>
                </div>
              </div>

              {/* Right Column: Order Summary Card */}
              <div className="summary-column">
                <div className="summary-card">
                  <h2 className="summary-title">Order Summary</h2>

                  <div className="summary-rows">
                    <div className="summary-row">
                      <span className="row-label">Items Subtotal</span>
                      <span className="row-val">AED {subtotal.toLocaleString()}</span>
                    </div>

                    <div className="summary-row">
                      <span className="row-label">Estimated Delivery</span>
                      <span className="row-val">
                        {shipping === 0 ? (
                          <span className="free-tag">FREE</span>
                        ) : (
                          `AED ${shipping.toLocaleString()}`
                        )}
                      </span>
                    </div>

                    {appliedCoupon && (
                      <div className="summary-row discount-row">
                        <span className="row-label">
                          Promo ({appliedCoupon.code})
                          <button onClick={() => setAppliedCoupon(null)} className="remove-coupon-btn">remove</button>
                        </span>
                        <span className="row-val discount-val">- AED {discountAmount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="summary-divider"></div>

                    <div className="summary-row grand-total-row">
                      <span className="row-label">Grand Total</span>
                      <span className="row-val grand-total-val">AED {grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Coupon Promo Input Form */}
                  <form onSubmit={handleApplyCoupon} className="coupon-form">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. SAVE10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="coupon-input"
                    />
                    <button type="submit" disabled={validatingCoupon} className="apply-coupon-btn">
                      {validatingCoupon ? '...' : 'Apply'}
                    </button>
                  </form>
                  {couponError && <p className="coupon-error">{couponError}</p>}

                  {/* Checkout CTA */}
                  <button
                    onClick={() => router.push('/checkout')}
                    className="checkout-btn"
                  >
                    <span>Proceed to Delivery & Checkout</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>

                  <div className="assurance-badges">
                    <span>🛡️ 1-Year UAE Warranty</span>
                    <span>🇦🇪 Fast GCC Dispatch</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .cart-page-root {
          min-height: 100vh;
          background: var(--bg-default, #ffffff);
          color: var(--text-primary, #080808);
          padding: 3.5rem 1.5rem 6rem;
        }

        .cart-container {
          max-width: var(--container-max, 1280px);
          margin: 0 auto;
        }

        .cart-header {
          margin-bottom: 2.5rem;
        }

        .cart-title {
          font-size: clamp(2.2rem, 3.5vw + 0.5rem, 3rem);
          font-weight: 850;
          letter-spacing: -0.03em;
          margin: 0 0 0.5rem 0;
          color: var(--text-primary, #080808);
        }

        .cart-subtitle {
          font-size: 1.05rem;
          color: var(--text-secondary, #5f6368);
          margin: 0;
        }

        .empty-cart-card {
          background: #ffffff;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 28px;
          padding: 5rem 2rem;
          text-align: center;
          max-width: 600px;
          margin: 2rem auto;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
        }

        .empty-cart-icon {
          font-size: 3.5rem;
          display: block;
          margin-bottom: 1.25rem;
        }

        .empty-cart-card h2 {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-primary, #080808);
          margin: 0 0 0.75rem 0;
        }

        .empty-cart-card p {
          color: var(--text-secondary, #5f6368);
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0 0 2rem 0;
        }

        .browse-btn {
          display: inline-flex;
          align-items: center;
          background: var(--text-primary, #080808);
          color: #ffffff;
          text-decoration: none;
          font-weight: 700;
          padding: 0.85rem 1.85rem;
          border-radius: 9999px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .browse-btn:hover {
          background: var(--blue-primary, #0866ff);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(8, 102, 255, 0.3);
        }

        /* Cart Layout Grid */
        .cart-layout-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 3rem;
          align-items: flex-start;
        }

        @media (max-width: 960px) {
          .cart-layout-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        /* Free Delivery Meter */
        .delivery-meter-card {
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 20px;
          padding: 1.15rem 1.35rem;
          margin-bottom: 1.75rem;
        }

        .meter-label {
          font-size: 0.88rem;
          color: var(--text-secondary, #5f6368);
          margin-bottom: 0.65rem;
        }

        .meter-success {
          color: #16a34a;
          font-weight: 600;
        }

        .meter-bar-track {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
        }

        .meter-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--blue-primary, #0866ff), #10b981);
          border-radius: 9999px;
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Cart Items */
        .cart-items-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .cart-item-card {
          background: #ffffff;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 24px;
          padding: 1.35rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
          transition: border-color 0.2s;
        }

        .cart-item-card:hover {
          border-color: #cbd5e1;
        }

        .item-thumb-box {
          width: 88px;
          height: 88px;
          background: #f7f8fa;
          border-radius: 18px;
          border: 1px solid var(--border-subtle, #e5e7eb);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.6rem;
          flex-shrink: 0;
        }

        .item-thumb {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .item-info {
          flex: 1;
        }

        .item-title {
          font-size: 1.05rem;
          font-weight: 750;
          color: var(--text-primary, #080808);
          margin: 0 0 0.3rem 0;
        }

        .item-variant {
          display: block;
          font-size: 0.8rem;
          color: var(--text-secondary, #5f6368);
          margin-bottom: 0.35rem;
        }

        .item-unit-price {
          font-size: 0.85rem;
          color: var(--text-secondary, #5f6368);
        }

        .item-stepper {
          display: flex;
          align-items: center;
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 9999px;
          padding: 0.25rem;
        }

        .qty-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: #ffffff;
          color: var(--text-primary, #080808);
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }

        .qty-btn:hover {
          background: #eef1f5;
        }

        .qty-num {
          padding: 0 0.85rem;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary, #080808);
        }

        .item-subtotal {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary, #080808);
          min-width: 120px;
          text-align: right;
        }

        .item-remove-btn {
          background: transparent;
          border: none;
          color: #9ca3af;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.4rem;
          transition: color 0.15s;
          line-height: 1;
        }

        .item-remove-btn:hover {
          color: #ef4444;
        }

        .cart-actions-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.75rem;
        }

        .clear-cart-btn {
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #ef4444;
          padding: 0.55rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-cart-btn:hover {
          background: #fef2f2;
          border-color: #ef4444;
        }

        .continue-link {
          color: var(--blue-primary, #0866ff);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .continue-link:hover {
          text-decoration: underline;
        }

        /* Summary Column */
        .summary-card {
          background: #ffffff;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 28px;
          padding: 2rem;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
        }

        .summary-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-primary, #080808);
          margin: 0 0 1.5rem 0;
          letter-spacing: -0.02em;
        }

        .summary-rows {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.92rem;
        }

        .row-label {
          color: var(--text-secondary, #5f6368);
        }

        .row-val {
          color: var(--text-primary, #080808);
          font-weight: 600;
        }

        .free-tag {
          color: #16a34a;
          font-weight: 700;
        }

        .discount-row {
          color: #16a34a;
        }

        .discount-val {
          color: #16a34a;
        }

        .remove-coupon-btn {
          background: transparent;
          border: none;
          color: #ef4444;
          font-size: 0.75rem;
          cursor: pointer;
          margin-left: 0.5rem;
          text-decoration: underline;
        }

        .summary-divider {
          height: 1px;
          background: var(--border-subtle, #e5e7eb);
          margin: 0.75rem 0;
        }

        .grand-total-row .row-label {
          color: var(--text-primary, #080808);
          font-weight: 750;
          font-size: 1.1rem;
        }

        .grand-total-val {
          font-size: 1.5rem;
          font-weight: 850;
          color: var(--blue-primary, #0866ff);
          letter-spacing: -0.02em;
        }

        /* Coupon Form */
        .coupon-form {
          display: flex;
          gap: 0.5rem;
          margin-top: 1.75rem;
        }

        .coupon-input {
          flex: 1;
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 9999px;
          padding: 0.7rem 1.15rem;
          color: var(--text-primary, #080808);
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .coupon-input:focus {
          border-color: var(--blue-primary, #0866ff);
          background: #ffffff;
        }

        .apply-coupon-btn {
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          color: var(--text-primary, #080808);
          border-radius: 9999px;
          padding: 0.7rem 1.25rem;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .apply-coupon-btn:hover {
          background: #eef1f5;
          border-color: #cbd5e1;
        }

        .coupon-error {
          font-size: 0.78rem;
          color: #ef4444;
          margin: 0.4rem 0 0 0.5rem;
        }

        .checkout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          background: var(--text-primary, #080808);
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          padding: 1rem;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 1.75rem;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .checkout-btn:hover {
          background: var(--blue-primary, #0866ff);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -4px rgba(8, 102, 255, 0.35);
        }

        .assurance-badges {
          display: flex;
          justify-content: space-around;
          font-size: 0.78rem;
          color: var(--text-secondary, #5f6368);
          margin-top: 1.5rem;
        }

        .cart-loading {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .spinner {
          width: 44px;
          height: 44px;
          border: 3px solid rgba(8, 102, 255, 0.15);
          border-top-color: var(--blue-primary, #0866ff);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 1.25rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ClientLayout>
  );
}