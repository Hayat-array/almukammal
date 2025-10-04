'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    try {
      const response = await fetch(`/api/search?search=${encodeURIComponent(search)}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setShowResults(true);
        
        // Always redirect to products page with search query
        router.push(`/products?search=${encodeURIComponent(search)}`);
        setShowResults(false);
        setSearch('');
      }
    } catch (error) {
      console.error('Search error:', error);
      // Still redirect to products page even if API fails
      router.push(`/products?search=${encodeURIComponent(search)}`);
      setShowResults(false);
      setSearch('');
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    
    if (!value.trim()) {
      setShowResults(false);
      setResults([]);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search laptops (HP, Dell, i7, Gaming...)"
            value={search}
            onChange={handleInputChange}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </div>
      </form>

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((product) => (
            <div key={product.id} className="result-item">
              {product.name} - ₹{product.price?.toLocaleString()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}