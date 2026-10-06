'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import ClientLayout from '../ClientLayout';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user, token, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        addToast('Please log in to view your order history', 'info');
        router.push('/auth/login?redirect=/orders');
      }
      return;
    }
    fetchOrders();
  }, [user, authLoading, router, addToast]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const currentToken = token || localStorage.getItem('token');
      if (!currentToken) return;

      const res = await fetch('/api/orders/my', {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        setError('Failed to retrieve orders');
      }
    } catch {
      setError('Connection error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'delivered':
        return <span className="status-badge delivered">✓ Delivered</span>;
      case 'shipped':
        return <span className="status-badge shipped">🚚 In Transit</span>;
      case 'processing':
        return <span className="status-badge processing">⚙️ Processing</span>;
      case 'cancelled':
        return <span className="status-badge cancelled">✕ Cancelled</span>;
      case 'pending':
      default:
        return <span className="status-badge pending">⏳ Order Placed</span>;
    }
  };

  if (loading || authLoading) {
    return (
      <ClientLayout>
        <div className="orders-loading">
          <div className="spinner"></div>
          <p>Retrieving your order records...</p>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="orders-page-root">
        <div className="orders-container">
          <div className="orders-header">
            <div>
              <span className="header-tag">CUSTOMER DASHBOARD</span>
              <h1 className="orders-title">My Orders & Tracking</h1>
              <p className="orders-subtitle">View and monitor the fulfillment status of your purchased laptops</p>
            </div>
            <button onClick={fetchOrders} className="refresh-btn">
              <span>🔄</span> Refresh Status
            </button>
          </div>

          {error && (
            <div className="orders-error-card">
              <span>⚠️ {error}</span>
              <button onClick={fetchOrders} className="retry-btn">Try Again</button>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="orders-empty-card">
              <span className="empty-icon">📦</span>
              <h2>No Orders Yet</h2>
              <p>You have not placed any orders yet. Browse our UAE laptop showroom to make your first purchase.</p>
              <Link href="/products" className="browse-laptops-btn">
                Browse UAE Inventory →
              </Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order._id} className="order-card">
                  {/* Order Card Top Bar */}
                  <div className="order-top-bar">
                    <div className="order-meta-group">
                      <span className="order-number-label">Order</span>
                      <strong className="order-number">#{order.orderNumber}</strong>
                      <span className="order-date">
                        {new Date(order.orderDate).toLocaleDateString('en-AE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="order-status-group">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Line Items List */}
                  <div className="order-items-grid">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="order-item-row">
                        <img
                          src={item.image || '/placeholder.jpg'}
                          alt={item.name}
                          className="item-thumb"
                          onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                        />
                        <div className="item-details">
                          <h4 className="item-name">{item.name}</h4>
                          <span className="item-qty">Quantity: {item.quantity || 1}</span>
                        </div>
                        <div className="item-price">
                          AED {(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer & Tracking */}
                  <div className="order-card-footer">
                    <div className="delivery-info">
                      <span className="info-label">DELIVER TO:</span>
                      <span className="info-address">
                        {order.customerInfo?.address ? `${order.customerInfo.address}, ${order.customerInfo.city}, UAE` : 'Showroom Delivery'}
                      </span>
                      {order.trackingNumber && (
                        <div className="tracking-pill">
                          <span>Courier Tracking:</span>
                          <strong>{order.trackingNumber}</strong>
                        </div>
                      )}
                    </div>

                    <div className="order-total-block">
                      <div className="total-label">Total Payable</div>
                      <div className="total-amount">AED {Number(order.totalAmount || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Order Actions: Track Order & WhatsApp */}
                  <div className="order-assist-bar">
                    <Link
                      href={`/track/${encodeURIComponent(order.trackingNumber || order.orderNumber)}`}
                      className="track-order-link"
                    >
                      <span>📍 Track Live Delivery →</span>
                    </Link>

                    <a
                      href={`https://wa.me/971509550121?text=${encodeURIComponent(`Hello Al Mukammal, I am inquiring regarding my Order #${order.orderNumber}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wa-help-link"
                    >
                      <span>💬 Chat with Support</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .orders-page-root {
          min-height: 100vh;
          background: var(--bg-default, #ffffff);
          color: var(--text-primary, #080808);
          padding: 3.5rem 1.5rem 6rem;
        }

        .orders-container {
          max-width: var(--container-max, 1280px);
          margin: 0 auto;
        }

        .orders-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .header-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--blue-primary, #0866ff);
          background: var(--blue-soft, #eaf3ff);
          border: 1px solid rgba(8, 102, 255, 0.15);
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 0.85rem;
        }

        .orders-title {
          font-size: clamp(2.2rem, 3.5vw + 0.5rem, 3rem);
          font-weight: 850;
          letter-spacing: -0.03em;
          margin: 0 0 0.5rem 0;
          color: var(--text-primary, #080808);
        }

        .orders-subtitle {
          font-size: 1.05rem;
          color: var(--text-secondary, #5f6368);
          margin: 0;
        }

        .refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 9999px;
          padding: 0.65rem 1.35rem;
          color: var(--text-primary, #080808);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: #ffffff;
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .orders-error-card {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #b91c1c;
        }

        .retry-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 9999px;
          padding: 0.45rem 1rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .orders-empty-card {
          background: #ffffff;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 28px;
          padding: 5rem 2rem;
          text-align: center;
          max-width: 600px;
          margin: 2rem auto;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
        }

        .empty-icon {
          font-size: 3.5rem;
          display: block;
          margin-bottom: 1.25rem;
        }

        .orders-empty-card h2 {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-primary, #080808);
          margin: 0 0 0.5rem 0;
        }

        .orders-empty-card p {
          color: var(--text-secondary, #5f6368);
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0 0 2rem 0;
        }

        .browse-laptops-btn {
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

        .browse-laptops-btn:hover {
          background: var(--blue-primary, #0866ff);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(8, 102, 255, 0.3);
        }

        /* Order Cards List */
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .order-card {
          background: #ffffff;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
          transition: border-color 0.2s;
        }

        .order-card:hover {
          border-color: #cbd5e1;
        }

        .order-top-bar {
          background: #f7f8fa;
          border-bottom: 1px solid var(--border-subtle, #e5e7eb);
          padding: 1.35rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .order-meta-group {
          display: flex;
          align-items: baseline;
          gap: 0.6rem;
        }

        .order-number-label {
          color: var(--text-secondary, #5f6368);
          font-size: 0.82rem;
          font-weight: 600;
        }

        .order-number {
          font-size: 1.15rem;
          color: var(--text-primary, #080808);
          font-weight: 800;
        }

        .order-date {
          color: var(--text-secondary, #5f6368);
          font-size: 0.82rem;
          margin-left: 0.5rem;
        }

        .status-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 750;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .status-badge.pending {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        .status-badge.processing {
          background: var(--blue-soft, #eaf3ff);
          color: var(--blue-primary, #0866ff);
          border: 1px solid rgba(8, 102, 255, 0.2);
        }

        .status-badge.shipped {
          background: #faf5ff;
          color: #7e22ce;
          border: 1px solid #e9d5ff;
        }

        .status-badge.delivered {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .status-badge.cancelled {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .order-items-grid {
          padding: 1.75rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .order-item-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--border-subtle, #e5e7eb);
        }

        .order-item-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .item-thumb {
          width: 64px;
          height: 64px;
          object-fit: contain;
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 14px;
          padding: 0.4rem;
          flex-shrink: 0;
        }

        .item-details {
          flex: 1;
        }

        .item-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary, #080808);
          margin: 0 0 0.3rem 0;
        }

        .item-qty {
          font-size: 0.8rem;
          color: var(--text-secondary, #5f6368);
        }

        .item-price {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--blue-primary, #0866ff);
        }

        .order-card-footer {
          padding: 1.35rem 2rem;
          background: #f7f8fa;
          border-top: 1px solid var(--border-subtle, #e5e7eb);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.25rem;
        }

        .delivery-info {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .info-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-secondary, #5f6368);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .info-address {
          font-size: 0.9rem;
          color: var(--text-primary, #080808);
          font-weight: 500;
        }

        .tracking-pill {
          font-size: 0.78rem;
          color: var(--blue-primary, #0866ff);
          font-weight: 600;
          margin-top: 0.25rem;
        }

        .order-total-block {
          text-align: right;
        }

        .total-label {
          font-size: 0.78rem;
          color: var(--text-secondary, #5f6368);
        }

        .total-amount {
          font-size: 1.5rem;
          font-weight: 850;
          color: var(--text-primary, #080808);
        }

        .order-assist-bar {
          padding: 0.9rem 2rem;
          background: #ffffff;
          border-top: 1px solid var(--border-subtle, #e5e7eb);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--text-secondary, #5f6368);
        }

        .track-order-link {
          color: #0866ff;
          text-decoration: none;
          font-weight: 750;
          font-size: 0.88rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eff6ff;
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid #dbeafe;
          transition: all 0.2s ease;
        }

        .track-order-link:hover {
          background: #0866ff;
          color: #ffffff;
          border-color: #0866ff;
        }

        .wa-help-link {
          color: #16a34a;
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .wa-help-link:hover {
          text-decoration: underline;
        }

        .orders-loading {
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