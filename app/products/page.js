'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
// import products from '@/data/products';
import ClientLayout from '../ClientLayout';

const ITEMS_PER_PAGE = 12;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterPriceRange, setFilterPriceRange] = useState('');
  const [products, setProducts] = useState([]);
  const [viewMode, setViewMode] = useState('grid');

  const currentPage = parseInt(searchParams.get('page')) || 1;
  const searchQuery = searchParams.get('search') || '';
  const currentYear = new Date().getFullYear();

  // Extract unique brands from products
  const availableBrands = useMemo(() => {
    const brands = new Set();
    products.forEach(product => {
      const name = product.name.toLowerCase();
      // Extract brand from product name
      if (name.includes('apple') || name.includes('macbook')) brands.add('Apple');
      else if (name.includes('dell')) brands.add('Dell');
      else if (name.includes('hp')) brands.add('HP');
      else if (name.includes('lenovo')) brands.add('Lenovo');
      else if (name.includes('asus')) brands.add('ASUS');
      else if (name.includes('acer')) brands.add('Acer');
      else if (name.includes('msi')) brands.add('MSI');
      else if (name.includes('razer')) brands.add('Razer');
      else if (name.includes('samsung')) brands.add('Samsung');
      else if (name.includes('microsoft')) brands.add('Microsoft');
      else if (name.includes('lg')) brands.add('LG');
      else brands.add('Other');
    });
    return Array.from(brands);
  }, []);

  // Process and filter products
  const { filteredProducts, similarProducts, showingSimilar } = useMemo(() => {
    // Sort products
    let sortedProducts = [...products];

    switch (sortBy) {
      case 'newest':
        sortedProducts.sort((a, b) => {
          // Use createdAt, releaseDate, or year for sorting
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.releaseDate ? new Date(a.releaseDate).getTime() : (a.year ? new Date(a.year, 0, 1).getTime() : 0));
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.releaseDate ? new Date(b.releaseDate).getTime() : (b.year ? new Date(b.year, 0, 1).getTime() : 0));
          return dateB - dateA;
        });
        break;
      case 'price-low':
        sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sortedProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    // Mark new products
    sortedProducts = sortedProducts.map(product => ({
      ...product,
      isNew: (product.year === currentYear) ||
        (product.releaseDate && new Date(product.releaseDate).getFullYear() === currentYear) ||
        (product.createdAt && new Date(product.createdAt).getFullYear() === currentYear)
    }));

    // Apply filters
    let filtered = sortedProducts;

    // Brand filter
    if (filterBrand) {
      filtered = filtered.filter(product => {
        const name = product.name.toLowerCase();
        if (filterBrand === 'Apple') return name.includes('apple') || name.includes('macbook');
        if (filterBrand === 'Dell') return name.includes('dell');
        if (filterBrand === 'HP') return name.includes('hp');
        if (filterBrand === 'Lenovo') return name.includes('lenovo');
        if (filterBrand === 'ASUS') return name.includes('asus');
        if (filterBrand === 'Acer') return name.includes('acer');
        if (filterBrand === 'MSI') return name.includes('msi');
        if (filterBrand === 'Razer') return name.includes('razer');
        if (filterBrand === 'Samsung') return name.includes('samsung');
        if (filterBrand === 'Microsoft') return name.includes('microsoft');
        if (filterBrand === 'LG') return name.includes('lg');
        if (filterBrand === 'Other') return !availableBrands.slice(0, -1).some(brand => {
          const brandName = brand.toLowerCase();
          return name.includes(brandName);
        });
        return false;
      });
    }

    // Price range filter
    if (filterPriceRange) {
      const [min, max] = filterPriceRange.split('-').map(Number);
      filtered = filtered.filter(product => {
        if (!isNaN(min) && product.price < min) return false;
        if (!isNaN(max) && product.price > max) return false;
        return true;
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => {
        // Search in name
        if (product.name?.toLowerCase().includes(query)) return true;
        // Search in description
        if (product.description?.toLowerCase().includes(query)) return true;
        // Search in specs
        if (product.specs) {
          const specsString = JSON.stringify(product.specs).toLowerCase();
          if (specsString.includes(query)) return true;
        }
        return false;
      });
    }

    // Similar products logic for no search results
    let similar = [];
    let showSimilar = false;

    if (filtered.length === 0 && searchQuery) {
      const brands = ['apple', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'msi', 'razer', 'samsung', 'microsoft', 'lg'];
      const queryLower = searchQuery.toLowerCase();
      const matchedBrand = brands.find(brand => queryLower.includes(brand));

      if (matchedBrand) {
        similar = sortedProducts.filter(product => {
          const nameLower = product.name.toLowerCase();
          return nameLower.includes(matchedBrand);
        }).slice(0, 12);
        showSimilar = true;
      }
    }

    return {
      filteredProducts: filtered,
      similarProducts: similar,
      showingSimilar: showSimilar
    };
  }, [products, sortBy, filterBrand, filterPriceRange, searchQuery, currentYear, availableBrands]);

  const displayProducts = showingSimilar ? similarProducts : filteredProducts;
  const totalPages = Math.ceil(displayProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = displayProducts.slice(startIndex, endIndex);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', currentPage);
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (filterBrand) params.set('brand', filterBrand);
    if (filterPriceRange) params.set('price', filterPriceRange);

    const queryString = params.toString();
    if (queryString !== searchParams.toString()) {
      router.push(`/products?${queryString}`);
    }
  }, [currentPage, searchQuery, sortBy, filterBrand, filterPriceRange, router, searchParams]);

  const handlePageChange = (page) => {
    const params = new URLSearchParams();
    params.set('page', page);
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (filterBrand) params.set('brand', filterBrand);
    if (filterPriceRange) params.set('price', filterPriceRange);
    router.push(`/products?${params.toString()}`);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
  };

  const handleBrandChange = (value) => {
    setFilterBrand(value);
  };

  const handlePriceRangeChange = (value) => {
    setFilterPriceRange(value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const query = formData.get('search');
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (filterBrand) params.set('brand', filterBrand);
    if (filterPriceRange) params.set('price', filterPriceRange);
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setSortBy('newest');
    setFilterBrand('');
    setFilterPriceRange('');
    router.push('/products');
  };

  const clearSearch = () => {
    const params = new URLSearchParams();
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (filterBrand) params.set('brand', filterBrand);
    if (filterPriceRange) params.set('price', filterPriceRange);
    router.push(`/products?${params.toString()}`);
  };

  // Fetch products from API
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <ClientLayout>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(59, 130, 246, 0.2)',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#4b5563' }}>Loading products...</p>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)', padding: '1.5rem 0' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.75rem' }}>
              Premium Laptops
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Discover the latest in laptop technology</p>
          </div>

          {/* Search and Filters */}
          <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', padding: '1.5rem', marginBottom: '2rem' }}>
            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  name="search"
                  placeholder="Search laptops by name, brand, or specs..."
                  defaultValue={searchQuery}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Search
                </button>
              </div>
            </form>

            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Sort By */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                    Brand
                  </label>
                  <select
                    value={filterBrand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">All Brands</option>
                    {availableBrands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                    Price Range
                  </label>
                  <select
                    value={filterPriceRange}
                    onChange={(e) => handlePriceRangeChange(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">All Prices</option>
                    <option value="0-1000">Under AED 1,000</option>
                    <option value="1000-2000">AED 1,000 - 2,000</option>
                    <option value="2000-3000">AED 2,000 - 3,000</option>
                    <option value="3000-5000">AED 3,000 - 5,000</option>
                    <option value="5000-99999">Above AED 5,000</option>
                  </select>
                </div>

                {/* View Mode */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                    View
                  </label>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={() => setViewMode('grid')}
                      style={{
                        padding: '0.5rem',
                        background: viewMode === 'grid' ? '#3b82f6' : '#f3f4f6',
                        color: viewMode === 'grid' ? 'white' : '#374151',
                        border: 'none',
                        borderRadius: '0.375rem 0 0 0.375rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      style={{
                        padding: '0.5rem',
                        background: viewMode === 'list' ? '#3b82f6' : '#f3f4f6',
                        color: viewMode === 'list' ? 'white' : '#374151',
                        border: 'none',
                        borderRadius: '0 0.375rem 0.375rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchQuery || sortBy !== 'newest' || filterBrand || filterPriceRange) && (
                <button
                  onClick={clearFilters}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Active Filters Display */}
            {(searchQuery || sortBy !== 'newest' || filterBrand || filterPriceRange) && (
              <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {searchQuery && (
                  <div style={{ background: '#dbeafe', color: '#1e40af', borderRadius: '0.375rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Search: "{searchQuery}"
                    <button onClick={clearSearch} style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontSize: '1rem', lineHeight: '1' }}>×</button>
                  </div>
                )}
                {sortBy !== 'newest' && (
                  <div style={{ background: '#dbeafe', color: '#1e40af', borderRadius: '0.375rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                    Sort: {sortBy === 'price-low' ? 'Price Low to High' : sortBy === 'price-high' ? 'Price High to Low' : 'Name A-Z'}
                  </div>
                )}
                {filterBrand && (
                  <div style={{ background: '#dbeafe', color: '#1e40af', borderRadius: '0.375rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                    Brand: {filterBrand}
                  </div>
                )}
                {filterPriceRange && (
                  <div style={{ background: '#dbeafe', color: '#1e40af', borderRadius: '0.375rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                    Price: {filterPriceRange === '0-1000' ? 'Under AED 1,000' :
                      filterPriceRange === '1000-2000' ? 'AED 1,000 - 2,000' :
                        filterPriceRange === '2000-3000' ? 'AED 2,000 - 3,000' :
                          filterPriceRange === '3000-5000' ? 'AED 3,000 - 5,000' :
                            filterPriceRange === '5000-99999' ? 'Above AED 5,000' : filterPriceRange}
                  </div>
                )}
              </div>
            )}

            {/* Results Info */}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                Showing {displayProducts.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, displayProducts.length)} of {displayProducts.length} laptops
              </div>
              {showingSimilar && (
                <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', color: '#92400e', borderRadius: '0.375rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                  No exact matches - Showing similar products
                </div>
              )}
            </div>
          </div>

          {/* No Results */}
          {displayProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>No laptops found</h2>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>No products match "{searchQuery}"</p>
              <button onClick={clearFilters} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                View All Products
              </button>
            </div>
          ) : (
            <>
              {/* Products Grid/List */}
              <div style={{
                display: viewMode === 'grid'
                  ? 'grid'
                  : 'flex',
                flexDirection: 'column',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : 'none',
                gap: viewMode === 'grid' ? '1.5rem' : '1rem',
                marginBottom: '2rem'
              }}>
                {currentProducts.map(product => (
                  <div key={product.id} style={viewMode === 'list' ? { display: 'flex', gap: '1rem', padding: '1rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' } : {}}>
                    <ProductCard product={product} viewMode={viewMode} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
                  <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={displayProducts.length} onPageChange={handlePageChange} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}