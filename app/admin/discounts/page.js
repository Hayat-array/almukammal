'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ClientLayout from '../../ClientLayout';
import Link from 'next/link';

export default function AdminDiscountsPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '', type: 'site-wide', target: '', value: '', valueType: 'percentage', startDate: '', endDate: ''
    });

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/auth/admin/login');
                return;
            }
            fetchDiscounts();
        }
    }, [user, authLoading, router]);

    const fetchDiscounts = async () => {
        try {
            const res = await fetch('/api/admin/discounts', {
                headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.success) setDiscounts(data.discounts);
            else setError(data.error);
        } catch (err) {
            setError('Failed to load discounts');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this discount?')) return;
        try {
            const res = await fetch(`/api/admin/discounts?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` }
            });
            if (res.ok) {
                fetchDiscounts();
                setError('');
            }
        } catch (err) {
            setError('Failed to delete discount');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('/api/admin/discounts', {
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
                setFormData({ name: '', type: 'site-wide', target: '', value: '', valueType: 'percentage', startDate: '', endDate: '' });
                fetchDiscounts();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to create discount');
        }
    };

    if (loading || authLoading) {
        return (
            <ClientLayout>
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '48px', height: '48px', border: '4px solid #ea580c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                        <p style={{ color: '#6b7280' }}>Loading Discounts...</p>
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
                            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>Discount Rules</h1>
                            <p style={{ color: '#6b7280', margin: 0 }}>Create dynamic pricing rules</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Link href="/admin" style={{ padding: '10px 16px', background: '#374151', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
                                ← Back
                            </Link>
                            <button
                                onClick={() => { setShowForm(!showForm); setError(''); }}
                                style={{ padding: '10px 20px', background: '#ea580c', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                            >
                                {showForm ? '✕ Cancel' : '+ New Discount'}
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
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>Create New Discount</h2>
                            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Discount Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Summer Sale 2024"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Scope *</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value, target: '' })}
                                        style={{ width: '100%', padding: '10px 12px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                    >
                                        <option value="site-wide">Site Wide</option>
                                        <option value="category">Category</option>
                                        <option value="product">Product</option>
                                    </select>
                                </div>

                                {formData.type !== 'site-wide' && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                            {formData.type === 'category' ? 'Category Name *' : 'Product ID *'}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={formData.type === 'category' ? 'e.g., Laptops' : 'Product ID'}
                                            required
                                            value={formData.target}
                                            onChange={e => setFormData({ ...formData, target: e.target.value })}
                                            style={{ width: '100%', padding: '10px 12px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Type *</label>
                                    <select
                                        value={formData.valueType}
                                        onChange={e => setFormData({ ...formData, valueType: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat (AED)</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                        {formData.valueType === 'percentage' ? 'Percentage *' : 'Amount (AED) *'}
                                    </label>
                                    <input
                                        type="number"
                                        placeholder={formData.valueType === 'percentage' ? '25' : '50'}
                                        required
                                        min="0"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>End Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '2px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    style={{ gridColumn: '1 / -1', background: '#16a34a', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                                >
                                    ✓ Create Discount
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Discounts Table */}
                    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#ea580c', color: 'white' }}>
                                    <tr>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Scope</th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Discount</th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Duration</th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {discounts.map(discount => {
                                        const now = new Date();
                                        const start = new Date(discount.startDate || Date.now());
                                        const end = new Date(discount.endDate);
                                        const isActive = now >= start && now <= end && discount.isActive;

                                        return (
                                            <tr key={discount._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                <td style={{ padding: '16px', fontWeight: 'bold', color: '#111827' }}>{discount.name}</td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '500' }}>
                                                        {discount.type === 'site-wide' && 'Site Wide'}
                                                        {discount.type === 'category' && `${discount.target}`}
                                                        {discount.type === 'product' && 'Product'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', fontWeight: '600', color: '#ea580c' }}>
                                                    {discount.valueType === 'percentage' ? `${discount.value}% OFF` : `AED ${discount.value} OFF`}
                                                </td>
                                                <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                                                    {start.toLocaleDateString('en-GB')}<br />
                                                    to {end.toLocaleDateString('en-GB')}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        background: isActive ? '#d1fae5' : '#f3f4f6',
                                                        color: isActive ? '#065f46' : '#6b7280'
                                                    }}>
                                                        {isActive ? '✓ Active' : '○ Inactive'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleDelete(discount._id)}
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
                                    {discounts.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏷️</div>
                                                <p style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 8px 0' }}>No discount rules created yet</p>
                                                <p style={{ fontSize: '14px', margin: 0 }}>Create your first discount to boost sales!</p>
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
