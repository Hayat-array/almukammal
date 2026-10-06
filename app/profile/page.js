'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import ClientLayout from '@/app/ClientLayout';

const UAE_EMIRATES = [
    'Dubai',
    'Abu Dhabi',
    'Sharjah',
    'Ajman',
    'Ras Al Khaimah',
    'Fujairah',
    'Umm Al Quwain'
];

export default function ProfilePage() {
    const { user, token, logout, updateUser, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'address', 'security', 'danger'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        dob: '',
        street: '',
        city: '',
        emirate: 'Dubai',
        country: 'United Arab Emirates'
    });

    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordSaving, setPasswordSaving] = useState(false);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCreds, setDeleteCreds] = useState({ password: '', dob: '' });
    const [deleting, setDeleting] = useState(false);

    // Fetch user profile from API on mount
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
            return;
        }

        if (user) {
            fetchUserProfile();
        }
    }, [user, authLoading, router]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const currentToken = token || localStorage.getItem('token');
            const res = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                const u = data.user || user;
                setFormData({
                    name: u.name || '',
                    email: u.email || '',
                    phone: u.phone || '',
                    dob: u.dob ? new Date(u.dob).toISOString().split('T')[0] : '',
                    street: u.address?.street || (typeof u.address === 'string' ? u.address : ''),
                    city: u.address?.city || u.city || '',
                    emirate: u.address?.state || u.state || 'Dubai',
                    country: 'United Arab Emirates'
                });
            } else {
                // Fallback to authContext user data
                setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
                    street: user.address?.street || '',
                    city: user.address?.city || '',
                    emirate: user.address?.state || 'Dubai',
                    country: 'United Arab Emirates'
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePersonal = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const currentToken = token || localStorage.getItem('token');
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    dob: formData.dob || undefined
                })
            });

            const data = await res.json();
            if (res.ok) {
                showToast('Personal details updated successfully!', 'success');
                if (updateUser && data.user) {
                    updateUser(data.user);
                }
            } else {
                showToast(data.error || 'Failed to update profile', 'error');
            }
        } catch (err) {
            showToast('Network error while saving profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const currentToken = token || localStorage.getItem('token');
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    address: {
                        street: formData.street,
                        city: formData.city,
                        state: formData.emirate,
                        country: 'United Arab Emirates',
                        zipCode: '00000'
                    }
                })
            });

            const data = await res.json();
            if (res.ok) {
                showToast('Shipping address saved!', 'success');
                if (updateUser && data.user) {
                    updateUser(data.user);
                }
            } else {
                showToast(data.error || 'Failed to save address', 'error');
            }
        } catch (err) {
            showToast('Network error while saving address', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }

        setPasswordSaving(true);
        try {
            const currentToken = token || localStorage.getItem('token');
            const res = await fetch('/api/user/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await res.json();
            if (res.ok) {
                showToast('Password updated successfully! Please keep it secure.', 'success');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                showToast(data.error || 'Failed to change password', 'error');
            }
        } catch (err) {
            showToast('Error changing password', 'error');
        } finally {
            setPasswordSaving(false);
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        if (!deleteCreds.password || !deleteCreds.dob) {
            showToast('Please provide your password and Date of Birth to verify deletion', 'error');
            return;
        }

        setDeleting(true);
        try {
            const currentToken = token || localStorage.getItem('token');
            const res = await fetch('/api/user/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    password: deleteCreds.password,
                    dateOfBirth: deleteCreds.dob
                })
            });

            const data = await res.json();
            if (res.ok) {
                showToast('Account permanently closed. We are sorry to see you go.', 'info');
                setShowDeleteModal(false);
                logout();
                router.push('/');
            } else {
                showToast(data.error || 'Verification failed. Cannot delete account.', 'error');
            }
        } catch (err) {
            showToast('Network error during account deletion', 'error');
        } finally {
            setDeleting(false);
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
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading your profile...</p>
                    </div>
                </div>
            </ClientLayout>
        );
    }

    const initials = (formData.name || user?.name || 'Customer')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <ClientLayout>
            <div style={{
                minHeight: '90vh',
                background: 'var(--bg-canvas)',
                padding: '40px 16px 80px'
            }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

                    {/* Top Identity Banner */}
                    <div style={{
                        background: 'var(--bg-dark, #0B0B0D)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '28px',
                        padding: '32px',
                        marginBottom: '32px',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '24px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{
                                width: '76px',
                                height: '76px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: '1.75rem',
                                fontWeight: 800,
                                boxShadow: 'var(--glow-sm)',
                                border: '3px solid rgba(255, 255, 255, 0.15)',
                                flexShrink: 0
                            }}>
                                {initials}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                    <h1 style={{ fontSize: '1.65rem', fontWeight: 850, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                                        {formData.name || 'Valued Customer'}
                                    </h1>
                                    <span style={{
                                        background: 'rgba(8, 102, 255, 0.2)',
                                        color: '#60a5fa',
                                        border: '1px solid rgba(8, 102, 255, 0.4)',
                                        padding: '3px 12px',
                                        borderRadius: '9999px',
                                        fontSize: '0.72rem',
                                        fontWeight: 750,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {user?.role === 'admin' ? 'Administrator' : 'Verified Buyer'}
                                    </span>
                                </div>
                                <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: 0 }}>
                                    {formData.email} • Default Shipping: <span style={{ color: '#60a5fa', fontWeight: 600 }}>{formData.emirate}, UAE</span>
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <Link
                                href="/orders"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 22px',
                                    borderRadius: '9999px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    fontSize: '0.88rem',
                                    fontWeight: 650,
                                    transition: 'all 0.2s'
                                }}
                            >
                                📦 My Orders
                            </Link>
                            {user?.role === 'admin' && (
                                <Link
                                    href="/admin"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 20px',
                                        borderRadius: 'var(--radius-full)',
                                        background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
                                        color: '#ffffff',
                                        textDecoration: 'none',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        boxShadow: 'var(--glow-sm)'
                                    }}
                                >
                                    ⚡ Admin Portal
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Main Layout Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '260px 1fr',
                        gap: '32px',
                        alignItems: 'start'
                    }}>

                        {/* Navigation Sidebar */}
                        <div style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                        }}>
                            {[
                                { id: 'personal', label: 'Personal Information', icon: '👤' },
                                { id: 'address', label: 'UAE Shipping Address', icon: '📍' },
                                { id: 'security', label: 'Password & Security', icon: '🔒' },
                                { id: 'danger', label: 'Danger Zone', icon: '⚠️', isDanger: true }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: 'var(--radius-pill)',
                                        border: activeTab === tab.id
                                            ? '1px solid rgba(37, 99, 235, 0.4)'
                                            : '1px solid transparent',
                                        background: activeTab === tab.id
                                            ? 'rgba(37, 99, 235, 0.12)'
                                            : 'transparent',
                                        color: activeTab === tab.id
                                            ? (tab.isDanger ? '#ef4444' : 'var(--brand-primary)')
                                            : (tab.isDanger ? '#ef4444' : 'var(--text-secondary)'),
                                        fontSize: '0.9rem',
                                        fontWeight: activeTab === tab.id ? 700 : 500,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}

                            <div style={{ margin: '16px 0', borderTop: '1px solid var(--border-subtle)' }} />

                            <button
                                onClick={() => {
                                    logout();
                                    router.push('/');
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: 'var(--radius-pill)',
                                    border: '1px solid var(--border-subtle)',
                                    background: 'transparent',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span>🚪</span>
                                <span>Sign Out</span>
                            </button>
                        </div>

                        {/* Content Area */}
                        <div style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '32px',
                            boxShadow: 'var(--shadow-md)'
                        }}>

                            {/* TAB 1: PERSONAL DETAILS */}
                            {activeTab === 'personal' && (
                                <div>
                                    <div style={{ marginBottom: '24px' }}>
                                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                                            Personal Information
                                        </h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                                            Update your personal contact details used for UAE courier dispatches and WhatsApp tracking.
                                        </p>
                                    </div>

                                    <form onSubmit={handleSavePersonal} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    borderRadius: 'var(--radius-pill)',
                                                    background: 'var(--bg-card)',
                                                    border: '1px solid var(--border-subtle)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.95rem',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                    Email Address (Verified)
                                                </label>
                                                <input
                                                    type="email"
                                                    disabled
                                                    value={formData.email}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 16px',
                                                        borderRadius: 'var(--radius-pill)',
                                                        background: 'rgba(255, 255, 255, 0.02)',
                                                        border: '1px solid var(--border-subtle)',
                                                        color: 'var(--text-muted)',
                                                        fontSize: '0.95rem',
                                                        cursor: 'not-allowed'
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                    Phone / WhatsApp (UAE +971) *
                                                </label>
                                                <input
                                                    type="tel"
                                                    required
                                                    placeholder="+971 50 123 4567"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 16px',
                                                        borderRadius: 'var(--radius-pill)',
                                                        background: 'var(--bg-card)',
                                                        border: '1px solid var(--border-subtle)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '0.95rem',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                Date of Birth (Security Factor)
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.dob}
                                                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    maxWidth: '300px',
                                                    padding: '12px 16px',
                                                    borderRadius: 'var(--radius-pill)',
                                                    background: 'var(--bg-card)',
                                                    border: '1px solid var(--border-subtle)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.95rem',
                                                    outline: 'none'
                                                }}
                                            />
                                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                                                🔒 Your DOB is used as an additional security challenge for password resets and sensitive account changes.
                                            </span>
                                        </div>

                                        <div style={{ marginTop: '12px' }}>
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '14px 28px',
                                                    borderRadius: 'var(--radius-full)',
                                                    background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
                                                    border: 'none',
                                                    color: '#ffffff',
                                                    fontSize: '0.95rem',
                                                    fontWeight: 700,
                                                    cursor: saving ? 'not-allowed' : 'pointer',
                                                    boxShadow: 'var(--glow-sm)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* TAB 2: UAE SHIPPING ADDRESS */}
                            {activeTab === 'address' && (
                                <div>
                                    <div style={{ marginBottom: '24px' }}>
                                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                                            Default UAE Shipping Address
                                        </h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                                            Used to auto-fill checkout for prompt laptop deliveries across the United Arab Emirates.
                                        </p>
                                    </div>

                                    <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                Emirate *
                                            </label>
                                            <select
                                                value={formData.emirate}
                                                onChange={e => setFormData({ ...formData, emirate: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    borderRadius: 'var(--radius-pill)',
                                                    background: 'var(--bg-card)',
                                                    border: '1px solid var(--border-subtle)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.95rem',
                                                    outline: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {UAE_EMIRATES.map(em => (
                                                    <option key={em} value={em} style={{ background: '#ffffff', color: '#080808' }}>
                                                        {em}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                Street, Building, Apartment / Villa No. *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Al Fahidi St, Building 14, Flat 204"
                                                value={formData.street}
                                                onChange={e => setFormData({ ...formData, street: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    borderRadius: 'var(--radius-pill)',
                                                    background: 'var(--bg-card)',
                                                    border: '1px solid var(--border-subtle)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.95rem',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                    Area / District / Landmark
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Deira, Bur Dubai, Business Bay"
                                                    value={formData.city}
                                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 16px',
                                                        borderRadius: 'var(--radius-pill)',
                                                        background: 'var(--bg-card)',
                                                        border: '1px solid var(--border-subtle)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '0.95rem',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                    Country
                                                </label>
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={formData.country}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 16px',
                                                        borderRadius: 'var(--radius-pill)',
                                                        background: 'rgba(255, 255, 255, 0.02)',
                                                        border: '1px solid var(--border-subtle)',
                                                        color: 'var(--text-muted)',
                                                        fontSize: '0.95rem',
                                                        cursor: 'not-allowed'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '12px' }}>
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '14px 28px',
                                                    borderRadius: 'var(--radius-full)',
                                                    background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
                                                    border: 'none',
                                                    color: '#ffffff',
                                                    fontSize: '0.95rem',
                                                    fontWeight: 700,
                                                    cursor: saving ? 'not-allowed' : 'pointer',
                                                    boxShadow: 'var(--glow-sm)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {saving ? 'Saving Address...' : 'Save Default Address'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* TAB 3: PASSWORD & SECURITY */}
                            {activeTab === 'security' && (
                                <div>
                                    <div style={{ marginBottom: '24px' }}>
                                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                                            Password & Account Security
                                        </h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                                            Ensure your account is protected with a high-entropy password of at least 8 characters.
                                        </p>
                                    </div>

                                    <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                Current Password *
                                            </label>
                                            <input
                                                type="password"
                                                required
                                                value={passwordData.currentPassword}
                                                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    borderRadius: 'var(--radius-pill)',
                                                    background: 'var(--bg-card)',
                                                    border: '1px solid var(--border-subtle)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.95rem',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                    New Password (min 8 chars) *
                                                </label>
                                                <input
                                                    type="password"
                                                    required
                                                    minLength={8}
                                                    value={passwordData.newPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 16px',
                                                        borderRadius: 'var(--radius-pill)',
                                                        background: 'var(--bg-card)',
                                                        border: '1px solid var(--border-subtle)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '0.95rem',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                    Confirm New Password *
                                                </label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordData.confirmPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 16px',
                                                        borderRadius: 'var(--radius-pill)',
                                                        background: 'var(--bg-card)',
                                                        border: '1px solid var(--border-subtle)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '0.95rem',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '12px' }}>
                                            <button
                                                type="submit"
                                                disabled={passwordSaving}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '14px 28px',
                                                    borderRadius: 'var(--radius-full)',
                                                    background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
                                                    border: 'none',
                                                    color: '#ffffff',
                                                    fontSize: '0.95rem',
                                                    fontWeight: 700,
                                                    cursor: passwordSaving ? 'not-allowed' : 'pointer',
                                                    boxShadow: 'var(--glow-sm)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {passwordSaving ? 'Updating Password...' : 'Update Password'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* TAB 4: DANGER ZONE */}
                            {activeTab === 'danger' && (
                                <div>
                                    <div style={{ marginBottom: '24px' }}>
                                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ef4444', margin: '0 0 6px 0' }}>
                                            Danger Zone
                                        </h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                                            Permanently delete your user account, orders history, and saved address information.
                                        </p>
                                    </div>

                                    <div style={{
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        background: 'rgba(239, 68, 68, 0.05)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '20px'
                                    }}>
                                        <div>
                                            <h4 style={{ color: '#ef4444', fontWeight: 700, margin: '0 0 6px 0' }}>
                                                Close & Delete Account
                                            </h4>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, maxWidth: '480px' }}>
                                                Once deleted, your account cannot be recovered. For security verification, you will need to verify your password and Date of Birth.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteModal(true)}
                                            style={{
                                                padding: '12px 24px',
                                                borderRadius: 'var(--radius-pill)',
                                                background: '#ef4444',
                                                border: 'none',
                                                color: '#ffffff',
                                                fontWeight: 700,
                                                fontSize: '0.875rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Delete My Account
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>

            {/* DELETE ACCOUNT SECURITY MODAL */}
            {showDeleteModal && (
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
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: 'var(--radius-xl)',
                        maxWidth: '480px',
                        width: '100%',
                        padding: '32px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            color: '#ef4444',
                            margin: '0 auto 16px'
                        }}>
                            ⚠️
                        </div>

                        <h3 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                            Verify Account Deletion
                        </h3>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 24px 0' }}>
                            This action cannot be undone. Enter your credentials to verify ownership.
                        </p>

                        <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                    Current Password *
                                </label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Enter your password"
                                    value={deleteCreds.password}
                                    onChange={e => setDeleteCreds({ ...deleteCreds, password: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: 'var(--radius-pill)',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                    Date of Birth (Security Challenge) *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={deleteCreds.dob}
                                    onChange={e => setDeleteCreds({ ...deleteCreds, dob: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: 'var(--radius-pill)',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: 'var(--radius-pill)',
                                        background: 'transparent',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleting}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: 'var(--radius-pill)',
                                        background: '#ef4444',
                                        border: 'none',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        cursor: deleting ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {deleting ? 'Verifying...' : 'Permanently Delete'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ClientLayout>
    );
}