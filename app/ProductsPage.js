'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import products from '@/data/products';
// import './ProdoctsPage.css'

const ITEMS_PER_PAGE = 8;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const searchQuery = searchParams.get('search') || '';
  
  console.log('=== PRODUCTS PAGE DEBUG ===');
  console.log('Total products in database:', products.length);
  console.log('Search query:', searchQuery);
  console.log('Current page:', currentPage);

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

  console.log('Sorted products:', sortedProducts.length);

  // Filter products
  let filteredProducts = sortedProducts;
  
  if (searchQuery) {
    filteredProducts = sortedProducts.filter(product => {
      const query = searchQuery.toLowerCase();
      
      // Search in name
      if (product.name?.toLowerCase().includes(query)) {
        console.log('Match found in name:', product.name);
        return true;
      }
      
      // Search in description
      if (product.description?.toLowerCase().includes(query)) {
        console.log('Match found in description:', product.name);
        return true;
      }
      
      // Search in specs
      if (product.specs) {
        const specsString = JSON.stringify(product.specs).toLowerCase();
        if (specsString.includes(query)) {
          console.log('Match found in specs:', product.name);
          return true;
        }
      }
      
      return false;
    });
  }

  console.log('Filtered products:', filteredProducts.length);
  if (filteredProducts.length > 0) {
    console.log('First filtered product:', filteredProducts[0]);
  }

  // Similar products logic
  const getSimilarProducts = () => {
    if (filteredProducts.length > 0 || !searchQuery) return [];
    
    const brands = ['apple', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'msi', 'razer', 'samsung', 'microsoft', 'lg'];
    const queryLower = searchQuery.toLowerCase();
    const matchedBrand = brands.find(brand => queryLower.includes(brand));
    
    if (matchedBrand) {
      console.log('Looking for similar products with brand:', matchedBrand);
      return sortedProducts.filter(product => {
        const nameLower = product.name.toLowerCase();
        return nameLower.includes(matchedBrand);
      }).slice(0, 8);
    }
    
    return [];
  };
  
  const similarProducts = getSimilarProducts();
  const showingSimilar = filteredProducts.length === 0 && similarProducts.length > 0;
  const displayProducts = showingSimilar ? similarProducts : filteredProducts;
  
  console.log('Display products:', displayProducts.length);
  console.log('Showing similar:', showingSimilar);
  
  const totalPages = Math.ceil(displayProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = displayProducts.slice(startIndex, endIndex);

  console.log('Current products to display:', currentProducts.length);
  console.log('Current products:', currentProducts.map(p => p.name));

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
      

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.75rem' }}>
            Premium Laptops
          </h1>
          
          {searchQuery && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', padding: '0.5rem 1rem' }}>
                <span style={{ color: '#4b5563', fontSize: '0.875rem' }}>Searching for:</span>
                <span style={{ fontWeight: 'bold', color: '#2563eb', marginLeft: '0.25rem' }}>"{searchQuery}"</span>
              </div>
              {showingSimilar && (
                <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', color: '#92400e', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                  No exact matches - Showing similar products
                </div>
              )}
              <button onClick={clearSearch} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                Clear Search
              </button>
            </div>
          )}
          
          <div style={{ marginTop: '1rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <span style={{ color: '#4b5563', fontSize: '0.875rem' }}>Showing {displayProducts.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, displayProducts.length)} of {displayProducts.length} laptops</span>
          </div>
        </div>

        {/* No Results */}
        {displayProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>No laptops found</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>No products match "{searchQuery}"</p>
            <button onClick={clearSearch} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
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
                <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={displayProducts.length} onPageChange={handlePageChange} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}