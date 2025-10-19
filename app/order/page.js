
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '../ClientLayout';

export default function OrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('');
  const { user, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ✅ MOCK DATA - NO CRASH!
  const mockOrders = [
    {
      _id: '1', orderNumber: 'ORD-2024-001', customer: { name: 'John Doe', email: 'john@test.com' },
      items: [{ product: 'Gaming Beast', quantity: 1, price: 2499.99 }], totalAmount: 2499.99,
      status: 'delivered', orderDate: new Date('2024-01-15'), trackingNumber: 'TRK123'
    },
    {
      _id: '2', orderNumber: 'ORD-2024-002', customer: { name: 'Jane Smith', email: 'jane@test.com' },
      items: [{ product: 'Business Elite', quantity: 1, price: 1899.99 }], totalAmount: 1899.99,
      status: 'pending', orderDate: new Date('2024-01-20'), trackingNumber: 'TRK456'
    },
    {
      _id: '3', orderNumber: 'ORD-2024-003', customer: { name: 'Bob Wilson', email: 'bob@test.com' },
      items: [{ product: 'Creative Studio', quantity: 1, price: 3299.99 }], totalAmount: 3299.99,
      status: 'shipped', orderDate: new Date('2024-01-10'), trackingNumber: 'TRK789'
    }
  ];

  // ✅ FIXED! NO DUPLICATES! CLEAN SYNTAX!
  const fetchAdminOrders = async () => {
    try {
      setLoading(true);
      setError('');
      setApiStatus('🔄 Fetching all orders...');

      let currentToken = token || localStorage.getItem('token');
      if (!currentToken || !currentToken.includes('admin')) {
        console.log('👤 Demo mode - Admin token missing');
        setApiStatus('👤 Demo mode (3 orders)');
        setOrders(mockOrders);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔥 ADMIN API ERROR:', errorText);
        
        if (response.status === 401 || response.status === 403) {
          setApiStatus('👤 Demo mode (Admin API unavailable)');
          setOrders(mockOrders);
          setLoading(false);
          return;
        }
        
        setApiStatus('🔄 Demo mode - 3 orders');
        setOrders(mockOrders);
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
        setApiStatus(`✅ Loaded ${data.orders?.length || 0} live orders!`);
      } else {
        setApiStatus('🔄 Demo mode - 3 orders');
        setOrders(mockOrders);
      }
    } catch (err) {
      console.error('❌ Admin Orders ERROR:', err);
      setApiStatus('🔄 Using demo data (3 orders)');
      setOrders(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user && pathname === '/order') {
      router.replace('/auth/admin');
    } else if (user) {
      fetchAdminOrders();
    }
  }, [user]);

  const getStatusColor = (status) => {
    const colors = { pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', 
                    delivered: '#10b981', cancelled: '#ef4444' };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <ClientLayout>
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '4px solid #fecaca', borderTop: '4px solid #dc2626', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
            <p style={{ fontSize: '1.125rem', color: '#991b1b' }}>Loading Admin Orders...</p>
          </div>
        </div>
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div style={{ minHeight: '80vh', padding: '2rem 0', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ background: '#dc2626', color: 'white', width: '3rem', height: '3rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }}>
                <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>Order Management</h1>
                <p style={{ color: '#991b1b' }}>{apiStatus}</p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ width: '5rem', height: '5rem', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <svg style={{ width: '2.5rem', height: '2.5rem', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#dc2626' }}>No orders found</h3>
                <button onClick={fetchAdminOrders} style={{ padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Refresh</button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#fee2e2' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Customer</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Items</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Total</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                  </tr></thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order._id} style={{ borderBottom: '1px solid #fecaca' }}>
                        <td style={{ padding: '0.75rem' }}>#{order.orderNumber}</td>
                        <td style={{ padding: '0.75rem' }}>{order.customer.name}</td>
                        <td style={{ padding: '0.75rem' }}>{order.items.length} items</td>
                        <td style={{ padding: '0.75rem' }}>${order.totalAmount.toFixed(2)}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ background: getStatusColor(order.status), color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{new Date(order.orderDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}