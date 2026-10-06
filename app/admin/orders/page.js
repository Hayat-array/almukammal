'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import ClientLayout from '@/app/ClientLayout';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
    processing: { label: 'Processing', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' },
    shipped: { label: 'Shipped', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)' },
    delivered: { label: 'Delivered', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
};

export default function AdminOrdersPage() {
    const { user, token, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/auth/admin/login');
                return;
            }
            if (user.role !== 'admin' && user.role !== 'manager') {
                router.push('/');
                return;
            }
            fetchOrders();
        }
    }, [user, authLoading, router]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const currentToken = token || localStorage.getItem('token');
            const res = await fetch('/api/orders', {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            } else {
                showToast('Failed to fetch orders from server', 'error');
            }
        } catch (err) {
            console.error('Error fetching admin orders:', err);
            showToast('Error loading orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        setUpdatingOrderId(orderId);
        try {
            const currentToken = token || localStorage.getItem('token');
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await res.json();
            if (res.ok) {
                showToast(`Order status updated to "${newStatus}"`, 'success');
                // Update local list
                setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
                if (selectedOrder && selectedOrder._id === orderId) {
                    setSelectedOrder(prev => ({ ...prev, status: newStatus }));
                }
            } else {
                showToast(data.error || 'Failed to update order status', 'error');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            showToast('Network error while updating status', 'error');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    // Calculate quick stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const processingCount = orders.filter(o => o.status === 'processing').length;
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;

    // Filtered orders
    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const q = searchQuery.toLowerCase().trim();
        if (!q) return matchesStatus;

        const customerName = (order.customerInfo?.fullName || order.customer?.name || '').toLowerCase();
        const customerEmail = (order.customerInfo?.email || order.customer?.email || '').toLowerCase();
        const orderNum = (order.orderNumber || '').toString().toLowerCase();

        return matchesStatus && (customerName.includes(q) || customerEmail.includes(q) || orderNum.includes(q));
    });

    if (authLoading || loading) {
        return (
            <ClientLayout>
                <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            border: '3px solid var(--border-subtle)',
                            borderTopColor: 'var(--brand-primary)',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto 16px'
                        }} />
                        <p style={{ color: 'var(--text-muted)' }}>Loading orders management...</p>
                    </div>
                </div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout>
            <div style={{
                minHeight: '90vh',
                background: 'var(--bg-canvas)',
                padding: '32px 16px 80px'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                    {/* Navigation Breadcrumb */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>
                        <Link href="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Admin Dashboard</Link>
                        <span style={{ color: 'var(--text-muted)' }}>/</span>
                        <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Orders Management</span>
                    </div>

                    {/* Page Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px',
                        marginBottom: '32px'
                    }}>
                        <div>
                            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                                UAE Orders Control Center
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                                Track, dispatch, and fulfill customer laptop orders across the Emirates.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={fetchOrders}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 18px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                🔄 Refresh Orders
                            </button>
                        </div>
                    </div>

                    {/* KPI Metrics Strip */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginBottom: '32px'
                    }}>
                        <div style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '20px'
                        }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Revenue</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-secondary)', marginTop: '6px' }}>
                                AED {totalRevenue.toLocaleString()}
                            </div>
                        </div>

                        <div style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '20px'
                        }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Orders</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
                                {totalOrders}
                            </div>
                        </div>

                        <div style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '20px'
                        }}>
                            <span style={{ fontSize: '0.75rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>Pending Action</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', marginTop: '6px' }}>
                                {pendingCount}
                            </div>
                        </div>

                        <div style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '20px'
                        }}>
                            <span style={{ fontSize: '0.75rem', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 700 }}>Processing</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', marginTop: '6px' }}>
                                {processingCount}
                            </div>
                        </div>

                        <div style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '20px'
                        }}>
                            <span style={{ fontSize: '0.75rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Delivered</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>
                                {deliveredCount}
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '16px 20px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: 'var(--radius-full)',
                                        border: statusFilter === status
                                            ? '1px solid var(--brand-primary)'
                                            : '1px solid var(--border-subtle)',
                                        background: statusFilter === status
                                            ? 'rgba(37, 99, 235, 0.15)'
                                            : 'transparent',
                                        color: statusFilter === status
                                            ? 'var(--brand-primary)'
                                            : 'var(--text-secondary)',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        textTransform: 'capitalize',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        <div style={{ position: 'relative', minWidth: '280px' }}>
                            <input
                                type="text"
                                placeholder="Search customer, order #..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px 10px 36px',
                                    borderRadius: 'var(--radius-pill)',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.85rem',
                                    outline: 'none'
                                }}
                            />
                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                🔍
                            </span>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        {filteredOrders.length === 0 ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div>
                                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 6px 0' }}>
                                    No orders found
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                                    Try adjusting your search query or status filter.
                                </p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{
                                            borderBottom: '1px solid var(--border-subtle)',
                                            background: 'rgba(255, 255, 255, 0.02)'
                                        }}>
                                            <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Order #</th>
                                            <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Customer & Destination</th>
                                            <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Items</th>
                                            <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Amount</th>
                                            <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Status Action</th>
                                            <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Date</th>
                                            <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map(order => {
                                            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                                            const customerName = order.customerInfo?.fullName || order.customer?.name || 'Customer';
                                            const customerEmail = order.customerInfo?.email || order.customer?.email || '';
                                            const emirate = order.shippingAddress?.state || order.shippingAddress?.emirate || 'UAE';

                                            return (
                                                <tr
                                                    key={order._id}
                                                    style={{
                                                        borderBottom: '1px solid var(--border-subtle)',
                                                        transition: 'background 0.2s'
                                                    }}
                                                >
                                                    <td style={{ padding: '18px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                        #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                                                    </td>

                                                    <td style={{ padding: '18px 20px' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{customerName}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            {customerEmail} • <span style={{ color: 'var(--brand-primary)' }}>{emirate}</span>
                                                        </div>
                                                    </td>

                                                    <td style={{ padding: '18px 20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                        {order.items?.length || 0} unit(s)
                                                    </td>

                                                    <td style={{ padding: '18px 20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                        AED {Number(order.totalAmount || 0).toLocaleString()}
                                                    </td>

                                                    <td style={{ padding: '18px 20px' }}>
                                                        <select
                                                            value={order.status}
                                                            disabled={updatingOrderId === order._id}
                                                            onChange={e => handleStatusUpdate(order._id, e.target.value)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                borderRadius: 'var(--radius-pill)',
                                                                background: statusCfg.bg,
                                                                border: `1px solid ${statusCfg.border}`,
                                                                color: statusCfg.color,
                                                                fontSize: '0.8rem',
                                                                fontWeight: 700,
                                                                outline: 'none',
                                                                cursor: updatingOrderId === order._id ? 'not-allowed' : 'pointer'
                                                            }}
                                                        >
                                                            <option value="pending" style={{ background: '#0f172a', color: '#fff' }}>Pending</option>
                                                            <option value="processing" style={{ background: '#0f172a', color: '#fff' }}>Processing</option>
                                                            <option value="shipped" style={{ background: '#0f172a', color: '#fff' }}>Shipped</option>
                                                            <option value="delivered" style={{ background: '#0f172a', color: '#fff' }}>Delivered</option>
                                                            <option value="cancelled" style={{ background: '#0f172a', color: '#fff' }}>Cancelled</option>
                                                        </select>
                                                    </td>

                                                    <td style={{ padding: '18px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                        {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                                                    </td>

                                                    <td style={{ padding: '18px 20px' }}>
                                                        <button
                                                            onClick={() => setSelectedOrder(order)}
                                                            style={{
                                                                padding: '6px 14px',
                                                                borderRadius: 'var(--radius-pill)',
                                                                background: 'rgba(255, 255, 255, 0.05)',
                                                                border: '1px solid var(--border-subtle)',
                                                                color: 'var(--text-primary)',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* ORDER DETAILS MODAL */}
            {selectedOrder && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-xl)',
                        maxWidth: '700px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '32px',
                        boxShadow: 'var(--shadow-xl)',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Order Summary
                                </span>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                                    #{selectedOrder.orderNumber || selectedOrder._id}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Customer & Address Details */}
                        <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px',
                            marginBottom: '24px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: '16px'
                        }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Customer Info</span>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                    {selectedOrder.customerInfo?.fullName || selectedOrder.customer?.name || 'N/A'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {selectedOrder.customerInfo?.email || selectedOrder.customer?.email || 'N/A'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--brand-secondary)' }}>
                                    📱 {selectedOrder.customerInfo?.phone || selectedOrder.customer?.phone || 'No phone'}
                                </div>
                            </div>

                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Delivery Address</span>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                                    {selectedOrder.shippingAddress?.street || 'N/A'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state || 'Dubai'}, United Arab Emirates
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                            Purchased Products
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                            {selectedOrder.items?.map((item, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 16px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-md)'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {item.name || item.product?.name || 'Product'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            Qty: {item.quantity} • Unit Price: AED {Number(item.price || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 800, color: 'var(--brand-secondary)' }}>
                                        AED {(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total Financial Summary */}
                        <div style={{
                            borderTop: '1px solid var(--border-subtle)',
                            paddingTop: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px'
                        }}>
                            <div>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Payment Method: </span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                                    {selectedOrder.paymentInfo?.method || 'Cash on Delivery / Direct UAE'}
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Grand Total</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                                    AED {Number(selectedOrder.totalAmount || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Quick WhatsApp Action */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <a
                                href={`https://wa.me/971509550121?text=${encodeURIComponent(`Hello Al Mukammal Team, inquiring on Order #${selectedOrder.orderNumber || selectedOrder._id}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: 'var(--radius-pill)',
                                    background: '#25D366',
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                💬 WhatsApp Customer Inquiry
                            </a>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: 'var(--radius-pill)',
                                    background: 'transparent',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </ClientLayout>
    );
}
