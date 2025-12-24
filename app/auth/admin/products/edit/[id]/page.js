'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ClientLayout from '@/app/ClientLayout';

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

export default function EditProduct() {
    const params = useParams();
    const router = useRouter();
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
        images: [] // Unified list: [{ file: null, url: '', color: 'All', preview: '' }]
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filterColor, setFilterColor] = useState('All');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Custom color state
    const [customColors, setCustomColors] = useState([]); // [{ name: 'Custom Red', hex: '#ff0000' }]
    const [showCustomColorModal, setShowCustomColorModal] = useState(false);
    const [customColorName, setCustomColorName] = useState('');
    const [customColorHex, setCustomColorHex] = useState('#000000');

    useEffect(() => {
        fetchProduct();
    }, []);

    const fetchProduct = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/products/${params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.product) {
                    setProduct(data.product);
                    const colorMap = data.product.imageColorMap || [];

                    // Unified Image Loading
                    const initialImages = (data.product.images || []).map(img => {
                        const mapping = colorMap.find(m => m.url === img);
                        return {
                            file: null,
                            url: img.startsWith('http') ? img : '',
                            preview: img.startsWith('http') ? img : `/${img}`, // For existing images
                            color: mapping ? mapping.color : 'All',
                            isExisting: true,
                            originalUrl: img
                        };
                    });

                    // Ensure at least one empty slot if no images
                    if (initialImages.length === 0) {
                        initialImages.push({ file: null, url: '', color: 'All', preview: '' });
                    }

                    setFormData({
                        name: data.product.name || '',
                        description: data.product.description || '',
                        price: data.product.price || 0,
                        stock: data.product.stock || 0,
                        brand: data.product.brand || '',
                        category: data.product.category || '',
                        cpu: data.product.specs?.cpu || '',
                        ram: data.product.specs?.ram || '',
                        storage: data.product.specs?.storage || '',
                        display: data.product.specs?.display || '',
                        gpu: data.product.specs?.gpu || '',
                        os: data.product.specs?.os || '',
                        colors: Array.isArray(data.product.colors) ? data.product.colors.join(', ') : (data.product.colors || ''),
                        images: initialImages
                    });
                }
            } else {
                setError('Failed to load product');
            }
        } catch (err) {
            setError('Error loading product');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleColor = (colorName) => {
        const currentColors = formData.colors.split(',').map(c => c.trim()).filter(Boolean);
        const index = currentColors.findIndex(c => c.toLowerCase() === colorName.toLowerCase());

        let newColors;
        if (index > -1) {
            newColors = currentColors.filter((_, i) => i !== index);
        } else {
            newColors = [...currentColors, colorName];
        }

        setFormData({ ...formData, colors: newColors.join(', ') });
    };

    // Get all available colors (master + custom)
    const getAllColors = () => {
        return [...MASTER_COLORS, ...customColors];
    };

    // Add custom color
    const handleAddCustomColor = () => {
        if (!customColorName.trim()) {
            alert('Please enter a color name');
            return;
        }

        // Check if color already exists
        const allColors = getAllColors();
        if (allColors.some(c => c.name.toLowerCase() === customColorName.trim().toLowerCase())) {
            alert('This color name already exists');
            return;
        }

        const newCustomColor = {
            name: customColorName.trim(),
            hex: customColorHex
        };

        setCustomColors([...customColors, newCustomColor]);
        setShowCustomColorModal(false);
        setCustomColorName('');
        setCustomColorHex('#000000');
        setSuccess(`Custom color "${newCustomColor.name}" added successfully!`);
        setTimeout(() => setSuccess(''), 3000);
    };

    // --- Image Role Helper ---
    const getImageRole = (index, color) => {
        if (!color || color === 'All') {
            if (index === 0) return 'Main Image (Default)';
            return `Additional Image #${index + 1}`;
        }

        // Find all images with this color
        const sameColorImages = formData.images
            .map((img, i) => ({ ...img, originalIndex: i }))
            .filter(img => img.color === color);

        const rank = sameColorImages.findIndex(img => img.originalIndex === index);

        if (rank === 0) return `Main Image (${color})`;
        if (rank === 1) return `Side Image (${color})`;
        if (rank === 2) return `Back Image (${color})`;
        return `Extra Image (${color})`;
    };
    // -------------------------

    // --- Image Handling Helpers ---
    const handleAddImageSlot = () => {
        // Auto-assign color if filter is active
        const defaultColor = filterColor !== 'All' ? filterColor : 'All';
        setFormData({
            ...formData,
            images: [...formData.images, { file: null, url: '', color: defaultColor, preview: '' }]
        });
    };

    const handleRemoveImageSlot = (index) => {
        if (formData.images.length <= 1) {
            // Don't remove the last slot, just clear it
            const updated = [...formData.images];
            updated[index] = { file: null, url: '', color: 'All', preview: '' };
            setFormData({ ...formData, images: updated });
            return;
        }
        setFormData({
            ...formData,
            images: formData.images.filter((_, i) => i !== index)
        });
    };

    const handleImageChange = (index, field, value) => {
        const updated = [...formData.images];
        updated[index] = { ...updated[index], [field]: value };

        // If updating file, set preview
        if (field === 'file' && value) {
            updated[index].preview = URL.createObjectURL(value);
        }

        setFormData({ ...formData, images: updated });
    };
    // ----------------------------

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();

            // Append basic fields
            Object.keys(formData).forEach(key => {
                if (key !== 'images' && formData[key] !== null) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Append Images (Unified List)
            formData.images.forEach((img, index) => {
                if (img.file) {
                    formDataToSend.append(`image_${index}`, img.file);
                }
                if (img.url || img.isExisting) {
                    // Pass original URL if it's an existing image and no new file/url provided
                    const urlValue = img.url || (img.isExisting ? img.originalUrl : '');
                    formDataToSend.append(`imageUrl_${index}`, urlValue);
                }
                // Always send the color
                formDataToSend.append(`imageColor_${index}`, img.color || 'All');
            });

            const response = await fetch(`/api/admin/products/${params.id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formDataToSend
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Product updated successfully!');
                setTimeout(() => {
                    // Refresh to show updated state clearly
                    window.location.reload();
                }, 1000);
            } else {
                setError(data.error || 'Failed to update product');
            }
        } catch (err) {
            setError('Error updating product');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <ClientLayout>
                <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p>Loading product...</p>
                </div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Edit Product</h1>
                    <button
                        onClick={() => router.push('/auth/admin/main')}
                        style={{ background: '#6b7280', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                {error && <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}
                {success && <div style={{ background: '#d1fae5', border: '1px solid #10b981', color: '#065f46', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* LEFT COLUMN: Basic Info */}
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Product Details</h2>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Product Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div><label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Price (AED)</label><input type="number" name="price" value={formData.price} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
                                <div><label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Stock</label><input type="number" name="stock" value={formData.stock} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div><label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Brand</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
                                <div><label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Category</label><input type="text" name="category" value={formData.category} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
                            </div>

                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginTop: '1.5rem', marginBottom: '1rem' }}>Specifications</h3>
                            {/* Specs Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div><label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>CPU</label><input type="text" name="cpu" value={formData.cpu} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
                                <div><label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>RAM</label><input type="text" name="ram" value={formData.ram} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div><label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Storage</label><input type="text" name="storage" value={formData.storage} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
                                <div><label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Display</label><input type="text" name="display" value={formData.display} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div><label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>GPU</label><input type="text" name="gpu" value={formData.gpu} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
                                <div><label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>OS</label><input type="text" name="os" value={formData.os} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }} /></div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Images & Colors */}
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Product Images</h2>

                            {/* FILTER TABS */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                                <button
                                    type="button"
                                    onClick={() => setFilterColor('All')}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '2rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        border: filterColor === 'All' ? '2px solid #374151' : '1px solid #e5e7eb',
                                        background: filterColor === 'All' ? '#374151' : 'white',
                                        color: filterColor === 'All' ? 'white' : '#6b7280',
                                        cursor: 'pointer'
                                    }}
                                >
                                    View All
                                </button>
                                {formData.colors.split(',').map(c => c.trim()).filter(Boolean).map((c, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setFilterColor(c)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '2rem',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            border: filterColor === c ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                            background: filterColor === c ? '#eff6ff' : 'white',
                                            color: filterColor === c ? '#1d4ed8' : '#6b7280',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                    >
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: getAllColors().find(mc => mc.name.toLowerCase() === c.toLowerCase())?.hex || '#ccc' }}></span>
                                        {c}
                                    </button>
                                ))}
                            </div>

                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                                Showing {filterColor === 'All' ? 'all images' : `only ${filterColor} images`}.
                                {filterColor !== 'All' && <strong> New images will accurately default to {filterColor}.</strong>}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {formData.images.map((img, index) => {
                                    // FILTER logic
                                    if (filterColor !== 'All' && img.color !== filterColor) return null;

                                    return (
                                        <div key={index} style={{
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '0.75rem',
                                            padding: '1rem',
                                            background: '#f9fafb',
                                            display: 'grid',
                                            gridTemplateColumns: '100px 1fr auto',
                                            gap: '1rem',
                                            alignItems: 'start'
                                        }}>
                                            {/* Image Preview */}
                                            <div style={{
                                                width: '100px',
                                                height: '100px',
                                                background: '#e5e7eb',
                                                borderRadius: '0.5rem',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {img.preview ? (
                                                    <img src={img.preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ fontSize: '2rem', color: '#9ca3af' }}>🖼️</span>
                                                )}
                                            </div>

                                            {/* Inputs */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#111827' }}>
                                                    {getImageRole(index, img.color)}
                                                </div>

                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageChange(index, 'file', e.target.files[0])}
                                                    style={{ fontSize: '0.875rem', cursor: 'pointer' }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Or paste Image URL"
                                                    value={img.url}
                                                    onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.4rem', fontSize: '0.875rem', cursor: 'text' }}
                                                />
                                                <div>
                                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4b5563', display: 'block', marginBottom: '2px' }}>Show only for Color:</label>
                                                    <select
                                                        value={img.color || 'All'}
                                                        onChange={(e) => handleImageChange(index, 'color', e.target.value)}
                                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.4rem', background: 'white', cursor: 'pointer' }}
                                                    >
                                                        <option value="All">All Colors (Always Visible)</option>
                                                        {(formData.colors || '').split(',').map(c => c.trim()).filter(Boolean).map((c, i) => (
                                                            <option key={i} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImageSlot(index)}
                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }}
                                                title="Remove Image"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={handleAddImageSlot}
                                style={{
                                    width: '100%',
                                    marginTop: '1.5rem',
                                    padding: '0.75rem',
                                    border: '2px dashed #3b82f6',
                                    borderRadius: '0.75rem',
                                    color: '#3b82f6',
                                    fontWeight: '600',
                                    background: '#eff6ff',
                                    cursor: 'pointer'
                                }}
                            >
                                + Add Another Image
                            </button>

                            {/* Color Tags */}
                            <div style={{ marginTop: '2.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                                    Manage Available Colors (Click to add/remove)
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    {getAllColors().map((colorObj, idx) => {
                                        const isSelected = formData.colors.split(',').map(c => c.trim().toLowerCase()).includes(colorObj.name.toLowerCase());
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => toggleColor(colorObj.name)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    border: isSelected ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                                                    background: isSelected ? '#eff6ff' : 'white',
                                                    color: isSelected ? '#1d4ed8' : '#374151',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: colorObj.hex, border: '1px solid rgba(0,0,0,0.1)' }}></span>
                                                {colorObj.name}
                                                {isSelected && <span>✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    width: '100%',
                                    background: saving ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
                                    color: 'white',
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    marginTop: '2rem',
                                    boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {saving ? '⌛ Saving Changes...' : '✅ Save All Changes'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Custom Color Button - Fixed Position */}
                <button
                    type="button"
                    onClick={() => setShowCustomColorModal(true)}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '1rem 1.5rem',
                        borderRadius: '50px',
                        border: 'none',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    🎨 Add Custom Color
                </button>

                {/* Custom Color Modal */}
                {showCustomColorModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: '1rem',
                            maxWidth: '500px',
                            width: '90%',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                        }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                Add Custom Color
                            </h2>
                            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                Add a custom color that's not in the predefined list. The color name will be displayed to users.
                            </p>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                                    Color Name <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={customColorName}
                                    onChange={(e) => setCustomColorName(e.target.value)}
                                    placeholder="e.g., Midnight Blue, Rose Pink"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '0.5rem',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                                    Color Code (Hex) <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={customColorHex}
                                        onChange={(e) => setCustomColorHex(e.target.value)}
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={customColorHex}
                                        onChange={(e) => setCustomColorHex(e.target.value)}
                                        placeholder="#000000"
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '0.5rem',
                                            fontSize: '1rem',
                                            fontFamily: 'monospace'
                                        }}
                                    />
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                    Note: The hex code will not be shown to users, only the color name
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => {
                                        setShowCustomColorModal(false);
                                        setCustomColorName('');
                                        setCustomColorHex('#000000');
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: '#f3f4f6',
                                        color: '#374151',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddCustomColor}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Add Color
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ClientLayout>
    );
}
