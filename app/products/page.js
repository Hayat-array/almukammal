'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import products from '@/data/products';

const ITEMS_PER_PAGE = 8;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const searchQuery = searchParams.get('search') || '';
  
  console.log('=== PRODUCTS PAGE DEBUG ===');
  console.log('Search query:', searchQuery);
  console.log('Total products:', products.length);

  const currentYear = new Date().getFullYear();

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    const yearA = a.year || (a.releaseDate ? new Date(a.releaseDate).getFullYear() : 0);
    const yearB = b.year || (b.releaseDate ? new Date(b.releaseDate).getFullYear() : 0);
    return yearB - yearA;
  }).map(product => ({
    ...product,
    isNew: (product.year === currentYear) || 
           (product.releaseDate && new Date(product.releaseDate).getFullYear() === currentYear)
  }));

  // Filter products based on search query - FIXED VERSION
  let filteredProducts = sortedProducts;
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase().trim();
    console.log('Filtering with query:', query);
    
    filteredProducts = sortedProducts.filter(product => {
      // Search in name
      if (product.name?.toLowerCase().includes(query)) {
        console.log('Match in name:', product.name);
        return true;
      }
      
      // Search in description
      if (product.description?.toLowerCase().includes(query)) {
        console.log('Match in description:', product.name);
        return true;
      }
      
      // Search in specs object
      if (product.specs) {
        // Check each spec field individually
        if (product.specs.cpu?.toLowerCase().includes(query)) return true;
        if (product.specs.ram?.toLowerCase().includes(query)) return true;
        if (product.specs.storage?.toLowerCase().includes(query)) return true;
        if (product.specs.gpu?.toLowerCase().includes(query)) return true;
        if (product.specs.display?.toLowerCase().includes(query)) return true;
      }
      
      // Search in brand (extract from name)
      const brands = ['hp', 'dell', 'lenovo', 'asus', 'acer', 'apple', 'samsung', 'msi'];
      const matchedBrand = brands.find(brand => 
        product.name.toLowerCase().includes(brand) && query.includes(brand)
      );
      if (matchedBrand) return true;
      
      return false;
    });
  }

  console.log('Filtered products count:', filteredProducts.length);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    const params = new URLSearchParams();
    params.set('page', page);
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    router.push(`/products?${params.toString()}`);
  };

  const clearSearch = () => {
    router.push('/products');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)', padding: '1.5rem 0' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
        
        {/* DEBUG INFO */}
        {/* <div style={{ background: '#fff3cd', border: '2px solid #ffc107', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
          <strong>DEBUG INFO:</strong><br/>
          Total Products: {products.length}<br/>
          Search Query: "{searchQuery}"<br/>
          Filtered Products: {filteredProducts.length}<br/>
          Current Page: {currentPage}<br/>
          Showing: {currentProducts.length} products
        </div> */}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.75rem' }}>
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Premium Laptops'}
          </h1>
          
          {searchQuery && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '0.5rem 1rem' }}>
                <span style={{ color: '#4b5563', fontSize: '0.875rem' }}>Found</span>
                <span style={{ fontWeight: 'bold', color: '#2563eb', marginLeft: '0.25rem' }}>{filteredProducts.length} results</span>
              </div>
              <button onClick={clearSearch} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                Clear Search
              </button>
            </div>
          )}
          
          <div style={{ marginTop: '1rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <span style={{ color: '#4b5563', fontSize: '0.875rem' }}>
              Showing {filteredProducts.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} laptops
            </span>
          </div>
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && searchQuery ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>No laptops found</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>No products match "{searchQuery}"</p>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Try searching for:</p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {['HP', 'Dell', 'i7', '16GB', 'Gaming', 'SSD'].map(term => (
                  <button
                    key={term}
                    onClick={() => router.push(`/products?search=${term}`)}
                    style={{
                      background: '#e5e7eb',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '0.375rem',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={clearSearch} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: '500' }}>
              View All Products
            </button>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '1.5rem', 
              marginBottom: '2rem' 
            }}>
              {currentProducts.map(product => (
                <div key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
                <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredProducts.length} onPageChange={handlePageChange} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}