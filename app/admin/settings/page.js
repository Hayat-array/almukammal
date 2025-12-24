'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ClientLayout from '../../ClientLayout';
import Link from 'next/link';

export default function AdminSettingsPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/auth/admin/login');
                return;
            }
            fetchSettings();
        }
    }, [user, authLoading, router]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings', {
                headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.success) {
                setSettings(data.settings);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || localStorage.getItem('token')}`
                },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setMessage('success');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('error');
            }
        } catch (err) {
            setMessage('error');
        } finally {
            setSaving(false);
        }
    };

    if (loading || authLoading || !settings) {
        return (
            <ClientLayout>
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '48px', height: '48px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                        <p style={{ color: '#6b7280' }}>Loading Settings...</p>
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
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ marginBottom: '24px' }}>
                        <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', color: '#2563eb', textDecoration: 'none', marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>
                            <span style={{ marginRight: '4px' }}>←</span> Back to Dashboard
                        </Link>
                        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>Global Settings</h1>
                        <p style={{ color: '#6b7280', margin: 0 }}>Configure delivery charges and store restrictions</p>
                    </div>

                    {/* Success/Error Message */}
                    {message && (
                        <div style={{
                            marginBottom: '16px',
                            padding: '12px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            background: message === 'success' ? '#d1fae5' : '#fee2e2',
                            color: message === 'success' ? '#065f46' : '#991b1b',
                            border: `1px solid ${message === 'success' ? '#6ee7b7' : '#fca5a5'}`
                        }}>
                            <span>{message === 'success' ? '✓' : '⚠️'}</span>
                            <span>{message === 'success' ? 'Settings saved successfully!' : 'Failed to save settings'}</span>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                        {/* Delivery Settings */}
                        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                            <div style={{ background: '#2563eb', color: 'white', padding: '20px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Delivery Settings</h2>
                                <p style={{ color: '#bfdbfe', fontSize: '14px', margin: 0 }}>Configure shipping costs</p>
                            </div>

                            <div style={{ padding: '20px' }}>
                                {/* Delivery Type */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Delivery Type</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {[
                                            { value: 'flat', label: 'Flat Rate', desc: 'Fixed delivery charge' },
                                            { value: 'free', label: 'Free Delivery', desc: 'No shipping costs' },
                                            { value: 'amount-based', label: 'Threshold-Based', desc: 'Free above certain amount' }
                                        ].map(option => (
                                            <label key={option.value} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '12px',
                                                border: `2px solid ${settings.delivery?.type === option.value ? '#3b82f6' : '#e5e7eb'}`,
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                background: settings.delivery?.type === option.value ? '#eff6ff' : 'white',
                                                transition: 'all 0.2s'
                                            }}>
                                                <input
                                                    type="radio"
                                                    name="deliveryType"
                                                    value={option.value}
                                                    checked={settings.delivery?.type === option.value}
                                                    onChange={(e) => handleChange('delivery', 'type', e.target.value)}
                                                    style={{ width: '16px', height: '16px', marginRight: '12px', accentColor: '#3b82f6' }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{option.label}</span>
                                                    <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '8px' }}>{option.desc}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Base Cost */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Base Delivery Cost (AED)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={settings.delivery?.baseCost || 0}
                                        onChange={(e) => handleChange('delivery', 'baseCost', Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '10px 16px',
                                            border: '2px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '16px',
                                            fontWeight: '500',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                    />
                                </div>

                                {/* Threshold */}
                                {settings.delivery?.type === 'amount-based' && (
                                    <div style={{ background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '8px', padding: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Free Delivery Threshold (AED)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={settings.delivery?.freeDeliveryThreshold || 5000}
                                            onChange={(e) => handleChange('delivery', 'freeDeliveryThreshold', Number(e.target.value))}
                                            style={{
                                                width: '100%',
                                                padding: '10px 16px',
                                                border: '2px solid #93c5fd',
                                                borderRadius: '8px',
                                                fontSize: '16px',
                                                fontWeight: '500',
                                                outline: 'none'
                                            }}
                                        />
                                        <p style={{ fontSize: '12px', color: '#1d4ed8', marginTop: '8px', marginBottom: 0 }}>Orders above this amount get free shipping</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Store Restrictions */}
                        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                            <div style={{ background: '#dc2626', color: 'white', padding: '20px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Store Controls</h2>
                                <p style={{ color: '#fecaca', fontSize: '14px', margin: 0 }}>Manage restrictions</p>
                            </div>

                            <div style={{ padding: '20px' }}>
                                {/* Store Status */}
                                <div style={{ background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1f2937' }}>Store Status</div>
                                            <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                                {settings.store?.isOpen ? 'Accepting orders' : 'Orders disabled'}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleChange('store', 'isOpen', !settings.store?.isOpen)}
                                            style={{
                                                position: 'relative',
                                                display: 'inline-flex',
                                                height: '32px',
                                                width: '64px',
                                                alignItems: 'center',
                                                borderRadius: '9999px',
                                                background: settings.store?.isOpen ? '#22c55e' : '#d1d5db',
                                                border: 'none',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            <span style={{
                                                display: 'inline-block',
                                                height: '24px',
                                                width: '24px',
                                                transform: settings.store?.isOpen ? 'translateX(36px)' : 'translateX(4px)',
                                                borderRadius: '50%',
                                                background: 'white',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                transition: 'transform 0.2s'
                                            }} />
                                        </button>
                                    </div>
                                </div>

                                {/* Closed Message */}
                                {!settings.store?.isOpen && (
                                    <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Store Closed Message</label>
                                        <textarea
                                            value={settings.store?.closeMessage || ''}
                                            onChange={(e) => handleChange('store', 'closeMessage', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '2px solid #fca5a5',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                resize: 'none',
                                                outline: 'none',
                                                fontFamily: 'inherit'
                                            }}
                                            rows="3"
                                            placeholder="Message shown to customers"
                                        />
                                    </div>
                                )}

                                {/* Min Order */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Minimum Order Value (AED)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={settings.store?.minOrderValue || 0}
                                        onChange={(e) => handleChange('store', 'minOrderValue', Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '10px 16px',
                                            border: '2px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '16px',
                                            fontWeight: '500',
                                            outline: 'none'
                                        }}
                                    />
                                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>Set to 0 for no minimum</p>
                                </div>

                                {/* Max Order */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Maximum Order Limit (AED)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={settings.store?.maxOrderLimit || 0}
                                        onChange={(e) => handleChange('store', 'maxOrderLimit', Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '10px 16px',
                                            border: '2px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '16px',
                                            fontWeight: '500',
                                            outline: 'none'
                                        }}
                                    />
                                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', marginBottom: 0 }}>Set to 0 for unlimited</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                padding: '12px 32px',
                                background: saving ? '#9ca3af' : '#16a34a',
                                color: 'white',
                                borderRadius: '8px',
                                fontWeight: '600',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                border: 'none',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '16px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => !saving && (e.target.style.background = '#15803d')}
                            onMouseLeave={(e) => !saving && (e.target.style.background = '#16a34a')}
                        >
                            {saving ? (
                                <>
                                    <div style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>Save All Settings</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
