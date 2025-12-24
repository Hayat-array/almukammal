'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '../ClientLayout';
import Link from 'next/link';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const currentToken = token || localStorage.getItem('token');

      if (!currentToken) {
        setError('Please login to view your orders');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/orders/my', {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
      } else {
        setError('Failed to load orders');
      }

    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Error loading orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'shipped': return '#8b5cf6';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (authLoading || loading) {
    return (
      <ClientLayout>
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading your orders...</p>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </ClientLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ClientLayout>
      <div style={{
        minHeight: '80vh',
        padding: '2rem 0',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  background: '#3b82f6',
                  color: 'white',
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem'
                }}>
                  <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#1f2937'
                  }}>
                    My Orders
                  </h1>
                  <p style={{ color: '#6b7280' }}>
                    Track and manage your orders
                  </p>
                </div>
              </div>
              <button
                onClick={fetchOrders}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #ef4444',
                color: '#991b1b',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            {/* Orders List */}
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{
                  width: '5rem',
                  height: '5rem',
                  background: '#f3f4f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <svg style={{ width: '2.5rem', height: '2.5rem', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  No orders yet
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                  You haven't placed any orders yet.
                </p>
                <Link
                  href="/products"
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600'
                  }}
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {orders.map(order => (
                  <div key={order._id} style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '1.5rem'
                  }}>
                    {/* Order Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                          Order #{order.orderNumber}
                        </h3>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          Placed on {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span style={{
                        background: getStatusColor(order.status || 'pending'),
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {order.status || 'Pending'}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div style={{ marginBottom: '1rem' }}>
                      {(order.items || []).map((item, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: index < order.items.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                          <div>
                            <p style={{ fontWeight: '500', color: '#374151' }}>{item.name || item.product || 'Product'}</p>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Qty: {item.quantity || 1}</p>
                          </div>
                          <p style={{ fontWeight: '600', color: '#1f2937' }}>
                            AED {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '1rem',
                      borderTop: '2px solid #e5e7eb'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Amount</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                          AED {(order.totalAmount || 0).toLocaleString()}
                        </p>
                      </div>
                      {order.trackingNumber && (
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Tracking Number</p>
                          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#3b82f6' }}>
                            {order.trackingNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </ClientLayout>
  );
}