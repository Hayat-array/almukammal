import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import products from '@/data/products';
import './GamingLaptops.css';

export default function GamingLaptops() {
  const [isLoading, setIsLoading] = useState(true);
  const [gamingLaptops, setGamingLaptops] = useState([]);

  useEffect(() => {
    // Simulate loading for better UX
    const timer = setTimeout(() => {
      const filteredLaptops = products.filter(product => {
        const name = product.name.toLowerCase();
        const description = product.description?.toLowerCase() || '';
        
        const gamingKeywords = [
          'gaming', 'rog', 'legion', 'predator', 'alienware', 'msi', 
          'razer', 'asus', 'tuf', 'nitro', 'omen', 'aorus', 'strix'
        ];
        
        return gamingKeywords.some(keyword => 
          name.includes(keyword) || description.includes(keyword)
        );
      });

      // Sort by date
      const sorted = [...filteredLaptops].sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(a.year || 2000, 0, 1);
        const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(b.year || 2000, 0, 1);
        return dateB - dateA;
      });

      setGamingLaptops(sorted);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="gaming-laptops-container">
        <h1 className="gaming-laptops-title">Gaming Laptops</h1>
        <div className="loading-grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="product-card loading">
              {/* Skeleton loading cards */}
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line medium"></div>
                <div className="skeleton-line long"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gamingLaptops.length === 0) {
    return (
      <div className="gaming-laptops-container">
        <h1 className="gaming-laptops-title">Gaming Laptops</h1>
        <div className="empty-state">
          <h3>No Gaming Laptops Found</h3>
          <p>Check back later for new gaming laptop models.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gaming-laptops-container">
      <h1 className="gaming-laptops-title">Gaming Laptops</h1>
      
      <div className="sorting-info">
        <span className="sorting-badge">
          {gamingLaptops.length} {gamingLaptops.length === 1 ? 'model' : 'models'} • Newest first
        </span>
      </div>
      
      <div className="products-grid">
        {gamingLaptops.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
