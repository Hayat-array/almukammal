'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import products from '@/data/products';
import './ProductsPage.css';

const ITEMS_PER_PAGE = 9;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = parseInt(searchParams.get('page')) || 1;
  
  // Sort products by year/date (newest first)
  const sortedProducts = [...products].sort((a, b) => {
    // Priority 1: Use releaseDate if available (YYYY-MM-DD format)
    if (a.releaseDate && b.releaseDate) {
      return new Date(b.releaseDate) - new Date(a.releaseDate);
    }
    
    // Priority 2: Use year if available
    if (a.year && b.year) {
      return b.year - a.year;
    }
    
    // Priority 3: Use id as fallback (assuming higher IDs are newer)
    return b.id - a.id;
  });
  
  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    router.push(`/products?page=${page}`);
  };

  return (
    <div className="products-page">
      <div className="products-container">
        {/* Header - More Compact */}
        <div className="products-header">
          <h1 className="products-title">
            Premium Laptops
          </h1>
          <p className="products-subtitle">
            Discover our exclusive collection of high-performance laptops
          </p>
          <div className="products-sorting-info">
            <span className="sorting-badge">Sorted by: Newest First</span>
          </div>
          <div className="products-counter">
            <span className="counter-text">Showing</span>
            <span className="counter-number">{startIndex + 1}-{Math.min(endIndex, sortedProducts.length)}</span>
            <span className="counter-text">of</span>
            <span className="counter-number total">{sortedProducts.length}</span>
            <span className="counter-text">laptops</span>
          </div>
        </div>

        {/* Products Grid - Better spacing */}
        <div className="products-grid">
          {currentProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Pagination */}
        <div className="pagination-container">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedProducts.length}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}