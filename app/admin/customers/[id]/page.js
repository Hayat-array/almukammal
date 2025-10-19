'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/app/ClientLayout';
import Link from 'next/link';

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id;
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user: authUser, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authUser?.role === 'admin') {
      router.push('/orders');
      return;
    }
    fetchCustomer();
  }, [customerId, token, router]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${customerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
        setOrders(data.orders || []);
      } else {
        setError('Customer not found');
      }
    } catch (err) {
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
            <p>Loading customer...</p>
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (error || !customer) {
    return (
      <ClientLayout>
        <div style={{ minHeight: '80vh', padding: '2rem' }}>
          <div style={{ textAlign: 'center' }}>Customer not found</div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div style={{ minHeight: '80vh', padding: '2rem 0', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <Link href="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: '#3b82f6', textDecoration: 'none' }}>
            ← Back to Orders
          </Link>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            {/* Customer Info */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{customer.name}</h1>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div><strong>Email:</strong> {customer.email}</div>
                <div><strong>Phone:</strong> {customer.phone}</div>
                <div><strong>Address:</strong> {customer.address}, {customer.city}, {customer.country} {customer.postalCode}</div>
                <div><strong>Total Orders:</strong> {orders.length}</div>
                <div><strong>Total Spent:</strong> ${orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}</div>
              </div>
            </div>

            {/* Orders Summary */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recent Orders</h2>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {orders.slice(0, 5).map(order => (
                  <div key={order._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}># {order.orderNumber}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{new Date(order.orderDate).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600' }}>${order.totalAmount.toFixed(2)}</div>
                      <span style={{ background: getStatusColor(order.status), color: 'white', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* All Orders Table */}
          {orders.length > 0 && (
            <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>All Orders</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Order #</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Items</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem' }}># {order.orderNumber}</td>
                        <td style={{ padding: '0.75rem' }}>{new Date(order.orderDate).toLocaleDateString()}</td>
                        <td style={{ padding: '0.75rem' }}>{order.items.length} items</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>${order.totalAmount.toFixed(2)}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ background: getStatusColor(order.status), color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {0% { transform: rotate(0deg); }100% { transform: rotate(360deg); }}
        function getStatusColor(status) {
          const colors = {pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444'};
          return colors[status] || '#6b7280';
        }
      `}</style>
    </ClientLayout>
  );
}