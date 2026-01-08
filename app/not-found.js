// app/not-found.js
import Link from 'next/link';
import './NotFound.css';

export default function NotFound() {
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
        </div>
        <div className="not-found-search">
          <p>Or search for what you need:</p>
          <form action="/products" method="get" className="search-form">
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
