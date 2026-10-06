'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import ClientLayout from '@/app/ClientLayout';

export default function AdminProductsPage() {
    const { user, token, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // New product form
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: '',
        cpu: '',
        ram: '',
        storage: '',
        display: '',
        gpu: '',
        mainImageUrl: '',
        colors: 'Midnight, Space Gray, Silver'
    });

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
            fetchProducts();
        }
    }, [user, authLoading, router]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const currentToken = token || localStorage.getItem('token');
            const res = await fetch('/api/admin/products', {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
            } else {
                showToast('Failed to load products from database', 'error');
            }
        } catch (err) {
            console.error('Error fetching products:', err);
            showToast('Network error loading products', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const currentToken = token || localStorage.getItem('token');
            const formData = new FormData();
            formData.append('name', newProduct.name);
            formData.append('description', newProduct.description);
            formData.append('price', newProduct.price);
            formData.append('cpu', newProduct.cpu);
            formData.append('ram', newProduct.ram);
            formData.append('storage', newProduct.storage);
            formData.append('display', newProduct.display);
            formData.append('gpu', newProduct.gpu);
            formData.append('mainImageUrl', newProduct.mainImageUrl || '/images/laptop_showcase.png');
            formData.append('colors', newProduct.colors);

            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                showToast('Laptop model added to inventory successfully!', 'success');
                setShowAddModal(false);
                setNewProduct({
                    name: '',
                    description: '',
                    price: '',
                    cpu: '',
                    ram: '',
                    storage: '',
                    display: '',
                    gpu: '',
                    mainImageUrl: '',
                    colors: 'Midnight, Space Gray, Silver'
                });
                fetchProducts();
            } else {
                showToast(data.error || 'Failed to add product', 'error');
            }
        } catch (err) {
            console.error('Error creating product:', err);
            showToast('Network error creating product', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProduct = async (productId, name) => {
        if (!confirm(`Are you sure you want to permanently delete "${name}" from inventory?`)) return;

        try {
            const currentToken = token || localStorage.getItem('token');
            const res = await fetch('/api/admin/products', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ productId })
            });

            if (res.ok) {
                showToast(`"${name}" deleted successfully`, 'success');
                setProducts(prev => prev.filter(p => p.id !== productId && p._id !== productId));
            } else {
                showToast('Failed to delete product', 'error');
            }
        } catch (err) {
            showToast('Network error deleting product', 'error');
        }
    };

    const filteredProducts = products.filter(p => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        const name = (p.name || '').toLowerCase();
        const cpu = (p.specs?.cpu || '').toLowerCase();
        return name.includes(q) || cpu.includes(q);
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
                        <p style={{ color: 'var(--text-muted)' }}>Loading laptop catalog...</p>
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
                        <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Products & Inventory</span>
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
                                Laptop Inventory Catalog
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                                Manage premium laptop stock, hardware specifications, and retail pricing in AED.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <Link
                                href="/auth/admin/products/bulk-import"
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
                                    textDecoration: 'none'
                                }}
                            >
                                📊 Bulk CSV Import
                            </Link>
                            <button
                                onClick={() => setShowAddModal(true)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: 'var(--glow-sm)'
                                }}
                            >
                                ➕ Add New Laptop
                            </button>
                        </div>
                    </div>

                    {/* Search & Counter Bar */}
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
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredProducts.length}</strong> laptops in catalog
                        </div>

                        <div style={{ position: 'relative', minWidth: '300px' }}>
                            <input
                                type="text"
                                placeholder="Search by model, processor, specs..."
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

                    {/* Products Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '24px'
                    }}>
                        {filteredProducts.map(product => {
                            const pId = product.id || product._id;
                            const imgUrl = product.image?.startsWith('http') || product.image?.startsWith('/')
                                ? product.image
                                : (product.image ? `/${product.image}` : '/images/laptop_showcase.png');

                            return (
                                <div
                                    key={pId}
                                    style={{
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-lg)',
                                        overflow: 'hidden',
                                        boxShadow: 'var(--shadow-sm)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{
                                        position: 'relative',
                                        height: '200px',
                                        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '16px'
                                    }}>
                                        <Image
                                            src={imgUrl}
                                            alt={product.name || 'Laptop'}
                                            width={240}
                                            height={160}
                                            style={{
                                                objectFit: 'contain',
                                                maxHeight: '100%',
                                                maxWidth: '100%',
                                                filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.4))'
                                            }}
                                        />
                                    </div>

                                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                                            {product.name}
                                        </h3>

                                        {/* Specs Pills */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                                            {product.specs?.cpu && (
                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
                                                    {product.specs.cpu}
                                                </span>
                                            )}
                                            {product.specs?.ram && (
                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
                                                    {product.specs.ram}
                                                </span>
                                            )}
                                            {product.specs?.storage && (
                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
                                                    {product.specs.storage}
                                                </span>
                                            )}
                                            {product.specs?.gpu && (
                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--brand-primary)' }}>
                                                    {product.specs.gpu}
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                                            <div>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Price</span>
                                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                    AED {Number(product.price || 0).toLocaleString()}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <Link
                                                    href={`/products/${pId}`}
                                                    target="_blank"
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderRadius: 'var(--radius-pill)',
                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid var(--border-subtle)',
                                                        color: 'var(--text-primary)',
                                                        textDecoration: 'none',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    View
                                                </Link>
                                                <Link
                                                    href={`/auth/admin/products/edit/${pId}`}
                                                    style={{
                                                        padding: '8px 14px',
                                                        borderRadius: 'var(--radius-pill)',
                                                        background: '#0866FF',
                                                        color: '#ffffff',
                                                        textDecoration: 'none',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 700,
                                                        boxShadow: '0 2px 8px rgba(8, 102, 255, 0.3)'
                                                    }}
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteProduct(pId, product.name)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderRadius: 'var(--radius-pill)',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        color: '#ef4444',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </div>

            {/* ADD PRODUCT MODAL */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
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
                        boxShadow: 'var(--shadow-xl)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                Add New Laptop to Inventory
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                    Laptop Model & Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. MacBook Pro 16 M3 Max, ASUS ROG Zephyrus G16"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                        Price (AED) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        step="0.01"
                                        placeholder="e.g. 8499"
                                        value={newProduct.price}
                                        onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
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
                                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                        Image URL or Asset Path
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="/images/laptop_showcase.png"
                                        value={newProduct.mainImageUrl}
                                        onChange={e => setNewProduct({ ...newProduct, mainImageUrl: e.target.value })}
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
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                        CPU / Processor
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Apple M3 Max 16-Core / Intel Core i9-14900HX"
                                        value={newProduct.cpu}
                                        onChange={e => setNewProduct({ ...newProduct, cpu: e.target.value })}
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
                                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                        RAM Memory
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 36GB Unified / 32GB DDR5"
                                        value={newProduct.ram}
                                        onChange={e => setNewProduct({ ...newProduct, ram: e.target.value })}
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
                                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                        Storage Drive
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 1TB NVMe PCIe 4.0 SSD"
                                        value={newProduct.storage}
                                        onChange={e => setNewProduct({ ...newProduct, storage: e.target.value })}
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
                                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                        Graphics (GPU)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. NVIDIA RTX 4080 12GB / Apple 40-Core GPU"
                                        value={newProduct.gpu}
                                        onChange={e => setNewProduct({ ...newProduct, gpu: e.target.value })}
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
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                    Product Description
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Brief highlights and marketing description..."
                                    value={newProduct.description}
                                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
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
                                    disabled={submitting}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: 'var(--radius-pill)',
                                        background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
                                        border: 'none',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                        boxShadow: 'var(--glow-sm)'
                                    }}
                                >
                                    {submitting ? 'Adding...' : 'Save Laptop to Catalog'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ClientLayout>
    );
}
