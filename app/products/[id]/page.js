'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import ClientLayout from '@/app/ClientLayout';

export default function ProductDetailPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams?.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchDetail() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.product) {
            setProduct(data.product);
            if (data.product.colors?.length > 0) {
              setSelectedColor(data.product.colors[0]);
            }
          } else {
            setError('Product not found');
          }
        } else {
          setError('Product does not exist or has been removed');
        }
      } catch {
        setError('Error retrieving product data');
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  // Gallery compilation
  const gallery = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.image) list.push(product.image);
    if (Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list.map(img => (img.startsWith('http') || img.startsWith('/') ? img : `/${img}`));
  }, [product]);

  const activeImage = gallery[selectedImageIdx] || '/placeholder.jpg';
  const specs = product?.specs || {};

  const handleAddToCart = () => {
    if (!user) {
      addToast('Please sign in to add items to your cart', 'info');
      router.push(`/auth/login?redirect=/products/${id}`);
      return;
    }

    setAddingToCart(true);
    try {
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const itemIndex = existingCart.findIndex(item => (item.id || item._id) === id);

      const price = product.discountedPrice || product.price;

      if (itemIndex > -1) {
        existingCart[itemIndex].quantity = (existingCart[itemIndex].quantity || 1) + quantity;
        if (selectedColor) existingCart[itemIndex].selectedColor = selectedColor;
      } else {
        existingCart.push({
          id,
          _id: id,
          name: product.name,
          price,
          originalPrice: product.price,
          image: activeImage,
          quantity,
          selectedColor,
          brand: product.brand,
          category: product.category
        });
      }

      localStorage.setItem('cart', JSON.stringify(existingCart));
      window.dispatchEvent(new Event('cartUpdated'));
      addToast(`Added ${quantity}x "${product.name}" to cart`, 'success');
    } catch {
      addToast('Could not add to cart. Try again.', 'error');
    } finally {
      setTimeout(() => setAddingToCart(false), 300);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="detail-loading-screen">
          <div className="spinner"></div>
          <p>Loading laptop details...</p>
        </div>
      </ClientLayout>
    );
  }

  if (error || !product) {
    return (
      <ClientLayout>
        <div className="detail-error-screen">
          <span className="error-icon">⚠️</span>
          <h2>Product Not Found</h2>
          <p>{error || 'The requested model could not be found in our inventory.'}</p>
          <Link href="/products" className="back-catalog-btn">
            ← Return to Products
          </Link>
        </div>
      </ClientLayout>
    );
  }

  const effectivePrice = product.discountedPrice || product.price;

  return (
    <ClientLayout>
      <div className="product-detail-root">
        {/* Breadcrumb Navigation */}
        <div className="breadcrumb-nav">
          <div className="nav-inner">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/products">Products</Link>
            <span>/</span>
            <span className="current-crumb">{product.name}</span>
          </div>
        </div>

        <div className="detail-container">
          <div className="detail-grid">
            {/* Left Column: Visual Gallery */}
            <div className="gallery-column">
              <div className="main-image-viewport">
                {product.discountBadge && (
                  <span className="discount-tag">{product.discountBadge}</span>
                )}
                <img
                  src={activeImage}
                  alt={product.name}
                  className="main-showcase-image"
                  onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                />
              </div>

              {/* Thumbnails Row */}
              {gallery.length > 1 && (
                <div className="thumbnails-row">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`thumb-btn ${selectedImageIdx === idx ? 'active' : ''}`}
                    >
                      <img src={img} alt={`Angle ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Badges */}
              <div className="trust-pills-card">
                <div className="trust-pill-item">
                  <span className="pill-icon">🛡️</span>
                  <div>
                    <strong>1-Year UAE Warranty</strong>
                    <p>Official manufacturer warranty coverage</p>
                  </div>
                </div>
                <div className="trust-pill-item">
                  <span className="pill-icon">🚚</span>
                  <div>
                    <strong>Express Delivery</strong>
                    <p>Same-day dispatch across Dubai & Emirates</p>
                  </div>
                </div>
                <div className="trust-pill-item">
                  <span className="pill-icon">📦</span>
                  <div>
                    <strong>Factory Sealed</strong>
                    <p>100% Brand new original packaging</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Specifications & Purchasing Controls */}
            <div className="info-column">
              <div className="brand-category-header">
                <span className="brand-chip">{product.brand || 'Premium Laptop'}</span>
                <span className="category-chip">{product.category || 'High Performance'}</span>
              </div>

              <h1 className="product-title">{product.name}</h1>
              <p className="product-short-desc">{product.description}</p>

              {/* Pricing Block */}
              <div className="pricing-card">
                <div className="price-row">
                  <div className="price-main">
                    <span className="currency">AED</span>
                    <span className="amount">{Number(effectivePrice).toLocaleString()}</span>
                  </div>
                  {product.discountedPrice && (
                    <div className="price-strike">
                      AED {Number(product.price).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="tax-delivery-note">
                  Inclusive of all UAE taxes • Free delivery for orders over AED 5,000
                </div>
              </div>

              {/* Color Variant Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="variants-section">
                  <label className="variant-label">
                    Color Variant: <strong>{selectedColor}</strong>
                  </label>
                  <div className="color-swatches">
                    {product.colors.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedColor(c)}
                        className={`color-btn ${selectedColor === c ? 'active' : ''}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Stepper & Action Buttons */}
              <div className="purchase-action-block">
                <div className="quantity-stepper">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="step-btn"
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className="qty-value">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="step-btn"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="add-to-cart-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                </button>

                <button onClick={handleBuyNow} className="buy-now-btn">
                  Buy Now →
                </button>
              </div>

              {/* Direct WhatsApp Consultation Button */}
              <a
                href={`https://wa.me/971509550121?text=${encodeURIComponent(`Hello Al Mukammal, I have questions about the "${product.name}" (AED ${Number(effectivePrice).toLocaleString()}). Is it in stock in your Dubai showroom?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-inquire-btn"
              >
                <span>💬 Ask Sales Specialist on WhatsApp</span>
              </a>

              {/* Technical Specifications Table */}
              <div className="specs-table-card">
                <h3 className="specs-card-title">Technical Specifications</h3>
                <div className="specs-grid">
                  {specs.cpu && (
                    <div className="spec-row">
                      <span className="spec-key">Processor (CPU)</span>
                      <span className="spec-val">{specs.cpu}</span>
                    </div>
                  )}
                  {specs.ram && (
                    <div className="spec-row">
                      <span className="spec-key">Memory (RAM)</span>
                      <span className="spec-val">{specs.ram}</span>
                    </div>
                  )}
                  {specs.gpu && (
                    <div className="spec-row">
                      <span className="spec-key">Graphics (GPU)</span>
                      <span className="spec-val">{specs.gpu}</span>
                    </div>
                  )}
                  {specs.storage && (
                    <div className="spec-row">
                      <span className="spec-key">Storage (SSD)</span>
                      <span className="spec-val">{specs.storage}</span>
                    </div>
                  )}
                  {specs.display && (
                    <div className="spec-row">
                      <span className="spec-key">Display</span>
                      <span className="spec-val">{specs.display}</span>
                    </div>
                  )}
                  {specs.battery && (
                    <div className="spec-row">
                      <span className="spec-key">Battery Life</span>
                      <span className="spec-val">{specs.battery}</span>
                    </div>
                  )}
                  {specs.os && (
                    <div className="spec-row">
                      <span className="spec-key">Operating System</span>
                      <span className="spec-val">{specs.os}</span>
                    </div>
                  )}
                  <div className="spec-row">
                    <span className="spec-key">Warranty</span>
                    <span className="spec-val">{product.warranty || '1 Year Manufacturer Warranty'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .product-detail-root {
          min-height: 100vh;
          background: var(--bg-default, #ffffff);
          color: var(--text-primary, #080808);
          padding-bottom: 6rem;
        }

        .breadcrumb-nav {
          padding: 1.25rem 1.5rem;
          background: #f7f8fa;
          border-bottom: 1px solid var(--border-subtle, #e5e7eb);
        }

        .nav-inner {
          max-width: var(--container-max, 1280px);
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.88rem;
          color: var(--text-secondary, #5f6368);
          overflow-x: auto;
          white-space: nowrap;
        }

        .nav-inner a {
          color: var(--text-secondary, #5f6368);
          text-decoration: none;
          transition: color 0.2s;
        }

        .nav-inner a:hover {
          color: var(--text-primary, #080808);
        }

        .current-crumb {
          color: var(--text-primary, #080808);
          font-weight: 600;
        }

        .detail-container {
          max-width: var(--container-max, 1280px);
          margin: 3rem auto 0;
          padding: 0 1.5rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
        }

        @media (max-width: 960px) {
          .detail-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
        }

        /* Gallery Column */
        .gallery-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .main-image-viewport {
          position: relative;
          width: 100%;
          height: 480px;
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem;
          overflow: hidden;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
        }

        .main-showcase-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .main-showcase-image:hover {
          transform: scale(1.04);
        }

        .discount-tag {
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          background: #ef4444;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          letter-spacing: 0.04em;
        }

        .thumbnails-row {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .thumb-btn {
          width: 80px;
          height: 80px;
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 16px;
          padding: 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }

        .thumb-btn img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .thumb-btn:hover {
          border-color: #cbd5e1;
          background: #ffffff;
        }

        .thumb-btn.active {
          border-color: var(--blue-primary, #0866ff);
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(8, 102, 255, 0.15);
        }

        .trust-pills-card {
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 24px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-top: 0.5rem;
        }

        .trust-pill-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .pill-icon {
          font-size: 1.5rem;
        }

        .trust-pill-item strong {
          display: block;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary, #080808);
          margin-bottom: 0.15rem;
        }

        .trust-pill-item p {
          font-size: 0.8rem;
          color: var(--text-secondary, #5f6368);
          margin: 0;
        }

        /* Info Column */
        .info-column {
          display: flex;
          flex-direction: column;
        }

        .brand-category-header {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .brand-chip {
          background: var(--blue-soft, #eaf3ff);
          color: var(--blue-primary, #0866ff);
          border: 1px solid rgba(8, 102, 255, 0.15);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.3rem 0.8rem;
          border-radius: 9999px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .category-chip {
          background: #f7f8fa;
          color: var(--text-secondary, #5f6368);
          border: 1px solid var(--border-subtle, #e5e7eb);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.3rem 0.8rem;
          border-radius: 9999px;
        }

        .product-title {
          font-size: clamp(2rem, 3vw + 0.5rem, 2.75rem);
          font-weight: 850;
          letter-spacing: -0.03em;
          color: var(--text-primary, #080808);
          line-height: 1.18;
          margin: 0 0 1rem 0;
        }

        .product-short-desc {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--text-secondary, #5f6368);
          margin: 0 0 2rem 0;
        }

        .pricing-card {
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 24px;
          padding: 1.5rem 1.75rem;
          margin-bottom: 2rem;
        }

        .price-row {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          margin-bottom: 0.4rem;
        }

        .price-main {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
        }

        .currency {
          font-size: 1.25rem;
          font-weight: 750;
          color: var(--blue-primary, #0866ff);
        }

        .amount {
          font-size: 2.5rem;
          font-weight: 850;
          letter-spacing: -0.03em;
          color: var(--text-primary, #080808);
        }

        .price-strike {
          font-size: 1.15rem;
          color: #9ca3af;
          text-decoration: line-through;
          font-weight: 500;
        }

        .tax-delivery-note {
          font-size: 0.8rem;
          color: var(--text-secondary, #5f6368);
        }

        .variants-section {
          margin-bottom: 2rem;
        }

        .variant-label {
          display: block;
          font-size: 0.88rem;
          color: var(--text-secondary, #5f6368);
          margin-bottom: 0.75rem;
        }

        .variant-label strong {
          color: var(--text-primary, #080808);
        }

        .color-swatches {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
        }

        .color-btn {
          background: #ffffff;
          border: 1px solid var(--border-subtle, #e5e7eb);
          color: var(--text-primary, #080808);
          padding: 0.5rem 1.15rem;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .color-btn:hover {
          border-color: #cbd5e1;
          background: #f7f8fa;
        }

        .color-btn.active {
          background: var(--text-primary, #080808);
          color: #ffffff;
          border-color: var(--text-primary, #080808);
          box-shadow: 0 4px 12px rgba(8, 8, 8, 0.15);
        }

        /* Action Buttons */
        .purchase-action-block {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.25rem;
        }

        .quantity-stepper {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 9999px;
          padding: 0.3rem 0.4rem;
        }

        .step-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: #f7f8fa;
          color: var(--text-primary, #080808);
          font-size: 1.2rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }

        .step-btn:hover:not(:disabled) {
          background: #eef1f5;
        }

        .step-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .qty-value {
          padding: 0 1.1rem;
          font-weight: 750;
          font-size: 0.95rem;
          color: var(--text-primary, #080808);
        }

        .add-to-cart-btn {
          flex: 1;
          min-width: 170px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          background: var(--text-primary, #080808);
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          padding: 0.95rem 1.75rem;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .add-to-cart-btn:hover {
          background: var(--blue-primary, #0866ff);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -4px rgba(8, 102, 255, 0.35);
        }

        .buy-now-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--blue-primary, #0866ff);
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          padding: 0.95rem 1.75rem;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .buy-now-btn:hover {
          background: var(--blue-secondary, #2b8cff);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -4px rgba(8, 102, 255, 0.35);
        }

        .whatsapp-inquire-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
          border-radius: 9999px;
          padding: 0.9rem;
          text-decoration: none;
          font-size: 0.92rem;
          font-weight: 700;
          margin-bottom: 2.5rem;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .whatsapp-inquire-btn:hover {
          background: #dcfce7;
          border-color: #86efac;
          transform: translateY(-1px);
        }

        /* Specs Table */
        .specs-table-card {
          background: #ffffff;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 24px;
          padding: 1.75rem;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
        }

        .specs-card-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--text-primary, #080808);
          margin: 0 0 1.25rem 0;
          letter-spacing: -0.02em;
        }

        .specs-grid {
          display: flex;
          flex-direction: column;
        }

        .spec-row {
          display: flex;
          justify-content: space-between;
          padding: 0.9rem 0;
          border-bottom: 1px solid var(--border-subtle, #e5e7eb);
          font-size: 0.88rem;
        }

        .spec-row:last-child {
          border-bottom: none;
        }

        .spec-key {
          color: var(--text-secondary, #5f6368);
          font-weight: 500;
        }

        .spec-val {
          color: var(--text-primary, #080808);
          font-weight: 600;
          text-align: right;
          max-width: 60%;
        }

        .detail-loading-screen,
        .detail-error-screen {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
          background: var(--bg-default, #ffffff);
          color: var(--text-primary, #080808);
        }

        .spinner {
          width: 44px;
          height: 44px;
          border: 3px solid rgba(8, 102, 255, 0.15);
          border-top-color: var(--blue-primary, #0866ff);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 1.25rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-icon {
          font-size: 2.75rem;
          margin-bottom: 1rem;
        }

        .back-catalog-btn {
          background: var(--text-primary, #080808);
          color: #ffffff;
          border-radius: 9999px;
          padding: 0.85rem 1.85rem;
          text-decoration: none;
          font-weight: 600;
          margin-top: 1.25rem;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .back-catalog-btn:hover {
          background: var(--blue-primary, #0866ff);
          transform: translateY(-2px);
        }
      `}</style>
    </ClientLayout>
  );
}