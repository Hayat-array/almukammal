'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/app/ClientLayout';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCustomers();
    }
  }, [token]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading customers...</div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div style={{ minHeight: '80vh', padding: '2rem 0', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>👥 Customer Management</h1>
              <span style={{ color: '#10b981', fontWeight: '600' }}>{customers.length} Customers</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Customer</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Phone</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Orders</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Total Spent</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => (
                    <tr key={customer._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600' }}>{customer.name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{customer.city}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>{customer.email}</td>
                      <td style={{ padding: '1rem' }}>{customer.phone}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{ background: '#3b82f6', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                          {customer.orderCount}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>
                        ${customer.totalSpent?.toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <Link href={`/admin/customers/${customer._id}`}>
                          <button style={{ 
                            padding: '0.5rem 1rem', 
                            background: '#dc2626', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '0.5rem', 
                            cursor: 'pointer' 
                          }}>
                            View Details
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}