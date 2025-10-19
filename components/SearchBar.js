
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added for efficiency
  const router = useRouter();

  // Memoize handlers to prevent re-renders
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearch(value);
    
    if (!value.trim()) {
      setShowResults(false);
      setResults([]);
    }
  }, []);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    const query = search.trim();
    if (!query) return;

    setIsLoading(true);
    setShowResults(true);

    try {
      const response = await fetch(`/api/search?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results || []);
      } else {
        setResults([]);
      }

      // Redirect after brief show
      setTimeout(() => {
        router.push(`/products?search=${encodeURIComponent(query)}`);
        setShowResults(false);
        setSearch('');
      }, 500); // Brief delay for UX

    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      // Redirect anyway
      router.push(`/products?search=${encodeURIComponent(query)}`);
      setShowResults(false);
      setSearch('');
    } finally {
      setIsLoading(false);
    }
  }, [search, router]);

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
            disabled={isLoading}
          />
          <button type="submit" className="search-button" disabled={isLoading || !search.trim()}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((product, index) => (
            <div key={product.id || index} className="result-item">
              {product.name} - AED {product.price?.toLocaleString()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}