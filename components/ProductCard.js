'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

export default function ProductCard({ product, variant = 'light' }) {
  const [imageError, setImageError] = useState(false);
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const id = product?._id || product?.id;
  const specs = product?.specs || {};

  // Formatted image source
  const imageSrc = useMemo(() => {
    if (imageError || !product?.image) return '/placeholder.jpg';
    if (product.image.startsWith('http') || product.image.startsWith('/')) {
      return product.image;
    }
    return `/${product.image}`;
  }, [product?.image, imageError]);

  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      addToast('Please sign in to add items to your cart', 'info');
      router.push(`/auth/login?redirect=/products/${id}`);
      return;
    }

    setAdding(true);
    try {
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const itemIndex = existingCart.findIndex(item => (item.id || item._id) === id);

      if (itemIndex > -1) {
        existingCart[itemIndex].quantity = (existingCart[itemIndex].quantity || 1) + 1;
      } else {
        existingCart.push({
          id: id,
          _id: id,
          name: product.name,
          price: product.discountedPrice || product.price,
          originalPrice: product.price,
          image: imageSrc,
          quantity: 1,
          brand: product.brand,
          category: product.category
        });
      }

      localStorage.setItem('cart', JSON.stringify(existingCart));
      window.dispatchEvent(new Event('cartUpdated'));
      addToast(`Added "${product.name}" to cart!`, 'success');
    } catch {
      addToast('Error updating cart', 'error');
    } finally {
      setTimeout(() => setAdding(false), 500);
    }
  }, [id, product, imageSrc, user, addToast, router]);

  const hasDiscount = Boolean(product?.discountedPrice && product?.discountedPrice < product?.price);

  return (
    <div className={`product-card-root ${variant === 'dark' ? 'is-dark' : 'is-light'}`}>
      <Link href={`/products/${id}`} className="card-link" aria-label={`View ${product?.name}`}>
        {/* Thumbnail Image Container */}
        <div className="card-thumb-container">
          {hasDiscount && (
            <span className="card-badge discount-badge">
              {product.discountBadge || 'SALE'}
            </span>
          )}
          {product?.brand && (
            <span className="card-badge brand-badge">
              {product.brand}
            </span>
          )}
          <img
            src={imageSrc}
            alt={product?.name || 'High-performance laptop'}
            className="card-image"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        </div>

        {/* Card Content */}
        <div className="card-body">
          {/* Category Tag */}
          <div className="card-meta">
            <span className="category-text">{product?.category || 'Flagship Laptop'}</span>
            <span className="availability-badge">In Stock • UAE</span>
          </div>

          {/* Model Title */}
          <h3 className="card-title line-clamp-2" title={product?.name}>
            {product?.name}
          </h3>

          {/* Hardware Specs Micro-Pills */}
          <div className="card-specs-row">
            {specs.cpu && <span className="spec-pill">{specs.cpu}</span>}
            {specs.gpu && <span className="spec-pill spec-gpu">{specs.gpu}</span>}
            {specs.ram && <span className="spec-pill">{specs.ram}</span>}
            {specs.storage && <span className="spec-pill">{specs.storage}</span>}
          </div>

          {/* Footer: Pricing & Action Button */}
          <div className="card-footer">
            <div className="price-group">
              {hasDiscount ? (
                <>
                  <div className="price-original">AED {Number(product.price).toLocaleString()}</div>
                  <div className="price-current is-discounted">
                    AED {Number(product.discountedPrice).toLocaleString()}
                  </div>
                </>
              ) : (
                <div className="price-current">
                  AED {Number(product?.price || 0).toLocaleString()}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className={`add-cart-btn ${adding ? 'is-adding' : ''}`}
              aria-label="Add to shopping cart"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Add</span>
            </button>
          </div>
        </div>
      </Link>

      <style jsx>{`
        .product-card-root {
          border-radius: var(--radius-lg, 24px);
          overflow: hidden;
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.28s ease;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* LIGHT VARIANT (Default) */
        .is-light {
          background: #FFFFFF;
          border: 1px solid var(--border-main, #E5E7EB);
          box-shadow: var(--shadow-card, 0 4px 20px -2px rgba(0, 0, 0, 0.05));
        }

        .is-light:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-card-hover, 0 14px 34px -4px rgba(0, 0, 0, 0.09));
          border-color: #D1D5DB;
        }

        /* DARK VARIANT (For Dark Contrast Sections) */
        .is-dark {
          background: #14161A;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.25);
        }

        .is-dark:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.45);
          border-color: rgba(255, 255, 255, 0.18);
        }

        .card-link {
          text-decoration: none;
          display: flex;
          flex-direction: column;
          height: 100%;
          color: inherit;
        }

        /* Image Stage */
        .card-thumb-container {
          position: relative;
          width: 100%;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow: hidden;
          transition: background-color 0.2s;
        }

        .is-light .card-thumb-container {
          background: #F7F8FA;
          border-bottom: 1px solid var(--border-subtle, #EEF0F3);
        }

        .is-dark .card-thumb-container {
          background: #0B0B0D;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .card-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.08));
        }

        .product-card-root:hover .card-image {
          transform: scale(1.05);
        }

        /* Badges */
        .card-badge {
          position: absolute;
          z-index: 2;
          font-size: 0.675rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: var(--radius-full, 9999px);
          letter-spacing: 0.02em;
        }

        .discount-badge {
          top: 14px;
          left: 14px;
          background: #DC2626;
          color: #ffffff;
        }

        .brand-badge {
          top: 14px;
          right: 14px;
        }

        .is-light .brand-badge {
          background: rgba(255, 255, 255, 0.85);
          color: #5F6368;
          border: 1px solid #E5E7EB;
          backdrop-filter: blur(8px);
        }

        .is-dark .brand-badge {
          background: rgba(255, 255, 255, 0.1);
          color: #E5E7EB;
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        /* Body */
        .card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .category-text {
          font-size: 0.725rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--blue-primary, #0866FF);
        }

        .availability-badge {
          font-size: 0.675rem;
          color: #059669;
          font-weight: 600;
        }

        .card-title {
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1.35;
          margin: 0 0 14px 0;
          letter-spacing: -0.02em;
        }

        .is-light .card-title {
          color: #080808;
        }

        .is-dark .card-title {
          color: #ffffff;
        }

        /* Specs Row */
        .card-specs-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 20px;
        }

        .spec-pill {
          font-size: 0.725rem;
          font-weight: 600;
          padding: 4px 9px;
          border-radius: var(--radius-xs, 6px);
          white-space: nowrap;
        }

        .is-light .spec-pill {
          background: #F1F4F7;
          color: #5F6368;
          border: 1px solid #E5E7EB;
        }

        .is-dark .spec-pill {
          background: rgba(255, 255, 255, 0.05);
          color: #9BA1A6;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .spec-gpu {
          color: var(--blue-primary, #0866FF) !important;
        }

        .is-light .spec-gpu {
          background: var(--blue-soft, #EAF3FF);
          border-color: rgba(8, 102, 255, 0.2);
        }

        .is-dark .spec-gpu {
          background: rgba(8, 102, 255, 0.15);
          border-color: rgba(8, 102, 255, 0.3);
        }

        /* Footer */
        .card-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
        }

        .is-light .card-footer {
          border-top: 1px solid var(--border-subtle, #EEF0F3);
        }

        .is-dark .card-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .price-group {
          display: flex;
          flex-direction: column;
        }

        .price-original {
          font-size: 0.75rem;
          color: #9AA0A6;
          text-decoration: line-through;
          line-height: 1;
          margin-bottom: 2px;
        }

        .price-current {
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .is-light .price-current {
          color: #080808;
        }

        .is-dark .price-current {
          color: #ffffff;
        }

        .price-current.is-discounted {
          color: #DC2626 !important;
        }

        /* Add to Cart Pill Button */
        .add-cart-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-full, 9999px);
          font-size: 0.825rem;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.15s, transform 0.15s;
          border: none;
        }

        .is-light .add-cart-btn {
          background: #080808;
          color: #ffffff;
        }

        .is-light .add-cart-btn:hover {
          background: var(--blue-primary, #0866FF);
          transform: translateY(-1px);
        }

        .is-dark .add-cart-btn {
          background: #0866FF;
          color: #ffffff;
        }

        .is-dark .add-cart-btn:hover {
          background: #0756D6;
          transform: translateY(-1px);
        }

        .add-cart-btn.is-adding {
          opacity: 0.7;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}