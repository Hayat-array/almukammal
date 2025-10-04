// app/not-found.js
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './NotFound.css';

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const searchQuery = formData.get('search');
    if (searchQuery && searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-icon">🔍</div>
        <h1 className="not-found-title">404 - Page Not Found</h1>
        <p className="not-found-description">
          Oops! The page you&apos;re looking for doesn&apos;t exist. It might have been moved, 
          deleted, or you entered the wrong URL.
        </p>
        <div className="not-found-actions">
          <Link href="/" className="not-found-button primary">
            🏠 Go Home
          </Link>
          <Link href="/products" className="not-found-button secondary">
            📦 Browse Products
          </Link>
          <button 
            onClick={handleGoBack}
            className="not-found-button tertiary"
            type="button"
          >
            ↩️ Go Back
          </button>
        </div>
        <div className="not-found-search">
          <p>Or try searching for what you need:</p>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              name="search"
              placeholder="Search laptops, gaming, business..."
              className="search-input"
              required
            />
            <button type="submit" className="search-button">
              🔍 Search
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}