// pages/404.js
import Link from 'next/link';
import Layout from '../components/Layout';
import './NotFound.css';

export default function Custom404() {
  return (
    <Layout>
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-icon">🔍</div>
        <h1 className="not-found-title">404 - Page Not Found</h1>
        <p className="not-found-description">
          Oops! The page you're looking for doesn't exist. It might have been moved, 
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
            onClick={() => window.history.back()} 
            className="not-found-button tertiary"
          >
            ↩️ Go Back
          </button>
        </div>
        <div className="not-found-search">
          <p>Or try searching for what you need:</p>
          <form action="/products" method="GET" className="search-form">
            <input
              type="text"
              name="search"
              placeholder="Search laptops, gaming, business..."
              className="search-input"
            />
            <button type="submit" className="search-button">
              🔍 Search
            </button>
          </form>
        </div>
      </div>
    </div>    
    </Layout>
  );
}