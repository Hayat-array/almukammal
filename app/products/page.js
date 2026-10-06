'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import ClientLayout from '../ClientLayout';

function ProductsCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters from URL or State
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialBrand = searchParams.get('brand') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Sync state if query params change
  useEffect(() => {
    if (searchParams.get('search')) setSearchQuery(searchParams.get('search'));
    if (searchParams.get('category')) setSelectedCategory(searchParams.get('category'));
    if (searchParams.get('brand')) setSelectedBrand(searchParams.get('brand'));
  }, [searchParams]);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        setLoading(true);
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        } else {
          setError('Failed to load products');
        }
      } catch {
        setError('Error connecting to catalog server');
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, []);

  // Filter and Sort Processing
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Text Search Filter (name, specs, description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const name = (p.name || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const cpu = (p.specs?.cpu || '').toLowerCase();
        const gpu = (p.specs?.gpu || '').toLowerCase();
        return name.includes(q) || brand.includes(q) || cpu.includes(q) || gpu.includes(q);
      });
    }

    // 2. Brand Filter
    if (selectedBrand) {
      result = result.filter(p => {
        const pBrand = (p.brand || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        const b = selectedBrand.toLowerCase();
        return pBrand === b || pName.includes(b);
      });
    }

    // 3. Category Filter
    if (selectedCategory) {
      result = result.filter(p => {
        const pCat = (p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        const c = selectedCategory.toLowerCase();
        return pCat.includes(c) || pName.includes(c);
      });
    }

    // 4. Price Range Filter
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      result = result.filter(p => {
        const price = p.discountedPrice || p.price;
        if (max) return price >= min && price <= max;
        return price >= min;
      });
    }

    // 5. Sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => (a.discountedPrice || a.price) - (b.discountedPrice || b.price));
        break;
      case 'price-high':
        result.sort((a, b) => (b.discountedPrice || b.price) - (a.discountedPrice || a.price));
        break;
      case 'name':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
    }

    return result;
  }, [products, searchQuery, selectedBrand, selectedCategory, priceRange, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const pageNumbers = useMemo(() => {
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    pages.push(1);

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      start = 2;
      end = 4;
    } else if (currentPage >= totalPages - 2) {
      start = totalPages - 3;
      end = totalPages - 1;
    }

    if (start > 2) {
      pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const brands = ['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'MSI', 'Razer'];
  const categories = ['Gaming', 'Ultrabook', 'Workstation'];

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedBrand('');
    setSelectedCategory('');
    setPriceRange('');
    setSortBy('newest');
    setCurrentPage(1);
    router.push('/products');
  };

  const hasActiveFilters = searchQuery || selectedBrand || selectedCategory || priceRange;

  return (
    <div className="catalog-root">
      {/* Header Banner */}
      <div className="catalog-header">
        <div className="header-container">
          <span className="header-tag">UAE SHOWROOM INVENTORY</span>
          <h1 className="header-title">Laptops & Hardware Catalog</h1>
          <p className="header-desc">
            Explore authentic laptops with full manufacturer warranty and same-day Dubai dispatch.
          </p>
        </div>
      </div>

      <div className="catalog-container">
        {/* Modern Filter Toolbar */}
        <div className="toolbar-card">
          <div className="toolbar-row">
            {/* Search Input */}
            <div className="search-wrap">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by model, CPU, RTX..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="catalog-search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="clear-search-btn">×</button>
              )}
            </div>

            {/* Price Range Dropdown */}
            <select
              value={priceRange}
              onChange={(e) => { setPriceRange(e.target.value); setCurrentPage(1); }}
              className="filter-select"
            >
              <option value="">All Price Ranges</option>
              <option value="0-3000">Under AED 3,000</option>
              <option value="3000-5000">AED 3,000 – 5,000</option>
              <option value="5000-8000">AED 5,000 – 8,000</option>
              <option value="8000-15000">AED 8,000 – 15,000</option>
              <option value="15000-999999">Above AED 15,000</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="newest">Sort by: Newest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>
          </div>

          {/* Filter Pills Row (Brands & Categories) */}
          <div className="pill-filters-row">
            <span className="pill-label">Categories:</span>
            <button
              onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
              className={`filter-pill ${!selectedCategory ? 'active' : ''}`}
            >
              All
            </button>
            {categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => { setSelectedCategory(cat === selectedCategory ? '' : cat); setCurrentPage(1); }}
                className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}

            <div className="filter-divider"></div>

            <span className="pill-label">Brands:</span>
            <button
              onClick={() => { setSelectedBrand(''); setCurrentPage(1); }}
              className={`filter-pill ${!selectedBrand ? 'active' : ''}`}
            >
              All
            </button>
            {brands.map((b, i) => (
              <button
                key={i}
                onClick={() => { setSelectedBrand(b === selectedBrand ? '' : b); setCurrentPage(1); }}
                className={`filter-pill ${selectedBrand === b ? 'active' : ''}`}
              >
                {b}
              </button>
            ))}

            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="clear-all-pill">
                Reset Filters ↺
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="results-meta">
          <span>Showing <strong>{filteredProducts.length}</strong> available laptop models</span>
          {hasActiveFilters && <span className="active-tag">• Filtered</span>}
        </div>

        {/* Product Grid / States */}
        {loading ? (
          <div className="catalog-loading">
            <div className="spinner"></div>
            <p>Querying live showroom inventory...</p>
          </div>
        ) : error ? (
          <div className="catalog-error">
            <p>⚠️ {error}</p>
            <button onClick={() => window.location.reload()} className="action-btn">
              Retry Connection
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="catalog-empty">
            <span className="empty-icon">🔍</span>
            <h3>No matching laptops found</h3>
            <p>Try broadening your search keywords or resetting brand and price filters.</p>
            <button onClick={clearAllFilters} className="reset-btn">
              View All Laptops
            </button>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {paginatedProducts.map(product => (
                <ProductCard key={product.id || product._id} product={product} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-bar">
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="page-nav-btn"
                  aria-label="Previous Page"
                >
                  ← Previous
                </button>
                <div className="page-numbers">
                  {pageNumbers.map((page, idx) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="page-ellipsis">
                          …
                        </span>
                      );
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`page-num-btn ${currentPage === page ? 'active' : ''}`}
                        aria-current={currentPage === page ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="page-nav-btn"
                  aria-label="Next Page"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .catalog-root {
          min-height: 100vh;
          background: var(--bg-default, #ffffff);
          color: var(--text-primary, #080808);
          padding-bottom: 6rem;
        }

        .catalog-header {
          padding: 4rem 1.5rem 3rem;
          background: linear-gradient(180deg, #f7f8fa 0%, #ffffff 100%);
          text-align: center;
          border-bottom: 1px solid var(--border-subtle, #e5e7eb);
        }

        .header-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .header-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--blue-primary, #0866ff);
          background: var(--blue-soft, #eaf3ff);
          border: 1px solid rgba(8, 102, 255, 0.15);
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        .header-title {
          font-size: clamp(2.2rem, 3.5vw + 0.5rem, 3.25rem);
          font-weight: 850;
          letter-spacing: -0.03em;
          margin: 0 0 0.85rem 0;
          color: var(--text-primary, #080808);
          line-height: 1.15;
        }

        .header-desc {
          font-size: 1.05rem;
          color: var(--text-secondary, #5f6368);
          line-height: 1.6;
          margin: 0;
          max-width: 600px;
          margin: 0 auto;
        }

        .catalog-container {
          max-width: var(--container-max, 1280px);
          margin: 2.5rem auto 0;
          padding: 0 1.5rem;
        }

        /* Filter Toolbar Card */
        .toolbar-card {
          background: #ffffff;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 28px;
          padding: 1.5rem 1.75rem;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
        }

        .toolbar-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .search-wrap {
          flex: 1;
          min-width: 260px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 1.15rem;
          color: var(--text-secondary, #5f6368);
          pointer-events: none;
        }

        .catalog-search-input {
          width: 100%;
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          border-radius: 9999px;
          padding: 0.8rem 2.5rem 0.8rem 2.85rem;
          color: var(--text-primary, #080808);
          font-size: 0.92rem;
          outline: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .catalog-search-input:focus {
          border-color: var(--blue-primary, #0866ff);
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(8, 102, 255, 0.12);
        }

        .catalog-search-input::placeholder {
          color: #9ca3af;
        }

        .clear-search-btn {
          position: absolute;
          right: 1.1rem;
          background: transparent;
          border: none;
          color: var(--text-secondary, #5f6368);
          font-size: 1.25rem;
          cursor: pointer;
          line-height: 1;
        }

        .filter-select {
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          color: var(--text-primary, #080808);
          border-radius: 9999px;
          padding: 0.8rem 1.35rem;
          font-size: 0.88rem;
          font-weight: 500;
          outline: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-select:focus {
          border-color: var(--blue-primary, #0866ff);
          background: #ffffff;
        }

        .filter-select option {
          background: #ffffff;
          color: #080808;
        }

        /* Pill Filters */
        .pill-filters-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle, #e5e7eb);
        }

        .pill-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary, #5f6368);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-right: 0.25rem;
        }

        .filter-pill {
          background: #f7f8fa;
          border: 1px solid var(--border-subtle, #e5e7eb);
          color: var(--text-secondary, #5f6368);
          font-size: 0.82rem;
          font-weight: 600;
          padding: 0.4rem 0.95rem;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .filter-pill:hover {
          background: #eef1f5;
          color: var(--text-primary, #080808);
          border-color: #d1d5db;
        }

        .filter-pill.active {
          background: var(--text-primary, #080808);
          border-color: var(--text-primary, #080808);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(8, 8, 8, 0.15);
        }

        .filter-divider {
          width: 1px;
          height: 18px;
          background: var(--border-subtle, #e5e7eb);
          margin: 0 0.4rem;
        }

        .clear-all-pill {
          margin-left: auto;
          background: transparent;
          border: none;
          color: #ef4444;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .clear-all-pill:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .results-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.92rem;
          color: var(--text-secondary, #5f6368);
          margin-bottom: 1.75rem;
        }

        .results-meta strong {
          color: var(--text-primary, #080808);
        }

        .active-tag {
          color: var(--blue-primary, #0866ff);
          font-weight: 600;
        }

        /* Grid */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
        }

        .catalog-loading,
        .catalog-error,
        .catalog-empty {
          text-align: center;
          padding: 5rem 1.5rem;
          background: #ffffff;
          border-radius: 28px;
          border: 1px solid var(--border-subtle, #e5e7eb);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
        }

        .spinner {
          width: 44px;
          height: 44px;
          border: 3px solid rgba(8, 102, 255, 0.15);
          border-top-color: var(--blue-primary, #0866ff);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1.25rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-icon {
          font-size: 2.75rem;
          display: block;
          margin-bottom: 1rem;
        }

        .catalog-empty h3 {
          font-size: 1.35rem;
          font-weight: 750;
          color: var(--text-primary, #080808);
          margin: 0 0 0.5rem 0;
        }

        .catalog-empty p {
          color: var(--text-secondary, #5f6368);
          font-size: 0.95rem;
          margin: 0 0 1.5rem 0;
        }

        .reset-btn,
        .action-btn {
          background: var(--text-primary, #080808);
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          padding: 0.75rem 1.85rem;
          font-weight: 600;
          font-size: 0.92rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .reset-btn:hover,
        .action-btn:hover {
          background: var(--blue-primary, #0866ff);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(8, 102, 255, 0.3);
        }

        /* Pagination Bar */
        .pagination-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 4rem;
          flex-wrap: wrap;
        }

        .page-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid var(--border-subtle, #e5e7eb);
          color: var(--text-primary, #080808);
          padding: 0.65rem 1.35rem;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .page-nav-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #0866ff;
          color: #0866ff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(8, 102, 255, 0.15);
        }

        .page-nav-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          box-shadow: none;
        }

        .page-numbers {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #f8fafc;
          padding: 4px 6px;
          border-radius: 9999px;
          border: 1px solid #e2e8f0;
        }

        .page-num-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: transparent;
          border: 1px solid transparent;
          color: #475569;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .page-num-btn:hover:not(.active) {
          color: #080808;
          background: #ffffff;
          border-color: #cbd5e1;
          transform: scale(1.05);
        }

        .page-num-btn.active {
          background: #0866ff;
          color: #ffffff;
          border-color: #0866ff;
          box-shadow: 0 4px 14px rgba(8, 102, 255, 0.38);
          font-weight: 850;
        }

        .page-ellipsis {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 38px;
          color: #94a3b8;
          font-weight: 800;
          font-size: 1rem;
          letter-spacing: 0.05em;
          user-select: none;
        }

        @media (max-width: 640px) {
          .pagination-bar {
            gap: 0.5rem;
            margin-top: 2.5rem;
          }

          .page-numbers {
            gap: 0.2rem;
            padding: 3px 4px;
          }

          .page-num-btn {
            width: 32px;
            height: 32px;
            font-size: 0.8rem;
          }

          .page-ellipsis {
            width: 24px;
            height: 32px;
            font-size: 0.85rem;
          }

          .page-nav-btn {
            padding: 0.5rem 0.95rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <ClientLayout>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FFFFFF' }} />}>
        <ProductsCatalogContent />
      </Suspense>
    </ClientLayout>
  );
}