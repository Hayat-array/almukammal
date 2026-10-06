'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ClientLayout from '@/app/ClientLayout';
import { useAuth } from '@/contexts/AuthContext';

const MASTER_COLORS = [
    { name: 'Space Grey', hex: '#53565a' },
    { name: 'Silver', hex: '#c0c0c0' },
    { name: 'Midnight', hex: '#191970' },
    { name: 'Starlight', hex: '#f0ead6' },
    { name: 'Gold', hex: '#ffd700' },
    { name: 'Rose Gold', hex: '#b76e79' },
    { name: 'Graphite', hex: '#41424c' },
    { name: 'Black', hex: '#1c1c1c' },
    { name: 'White', hex: '#f5f5f7' },
    { name: 'Blue', hex: '#007aff' }
];

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const { token: authContextToken, user, loading: authLoading } = useAuth();

    const [product, setProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        brand: '',
        category: '',
        warranty: '',
        stock: '',
        cpu: '',
        ram: '',
        storage: '',
        display: '',
        gpu: '',
        battery: '',
        weight: '',
        os: '',
        colors: '',
        images: []
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filterColor, setFilterColor] = useState('All');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Custom colors modal
    const [customColors, setCustomColors] = useState([]);
    const [showCustomColorModal, setShowCustomColorModal] = useState(false);
    const [customColorName, setCustomColorName] = useState('');
    const [customColorHex, setCustomColorHex] = useState('#0866FF');

    const formatPreview = useCallback((img) => {
        if (!img) return '/placeholder.jpg';
        if (img.startsWith('blob:') || img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://')) {
            return img;
        }
        const clean = img.replace(/^\/+/, '');
        return `/${clean}`;
    }, []);

    const fetchProduct = useCallback(async (productId) => {
        if (!productId) return;
        setLoading(true);
        setError('');

        try {
            const token = authContextToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`/api/admin/products/${productId}`, {
                headers,
                cache: 'no-store'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.product) {
                    const prod = data.product;
                    setProduct(prod);

                    const colorMap = prod.imageColorMap || [];
                    const rawImages = Array.isArray(prod.images) && prod.images.length > 0
                        ? prod.images
                        : (prod.image ? [prod.image] : []);

                    const initialImages = rawImages.map(img => {
                        const mapping = colorMap.find(m => m.url === img);
                        return {
                            file: null,
                            url: img.startsWith('http') ? img : '',
                            preview: formatPreview(img),
                            color: mapping ? mapping.color : 'All',
                            isExisting: true,
                            originalUrl: img
                        };
                    });

                    if (initialImages.length === 0) {
                        initialImages.push({ file: null, url: '', color: 'All', preview: '/placeholder.jpg', isExisting: false });
                    }

                    setFormData({
                        name: prod.name || '',
                        description: prod.description || '',
                        price: prod.price !== undefined ? prod.price : '',
                        stock: prod.stock !== undefined ? prod.stock : 1,
                        brand: prod.brand || 'HP',
                        category: prod.category || 'Laptops',
                        warranty: prod.warranty || '1 Year Official Warranty',
                        cpu: prod.specs?.cpu || '',
                        ram: prod.specs?.ram || '',
                        storage: prod.specs?.storage || '',
                        display: prod.specs?.display || '',
                        gpu: prod.specs?.gpu || '',
                        battery: prod.specs?.battery || '',
                        weight: prod.specs?.weight || '',
                        os: prod.specs?.os || '',
                        colors: Array.isArray(prod.colors) ? prod.colors.join(', ') : (prod.colors || ''),
                        images: initialImages
                    });
                } else {
                    setError('Product data could not be parsed.');
                }
            } else {
                const errData = await response.json().catch(() => ({}));
                setError(errData.error || `Failed to load product (#${productId})`);
            }
        } catch (err) {
            console.error('Error loading product:', err);
            setError('Network or server error while loading product data.');
        } finally {
            setLoading(false);
        }
    }, [authContextToken, formatPreview]);

    useEffect(() => {
        if (!authLoading && params?.id) {
            fetchProduct(params.id);
        }
    }, [params?.id, authLoading, fetchProduct]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const toggleColor = (colorName) => {
        const currentColors = formData.colors.split(',').map(c => c.trim()).filter(Boolean);
        const exists = currentColors.some(c => c.toLowerCase() === colorName.toLowerCase());

        let newColors;
        if (exists) {
            newColors = currentColors.filter(c => c.toLowerCase() !== colorName.toLowerCase());
        } else {
            newColors = [...currentColors, colorName];
        }

        setFormData(prev => ({ ...prev, colors: newColors.join(', ') }));
    };

    const getAllColors = () => [...MASTER_COLORS, ...customColors];

    const handleAddCustomColor = () => {
        if (!customColorName.trim()) {
            alert('Please enter a color name.');
            return;
        }

        const all = getAllColors();
        if (all.some(c => c.name.toLowerCase() === customColorName.trim().toLowerCase())) {
            alert('A color with this name already exists.');
            return;
        }

        const newColor = {
            name: customColorName.trim(),
            hex: customColorHex
        };

        setCustomColors(prev => [...prev, newColor]);
        toggleColor(newColor.name);
        setShowCustomColorModal(false);
        setCustomColorName('');
        setCustomColorHex('#0866FF');
        setSuccess(`Custom color "${newColor.name}" added and selected.`);
        setTimeout(() => setSuccess(''), 3000);
    };

    const getImageRole = (index, color) => {
        if (!color || color === 'All') {
            if (index === 0) return 'Primary Hero Photo';
            return `Gallery View #${index + 1}`;
        }
        const sameColor = formData.images
            .map((img, i) => ({ ...img, originalIndex: i }))
            .filter(img => img.color === color);
        const rank = sameColor.findIndex(img => img.originalIndex === index);

        if (rank === 0) return `Primary (${color})`;
        if (rank === 1) return `Side Profile (${color})`;
        if (rank === 2) return `Keyboard / Rear (${color})`;
        return `Detail Shot (${color})`;
    };

    const handleAddImageSlot = () => {
        const defaultColor = filterColor !== 'All' ? filterColor : 'All';
        setFormData(prev => ({
            ...prev,
            images: [
                ...prev.images,
                { file: null, url: '', color: defaultColor, preview: '/placeholder.jpg', isExisting: false }
            ]
        }));
    };

    const handleRemoveImageSlot = (index) => {
        if (formData.images.length <= 1) {
            setFormData(prev => ({
                ...prev,
                images: [{ file: null, url: '', color: 'All', preview: '/placeholder.jpg', isExisting: false }]
            }));
            return;
        }
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleImageChange = (index, field, value) => {
        const updated = [...formData.images];
        updated[index] = { ...updated[index], [field]: value };

        if (field === 'file' && value) {
            updated[index].preview = URL.createObjectURL(value);
        } else if (field === 'url' && value) {
            updated[index].preview = formatPreview(value);
        }

        setFormData(prev => ({ ...prev, images: updated }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const token = authContextToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
            const formDataToSend = new FormData();

            // Append standard form fields
            Object.keys(formData).forEach(key => {
                if (key !== 'images' && formData[key] !== null && formData[key] !== undefined) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Append Unified Images
            formData.images.forEach((img, index) => {
                if (img.file) {
                    formDataToSend.append(`image_${index}`, img.file);
                }
                if (img.url || img.isExisting) {
                    const urlVal = img.url || (img.isExisting ? img.originalUrl : '');
                    formDataToSend.append(`imageUrl_${index}`, urlVal);
                }
                formDataToSend.append(`imageColor_${index}`, img.color || 'All');
            });

            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`/api/admin/products/${params.id}`, {
                method: 'PATCH',
                headers,
                body: formDataToSend
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Product changes saved to catalog successfully!');
                setTimeout(() => {
                    fetchProduct(params.id);
                }, 800);
            } else {
                setError(data.error || 'Failed to update product');
            }
        } catch (err) {
            console.error('Update product error:', err);
            setError('Error updating product. Please verify connection and retry.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ClientLayout>
            <div className="edit-container">
                {/* Top Navigation Bar */}
                <div className="edit-header">
                    <div className="header-info">
                        <Link href="/auth/admin/main" className="back-link">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            Back to Command Center
                        </Link>
                        <div className="header-title-row">
                            <div className="badge-tag">Inventory Item #{params?.id ? String(params.id).slice(-8) : '...'}</div>
                            <h1 className="page-title">
                                {loading ? 'Loading Product Details...' : (formData.name || 'Edit Product')}
                            </h1>
                            <p className="page-subtitle">
                                Configure specifications, pricing, imagery, and variant color palettes
                            </p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button
                            type="button"
                            onClick={() => fetchProduct(params.id)}
                            disabled={loading || saving}
                            className="btn-secondary"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                            </svg>
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving || loading}
                            className="btn-primary"
                        >
                            {saving ? (
                                <>
                                    <span className="btn-spinner"></span>
                                    Saving Catalog...
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Save All Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="alert-box alert-error">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="alert-box alert-success">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{success}</span>
                    </div>
                )}

                {loading ? (
                    <div className="loading-skeleton">
                        <div className="spinner-large"></div>
                        <p>Syncing product record from Al Mukammal database...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="edit-form-grid">
                        {/* LEFT COLUMN: Core Details & Hardware */}
                        <div className="column-card">
                            <div className="card-section-header">
                                <div className="section-icon-badge">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                        <line x1="8" y1="21" x2="16" y2="21" />
                                        <line x1="12" y1="17" x2="12" y2="21" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="section-title">General Specifications</h2>
                                    <p className="section-desc">Storefront title, pricing, and hardware capabilities</p>
                                </div>
                            </div>

                            <div className="field-group">
                                <label className="field-label">Product Name / Model Title *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., HP Spectre x360 14"
                                    className="modern-field"
                                />
                            </div>

                            <div className="field-group">
                                <label className="field-label">Product Overview & Key Features</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Executive description highlighting finish, durability, and business performance..."
                                    className="modern-field textarea-field"
                                />
                            </div>

                            <div className="field-row-2">
                                <div className="field-group">
                                    <label className="field-label">Retail Price (AED) *</label>
                                    <div className="input-prefix-wrapper">
                                        <span className="input-prefix">AED</span>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            required
                                            min="0"
                                            step="0.01"
                                            placeholder="2198"
                                            className="modern-field field-with-prefix"
                                        />
                                    </div>
                                </div>
                                <div className="field-group">
                                    <label className="field-label">Inventory Units In Stock</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleChange}
                                        min="0"
                                        placeholder="1"
                                        className="modern-field"
                                    />
                                </div>
                            </div>

                            <div className="field-row-2">
                                <div className="field-group">
                                    <label className="field-label">Manufacturer / Brand</label>
                                    <input
                                        type="text"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleChange}
                                        placeholder="HP, Dell, Apple, Lenovo"
                                        className="modern-field"
                                    />
                                </div>
                                <div className="field-group">
                                    <label className="field-label">Category</label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        placeholder="Laptops, Ultrabooks, Workstations"
                                        className="modern-field"
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <label className="field-label">Warranty Details</label>
                                <input
                                    type="text"
                                    name="warranty"
                                    value={formData.warranty}
                                    onChange={handleChange}
                                    placeholder="1 Year Official Distributor Warranty"
                                    className="modern-field"
                                />
                            </div>

                            <div className="divider-line"></div>

                            <h3 className="subsection-title">Hardware Architecture</h3>

                            <div className="field-row-2">
                                <div className="field-group">
                                    <label className="field-label">Processor (CPU)</label>
                                    <input
                                        type="text"
                                        name="cpu"
                                        value={formData.cpu}
                                        onChange={handleChange}
                                        placeholder="Intel Core i7-13700H"
                                        className="modern-field"
                                    />
                                </div>
                                <div className="field-group">
                                    <label className="field-label">Memory (RAM)</label>
                                    <input
                                        type="text"
                                        name="ram"
                                        value={formData.ram}
                                        onChange={handleChange}
                                        placeholder="16GB DDR5 5200MHz"
                                        className="modern-field"
                                    />
                                </div>
                            </div>

                            <div className="field-row-2">
                                <div className="field-group">
                                    <label className="field-label">Storage Capacity</label>
                                    <input
                                        type="text"
                                        name="storage"
                                        value={formData.storage}
                                        onChange={handleChange}
                                        placeholder="1TB NVMe PCIe 4.0 SSD"
                                        className="modern-field"
                                    />
                                </div>
                                <div className="field-group">
                                    <label className="field-label">Display & Resolution</label>
                                    <input
                                        type="text"
                                        name="display"
                                        value={formData.display}
                                        onChange={handleChange}
                                        placeholder="14' 2.8K OLED 120Hz 500 nits"
                                        className="modern-field"
                                    />
                                </div>
                            </div>

                            <div className="field-row-2">
                                <div className="field-group">
                                    <label className="field-label">Graphics Card (GPU)</label>
                                    <input
                                        type="text"
                                        name="gpu"
                                        value={formData.gpu}
                                        onChange={handleChange}
                                        placeholder="NVIDIA RTX 4060 8GB GDDR6"
                                        className="modern-field"
                                    />
                                </div>
                                <div className="field-group">
                                    <label className="field-label">Operating System</label>
                                    <input
                                        type="text"
                                        name="os"
                                        value={formData.os}
                                        onChange={handleChange}
                                        placeholder="Windows 11 Pro Genuine"
                                        className="modern-field"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Media & Variant Color Mapping */}
                        <div className="column-card">
                            <div className="card-section-header">
                                <div className="section-icon-badge">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="section-title">Visual Media & Finishes</h2>
                                    <p className="section-desc">Manage multi-angle assets and map photos to specific finishes</p>
                                </div>
                            </div>

                            {/* Color Filter Tabs */}
                            <div className="filter-tab-bar">
                                <button
                                    type="button"
                                    onClick={() => setFilterColor('All')}
                                    className={`filter-pill ${filterColor === 'All' ? 'active-all' : ''}`}
                                >
                                    All Images ({formData.images.length})
                                </button>
                                {formData.colors.split(',').map(c => c.trim()).filter(Boolean).map((colorName, idx) => {
                                    const matchColor = getAllColors().find(mc => mc.name.toLowerCase() === colorName.toLowerCase());
                                    const isActive = filterColor.toLowerCase() === colorName.toLowerCase();
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setFilterColor(colorName)}
                                            className={`filter-pill ${isActive ? 'active-color' : ''}`}
                                        >
                                            <span
                                                className="color-dot"
                                                style={{ background: matchColor?.hex || '#94A3B8' }}
                                            />
                                            {colorName}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Image Slots */}
                            <div className="image-slots-list">
                                {formData.images.map((img, index) => {
                                    if (filterColor !== 'All' && img.color?.toLowerCase() !== filterColor.toLowerCase()) {
                                        return null;
                                    }

                                    return (
                                        <div key={index} className="image-slot-card">
                                            {/* Preview Thumbnail */}
                                            <div className="slot-preview-wrapper">
                                                <img
                                                    src={img.preview || '/placeholder.jpg'}
                                                    alt="Laptop View"
                                                    className="slot-preview-img"
                                                    onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                                                />
                                                <span className="role-tag">{getImageRole(index, img.color)}</span>
                                            </div>

                                            {/* Controls */}
                                            <div className="slot-controls">
                                                <div className="slot-file-row">
                                                    <label className="file-upload-btn">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                            <polyline points="17 8 12 3 7 8" />
                                                            <line x1="12" y1="3" x2="12" y2="15" />
                                                        </svg>
                                                        Upload Device File
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageChange(index, 'file', e.target.files[0])}
                                                            style={{ display: 'none' }}
                                                        />
                                                    </label>
                                                    {img.file && (
                                                        <span className="uploaded-file-name">
                                                            ✓ {img.file.name}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="field-group" style={{ marginBottom: 0 }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Or paste Direct Image CDN URL"
                                                        value={img.url || (img.isExisting ? img.originalUrl : '')}
                                                        onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                                                        className="modern-field compact-field"
                                                    />
                                                </div>

                                                <div className="color-assign-row">
                                                    <span className="color-assign-label">Display for Finish:</span>
                                                    <select
                                                        value={img.color || 'All'}
                                                        onChange={(e) => handleImageChange(index, 'color', e.target.value)}
                                                        className="modern-select"
                                                    >
                                                        <option value="All">All Finishes (Global Visibility)</option>
                                                        {formData.colors.split(',').map(c => c.trim()).filter(Boolean).map((c, i) => (
                                                            <option key={i} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Delete Slot Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImageSlot(index)}
                                                className="slot-remove-btn"
                                                title="Remove this image slot"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Add Slot Button */}
                            <button
                                type="button"
                                onClick={handleAddImageSlot}
                                className="add-slot-btn"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Add Another Image Angle
                            </button>

                            <div className="divider-line"></div>

                            {/* Color Palettes Section */}
                            <div className="colors-management-box">
                                <div className="colors-header-row">
                                    <div>
                                        <h3 className="subsection-title" style={{ margin: 0 }}>Available Finish Variants</h3>
                                        <p className="section-desc">Toggle the color options buyers can select for this device</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowCustomColorModal(true)}
                                        className="btn-custom-color"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                                        </svg>
                                        Custom Color
                                    </button>
                                </div>

                                <div className="color-swatches-grid">
                                    {getAllColors().map((col, idx) => {
                                        const isSelected = formData.colors
                                            .split(',')
                                            .map(c => c.trim().toLowerCase())
                                            .includes(col.name.toLowerCase());

                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => toggleColor(col.name)}
                                                className={`swatch-btn ${isSelected ? 'swatch-selected' : ''}`}
                                            >
                                                <span
                                                    className="swatch-indicator"
                                                    style={{ background: col.hex }}
                                                />
                                                <span className="swatch-name">{col.name}</span>
                                                {isSelected && (
                                                    <svg className="swatch-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer Submit Button inside the card */}
                            <div className="card-footer-submit">
                                <button
                                    type="submit"
                                    disabled={saving || loading}
                                    className="btn-submit-large"
                                >
                                    {saving ? 'Saving Product...' : 'Commit & Save All Updates'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Custom Color Modal */}
                {showCustomColorModal && (
                    <div className="modal-backdrop">
                        <div className="modal-content">
                            <div className="modal-header">
                                <div className="section-icon-badge" style={{ width: '40px', height: '40px' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="modal-title">Define Custom Finish</h3>
                                    <p className="section-desc">Create a proprietary tone for specialized device models</p>
                                </div>
                            </div>

                            <div className="field-group">
                                <label className="field-label">Finish Name *</label>
                                <input
                                    type="text"
                                    value={customColorName}
                                    onChange={(e) => setCustomColorName(e.target.value)}
                                    placeholder="e.g., Titanium Sand, Alpine White"
                                    className="modern-field"
                                />
                            </div>

                            <div className="field-group">
                                <label className="field-label">Hex Shade Swatch *</label>
                                <div className="color-picker-row">
                                    <input
                                        type="color"
                                        value={customColorHex}
                                        onChange={(e) => setCustomColorHex(e.target.value)}
                                        className="native-color-picker"
                                    />
                                    <input
                                        type="text"
                                        value={customColorHex}
                                        onChange={(e) => setCustomColorHex(e.target.value)}
                                        className="modern-field"
                                        style={{ fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowCustomColorModal(false)}
                                    className="btn-secondary"
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddCustomColor}
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    Add Color
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <style jsx>{`
                    .edit-container {
                        max-width: 1320px;
                        margin: 0 auto;
                        padding: 36px 24px 80px;
                        background: var(--bg-canvas, #F7F8FA);
                        min-height: calc(100vh - 80px);
                    }

                    .edit-header {
                        display: flex;
                        align-items: flex-start;
                        justify-content: space-between;
                        gap: 24px;
                        margin-bottom: 28px;
                        flex-wrap: wrap;
                    }

                    .header-info {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    .back-link {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 0.85rem;
                        font-weight: 700;
                        color: #64748B;
                        text-decoration: none;
                        transition: color 0.15s ease;
                        margin-bottom: 4px;
                    }

                    .back-link:hover {
                        color: #0866FF;
                    }

                    .badge-tag {
                        display: inline-block;
                        font-size: 0.68rem;
                        font-weight: 800;
                        color: #0866FF;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                        background: rgba(8, 102, 255, 0.08);
                        padding: 3px 10px;
                        border-radius: 9999px;
                        margin-bottom: 8px;
                    }

                    .page-title {
                        font-size: 2.1rem;
                        font-weight: 850;
                        color: #080808;
                        letter-spacing: -0.03em;
                        margin: 0;
                    }

                    .page-subtitle {
                        font-size: 0.92rem;
                        color: #64748B;
                        margin: 4px 0 0 0;
                    }

                    .header-actions {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .btn-secondary {
                        background: #FFFFFF;
                        color: #0F172A;
                        border: 1.5px solid #E2E8F0;
                        border-radius: 9999px;
                        padding: 11px 20px;
                        font-size: 0.88rem;
                        font-weight: 700;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    .btn-secondary:hover:not(:disabled) {
                        border-color: #0866FF;
                        color: #0866FF;
                        background: #F8FAFC;
                    }

                    .btn-primary {
                        background: #0B0B0D;
                        color: #FFFFFF;
                        border: none;
                        border-radius: 9999px;
                        padding: 12px 24px;
                        font-size: 0.92rem;
                        font-weight: 750;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    .btn-primary:hover:not(:disabled) {
                        background: #0866FF;
                        box-shadow: 0 10px 28px rgba(8, 102, 255, 0.32);
                        transform: translateY(-1px);
                    }

                    .btn-primary:disabled, .btn-secondary:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .btn-spinner {
                        width: 14px;
                        height: 14px;
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        border-top-color: #FFFFFF;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }

                    .alert-box {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 14px 20px;
                        border-radius: 16px;
                        font-size: 0.9rem;
                        font-weight: 600;
                        margin-bottom: 24px;
                    }

                    .alert-error {
                        background: #FEF2F2;
                        color: #991B1B;
                        border: 1px solid #FECACA;
                    }

                    .alert-success {
                        background: #ECFDF5;
                        color: #065F46;
                        border: 1px solid #A7F3D0;
                    }

                    .loading-skeleton {
                        text-align: center;
                        padding: 80px 20px;
                        background: #FFFFFF;
                        border-radius: 28px;
                        border: 1px solid #E2E8F0;
                        color: #64748B;
                    }

                    .spinner-large {
                        width: 44px;
                        height: 44px;
                        border: 3px solid #E2E8F0;
                        border-top-color: #0866FF;
                        border-radius: 50%;
                        animation: spin 0.9s linear infinite;
                        margin: 0 auto 16px;
                    }

                    .edit-form-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 28px;
                    }

                    .column-card {
                        background: #FFFFFF;
                        border: 1px solid rgba(0, 0, 0, 0.07);
                        border-radius: 28px;
                        padding: 36px 32px;
                        box-shadow: 0 20px 48px -12px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.02);
                        display: flex;
                        flex-direction: column;
                    }

                    .card-section-header {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        margin-bottom: 28px;
                    }

                    .section-icon-badge {
                        width: 46px;
                        height: 46px;
                        border-radius: 14px;
                        background: #F1F5F9;
                        color: #0B0B0D;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }

                    .section-title {
                        font-size: 1.35rem;
                        font-weight: 800;
                        color: #080808;
                        margin: 0 0 2px 0;
                        letter-spacing: -0.02em;
                    }

                    .section-desc {
                        font-size: 0.85rem;
                        color: #64748B;
                        margin: 0;
                    }

                    .subsection-title {
                        font-size: 1.05rem;
                        font-weight: 800;
                        color: #080808;
                        margin: 8px 0 16px 0;
                        letter-spacing: -0.01em;
                    }

                    .field-group {
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                        margin-bottom: 18px;
                    }

                    .field-row-2 {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                    }

                    .field-label {
                        font-size: 0.78rem;
                        font-weight: 750;
                        color: #334155;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                    }

                    .modern-field {
                        width: 100%;
                        background: #F8FAFC;
                        border: 1.5px solid #E2E8F0;
                        border-radius: 14px;
                        padding: 12px 16px;
                        font-size: 0.92rem;
                        color: #0F172A;
                        transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                        outline: none;
                        font-family: inherit;
                    }

                    .modern-field:focus {
                        background: #FFFFFF;
                        border-color: #0866FF;
                        box-shadow: 0 0 0 4px rgba(8, 102, 255, 0.12);
                    }

                    .compact-field {
                        padding: 9px 14px;
                        font-size: 0.85rem;
                    }

                    .textarea-field {
                        resize: vertical;
                        min-height: 96px;
                        line-height: 1.5;
                    }

                    .input-prefix-wrapper {
                        position: relative;
                        display: flex;
                        align-items: center;
                    }

                    .input-prefix {
                        position: absolute;
                        left: 14px;
                        font-size: 0.82rem;
                        font-weight: 800;
                        color: #64748B;
                        pointer-events: none;
                    }

                    .field-with-prefix {
                        padding-left: 54px;
                    }

                    .divider-line {
                        height: 1px;
                        background: #F1F5F9;
                        margin: 24px 0 20px;
                    }

                    /* Filter Pills */
                    .filter-tab-bar {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        flex-wrap: wrap;
                        margin-bottom: 20px;
                    }

                    .filter-pill {
                        background: #F8FAFC;
                        border: 1.5px solid #E2E8F0;
                        color: #64748B;
                        border-radius: 9999px;
                        padding: 6px 14px;
                        font-size: 0.82rem;
                        font-weight: 700;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.15s ease;
                    }

                    .filter-pill:hover {
                        border-color: #CBD5E1;
                        color: #0F172A;
                    }

                    .filter-pill.active-all {
                        background: #0B0B0D;
                        color: #FFFFFF;
                        border-color: #0B0B0D;
                    }

                    .filter-pill.active-color {
                        background: rgba(8, 102, 255, 0.08);
                        color: #0866FF;
                        border-color: #0866FF;
                    }

                    .color-dot {
                        width: 9px;
                        height: 9px;
                        border-radius: 50%;
                        border: 1px solid rgba(0, 0, 0, 0.12);
                    }

                    /* Image Slots */
                    .image-slots-list {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        margin-bottom: 16px;
                    }

                    .image-slot-card {
                        background: #F8FAFC;
                        border: 1.5px solid #E2E8F0;
                        border-radius: 20px;
                        padding: 16px;
                        display: grid;
                        grid-template-columns: 100px 1fr auto;
                        gap: 16px;
                        align-items: start;
                        transition: border-color 0.18s ease;
                    }

                    .image-slot-card:hover {
                        border-color: #CBD5E1;
                    }

                    .slot-preview-wrapper {
                        width: 100px;
                        height: 100px;
                        border-radius: 14px;
                        background: #FFFFFF;
                        border: 1px solid #E2E8F0;
                        overflow: hidden;
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .slot-preview-img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }

                    .role-tag {
                        position: absolute;
                        bottom: 4px;
                        left: 4px;
                        right: 4px;
                        background: rgba(11, 11, 13, 0.78);
                        color: #FFFFFF;
                        font-size: 0.6rem;
                        font-weight: 750;
                        padding: 2px 4px;
                        border-radius: 6px;
                        text-align: center;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        backdrop-filter: blur(4px);
                    }

                    .slot-controls {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .slot-file-row {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        flex-wrap: wrap;
                    }

                    .file-upload-btn {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        background: #FFFFFF;
                        border: 1.5px solid #CBD5E1;
                        border-radius: 9999px;
                        padding: 6px 14px;
                        font-size: 0.78rem;
                        font-weight: 750;
                        color: #334155;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }

                    .file-upload-btn:hover {
                        border-color: #0866FF;
                        color: #0866FF;
                    }

                    .uploaded-file-name {
                        font-size: 0.75rem;
                        font-weight: 700;
                        color: #059669;
                    }

                    .color-assign-row {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .color-assign-label {
                        font-size: 0.75rem;
                        font-weight: 700;
                        color: #64748B;
                        white-space: nowrap;
                    }

                    .modern-select {
                        background: #FFFFFF;
                        border: 1.5px solid #E2E8F0;
                        border-radius: 12px;
                        padding: 7px 12px;
                        font-size: 0.82rem;
                        color: #0F172A;
                        font-weight: 600;
                        outline: none;
                        cursor: pointer;
                        width: 100%;
                    }

                    .slot-remove-btn {
                        background: transparent;
                        border: none;
                        color: #94A3B8;
                        cursor: pointer;
                        padding: 6px;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.15s ease;
                    }

                    .slot-remove-btn:hover {
                        color: #EF4444;
                        background: #FEE2E2;
                    }

                    .add-slot-btn {
                        width: 100%;
                        background: #FFFFFF;
                        border: 2px dashed #CBD5E1;
                        border-radius: 18px;
                        padding: 14px;
                        color: #0866FF;
                        font-size: 0.88rem;
                        font-weight: 750;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        cursor: pointer;
                        transition: all 0.18s ease;
                    }

                    .add-slot-btn:hover {
                        border-color: #0866FF;
                        background: rgba(8, 102, 255, 0.04);
                    }

                    /* Colors Management */
                    .colors-management-box {
                        display: flex;
                        flex-direction: column;
                        gap: 14px;
                    }

                    .colors-header-row {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 12px;
                    }

                    .btn-custom-color {
                        background: #F1F5F9;
                        color: #0F172A;
                        border: 1.5px solid #E2E8F0;
                        border-radius: 9999px;
                        padding: 6px 14px;
                        font-size: 0.78rem;
                        font-weight: 750;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.15s ease;
                    }

                    .btn-custom-color:hover {
                        background: #E2E8F0;
                        color: #0866FF;
                    }

                    .color-swatches-grid {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                    }

                    .swatch-btn {
                        background: #FFFFFF;
                        border: 1.5px solid #E2E8F0;
                        border-radius: 9999px;
                        padding: 7px 14px;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 0.82rem;
                        font-weight: 650;
                        color: #334155;
                        cursor: pointer;
                        transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    .swatch-btn:hover {
                        border-color: #CBD5E1;
                    }

                    .swatch-btn.swatch-selected {
                        border-color: #0866FF;
                        background: rgba(8, 102, 255, 0.06);
                        color: #0866FF;
                        font-weight: 750;
                    }

                    .swatch-indicator {
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        border: 1px solid rgba(0, 0, 0, 0.12);
                    }

                    .swatch-check {
                        color: #0866FF;
                    }

                    .card-footer-submit {
                        margin-top: 32px;
                        padding-top: 20px;
                        border-top: 1px solid #F1F5F9;
                    }

                    .btn-submit-large {
                        width: 100%;
                        background: #0B0B0D;
                        color: #FFFFFF;
                        border: none;
                        border-radius: 9999px;
                        padding: 15px 24px;
                        font-size: 0.98rem;
                        font-weight: 800;
                        cursor: pointer;
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
                    }

                    .btn-submit-large:hover:not(:disabled) {
                        background: #0866FF;
                        box-shadow: 0 12px 32px rgba(8, 102, 255, 0.32);
                        transform: translateY(-1px);
                    }

                    .btn-submit-large:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    /* Modal */
                    .modal-backdrop {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(11, 11, 13, 0.6);
                        backdrop-filter: blur(8px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        padding: 20px;
                    }

                    .modal-content {
                        background: #FFFFFF;
                        border-radius: 28px;
                        padding: 32px;
                        max-width: 440px;
                        width: 100%;
                        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
                    }

                    .modal-header {
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        margin-bottom: 24px;
                    }

                    .modal-title {
                        font-size: 1.25rem;
                        font-weight: 800;
                        color: #080808;
                        margin: 0 0 2px 0;
                    }

                    .color-picker-row {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .native-color-picker {
                        width: 52px;
                        height: 48px;
                        border: 1.5px solid #E2E8F0;
                        border-radius: 12px;
                        cursor: pointer;
                        background: transparent;
                        padding: 2px;
                    }

                    .modal-actions {
                        display: flex;
                        gap: 12px;
                        margin-top: 24px;
                    }

                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }

                    @media (max-width: 960px) {
                        .edit-form-grid {
                            grid-template-columns: 1fr;
                        }

                        .edit-container {
                            padding: 24px 16px 60px;
                        }

                        .column-card {
                            padding: 24px 20px;
                            border-radius: 24px;
                        }

                        .image-slot-card {
                            grid-template-columns: 80px 1fr auto;
                        }

                        .slot-preview-wrapper {
                            width: 80px;
                            height: 80px;
                        }
                    }
                `}</style>
            </div>
        </ClientLayout>
    );
}
