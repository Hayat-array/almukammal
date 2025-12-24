'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '../ClientLayout';
import Link from 'next/link';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/auth/admin/login');
            } else {
                setLoading(false);
            }
        }
    }, [user, authLoading, router]);

    if (loading || authLoading) {
        return (
            <ClientLayout>
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '48px', height: '48px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                        <p style={{ color: '#6b7280' }}>Loading Dashboard...</p>
                    </div>
                </div>
            </ClientLayout>
        );
    }

    const modules = [
        { title: 'Orders', desc: 'Manage customer orders', link: '/admin/orders', color: '#2563eb', icon: '📦' },
        { title: 'Coupons', desc: 'Create & manage codes', link: '/admin/coupons', color: '#9333ea', icon: '🎟️' },
        { title: 'Discounts', desc: 'Set sales & offers', link: '/admin/discounts', color: '#ea580c', icon: '🔥' },
        { title: 'Bulk Data', desc: 'Import/Delete Products', link: '/auth/admin/products/bulk-import', color: '#10b981', icon: '📊' },
        { title: 'Settings', desc: 'Delivery & Restrictions', link: '/admin/settings', color: '#374151', icon: '⚙️' },
        { title: 'Admin Panel', desc: 'Users, Products & Stats', link: '/auth/admin/main', color: '#dc2626', icon: '🛠️' },
    ];

    console.log('Admin modules loaded:', modules.length);

    return (
        <ClientLayout>
            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '32px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>Admin Dashboard</h1>
                        <p style={{ color: '#6b7280', margin: 0 }}>Welcome back, {user?.name}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px' }}>
                        {modules.map((mod, idx) => (
                            <Link href={mod.link} key={idx} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    border: '1px solid #e5e7eb',
                                    overflow: 'hidden',
                                    height: '100%',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                                    }}>
                                    <div style={{ background: mod.color, padding: '20px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '32px' }}>{mod.icon}</span>
                                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{mod.title}</h3>
                                    </div>
                                    <div style={{ padding: '20px' }}>
                                        <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>{mod.desc}</p>
                                        <div style={{ color: '#2563eb', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
                                            Access Module
                                            <span style={{ marginLeft: '8px' }}>→</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '24px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: '0 0 20px 0' }}>Quick Stats</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px' }}>
                                <p style={{ color: '#2563eb', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>Total Orders</p>
                                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>--</p>
                            </div>
                            <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px' }}>
                                <p style={{ color: '#16a34a', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>Active Coupons</p>
                                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>--</p>
                            </div>
                            <div style={{ background: '#faf5ff', padding: '16px', borderRadius: '8px' }}>
                                <p style={{ color: '#9333ea', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>Customers</p>
                                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>--</p>
                            </div>
                            <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '8px' }}>
                                <p style={{ color: '#ea580c', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>Revenue</p>
                                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>AED --</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
