'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BulkImportPage() {
    const router = useRouter();
    const [jsonInput, setJsonInput] = useState('');
    const [preview, setPreview] = useState(null);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // Delete all state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteDOB, setDeleteDOB] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteResult, setDeleteResult] = useState(null);

    // Validate JSON and show preview
    const handleValidate = () => {
        try {
            const parsed = JSON.parse(jsonInput);

            if (!Array.isArray(parsed)) {
                setErrors([{ message: 'JSON must be an array of products' }]);
                setPreview(null);
                return;
            }

            setPreview(parsed);
            setErrors([]);
        } catch (error) {
            setErrors([{ message: 'Invalid JSON: ' + error.message }]);
            setPreview(null);
        }
    };

    // Import products
    const handleImport = async () => {
        if (!preview || preview.length === 0) {
            alert('Please validate your JSON first');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/products/bulk-import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ products: preview })
            });

            const data = await response.json();

            if (data.success) {
                setResult({
                    success: true,
                    message: data.message,
                    imported: data.imported
                });
                setJsonInput('');
                setPreview(null);
            } else {
                setResult({
                    success: false,
                    message: data.message || data.error,
                    errors: data.errors
                });
            }
        } catch (error) {
            setResult({
                success: false,
                message: 'Failed to import: ' + error.message
            });
        } finally {
            setLoading(false);
        }
    };

    // Delete all products
    const handleDeleteAll = async () => {
        if (!deletePassword || !deleteDOB) {
            alert('Please enter both password and date of birth');
            return;
        }

        const confirmed = window.confirm(
            '⚠️ FINAL CONFIRMATION\n\nThis will DELETE ALL PRODUCTS permanently!\n\nAre you absolutely sure?'
        );

        if (!confirmed) return;

        setDeleteLoading(true);
        setDeleteResult(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/products/delete-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    password: deletePassword,
                    dateOfBirth: deleteDOB
                })
            });

            const data = await response.json();

            if (data.success) {
                setDeleteResult({
                    success: true,
                    message: data.message,
                    deletedCount: data.deletedCount
                });
                setDeletePassword('');
                setDeleteDOB('');
                setTimeout(() => setShowDeleteModal(false), 3000);
            } else {
                setDeleteResult({
                    success: false,
                    message: data.error
                });
            }
        } catch (error) {
            setDeleteResult({
                success: false,
                message: 'Failed to delete: ' + error.message
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    // Sample JSON template
    const sampleJSON = `[
  {
    "name": "Dell XPS 15 (2025)",
    "description": "Premium laptop with stunning display",
    "price": 5000,
    "brand": "Dell",
    "category": "Laptop",
    "specs": {
      "cpu": "Intel Core i7-13700H",
      "ram": "16GB LPDDR5",
      "storage": "512GB SSD",
      "display": "15.6 inch FHD OLED"
    },
    "stock": 10,
    "image": "https://example.com/dell-xps-main.jpg",
    "images": [
      "https://example.com/dell-xps-main.jpg",
      "https://example.com/dell-xps-side.jpg",
      "https://example.com/dell-xps-back.jpg"
    ],
    "colors": ["Silver", "Black"],
    "warranty": "2 years"
  },
  {
    "name": "HP Spectre x360",
    "description": "Convertible laptop for professionals",
    "price": 4500,
    "brand": "HP",
    "category": "Laptop",
    "specs": {
      "cpu": "Intel Core i7",
      "ram": "16GB",
      "storage": "1TB SSD"
    },
    "stock": 5,
    "image": "https://example.com/hp-spectre.jpg",
    "colors": ["Blue", "Silver"]
  }
]`;

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                            📦 Bulk Product Import
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.9)' }}>Import multiple products at once using JSON</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            style={{
                                background: '#dc2626',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            🗑️ Delete All Products
                        </button>
                        <Link
                            href="/auth/admin/main"
                            style={{
                                background: 'white',
                                color: '#667eea',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: '600'
                            }}
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>

                {/* Delete All Modal */}
                {showDeleteModal && (
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
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '2rem',
                            maxWidth: '500px',
                            width: '90%',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                        }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>
                                ⚠️ Delete All Products
                            </h2>
                            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                                This action is <strong>IRREVERSIBLE</strong>. All product data will be permanently deleted.
                            </p>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                                    Admin Password
                                </label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    placeholder="Enter your password"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    value={deleteDOB}
                                    onChange={(e) => setDeleteDOB(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            {deleteResult && (
                                <div style={{
                                    marginBottom: '1rem',
                                    padding: '1rem',
                                    background: deleteResult.success ? '#f0fdf4' : '#fee2e2',
                                    border: `1px solid ${deleteResult.success ? '#86efac' : '#fca5a5'}`,
                                    borderRadius: '8px'
                                }}>
                                    <strong style={{ color: deleteResult.success ? '#15803d' : '#dc2626' }}>
                                        {deleteResult.success ? '✓ Success!' : '✗ Error'}
                                    </strong>
                                    <p style={{ color: deleteResult.success ? '#166534' : '#991b1b', marginTop: '0.5rem', margin: 0 }}>
                                        {deleteResult.message}
                                    </p>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={deleteLoading || !deletePassword || !deleteDOB}
                                    style={{
                                        flex: 1,
                                        background: deleteLoading || !deletePassword || !deleteDOB ? '#9ca3af' : '#dc2626',
                                        color: 'white',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontWeight: '700',
                                        cursor: deleteLoading || !deletePassword || !deleteDOB ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {deleteLoading ? '⏳ Deleting...' : '🗑️ Delete All'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeletePassword('');
                                        setDeleteDOB('');
                                        setDeleteResult(null);
                                    }}
                                    style={{
                                        flex: 1,
                                        background: '#f3f4f6',
                                        color: '#374151',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Left: JSON Input */}
                    <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            Paste JSON Data
                        </h2>

                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder="Paste your JSON array here..."
                            style={{
                                width: '100%',
                                height: '400px',
                                padding: '1rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                marginBottom: '1rem',
                                resize: 'vertical'
                            }}
                        />

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handleValidate}
                                style={{
                                    flex: 1,
                                    background: '#3b82f6',
                                    color: 'white',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                ✓ Validate JSON
                            </button>
                            <button
                                onClick={() => setJsonInput(sampleJSON)}
                                style={{
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Load Sample
                            </button>
                        </div>

                        {/* Errors */}
                        {errors.length > 0 && (
                            <div style={{ marginTop: '1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '1rem' }}>
                                <strong style={{ color: '#dc2626' }}>Validation Errors:</strong>
                                {errors.map((err, i) => (
                                    <div key={i} style={{ color: '#991b1b', marginTop: '0.5rem' }}>
                                        • {err.message}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Preview & Import */}
                    <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            Preview & Import
                        </h2>

                        {preview && preview.length > 0 ? (
                            <>
                                <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
                                    <strong style={{ color: '#15803d' }}>✓ Valid JSON</strong>
                                    <p style={{ color: '#166534', marginTop: '0.5rem' }}>
                                        {preview.length} product(s) ready to import
                                    </p>
                                </div>

                                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
                                    {preview.map((product, index) => (
                                        <div key={index} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                                            <div style={{ fontWeight: '600', color: '#111827' }}>{index + 1}. {product.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                                Price: AED {product.price?.toLocaleString()} | Stock: {product.stock || 0}
                                            </div>
                                            {product.colors && product.colors.length > 0 && (
                                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                    Colors: {product.colors.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleImport}
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        background: loading ? '#9ca3af' : '#10b981',
                                        color: 'white',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontWeight: '700',
                                        fontSize: '1rem',
                                        cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {loading ? '⏳ Importing...' : `🚀 Import ${preview.length} Products`}
                                </button>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                                <p>Paste JSON and click "Validate" to preview</p>
                            </div>
                        )}

                        {/* Result */}
                        {result && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                background: result.success ? '#f0fdf4' : '#fee2e2',
                                border: `1px solid ${result.success ? '#86efac' : '#fca5a5'}`,
                                borderRadius: '8px'
                            }}>
                                <strong style={{ color: result.success ? '#15803d' : '#dc2626' }}>
                                    {result.success ? '✓ Success!' : '✗ Error'}
                                </strong>
                                <p style={{ color: result.success ? '#166534' : '#991b1b', marginTop: '0.5rem' }}>
                                    {result.message}
                                </p>
                                {result.imported && (
                                    <p style={{ color: '#166534', marginTop: '0.5rem', fontWeight: '600' }}>
                                        Imported: {result.imported} products
                                    </p>
                                )}
                                {result.errors && result.errors.length > 0 && (
                                    <div style={{ marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                                        {result.errors.map((err, i) => (
                                            <div key={i} style={{ fontSize: '0.875rem', color: '#991b1b', marginTop: '0.25rem' }}>
                                                Product {err.index + 1} ({err.name}): {err.errors.join(', ')}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Instructions */}
                <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.95)', borderRadius: '12px', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>📖 Instructions</h3>
                    <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                        <li>Prepare your product data in JSON format (array of objects)</li>
                        <li>Click "Load Sample" to see the required format</li>
                        <li>Paste your JSON data in the textarea</li>
                        <li>Click "Validate JSON" to check for errors</li>
                        <li>Review the preview on the right</li>
                        <li>Click "Import" to add all products to the database</li>
                    </ol>

                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                        <strong style={{ color: '#92400e' }}>💡 Tip:</strong>
                        <span style={{ color: '#78350f', marginLeft: '0.5rem' }}>
                            Required fields: name, description, price. All other fields are optional.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
