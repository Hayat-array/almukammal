'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '../../ClientLayout';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/auth/admin/login');
                return;
            }

            if (user.role !== 'admin') {
                router.push('/');
                return;
            }

            fetchOrders();
        }
    }, [user, authLoading, router]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError('');

            const currentToken = token || localStorage.getItem('token');

            if (!currentToken) {
                setError('Authentication required');
                router.push('/auth/admin/login');
                return;
            }

            const response = await fetch('/api/orders', {
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
            } else if (response.status === 401 || response.status === 403) {
                setError('Unauthorized access');
                router.push('/auth/admin/login');
            } else {
                setError('Failed to load orders');
            }

        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Error loading orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#f59e0b',
            processing: '#3b82f6',
            shipped: '#8b5cf6',
            delivered: '#10b981',
            cancelled: '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    if (authLoading || loading) {
        return (
            <ClientLayout>
                <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            border: '4px solid #fecaca',
                            borderTop: '4px solid #dc2626',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 1rem'
                        }}></div>
                        <p style={{ fontSize: '1.125rem', color: '#991b1b' }}>Loading Orders...</p>
                    </div>
                </div>
                <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </ClientLayout>
        );
    }

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <ClientLayout>
            <div style={{ minHeight: '80vh', padding: '2rem 0', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' }}>
                <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
                    <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    background: '#dc2626',
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
                                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
                                        Order Management
                                    </h1>
                                    <p style={{ color: '#991b1b' }}>
                                        {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={fetchOrders}
                                style={{
                                    background: '#dc2626',
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

                        {/* Orders Table */}
                        {orders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>
                                <div style={{
                                    width: '5rem',
                                    height: '5rem',
                                    background: '#fee2e2',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1rem'
                                }}>
                                    <svg style={{ width: '2.5rem', height: '2.5rem', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.5rem' }}>
                                    No orders yet
                                </h3>
                                <p style={{ color: '#6b7280' }}>
                                    Orders will appear here when customers make purchases
                                </p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#fee2e2' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#991b1b' }}>Order #</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#991b1b' }}>Customer</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#991b1b' }}>Items</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#991b1b' }}>Total</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#991b1b' }}>Status</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#991b1b' }}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => (
                                            <tr key={order._id} style={{ borderBottom: '1px solid #fecaca' }}>
                                                <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                                                    #{order.orderNumber}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <div>{order.customerInfo?.fullName || order.customer?.name || 'N/A'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                        {order.customerInfo?.email || order.customer?.email || ''}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {order.items?.length || 0} items
                                                </td>
                                                <td style={{ padding: '0.75rem', fontWeight: '600', color: '#10b981' }}>
                                                    AED {Number(order.totalAmount || 0).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        background: getStatusColor(order.status),
                                                        color: 'white',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '0.25rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                                                    {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
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
            <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </ClientLayout>
    );
}
