import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import products from '@/data/products';
import './Home.css';

export default function Home() {
  const featuredProducts = products.slice(0, 8);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section fade-in">
        <div className="hero-container">
          <h1 className="hero-title">
            Premium Laptops
            <span className="hero-subtitle">For Every Need</span>
          </h1>
          <p className="hero-description">
            Discover the perfect laptop for gaming, business, or creativity. 
            Latest technology, best prices, and exceptional performance.
          </p>
          <Link href="/products" className="hero-button">
            Explore All Laptops →
          </Link>
        </div>
      </section>

      {/* Stats Section (Optional) */}
      <section className="stats-section slide-in-left">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">Laptop Models</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">1000+</span>
            <span className="stat-label">Happy Customers</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Customer Support</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">1 Year</span>
            <span className="stat-label">Warranty</span>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="featured-container">
          <div className="featured-header slide-in-right">
            <h2 className="featured-title">Featured Laptops</h2>
            <p className="featured-subtitle">
              Handpicked selection of our most popular and high-performance laptops
            </p>
          </div>

          <div className="featured-grid">
            {featuredProducts.map((product, index) => (
              <div 
                key={product.id} 
                className="fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <div className="featured-footer">
            <Link href="/products" className="view-all-button">
              View All {products.length} Laptops
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}