'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import ClientLayout from '../ClientLayout';

const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain'
];

export default function CheckoutPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderCompleteData, setOrderCompleteData] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Dubai',
    country: 'UAE',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        addToast('Please sign in to proceed to checkout', 'info');
        router.push('/auth/login?redirect=/checkout');
      }
      return;
    }

      try {
        const savedCart = localStorage.getItem('cart');
        const parsed = savedCart ? JSON.parse(savedCart) : [];
        if (!Array.isArray(parsed) || parsed.length === 0) {
          router.push('/cart');
          return;
        }
        setCart(parsed);
      } catch {
        router.push('/cart');
        return;
      }

      // Pre-fill user profile info if available
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: typeof user.address === 'string' ? user.address : (user.address?.street || ''),
        city: user.address?.city || 'Dubai',
        country: user.address?.country || 'UAE'
      }));

      setLoading(false);
  }, [user, authLoading, router, addToast]);

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 1)), 0);
  const shipping = subtotal >= 5000 ? 0 : 20;
  const total = subtotal + shipping;

  const validate = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.phone.trim()) errors.phone = 'Contact phone number is required';
    if (!formData.address.trim()) errors.address = 'Delivery address is required';
    if (!formData.city.trim()) errors.city = 'Emirate / City is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please fill in all required delivery fields', 'warning');
      return;
    }

    setSubmitting(true);

    try {
      const currentToken = token || localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
        },
        body: JSON.stringify({
          customerInfo: formData,
          items: cart.map(item => ({
            id: item.id || item._id,
            name: item.name,
            quantity: item.quantity || 1
          }))
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.order) {
        // Clear Cart
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cartUpdated'));

        // Prepare WhatsApp message
        const orderNumber = data.order.orderNumber;
        const lineItemsText = cart.map(item =>
          `• ${item.name} (x${item.quantity}) - AED ${(Number(item.price) * item.quantity).toLocaleString()}`
        ).join('%0A');

        const waText = `*NEW ORDER - AL MUKAMMAL*%0A` +
          `*Order #:* ${orderNumber}%0A` +
          `*Customer:* ${formData.fullName}%0A` +
          `*Phone:* ${formData.phone}%0A` +
          `*Address:* ${formData.address}, ${formData.city}, ${formData.country}%0A%0A` +
          `*Items:*%0A${lineItemsText}%0A%0A` +
          `*Subtotal:* AED ${data.order.subtotal?.toLocaleString()}%0A` +
          `*Shipping:* AED ${data.order.shipping?.toLocaleString()}%0A` +
          `*Total Payable:* AED ${data.order.totalAmount?.toLocaleString()}%0A%0A` +
          `_Order registered in Al Mukammal Sales System._`;

        const waUrl = `https://wa.me/971509550121?text=${waText}`;

        setOrderCompleteData({
          orderNumber,
          totalAmount: data.order.totalAmount,
          waUrl
        });

        addToast(`Order ${orderNumber} placed successfully!`, 'success');

        // Automatically open WhatsApp in new tab
        window.open(waUrl, '_blank');
      } else {
        addToast(data.error || 'Failed to place order. Please review your cart.', 'error');
      }
    } catch {
      addToast('Network error submitting order. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <ClientLayout>
        <div className="checkout-loading">
          <div className="spinner"></div>
          <p>Preparing checkout session...</p>
        </div>
      </ClientLayout>
    );
  }

  // Success Confirmation Screen
  if (orderCompleteData) {
    return (
      <ClientLayout>
        <div className="checkout-success-root">
          <div className="success-card">
            <span className="success-icon">✓</span>
            <span className="success-badge">ORDER CONFIRMED</span>
            <h1 className="success-title">Thank You For Your Order!</h1>
            <p className="success-subtitle">
              Your order <strong>#{orderCompleteData.orderNumber}</strong> has been registered with our Dubai showroom.
            </p>

            <div className="amount-highlight">
              Total Amount: <span>AED {Number(orderCompleteData.totalAmount).toLocaleString()}</span>
            </div>

            <div className="success-actions">
              <a
                href={orderCompleteData.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="wa-continue-btn"
              >
                <span>💬 Open WhatsApp Order Chat</span>
              </a>
              <Link href="/orders" className="view-orders-btn">
                Track in My Orders →
              </Link>
            </div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="checkout-root">
        <div className="checkout-container">
          <div className="checkout-header">
            <h1 className="checkout-title">Express Checkout</h1>
            <p className="checkout-subtitle">Enter your UAE delivery information to complete your order</p>
          </div>

          <form onSubmit={handlePlaceOrder} className="checkout-grid">
            {/* Left: Delivery Details Form */}
            <div className="form-column">
              <div className="checkout-panel">
                <h2 className="panel-title">1. Contact & Customer Details</h2>
                <div className="form-grid-2">
                  <div className="input-field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g. Rashid Al Nuaimi"
                      className={formErrors.fullName ? 'error' : ''}
                    />
                    {formErrors.fullName && <span className="field-err">{formErrors.fullName}</span>}
                  </div>

                  <div className="input-field">
                    <label>Contact Phone (WhatsApp) *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+971 50 123 4567"
                      className={formErrors.phone ? 'error' : ''}
                    />
                    {formErrors.phone && <span className="field-err">{formErrors.phone}</span>}
                  </div>
                </div>

                <div className="input-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="checkout-panel">
                <h2 className="panel-title">2. Delivery Location (UAE)</h2>
                <div className="form-grid-2">
                  <div className="input-field">
                    <label>Emirate / City *</label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="select-input"
                    >
                      {UAE_EMIRATES.map(em => (
                        <option key={em} value={em}>{em}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-field">
                    <label>Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      readOnly
                      className="readonly-input"
                    />
                  </div>
                </div>

                <div className="input-field">
                  <label>Street Address / Villa / Apartment *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Building name, Street number, Apartment or Office #"
                    className={formErrors.address ? 'error' : ''}
                  />
                  {formErrors.address && <span className="field-err">{formErrors.address}</span>}
                </div>

                <div className="input-field">
                  <label>Delivery Instructions / Notes</label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="e.g. Please call before delivery, deliver after 2 PM"
                  />
                </div>
              </div>
            </div>

            {/* Right: Order Review & Placement */}
            <div className="review-column">
              <div className="review-panel">
                <h2 className="panel-title">Order Overview ({cart.length} items)</h2>

                <div className="review-items-list">
                  {cart.map((item, idx) => (
                    <div key={idx} className="review-item">
                      <img src={item.image || '/placeholder.jpg'} alt={item.name} className="review-thumb" />
                      <div className="review-item-info">
                        <span className="review-item-name">{item.name}</span>
                        <span className="review-item-qty">Qty: {item.quantity || 1}</span>
                      </div>
                      <span className="review-item-price">
                        AED {(Number(item.price) * (item.quantity || 1)).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="review-divider"></div>

                <div className="review-totals">
                  <div className="total-line">
                    <span>Subtotal</span>
                    <span>AED {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="total-line">
                    <span>UAE Delivery</span>
                    <span>{shipping === 0 ? <strong className="free-text">FREE</strong> : `AED ${shipping}`}</span>
                  </div>
                  <div className="review-divider"></div>
                  <div className="total-line grand-line">
                    <span>Total Amount</span>
                    <span className="grand-val">AED {total.toLocaleString()}</span>
                  </div>
                </div>

                {/* WhatsApp Information Note */}
                <div className="wa-notice-box">
                  <span className="wa-notice-icon">💬</span>
                  <p>
                    Placing this order automatically registers your reservation and generates a direct <strong>WhatsApp confirmation</strong> with our Dubai sales desk for immediate courier dispatch.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="place-order-btn"
                >
                  {submitting ? 'Registering Order...' : `Confirm & Place Order (AED ${total.toLocaleString()})`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .checkout-root {
          min-height: 100vh;
          background: var(--bg-default, #ffffff);
          color: var(--text-primary, #080808);
          padding: 3.5rem 1.5rem 6rem;
        }

        .checkout-container {
          max-width: var(--container-max, 1280px);
          margin: 0 auto;
        }

        .checkout-header {
          margin-bottom: 2.5rem;
        }

        .checkout-title {
          font-size: clamp(2.2rem, 3.5vw + 0.5rem, 3rem);
          font-weight: 850;
          letter-spacing: -0.03em;
          margin: 0 0 0.5rem 0;
          color: var(--text-primary, #080808);
        }

        .checkout-subtitle {
          font-size: 1.05rem;
          color: var(--text-secondary, #5f6368);
          margin: 0;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 440px;
          gap: 3rem;
          align-items: flex-start;
        }

        @media (max-width: 960px) {
          .checkout-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        .form-column {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .checkout-panel,
        .review-panel {
          background: #ffffff;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 28px;
          padding: 2rem;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
        }

        .panel-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary, #080808);
          letter-spacing: -0.02em;
          margin: 0 0 1.5rem 0;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 600px) {
          .form-grid-2 {
            grid-template-columns: 1fr;
          }
        }

        .input-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .input-field label {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary, #5f6368);
        }

        .input-field input,
        .input-field textarea,
        .select-input {
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 12px;
          padding: 0.8rem 1.15rem;
          color: var(--text-primary, #080808);
          font-size: 0.92rem;
          outline: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .input-field input:focus,
        .input-field textarea:focus,
        .select-input:focus {
          border-color: var(--blue-primary, #0866ff);
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(8, 102, 255, 0.12);
        }

        .input-field input.error,
        .input-field textarea.error {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .field-err {
          font-size: 0.78rem;
          color: #ef4444;
        }

        .select-input option {
          background: #ffffff;
          color: #080808;
        }

        .readonly-input {
          opacity: 0.65;
          cursor: not-allowed;
          background: #eef1f5;
        }

        /* Review Column */
        .review-items-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 280px;
          overflow-y: auto;
          margin-bottom: 1.5rem;
          padding-right: 0.5rem;
        }

        .review-item {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .review-thumb {
          width: 52px;
          height: 52px;
          object-fit: contain;
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 12px;
          padding: 0.35rem;
          flex-shrink: 0;
        }

        .review-item-info {
          flex: 1;
        }

        .review-item-name {
          display: block;
          font-size: 0.85rem;
          font-weight: 650;
          color: var(--text-primary, #080808);
          line-height: 1.35;
        }

        .review-item-qty {
          font-size: 0.75rem;
          color: var(--text-secondary, #5f6368);
        }

        .review-item-price {
          font-size: 0.9rem;
          font-weight: 750;
          color: var(--blue-primary, #0866ff);
        }

        .review-divider {
          height: 1px;
          background: var(--border-subtle, #e5e7eb);
          margin: 1.25rem 0;
        }

        .review-totals {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          font-size: 0.92rem;
        }

        .total-line {
          display: flex;
          justify-content: space-between;
          color: var(--text-secondary, #5f6368);
        }

        .free-text {
          color: #16a34a;
          font-weight: 700;
        }

        .grand-line {
          color: var(--text-primary, #080808);
          font-weight: 800;
          font-size: 1.2rem;
          padding-top: 0.5rem;
        }

        .grand-val {
          color: var(--blue-primary, #0866ff);
          font-weight: 850;
        }

        .wa-notice-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 16px;
          padding: 1rem 1.15rem;
          display: flex;
          gap: 0.85rem;
          align-items: flex-start;
          margin: 1.75rem 0;
        }

        .wa-notice-icon {
          font-size: 1.35rem;
        }

        .wa-notice-box p {
          font-size: 0.82rem;
          color: #166534;
          line-height: 1.5;
          margin: 0;
        }

        .place-order-btn {
          width: 100%;
          background: var(--text-primary, #080808);
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          padding: 1rem 1.5rem;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .place-order-btn:hover {
          background: var(--blue-primary, #0866ff);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -4px rgba(8, 102, 255, 0.35);
        }

        .place-order-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Success Card */
        .checkout-success-root {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3.5rem 1.5rem;
          background: var(--bg-default, #ffffff);
        }

        .success-card {
          background: #ffffff;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 32px;
          padding: 4rem 2.5rem;
          text-align: center;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.08);
        }

        .success-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: #10b981;
          color: #ffffff;
          font-size: 2.2rem;
          font-weight: bold;
          margin: 0 auto 1.5rem;
          box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4);
        }

        .success-badge {
          display: inline-block;
          font-size: 0.78rem;
          font-weight: 750;
          color: #166534;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 0.35rem 0.95rem;
          border-radius: 9999px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .success-title {
          font-size: 2.2rem;
          font-weight: 850;
          letter-spacing: -0.02em;
          margin: 1.25rem 0 0.5rem 0;
          color: var(--text-primary, #080808);
        }

        .success-subtitle {
          color: var(--text-secondary, #5f6368);
          font-size: 1rem;
          line-height: 1.6;
          margin: 0 0 2rem 0;
        }

        .amount-highlight {
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 18px;
          padding: 1.25rem;
          font-size: 1rem;
          color: var(--text-secondary, #5f6368);
          margin-bottom: 2rem;
        }

        .amount-highlight span {
          color: var(--blue-primary, #0866ff);
          font-weight: 850;
          font-size: 1.35rem;
          margin-left: 0.5rem;
        }

        .success-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .wa-continue-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          background: #16a34a;
          color: #ffffff;
          text-decoration: none;
          font-weight: 700;
          font-size: 1rem;
          padding: 1rem 2rem;
          border-radius: 9999px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .wa-continue-btn:hover {
          background: #15803d;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -4px rgba(22, 163, 74, 0.35);
        }

        .view-orders-btn {
          color: var(--text-secondary, #5f6368);
          text-decoration: none;
          font-size: 0.92rem;
          font-weight: 600;
          transition: color 0.2s;
        }

        .view-orders-btn:hover {
          color: var(--text-primary, #080808);
          text-decoration: underline;
        }

        .checkout-loading {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
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