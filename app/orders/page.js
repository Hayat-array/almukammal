
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '../ClientLayout';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [apiStatus, setApiStatus] = useState('');
  const [usingMockData, setUsingMockData] = useState(false);
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  // Mock data function
  const getMockOrders = () => {
    const mockOrders = [
      {
        _id: '1',
        orderNumber: 'ORD-2024-001',
        orderDate: '2024-01-15',
        status: 'delivered',
        totalAmount: 2499.99,
        items: [
          {
            product: 'Gaming Beast Pro',
            quantity: 1,
            price: 2499.99
          }
        ],
        customer: {
          name: user?.name || 'John Doe',
          email: user?.email || 'john@example.com'
        },
        trackingNumber: 'TRK123456789',
        estimatedDelivery: '2024-01-20'
      },
      {
        _id: '2',
        orderNumber: 'ORD-2024-002',
        orderDate: '2024-01-20',
        status: 'processing',
        totalAmount: 1899.99,
        items: [
          {
            product: 'Business Elite',
            quantity: 1,
            price: 1899.99
          }
        ],
        customer: {
          name: user?.name || 'John Doe',
          email: user?.email || 'john@example.com'
        },
        trackingNumber: 'TRK987654321',
        estimatedDelivery: '2024-01-25'
      },
      {
        _id: '3',
        orderNumber: 'ORD-2024-003',
        orderDate: '2024-01-10',
        status: 'shipped',
        totalAmount: 3299.99,
        items: [
          {
            product: 'Creative Studio',
            quantity: 1,
            price: 3299.99
          }
        ],
        customer: {
          name: user?.name || 'John Doe',
          email: user?.email || 'john@example.com'
        },
        trackingNumber: 'TRK456789123',
        estimatedDelivery: '2024-01-18'
      }
    ];
    
    return mockOrders;
  };

  useEffect(() => {
    // Wait for auth to finish loading
    if (!authLoading) {
      setInitialLoad(false);
      
      // If user is not authenticated, redirect to login
      if (!user) {
        console.log('User not authenticated, redirecting to login');
        router.push('/auth/login');
        return;
      }

      // If authenticated, fetch orders
      console.log('User authenticated, fetching orders');
      fetchOrders();
    }
  }, [user, authLoading, router]);

  // ✅ FIXED! NO LOGIN LOOP - BULLETPROOF!
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      setApiStatus('Fetching orders...');
      
      // ✅ FIXED! NO LOOP - CHECK TOKEN ONCE!
      if (!token && !localStorage.getItem('token')) {
        console.log('👤 No token - using mock data');
        setApiStatus('👤 Guest mode - Demo orders');
        setOrders(getMockOrders());
        setUsingMockData(true);
        setLoading(false);
        return;
      }

      // ✅ USER ORDERS API - NOT ADMIN!
      const currentToken = token || localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setApiStatus(`✅ Loaded ${data.orders?.length || 0} orders!`);
        setUsingMockData(false);
      } else if (response.status === 401) {
        // ✅ FIXED! ONE-TIME REDIRECT - NO LOOP!
        console.log('🔑 Token expired - ONE redirect');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => router.replace('/auth/login'), 1000); // replace = NO LOOP!
        return;
      } else {
        console.log('🔄 API unavailable - Demo mode');
        setApiStatus('🔄 Demo orders');
        setOrders(getMockOrders());
        setUsingMockData(true);
      }
      
    } catch (err) {
      console.error('❌ Orders ERROR:', err);
      setApiStatus('🔄 Demo orders');
      setOrders(getMockOrders());
      setUsingMockData(true);
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log(`Updating order ${orderId} to status: ${newStatus}`);
      
      // If using mock data, just update locally
      if (usingMockData) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
        return;
      }
      
      // Try API call if not using mock data
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Refresh orders list
        fetchOrders();
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        const errorText = await response.text();
        console.error('Update order status error:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.error || 'Failed to update order status');
        } catch (e) {
          setError(`Server error: ${response.status}`);
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Network error. Please try again.');
    }
  };

  // Show initial loading while checking authentication
  if (initialLoad || authLoading) {
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
            <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading...</p>
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

  // If not authenticated after loading, return null (will redirect)
  if (!user) {
    return null;
  }

  // Admin view - Order Management
  if (user.role === 'admin') {
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
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
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
                    Order Management
                  </h1>
                  <p style={{ color: '#6b7280' }}>
                    View and manage all customer orders
                    {usingMockData && (
                      <span style={{ 
                        marginLeft: '0.5rem', 
                        fontSize: '0.875rem', 
                        color: '#f59e0b',
                        fontStyle: 'italic'
                      }}>
                        (Using Demo Data)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Debug Info - Remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div style={{ 
                  background: '#f0f9ff', 
                  border: '1px solid #bae6fd',
                  color: '#0369a1',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}>
                  Debug: {apiStatus}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div style={{ 
                  background: '#fee2e2', 
                  border: '1px solid #ef4444',
                  color: '#991b1b',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{error}</span>
                  <button 
                    onClick={() => setError('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#991b1b',
                      cursor: 'pointer',
                      fontSize: '1.25rem'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #e5e7eb',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1rem'
                  }}></div>
                  <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
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
                    No orders found
                  </h3>
                  <p style={{ color: '#6b7280' }}>
                    There are no orders in the system yet.
                  </p>
                  <button 
                    onClick={fetchOrders}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                  >
                    Refresh
                  </button>
                </div>
              ) : (
                /* Orders Table */
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '0.875rem'
                  }}>
                    <thead>
                      <tr style={{ 
                        background: '#f3f4f6', 
                        borderBottom: '2px solid #e5e7eb'
                      }}>
                        <th style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#374151'
                        }}>Order #</th>
                        <th style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#374151'
                        }}>Customer</th>
                        <th style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#374151'
                        }}>Items</th>
                        <th style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#374151'
                        }}>Total</th>
                        <th style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#374151'
                        }}>Status</th>
                        <th style={{ 
                          padding: '0.75rem', 
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#374151'
                        }}>Date</th>
                        <th style={{ 
                          padding: '0.75rem', 
                          textAlign: 'center',
                          fontWeight: '600',
                          color: '#374151'
                        }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order._id} style={{ 
                          borderBottom: '1px solid #e5e7eb',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                        }}
                        >
                          <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                            #{order.orderNumber}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {order.customer?.name || 'N/A'}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {order.items?.length || 0} items
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                            ${(order.totalAmount || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <select
                              value={order.status || 'pending'}
                              onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                              style={{
                                padding: '0.375rem 0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #d1d5db',
                                fontSize: '0.875rem',
                                background: 'white',
                                cursor: 'pointer',
                                minWidth: '120px'
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                            {new Date(order.orderDate || Date.now()).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <button
                              style={{
                                padding: '0.375rem 0.75rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#2563eb';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#3b82f6';
                              }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

  // Regular user view - Personal Orders
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
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
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
                  {usingMockData && (
                    <span style={{ 
                      marginLeft: '0.5rem', 
                      fontSize: '0.875rem', 
                      color: '#f59e0b',
                      fontStyle: 'italic'
                    }}>
                      (Using Demo Data)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Debug Info - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ 
                background: '#f0f9ff', 
                border: '1px solid #bae6fd',
                color: '#0369a1',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                Debug: {apiStatus}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{ 
                background: '#fee2e2', 
                border: '1px solid #ef4444',
                color: '#991b1b',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{error}</span>
                <button 
                  onClick={() => setError('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#991b1b',
                    cursor: 'pointer',
                    fontSize: '1.25rem'
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
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
            ) : orders.length === 0 ? (
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
                    background: '#dc2626',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    transition: 'background-color 0.2s'
                  }}
                >
                  Start Shopping
                </Link>
                <button 
                  onClick={fetchOrders}
                  style={{
                    marginLeft: '1rem',
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Refresh
                </button>
              </div>
            ) : (
              /* Orders List */
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {orders.map(order => (
                  <div key={order._id} style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                  >
                    {/* Order Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                          Order #{order.orderNumber}
                        </h3>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          Placed on {new Date(order.orderDate || Date.now()).toLocaleDateString()}
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
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                          <div>
                            <p style={{ fontWeight: '500', color: '#374151' }}>{item.product || 'Product'}</p>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Qty: {item.quantity || 1}</p>
                          </div>
                          <p style={{ fontWeight: '600', color: '#1f2937' }}>
                            ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
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
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Amount</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                          ${(order.totalAmount || 0).toFixed(2)}
                        </p>
                      </div>
                      <button 
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontWeight: '500',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#3b82f6';
                        }}
                      >
                        View Details
                      </button>
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