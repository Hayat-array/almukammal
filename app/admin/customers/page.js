'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/app/ClientLayout';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not admin
    if (!user) {
      router.push('/auth/admin/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }

    // Fetch customers
    fetchCustomers();
  }, [user, router]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');

      const currentToken = token || localStorage.getItem('token');

      if (!currentToken) {
        setError('No authentication token. Please login again.');
        router.push('/auth/admin/login');
        return;
      }

      const response = await fetch('/api/admin/customers', {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('Unauthorized. Please login as admin.');
          router.push('/auth/admin/login');
          return;
        }
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();

      if (data.success) {
        setCustomers(data.customers || []);
      } else {
        setError(data.error || 'Failed to load customers');
      }

    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Error loading customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
              border: '4px solid #bfdbfe',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ fontSize: '1.125rem', color: '#1e40af' }}>Loading Customers...</p>
          </div>
        </div>
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </ClientLayout>
    );
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
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                  👥 Customer Management
                </h1>
                <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                  {customers.length} registered {customers.length === 1 ? 'customer' : 'customers'} from database
                </p>
              </div>
              <button
                onClick={fetchCustomers}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '600'
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

            {/* Customers Table */}
            {customers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{
                  width: '5rem',
                  height: '5rem',
                  background: '#dbeafe',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <svg style={{ width: '2.5rem', height: '2.5rem', color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#3b82f6', marginBottom: '0.5rem' }}>
                  No customers yet
                </h3>
                <p style={{ color: '#6b7280' }}>
                  Customers will appear here when they register accounts
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Customer</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Phone</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Joined</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(customer => (
                      <tr key={customer._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '600', color: '#1f2937' }}>{customer.name}</div>
                          {customer.city && (
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{customer.city}</div>
                          )}
                        </td>
                        <td style={{ padding: '1rem', color: '#6b7280' }}>{customer.email}</td>
                        <td style={{ padding: '1rem', color: '#6b7280' }}>{customer.phone || 'N/A'}</td>
                        <td style={{ padding: '1rem', color: '#6b7280' }}>
                          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{
                            background: customer.emailVerified ? '#10b981' : '#f59e0b',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {customer.emailVerified ? 'Verified' : 'Pending'}
                          </span>
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
    </ClientLayout>
  );
}