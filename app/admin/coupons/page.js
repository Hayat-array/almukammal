'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ClientLayout from '../../ClientLayout';
import Link from 'next/link';

export default function AdminCouponsPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        code: '', type: 'percentage', value: '', expiryDate: '', usageLimit: '', minOrderValue: '0', maxDiscount: ''
    });

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/auth/admin/login');
                return;
            }
            fetchCoupons();
        }
    }, [user, authLoading, router]);

    const fetchCoupons = async () => {
        try {
            const res = await fetch('/api/admin/coupons', {
                headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.success) setCoupons(data.coupons);
            else setError(data.error);
        } catch (err) {
            setError('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this coupon?')) return;
        try {
            const res = await fetch(`/api/admin/coupons?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` }
            });
            if (res.ok) {
                fetchCoupons();
                setError('');
            }
        } catch (err) {
            setError('Failed to delete coupon');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setShowForm(false);
                setFormData({ code: '', type: 'percentage', value: '', expiryDate: '', usageLimit: '', minOrderValue: '0', maxDiscount: '' });
                fetchCoupons();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to create coupon');
        }
    };

    if (loading || authLoading) {
        return (
            <ClientLayout>
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '48px', height: '48px', border: '4px solid #9333ea', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                        <p style={{ color: '#6b7280' }}>Loading Coupons...</p>
                    </div>
                </div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout>
            <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
            <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px 16px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>Coupon Management</h1>
                            <p style={{ color: '#6b7280', margin: 0 }}>Create and manage discount codes</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Link href="/admin" style={{ padding: '10px 16px', background: '#374151', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
                                ← Back
                            </Link>
                            <button
                                onClick={() => { setShowForm(!showForm); setError(''); }}
                                style={{ padding: '10px 20px', background: '#9333ea', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                            >
                                {showForm ? '✕ Cancel' : '+ New Coupon'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Create Form */}
                    {showForm && (
                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>Create New Coupon</h2>
                            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Coupon Code *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., SAVE20"
                                        required
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        style={{ width: '100%', padding: '10px 12px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat (AED)</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                        {formData.type === 'percentage' ? 'Percentage *' : 'Amount (AED) *'}
                                    </label>
                                    <input
                                        type="number"
                                        placeholder={formData.type === 'percentage' ? '20' : '100'}
                                        required
                                        min="0"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Expiry Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.expiryDate}
                                        onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Min Order (AED)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        value={formData.minOrderValue}
                                        onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Usage Limit</label>
                                    <input
                                        type="number"
                                        placeholder="Unlimited"
                                        min="1"
                                        value={formData.usageLimit}
                                        onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>

                                {formData.type === 'percentage' && (
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Max Discount (AED)</label>
                                        <input
                                            type="number"
                                            placeholder="Optional"
                                            min="0"
                                            value={formData.maxDiscount}
                                            onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })}
                                            style={{ width: '100%', padding: '10px 12px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    style={{ gridColumn: '1 / -1', background: '#16a34a', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                                >
                                    ✓ Create Coupon
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Coupons Table */}
                    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#9333ea', color: 'white' }}>
                                    <tr>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Code</th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Discount</th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Min Order</th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Expiry</th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Usage</th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coupons.map(coupon => {
                                        // Check expiry at end of day
                                        const expiryDate = new Date(coupon.expiryDate);
                                        expiryDate.setHours(23, 59, 59, 999);
                                        const isExpired = new Date() > expiryDate;
                                        const isLimitReached = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
                                        const isActive = !isExpired && !isLimitReached;

                                        return (
                                            <tr key={coupon._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#9333ea', background: '#f3e8ff', padding: '4px 12px', borderRadius: '20px', fontSize: '14px' }}>
                                                        {coupon.code}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', fontWeight: '600', color: '#111827' }}>
                                                    {coupon.type === 'percentage' ? `${coupon.value}%` : `AED ${coupon.value}`}
                                                    {coupon.maxDiscount && <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '4px' }}>(max {coupon.maxDiscount})</span>}
                                                </td>
                                                <td style={{ padding: '16px', color: '#6b7280' }}>AED {coupon.minOrderValue || 0}</td>
                                                <td style={{ padding: '16px', color: '#6b7280' }}>{new Date(coupon.expiryDate).toLocaleDateString('en-GB')}</td>
                                                <td style={{ padding: '16px', fontSize: '14px' }}>{coupon.usedCount} / {coupon.usageLimit || '∞'}</td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        background: isActive ? '#d1fae5' : '#fee2e2',
                                                        color: isActive ? '#065f46' : '#991b1b'
                                                    }}>
                                                        {isActive ? '✓ Active' : isExpired ? '✕ Expired' : '✕ Limit Reached'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleDelete(coupon._id)}
                                                        style={{ color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '500', padding: '6px 12px', borderRadius: '6px' }}
                                                        onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
                                                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {coupons.length === 0 && (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
                                                <p style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 8px 0' }}>No coupons created yet</p>
                                                <p style={{ fontSize: '14px', margin: 0 }}>Click "New Coupon" to create your first discount code!</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
