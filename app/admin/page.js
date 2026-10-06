'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '../ClientLayout';

export default function AdminDashboard() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();

    const [stats, setStats] = useState({
        ordersCount: 0,
        revenue: 0,
        pendingOrders: 0,
        productsCount: 0,
        customersCount: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

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
            fetchDashboardOverview();
        }
    }, [user, authLoading, router]);

    const fetchDashboardOverview = async () => {
        try {
            setLoading(true);
            const currentToken = token || localStorage.getItem('token');

            // Parallel fetch of orders and products
            const [ordersRes, productsRes] = await Promise.all([
                fetch('/api/orders', {
                    headers: { 'Authorization': `Bearer ${currentToken}` }
                }),
                fetch('/api/products')
            ]);

            let ordersList = [];
            if (ordersRes.ok) {
                const data = await ordersRes.json();
                ordersList = data.orders || [];
            }

            let productsList = [];
            if (productsRes.ok) {
                const data = await productsRes.json();
                productsList = data.products || [];
            }

            const revenue = ordersList.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
            const pending = ordersList.filter(o => o.status === 'pending').length;

            setStats({
                ordersCount: ordersList.length,
                revenue,
                pendingOrders: pending,
                productsCount: productsList.length,
                customersCount: new Set(ordersList.map(o => o.customerInfo?.email || o.customer?.email)).size
            });

            setRecentOrders(ordersList.slice(0, 5));
        } catch (err) {
            console.error('Error loading dashboard overview:', err);
        } finally {
            setLoading(false);
        }
    };

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
                        <p style={{ color: 'var(--text-muted)' }}>Loading Command Center...</p>
                    </div>
                </div>
            </ClientLayout>
        );
    }

    const modules = [
        {
            title: 'Orders Control',
            desc: 'Review, process, dispatch, and track customer laptop shipments across the Emirates.',
            link: '/admin/orders',
            badge: `${stats.pendingOrders} Pending`,
            icon: '📦',
            color: 'var(--brand-primary)'
        },
        {
            title: 'Fleet & Logistics Command',
            desc: 'Monitor live shipments, assign delivery partners, handle exception escalations and proof of delivery.',
            link: '/admin/logistics',
            badge: 'Live Dispatch',
            icon: '🚚',
            color: '#2563eb'
        },
        {
            title: 'Inventory & Catalog',
            desc: 'Add new laptop models, configure hardware specifications, and edit AED retail prices.',
            link: '/admin/products',
            badge: `${stats.productsCount} Models`,
            icon: '💻',
            color: '#3b82f6'
        },
        {
            title: 'Promotional Coupons',
            desc: 'Generate discount promo codes, set minimum cart requirements, and manage expiry limits.',
            link: '/admin/coupons',
            badge: 'Active Engine',
            icon: '🎟️',
            color: '#8b5cf6'
        },
        {
            title: 'Discounts & Sales',
            desc: 'Configure category-wide sales, seasonal markdowns, and product flash deals.',
            link: '/admin/discounts',
            badge: 'Automated',
            icon: '🔥',
            color: '#ec4899'
        },
        {
            title: 'Store Settings',
            desc: 'Manage UAE free delivery thresholds, flat shipping fees, and store operational status.',
            link: '/admin/settings',
            badge: 'UAE Rules',
            icon: '⚙️',
            color: '#10b981'
        },
        {
            title: 'Customer Directory',
            desc: 'Browse registered customer profiles, contact numbers, and purchase frequencies.',
            link: '/admin/customers',
            badge: 'Directory',
            icon: '👥',
            color: '#f59e0b'
        },
        {
            title: 'Bulk Data Engine',
            desc: 'Import hundreds of laptop SKUs via CSV spreadsheets or wipe sample inventory in bulk.',
            link: '/auth/admin/products/bulk-import',
            badge: 'CSV Import',
            icon: '📊',
            color: '#06b6d4'
        }
    ];

    return (
        <ClientLayout>
            <div style={{
                minHeight: '90vh',
                background: 'var(--bg-canvas)',
                padding: '36px 16px 80px'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                    {/* Command Center Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '20px',
                        marginBottom: '36px'
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <span style={{
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    boxShadow: '0 0 10px #10b981'
                                }} />
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                                    Al Mukammal Operations
                                </span>
                            </div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                Admin Command Center
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                                Signed in as <strong style={{ color: 'var(--brand-primary)' }}>{user?.name || 'Administrator'}</strong> • Dubai Showroom Hub
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <Link
                                href="/products"
                                target="_blank"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    textDecoration: 'none',
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                }}
                            >
                                🌐 View Public Storefront
                            </Link>
                            <Link
                                href="/admin/orders"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 22px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    boxShadow: 'var(--glow-sm)'
                                }}
                            >
                                📦 Process Orders ({stats.pendingOrders})
                            </Link>
                        </div>
                    </div>

                    {/* KPI Metrics Ribbon */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '20px',
                        marginBottom: '40px'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, var(--bg-surface) 100%)',
                            border: '1px solid rgba(37, 99, 235, 0.3)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '24px'
                        }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                Total Gross Revenue
                            </span>
                            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
                                AED {stats.revenue.toLocaleString()}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified online orders</span>
                        </div>

                        <div style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '24px'
                        }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                Total Orders
                            </span>
                            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
                                {stats.ordersCount}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lifetime transactions</span>
                        </div>

                        <div style={{
                            background: stats.pendingOrders > 0
                                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, var(--bg-surface) 100%)'
                                : 'var(--bg-surface)',
                            border: stats.pendingOrders > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '24px'
                        }}>
                            <span style={{ fontSize: '0.75rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                Action Required
                            </span>
                            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f59e0b', marginTop: '8px' }}>
                                {stats.pendingOrders}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending fulfillment</span>
                        </div>

                        <div style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '24px'
                        }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                Catalog Laptops
                            </span>
                            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
                                {stats.productsCount}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active laptop models</span>
                        </div>
                    </div>

                    {/* Operational Modules Deck */}
                    <div style={{ marginBottom: '48px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                Management Modules
                            </h2>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                7 Enterprise Control Panels
                            </span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '20px'
                        }}>
                            {modules.map((mod, idx) => (
                                <Link
                                    key={idx}
                                    href={mod.link}
                                    style={{
                                        textDecoration: 'none',
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.5)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-subtle)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem'
                                        }}>
                                            {mod.icon}
                                        </div>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            padding: '4px 10px',
                                            borderRadius: 'var(--radius-full)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            color: 'var(--text-secondary)',
                                            border: '1px solid var(--border-subtle)'
                                        }}>
                                            {mod.badge}
                                        </span>
                                    </div>

                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                                        {mod.title}
                                    </h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 20px 0', lineHeight: 1.5, flex: 1 }}>
                                        {mod.desc}
                                    </p>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: 'var(--brand-primary)',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        marginTop: 'auto'
                                    }}>
                                        Open Module <span>→</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Recent Orders Overview */}
                    <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '24px',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                    Recent UAE Orders
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
                                    Latest customer orders requiring dispatch
                                </p>
                            </div>
                            <Link
                                href="/admin/orders"
                                style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--brand-primary)',
                                    fontWeight: 600,
                                    textDecoration: 'none'
                                }}
                            >
                                View All Orders →
                            </Link>
                        </div>

                        {recentOrders.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0', margin: 0 }}>
                                No orders in the database yet.
                            </p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Order #</th>
                                            <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Customer</th>
                                            <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Emirate</th>
                                            <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</th>
                                            <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map(order => (
                                            <tr key={order._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                                                </td>
                                                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                                                    {order.customerInfo?.fullName || order.customer?.name || 'Customer'}
                                                </td>
                                                <td style={{ padding: '14px 16px', color: 'var(--brand-primary)', fontWeight: 600 }}>
                                                    {order.shippingAddress?.state || 'Dubai'}
                                                </td>
                                                <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                    AED {Number(order.totalAmount || 0).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <span style={{
                                                        padding: '3px 10px',
                                                        borderRadius: 'var(--radius-full)',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        textTransform: 'capitalize',
                                                        background: order.status === 'delivered' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                        color: order.status === 'delivered' ? '#10b981' : '#f59e0b',
                                                        border: `1px solid ${order.status === 'delivered' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                                                    }}>
                                                        {order.status}
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
