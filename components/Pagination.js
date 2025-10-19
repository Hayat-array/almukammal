'use client';

import { useMemo } from 'react';
import './Pagination.css';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  // ✅ FIXED: useMemo with let variables!
  const pageNumbers = useMemo(() => {
    const maxVisible = 5;
    const pages = [];

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    // ✅ FIXED: let instead of const!
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 2) end = 4;
    if (currentPage >= totalPages - 1) start = totalPages - 3;

    if (start > 2) pages.push('...');

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);

    return pages;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <div className="page-info">
        Page <span className="current-page">{currentPage}</span> of <span className="total-pages">{totalPages}</span>
      </div>

      <div className="pagination-controls">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn prev-btn"
        >
          ‹ Prev
        </button>

        <div className="page-numbers">
          {pageNumbers.map((page, index) => (
            <button
              key={index}
              onClick={() => page !== '...' && onPageChange(page)}
              className={`page-btn ${page === currentPage ? 'active' : ''} ${page === '...' ? 'ellipsis' : ''}`}
              disabled={page === '...'}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn next-btn"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}