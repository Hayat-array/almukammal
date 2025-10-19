'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/app/ClientLayout';

export default function AdminCartsPage() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiStatus, setApiStatus] = useState('');
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/admin/login');
        return;
      }

      if (user.role !== 'admin') {
        router.push('/unauthorized');
        return;
      }

      if (user.role === 'admin') {
        fetchAllCarts();
      }
    }
  }, [user, authLoading, router]);

  const fetchAllCarts = async () => {
    try {
      setLoading(true);
      setError('');
      setApiStatus('Fetching carts data...');

      // Use token from context or localStorage with fallback
      let currentToken = token;
      
      if (!currentToken) {
        currentToken = localStorage.getItem('token');
        console.log('🔑 Using token from localStorage');
      }

      if (!currentToken) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      console.log('🔄 Fetching carts from API...');
      
      const response = await fetch('/api/admin/carts', {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      console.log('📨 API Response status:', response.status);
      setApiStatus(`Response status: ${response.status}`);

      const responseText = await response.text();
      console.log('📄 Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please login again.');
          setTimeout(() => router.push('/auth/admin/login'), 2000);
          return;
        }
        
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
          return;
        }
        
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      console.log('📊 Received data:', data);
      
      if (data.success) {
        setCarts(data.carts || []);
        setApiStatus(`Successfully loaded ${data.carts?.length || 0} carts`);
        console.log(`✅ Loaded ${data.carts?.length || 0} carts`);
      } else {
        throw new Error(data.error || 'Failed to load carts');
      }
      
    } catch (err) {
      console.error('❌ API Error:', err);
      const errorMessage = err.message || 'Failed to load carts. Please try again later.';
      setError(errorMessage);
      setApiStatus(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
  };

  const deleteCart = async (userId) => {
    if (!confirm('Are you sure you want to delete this cart?')) return;

    // Optimistically update UI
    const originalCarts = [...carts];
    setCarts(carts.filter(cart => cart.userId !== userId));
    
    try {
      const currentToken = token || localStorage.getItem('token');
      const response = await fetch(`/api/admin/carts?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete cart');
      }

      // Show success message and refresh
      setApiStatus('Cart deleted successfully');
      setTimeout(() => fetchAllCarts(), 1000);
      
    } catch (err) {
      console.error('Delete error:', err);
      // Revert UI change on error
      setCarts(originalCarts);
      setError(err.message || 'Failed to delete cart. Please try again.');
    }
  };

  const exportToCSV = () => {
    const headers = ['User ID', 'User Name', 'Email', 'Items Count', 'Total Value', 'Last Updated'];
    const rows = filteredCarts.map(cart => [
      cart.userId || 'N/A',
      cart.userName || 'Unknown',
      cart.userEmail || 'N/A',
      cart.items?.length || 0,
      `AED ${calculateTotal(cart.items).toLocaleString()}`,
      cart.updatedAt ? new Date(cart.updatedAt).toLocaleString() : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `carts_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ FIXED! SAFE FILTERING - NO MORE ERRORS!
  const filteredCarts = (carts || []).filter(cart => {
    const userName = cart.userName || '';
    const userEmail = cart.userEmail || '';
    
    const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'empty') return (!cart.items || cart.items.length === 0) && matchesSearch;
    if (filterStatus === 'active') return cart.items && cart.items.length > 0 && matchesSearch;
    return matchesSearch;
  });

  // ✅ FIXED! SAFE CALCULATIONS - NO MORE ERRORS!
  const totalItems = (carts || []).reduce((sum, cart) => sum + (cart.items?.length || 0), 0);
  const totalValue = (carts || []).reduce((sum, cart) => sum + calculateTotal(cart.items), 0);
  const activeCarts = (carts || []).filter(cart => cart.items && cart.items.length > 0).length;

  if (authLoading) {
    return (
      <ClientLayout>
        <div style={{ 
          minHeight: '80vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              position: 'relative', 
              margin: '0 auto 1rem', 
              width: '64px', 
              height: '64px' 
            }}>
              <div style={{
                animation: 'spin 1s linear infinite',
                borderRadius: '9999px',
                height: '64px',
                width: '64px',
                borderTop: '4px solid #4f46e5',
                borderBottom: '4px solid #4f46e5'
              }}></div>
            </div>
            <p style={{ color: '#4b5563', fontSize: '1.125rem', fontWeight: '500' }}>Loading carts data...</p>
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <ClientLayout>
      <div className="page-container">
        <div className="container">
          {/* Header */}
          <div className="header">
            <h1 className="title">Cart Management</h1>
            <p className="subtitle">Monitor and manage all user shopping carts</p>
            
            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && apiStatus && (
              <div className="debug-info">
                <strong>Debug:</strong> {apiStatus}
                {carts.length > 0 && ` | ${carts.length} carts loaded`}
              </div>
            )}

            {error && (
              <div className="alert">
                <div className="alert-content">
                  <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="alert-text">⚠️ {error}</p>
                </div>
                <button 
                  onClick={() => setError('')}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#92400e', 
                    cursor: 'pointer',
                    marginLeft: 'auto'
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-bar" style={{'--color-start': '#6366f1', '--color-end': '#4f46e5'}}></div>
              <div className="stat-content">
                <div>
                  <p className="stat-label">Total Carts</p>
                  <p className="stat-value">{carts.length}</p>
                </div>
                <div className="stat-icon" style={{'--bg-color': '#e0e7ff'}}>🛒</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-bar" style={{'--color-start': '#10b981', '--color-end': '#059669'}}></div>
              <div className="stat-content">
                <div>
                  <p className="stat-label">Active Carts</p>
                  <p className="stat-value" style={{color: '#059669'}}>{activeCarts}</p>
                </div>
                <div className="stat-icon" style={{'--bg-color': '#d1fae5'}}>✅</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-bar" style={{'--color-start': '#a855f7', '--color-end': '#9333ea'}}></div>
              <div className="stat-content">
                <div>
                  <p className="stat-label">Total Items</p>
                  <p className="stat-value" style={{color: '#9333ea'}}>{totalItems}</p>
                </div>
                <div className="stat-icon" style={{'--bg-color': '#f3e8ff'}}>📦</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-bar" style={{'--color-start': '#3b82f6', '--color-end': '#2563eb'}}></div>
              <div className="stat-content">
                <div>
                  <p className="stat-label">Total Value</p>
                  <p className="stat-value" style={{color: '#2563eb'}}>AED {totalValue.toLocaleString()}</p>
                </div>
                <div className="stat-icon" style={{'--bg-color': '#dbeafe'}}>💰</div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="filters-card">
            <div className="filters-content">
              <div className="filter-buttons">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`filter-btn ${filterStatus === 'all' ? 'filter-btn-all' : 'filter-btn-inactive'}`}
                >
                  All Carts
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`filter-btn ${filterStatus === 'active' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterStatus('empty')}
                  className={`filter-btn ${filterStatus === 'empty' ? 'filter-btn-empty' : 'filter-btn-inactive'}`}
                >
                  Empty
                </button>
              </div>

              <div className="search-export">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <button onClick={exportToCSV} className="export-btn" disabled={filteredCarts.length === 0}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Export CSV
                </button>
                <button 
                  onClick={fetchAllCarts}
                  className="export-btn"
                  style={{background: 'linear-gradient(to right, #10b981, #059669)'}}
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {/* Carts List */}
          <div className="carts-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  border: '3px solid #f3f4f6',
                  borderTop: '3px solid #4f46e5',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }}></div>
                <p>Loading carts data...</p>
              </div>
            ) : filteredCarts.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <h3 className="empty-title">
                  {carts.length === 0 ? 'No carts found' : 'No carts match your filters'}
                </h3>
                <p className="empty-text">
                  {carts.length === 0 
                    ? 'There are no shopping carts in the system yet.' 
                    : 'Try adjusting your filters or search query'}
                </p>
                <button 
                  onClick={fetchAllCarts}
                  className="export-btn"
                  style={{marginTop: '1rem'}}
                >
                  Refresh Data
                </button>
              </div>
            ) : (
              filteredCarts.map((cart) => (
                <div key={cart.userId} className="cart-card">
                  <div className="cart-gradient-bar"></div>
                  <div className="cart-content">
                    <div className="cart-header">
                      <div className="cart-user-info">
                        <div className="cart-user-name">
                          <h3 className="cart-name">{cart.userName || 'Unknown User'}</h3>
                          <span className={`status-badge ${cart.items && cart.items.length > 0 ? 'status-active' : 'status-empty'}`}>
                            {cart.items && cart.items.length > 0 ? 'Active' : 'Empty'}
                          </span>
                        </div>
                        <div className="cart-email">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <p>{cart.userEmail || 'No email'}</p>
                        </div>
                        <div className="cart-id">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <p>User ID: {cart.userId || 'N/A'}</p>
                        </div>
                        <div className="cart-updated">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <p>Last updated: {cart.updatedAt ? new Date(cart.updatedAt).toLocaleString() : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="cart-total">
                        <p className="cart-total-value">AED {calculateTotal(cart.items).toLocaleString()}</p>
                        <p className="cart-items-count">{cart.items?.length || 0} items</p>
                      </div>
                    </div>

                    {cart.items && cart.items.length > 0 && (
                      <div className="cart-items-section">
                        <h4 className="cart-items-title">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                          </svg>
                          Cart Items ({cart.items.length})
                        </h4>
                        <div className="cart-items-list">
                          {cart.items.map((item, index) => (
                            <div key={index} className="cart-item">
                              <div className="cart-item-info">
                                {item.image && (
                                  <img 
                                    src={item.image} 
                                    alt={item.name}
                                    className="cart-item-image"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div>
                                  <p className="cart-item-name">{item.name || 'Unknown Product'}</p>
                                  <p className="cart-item-qty">Qty: {item.quantity || 0}</p>
                                </div>
                              </div>
                              <p className="cart-item-price">
                                AED {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="cart-actions">
                      <button
                        onClick={() => router.push(`/admin/users/${cart.userId}`)}
                        className="action-btn view-btn"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        View User
                      </button>
                      <button
                        onClick={() => deleteCart(cart.userId)}
                        className="action-btn delete-btn"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Delete Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-container {
          min-height: 100vh;
          background: linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff);
          padding: 2rem 1rem;
          animation: fadeIn 0.6s ease-out;
        }
        .container {
          max-width: 1280px;
          margin: 0 auto;
        }
        .header {
          margin-bottom: 2rem;
          text-align: center;
        }
        .title {
          font-size: 2.25rem;
          font-weight: 700;
          background: linear-gradient(to right, #4f46e5, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }
        .subtitle {
          color: #4b5563;
          font-size: 1.125rem;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: all 0.3s;
        }
        .stat-card:hover {
          transform: scale(1.05);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .stat-bar {
          height: 1rem;
          background: linear-gradient(to right, var(--color-start), var(--color-end));
        }
        .stat-content {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .stat-icon {
          background: var(--bg-color);
          border-radius: 9999px;
          padding: 0.75rem;
          font-size: 1.5rem;
        }
        .stat-label {
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .stat-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: #111827;
        }
        .filters-card {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .filters-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .filters-content {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
        .filter-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .filter-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.3s;
          cursor: pointer;
          border: none;
        }
        .filter-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .filter-btn-inactive {
          background: #f3f4f6;
          color: #374151;
        }
        .filter-btn-inactive:hover:not(:disabled) {
          background: #e5e7eb;
        }
        .filter-btn-all {
          background: linear-gradient(to right, #6366f1, #a855f7);
          color: white;
          box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
        }
        .filter-btn-active {
          background: linear-gradient(to right, #10b981, #059669);
          color: white;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
        }
        .filter-btn-empty {
          background: linear-gradient(to right, #6b7280, #4b5563);
          color: white;
          box-shadow: 0 4px 6px -1px rgba(107, 114, 128, 0.3);
        }
        .search-export {
          display: flex;
          gap: 0.5rem;
          width: 100%;
        }
        @media (min-width: 768px) {
          .search-export {
            width: auto;
          }
        }
        .search-container {
          position: relative;
          flex: 1;
        }
        .search-input {
          padding: 0.5rem 1rem 0.5rem 2.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          width: 100%;
          outline: none;
          transition: all 0.3s;
        }
        .search-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          width: 1.25rem;
          height: 1.25rem;
        }
        .export-btn {
          background: linear-gradient(to right, #6366f1, #a855f7);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s;
          white-space: nowrap;
        }
        .export-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .export-btn:hover:not(:disabled) {
          background: linear-gradient(to right, #4f46e5, #9333ea);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .carts-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .cart-card {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: all 0.3s;
        }
        .cart-card:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          transform: translateY(-4px);
        }
        .cart-gradient-bar {
          height: 0.5rem;
          background: linear-gradient(to right, #6366f1, #a855f7, #3b82f6);
        }
        .cart-content {
          padding: 1.5rem;
        }
        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .cart-user-info {
          flex: 1;
        }
        .cart-user-name {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .cart-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
        }
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .status-active {
          background: #d1fae5;
          color: #065f46;
        }
        .status-empty {
          background: #f3f4f6;
          color: #374151;
        }
        .cart-email, .cart-id, .cart-updated {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }
        .cart-total {
          text-align: right;
        }
        .cart-total-value {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(to right, #4f46e5, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .cart-items-count {
          color: #6b7280;
          font-size: 0.875rem;
        }
        .cart-items-section {
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
          margin-top: 1rem;
        }
        .cart-items-title {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(to right, #eef2ff, #faf5ff);
          border-radius: 0.5rem;
          padding: 0.75rem;
          border: 1px solid #e0e7ff;
        }
        .cart-item-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }
        .cart-item-image {
          width: 3rem;
          height: 3rem;
          object-fit: cover;
          border-radius: 0.375rem;
        }
        .cart-item-name {
          font-weight: 500;
          color: #111827;
        }
        .cart-item-qty {
          font-size: 0.875rem;
          color: #6b7280;
        }
        .cart-item-price {
          font-weight: 600;
          color: #4f46e5;
        }
        .cart-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }
        .action-btn {
          flex: 1;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s;
        }
        .view-btn {
          background: linear-gradient(to right, #6366f1, #4f46e5);
          color: white;
        }
        .view-btn:hover {
          background: linear-gradient(to right, #4f46e5, #4338ca);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .delete-btn {
          background: linear-gradient(to right, #ef4444, #dc2626);
          color: white;
          padding: 0.5rem 1rem;
        }
        .delete-btn:hover {
          background: linear-gradient(to right, #dc2626, #b91c1c);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
        .empty-state {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 3rem;
          text-align: center;
        }
        .empty-icon {
          font-size: 3.75rem;
          margin-bottom: 1rem;
          display: block;
        }
        .empty-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        .empty-text {
          color: #6b7280;
        }
        .alert {
          margin-top: 1rem;
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
          border-radius: 0.5rem;
          padding: 1rem;
          max-width: 48rem;
          margin-left: auto;
          margin-right: auto;
          display: flex;
          align-items: center;
        }
        .alert-content {
          display: flex;
          align-items: center;
          flex: 1;
        }
        .alert-icon {
          flex-shrink: 0;
          width: 1.25rem;
          height: 1.25rem;
          color: #f59e0b;
        }
        .alert-text {
          margin-left: 0.75rem;
          color: #92400e;
          font-size: 0.875rem;
        }
        .debug-info {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          color: #0369a1;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          font-family: monospace;
        }
        svg {
          width: 1.25rem;
          height: 1.25rem;
        }
      `}</style>
    </ClientLayout>
  );
}

// // // // // // // // 'use client';

// // // // // // // // import { useState, useEffect } from 'react';
// // // // // // // // import { useRouter } from 'next/navigation';
// // // // // // // // import './carts.css'

// // // // // // // // export default function AdminCartsPage() {
// // // // // // // //   const [carts, setCarts] = useState([]);
// // // // // // // //   const [loading, setLoading] = useState(true);
// // // // // // // //   const [error, setError] = useState(null);
// // // // // // // //   const [filterStatus, setFilterStatus] = useState('all');
// // // // // // // //   const [searchQuery, setSearchQuery] = useState('');
// // // // // // // //   const router = useRouter();

// // // // // // // //   useEffect(() => {
// // // // // // // //     fetchAllCarts();
// // // // // // // //   }, []);

// // // // // // // //   const fetchAllCarts = async () => {
// // // // // // // //     try {
// // // // // // // //       setLoading(true);
// // // // // // // //       setError(null);
      
// // // // // // // //       // Try to fetch from API, but handle errors gracefully
// // // // // // // //       const response = await fetch('/api/admin/carts');
      
// // // // // // // //       if (!response.ok) {
// // // // // // // //         // If API fails, load from localStorage as fallback
// // // // // // // //         loadCartsFromLocalStorage();
// // // // // // // //         return;
// // // // // // // //       }

// // // // // // // //       const data = await response.json();
// // // // // // // //       setCarts(data.carts || []);
// // // // // // // //     } catch (err) {
// // // // // // // //       console.error('API Error:', err);
// // // // // // // //       // Fallback to localStorage if API fails
// // // // // // // //       loadCartsFromLocalStorage();
// // // // // // // //     } finally {
// // // // // // // //       setLoading(false);
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   const loadCartsFromLocalStorage = () => {
// // // // // // // //     // This is a temporary solution - loads all user carts from localStorage
// // // // // // // //     const allCarts = [];
    
// // // // // // // //     // Get all localStorage keys
// // // // // // // //     for (let i = 0; i < localStorage.length; i++) {
// // // // // // // //       const key = localStorage.key(i);
      
// // // // // // // //       // Look for cart-related keys (you might need to adjust this based on your storage pattern)
// // // // // // // //       if (key && key.includes('cart')) {
// // // // // // // //         try {
// // // // // // // //           const cartData = JSON.parse(localStorage.getItem(key));
// // // // // // // //           if (Array.isArray(cartData) && cartData.length > 0) {
// // // // // // // //             allCarts.push({
// // // // // // // //               userId: key.replace('cart_', ''),
// // // // // // // //               userName: 'Local User',
// // // // // // // //               userEmail: 'user@example.com',
// // // // // // // //               items: cartData,
// // // // // // // //               updatedAt: new Date().toISOString(),
// // // // // // // //               createdAt: new Date().toISOString(),
// // // // // // // //             });
// // // // // // // //           }
// // // // // // // //         } catch (e) {
// // // // // // // //           console.error('Error parsing cart:', e);
// // // // // // // //         }
// // // // // // // //       }
// // // // // // // //     }

// // // // // // // //     // If no carts found, show demo data
// // // // // // // //     if (allCarts.length === 0) {
// // // // // // // //       allCarts.push({
// // // // // // // //         userId: 'demo-user-1',
// // // // // // // //         userName: 'Demo User 1',
// // // // // // // //         userEmail: 'demo1@example.com',
// // // // // // // //         items: [
// // // // // // // //           {
// // // // // // // //             id: '1',
// // // // // // // //             name: 'Demo Product 1',
// // // // // // // //             description: 'Sample product',
// // // // // // // //             price: 1200,
// // // // // // // //             quantity: 2,
// // // // // // // //             image: 'https://via.placeholder.com/100'
// // // // // // // //           }
// // // // // // // //         ],
// // // // // // // //         updatedAt: new Date().toISOString(),
// // // // // // // //         createdAt: new Date().toISOString(),
// // // // // // // //       });
// // // // // // // //     }

// // // // // // // //     setCarts(allCarts);
// // // // // // // //     setError('Using demo data. Connect to database to see real carts.');
// // // // // // // //   };

// // // // // // // //   const calculateTotal = (items) => {
// // // // // // // //     return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
// // // // // // // //   };

// // // // // // // //   const deleteCart = async (userId) => {
// // // // // // // //     if (!confirm('Are you sure you want to delete this cart?')) return;

// // // // // // // //     // Remove from state
// // // // // // // //     setCarts(carts.filter(cart => cart.userId !== userId));
    
// // // // // // // //     // Try to delete via API
// // // // // // // //     try {
// // // // // // // //       await fetch(`/api/admin/carts/${userId}`, {
// // // // // // // //         method: 'DELETE',
// // // // // // // //       });
// // // // // // // //     } catch (err) {
// // // // // // // //       console.error('Delete error:', err);
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   const exportToCSV = () => {
// // // // // // // //     const headers = ['User ID', 'User Name', 'Email', 'Items Count', 'Total Value', 'Last Updated'];
// // // // // // // //     const rows = filteredCarts.map(cart => [
// // // // // // // //       cart.userId,
// // // // // // // //       cart.userName,
// // // // // // // //       cart.userEmail,
// // // // // // // //       cart.items.length,
// // // // // // // //       calculateTotal(cart.items),
// // // // // // // //       new Date(cart.updatedAt).toLocaleString()
// // // // // // // //     ]);

// // // // // // // //     const csvContent = [
// // // // // // // //       headers.join(','),
// // // // // // // //       ...rows.map(row => row.join(','))
// // // // // // // //     ].join('\n');

// // // // // // // //     const blob = new Blob([csvContent], { type: 'text/csv' });
// // // // // // // //     const url = window.URL.createObjectURL(blob);
// // // // // // // //     const a = document.createElement('a');
// // // // // // // //     a.href = url;
// // // // // // // //     a.download = `carts_export_${new Date().toISOString().split('T')[0]}.csv`;
// // // // // // // //     a.click();
// // // // // // // //   };

// // // // // // // //   const filteredCarts = carts.filter(cart => {
// // // // // // // //     const matchesSearch = cart.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
// // // // // // // //                          cart.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
// // // // // // // //     if (filterStatus === 'empty') return cart.items.length === 0 && matchesSearch;
// // // // // // // //     if (filterStatus === 'active') return cart.items.length > 0 && matchesSearch;
// // // // // // // //     return matchesSearch;
// // // // // // // //   });

// // // // // // // //   const totalItems = carts.reduce((sum, cart) => sum + cart.items.length, 0);
// // // // // // // //   const totalValue = carts.reduce((sum, cart) => sum + calculateTotal(cart.items), 0);
// // // // // // // //   const activeCarts = carts.filter(cart => cart.items.length > 0).length;

// // // // // // // //   if (loading) {
// // // // // // // //     return (
// // // // // // // //       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
// // // // // // // //         <div className="text-center">
// // // // // // // //           <div className="relative">
// // // // // // // //             <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
// // // // // // // //             <div className="absolute inset-0 rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 opacity-30 animate-spin animation-delay-150 mx-auto mb-4"></div>
// // // // // // // //           </div>
// // // // // // // //           <p className="text-gray-600 text-lg font-medium">Loading carts data...</p>
// // // // // // // //         </div>
// // // // // // // //       </div>
// // // // // // // //     );
// // // // // // // //   }

// // // // // // // //   return (
// // // // // // // //     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
// // // // // // // //       <div className="max-w-7xl mx-auto">
// // // // // // // //         {/* Header */}
// // // // // // // //         <div className="mb-8 text-center">
// // // // // // // //           <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">Cart Management</h1>
// // // // // // // //           <p className="text-gray-600 text-lg">Monitor and manage all user shopping carts</p>
// // // // // // // //           {error && (
// // // // // // // //             <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4 max-w-2xl mx-auto">
// // // // // // // //               <div className="flex">
// // // // // // // //                 <div className="flex-shrink-0">
// // // // // // // //                   <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
// // // // // // // //                     <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
// // // // // // // //                   </svg>
// // // // // // // //                 </div>
// // // // // // // //                 <div className="ml-3">
// // // // // // // //                   <p className="text-amber-700 text-sm">⚠️ {error}</p>
// // // // // // // //                 </div>
// // // // // // // //               </div>
// // // // // // // //             </div>
// // // // // // // //           )}
// // // // // // // //         </div>

// // // // // // // //         {/* Statistics Cards */}
// // // // // // // //         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
// // // // // // // //           <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
// // // // // // // //             <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4"></div>
// // // // // // // //             <div className="p-6">
// // // // // // // //               <div className="flex items-center justify-between">
// // // // // // // //                 <div>
// // // // // // // //                   <p className="text-gray-500 text-sm font-medium">Total Carts</p>
// // // // // // // //                   <p className="text-3xl font-bold text-gray-900">{carts.length}</p>
// // // // // // // //                 </div>
// // // // // // // //                 <div className="bg-indigo-100 rounded-full p-3 shadow-md">
// // // // // // // //                   <span className="text-2xl">🛒</span>
// // // // // // // //                 </div>
// // // // // // // //               </div>
// // // // // // // //             </div>
// // // // // // // //           </div>

// // // // // // // //           <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
// // // // // // // //             <div className="bg-gradient-to-r from-green-500 to-green-600 p-4"></div>
// // // // // // // //             <div className="p-6">
// // // // // // // //               <div className="flex items-center justify-between">
// // // // // // // //                 <div>
// // // // // // // //                   <p className="text-gray-500 text-sm font-medium">Active Carts</p>
// // // // // // // //                   <p className="text-3xl font-bold text-green-600">{activeCarts}</p>
// // // // // // // //                 </div>
// // // // // // // //                 <div className="bg-green-100 rounded-full p-3 shadow-md">
// // // // // // // //                   <span className="text-2xl">✅</span>
// // // // // // // //                 </div>
// // // // // // // //               </div>
// // // // // // // //             </div>
// // // // // // // //           </div>

// // // // // // // //           <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
// // // // // // // //             <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4"></div>
// // // // // // // //             <div className="p-6">
// // // // // // // //               <div className="flex items-center justify-between">
// // // // // // // //                 <div>
// // // // // // // //                   <p className="text-gray-500 text-sm font-medium">Total Items</p>
// // // // // // // //                   <p className="text-3xl font-bold text-purple-600">{totalItems}</p>
// // // // // // // //                 </div>
// // // // // // // //                 <div className="bg-purple-100 rounded-full p-3 shadow-md">
// // // // // // // //                   <span className="text-2xl">📦</span>
// // // // // // // //                 </div>
// // // // // // // //               </div>
// // // // // // // //             </div>
// // // // // // // //           </div>

// // // // // // // //           <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
// // // // // // // //             <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4"></div>
// // // // // // // //             <div className="p-6">
// // // // // // // //               <div className="flex items-center justify-between">
// // // // // // // //                 <div>
// // // // // // // //                   <p className="text-gray-500 text-sm font-medium">Total Value</p>
// // // // // // // //                   <p className="text-3xl font-bold text-blue-600">AED {totalValue.toLocaleString()}</p>
// // // // // // // //                 </div>
// // // // // // // //                 <div className="bg-blue-100 rounded-full p-3 shadow-md">
// // // // // // // //                   <span className="text-2xl">💰</span>
// // // // // // // //                 </div>
// // // // // // // //               </div>
// // // // // // // //             </div>
// // // // // // // //           </div>
// // // // // // // //         </div>

// // // // // // // //         {/* Filters and Search */}
// // // // // // // //         <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
// // // // // // // //           <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
// // // // // // // //             <div className="flex gap-2 flex-wrap">
// // // // // // // //               <button
// // // // // // // //                 onClick={() => setFilterStatus('all')}
// // // // // // // //                 className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
// // // // // // // //                   filterStatus === 'all' 
// // // // // // // //                     ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md transform scale-105' 
// // // // // // // //                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
// // // // // // // //                 }`}
// // // // // // // //               >
// // // // // // // //                 All Carts
// // // // // // // //               </button>
// // // // // // // //               <button
// // // // // // // //                 onClick={() => setFilterStatus('active')}
// // // // // // // //                 className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
// // // // // // // //                   filterStatus === 'active' 
// // // // // // // //                     ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md transform scale-105' 
// // // // // // // //                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
// // // // // // // //                 }`}
// // // // // // // //               >
// // // // // // // //                 Active
// // // // // // // //               </button>
// // // // // // // //               <button
// // // // // // // //                 onClick={() => setFilterStatus('empty')}
// // // // // // // //                 className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
// // // // // // // //                   filterStatus === 'empty' 
// // // // // // // //                     ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md transform scale-105' 
// // // // // // // //                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
// // // // // // // //                 }`}
// // // // // // // //               >
// // // // // // // //                 Empty
// // // // // // // //               </button>
// // // // // // // //             </div>

// // // // // // // //             <div className="flex gap-2 w-full md:w-auto">
// // // // // // // //               <div className="relative">
// // // // // // // //                 <input
// // // // // // // //                   type="text"
// // // // // // // //                   placeholder="Search by name or email..."
// // // // // // // //                   value={searchQuery}
// // // // // // // //                   onChange={(e) => setSearchQuery(e.target.value)}
// // // // // // // //                   className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full md:w-64"
// // // // // // // //                 />
// // // // // // // //                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
// // // // // // // //                   <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // // // //                     <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
// // // // // // // //                   </svg>
// // // // // // // //                 </div>
// // // // // // // //               </div>
// // // // // // // //               <button
// // // // // // // //                 onClick={exportToCSV}
// // // // // // // //                 className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
// // // // // // // //               >
// // // // // // // //                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
// // // // // // // //                   <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
// // // // // // // //                 </svg>
// // // // // // // //                 Export CSV
// // // // // // // //               </button>
// // // // // // // //             </div>
// // // // // // // //           </div>
// // // // // // // //         </div>

// // // // // // // //         {/* Carts List */}
// // // // // // // //         <div className="space-y-4">
// // // // // // // //           {filteredCarts.length === 0 ? (
// // // // // // // //             <div className="bg-white rounded-xl shadow-lg p-12 text-center">
// // // // // // // //               <span className="text-6xl mb-4 block">📭</span>
// // // // // // // //               <h3 className="text-xl font-semibold text-gray-700 mb-2">No carts found</h3>
// // // // // // // //               <p className="text-gray-500">Try adjusting your filters or search query</p>
// // // // // // // //             </div>
// // // // // // // //           ) : (
// // // // // // // //             filteredCarts.map((cart) => (
// // // // // // // //               <div key={cart.userId} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
// // // // // // // //                 <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"></div>
// // // // // // // //                 <div className="p-6">
// // // // // // // //                   <div className="flex justify-between items-start mb-4">
// // // // // // // //                     <div className="flex-1">
// // // // // // // //                       <div className="flex items-center gap-3 mb-2">
// // // // // // // //                         <h3 className="text-xl font-bold text-gray-900">{cart.userName}</h3>
// // // // // // // //                         <span className={`px-3 py-1 rounded-full text-xs font-medium ${
// // // // // // // //                           cart.items.length > 0 
// // // // // // // //                             ? 'bg-green-100 text-green-800' 
// // // // // // // //                             : 'bg-gray-100 text-gray-800'
// // // // // // // //                         }`}>
// // // // // // // //                           {cart.items.length > 0 ? 'Active' : 'Empty'}
// // // // // // // //                         </span>
// // // // // // // //                       </div>
// // // // // // // //                       <div className="flex items-center gap-2 text-gray-600 mb-1">
// // // // // // // //                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
// // // // // // // //                           <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
// // // // // // // //                           <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
// // // // // // // //                         </svg>
// // // // // // // //                         <p>{cart.userEmail}</p>
// // // // // // // //                       </div>
// // // // // // // //                       <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
// // // // // // // //                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
// // // // // // // //                           <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
// // // // // // // //                         </svg>
// // // // // // // //                         <p>User ID: {cart.userId}</p>
// // // // // // // //                       </div>
// // // // // // // //                       <div className="flex items-center gap-2 text-gray-500 text-sm">
// // // // // // // //                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
// // // // // // // //                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
// // // // // // // //                         </svg>
// // // // // // // //                         <p>Last updated: {new Date(cart.updatedAt).toLocaleString()}</p>
// // // // // // // //                       </div>
// // // // // // // //                     </div>
// // // // // // // //                     <div className="text-right">
// // // // // // // //                       <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
// // // // // // // //                         AED {calculateTotal(cart.items).toLocaleString()}
// // // // // // // //                       </p>
// // // // // // // //                       <p className="text-gray-500 text-sm">{cart.items.length} items</p>
// // // // // // // //                     </div>
// // // // // // // //                   </div>

// // // // // // // //                   {cart.items.length > 0 && (
// // // // // // // //                     <div className="border-t border-gray-200 pt-4 mt-4">
// // // // // // // //                       <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
// // // // // // // //                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
// // // // // // // //                           <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
// // // // // // // //                         </svg>
// // // // // // // //                         Cart Items:
// // // // // // // //                       </h4>
// // // // // // // //                       <div className="space-y-2">
// // // // // // // //                         {cart.items.map((item, index) => (
// // // // // // // //                           <div key={index} className="flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
// // // // // // // //                             <div className="flex items-center gap-3 flex-1">
// // // // // // // //                               {item.image && (
// // // // // // // //                                 <img 
// // // // // // // //                                   src={item.image} 
// // // // // // // //                                   alt={item.name}
// // // // // // // //                                   className="w-12 h-12 object-cover rounded-md shadow-sm"
// // // // // // // //                                 />
// // // // // // // //                               )}
// // // // // // // //                               <div>
// // // // // // // //                                 <p className="font-medium text-gray-900">{item.name}</p>
// // // // // // // //                                 <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
// // // // // // // //                               </div>
// // // // // // // //                             </div>
// // // // // // // //                             <p className="font-semibold text-indigo-600">
// // // // // // // //                               AED {(item.price * item.quantity).toLocaleString()}
// // // // // // // //                             </p>
// // // // // // // //                           </div>
// // // // // // // //                         ))}
// // // // // // // //                       </div>
// // // // // // // //                     </div>
// // // // // // // //                   )}

// // // // // // // //                   <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
// // // // // // // //                     <button
// // // // // // // //                       onClick={() => alert('View user details - Connect to database')}
// // // // // // // //                       className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
// // // // // // // //                     >
// // // // // // // //                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
// // // // // // // //                         <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
// // // // // // // //                         <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
// // // // // // // //                       </svg>
// // // // // // // //                       View User
// // // // // // // //                     </button>
// // // // // // // //                     <button
// // // // // // // //                       onClick={() => deleteCart(cart.userId)}
// // // // // // // //                       className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
// // // // // // // //                     >
// // // // // // // //                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
// // // // // // // //                         <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
// // // // // // // //                       </svg>
// // // // // // // //                       Delete
// // // // // // // //                     </button>
// // // // // // // //                   </div>
// // // // // // // //                 </div>
// // // // // // // //               </div>
// // // // // // // //             ))
// // // // // // // //           )}
// // // // // // // //         </div>
// // // // // // // //       </div>
// // // // // // // //     </div>
// // // // // // // //   );
// // // // // // // // }
// // // // // // // // <style jsx>{`
// // // // // // // //         /* Modern Admin Carts Page Styles */

// // // // // // // // /* Custom animations */
// // // // // // // // @keyframes fadeIn {
// // // // // // // //   from {
// // // // // // // //     opacity: 0;
// // // // // // // //     transform: translateY(20px);
// // // // // // // //   }
// // // // // // // //   to {
// // // // // // // //     opacity: 1;
// // // // // // // //     transform: translateY(0);
// // // // // // // //   }
// // // // // // // // }

// // // // // // // // @keyframes slideIn {
// // // // // // // //   from {
// // // // // // // //     opacity: 0;
// // // // // // // //     transform: translateX(-20px);
// // // // // // // //   }
// // // // // // // //   to {
// // // // // // // //     opacity: 1;
// // // // // // // //     transform: translateX(0);
// // // // // // // //   }
// // // // // // // // }

// // // // // // // // @keyframes pulse {
// // // // // // // //   0%, 100% {
// // // // // // // //     opacity: 1;
// // // // // // // //   }
// // // // // // // //   50% {
// // // // // // // //     opacity: 0.7;
// // // // // // // //   }
// // // // // // // // }

// // // // // // // // @keyframes shimmer {
// // // // // // // //   0% {
// // // // // // // //     background-position: -1000px 0;
// // // // // // // //   }
// // // // // // // //   100% {
// // // // // // // //     background-position: 1000px 0;
// // // // // // // //   }
// // // // // // // // }

// // // // // // // // /* Loading state animation delay */
// // // // // // // // .animation-delay-150 {
// // // // // // // //   animation-delay: 150ms;
// // // // // // // // }

// // // // // // // // /* Base page styling */
// // // // // // // // .min-h-screen {
// // // // // // // //   animation: fadeIn 0.6s ease-out;
// // // // // // // // }

// // // // // // // // /* Header text gradient animation */
// // // // // // // // .bg-clip-text {
// // // // // // // //   background-size: 200% auto;
// // // // // // // //   animation: shimmer 3s linear infinite;
// // // // // // // // }

// // // // // // // // /* Statistics cards hover effects */
// // // // // // // // .bg-white.rounded-xl.shadow-lg {
// // // // // // // //   transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
// // // // // // // // }

// // // // // // // // .bg-white.rounded-xl.shadow-lg:hover {
// // // // // // // //   box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
// // // // // // // // }

// // // // // // // // /* Gradient bars on cards */
// // // // // // // // .bg-gradient-to-r.from-indigo-500.to-indigo-600,
// // // // // // // // .bg-gradient-to-r.from-green-500.to-green-600,
// // // // // // // // .bg-gradient-to-r.from-purple-500.to-purple-600,
// // // // // // // // .bg-gradient-to-r.from-blue-500.to-blue-600 {
// // // // // // // //   position: relative;
// // // // // // // //   overflow: hidden;
// // // // // // // // }

// // // // // // // // .bg-gradient-to-r.from-indigo-500.to-indigo-600::after,
// // // // // // // // .bg-gradient-to-r.from-green-500.to-green-600::after,
// // // // // // // // .bg-gradient-to-r.from-purple-500.to-purple-600::after,
// // // // // // // // .bg-gradient-to-r.from-blue-500.to-blue-600::after {
// // // // // // // //   content: '';
// // // // // // // //   position: absolute;
// // // // // // // //   top: 0;
// // // // // // // //   left: -100%;
// // // // // // // //   width: 100%;
// // // // // // // //   height: 100%;
// // // // // // // //   background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
// // // // // // // //   animation: shimmer 2s infinite;
// // // // // // // // }

// // // // // // // // /* Button hover effects */
// // // // // // // // button {
// // // // // // // //   position: relative;
// // // // // // // //   overflow: hidden;
// // // // // // // //   transition: all 0.3s ease;
// // // // // // // // }

// // // // // // // // button::before {
// // // // // // // //   content: '';
// // // // // // // //   position: absolute;
// // // // // // // //   top: 50%;
// // // // // // // //   left: 50%;
// // // // // // // //   width: 0;
// // // // // // // //   height: 0;
// // // // // // // //   border-radius: 50%;
// // // // // // // //   background: rgba(255, 255, 255, 0.2);
// // // // // // // //   transform: translate(-50%, -50%);
// // // // // // // //   transition: width 0.6s, height 0.6s;
// // // // // // // // }

// // // // // // // // button:hover::before {
// // // // // // // //   width: 300px;
// // // // // // // //   height: 300px;
// // // // // // // // }

// // // // // // // // /* Filter buttons active state */
// // // // // // // // .bg-gradient-to-r.from-indigo-500.to-purple-500,
// // // // // // // // .bg-gradient-to-r.from-green-500.to-green-600,
// // // // // // // // .bg-gradient-to-r.from-gray-500.to-gray-600 {
// // // // // // // //   box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
// // // // // // // // }

// // // // // // // // /* Search input focus effect */
// // // // // // // // input[type="text"]:focus {
// // // // // // // //   box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
// // // // // // // //   transform: translateY(-1px);
// // // // // // // // }

// // // // // // // // /* Cart cards animation */
// // // // // // // // .space-y-4 > div {
// // // // // // // //   animation: slideIn 0.4s ease-out backwards;
// // // // // // // // }

// // // // // // // // .space-y-4 > div:nth-child(1) { animation-delay: 0.1s; }
// // // // // // // // .space-y-4 > div:nth-child(2) { animation-delay: 0.2s; }
// // // // // // // // .space-y-4 > div:nth-child(3) { animation-delay: 0.3s; }
// // // // // // // // .space-y-4 > div:nth-child(4) { animation-delay: 0.4s; }
// // // // // // // // .space-y-4 > div:nth-child(5) { animation-delay: 0.5s; }

// // // // // // // // /* Gradient bar on cart cards */
// // // // // // // // .h-2.bg-gradient-to-r.from-indigo-500.via-purple-500.to-blue-500 {
// // // // // // // //   background-size: 200% 100%;
// // // // // // // //   animation: shimmer 3s linear infinite;
// // // // // // // // }

// // // // // // // // /* Status badge pulse animation */
// // // // // // // // .bg-green-100.text-green-800 {
// // // // // // // //   animation: pulse 2s infinite;
// // // // // // // // }

// // // // // // // // /* Cart item cards hover effect */
// // // // // // // // .bg-gradient-to-r.from-indigo-50.to-purple-50 {
// // // // // // // //   transition: all 0.3s ease;
// // // // // // // //   position: relative;
// // // // // // // // }

// // // // // // // // .bg-gradient-to-r.from-indigo-50.to-purple-50:hover {
// // // // // // // //   transform: translateX(5px);
// // // // // // // //   box-shadow: -3px 0 0 0 rgba(99, 102, 241, 0.4);
// // // // // // // // }

// // // // // // // // /* Image hover effect */
// // // // // // // // img.w-12.h-12 {
// // // // // // // //   transition: transform 0.3s ease;
// // // // // // // // }

// // // // // // // // img.w-12.h-12:hover {
// // // // // // // //   transform: scale(1.1) rotate(2deg);
// // // // // // // // }

// // // // // // // // /* Delete button danger effect */
// // // // // // // // .bg-gradient-to-r.from-red-500.to-red-600:hover {
// // // // // // // //   box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
// // // // // // // // }

// // // // // // // // /* Export CSV button icon animation */
// // // // // // // // .bg-gradient-to-r.from-indigo-500.to-purple-600 svg {
// // // // // // // //   transition: transform 0.3s ease;
// // // // // // // // }

// // // // // // // // .bg-gradient-to-r.from-indigo-500.to-purple-600:hover svg {
// // // // // // // //   transform: translateY(2px);
// // // // // // // // }

// // // // // // // // /* Empty state animation */
// // // // // // // // .text-center span.text-6xl {
// // // // // // // //   display: inline-block;
// // // // // // // //   animation: pulse 2s infinite;
// // // // // // // // }

// // // // // // // // /* Alert box styling */
// // // // // // // // .bg-amber-50 {
// // // // // // // //   animation: slideIn 0.5s ease-out;
// // // // // // // // }

// // // // // // // // /* Loading spinner enhancement */
// // // // // // // // .animate-spin {
// // // // // // // //   animation: spin 1s linear infinite;
// // // // // // // // }

// // // // // // // // @keyframes spin {
// // // // // // // //   from {
// // // // // // // //     transform: rotate(0deg);
// // // // // // // //   }
// // // // // // // //   to {
// // // // // // // //     transform: rotate(360deg);
// // // // // // // //   }
// // // // // // // // }

// // // // // // // // /* Smooth scrolling */
// // // // // // // // html {
// // // // // // // //   scroll-behavior: smooth;
// // // // // // // // }

// // // // // // // // /* Custom scrollbar */
// // // // // // // // ::-webkit-scrollbar {
// // // // // // // //   width: 10px;
// // // // // // // //   height: 10px;
// // // // // // // // }

// // // // // // // // ::-webkit-scrollbar-track {
// // // // // // // //   background: #f1f1f1;
// // // // // // // //   border-radius: 10px;
// // // // // // // // }

// // // // // // // // ::-webkit-scrollbar-thumb {
// // // // // // // //   background: linear-gradient(180deg, #6366f1, #a855f7);
// // // // // // // //   border-radius: 10px;
// // // // // // // // }

// // // // // // // // ::-webkit-scrollbar-thumb:hover {
// // // // // // // //   background: linear-gradient(180deg, #4f46e5, #9333ea);
// // // // // // // // }

// // // // // // // // /* Card shadow enhancement on hover */
// // // // // // // // .hover\:shadow-xl:hover {
// // // // // // // //   box-shadow: 0 25px 50px -12px rgba(79, 70, 229, 0.25);
// // // // // // // // }

// // // // // // // // /* Icon containers pulse */
// // // // // // // // .bg-indigo-100.rounded-full,
// // // // // // // // .bg-green-100.rounded-full,
// // // // // // // // .bg-purple-100.rounded-full,
// // // // // // // // .bg-blue-100.rounded-full {
// // // // // // // //   transition: transform 0.3s ease;
// // // // // // // // }

// // // // // // // // .bg-white.rounded-xl.shadow-lg:hover .bg-indigo-100.rounded-full,
// // // // // // // // .bg-white.rounded-xl.shadow-lg:hover .bg-green-100.rounded-full,
// // // // // // // // .bg-white.rounded-xl.shadow-lg:hover .bg-purple-100.rounded-full,
// // // // // // // // .bg-white.rounded-xl.shadow-lg:hover .bg-blue-100.rounded-full {
// // // // // // // //   transform: scale(1.1) rotate(5deg);
// // // // // // // // }

// // // // // // // // /* Responsive enhancements */
// // // // // // // // @media (max-width: 768px) {
// // // // // // // //   .space-y-4 > div {
// // // // // // // //     animation: fadeIn 0.4s ease-out backwards;
// // // // // // // //   }
// // // // // // // // }

// // // // // // // // /* Focus visible for accessibility */
// // // // // // // // *:focus-visible {
// // // // // // // //   outline: 2px solid #6366f1;
// // // // // // // //   outline-offset: 2px;
// // // // // // // // }

// // // // // // // // /* Print styles */
// // // // // // // // @media print {
// // // // // // // //   .bg-gradient-to-br,
// // // // // // // //   button,
// // // // // // // //   input {
// // // // // // // //     display: none;
// // // // // // // //   }
  
// // // // // // // //   .bg-white {
// // // // // // // //     box-shadow: none;
// // // // // // // //     border: 1px solid #e5e7eb;
// // // // // // // //   }
// // // // // // // // }
// // // // // // // //       `}</style>
// // // // // // // 'use client';

// // // // // // // import { useState, useEffect } from 'react';
// // // // // // // import { useRouter } from 'next/navigation';

// // // // // // // export default function AdminCartsPage() {
// // // // // // //   const [carts, setCarts] = useState([]);
// // // // // // //   const [loading, setLoading] = useState(true);
// // // // // // //   const [error, setError] = useState(null);
// // // // // // //   const [filterStatus, setFilterStatus] = useState('all');
// // // // // // //   const [searchQuery, setSearchQuery] = useState('');
// // // // // // //   const router = useRouter();

// // // // // // //   useEffect(() => {
// // // // // // //     fetchAllCarts();
// // // // // // //   }, []);

// // // // // // //   const fetchAllCarts = async () => {
// // // // // // //     try {
// // // // // // //       setLoading(true);
// // // // // // //       setError(null);
      
// // // // // // //       const response = await fetch('/api/admin/carts');
      
// // // // // // //       if (!response.ok) {
// // // // // // //         loadCartsFromLocalStorage();
// // // // // // //         return;
// // // // // // //       }

// // // // // // //       const data = await response.json();
// // // // // // //       setCarts(data.carts || []);
// // // // // // //     } catch (err) {
// // // // // // //       console.error('API Error:', err);
// // // // // // //       loadCartsFromLocalStorage();
// // // // // // //     } finally {
// // // // // // //       setLoading(false);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const loadCartsFromLocalStorage = () => {
// // // // // // //     const allCarts = [];
    
// // // // // // //     for (let i = 0; i < localStorage.length; i++) {
// // // // // // //       const key = localStorage.key(i);
      
// // // // // // //       if (key && key.includes('cart')) {
// // // // // // //         try {
// // // // // // //           const cartData = JSON.parse(localStorage.getItem(key));
// // // // // // //           if (Array.isArray(cartData) && cartData.length > 0) {
// // // // // // //             allCarts.push({
// // // // // // //               userId: key.replace('cart_', ''),
// // // // // // //               userName: 'Local User',
// // // // // // //               userEmail: 'user@example.com',
// // // // // // //               items: cartData,
// // // // // // //               updatedAt: new Date().toISOString(),
// // // // // // //               createdAt: new Date().toISOString(),
// // // // // // //             });
// // // // // // //           }
// // // // // // //         } catch (e) {
// // // // // // //           console.error('Error parsing cart:', e);
// // // // // // //         }
// // // // // // //       }
// // // // // // //     }

// // // // // // //     if (allCarts.length === 0) {
// // // // // // //       allCarts.push({
// // // // // // //         userId: 'demo-user-1',
// // // // // // //         userName: 'Demo User 1',
// // // // // // //         userEmail: 'demo1@example.com',
// // // // // // //         items: [
// // // // // // //           {
// // // // // // //             id: '1',
// // // // // // //             name: 'Demo Product 1',
// // // // // // //             description: 'Sample product',
// // // // // // //             price: 1200,
// // // // // // //             quantity: 2,
// // // // // // //             image: 'https://via.placeholder.com/100'
// // // // // // //           }
// // // // // // //         ],
// // // // // // //         updatedAt: new Date().toISOString(),
// // // // // // //         createdAt: new Date().toISOString(),
// // // // // // //       });
// // // // // // //     }

// // // // // // //     setCarts(allCarts);
// // // // // // //     setError('Using demo data. Connect to database to see real carts.');
// // // // // // //   };

// // // // // // //   const calculateTotal = (items) => {
// // // // // // //     return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
// // // // // // //   };

// // // // // // //   const deleteCart = async (userId) => {
// // // // // // //     if (!confirm('Are you sure you want to delete this cart?')) return;

// // // // // // //     setCarts(carts.filter(cart => cart.userId !== userId));
    
// // // // // // //     try {
// // // // // // //       await fetch(`/api/admin/carts/${userId}`, {
// // // // // // //         method: 'DELETE',
// // // // // // //       });
// // // // // // //     } catch (err) {
// // // // // // //       console.error('Delete error:', err);
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const exportToCSV = () => {
// // // // // // //     const headers = ['User ID', 'User Name', 'Email', 'Items Count', 'Total Value', 'Last Updated'];
// // // // // // //     const rows = filteredCarts.map(cart => [
// // // // // // //       cart.userId,
// // // // // // //       cart.userName,
// // // // // // //       cart.userEmail,
// // // // // // //       cart.items.length,
// // // // // // //       calculateTotal(cart.items),
// // // // // // //       new Date(cart.updatedAt).toLocaleString()
// // // // // // //     ]);

// // // // // // //     const csvContent = [
// // // // // // //       headers.join(','),
// // // // // // //       ...rows.map(row => row.join(','))
// // // // // // //     ].join('\n');

// // // // // // //     const blob = new Blob([csvContent], { type: 'text/csv' });
// // // // // // //     const url = window.URL.createObjectURL(blob);
// // // // // // //     const a = document.createElement('a');
// // // // // // //     a.href = url;
// // // // // // //     a.download = `carts_export_${new Date().toISOString().split('T')[0]}.csv`;
// // // // // // //     a.click();
// // // // // // //   };

// // // // // // //   const filteredCarts = carts.filter(cart => {
// // // // // // //     const matchesSearch = cart.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
// // // // // // //                          cart.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
// // // // // // //     if (filterStatus === 'empty') return cart.items.length === 0 && matchesSearch;
// // // // // // //     if (filterStatus === 'active') return cart.items.length > 0 && matchesSearch;
// // // // // // //     return matchesSearch;
// // // // // // //   });

// // // // // // //   const totalItems = carts.reduce((sum, cart) => sum + cart.items.length, 0);
// // // // // // //   const totalValue = carts.reduce((sum, cart) => sum + calculateTotal(cart.items), 0);
// // // // // // //   const activeCarts = carts.filter(cart => cart.items.length > 0).length;

// // // // // // //   if (loading) {
// // // // // // //     return (
// // // // // // //       <div style={{
// // // // // // //         display: 'flex',
// // // // // // //         alignItems: 'center',
// // // // // // //         justifyContent: 'center',
// // // // // // //         minHeight: '100vh',
// // // // // // //         background: 'linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff)'
// // // // // // //       }}>
// // // // // // //         <div style={{ textAlign: 'center' }}>
// // // // // // //           <div style={{ position: 'relative', margin: '0 auto 1rem', width: '64px', height: '64px' }}>
// // // // // // //             <div style={{
// // // // // // //               animation: 'spin 1s linear infinite',
// // // // // // //               borderRadius: '9999px',
// // // // // // //               height: '64px',
// // // // // // //               width: '64px',
// // // // // // //               borderTop: '4px solid #4f46e5',
// // // // // // //               borderBottom: '4px solid #4f46e5'
// // // // // // //             }}></div>
// // // // // // //           </div>
// // // // // // //           <p style={{ color: '#4b5563', fontSize: '1.125rem', fontWeight: '500' }}>Loading carts data...</p>
// // // // // // //         </div>
// // // // // // //       </div>
// // // // // // //     );
// // // // // // //   }

// // // // // // //   return (
// // // // // // //     <>
// // // // // // //       <style jsx>{`
// // // // // // //         @keyframes spin {
// // // // // // //           from { transform: rotate(0deg); }
// // // // // // //           to { transform: rotate(360deg); }
// // // // // // //         }
// // // // // // //         @keyframes fadeIn {
// // // // // // //           from { opacity: 0; transform: translateY(20px); }
// // // // // // //           to { opacity: 1; transform: translateY(0); }
// // // // // // //         }
// // // // // // //         .page-container {
// // // // // // //           min-height: 100vh;
// // // // // // //           background: linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff);
// // // // // // //           padding: 2rem 1rem;
// // // // // // //           animation: fadeIn 0.6s ease-out;
// // // // // // //         }
// // // // // // //         .container {
// // // // // // //           max-width: 1280px;
// // // // // // //           margin: 0 auto;
// // // // // // //         }
// // // // // // //         .header {
// // // // // // //           margin-bottom: 2rem;
// // // // // // //           text-align: center;
// // // // // // //         }
// // // // // // //         .title {
// // // // // // //           font-size: 2.25rem;
// // // // // // //           font-weight: 700;
// // // // // // //           background: linear-gradient(to right, #4f46e5, #7c3aed);
// // // // // // //           -webkit-background-clip: text;
// // // // // // //           -webkit-text-fill-color: transparent;
// // // // // // //           background-clip: text;
// // // // // // //           margin-bottom: 0.5rem;
// // // // // // //         }
// // // // // // //         .subtitle {
// // // // // // //           color: #4b5563;
// // // // // // //           font-size: 1.125rem;
// // // // // // //         }
// // // // // // //         .stats-grid {
// // // // // // //           display: grid;
// // // // // // //           grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
// // // // // // //           gap: 1.5rem;
// // // // // // //           margin-bottom: 2rem;
// // // // // // //         }
// // // // // // //         .stat-card {
// // // // // // //           background: white;
// // // // // // //           border-radius: 0.75rem;
// // // // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // // // //           overflow: hidden;
// // // // // // //           transition: all 0.3s;
// // // // // // //         }
// // // // // // //         .stat-card:hover {
// // // // // // //           transform: scale(1.05);
// // // // // // //           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
// // // // // // //         }
// // // // // // //         .stat-bar {
// // // // // // //           height: 1rem;
// // // // // // //           background: linear-gradient(to right, var(--color-start), var(--color-end));
// // // // // // //         }
// // // // // // //         .stat-content {
// // // // // // //           padding: 1.5rem;
// // // // // // //           display: flex;
// // // // // // //           align-items: center;
// // // // // // //           justify-content: space-between;
// // // // // // //         }
// // // // // // //         .stat-icon {
// // // // // // //           background: var(--bg-color);
// // // // // // //           border-radius: 9999px;
// // // // // // //           padding: 0.75rem;
// // // // // // //           font-size: 1.5rem;
// // // // // // //         }
// // // // // // //         .stat-label {
// // // // // // //           color: #6b7280;
// // // // // // //           font-size: 0.875rem;
// // // // // // //           font-weight: 500;
// // // // // // //         }
// // // // // // //         .stat-value {
// // // // // // //           font-size: 1.875rem;
// // // // // // //           font-weight: 700;
// // // // // // //           color: #111827;
// // // // // // //         }
// // // // // // //         .filters-card {
// // // // // // //           background: white;
// // // // // // //           border-radius: 0.75rem;
// // // // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // // // //           padding: 1.5rem;
// // // // // // //           margin-bottom: 1.5rem;
// // // // // // //         }
// // // // // // //         .filters-content {
// // // // // // //           display: flex;
// // // // // // //           flex-direction: column;
// // // // // // //           gap: 1rem;
// // // // // // //         }
// // // // // // //         @media (min-width: 768px) {
// // // // // // //           .filters-content {
// // // // // // //             flex-direction: row;
// // // // // // //             justify-content: space-between;
// // // // // // //             align-items: center;
// // // // // // //           }
// // // // // // //         }
// // // // // // //         .filter-buttons {
// // // // // // //           display: flex;
// // // // // // //           gap: 0.5rem;
// // // // // // //           flex-wrap: wrap;
// // // // // // //         }
// // // // // // //         .filter-btn {
// // // // // // //           padding: 0.5rem 1rem;
// // // // // // //           border-radius: 0.5rem;
// // // // // // //           font-weight: 500;
// // // // // // //           transition: all 0.3s;
// // // // // // //           cursor: pointer;
// // // // // // //           border: none;
// // // // // // //         }
// // // // // // //         .filter-btn-inactive {
// // // // // // //           background: #f3f4f6;
// // // // // // //           color: #374151;
// // // // // // //         }
// // // // // // //         .filter-btn-inactive:hover {
// // // // // // //           background: #e5e7eb;
// // // // // // //         }
// // // // // // //         .filter-btn-all {
// // // // // // //           background: linear-gradient(to right, #6366f1, #a855f7);
// // // // // // //           color: white;
// // // // // // //           box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
// // // // // // //         }
// // // // // // //         .filter-btn-active {
// // // // // // //           background: linear-gradient(to right, #10b981, #059669);
// // // // // // //           color: white;
// // // // // // //           box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
// // // // // // //         }
// // // // // // //         .filter-btn-empty {
// // // // // // //           background: linear-gradient(to right, #6b7280, #4b5563);
// // // // // // //           color: white;
// // // // // // //           box-shadow: 0 4px 6px -1px rgba(107, 114, 128, 0.3);
// // // // // // //         }
// // // // // // //         .search-export {
// // // // // // //           display: flex;
// // // // // // //           gap: 0.5rem;
// // // // // // //           width: 100%;
// // // // // // //         }
// // // // // // //         @media (min-width: 768px) {
// // // // // // //           .search-export {
// // // // // // //             width: auto;
// // // // // // //           }
// // // // // // //         }
// // // // // // //         .search-container {
// // // // // // //           position: relative;
// // // // // // //         }
// // // // // // //         .search-input {
// // // // // // //           padding: 0.5rem 1rem 0.5rem 2.5rem;
// // // // // // //           border: 1px solid #d1d5db;
// // // // // // //           border-radius: 0.5rem;
// // // // // // //           width: 100%;
// // // // // // //           outline: none;
// // // // // // //           transition: all 0.3s;
// // // // // // //         }
// // // // // // //         .search-input:focus {
// // // // // // //           border-color: #6366f1;
// // // // // // //           box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
// // // // // // //         }
// // // // // // //         .search-icon {
// // // // // // //           position: absolute;
// // // // // // //           left: 0.75rem;
// // // // // // //           top: 50%;
// // // // // // //           transform: translateY(-50%);
// // // // // // //           color: #9ca3af;
// // // // // // //           width: 1.25rem;
// // // // // // //           height: 1.25rem;
// // // // // // //         }
// // // // // // //         .export-btn {
// // // // // // //           background: linear-gradient(to right, #6366f1, #a855f7);
// // // // // // //           color: white;
// // // // // // //           padding: 0.5rem 1rem;
// // // // // // //           border-radius: 0.5rem;
// // // // // // //           font-weight: 500;
// // // // // // //           border: none;
// // // // // // //           cursor: pointer;
// // // // // // //           display: flex;
// // // // // // //           align-items: center;
// // // // // // //           gap: 0.5rem;
// // // // // // //           transition: all 0.3s;
// // // // // // //         }
// // // // // // //         .export-btn:hover {
// // // // // // //           background: linear-gradient(to right, #4f46e5, #9333ea);
// // // // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // // // //         }
// // // // // // //         .carts-list {
// // // // // // //           display: flex;
// // // // // // //           flex-direction: column;
// // // // // // //           gap: 1rem;
// // // // // // //         }
// // // // // // //         .cart-card {
// // // // // // //           background: white;
// // // // // // //           border-radius: 0.75rem;
// // // // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // // // //           overflow: hidden;
// // // // // // //           transition: all 0.3s;
// // // // // // //         }
// // // // // // //         .cart-card:hover {
// // // // // // //           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
// // // // // // //           transform: translateY(-4px);
// // // // // // //         }
// // // // // // //         .cart-gradient-bar {
// // // // // // //           height: 0.5rem;
// // // // // // //           background: linear-gradient(to right, #6366f1, #a855f7, #3b82f6);
// // // // // // //         }
// // // // // // //         .cart-content {
// // // // // // //           padding: 1.5rem;
// // // // // // //         }
// // // // // // //         .cart-header {
// // // // // // //           display: flex;
// // // // // // //           justify-content: space-between;
// // // // // // //           align-items: start;
// // // // // // //           margin-bottom: 1rem;
// // // // // // //           flex-wrap: wrap;
// // // // // // //           gap: 1rem;
// // // // // // //         }
// // // // // // //         .cart-user-info {
// // // // // // //           flex: 1;
// // // // // // //         }
// // // // // // //         .cart-user-name {
// // // // // // //           display: flex;
// // // // // // //           align-items: center;
// // // // // // //           gap: 0.75rem;
// // // // // // //           margin-bottom: 0.5rem;
// // // // // // //         }
// // // // // // //         .cart-name {
// // // // // // //           font-size: 1.25rem;
// // // // // // //           font-weight: 700;
// // // // // // //           color: #111827;
// // // // // // //         }
// // // // // // //         .status-badge {
// // // // // // //           padding: 0.25rem 0.75rem;
// // // // // // //           border-radius: 9999px;
// // // // // // //           font-size: 0.75rem;
// // // // // // //           font-weight: 500;
// // // // // // //         }
// // // // // // //         .status-active {
// // // // // // //           background: #d1fae5;
// // // // // // //           color: #065f46;
// // // // // // //         }
// // // // // // //         .status-empty {
// // // // // // //           background: #f3f4f6;
// // // // // // //           color: #374151;
// // // // // // //         }
// // // // // // //         .cart-email, .cart-id, .cart-updated {
// // // // // // //           display: flex;
// // // // // // //           align-items: center;
// // // // // // //           gap: 0.5rem;
// // // // // // //           color: #6b7280;
// // // // // // //           font-size: 0.875rem;
// // // // // // //           margin-bottom: 0.25rem;
// // // // // // //         }
// // // // // // //         .cart-total {
// // // // // // //           text-align: right;
// // // // // // //         }
// // // // // // //         .cart-total-value {
// // // // // // //           font-size: 1.5rem;
// // // // // // //           font-weight: 700;
// // // // // // //           background: linear-gradient(to right, #4f46e5, #7c3aed);
// // // // // // //           -webkit-background-clip: text;
// // // // // // //           -webkit-text-fill-color: transparent;
// // // // // // //           background-clip: text;
// // // // // // //         }
// // // // // // //         .cart-items-count {
// // // // // // //           color: #6b7280;
// // // // // // //           font-size: 0.875rem;
// // // // // // //         }
// // // // // // //         .cart-items-section {
// // // // // // //           border-top: 1px solid #e5e7eb;
// // // // // // //           padding-top: 1rem;
// // // // // // //           margin-top: 1rem;
// // // // // // //         }
// // // // // // //         .cart-items-title {
// // // // // // //           font-weight: 600;
// // // // // // //           color: #374151;
// // // // // // //           margin-bottom: 0.75rem;
// // // // // // //           display: flex;
// // // // // // //           align-items: center;
// // // // // // //           gap: 0.5rem;
// // // // // // //         }
// // // // // // //         .cart-items-list {
// // // // // // //           display: flex;
// // // // // // //           flex-direction: column;
// // // // // // //           gap: 0.5rem;
// // // // // // //         }
// // // // // // //         .cart-item {
// // // // // // //           display: flex;
// // // // // // //           justify-content: space-between;
// // // // // // //           align-items: center;
// // // // // // //           background: linear-gradient(to right, #eef2ff, #faf5ff);
// // // // // // //           border-radius: 0.5rem;
// // // // // // //           padding: 0.75rem;
// // // // // // //           border: 1px solid #e0e7ff;
// // // // // // //         }
// // // // // // //         .cart-item-info {
// // // // // // //           display: flex;
// // // // // // //           align-items: center;
// // // // // // //           gap: 0.75rem;
// // // // // // //           flex: 1;
// // // // // // //         }
// // // // // // //         .cart-item-image {
// // // // // // //           width: 3rem;
// // // // // // //           height: 3rem;
// // // // // // //           object-fit: cover;
// // // // // // //           border-radius: 0.375rem;
// // // // // // //         }
// // // // // // //         .cart-item-name {
// // // // // // //           font-weight: 500;
// // // // // // //           color: #111827;
// // // // // // //         }
// // // // // // //         .cart-item-qty {
// // // // // // //           font-size: 0.875rem;
// // // // // // //           color: #6b7280;
// // // // // // //         }
// // // // // // //         .cart-item-price {
// // // // // // //           font-weight: 600;
// // // // // // //           color: #4f46e5;
// // // // // // //         }
// // // // // // //         .cart-actions {
// // // // // // //           display: flex;
// // // // // // //           gap: 0.5rem;
// // // // // // //           margin-top: 1rem;
// // // // // // //           padding-top: 1rem;
// // // // // // //           border-top: 1px solid #e5e7eb;
// // // // // // //         }
// // // // // // //         .action-btn {
// // // // // // //           flex: 1;
// // // // // // //           padding: 0.5rem 1rem;
// // // // // // //           border-radius: 0.5rem;
// // // // // // //           font-weight: 500;
// // // // // // //           border: none;
// // // // // // //           cursor: pointer;
// // // // // // //           display: flex;
// // // // // // //           align-items: center;
// // // // // // //           justify-content: center;
// // // // // // //           gap: 0.5rem;
// // // // // // //           transition: all 0.3s;
// // // // // // //         }
// // // // // // //         .view-btn {
// // // // // // //           background: linear-gradient(to right, #6366f1, #4f46e5);
// // // // // // //           color: white;
// // // // // // //         }
// // // // // // //         .view-btn:hover {
// // // // // // //           background: linear-gradient(to right, #4f46e5, #4338ca);
// // // // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // // // //         }
// // // // // // //         .delete-btn {
// // // // // // //           background: linear-gradient(to right, #ef4444, #dc2626);
// // // // // // //           color: white;
// // // // // // //           padding: 0.5rem 1rem;
// // // // // // //         }
// // // // // // //         .delete-btn:hover {
// // // // // // //           background: linear-gradient(to right, #dc2626, #b91c1c);
// // // // // // //           box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
// // // // // // //         }
// // // // // // //         .empty-state {
// // // // // // //           background: white;
// // // // // // //           border-radius: 0.75rem;
// // // // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // // // //           padding: 3rem;
// // // // // // //           text-align: center;
// // // // // // //         }
// // // // // // //         .empty-icon {
// // // // // // //           font-size: 3.75rem;
// // // // // // //           margin-bottom: 1rem;
// // // // // // //           display: block;
// // // // // // //         }
// // // // // // //         .empty-title {
// // // // // // //           font-size: 1.25rem;
// // // // // // //           font-weight: 600;
// // // // // // //           color: #374151;
// // // // // // //           margin-bottom: 0.5rem;
// // // // // // //         }
// // // // // // //         .empty-text {
// // // // // // //           color: #6b7280;
// // // // // // //         }
// // // // // // //         .alert {
// // // // // // //           margin-top: 1rem;
// // // // // // //           background: #fffbeb;
// // // // // // //           border-left: 4px solid #f59e0b;
// // // // // // //           border-radius: 0.5rem;
// // // // // // //           padding: 1rem;
// // // // // // //           max-width: 48rem;
// // // // // // //           margin-left: auto;
// // // // // // //           margin-right: auto;
// // // // // // //         }
// // // // // // //         .alert-content {
// // // // // // //           display: flex;
// // // // // // //         }
// // // // // // //         .alert-icon {
// // // // // // //           flex-shrink: 0;
// // // // // // //           width: 1.25rem;
// // // // // // //           height: 1.25rem;
// // // // // // //           color: #f59e0b;
// // // // // // //         }
// // // // // // //         .alert-text {
// // // // // // //           margin-left: 0.75rem;
// // // // // // //           color: #92400e;
// // // // // // //           font-size: 0.875rem;
// // // // // // //         }
// // // // // // //         svg {
// // // // // // //           width: 1.25rem;
// // // // // // //           height: 1.25rem;
// // // // // // //         }
// // // // // // //       `}</style>

// // // // // // //       <div className="page-container">
// // // // // // //         <div className="container">
// // // // // // //           {/* Header */}
// // // // // // //           <div className="header">
// // // // // // //             <h1 className="title">Cart Management</h1>
// // // // // // //             <p className="subtitle">Monitor and manage all user shopping carts</p>
// // // // // // //             {error && (
// // // // // // //               <div className="alert">
// // // // // // //                 <div className="alert-content">
// // // // // // //                   <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor">
// // // // // // //                     <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
// // // // // // //                   </svg>
// // // // // // //                   <p className="alert-text">⚠️ {error}</p>
// // // // // // //                 </div>
// // // // // // //               </div>
// // // // // // //             )}
// // // // // // //           </div>

// // // // // // //           {/* Statistics Cards */}
// // // // // // //           <div className="stats-grid">
// // // // // // //             <div className="stat-card">
// // // // // // //               <div className="stat-bar" style={{'--color-start': '#6366f1', '--color-end': '#4f46e5'}}></div>
// // // // // // //               <div className="stat-content">
// // // // // // //                 <div>
// // // // // // //                   <p className="stat-label">Total Carts</p>
// // // // // // //                   <p className="stat-value">{carts.length}</p>
// // // // // // //                 </div>
// // // // // // //                 <div className="stat-icon" style={{'--bg-color': '#e0e7ff'}}>🛒</div>
// // // // // // //               </div>
// // // // // // //             </div>

// // // // // // //             <div className="stat-card">
// // // // // // //               <div className="stat-bar" style={{'--color-start': '#10b981', '--color-end': '#059669'}}></div>
// // // // // // //               <div className="stat-content">
// // // // // // //                 <div>
// // // // // // //                   <p className="stat-label">Active Carts</p>
// // // // // // //                   <p className="stat-value" style={{color: '#059669'}}>{activeCarts}</p>
// // // // // // //                 </div>
// // // // // // //                 <div className="stat-icon" style={{'--bg-color': '#d1fae5'}}>✅</div>
// // // // // // //               </div>
// // // // // // //             </div>

// // // // // // //             <div className="stat-card">
// // // // // // //               <div className="stat-bar" style={{'--color-start': '#a855f7', '--color-end': '#9333ea'}}></div>
// // // // // // //               <div className="stat-content">
// // // // // // //                 <div>
// // // // // // //                   <p className="stat-label">Total Items</p>
// // // // // // //                   <p className="stat-value" style={{color: '#9333ea'}}>{totalItems}</p>
// // // // // // //                 </div>
// // // // // // //                 <div className="stat-icon" style={{'--bg-color': '#f3e8ff'}}>📦</div>
// // // // // // //               </div>
// // // // // // //             </div>

// // // // // // //             <div className="stat-card">
// // // // // // //               <div className="stat-bar" style={{'--color-start': '#3b82f6', '--color-end': '#2563eb'}}></div>
// // // // // // //               <div className="stat-content">
// // // // // // //                 <div>
// // // // // // //                   <p className="stat-label">Total Value</p>
// // // // // // //                   <p className="stat-value" style={{color: '#2563eb'}}>AED {totalValue.toLocaleString()}</p>
// // // // // // //                 </div>
// // // // // // //                 <div className="stat-icon" style={{'--bg-color': '#dbeafe'}}>💰</div>
// // // // // // //               </div>
// // // // // // //             </div>
// // // // // // //           </div>

// // // // // // //           {/* Filters and Search */}
// // // // // // //           <div className="filters-card">
// // // // // // //             <div className="filters-content">
// // // // // // //               <div className="filter-buttons">
// // // // // // //                 <button
// // // // // // //                   onClick={() => setFilterStatus('all')}
// // // // // // //                   className={`filter-btn ${filterStatus === 'all' ? 'filter-btn-all' : 'filter-btn-inactive'}`}
// // // // // // //                 >
// // // // // // //                   All Carts
// // // // // // //                 </button>
// // // // // // //                 <button
// // // // // // //                   onClick={() => setFilterStatus('active')}
// // // // // // //                   className={`filter-btn ${filterStatus === 'active' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
// // // // // // //                 >
// // // // // // //                   Active
// // // // // // //                 </button>
// // // // // // //                 <button
// // // // // // //                   onClick={() => setFilterStatus('empty')}
// // // // // // //                   className={`filter-btn ${filterStatus === 'empty' ? 'filter-btn-empty' : 'filter-btn-inactive'}`}
// // // // // // //                 >
// // // // // // //                   Empty
// // // // // // //                 </button>
// // // // // // //               </div>

// // // // // // //               <div className="search-export">
// // // // // // //                 <div className="search-container">
// // // // // // //                   <input
// // // // // // //                     type="text"
// // // // // // //                     placeholder="Search by name or email..."
// // // // // // //                     value={searchQuery}
// // // // // // //                     onChange={(e) => setSearchQuery(e.target.value)}
// // // // // // //                     className="search-input"
// // // // // // //                   />
// // // // // // //                   <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // // //                     <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
// // // // // // //                   </svg>
// // // // // // //                 </div>
// // // // // // //                 <button onClick={exportToCSV} className="export-btn">
// // // // // // //                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // // //                     <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
// // // // // // //                   </svg>
// // // // // // //                   Export CSV
// // // // // // //                 </button>
// // // // // // //               </div>
// // // // // // //             </div>
// // // // // // //           </div>

// // // // // // //           {/* Carts List */}
// // // // // // //           <div className="carts-list">
// // // // // // //             {filteredCarts.length === 0 ? (
// // // // // // //               <div className="empty-state">
// // // // // // //                 <span className="empty-icon">📭</span>
// // // // // // //                 <h3 className="empty-title">No carts found</h3>
// // // // // // //                 <p className="empty-text">Try adjusting your filters or search query</p>
// // // // // // //               </div>
// // // // // // //             ) : (
// // // // // // //               filteredCarts.map((cart) => (
// // // // // // //                 <div key={cart.userId} className="cart-card">
// // // // // // //                   <div className="cart-gradient-bar"></div>
// // // // // // //                   <div className="cart-content">
// // // // // // //                     <div className="cart-header">
// // // // // // //                       <div className="cart-user-info">
// // // // // // //                         <div className="cart-user-name">
// // // // // // //                           <h3 className="cart-name">{cart.userName}</h3>
// // // // // // //                           <span className={`status-badge ${cart.items.length > 0 ? 'status-active' : 'status-empty'}`}>
// // // // // // //                             {cart.items.length > 0 ? 'Active' : 'Empty'}
// // // // // // //                           </span>
// // // // // // //                         </div>
// // // // // // //                         <div className="cart-email">
// // // // // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // // //                             <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
// // // // // // //                             <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
// // // // // // //                           </svg>
// // // // // // //                           <p>{cart.userEmail}</p>
// // // // // // //                         </div>
// // // // // // //                         <div className="cart-id">
// // // // // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // // //                             <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
// // // // // // //                           </svg>
// // // // // // //                           <p>User ID: {cart.userId}</p>
// // // // // // //                         </div>
// // // // // // //                         <div className="cart-updated">
// // // // // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // // //                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
// // // // // // //                           </svg>
// // // // // // //                           <p>Last updated: {new Date(cart.updatedAt).toLocaleString()}</p>
// // // // // // //                         </div>
// // // // // // //                       </div>
// // // // // // //                       <div className="cart-total">
// // // // // // //                         <p className="cart-total-value">AED {calculateTotal(cart.items).toLocaleString()}</p>
// // // // // // //                         <p className="cart-items-count">{cart.items.length} items</p>
// // // // // // //                       </div>
// // // // // // //                     </div>

// // // // // // //                     {cart.items.length > 0 && (
// // // // // // //                       <div className="cart-items-section">
// // // // // // //                         <h4 className="cart-items-title">
// // // // // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // // //                             <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
// // // // // // //                           </svg>
// // // // // // //                           Cart Items:
// // // // // // //                         </h4>
// // // // // // //                         <div className="cart-items-list">
// // // // // // //                           {cart.items.map((item, index) => (
// // // // // // //                             <div key={index} className="cart-item">
// // // // // // //                               <div className="cart-item-info">
// // // // // // //                                 {item.image && (
// // // // // // //                                   <img 
// // // // // // //                                     src={item.image} 
// // // // // // //                                     alt={item.name}
// // // // // // //                                     className="cart-item-image"
// // // // // // //                                   />
// // // // // // //                                 )}
// // // // // // //                                 <div>
// // // // // // //                                   <p className="cart-item-name">{item.name}</p>
// // // // // // //                                   <p className="cart-item-qty">Qty: {item.quantity}</p>
// // // // // // //                                 </div>
// // // // // // //                               </div>
// // // // // // //                               <p className="cart-item-price">
// // // // // // //                                 AED {(item.price * item.quantity).toLocaleString()}
// // // // // // //                               </p>
// // // // // // //                             </div>
// // // // // // //                           ))}
// // // // // // //                         </div>
// // // // // // //                       </div>
// // // // // // //                     )}

// // // // // // //                     <div className="cart-actions">
// // // // // // //                       <button
// // // // // // //                         onClick={() => alert('View user details - Connect to database')}
// // // // // // //                         className="action-btn view-btn"
// // // // // // //                       >
// // // // // // //                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // // //                           <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
// // // // // // //                           <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
// // // // // // //                         </svg>
// // // // // // //                         View User
// // // // // // //                       </button>
// // // // // // //                       <button
// // // // // // //                         onClick={() => deleteCart(cart.userId)}
// // // // // // //                         className="action-btn delete-btn"
// // // // // // //                       >
// // // // // // //                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // // //                           <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
// // // // // // //                         </svg>
// // // // // // //                         Delete
// // // // // // //                       </button>
// // // // // // //                     </div>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               ))
// // // // // // //             )}
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       </div>
// // // // // // //     </>
// // // // // // //   );
// // // // // // // }
// // // // // // 'use client';

// // // // // // import { useState, useEffect } from 'react';
// // // // // // import { useRouter } from 'next/navigation';
// // // // // // import { useAuth } from '@/contexts/AuthContext';

// // // // // // export default function AdminCartsPage() {
// // // // // //   const [carts, setCarts] = useState([]);
// // // // // //   const [loading, setLoading] = useState(true);
// // // // // //   const [error, setError] = useState(null);
// // // // // //   const [filterStatus, setFilterStatus] = useState('all');
// // // // // //   const [searchQuery, setSearchQuery] = useState('');
// // // // // //   const router = useRouter();
// // // // // //   const { user, loading: authLoading } = useAuth();

// // // // // //   useEffect(() => {
// // // // // //     if (!authLoading && !user) {
// // // // // //       router.push('/auth/login');
// // // // // //       return;
// // // // // //     }
// // // // // //     if (user) {
// // // // // //       fetchAllCarts();
// // // // // //     }
// // // // // //   }, [user, authLoading, router]);

// // // // // //   const fetchAllCarts = async () => {
// // // // // //     try {
// // // // // //       setLoading(true);
// // // // // //       setError(null);
      
// // // // // //       const response = await fetch('/api/admin/carts');
      
// // // // // //       if (!response.ok) {
// // // // // //         throw new Error('Failed to fetch carts');
// // // // // //       }

// // // // // //       const data = await response.json();
// // // // // //       setCarts(data.carts || []);
// // // // // //     } catch (err) {
// // // // // //       console.error('API Error:', err);
// // // // // //       setError('Failed to load carts. Please try again later.');
// // // // // //     } finally {
// // // // // //       setLoading(false);
// // // // // //     }
// // // // // //   };

// // // // // //   const calculateTotal = (items) => {
// // // // // //     return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
// // // // // //   };

// // // // // //   const deleteCart = async (userId) => {
// // // // // //     if (!confirm('Are you sure you want to delete this cart?')) return;

// // // // // //     // Optimistically update UI
// // // // // //     const originalCarts = [...carts];
// // // // // //     setCarts(carts.filter(cart => cart.userId !== userId));
    
// // // // // //     try {
// // // // // //       const response = await fetch(`/api/admin/carts/${userId}`, {
// // // // // //         method: 'DELETE',
// // // // // //       });
      
// // // // // //       if (!response.ok) {
// // // // // //         throw new Error('Failed to delete cart');
// // // // // //       }
// // // // // //     } catch (err) {
// // // // // //       console.error('Delete error:', err);
// // // // // //       // Revert UI change on error
// // // // // //       setCarts(originalCarts);
// // // // // //       setError('Failed to delete cart. Please try again.');
// // // // // //     }
// // // // // //   };

// // // // // //   const exportToCSV = () => {
// // // // // //     const headers = ['User ID', 'User Name', 'Email', 'Items Count', 'Total Value', 'Last Updated'];
// // // // // //     const rows = filteredCarts.map(cart => [
// // // // // //       cart.userId,
// // // // // //       cart.userName,
// // // // // //       cart.userEmail,
// // // // // //       cart.items.length,
// // // // // //       calculateTotal(cart.items),
// // // // // //       new Date(cart.updatedAt).toLocaleString()
// // // // // //     ]);

// // // // // //     const csvContent = [
// // // // // //       headers.join(','),
// // // // // //       ...rows.map(row => row.join(','))
// // // // // //     ].join('\n');

// // // // // //     const blob = new Blob([csvContent], { type: 'text/csv' });
// // // // // //     const url = window.URL.createObjectURL(blob);
// // // // // //     const a = document.createElement('a');
// // // // // //     a.href = url;
// // // // // //     a.download = `carts_export_${new Date().toISOString().split('T')[0]}.csv`;
// // // // // //     a.click();
// // // // // //   };

// // // // // //   const filteredCarts = carts.filter(cart => {
// // // // // //     const matchesSearch = cart.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
// // // // // //                          cart.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
// // // // // //     if (filterStatus === 'empty') return cart.items.length === 0 && matchesSearch;
// // // // // //     if (filterStatus === 'active') return cart.items.length > 0 && matchesSearch;
// // // // // //     return matchesSearch;
// // // // // //   });

// // // // // //   const totalItems = carts.reduce((sum, cart) => sum + cart.items.length, 0);
// // // // // //   const totalValue = carts.reduce((sum, cart) => sum + calculateTotal(cart.items), 0);
// // // // // //   const activeCarts = carts.filter(cart => cart.items.length > 0).length;

// // // // // //   if (authLoading || loading) {
// // // // // //     return (
// // // // // //       <div style={{
// // // // // //         display: 'flex',
// // // // // //         alignItems: 'center',
// // // // // //         justifyContent: 'center',
// // // // // //         minHeight: '100vh',
// // // // // //         background: 'linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff)'
// // // // // //       }}>
// // // // // //         <div style={{ textAlign: 'center' }}>
// // // // // //           <div style={{ position: 'relative', margin: '0 auto 1rem', width: '64px', height: '64px' }}>
// // // // // //             <div style={{
// // // // // //               animation: 'spin 1s linear infinite',
// // // // // //               borderRadius: '9999px',
// // // // // //               height: '64px',
// // // // // //               width: '64px',
// // // // // //               borderTop: '4px solid #4f46e5',
// // // // // //               borderBottom: '4px solid #4f46e5'
// // // // // //             }}></div>
// // // // // //           </div>
// // // // // //           <p style={{ color: '#4b5563', fontSize: '1.125rem', fontWeight: '500' }}>Loading carts data...</p>
// // // // // //         </div>
// // // // // //       </div>
// // // // // //     );
// // // // // //   }

// // // // // //   if (!user) {
// // // // // //     return null; // Will redirect in useEffect
// // // // // //   }

// // // // // //   return (
// // // // // //     <>
// // // // // //       <style jsx>{`
// // // // // //         @keyframes spin {
// // // // // //           from { transform: rotate(0deg); }
// // // // // //           to { transform: rotate(360deg); }
// // // // // //         }
// // // // // //         @keyframes fadeIn {
// // // // // //           from { opacity: 0; transform: translateY(20px); }
// // // // // //           to { opacity: 1; transform: translateY(0); }
// // // // // //         }
// // // // // //         .page-container {
// // // // // //           min-height: 100vh;
// // // // // //           background: linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff);
// // // // // //           padding: 2rem 1rem;
// // // // // //           animation: fadeIn 0.6s ease-out;
// // // // // //         }
// // // // // //         .container {
// // // // // //           max-width: 1280px;
// // // // // //           margin: 0 auto;
// // // // // //         }
// // // // // //         .header {
// // // // // //           margin-bottom: 2rem;
// // // // // //           text-align: center;
// // // // // //         }
// // // // // //         .title {
// // // // // //           font-size: 2.25rem;
// // // // // //           font-weight: 700;
// // // // // //           background: linear-gradient(to right, #4f46e5, #7c3aed);
// // // // // //           -webkit-background-clip: text;
// // // // // //           -webkit-text-fill-color: transparent;
// // // // // //           background-clip: text;
// // // // // //           margin-bottom: 0.5rem;
// // // // // //         }
// // // // // //         .subtitle {
// // // // // //           color: #4b5563;
// // // // // //           font-size: 1.125rem;
// // // // // //         }
// // // // // //         .stats-grid {
// // // // // //           display: grid;
// // // // // //           grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
// // // // // //           gap: 1.5rem;
// // // // // //           margin-bottom: 2rem;
// // // // // //         }
// // // // // //         .stat-card {
// // // // // //           background: white;
// // // // // //           border-radius: 0.75rem;
// // // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // // //           overflow: hidden;
// // // // // //           transition: all 0.3s;
// // // // // //         }
// // // // // //         .stat-card:hover {
// // // // // //           transform: scale(1.05);
// // // // // //           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
// // // // // //         }
// // // // // //         .stat-bar {
// // // // // //           height: 1rem;
// // // // // //           background: linear-gradient(to right, var(--color-start), var(--color-end));
// // // // // //         }
// // // // // //         .stat-content {
// // // // // //           padding: 1.5rem;
// // // // // //           display: flex;
// // // // // //           align-items: center;
// // // // // //           justify-content: space-between;
// // // // // //         }
// // // // // //         .stat-icon {
// // // // // //           background: var(--bg-color);
// // // // // //           border-radius: 9999px;
// // // // // //           padding: 0.75rem;
// // // // // //           font-size: 1.5rem;
// // // // // //         }
// // // // // //         .stat-label {
// // // // // //           color: #6b7280;
// // // // // //           font-size: 0.875rem;
// // // // // //           font-weight: 500;
// // // // // //         }
// // // // // //         .stat-value {
// // // // // //           font-size: 1.875rem;
// // // // // //           font-weight: 700;
// // // // // //           color: #111827;
// // // // // //         }
// // // // // //         .filters-card {
// // // // // //           background: white;
// // // // // //           border-radius: 0.75rem;
// // // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // // //           padding: 1.5rem;
// // // // // //           margin-bottom: 1.5rem;
// // // // // //         }
// // // // // //         .filters-content {
// // // // // //           display: flex;
// // // // // //           flex-direction: column;
// // // // // //           gap: 1rem;
// // // // // //         }
// // // // // //         @media (min-width: 768px) {
// // // // // //           .filters-content {
// // // // // //             flex-direction: row;
// // // // // //             justify-content: space-between;
// // // // // //             align-items: center;
// // // // // //           }
// // // // // //         }
// // // // // //         .filter-buttons {
// // // // // //           display: flex;
// // // // // //           gap: 0.5rem;
// // // // // //           flex-wrap: wrap;
// // // // // //         }
// // // // // //         .filter-btn {
// // // // // //           padding: 0.5rem 1rem;
// // // // // //           border-radius: 0.5rem;
// // // // // //           font-weight: 500;
// // // // // //           transition: all 0.3s;
// // // // // //           cursor: pointer;
// // // // // //           border: none;
// // // // // //         }
// // // // // //         .filter-btn-inactive {
// // // // // //           background: #f3f4f6;
// // // // // //           color: #374151;
// // // // // //         }
// // // // // //         .filter-btn-inactive:hover {
// // // // // //           background: #e5e7eb;
// // // // // //         }
// // // // // //         .filter-btn-all {
// // // // // //           background: linear-gradient(to right, #6366f1, #a855f7);
// // // // // //           color: white;
// // // // // //           box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
// // // // // //         }
// // // // // //         .filter-btn-active {
// // // // // //           background: linear-gradient(to right, #10b981, #059669);
// // // // // //           color: white;
// // // // // //           box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
// // // // // //         }
// // // // // //         .filter-btn-empty {
// // // // // //           background: linear-gradient(to right, #6b7280, #4b5563);
// // // // // //           color: white;
// // // // // //           box-shadow: 0 4px 6px -1px rgba(107, 114, 128, 0.3);
// // // // // //         }
// // // // // //         .search-export {
// // // // // //           display: flex;
// // // // // //           gap: 0.5rem;
// // // // // //           width: 100%;
// // // // // //         }
// // // // // //         @media (min-width: 768px) {
// // // // // //           .search-export {
// // // // // //             width: auto;
// // // // // //           }
// // // // // //         }
// // // // // //         .search-container {
// // // // // //           position: relative;
// // // // // //         }
// // // // // //         .search-input {
// // // // // //           padding: 0.5rem 1rem 0.5rem 2.5rem;
// // // // // //           border: 1px solid #d1d5db;
// // // // // //           border-radius: 0.5rem;
// // // // // //           width: 100%;
// // // // // //           outline: none;
// // // // // //           transition: all 0.3s;
// // // // // //         }
// // // // // //         .search-input:focus {
// // // // // //           border-color: #6366f1;
// // // // // //           box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
// // // // // //         }
// // // // // //         .search-icon {
// // // // // //           position: absolute;
// // // // // //           left: 0.75rem;
// // // // // //           top: 50%;
// // // // // //           transform: translateY(-50%);
// // // // // //           color: #9ca3af;
// // // // // //           width: 1.25rem;
// // // // // //           height: 1.25rem;
// // // // // //         }
// // // // // //         .export-btn {
// // // // // //           background: linear-gradient(to right, #6366f1, #a855f7);
// // // // // //           color: white;
// // // // // //           padding: 0.5rem 1rem;
// // // // // //           border-radius: 0.5rem;
// // // // // //           font-weight: 500;
// // // // // //           border: none;
// // // // // //           cursor: pointer;
// // // // // //           display: flex;
// // // // // //           align-items: center;
// // // // // //           gap: 0.5rem;
// // // // // //           transition: all 0.3s;
// // // // // //         }
// // // // // //         .export-btn:hover {
// // // // // //           background: linear-gradient(to right, #4f46e5, #9333ea);
// // // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // // //         }
// // // // // //         .carts-list {
// // // // // //           display: flex;
// // // // // //           flex-direction: column;
// // // // // //           gap: 1rem;
// // // // // //         }
// // // // // //         .cart-card {
// // // // // //           background: white;
// // // // // //           border-radius: 0.75rem;
// // // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // // //           overflow: hidden;
// // // // // //           transition: all 0.3s;
// // // // // //         }
// // // // // //         .cart-card:hover {
// // // // // //           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
// // // // // //           transform: translateY(-4px);
// // // // // //         }
// // // // // //         .cart-gradient-bar {
// // // // // //           height: 0.5rem;
// // // // // //           background: linear-gradient(to right, #6366f1, #a855f7, #3b82f6);
// // // // // //         }
// // // // // //         .cart-content {
// // // // // //           padding: 1.5rem;
// // // // // //         }
// // // // // //         .cart-header {
// // // // // //           display: flex;
// // // // // //           justify-content: space-between;
// // // // // //           align-items: start;
// // // // // //           margin-bottom: 1rem;
// // // // // //           flex-wrap: wrap;
// // // // // //           gap: 1rem;
// // // // // //         }
// // // // // //         .cart-user-info {
// // // // // //           flex: 1;
// // // // // //         }
// // // // // //         .cart-user-name {
// // // // // //           display: flex;
// // // // // //           align-items: center;
// // // // // //           gap: 0.75rem;
// // // // // //           margin-bottom: 0.5rem;
// // // // // //         }
// // // // // //         .cart-name {
// // // // // //           font-size: 1.25rem;
// // // // // //           font-weight: 700;
// // // // // //           color: #111827;
// // // // // //         }
// // // // // //         .status-badge {
// // // // // //           padding: 0.25rem 0.75rem;
// // // // // //           border-radius: 9999px;
// // // // // //           font-size: 0.75rem;
// // // // // //           font-weight: 500;
// // // // // //         }
// // // // // //         .status-active {
// // // // // //           background: #d1fae5;
// // // // // //           color: #065f46;
// // // // // //         }
// // // // // //         .status-empty {
// // // // // //           background: #f3f4f6;
// // // // // //           color: #374151;
// // // // // //         }
// // // // // //         .cart-email, .cart-id, .cart-updated {
// // // // // //           display: flex;
// // // // // //           align-items: center;
// // // // // //           gap: 0.5rem;
// // // // // //           color: #6b7280;
// // // // // //           font-size: 0.875rem;
// // // // // //           margin-bottom: 0.25rem;
// // // // // //         }
// // // // // //         .cart-total {
// // // // // //           text-align: right;
// // // // // //         }
// // // // // //         .cart-total-value {
// // // // // //           font-size: 1.5rem;
// // // // // //           font-weight: 700;
// // // // // //           background: linear-gradient(to right, #4f46e5, #7c3aed);
// // // // // //           -webkit-background-clip: text;
// // // // // //           -webkit-text-fill-color: transparent;
// // // // // //           background-clip: text;
// // // // // //         }
// // // // // //         .cart-items-count {
// // // // // //           color: #6b7280;
// // // // // //           font-size: 0.875rem;
// // // // // //         }
// // // // // //         .cart-items-section {
// // // // // //           border-top: 1px solid #e5e7eb;
// // // // // //           padding-top: 1rem;
// // // // // //           margin-top: 1rem;
// // // // // //         }
// // // // // //         .cart-items-title {
// // // // // //           font-weight: 600;
// // // // // //           color: #374151;
// // // // // //           margin-bottom: 0.75rem;
// // // // // //           display: flex;
// // // // // //           align-items: center;
// // // // // //           gap: 0.5rem;
// // // // // //         }
// // // // // //         .cart-items-list {
// // // // // //           display: flex;
// // // // // //           flex-direction: column;
// // // // // //           gap: 0.5rem;
// // // // // //         }
// // // // // //         .cart-item {
// // // // // //           display: flex;
// // // // // //           justify-content: space-between;
// // // // // //           align-items: center;
// // // // // //           background: linear-gradient(to right, #eef2ff, #faf5ff);
// // // // // //           border-radius: 0.5rem;
// // // // // //           padding: 0.75rem;
// // // // // //           border: 1px solid #e0e7ff;
// // // // // //         }
// // // // // //         .cart-item-info {
// // // // // //           display: flex;
// // // // // //           align-items: center;
// // // // // //           gap: 0.75rem;
// // // // // //           flex: 1;
// // // // // //         }
// // // // // //         .cart-item-image {
// // // // // //           width: 3rem;
// // // // // //           height: 3rem;
// // // // // //           object-fit: cover;
// // // // // //           border-radius: 0.375rem;
// // // // // //         }
// // // // // //         .cart-item-name {
// // // // // //           font-weight: 500;
// // // // // //           color: #111827;
// // // // // //         }
// // // // // //         .cart-item-qty {
// // // // // //           font-size: 0.875rem;
// // // // // //           color: #6b7280;
// // // // // //         }
// // // // // //         .cart-item-price {
// // // // // //           font-weight: 600;
// // // // // //           color: #4f46e5;
// // // // // //         }
// // // // // //         .cart-actions {
// // // // // //           display: flex;
// // // // // //           gap: 0.5rem;
// // // // // //           margin-top: 1rem;
// // // // // //           padding-top: 1rem;
// // // // // //           border-top: 1px solid #e5e7eb;
// // // // // //         }
// // // // // //         .action-btn {
// // // // // //           flex: 1;
// // // // // //           padding: 0.5rem 1rem;
// // // // // //           border-radius: 0.5rem;
// // // // // //           font-weight: 500;
// // // // // //           border: none;
// // // // // //           cursor: pointer;
// // // // // //           display: flex;
// // // // // //           align-items: center;
// // // // // //           justify-content: center;
// // // // // //           gap: 0.5rem;
// // // // // //           transition: all 0.3s;
// // // // // //         }
// // // // // //         .view-btn {
// // // // // //           background: linear-gradient(to right, #6366f1, #4f46e5);
// // // // // //           color: white;
// // // // // //         }
// // // // // //         .view-btn:hover {
// // // // // //           background: linear-gradient(to right, #4f46e5, #4338ca);
// // // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // // //         }
// // // // // //         .delete-btn {
// // // // // //           background: linear-gradient(to right, #ef4444, #dc2626);
// // // // // //           color: white;
// // // // // //           padding: 0.5rem 1rem;
// // // // // //         }
// // // // // //         .delete-btn:hover {
// // // // // //           background: linear-gradient(to right, #dc2626, #b91c1c);
// // // // // //           box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
// // // // // //         }
// // // // // //         .empty-state {
// // // // // //           background: white;
// // // // // //           border-radius: 0.75rem;
// // // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // // //           padding: 3rem;
// // // // // //           text-align: center;
// // // // // //         }
// // // // // //         .empty-icon {
// // // // // //           font-size: 3.75rem;
// // // // // //           margin-bottom: 1rem;
// // // // // //           display: block;
// // // // // //         }
// // // // // //         .empty-title {
// // // // // //           font-size: 1.25rem;
// // // // // //           font-weight: 600;
// // // // // //           color: #374151;
// // // // // //           margin-bottom: 0.5rem;
// // // // // //         }
// // // // // //         .empty-text {
// // // // // //           color: #6b7280;
// // // // // //         }
// // // // // //         .alert {
// // // // // //           margin-top: 1rem;
// // // // // //           background: #fffbeb;
// // // // // //           border-left: 4px solid #f59e0b;
// // // // // //           border-radius: 0.5rem;
// // // // // //           padding: 1rem;
// // // // // //           max-width: 48rem;
// // // // // //           margin-left: auto;
// // // // // //           margin-right: auto;
// // // // // //         }
// // // // // //         .alert-content {
// // // // // //           display: flex;
// // // // // //         }
// // // // // //         .alert-icon {
// // // // // //           flex-shrink: 0;
// // // // // //           width: 1.25rem;
// // // // // //           height: 1.25rem;
// // // // // //           color: #f59e0b;
// // // // // //         }
// // // // // //         .alert-text {
// // // // // //           margin-left: 0.75rem;
// // // // // //           color: #92400e;
// // // // // //           font-size: 0.875rem;
// // // // // //         }
// // // // // //         svg {
// // // // // //           width: 1.25rem;
// // // // // //           height: 1.25rem;
// // // // // //         }
// // // // // //       `}</style>

// // // // // //       <div className="page-container">
// // // // // //         <div className="container">
// // // // // //           {/* Header */}
// // // // // //           <div className="header">
// // // // // //             <h1 className="title">Cart Management</h1>
// // // // // //             <p className="subtitle">Monitor and manage all user shopping carts</p>
// // // // // //             {error && (
// // // // // //               <div className="alert">
// // // // // //                 <div className="alert-content">
// // // // // //                   <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor">
// // // // // //                     <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
// // // // // //                   </svg>
// // // // // //                   <p className="alert-text">⚠️ {error}</p>
// // // // // //                 </div>
// // // // // //               </div>
// // // // // //             )}
// // // // // //           </div>

// // // // // //           {/* Statistics Cards */}
// // // // // //           <div className="stats-grid">
// // // // // //             <div className="stat-card">
// // // // // //               <div className="stat-bar" style={{'--color-start': '#6366f1', '--color-end': '#4f46e5'}}></div>
// // // // // //               <div className="stat-content">
// // // // // //                 <div>
// // // // // //                   <p className="stat-label">Total Carts</p>
// // // // // //                   <p className="stat-value">{carts.length}</p>
// // // // // //                 </div>
// // // // // //                 <div className="stat-icon" style={{'--bg-color': '#e0e7ff'}}>🛒</div>
// // // // // //               </div>
// // // // // //             </div>

// // // // // //             <div className="stat-card">
// // // // // //               <div className="stat-bar" style={{'--color-start': '#10b981', '--color-end': '#059669'}}></div>
// // // // // //               <div className="stat-content">
// // // // // //                 <div>
// // // // // //                   <p className="stat-label">Active Carts</p>
// // // // // //                   <p className="stat-value" style={{color: '#059669'}}>{activeCarts}</p>
// // // // // //                 </div>
// // // // // //                 <div className="stat-icon" style={{'--bg-color': '#d1fae5'}}>✅</div>
// // // // // //               </div>
// // // // // //             </div>

// // // // // //             <div className="stat-card">
// // // // // //               <div className="stat-bar" style={{'--color-start': '#a855f7', '--color-end': '#9333ea'}}></div>
// // // // // //               <div className="stat-content">
// // // // // //                 <div>
// // // // // //                   <p className="stat-label">Total Items</p>
// // // // // //                   <p className="stat-value" style={{color: '#9333ea'}}>{totalItems}</p>
// // // // // //                 </div>
// // // // // //                 <div className="stat-icon" style={{'--bg-color': '#f3e8ff'}}>📦</div>
// // // // // //               </div>
// // // // // //             </div>

// // // // // //             <div className="stat-card">
// // // // // //               <div className="stat-bar" style={{'--color-start': '#3b82f6', '--color-end': '#2563eb'}}></div>
// // // // // //               <div className="stat-content">
// // // // // //                 <div>
// // // // // //                   <p className="stat-label">Total Value</p>
// // // // // //                   <p className="stat-value" style={{color: '#2563eb'}}>AED {totalValue.toLocaleString()}</p>
// // // // // //                 </div>
// // // // // //                 <div className="stat-icon" style={{'--bg-color': '#dbeafe'}}>💰</div>
// // // // // //               </div>
// // // // // //             </div>
// // // // // //           </div>

// // // // // //           {/* Filters and Search */}
// // // // // //           <div className="filters-card">
// // // // // //             <div className="filters-content">
// // // // // //               <div className="filter-buttons">
// // // // // //                 <button
// // // // // //                   onClick={() => setFilterStatus('all')}
// // // // // //                   className={`filter-btn ${filterStatus === 'all' ? 'filter-btn-all' : 'filter-btn-inactive'}`}
// // // // // //                 >
// // // // // //                   All Carts
// // // // // //                 </button>
// // // // // //                 <button
// // // // // //                   onClick={() => setFilterStatus('active')}
// // // // // //                   className={`filter-btn ${filterStatus === 'active' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
// // // // // //                 >
// // // // // //                   Active
// // // // // //                 </button>
// // // // // //                 <button
// // // // // //                   onClick={() => setFilterStatus('empty')}
// // // // // //                   className={`filter-btn ${filterStatus === 'empty' ? 'filter-btn-empty' : 'filter-btn-inactive'}`}
// // // // // //                 >
// // // // // //                   Empty
// // // // // //                 </button>
// // // // // //               </div>

// // // // // //               <div className="search-export">
// // // // // //                 <div className="search-container">
// // // // // //                   <input
// // // // // //                     type="text"
// // // // // //                     placeholder="Search by name or email..."
// // // // // //                     value={searchQuery}
// // // // // //                     onChange={(e) => setSearchQuery(e.target.value)}
// // // // // //                     className="search-input"
// // // // // //                   />
// // // // // //                   <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // //                     <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
// // // // // //                   </svg>
// // // // // //                 </div>
// // // // // //                 <button onClick={exportToCSV} className="export-btn">
// // // // // //                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // //                     <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
// // // // // //                   </svg>
// // // // // //                   Export CSV
// // // // // //                 </button>
// // // // // //               </div>
// // // // // //             </div>
// // // // // //           </div>

// // // // // //           {/* Carts List */}
// // // // // //           <div className="carts-list">
// // // // // //             {filteredCarts.length === 0 ? (
// // // // // //               <div className="empty-state">
// // // // // //                 <span className="empty-icon">📭</span>
// // // // // //                 <h3 className="empty-title">No carts found</h3>
// // // // // //                 <p className="empty-text">Try adjusting your filters or search query</p>
// // // // // //               </div>
// // // // // //             ) : (
// // // // // //               filteredCarts.map((cart) => (
// // // // // //                 <div key={cart.userId} className="cart-card">
// // // // // //                   <div className="cart-gradient-bar"></div>
// // // // // //                   <div className="cart-content">
// // // // // //                     <div className="cart-header">
// // // // // //                       <div className="cart-user-info">
// // // // // //                         <div className="cart-user-name">
// // // // // //                           <h3 className="cart-name">{cart.userName}</h3>
// // // // // //                           <span className={`status-badge ${cart.items.length > 0 ? 'status-active' : 'status-empty'}`}>
// // // // // //                             {cart.items.length > 0 ? 'Active' : 'Empty'}
// // // // // //                           </span>
// // // // // //                         </div>
// // // // // //                         <div className="cart-email">
// // // // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // //                             <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
// // // // // //                             <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
// // // // // //                           </svg>
// // // // // //                           <p>{cart.userEmail}</p>
// // // // // //                         </div>
// // // // // //                         <div className="cart-id">
// // // // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // //                             <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
// // // // // //                           </svg>
// // // // // //                           <p>User ID: {cart.userId}</p>
// // // // // //                         </div>
// // // // // //                         <div className="cart-updated">
// // // // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // //                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
// // // // // //                           </svg>
// // // // // //                           <p>Last updated: {new Date(cart.updatedAt).toLocaleString()}</p>
// // // // // //                         </div>
// // // // // //                       </div>
// // // // // //                       <div className="cart-total">
// // // // // //                         <p className="cart-total-value">AED {calculateTotal(cart.items).toLocaleString()}</p>
// // // // // //                         <p className="cart-items-count">{cart.items.length} items</p>
// // // // // //                       </div>
// // // // // //                     </div>

// // // // // //                     {cart.items.length > 0 && (
// // // // // //                       <div className="cart-items-section">
// // // // // //                         <h4 className="cart-items-title">
// // // // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // //                             <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
// // // // // //                           </svg>
// // // // // //                           Cart Items:
// // // // // //                         </h4>
// // // // // //                         <div className="cart-items-list">
// // // // // //                           {cart.items.map((item, index) => (
// // // // // //                             <div key={index} className="cart-item">
// // // // // //                               <div className="cart-item-info">
// // // // // //                                 {item.image && (
// // // // // //                                   <img 
// // // // // //                                     src={item.image} 
// // // // // //                                     alt={item.name}
// // // // // //                                     className="cart-item-image"
// // // // // //                                   />
// // // // // //                                 )}
// // // // // //                                 <div>
// // // // // //                                   <p className="cart-item-name">{item.name}</p>
// // // // // //                                   <p className="cart-item-qty">Qty: {item.quantity}</p>
// // // // // //                                 </div>
// // // // // //                               </div>
// // // // // //                               <p className="cart-item-price">
// // // // // //                                 AED {(item.price * item.quantity).toLocaleString()}
// // // // // //                               </p>
// // // // // //                             </div>
// // // // // //                           ))}
// // // // // //                         </div>
// // // // // //                       </div>
// // // // // //                     )}

// // // // // //                     <div className="cart-actions">
// // // // // //                       <button
// // // // // //                         onClick={() => router.push(`/admin/users/${cart.userId}`)}
// // // // // //                         className="action-btn view-btn"
// // // // // //                       >
// // // // // //                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // //                           <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
// // // // // //                           <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
// // // // // //                         </svg>
// // // // // //                         View User
// // // // // //                       </button>
// // // // // //                       <button
// // // // // //                         onClick={() => deleteCart(cart.userId)}
// // // // // //                         className="action-btn delete-btn"
// // // // // //                       >
// // // // // //                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // // //                           <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
// // // // // //                         </svg>
// // // // // //                         Delete
// // // // // //                       </button>
// // // // // //                     </div>
// // // // // //                   </div>
// // // // // //                 </div>
// // // // // //               ))
// // // // // //             )}
// // // // // //           </div>
// // // // // //         </div>
// // // // // //       </div>
// // // // // //     </>
// // // // // //   );
// // // // // // }
// // // // // 'use client';

// // // // // import { useState, useEffect } from 'react';
// // // // // import { useRouter } from 'next/navigation';
// // // // // import { useAuth } from '@/contexts/AuthContext';

// // // // // export default function AdminCartsPage() {
// // // // //   const [carts, setCarts] = useState([]);
// // // // //   const [loading, setLoading] = useState(true);
// // // // //   const [error, setError] = useState(null);
// // // // //   const [filterStatus, setFilterStatus] = useState('all');
// // // // //   const [searchQuery, setSearchQuery] = useState('');
// // // // //   const router = useRouter();
// // // // //   const { user, loading: authLoading } = useAuth();

// // // // //   useEffect(() => {
// // // // //     if (!authLoading && !user) {
// // // // //       router.push('/auth/login');
// // // // //       return;
// // // // //     }
// // // // //     if (user) {
// // // // //       fetchAllCarts();
// // // // //     }
// // // // //   }, [user, authLoading, router]);

// // // // //   const fetchAllCarts = async () => {
// // // // //     try {
// // // // //       setLoading(true);
// // // // //       setError(null);
      
// // // // //       const response = await fetch('/api/admin/carts');
      
// // // // //       if (!response.ok) {
// // // // //         const errorData = await response.json();
// // // // //         throw new Error(errorData.error || 'Failed to fetch carts');
// // // // //       }

// // // // //       const data = await response.json();
// // // // //       setCarts(data.carts || []);
// // // // //     } catch (err) {
// // // // //       console.error('API Error:', err);
// // // // //       setError(err.message || 'Failed to load carts. Please try again later.');
// // // // //     } finally {
// // // // //       setLoading(false);
// // // // //     }
// // // // //   };

// // // // //   const calculateTotal = (items) => {
// // // // //     return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
// // // // //   };

// // // // //   const deleteCart = async (userId) => {
// // // // //     if (!confirm('Are you sure you want to delete this cart?')) return;

// // // // //     // Optimistically update UI
// // // // //     const originalCarts = [...carts];
// // // // //     setCarts(carts.filter(cart => cart.userId !== userId));
    
// // // // //     try {
// // // // //       const response = await fetch(`/api/admin/carts?userId=${userId}`, {
// // // // //         method: 'DELETE',
// // // // //       });
      
// // // // //       if (!response.ok) {
// // // // //         const errorData = await response.json();
// // // // //         throw new Error(errorData.error || 'Failed to delete cart');
// // // // //       }
// // // // //     } catch (err) {
// // // // //       console.error('Delete error:', err);
// // // // //       // Revert UI change on error
// // // // //       setCarts(originalCarts);
// // // // //       setError(err.message || 'Failed to delete cart. Please try again.');
// // // // //     }
// // // // //   };

// // // // //   const exportToCSV = () => {
// // // // //     const headers = ['User ID', 'User Name', 'Email', 'Items Count', 'Total Value', 'Last Updated'];
// // // // //     const rows = filteredCarts.map(cart => [
// // // // //       cart.userId,
// // // // //       cart.userName,
// // // // //       cart.userEmail,
// // // // //       cart.items.length,
// // // // //       calculateTotal(cart.items),
// // // // //       new Date(cart.updatedAt).toLocaleString()
// // // // //     ]);

// // // // //     const csvContent = [
// // // // //       headers.join(','),
// // // // //       ...rows.map(row => row.join(','))
// // // // //     ].join('\n');

// // // // //     const blob = new Blob([csvContent], { type: 'text/csv' });
// // // // //     const url = window.URL.createObjectURL(blob);
// // // // //     const a = document.createElement('a');
// // // // //     a.href = url;
// // // // //     a.download = `carts_export_${new Date().toISOString().split('T')[0]}.csv`;
// // // // //     a.click();
// // // // //   };

// // // // //   const filteredCarts = carts.filter(cart => {
// // // // //     const matchesSearch = cart.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
// // // // //                          cart.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
// // // // //     if (filterStatus === 'empty') return cart.items.length === 0 && matchesSearch;
// // // // //     if (filterStatus === 'active') return cart.items.length > 0 && matchesSearch;
// // // // //     return matchesSearch;
// // // // //   });

// // // // //   const totalItems = carts.reduce((sum, cart) => sum + cart.items.length, 0);
// // // // //   const totalValue = carts.reduce((sum, cart) => sum + calculateTotal(cart.items), 0);
// // // // //   const activeCarts = carts.filter(cart => cart.items.length > 0).length;

// // // // //   if (authLoading || loading) {
// // // // //     return (
// // // // //       <div style={{
// // // // //         display: 'flex',
// // // // //         alignItems: 'center',
// // // // //         justifyContent: 'center',
// // // // //         minHeight: '100vh',
// // // // //         background: 'linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff)'
// // // // //       }}>
// // // // //         <div style={{ textAlign: 'center' }}>
// // // // //           <div style={{ position: 'relative', margin: '0 auto 1rem', width: '64px', height: '64px' }}>
// // // // //             <div style={{
// // // // //               animation: 'spin 1s linear infinite',
// // // // //               borderRadius: '9999px',
// // // // //               height: '64px',
// // // // //               width: '64px',
// // // // //               borderTop: '4px solid #4f46e5',
// // // // //               borderBottom: '4px solid #4f46e5'
// // // // //             }}></div>
// // // // //           </div>
// // // // //           <p style={{ color: '#4b5563', fontSize: '1.125rem', fontWeight: '500' }}>Loading carts data...</p>
// // // // //         </div>
// // // // //       </div>
// // // // //     );
// // // // //   }

// // // // //   if (!user) {
// // // // //     return null; // Will redirect in useEffect
// // // // //   }

// // // // //   return (
// // // // //     <>
// // // // //       <style jsx>{`
// // // // //         @keyframes spin {
// // // // //           from { transform: rotate(0deg); }
// // // // //           to { transform: rotate(360deg); }
// // // // //         }
// // // // //         @keyframes fadeIn {
// // // // //           from { opacity: 0; transform: translateY(20px); }
// // // // //           to { opacity: 1; transform: translateY(0); }
// // // // //         }
// // // // //         .page-container {
// // // // //           min-height: 100vh;
// // // // //           background: linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff);
// // // // //           padding: 2rem 1rem;
// // // // //           animation: fadeIn 0.6s ease-out;
// // // // //         }
// // // // //         .container {
// // // // //           max-width: 1280px;
// // // // //           margin: 0 auto;
// // // // //         }
// // // // //         .header {
// // // // //           margin-bottom: 2rem;
// // // // //           text-align: center;
// // // // //         }
// // // // //         .title {
// // // // //           font-size: 2.25rem;
// // // // //           font-weight: 700;
// // // // //           background: linear-gradient(to right, #4f46e5, #7c3aed);
// // // // //           -webkit-background-clip: text;
// // // // //           -webkit-text-fill-color: transparent;
// // // // //           background-clip: text;
// // // // //           margin-bottom: 0.5rem;
// // // // //         }
// // // // //         .subtitle {
// // // // //           color: #4b5563;
// // // // //           font-size: 1.125rem;
// // // // //         }
// // // // //         .stats-grid {
// // // // //           display: grid;
// // // // //           grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
// // // // //           gap: 1.5rem;
// // // // //           margin-bottom: 2rem;
// // // // //         }
// // // // //         .stat-card {
// // // // //           background: white;
// // // // //           border-radius: 0.75rem;
// // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // //           overflow: hidden;
// // // // //           transition: all 0.3s;
// // // // //         }
// // // // //         .stat-card:hover {
// // // // //           transform: scale(1.05);
// // // // //           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
// // // // //         }
// // // // //         .stat-bar {
// // // // //           height: 1rem;
// // // // //           background: linear-gradient(to right, var(--color-start), var(--color-end));
// // // // //         }
// // // // //         .stat-content {
// // // // //           padding: 1.5rem;
// // // // //           display: flex;
// // // // //           align-items: center;
// // // // //           justify-content: space-between;
// // // // //         }
// // // // //         .stat-icon {
// // // // //           background: var(--bg-color);
// // // // //           border-radius: 9999px;
// // // // //           padding: 0.75rem;
// // // // //           font-size: 1.5rem;
// // // // //         }
// // // // //         .stat-label {
// // // // //           color: #6b7280;
// // // // //           font-size: 0.875rem;
// // // // //           font-weight: 500;
// // // // //         }
// // // // //         .stat-value {
// // // // //           font-size: 1.875rem;
// // // // //           font-weight: 700;
// // // // //           color: #111827;
// // // // //         }
// // // // //         .filters-card {
// // // // //           background: white;
// // // // //           border-radius: 0.75rem;
// // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // //           padding: 1.5rem;
// // // // //           margin-bottom: 1.5rem;
// // // // //         }
// // // // //         .filters-content {
// // // // //           display: flex;
// // // // //           flex-direction: column;
// // // // //           gap: 1rem;
// // // // //         }
// // // // //         @media (min-width: 768px) {
// // // // //           .filters-content {
// // // // //             flex-direction: row;
// // // // //             justify-content: space-between;
// // // // //             align-items: center;
// // // // //           }
// // // // //         }
// // // // //         .filter-buttons {
// // // // //           display: flex;
// // // // //           gap: 0.5rem;
// // // // //           flex-wrap: wrap;
// // // // //         }
// // // // //         .filter-btn {
// // // // //           padding: 0.5rem 1rem;
// // // // //           border-radius: 0.5rem;
// // // // //           font-weight: 500;
// // // // //           transition: all 0.3s;
// // // // //           cursor: pointer;
// // // // //           border: none;
// // // // //         }
// // // // //         .filter-btn-inactive {
// // // // //           background: #f3f4f6;
// // // // //           color: #374151;
// // // // //         }
// // // // //         .filter-btn-inactive:hover {
// // // // //           background: #e5e7eb;
// // // // //         }
// // // // //         .filter-btn-all {
// // // // //           background: linear-gradient(to right, #6366f1, #a855f7);
// // // // //           color: white;
// // // // //           box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
// // // // //         }
// // // // //         .filter-btn-active {
// // // // //           background: linear-gradient(to right, #10b981, #059669);
// // // // //           color: white;
// // // // //           box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
// // // // //         }
// // // // //         .filter-btn-empty {
// // // // //           background: linear-gradient(to right, #6b7280, #4b5563);
// // // // //           color: white;
// // // // //           box-shadow: 0 4px 6px -1px rgba(107, 114, 128, 0.3);
// // // // //         }
// // // // //         .search-export {
// // // // //           display: flex;
// // // // //           gap: 0.5rem;
// // // // //           width: 100%;
// // // // //         }
// // // // //         @media (min-width: 768px) {
// // // // //           .search-export {
// // // // //             width: auto;
// // // // //           }
// // // // //         }
// // // // //         .search-container {
// // // // //           position: relative;
// // // // //         }
// // // // //         .search-input {
// // // // //           padding: 0.5rem 1rem 0.5rem 2.5rem;
// // // // //           border: 1px solid #d1d5db;
// // // // //           border-radius: 0.5rem;
// // // // //           width: 100%;
// // // // //           outline: none;
// // // // //           transition: all 0.3s;
// // // // //         }
// // // // //         .search-input:focus {
// // // // //           border-color: #6366f1;
// // // // //           box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
// // // // //         }
// // // // //         .search-icon {
// // // // //           position: absolute;
// // // // //           left: 0.75rem;
// // // // //           top: 50%;
// // // // //           transform: translateY(-50%);
// // // // //           color: #9ca3af;
// // // // //           width: 1.25rem;
// // // // //           height: 1.25rem;
// // // // //         }
// // // // //         .export-btn {
// // // // //           background: linear-gradient(to right, #6366f1, #a855f7);
// // // // //           color: white;
// // // // //           padding: 0.5rem 1rem;
// // // // //           border-radius: 0.5rem;
// // // // //           font-weight: 500;
// // // // //           border: none;
// // // // //           cursor: pointer;
// // // // //           display: flex;
// // // // //           align-items: center;
// // // // //           gap: 0.5rem;
// // // // //           transition: all 0.3s;
// // // // //         }
// // // // //         .export-btn:hover {
// // // // //           background: linear-gradient(to right, #4f46e5, #9333ea);
// // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // //         }
// // // // //         .carts-list {
// // // // //           display: flex;
// // // // //           flex-direction: column;
// // // // //           gap: 1rem;
// // // // //         }
// // // // //         .cart-card {
// // // // //           background: white;
// // // // //           border-radius: 0.75rem;
// // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // //           overflow: hidden;
// // // // //           transition: all 0.3s;
// // // // //         }
// // // // //         .cart-card:hover {
// // // // //           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
// // // // //           transform: translateY(-4px);
// // // // //         }
// // // // //         .cart-gradient-bar {
// // // // //           height: 0.5rem;
// // // // //           background: linear-gradient(to right, #6366f1, #a855f7, #3b82f6);
// // // // //         }
// // // // //         .cart-content {
// // // // //           padding: 1.5rem;
// // // // //         }
// // // // //         .cart-header {
// // // // //           display: flex;
// // // // //           justify-content: space-between;
// // // // //           align-items: start;
// // // // //           margin-bottom: 1rem;
// // // // //           flex-wrap: wrap;
// // // // //           gap: 1rem;
// // // // //         }
// // // // //         .cart-user-info {
// // // // //           flex: 1;
// // // // //         }
// // // // //         .cart-user-name {
// // // // //           display: flex;
// // // // //           align-items: center;
// // // // //           gap: 0.75rem;
// // // // //           margin-bottom: 0.5rem;
// // // // //         }
// // // // //         .cart-name {
// // // // //           font-size: 1.25rem;
// // // // //           font-weight: 700;
// // // // //           color: #111827;
// // // // //         }
// // // // //         .status-badge {
// // // // //           padding: 0.25rem 0.75rem;
// // // // //           border-radius: 9999px;
// // // // //           font-size: 0.75rem;
// // // // //           font-weight: 500;
// // // // //         }
// // // // //         .status-active {
// // // // //           background: #d1fae5;
// // // // //           color: #065f46;
// // // // //         }
// // // // //         .status-empty {
// // // // //           background: #f3f4f6;
// // // // //           color: #374151;
// // // // //         }
// // // // //         .cart-email, .cart-id, .cart-updated {
// // // // //           display: flex;
// // // // //           align-items: center;
// // // // //           gap: 0.5rem;
// // // // //           color: #6b7280;
// // // // //           font-size: 0.875rem;
// // // // //           margin-bottom: 0.25rem;
// // // // //         }
// // // // //         .cart-total {
// // // // //           text-align: right;
// // // // //         }
// // // // //         .cart-total-value {
// // // // //           font-size: 1.5rem;
// // // // //           font-weight: 700;
// // // // //           background: linear-gradient(to right, #4f46e5, #7c3aed);
// // // // //           -webkit-background-clip: text;
// // // // //           -webkit-text-fill-color: transparent;
// // // // //           background-clip: text;
// // // // //         }
// // // // //         .cart-items-count {
// // // // //           color: #6b7280;
// // // // //           font-size: 0.875rem;
// // // // //         }
// // // // //         .cart-items-section {
// // // // //           border-top: 1px solid #e5e7eb;
// // // // //           padding-top: 1rem;
// // // // //           margin-top: 1rem;
// // // // //         }
// // // // //         .cart-items-title {
// // // // //           font-weight: 600;
// // // // //           color: #374151;
// // // // //           margin-bottom: 0.75rem;
// // // // //           display: flex;
// // // // //           align-items: center;
// // // // //           gap: 0.5rem;
// // // // //         }
// // // // //         .cart-items-list {
// // // // //           display: flex;
// // // // //           flex-direction: column;
// // // // //           gap: 0.5rem;
// // // // //         }
// // // // //         .cart-item {
// // // // //           display: flex;
// // // // //           justify-content: space-between;
// // // // //           align-items: center;
// // // // //           background: linear-gradient(to right, #eef2ff, #faf5ff);
// // // // //           border-radius: 0.5rem;
// // // // //           padding: 0.75rem;
// // // // //           border: 1px solid #e0e7ff;
// // // // //         }
// // // // //         .cart-item-info {
// // // // //           display: flex;
// // // // //           align-items: center;
// // // // //           gap: 0.75rem;
// // // // //           flex: 1;
// // // // //         }
// // // // //         .cart-item-image {
// // // // //           width: 3rem;
// // // // //           height: 3rem;
// // // // //           object-fit: cover;
// // // // //           border-radius: 0.375rem;
// // // // //         }
// // // // //         .cart-item-name {
// // // // //           font-weight: 500;
// // // // //           color: #111827;
// // // // //         }
// // // // //         .cart-item-qty {
// // // // //           font-size: 0.875rem;
// // // // //           color: #6b7280;
// // // // //         }
// // // // //         .cart-item-price {
// // // // //           font-weight: 600;
// // // // //           color: #4f46e5;
// // // // //         }
// // // // //         .cart-actions {
// // // // //           display: flex;
// // // // //           gap: 0.5rem;
// // // // //           margin-top: 1rem;
// // // // //           padding-top: 1rem;
// // // // //           border-top: 1px solid #e5e7eb;
// // // // //         }
// // // // //         .action-btn {
// // // // //           flex: 1;
// // // // //           padding: 0.5rem 1rem;
// // // // //           border-radius: 0.5rem;
// // // // //           font-weight: 500;
// // // // //           border: none;
// // // // //           cursor: pointer;
// // // // //           display: flex;
// // // // //           align-items: center;
// // // // //           justify-content: center;
// // // // //           gap: 0.5rem;
// // // // //           transition: all 0.3s;
// // // // //         }
// // // // //         .view-btn {
// // // // //           background: linear-gradient(to right, #6366f1, #4f46e5);
// // // // //           color: white;
// // // // //         }
// // // // //         .view-btn:hover {
// // // // //           background: linear-gradient(to right, #4f46e5, #4338ca);
// // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // //         }
// // // // //         .delete-btn {
// // // // //           background: linear-gradient(to right, #ef4444, #dc2626);
// // // // //           color: white;
// // // // //           padding: 0.5rem 1rem;
// // // // //         }
// // // // //         .delete-btn:hover {
// // // // //           background: linear-gradient(to right, #dc2626, #b91c1c);
// // // // //           box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
// // // // //         }
// // // // //         .empty-state {
// // // // //           background: white;
// // // // //           border-radius: 0.75rem;
// // // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // // //           padding: 3rem;
// // // // //           text-align: center;
// // // // //         }
// // // // //         .empty-icon {
// // // // //           font-size: 3.75rem;
// // // // //           margin-bottom: 1rem;
// // // // //           display: block;
// // // // //         }
// // // // //         .empty-title {
// // // // //           font-size: 1.25rem;
// // // // //           font-weight: 600;
// // // // //           color: #374151;
// // // // //           margin-bottom: 0.5rem;
// // // // //         }
// // // // //         .empty-text {
// // // // //           color: #6b7280;
// // // // //         }
// // // // //         .alert {
// // // // //           margin-top: 1rem;
// // // // //           background: #fffbeb;
// // // // //           border-left: 4px solid #f59e0b;
// // // // //           border-radius: 0.5rem;
// // // // //           padding: 1rem;
// // // // //           max-width: 48rem;
// // // // //           margin-left: auto;
// // // // //           margin-right: auto;
// // // // //         }
// // // // //         .alert-content {
// // // // //           display: flex;
// // // // //         }
// // // // //         .alert-icon {
// // // // //           flex-shrink: 0;
// // // // //           width: 1.25rem;
// // // // //           height: 1.25rem;
// // // // //           color: #f59e0b;
// // // // //         }
// // // // //         .alert-text {
// // // // //           margin-left: 0.75rem;
// // // // //           color: #92400e;
// // // // //           font-size: 0.875rem;
// // // // //         }
// // // // //         svg {
// // // // //           width: 1.25rem;
// // // // //           height: 1.25rem;
// // // // //         }
// // // // //       `}</style>

// // // // //       <div className="page-container">
// // // // //         <div className="container">
// // // // //           {/* Header */}
// // // // //           <div className="header">
// // // // //             <h1 className="title">Cart Management</h1>
// // // // //             <p className="subtitle">Monitor and manage all user shopping carts</p>
// // // // //             {error && (
// // // // //               <div className="alert">
// // // // //                 <div className="alert-content">
// // // // //                   <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor">
// // // // //                     <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
// // // // //                   </svg>
// // // // //                   <p className="alert-text">⚠️ {error}</p>
// // // // //                 </div>
// // // // //               </div>
// // // // //             )}
// // // // //           </div>

// // // // //           {/* Statistics Cards */}
// // // // //           <div className="stats-grid">
// // // // //             <div className="stat-card">
// // // // //               <div className="stat-bar" style={{'--color-start': '#6366f1', '--color-end': '#4f46e5'}}></div>
// // // // //               <div className="stat-content">
// // // // //                 <div>
// // // // //                   <p className="stat-label">Total Carts</p>
// // // // //                   <p className="stat-value">{carts.length}</p>
// // // // //                 </div>
// // // // //                 <div className="stat-icon" style={{'--bg-color': '#e0e7ff'}}>🛒</div>
// // // // //               </div>
// // // // //             </div>

// // // // //             <div className="stat-card">
// // // // //               <div className="stat-bar" style={{'--color-start': '#10b981', '--color-end': '#059669'}}></div>
// // // // //               <div className="stat-content">
// // // // //                 <div>
// // // // //                   <p className="stat-label">Active Carts</p>
// // // // //                   <p className="stat-value" style={{color: '#059669'}}>{activeCarts}</p>
// // // // //                 </div>
// // // // //                 <div className="stat-icon" style={{'--bg-color': '#d1fae5'}}>✅</div>
// // // // //               </div>
// // // // //             </div>

// // // // //             <div className="stat-card">
// // // // //               <div className="stat-bar" style={{'--color-start': '#a855f7', '--color-end': '#9333ea'}}></div>
// // // // //               <div className="stat-content">
// // // // //                 <div>
// // // // //                   <p className="stat-label">Total Items</p>
// // // // //                   <p className="stat-value" style={{color: '#9333ea'}}>{totalItems}</p>
// // // // //                 </div>
// // // // //                 <div className="stat-icon" style={{'--bg-color': '#f3e8ff'}}>📦</div>
// // // // //               </div>
// // // // //             </div>

// // // // //             <div className="stat-card">
// // // // //               <div className="stat-bar" style={{'--color-start': '#3b82f6', '--color-end': '#2563eb'}}></div>
// // // // //               <div className="stat-content">
// // // // //                 <div>
// // // // //                   <p className="stat-label">Total Value</p>
// // // // //                   <p className="stat-value" style={{color: '#2563eb'}}>AED {totalValue.toLocaleString()}</p>
// // // // //                 </div>
// // // // //                 <div className="stat-icon" style={{'--bg-color': '#dbeafe'}}>💰</div>
// // // // //               </div>
// // // // //             </div>
// // // // //           </div>

// // // // //           {/* Filters and Search */}
// // // // //           <div className="filters-card">
// // // // //             <div className="filters-content">
// // // // //               <div className="filter-buttons">
// // // // //                 <button
// // // // //                   onClick={() => setFilterStatus('all')}
// // // // //                   className={`filter-btn ${filterStatus === 'all' ? 'filter-btn-all' : 'filter-btn-inactive'}`}
// // // // //                 >
// // // // //                   All Carts
// // // // //                 </button>
// // // // //                 <button
// // // // //                   onClick={() => setFilterStatus('active')}
// // // // //                   className={`filter-btn ${filterStatus === 'active' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
// // // // //                 >
// // // // //                   Active
// // // // //                 </button>
// // // // //                 <button
// // // // //                   onClick={() => setFilterStatus('empty')}
// // // // //                   className={`filter-btn ${filterStatus === 'empty' ? 'filter-btn-empty' : 'filter-btn-inactive'}`}
// // // // //                 >
// // // // //                   Empty
// // // // //                 </button>
// // // // //               </div>

// // // // //               <div className="search-export">
// // // // //                 <div className="search-container">
// // // // //                   <input
// // // // //                     type="text"
// // // // //                     placeholder="Search by name or email..."
// // // // //                     value={searchQuery}
// // // // //                     onChange={(e) => setSearchQuery(e.target.value)}
// // // // //                     className="search-input"
// // // // //                   />
// // // // //                   <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // //                     <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
// // // // //                   </svg>
// // // // //                 </div>
// // // // //                 <button onClick={exportToCSV} className="export-btn">
// // // // //                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // //                     <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
// // // // //                   </svg>
// // // // //                   Export CSV
// // // // //                 </button>
// // // // //               </div>
// // // // //             </div>
// // // // //           </div>

// // // // //           {/* Carts List */}
// // // // //           <div className="carts-list">
// // // // //             {filteredCarts.length === 0 ? (
// // // // //               <div className="empty-state">
// // // // //                 <span className="empty-icon">📭</span>
// // // // //                 <h3 className="empty-title">No carts found</h3>
// // // // //                 <p className="empty-text">Try adjusting your filters or search query</p>
// // // // //               </div>
// // // // //             ) : (
// // // // //               filteredCarts.map((cart) => (
// // // // //                 <div key={cart.userId} className="cart-card">
// // // // //                   <div className="cart-gradient-bar"></div>
// // // // //                   <div className="cart-content">
// // // // //                     <div className="cart-header">
// // // // //                       <div className="cart-user-info">
// // // // //                         <div className="cart-user-name">
// // // // //                           <h3 className="cart-name">{cart.userName}</h3>
// // // // //                           <span className={`status-badge ${cart.items.length > 0 ? 'status-active' : 'status-empty'}`}>
// // // // //                             {cart.items.length > 0 ? 'Active' : 'Empty'}
// // // // //                           </span>
// // // // //                         </div>
// // // // //                         <div className="cart-email">
// // // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // //                             <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
// // // // //                             <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
// // // // //                           </svg>
// // // // //                           <p>{cart.userEmail}</p>
// // // // //                         </div>
// // // // //                         <div className="cart-id">
// // // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // //                             <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
// // // // //                           </svg>
// // // // //                           <p>User ID: {cart.userId}</p>
// // // // //                         </div>
// // // // //                         <div className="cart-updated">
// // // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // //                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
// // // // //                           </svg>
// // // // //                           <p>Last updated: {new Date(cart.updatedAt).toLocaleString()}</p>
// // // // //                         </div>
// // // // //                       </div>
// // // // //                       <div className="cart-total">
// // // // //                         <p className="cart-total-value">AED {calculateTotal(cart.items).toLocaleString()}</p>
// // // // //                         <p className="cart-items-count">{cart.items.length} items</p>
// // // // //                       </div>
// // // // //                     </div>

// // // // //                     {cart.items.length > 0 && (
// // // // //                       <div className="cart-items-section">
// // // // //                         <h4 className="cart-items-title">
// // // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // //                             <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
// // // // //                           </svg>
// // // // //                           Cart Items:
// // // // //                         </h4>
// // // // //                         <div className="cart-items-list">
// // // // //                           {cart.items.map((item, index) => (
// // // // //                             <div key={index} className="cart-item">
// // // // //                               <div className="cart-item-info">
// // // // //                                 {item.image && (
// // // // //                                   <img 
// // // // //                                     src={item.image} 
// // // // //                                     alt={item.name}
// // // // //                                     className="cart-item-image"
// // // // //                                   />
// // // // //                                 )}
// // // // //                                 <div>
// // // // //                                   <p className="cart-item-name">{item.name}</p>
// // // // //                                   <p className="cart-item-qty">Qty: {item.quantity}</p>
// // // // //                                 </div>
// // // // //                               </div>
// // // // //                               <p className="cart-item-price">
// // // // //                                 AED {(item.price * item.quantity).toLocaleString()}
// // // // //                               </p>
// // // // //                             </div>
// // // // //                           ))}
// // // // //                         </div>
// // // // //                       </div>
// // // // //                     )}

// // // // //                     <div className="cart-actions">
// // // // //                       <button
// // // // //                         onClick={() => router.push(`/admin/users/${cart.userId}`)}
// // // // //                         className="action-btn view-btn"
// // // // //                       >
// // // // //                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // //                           <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
// // // // //                           <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
// // // // //                         </svg>
// // // // //                         View User
// // // // //                       </button>
// // // // //                       <button
// // // // //                         onClick={() => deleteCart(cart.userId)}
// // // // //                         className="action-btn delete-btn"
// // // // //                       >
// // // // //                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // // //                           <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
// // // // //                         </svg>
// // // // //                         Delete
// // // // //                       </button>
// // // // //                     </div>
// // // // //                   </div>
// // // // //                 </div>
// // // // //               ))
// // // // //             )}
// // // // //           </div>
// // // // //         </div>
// // // // //       </div>
// // // // //     </>
// // // // //   );
// // // // // }
// // // // 'use client';

// // // // import { useState, useEffect } from 'react';
// // // // import { useRouter } from 'next/navigation';
// // // // import { useAuth } from '@/contexts/AuthContext';

// // // // export default function AdminCartsPage() {
// // // //   const [carts, setCarts] = useState([]);
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [error, setError] = useState(null);
// // // //   const [filterStatus, setFilterStatus] = useState('all');
// // // //   const [searchQuery, setSearchQuery] = useState('');
// // // //   const [apiStatus, setApiStatus] = useState('');
// // // //   const router = useRouter();
// // // //   const { user, token, loading: authLoading } = useAuth();

// // // //   useEffect(() => {
// // // //     if (authLoading) return;
    
// // // //     if (!user) {
// // // //       router.push('/auth/admin/login');
// // // //       return;
// // // //     }

// // // //     if (user.role !== 'admin') {
// // // //       router.push('/unauthorized');
// // // //       return;
// // // //     }

// // // //     fetchAllCarts();
// // // //   }, [user, authLoading, router, token]);

// // // //   const fetchAllCarts = async () => {
// // // //     try {
// // // //       setLoading(true);
// // // //       setError(null);
// // // //       setApiStatus('Fetching carts data...');
      
// // // //       console.log('Fetching carts with token:', token ? 'Token exists' : 'No token');
      
// // // //       const response = await fetch('/api/admin/carts', {
// // // //         headers: {
// // // //           'Authorization': `Bearer ${token}`,
// // // //           'Content-Type': 'application/json'
// // // //         }
// // // //       });

// // // //       console.log('API Response status:', response.status);
// // // //       setApiStatus(`Response status: ${response.status}`);

// // // //       if (!response.ok) {
// // // //         if (response.status === 401) {
// // // //           setError('Authentication failed. Please login again.');
// // // //           setTimeout(() => router.push('/auth/admin/login'), 2000);
// // // //           return;
// // // //         }
        
// // // //         const errorData = await response.json().catch(() => ({ error: 'Failed to fetch carts' }));
// // // //         throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
// // // //       }

// // // //       const data = await response.json();
// // // //       console.log('Carts data received:', data);
      
// // // //       setCarts(data.carts || []);
// // // //       setApiStatus('Carts loaded successfully');
      
// // // //     } catch (err) {
// // // //       console.error('API Error:', err);
// // // //       const errorMessage = err.message || 'Failed to load carts. Please try again later.';
// // // //       setError(errorMessage);
// // // //       setApiStatus(`Error: ${errorMessage}`);
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   const calculateTotal = (items) => {
// // // //     if (!items || !Array.isArray(items)) return 0;
// // // //     return items.reduce((sum, item) => {
// // // //       const price = Number(item.price) || 0;
// // // //       const quantity = Number(item.quantity) || 0;
// // // //       return sum + (price * quantity);
// // // //     }, 0);
// // // //   };

// // // //   const deleteCart = async (userId) => {
// // // //     if (!confirm('Are you sure you want to delete this cart?')) return;

// // // //     // Optimistically update UI
// // // //     const originalCarts = [...carts];
// // // //     setCarts(carts.filter(cart => cart.userId !== userId));
    
// // // //     try {
// // // //       const response = await fetch(`/api/admin/carts?userId=${userId}`, {
// // // //         method: 'DELETE',
// // // //         headers: {
// // // //           'Authorization': `Bearer ${token}`,
// // // //           'Content-Type': 'application/json'
// // // //         }
// // // //       });
      
// // // //       if (!response.ok) {
// // // //         const errorData = await response.json();
// // // //         throw new Error(errorData.error || 'Failed to delete cart');
// // // //       }

// // // //       // Refresh the list to ensure consistency
// // // //       fetchAllCarts();
      
// // // //     } catch (err) {
// // // //       console.error('Delete error:', err);
// // // //       // Revert UI change on error
// // // //       setCarts(originalCarts);
// // // //       setError(err.message || 'Failed to delete cart. Please try again.');
// // // //     }
// // // //   };

// // // //   const exportToCSV = () => {
// // // //     const headers = ['User ID', 'User Name', 'Email', 'Items Count', 'Total Value', 'Last Updated'];
// // // //     const rows = filteredCarts.map(cart => [
// // // //       cart.userId || 'N/A',
// // // //       cart.userName || 'Unknown',
// // // //       cart.userEmail || 'N/A',
// // // //       cart.items?.length || 0,
// // // //       calculateTotal(cart.items),
// // // //       cart.updatedAt ? new Date(cart.updatedAt).toLocaleString() : 'N/A'
// // // //     ]);

// // // //     const csvContent = [
// // // //       headers.join(','),
// // // //       ...rows.map(row => row.map(field => `"${field}"`).join(','))
// // // //     ].join('\n');

// // // //     const blob = new Blob([csvContent], { type: 'text/csv' });
// // // //     const url = window.URL.createObjectURL(blob);
// // // //     const a = document.createElement('a');
// // // //     a.href = url;
// // // //     a.download = `carts_export_${new Date().toISOString().split('T')[0]}.csv`;
// // // //     document.body.appendChild(a);
// // // //     a.click();
// // // //     document.body.removeChild(a);
// // // //     window.URL.revokeObjectURL(url);
// // // //   };

// // // //   const filteredCarts = carts.filter(cart => {
// // // //     const userName = cart.userName || '';
// // // //     const userEmail = cart.userEmail || '';
    
// // // //     const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
// // // //                          userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
// // // //     if (filterStatus === 'empty') return (!cart.items || cart.items.length === 0) && matchesSearch;
// // // //     if (filterStatus === 'active') return cart.items && cart.items.length > 0 && matchesSearch;
// // // //     return matchesSearch;
// // // //   });

// // // //   const totalItems = carts.reduce((sum, cart) => sum + (cart.items?.length || 0), 0);
// // // //   const totalValue = carts.reduce((sum, cart) => sum + calculateTotal(cart.items), 0);
// // // //   const activeCarts = carts.filter(cart => cart.items && cart.items.length > 0).length;

// // // //   // Show loading state
// // // //   if (authLoading || loading) {
// // // //     return (
// // // //       <div style={{
// // // //         display: 'flex',
// // // //         alignItems: 'center',
// // // //         justifyContent: 'center',
// // // //         minHeight: '100vh',
// // // //         background: 'linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff)'
// // // //       }}>
// // // //         <div style={{ textAlign: 'center' }}>
// // // //           <div style={{ position: 'relative', margin: '0 auto 1rem', width: '64px', height: '64px' }}>
// // // //             <div style={{
// // // //               animation: 'spin 1s linear infinite',
// // // //               borderRadius: '9999px',
// // // //               height: '64px',
// // // //               width: '64px',
// // // //               borderTop: '4px solid #4f46e5',
// // // //               borderBottom: '4px solid #4f46e5'
// // // //             }}></div>
// // // //           </div>
// // // //           <p style={{ color: '#4b5563', fontSize: '1.125rem', fontWeight: '500' }}>Loading carts data...</p>
// // // //           {apiStatus && (
// // // //             <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
// // // //               {apiStatus}
// // // //             </p>
// // // //           )}
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   if (!user) {
// // // //     return null; // Will redirect in useEffect
// // // //   }

// // // //   return (
// // // //     <>
// // // //       <style jsx>{`
// // // //         @keyframes spin {
// // // //           from { transform: rotate(0deg); }
// // // //           to { transform: rotate(360deg); }
// // // //         }
// // // //         @keyframes fadeIn {
// // // //           from { opacity: 0; transform: translateY(20px); }
// // // //           to { opacity: 1; transform: translateY(0); }
// // // //         }
// // // //         .page-container {
// // // //           min-height: 100vh;
// // // //           background: linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff);
// // // //           padding: 2rem 1rem;
// // // //           animation: fadeIn 0.6s ease-out;
// // // //         }
// // // //         .container {
// // // //           max-width: 1280px;
// // // //           margin: 0 auto;
// // // //         }
// // // //         .header {
// // // //           margin-bottom: 2rem;
// // // //           text-align: center;
// // // //         }
// // // //         .title {
// // // //           font-size: 2.25rem;
// // // //           font-weight: 700;
// // // //           background: linear-gradient(to right, #4f46e5, #7c3aed);
// // // //           -webkit-background-clip: text;
// // // //           -webkit-text-fill-color: transparent;
// // // //           background-clip: text;
// // // //           margin-bottom: 0.5rem;
// // // //         }
// // // //         .subtitle {
// // // //           color: #4b5563;
// // // //           font-size: 1.125rem;
// // // //         }
// // // //         .stats-grid {
// // // //           display: grid;
// // // //           grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
// // // //           gap: 1.5rem;
// // // //           margin-bottom: 2rem;
// // // //         }
// // // //         .stat-card {
// // // //           background: white;
// // // //           border-radius: 0.75rem;
// // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // //           overflow: hidden;
// // // //           transition: all 0.3s;
// // // //         }
// // // //         .stat-card:hover {
// // // //           transform: scale(1.05);
// // // //           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
// // // //         }
// // // //         .stat-bar {
// // // //           height: 1rem;
// // // //           background: linear-gradient(to right, var(--color-start), var(--color-end));
// // // //         }
// // // //         .stat-content {
// // // //           padding: 1.5rem;
// // // //           display: flex;
// // // //           align-items: center;
// // // //           justify-content: space-between;
// // // //         }
// // // //         .stat-icon {
// // // //           background: var(--bg-color);
// // // //           border-radius: 9999px;
// // // //           padding: 0.75rem;
// // // //           font-size: 1.5rem;
// // // //         }
// // // //         .stat-label {
// // // //           color: #6b7280;
// // // //           font-size: 0.875rem;
// // // //           font-weight: 500;
// // // //         }
// // // //         .stat-value {
// // // //           font-size: 1.875rem;
// // // //           font-weight: 700;
// // // //           color: #111827;
// // // //         }
// // // //         .filters-card {
// // // //           background: white;
// // // //           border-radius: 0.75rem;
// // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // //           padding: 1.5rem;
// // // //           margin-bottom: 1.5rem;
// // // //         }
// // // //         .filters-content {
// // // //           display: flex;
// // // //           flex-direction: column;
// // // //           gap: 1rem;
// // // //         }
// // // //         @media (min-width: 768px) {
// // // //           .filters-content {
// // // //             flex-direction: row;
// // // //             justify-content: space-between;
// // // //             align-items: center;
// // // //           }
// // // //         }
// // // //         .filter-buttons {
// // // //           display: flex;
// // // //           gap: 0.5rem;
// // // //           flex-wrap: wrap;
// // // //         }
// // // //         .filter-btn {
// // // //           padding: 0.5rem 1rem;
// // // //           border-radius: 0.5rem;
// // // //           font-weight: 500;
// // // //           transition: all 0.3s;
// // // //           cursor: pointer;
// // // //           border: none;
// // // //         }
// // // //         .filter-btn-inactive {
// // // //           background: #f3f4f6;
// // // //           color: #374151;
// // // //         }
// // // //         .filter-btn-inactive:hover {
// // // //           background: #e5e7eb;
// // // //         }
// // // //         .filter-btn-all {
// // // //           background: linear-gradient(to right, #6366f1, #a855f7);
// // // //           color: white;
// // // //           box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
// // // //         }
// // // //         .filter-btn-active {
// // // //           background: linear-gradient(to right, #10b981, #059669);
// // // //           color: white;
// // // //           box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
// // // //         }
// // // //         .filter-btn-empty {
// // // //           background: linear-gradient(to right, #6b7280, #4b5563);
// // // //           color: white;
// // // //           box-shadow: 0 4px 6px -1px rgba(107, 114, 128, 0.3);
// // // //         }
// // // //         .search-export {
// // // //           display: flex;
// // // //           gap: 0.5rem;
// // // //           width: 100%;
// // // //         }
// // // //         @media (min-width: 768px) {
// // // //           .search-export {
// // // //             width: auto;
// // // //           }
// // // //         }
// // // //         .search-container {
// // // //           position: relative;
// // // //         }
// // // //         .search-input {
// // // //           padding: 0.5rem 1rem 0.5rem 2.5rem;
// // // //           border: 1px solid #d1d5db;
// // // //           border-radius: 0.5rem;
// // // //           width: 100%;
// // // //           outline: none;
// // // //           transition: all 0.3s;
// // // //         }
// // // //         .search-input:focus {
// // // //           border-color: #6366f1;
// // // //           box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
// // // //         }
// // // //         .search-icon {
// // // //           position: absolute;
// // // //           left: 0.75rem;
// // // //           top: 50%;
// // // //           transform: translateY(-50%);
// // // //           color: #9ca3af;
// // // //           width: 1.25rem;
// // // //           height: 1.25rem;
// // // //         }
// // // //         .export-btn {
// // // //           background: linear-gradient(to right, #6366f1, #a855f7);
// // // //           color: white;
// // // //           padding: 0.5rem 1rem;
// // // //           border-radius: 0.5rem;
// // // //           font-weight: 500;
// // // //           border: none;
// // // //           cursor: pointer;
// // // //           display: flex;
// // // //           align-items: center;
// // // //           gap: 0.5rem;
// // // //           transition: all 0.3s;
// // // //         }
// // // //         .export-btn:hover {
// // // //           background: linear-gradient(to right, #4f46e5, #9333ea);
// // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // //         }
// // // //         .carts-list {
// // // //           display: flex;
// // // //           flex-direction: column;
// // // //           gap: 1rem;
// // // //         }
// // // //         .cart-card {
// // // //           background: white;
// // // //           border-radius: 0.75rem;
// // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // //           overflow: hidden;
// // // //           transition: all 0.3s;
// // // //         }
// // // //         .cart-card:hover {
// // // //           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
// // // //           transform: translateY(-4px);
// // // //         }
// // // //         .cart-gradient-bar {
// // // //           height: 0.5rem;
// // // //           background: linear-gradient(to right, #6366f1, #a855f7, #3b82f6);
// // // //         }
// // // //         .cart-content {
// // // //           padding: 1.5rem;
// // // //         }
// // // //         .cart-header {
// // // //           display: flex;
// // // //           justify-content: space-between;
// // // //           align-items: start;
// // // //           margin-bottom: 1rem;
// // // //           flex-wrap: wrap;
// // // //           gap: 1rem;
// // // //         }
// // // //         .cart-user-info {
// // // //           flex: 1;
// // // //         }
// // // //         .cart-user-name {
// // // //           display: flex;
// // // //           align-items: center;
// // // //           gap: 0.75rem;
// // // //           margin-bottom: 0.5rem;
// // // //         }
// // // //         .cart-name {
// // // //           font-size: 1.25rem;
// // // //           font-weight: 700;
// // // //           color: #111827;
// // // //         }
// // // //         .status-badge {
// // // //           padding: 0.25rem 0.75rem;
// // // //           border-radius: 9999px;
// // // //           font-size: 0.75rem;
// // // //           font-weight: 500;
// // // //         }
// // // //         .status-active {
// // // //           background: #d1fae5;
// // // //           color: #065f46;
// // // //         }
// // // //         .status-empty {
// // // //           background: #f3f4f6;
// // // //           color: #374151;
// // // //         }
// // // //         .cart-email, .cart-id, .cart-updated {
// // // //           display: flex;
// // // //           align-items: center;
// // // //           gap: 0.5rem;
// // // //           color: #6b7280;
// // // //           font-size: 0.875rem;
// // // //           margin-bottom: 0.25rem;
// // // //         }
// // // //         .cart-total {
// // // //           text-align: right;
// // // //         }
// // // //         .cart-total-value {
// // // //           font-size: 1.5rem;
// // // //           font-weight: 700;
// // // //           background: linear-gradient(to right, #4f46e5, #7c3aed);
// // // //           -webkit-background-clip: text;
// // // //           -webkit-text-fill-color: transparent;
// // // //           background-clip: text;
// // // //         }
// // // //         .cart-items-count {
// // // //           color: #6b7280;
// // // //           font-size: 0.875rem;
// // // //         }
// // // //         .cart-items-section {
// // // //           border-top: 1px solid #e5e7eb;
// // // //           padding-top: 1rem;
// // // //           margin-top: 1rem;
// // // //         }
// // // //         .cart-items-title {
// // // //           font-weight: 600;
// // // //           color: #374151;
// // // //           margin-bottom: 0.75rem;
// // // //           display: flex;
// // // //           align-items: center;
// // // //           gap: 0.5rem;
// // // //         }
// // // //         .cart-items-list {
// // // //           display: flex;
// // // //           flex-direction: column;
// // // //           gap: 0.5rem;
// // // //         }
// // // //         .cart-item {
// // // //           display: flex;
// // // //           justify-content: space-between;
// // // //           align-items: center;
// // // //           background: linear-gradient(to right, #eef2ff, #faf5ff);
// // // //           border-radius: 0.5rem;
// // // //           padding: 0.75rem;
// // // //           border: 1px solid #e0e7ff;
// // // //         }
// // // //         .cart-item-info {
// // // //           display: flex;
// // // //           align-items: center;
// // // //           gap: 0.75rem;
// // // //           flex: 1;
// // // //         }
// // // //         .cart-item-image {
// // // //           width: 3rem;
// // // //           height: 3rem;
// // // //           object-fit: cover;
// // // //           border-radius: 0.375rem;
// // // //         }
// // // //         .cart-item-name {
// // // //           font-weight: 500;
// // // //           color: #111827;
// // // //         }
// // // //         .cart-item-qty {
// // // //           font-size: 0.875rem;
// // // //           color: #6b7280;
// // // //         }
// // // //         .cart-item-price {
// // // //           font-weight: 600;
// // // //           color: #4f46e5;
// // // //         }
// // // //         .cart-actions {
// // // //           display: flex;
// // // //           gap: 0.5rem;
// // // //           margin-top: 1rem;
// // // //           padding-top: 1rem;
// // // //           border-top: 1px solid #e5e7eb;
// // // //         }
// // // //         .action-btn {
// // // //           flex: 1;
// // // //           padding: 0.5rem 1rem;
// // // //           border-radius: 0.5rem;
// // // //           font-weight: 500;
// // // //           border: none;
// // // //           cursor: pointer;
// // // //           display: flex;
// // // //           align-items: center;
// // // //           justify-content: center;
// // // //           gap: 0.5rem;
// // // //           transition: all 0.3s;
// // // //         }
// // // //         .view-btn {
// // // //           background: linear-gradient(to right, #6366f1, #4f46e5);
// // // //           color: white;
// // // //         }
// // // //         .view-btn:hover {
// // // //           background: linear-gradient(to right, #4f46e5, #4338ca);
// // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // //         }
// // // //         .delete-btn {
// // // //           background: linear-gradient(to right, #ef4444, #dc2626);
// // // //           color: white;
// // // //           padding: 0.5rem 1rem;
// // // //         }
// // // //         .delete-btn:hover {
// // // //           background: linear-gradient(to right, #dc2626, #b91c1c);
// // // //           box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
// // // //         }
// // // //         .empty-state {
// // // //           background: white;
// // // //           border-radius: 0.75rem;
// // // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // // //           padding: 3rem;
// // // //           text-align: center;
// // // //         }
// // // //         .empty-icon {
// // // //           font-size: 3.75rem;
// // // //           margin-bottom: 1rem;
// // // //           display: block;
// // // //         }
// // // //         .empty-title {
// // // //           font-size: 1.25rem;
// // // //           font-weight: 600;
// // // //           color: #374151;
// // // //           margin-bottom: 0.5rem;
// // // //         }
// // // //         .empty-text {
// // // //           color: #6b7280;
// // // //         }
// // // //         .alert {
// // // //           margin-top: 1rem;
// // // //           background: #fffbeb;
// // // //           border-left: 4px solid #f59e0b;
// // // //           border-radius: 0.5rem;
// // // //           padding: 1rem;
// // // //           max-width: 48rem;
// // // //           margin-left: auto;
// // // //           margin-right: auto;
// // // //         }
// // // //         .alert-content {
// // // //           display: flex;
// // // //         }
// // // //         .alert-icon {
// // // //           flex-shrink: 0;
// // // //           width: 1.25rem;
// // // //           height: 1.25rem;
// // // //           color: #f59e0b;
// // // //         }
// // // //         .alert-text {
// // // //           margin-left: 0.75rem;
// // // //           color: #92400e;
// // // //           font-size: 0.875rem;
// // // //         }
// // // //         .debug-info {
// // // //           background: #f0f9ff;
// // // //           border: 1px solid #bae6fd;
// // // //           color: #0369a1;
// // // //           padding: 0.75rem;
// // // //           border-radius: 0.5rem;
// // // //           margin-bottom: 1rem;
// // // //           font-size: 0.875rem;
// // // //         }
// // // //         svg {
// // // //           width: 1.25rem;
// // // //           height: 1.25rem;
// // // //         }
// // // //       `}</style>

// // // //       <div className="page-container">
// // // //         <div className="container">
// // // //           {/* Header */}
// // // //           <div className="header">
// // // //             <h1 className="title">Cart Management</h1>
// // // //             <p className="subtitle">Monitor and manage all user shopping carts</p>
            
// // // //             {/* Debug Info - Remove in production */}
// // // //             {process.env.NODE_ENV === 'development' && apiStatus && (
// // // //               <div className="debug-info">
// // // //                 Debug: {apiStatus}
// // // //               </div>
// // // //             )}

// // // //             {error && (
// // // //               <div className="alert">
// // // //                 <div className="alert-content">
// // // //                   <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor">
// // // //                     <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
// // // //                   </svg>
// // // //                   <p className="alert-text">⚠️ {error}</p>
// // // //                 </div>
// // // //               </div>
// // // //             )}
// // // //           </div>

// // // //           {/* Statistics Cards */}
// // // //           <div className="stats-grid">
// // // //             <div className="stat-card">
// // // //               <div className="stat-bar" style={{'--color-start': '#6366f1', '--color-end': '#4f46e5'}}></div>
// // // //               <div className="stat-content">
// // // //                 <div>
// // // //                   <p className="stat-label">Total Carts</p>
// // // //                   <p className="stat-value">{carts.length}</p>
// // // //                 </div>
// // // //                 <div className="stat-icon" style={{'--bg-color': '#e0e7ff'}}>🛒</div>
// // // //               </div>
// // // //             </div>

// // // //             <div className="stat-card">
// // // //               <div className="stat-bar" style={{'--color-start': '#10b981', '--color-end': '#059669'}}></div>
// // // //               <div className="stat-content">
// // // //                 <div>
// // // //                   <p className="stat-label">Active Carts</p>
// // // //                   <p className="stat-value" style={{color: '#059669'}}>{activeCarts}</p>
// // // //                 </div>
// // // //                 <div className="stat-icon" style={{'--bg-color': '#d1fae5'}}>✅</div>
// // // //               </div>
// // // //             </div>

// // // //             <div className="stat-card">
// // // //               <div className="stat-bar" style={{'--color-start': '#a855f7', '--color-end': '#9333ea'}}></div>
// // // //               <div className="stat-content">
// // // //                 <div>
// // // //                   <p className="stat-label">Total Items</p>
// // // //                   <p className="stat-value" style={{color: '#9333ea'}}>{totalItems}</p>
// // // //                 </div>
// // // //                 <div className="stat-icon" style={{'--bg-color': '#f3e8ff'}}>📦</div>
// // // //               </div>
// // // //             </div>

// // // //             <div className="stat-card">
// // // //               <div className="stat-bar" style={{'--color-start': '#3b82f6', '--color-end': '#2563eb'}}></div>
// // // //               <div className="stat-content">
// // // //                 <div>
// // // //                   <p className="stat-label">Total Value</p>
// // // //                   <p className="stat-value" style={{color: '#2563eb'}}>AED {totalValue.toLocaleString()}</p>
// // // //                 </div>
// // // //                 <div className="stat-icon" style={{'--bg-color': '#dbeafe'}}>💰</div>
// // // //               </div>
// // // //             </div>
// // // //           </div>

// // // //           {/* Filters and Search */}
// // // //           <div className="filters-card">
// // // //             <div className="filters-content">
// // // //               <div className="filter-buttons">
// // // //                 <button
// // // //                   onClick={() => setFilterStatus('all')}
// // // //                   className={`filter-btn ${filterStatus === 'all' ? 'filter-btn-all' : 'filter-btn-inactive'}`}
// // // //                 >
// // // //                   All Carts
// // // //                 </button>
// // // //                 <button
// // // //                   onClick={() => setFilterStatus('active')}
// // // //                   className={`filter-btn ${filterStatus === 'active' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
// // // //                 >
// // // //                   Active
// // // //                 </button>
// // // //                 <button
// // // //                   onClick={() => setFilterStatus('empty')}
// // // //                   className={`filter-btn ${filterStatus === 'empty' ? 'filter-btn-empty' : 'filter-btn-inactive'}`}
// // // //                 >
// // // //                   Empty
// // // //                 </button>
// // // //               </div>

// // // //               <div className="search-export">
// // // //                 <div className="search-container">
// // // //                   <input
// // // //                     type="text"
// // // //                     placeholder="Search by name or email..."
// // // //                     value={searchQuery}
// // // //                     onChange={(e) => setSearchQuery(e.target.value)}
// // // //                     className="search-input"
// // // //                   />
// // // //                   <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // //                     <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
// // // //                   </svg>
// // // //                 </div>
// // // //                 <button onClick={exportToCSV} className="export-btn">
// // // //                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // //                     <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
// // // //                   </svg>
// // // //                   Export CSV
// // // //                 </button>
// // // //                 <button 
// // // //                   onClick={fetchAllCarts}
// // // //                   className="export-btn"
// // // //                   style={{background: 'linear-gradient(to right, #10b981, #059669)'}}
// // // //                 >
// // // //                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // //                     <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
// // // //                   </svg>
// // // //                   Refresh
// // // //                 </button>
// // // //               </div>
// // // //             </div>
// // // //           </div>

// // // //           {/* Carts List */}
// // // //           <div className="carts-list">
// // // //             {filteredCarts.length === 0 ? (
// // // //               <div className="empty-state">
// // // //                 <span className="empty-icon">📭</span>
// // // //                 <h3 className="empty-title">
// // // //                   {carts.length === 0 ? 'No carts found' : 'No carts match your filters'}
// // // //                 </h3>
// // // //                 <p className="empty-text">
// // // //                   {carts.length === 0 
// // // //                     ? 'There are no shopping carts in the system yet.' 
// // // //                     : 'Try adjusting your filters or search query'}
// // // //                 </p>
// // // //                 <button 
// // // //                   onClick={fetchAllCarts}
// // // //                   className="export-btn"
// // // //                   style={{marginTop: '1rem'}}
// // // //                 >
// // // //                   Refresh Data
// // // //                 </button>
// // // //               </div>
// // // //             ) : (
// // // //               filteredCarts.map((cart) => (
// // // //                 <div key={cart.userId} className="cart-card">
// // // //                   <div className="cart-gradient-bar"></div>
// // // //                   <div className="cart-content">
// // // //                     <div className="cart-header">
// // // //                       <div className="cart-user-info">
// // // //                         <div className="cart-user-name">
// // // //                           <h3 className="cart-name">{cart.userName || 'Unknown User'}</h3>
// // // //                           <span className={`status-badge ${cart.items && cart.items.length > 0 ? 'status-active' : 'status-empty'}`}>
// // // //                             {cart.items && cart.items.length > 0 ? 'Active' : 'Empty'}
// // // //                           </span>
// // // //                         </div>
// // // //                         <div className="cart-email">
// // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // //                             <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
// // // //                             <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
// // // //                           </svg>
// // // //                           <p>{cart.userEmail || 'No email'}</p>
// // // //                         </div>
// // // //                         <div className="cart-id">
// // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // //                             <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
// // // //                           </svg>
// // // //                           <p>User ID: {cart.userId || 'N/A'}</p>
// // // //                         </div>
// // // //                         <div className="cart-updated">
// // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // //                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
// // // //                           </svg>
// // // //                           <p>Last updated: {cart.updatedAt ? new Date(cart.updatedAt).toLocaleString() : 'N/A'}</p>
// // // //                         </div>
// // // //                       </div>
// // // //                       <div className="cart-total">
// // // //                         <p className="cart-total-value">AED {calculateTotal(cart.items).toLocaleString()}</p>
// // // //                         <p className="cart-items-count">{cart.items?.length || 0} items</p>
// // // //                       </div>
// // // //                     </div>

// // // //                     {cart.items && cart.items.length > 0 && (
// // // //                       <div className="cart-items-section">
// // // //                         <h4 className="cart-items-title">
// // // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // //                             <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
// // // //                           </svg>
// // // //                           Cart Items:
// // // //                         </h4>
// // // //                         <div className="cart-items-list">
// // // //                           {cart.items.map((item, index) => (
// // // //                             <div key={index} className="cart-item">
// // // //                               <div className="cart-item-info">
// // // //                                 {item.image && (
// // // //                                   <img 
// // // //                                     src={item.image} 
// // // //                                     alt={item.name}
// // // //                                     className="cart-item-image"
// // // //                                     onError={(e) => {
// // // //                                       e.target.style.display = 'none';
// // // //                                     }}
// // // //                                   />
// // // //                                 )}
// // // //                                 <div>
// // // //                                   <p className="cart-item-name">{item.name || 'Unknown Product'}</p>
// // // //                                   <p className="cart-item-qty">Qty: {item.quantity || 0}</p>
// // // //                                 </div>
// // // //                               </div>
// // // //                               <p className="cart-item-price">
// // // //                                 AED {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
// // // //                               </p>
// // // //                             </div>
// // // //                           ))}
// // // //                         </div>
// // // //                       </div>
// // // //                     )}

// // // //                     <div className="cart-actions">
// // // //                       <button
// // // //                         onClick={() => router.push(`/admin/users/${cart.userId}`)}
// // // //                         className="action-btn view-btn"
// // // //                       >
// // // //                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // //                           <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
// // // //                           <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
// // // //                         </svg>
// // // //                         View User
// // // //                       </button>
// // // //                       <button
// // // //                         onClick={() => deleteCart(cart.userId)}
// // // //                         className="action-btn delete-btn"
// // // //                       >
// // // //                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // // //                           <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
// // // //                         </svg>
// // // //                         Delete
// // // //                       </button>
// // // //                     </div>
// // // //                   </div>
// // // //                 </div>
// // // //               ))
// // // //             )}
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     </>
// // // //   );
// // // // }
// // // 'use client';

// // // import { useState, useEffect } from 'react';
// // // import { useRouter } from 'next/navigation';
// // // import { useAuth } from '@/contexts/AuthContext';
// // // import ClientLayout from '@/app/ClientLayout';

// // // export default function AdminCartsPage() {
// // //   const [carts, setCarts] = useState([]);
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState('');
// // //   const [filterStatus, setFilterStatus] = useState('all');
// // //   const [searchQuery, setSearchQuery] = useState('');
// // //   const [apiStatus, setApiStatus] = useState('');
// // //   const { user, token, loading: authLoading } = useAuth();
// // //   const router = useRouter();

// // //   useEffect(() => {
// // //     if (!authLoading && !user) {
// // //       router.push('/auth/admin/login');
// // //       return;
// // //     }

// // //     if (!authLoading && user && user.role !== 'admin') {
// // //       router.push('/unauthorized');
// // //       return;
// // //     }

// // //     if (user && user.role === 'admin') {
// // //       fetchAllCarts();
// // //     }
// // //   }, [user, authLoading, router]);

// // //   const fetchAllCarts = async () => {
// // //     try {
// // //       setLoading(true);
// // //       setError('');
// // //       setApiStatus('Fetching carts data...');

// // //       const response = await fetch('/api/admin/carts', {
// // //         headers: {
// // //           'Authorization': `Bearer ${token}`,
// // //           'Content-Type': 'application/json'
// // //         }
// // //       });

// // //       setApiStatus(`Response status: ${response.status}`);

// // //       if (!response.ok) {
// // //         if (response.status === 401) {
// // //           setError('Authentication failed. Please login again.');
// // //           setTimeout(() => router.push('/auth/admin/login'), 2000);
// // //           return;
// // //         }
        
// // //         const errorData = await response.json().catch(() => ({ error: 'Failed to fetch carts' }));
// // //         throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
// // //       }

// // //       const data = await response.json();
// // //       setCarts(data.carts || []);
// // //       setApiStatus('Carts loaded successfully');
      
// // //     } catch (err) {
// // //       console.error('API Error:', err);
// // //       const errorMessage = err.message || 'Failed to load carts. Please try again later.';
// // //       setError(errorMessage);
// // //       setApiStatus(`Error: ${errorMessage}`);
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const calculateTotal = (items) => {
// // //     if (!items || !Array.isArray(items)) return 0;
// // //     return items.reduce((sum, item) => {
// // //       const price = Number(item.price) || 0;
// // //       const quantity = Number(item.quantity) || 0;
// // //       return sum + (price * quantity);
// // //     }, 0);
// // //   };

// // //   const deleteCart = async (userId) => {
// // //     if (!confirm('Are you sure you want to delete this cart?')) return;

// // //     // Optimistically update UI
// // //     const originalCarts = [...carts];
// // //     setCarts(carts.filter(cart => cart.userId !== userId));
    
// // //     try {
// // //       const response = await fetch(`/api/admin/carts?userId=${userId}`, {
// // //         method: 'DELETE',
// // //         headers: {
// // //           'Authorization': `Bearer ${token}`,
// // //           'Content-Type': 'application/json'
// // //         }
// // //       });
      
// // //       if (!response.ok) {
// // //         const errorData = await response.json();
// // //         throw new Error(errorData.error || 'Failed to delete cart');
// // //       }

// // //       // Refresh the list to ensure consistency
// // //       fetchAllCarts();
      
// // //     } catch (err) {
// // //       console.error('Delete error:', err);
// // //       // Revert UI change on error
// // //       setCarts(originalCarts);
// // //       setError(err.message || 'Failed to delete cart. Please try again.');
// // //     }
// // //   };

// // //   const exportToCSV = () => {
// // //     const headers = ['User ID', 'User Name', 'Email', 'Items Count', 'Total Value', 'Last Updated'];
// // //     const rows = filteredCarts.map(cart => [
// // //       cart.userId || 'N/A',
// // //       cart.userName || 'Unknown',
// // //       cart.userEmail || 'N/A',
// // //       cart.items?.length || 0,
// // //       calculateTotal(cart.items),
// // //       cart.updatedAt ? new Date(cart.updatedAt).toLocaleString() : 'N/A'
// // //     ]);

// // //     const csvContent = [
// // //       headers.join(','),
// // //       ...rows.map(row => row.map(field => `"${field}"`).join(','))
// // //     ].join('\n');

// // //     const blob = new Blob([csvContent], { type: 'text/csv' });
// // //     const url = window.URL.createObjectURL(blob);
// // //     const a = document.createElement('a');
// // //     a.href = url;
// // //     a.download = `carts_export_${new Date().toISOString().split('T')[0]}.csv`;
// // //     document.body.appendChild(a);
// // //     a.click();
// // //     document.body.removeChild(a);
// // //     window.URL.revokeObjectURL(url);
// // //   };

// // //   const filteredCarts = carts.filter(cart => {
// // //     const userName = cart.userName || '';
// // //     const userEmail = cart.userEmail || '';
    
// // //     const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
// // //                          userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
// // //     if (filterStatus === 'empty') return (!cart.items || cart.items.length === 0) && matchesSearch;
// // //     if (filterStatus === 'active') return cart.items && cart.items.length > 0 && matchesSearch;
// // //     return matchesSearch;
// // //   });

// // //   const totalItems = carts.reduce((sum, cart) => sum + (cart.items?.length || 0), 0);
// // //   const totalValue = carts.reduce((sum, cart) => sum + calculateTotal(cart.items), 0);
// // //   const activeCarts = carts.filter(cart => cart.items && cart.items.length > 0).length;

// // //   if (authLoading) {
// // //     return (
// // //       <ClientLayout>
// // //         <div style={{ 
// // //           minHeight: '80vh', 
// // //           display: 'flex', 
// // //           alignItems: 'center', 
// // //           justifyContent: 'center',
// // //           background: 'linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff)'
// // //         }}>
// // //           <div style={{ textAlign: 'center' }}>
// // //             <div style={{ 
// // //               position: 'relative', 
// // //               margin: '0 auto 1rem', 
// // //               width: '64px', 
// // //               height: '64px' 
// // //             }}>
// // //               <div style={{
// // //                 animation: 'spin 1s linear infinite',
// // //                 borderRadius: '9999px',
// // //                 height: '64px',
// // //                 width: '64px',
// // //                 borderTop: '4px solid #4f46e5',
// // //                 borderBottom: '4px solid #4f46e5'
// // //               }}></div>
// // //             </div>
// // //             <p style={{ color: '#4b5563', fontSize: '1.125rem', fontWeight: '500' }}>Loading carts data...</p>
// // //           </div>
// // //         </div>
// // //       </ClientLayout>
// // //     );
// // //   }

// // //   if (!user || user.role !== 'admin') {
// // //     return null;
// // //   }

// // //   return (
// // //     <ClientLayout>
// // //       <div className="page-container">
// // //         <div className="container">
// // //           {/* Header */}
// // //           <div className="header">
// // //             <h1 className="title">Cart Management</h1>
// // //             <p className="subtitle">Monitor and manage all user shopping carts</p>
            
// // //             {/* Debug Info - Remove in production */}
// // //             {process.env.NODE_ENV === 'development' && apiStatus && (
// // //               <div className="debug-info">
// // //                 Debug: {apiStatus}
// // //               </div>
// // //             )}

// // //             {error && (
// // //               <div className="alert">
// // //                 <div className="alert-content">
// // //                   <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor">
// // //                     <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
// // //                   </svg>
// // //                   <p className="alert-text">⚠️ {error}</p>
// // //                 </div>
// // //               </div>
// // //             )}
// // //           </div>

// // //           {/* Statistics Cards */}
// // //           <div className="stats-grid">
// // //             <div className="stat-card">
// // //               <div className="stat-bar" style={{'--color-start': '#6366f1', '--color-end': '#4f46e5'}}></div>
// // //               <div className="stat-content">
// // //                 <div>
// // //                   <p className="stat-label">Total Carts</p>
// // //                   <p className="stat-value">{carts.length}</p>
// // //                 </div>
// // //                 <div className="stat-icon" style={{'--bg-color': '#e0e7ff'}}>🛒</div>
// // //               </div>
// // //             </div>

// // //             <div className="stat-card">
// // //               <div className="stat-bar" style={{'--color-start': '#10b981', '--color-end': '#059669'}}></div>
// // //               <div className="stat-content">
// // //                 <div>
// // //                   <p className="stat-label">Active Carts</p>
// // //                   <p className="stat-value" style={{color: '#059669'}}>{activeCarts}</p>
// // //                 </div>
// // //                 <div className="stat-icon" style={{'--bg-color': '#d1fae5'}}>✅</div>
// // //               </div>
// // //             </div>

// // //             <div className="stat-card">
// // //               <div className="stat-bar" style={{'--color-start': '#a855f7', '--color-end': '#9333ea'}}></div>
// // //               <div className="stat-content">
// // //                 <div>
// // //                   <p className="stat-label">Total Items</p>
// // //                   <p className="stat-value" style={{color: '#9333ea'}}>{totalItems}</p>
// // //                 </div>
// // //                 <div className="stat-icon" style={{'--bg-color': '#f3e8ff'}}>📦</div>
// // //               </div>
// // //             </div>

// // //             <div className="stat-card">
// // //               <div className="stat-bar" style={{'--color-start': '#3b82f6', '--color-end': '#2563eb'}}></div>
// // //               <div className="stat-content">
// // //                 <div>
// // //                   <p className="stat-label">Total Value</p>
// // //                   <p className="stat-value" style={{color: '#2563eb'}}>AED {totalValue.toLocaleString()}</p>
// // //                 </div>
// // //                 <div className="stat-icon" style={{'--bg-color': '#dbeafe'}}>💰</div>
// // //               </div>
// // //             </div>
// // //           </div>

// // //           {/* Filters and Search */}
// // //           <div className="filters-card">
// // //             <div className="filters-content">
// // //               <div className="filter-buttons">
// // //                 <button
// // //                   onClick={() => setFilterStatus('all')}
// // //                   className={`filter-btn ${filterStatus === 'all' ? 'filter-btn-all' : 'filter-btn-inactive'}`}
// // //                 >
// // //                   All Carts
// // //                 </button>
// // //                 <button
// // //                   onClick={() => setFilterStatus('active')}
// // //                   className={`filter-btn ${filterStatus === 'active' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
// // //                 >
// // //                   Active
// // //                 </button>
// // //                 <button
// // //                   onClick={() => setFilterStatus('empty')}
// // //                   className={`filter-btn ${filterStatus === 'empty' ? 'filter-btn-empty' : 'filter-btn-inactive'}`}
// // //                 >
// // //                   Empty
// // //                 </button>
// // //               </div>

// // //               <div className="search-export">
// // //                 <div className="search-container">
// // //                   <input
// // //                     type="text"
// // //                     placeholder="Search by name or email..."
// // //                     value={searchQuery}
// // //                     onChange={(e) => setSearchQuery(e.target.value)}
// // //                     className="search-input"
// // //                   />
// // //                   <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // //                     <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
// // //                   </svg>
// // //                 </div>
// // //                 <button onClick={exportToCSV} className="export-btn">
// // //                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // //                     <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
// // //                   </svg>
// // //                   Export CSV
// // //                 </button>
// // //                 <button 
// // //                   onClick={fetchAllCarts}
// // //                   className="export-btn"
// // //                   style={{background: 'linear-gradient(to right, #10b981, #059669)'}}
// // //                 >
// // //                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // //                     <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
// // //                   </svg>
// // //                   Refresh
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           </div>

// // //           {/* Carts List */}
// // //           <div className="carts-list">
// // //             {loading ? (
// // //               <div style={{ textAlign: 'center', padding: '3rem' }}>
// // //                 <p>Loading carts...</p>
// // //               </div>
// // //             ) : filteredCarts.length === 0 ? (
// // //               <div className="empty-state">
// // //                 <span className="empty-icon">📭</span>
// // //                 <h3 className="empty-title">
// // //                   {carts.length === 0 ? 'No carts found' : 'No carts match your filters'}
// // //                 </h3>
// // //                 <p className="empty-text">
// // //                   {carts.length === 0 
// // //                     ? 'There are no shopping carts in the system yet.' 
// // //                     : 'Try adjusting your filters or search query'}
// // //                 </p>
// // //                 <button 
// // //                   onClick={fetchAllCarts}
// // //                   className="export-btn"
// // //                   style={{marginTop: '1rem'}}
// // //                 >
// // //                   Refresh Data
// // //                 </button>
// // //               </div>
// // //             ) : (
// // //               filteredCarts.map((cart) => (
// // //                 <div key={cart.userId} className="cart-card">
// // //                   <div className="cart-gradient-bar"></div>
// // //                   <div className="cart-content">
// // //                     <div className="cart-header">
// // //                       <div className="cart-user-info">
// // //                         <div className="cart-user-name">
// // //                           <h3 className="cart-name">{cart.userName || 'Unknown User'}</h3>
// // //                           <span className={`status-badge ${cart.items && cart.items.length > 0 ? 'status-active' : 'status-empty'}`}>
// // //                             {cart.items && cart.items.length > 0 ? 'Active' : 'Empty'}
// // //                           </span>
// // //                         </div>
// // //                         <div className="cart-email">
// // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // //                             <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
// // //                             <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
// // //                           </svg>
// // //                           <p>{cart.userEmail || 'No email'}</p>
// // //                         </div>
// // //                         <div className="cart-id">
// // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // //                             <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
// // //                           </svg>
// // //                           <p>User ID: {cart.userId || 'N/A'}</p>
// // //                         </div>
// // //                         <div className="cart-updated">
// // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // //                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
// // //                           </svg>
// // //                           <p>Last updated: {cart.updatedAt ? new Date(cart.updatedAt).toLocaleString() : 'N/A'}</p>
// // //                         </div>
// // //                       </div>
// // //                       <div className="cart-total">
// // //                         <p className="cart-total-value">AED {calculateTotal(cart.items).toLocaleString()}</p>
// // //                         <p className="cart-items-count">{cart.items?.length || 0} items</p>
// // //                       </div>
// // //                     </div>

// // //                     {cart.items && cart.items.length > 0 && (
// // //                       <div className="cart-items-section">
// // //                         <h4 className="cart-items-title">
// // //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // //                             <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
// // //                           </svg>
// // //                           Cart Items:
// // //                         </h4>
// // //                         <div className="cart-items-list">
// // //                           {cart.items.map((item, index) => (
// // //                             <div key={index} className="cart-item">
// // //                               <div className="cart-item-info">
// // //                                 {item.image && (
// // //                                   <img 
// // //                                     src={item.image} 
// // //                                     alt={item.name}
// // //                                     className="cart-item-image"
// // //                                     onError={(e) => {
// // //                                       e.target.style.display = 'none';
// // //                                     }}
// // //                                   />
// // //                                 )}
// // //                                 <div>
// // //                                   <p className="cart-item-name">{item.name || 'Unknown Product'}</p>
// // //                                   <p className="cart-item-qty">Qty: {item.quantity || 0}</p>
// // //                                 </div>
// // //                               </div>
// // //                               <p className="cart-item-price">
// // //                                 AED {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
// // //                               </p>
// // //                             </div>
// // //                           ))}
// // //                         </div>
// // //                       </div>
// // //                     )}

// // //                     <div className="cart-actions">
// // //                       <button
// // //                         onClick={() => router.push(`/admin/users/${cart.userId}`)}
// // //                         className="action-btn view-btn"
// // //                       >
// // //                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // //                           <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
// // //                           <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
// // //                         </svg>
// // //                         View User
// // //                       </button>
// // //                       <button
// // //                         onClick={() => deleteCart(cart.userId)}
// // //                         className="action-btn delete-btn"
// // //                       >
// // //                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// // //                           <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
// // //                         </svg>
// // //                         Delete
// // //                       </button>
// // //                     </div>
// // //                   </div>
// // //                 </div>
// // //               ))
// // //             )}
// // //           </div>
// // //         </div>
// // //       </div>

// // //       <style jsx>{`
// // //         @keyframes spin {
// // //           from { transform: rotate(0deg); }
// // //           to { transform: rotate(360deg); }
// // //         }
// // //         @keyframes fadeIn {
// // //           from { opacity: 0; transform: translateY(20px); }
// // //           to { opacity: 1; transform: translateY(0); }
// // //         }
// // //         .page-container {
// // //           min-height: 100vh;
// // //           background: linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff);
// // //           padding: 2rem 1rem;
// // //           animation: fadeIn 0.6s ease-out;
// // //         }
// // //         .container {
// // //           max-width: 1280px;
// // //           margin: 0 auto;
// // //         }
// // //         .header {
// // //           margin-bottom: 2rem;
// // //           text-align: center;
// // //         }
// // //         .title {
// // //           font-size: 2.25rem;
// // //           font-weight: 700;
// // //           background: linear-gradient(to right, #4f46e5, #7c3aed);
// // //           -webkit-background-clip: text;
// // //           -webkit-text-fill-color: transparent;
// // //           background-clip: text;
// // //           margin-bottom: 0.5rem;
// // //         }
// // //         .subtitle {
// // //           color: #4b5563;
// // //           font-size: 1.125rem;
// // //         }
// // //         .stats-grid {
// // //           display: grid;
// // //           grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
// // //           gap: 1.5rem;
// // //           margin-bottom: 2rem;
// // //         }
// // //         .stat-card {
// // //           background: white;
// // //           border-radius: 0.75rem;
// // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // //           overflow: hidden;
// // //           transition: all 0.3s;
// // //         }
// // //         .stat-card:hover {
// // //           transform: scale(1.05);
// // //           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
// // //         }
// // //         .stat-bar {
// // //           height: 1rem;
// // //           background: linear-gradient(to right, var(--color-start), var(--color-end));
// // //         }
// // //         .stat-content {
// // //           padding: 1.5rem;
// // //           display: flex;
// // //           align-items: center;
// // //           justify-content: space-between;
// // //         }
// // //         .stat-icon {
// // //           background: var(--bg-color);
// // //           border-radius: 9999px;
// // //           padding: 0.75rem;
// // //           font-size: 1.5rem;
// // //         }
// // //         .stat-label {
// // //           color: #6b7280;
// // //           font-size: 0.875rem;
// // //           font-weight: 500;
// // //         }
// // //         .stat-value {
// // //           font-size: 1.875rem;
// // //           font-weight: 700;
// // //           color: #111827;
// // //         }
// // //         .filters-card {
// // //           background: white;
// // //           border-radius: 0.75rem;
// // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // //           padding: 1.5rem;
// // //           margin-bottom: 1.5rem;
// // //         }
// // //         .filters-content {
// // //           display: flex;
// // //           flex-direction: column;
// // //           gap: 1rem;
// // //         }
// // //         @media (min-width: 768px) {
// // //           .filters-content {
// // //             flex-direction: row;
// // //             justify-content: space-between;
// // //             align-items: center;
// // //           }
// // //         }
// // //         .filter-buttons {
// // //           display: flex;
// // //           gap: 0.5rem;
// // //           flex-wrap: wrap;
// // //         }
// // //         .filter-btn {
// // //           padding: 0.5rem 1rem;
// // //           border-radius: 0.5rem;
// // //           font-weight: 500;
// // //           transition: all 0.3s;
// // //           cursor: pointer;
// // //           border: none;
// // //         }
// // //         .filter-btn-inactive {
// // //           background: #f3f4f6;
// // //           color: #374151;
// // //         }
// // //         .filter-btn-inactive:hover {
// // //           background: #e5e7eb;
// // //         }
// // //         .filter-btn-all {
// // //           background: linear-gradient(to right, #6366f1, #a855f7);
// // //           color: white;
// // //           box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
// // //         }
// // //         .filter-btn-active {
// // //           background: linear-gradient(to right, #10b981, #059669);
// // //           color: white;
// // //           box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
// // //         }
// // //         .filter-btn-empty {
// // //           background: linear-gradient(to right, #6b7280, #4b5563);
// // //           color: white;
// // //           box-shadow: 0 4px 6px -1px rgba(107, 114, 128, 0.3);
// // //         }
// // //         .search-export {
// // //           display: flex;
// // //           gap: 0.5rem;
// // //           width: 100%;
// // //         }
// // //         @media (min-width: 768px) {
// // //           .search-export {
// // //             width: auto;
// // //           }
// // //         }
// // //         .search-container {
// // //           position: relative;
// // //         }
// // //         .search-input {
// // //           padding: 0.5rem 1rem 0.5rem 2.5rem;
// // //           border: 1px solid #d1d5db;
// // //           border-radius: 0.5rem;
// // //           width: 100%;
// // //           outline: none;
// // //           transition: all 0.3s;
// // //         }
// // //         .search-input:focus {
// // //           border-color: #6366f1;
// // //           box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
// // //         }
// // //         .search-icon {
// // //           position: absolute;
// // //           left: 0.75rem;
// // //           top: 50%;
// // //           transform: translateY(-50%);
// // //           color: #9ca3af;
// // //           width: 1.25rem;
// // //           height: 1.25rem;
// // //         }
// // //         .export-btn {
// // //           background: linear-gradient(to right, #6366f1, #a855f7);
// // //           color: white;
// // //           padding: 0.5rem 1rem;
// // //           border-radius: 0.5rem;
// // //           font-weight: 500;
// // //           border: none;
// // //           cursor: pointer;
// // //           display: flex;
// // //           align-items: center;
// // //           gap: 0.5rem;
// // //           transition: all 0.3s;
// // //         }
// // //         .export-btn:hover {
// // //           background: linear-gradient(to right, #4f46e5, #9333ea);
// // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // //         }
// // //         .carts-list {
// // //           display: flex;
// // //           flex-direction: column;
// // //           gap: 1rem;
// // //         }
// // //         .cart-card {
// // //           background: white;
// // //           border-radius: 0.75rem;
// // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // //           overflow: hidden;
// // //           transition: all 0.3s;
// // //         }
// // //         .cart-card:hover {
// // //           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
// // //           transform: translateY(-4px);
// // //         }
// // //         .cart-gradient-bar {
// // //           height: 0.5rem;
// // //           background: linear-gradient(to right, #6366f1, #a855f7, #3b82f6);
// // //         }
// // //         .cart-content {
// // //           padding: 1.5rem;
// // //         }
// // //         .cart-header {
// // //           display: flex;
// // //           justify-content: space-between;
// // //           align-items: start;
// // //           margin-bottom: 1rem;
// // //           flex-wrap: wrap;
// // //           gap: 1rem;
// // //         }
// // //         .cart-user-info {
// // //           flex: 1;
// // //         }
// // //         .cart-user-name {
// // //           display: flex;
// // //           align-items: center;
// // //           gap: 0.75rem;
// // //           margin-bottom: 0.5rem;
// // //         }
// // //         .cart-name {
// // //           font-size: 1.25rem;
// // //           font-weight: 700;
// // //           color: #111827;
// // //         }
// // //         .status-badge {
// // //           padding: 0.25rem 0.75rem;
// // //           border-radius: 9999px;
// // //           font-size: 0.75rem;
// // //           font-weight: 500;
// // //         }
// // //         .status-active {
// // //           background: #d1fae5;
// // //           color: #065f46;
// // //         }
// // //         .status-empty {
// // //           background: #f3f4f6;
// // //           color: #374151;
// // //         }
// // //         .cart-email, .cart-id, .cart-updated {
// // //           display: flex;
// // //           align-items: center;
// // //           gap: 0.5rem;
// // //           color: #6b7280;
// // //           font-size: 0.875rem;
// // //           margin-bottom: 0.25rem;
// // //         }
// // //         .cart-total {
// // //           text-align: right;
// // //         }
// // //         .cart-total-value {
// // //           font-size: 1.5rem;
// // //           font-weight: 700;
// // //           background: linear-gradient(to right, #4f46e5, #7c3aed);
// // //           -webkit-background-clip: text;
// // //           -webkit-text-fill-color: transparent;
// // //           background-clip: text;
// // //         }
// // //         .cart-items-count {
// // //           color: #6b7280;
// // //           font-size: 0.875rem;
// // //         }
// // //         .cart-items-section {
// // //           border-top: 1px solid #e5e7eb;
// // //           padding-top: 1rem;
// // //           margin-top: 1rem;
// // //         }
// // //         .cart-items-title {
// // //           font-weight: 600;
// // //           color: #374151;
// // //           margin-bottom: 0.75rem;
// // //           display: flex;
// // //           align-items: center;
// // //           gap: 0.5rem;
// // //         }
// // //         .cart-items-list {
// // //           display: flex;
// // //           flex-direction: column;
// // //           gap: 0.5rem;
// // //         }
// // //         .cart-item {
// // //           display: flex;
// // //           justify-content: space-between;
// // //           align-items: center;
// // //           background: linear-gradient(to right, #eef2ff, #faf5ff);
// // //           border-radius: 0.5rem;
// // //           padding: 0.75rem;
// // //           border: 1px solid #e0e7ff;
// // //         }
// // //         .cart-item-info {
// // //           display: flex;
// // //           align-items: center;
// // //           gap: 0.75rem;
// // //           flex: 1;
// // //         }
// // //         .cart-item-image {
// // //           width: 3rem;
// // //           height: 3rem;
// // //           object-fit: cover;
// // //           border-radius: 0.375rem;
// // //         }
// // //         .cart-item-name {
// // //           font-weight: 500;
// // //           color: #111827;
// // //         }
// // //         .cart-item-qty {
// // //           font-size: 0.875rem;
// // //           color: #6b7280;
// // //         }
// // //         .cart-item-price {
// // //           font-weight: 600;
// // //           color: #4f46e5;
// // //         }
// // //         .cart-actions {
// // //           display: flex;
// // //           gap: 0.5rem;
// // //           margin-top: 1rem;
// // //           padding-top: 1rem;
// // //           border-top: 1px solid #e5e7eb;
// // //         }
// // //         .action-btn {
// // //           flex: 1;
// // //           padding: 0.5rem 1rem;
// // //           border-radius: 0.5rem;
// // //           font-weight: 500;
// // //           border: none;
// // //           cursor: pointer;
// // //           display: flex;
// // //           align-items: center;
// // //           justify-content: center;
// // //           gap: 0.5rem;
// // //           transition: all 0.3s;
// // //         }
// // //         .view-btn {
// // //           background: linear-gradient(to right, #6366f1, #4f46e5);
// // //           color: white;
// // //         }
// // //         .view-btn:hover {
// // //           background: linear-gradient(to right, #4f46e5, #4338ca);
// // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // //         }
// // //         .delete-btn {
// // //           background: linear-gradient(to right, #ef4444, #dc2626);
// // //           color: white;
// // //           padding: 0.5rem 1rem;
// // //         }
// // //         .delete-btn:hover {
// // //           background: linear-gradient(to right, #dc2626, #b91c1c);
// // //           box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
// // //         }
// // //         .empty-state {
// // //           background: white;
// // //           border-radius: 0.75rem;
// // //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// // //           padding: 3rem;
// // //           text-align: center;
// // //         }
// // //         .empty-icon {
// // //           font-size: 3.75rem;
// // //           margin-bottom: 1rem;
// // //           display: block;
// // //         }
// // //         .empty-title {
// // //           font-size: 1.25rem;
// // //           font-weight: 600;
// // //           color: #374151;
// // //           margin-bottom: 0.5rem;
// // //         }
// // //         .empty-text {
// // //           color: #6b7280;
// // //         }
// // //         .alert {
// // //           margin-top: 1rem;
// // //           background: #fffbeb;
// // //           border-left: 4px solid #f59e0b;
// // //           border-radius: 0.5rem;
// // //           padding: 1rem;
// // //           max-width: 48rem;
// // //           margin-left: auto;
// // //           margin-right: auto;
// // //         }
// // //         .alert-content {
// // //           display: flex;
// // //         }
// // //         .alert-icon {
// // //           flex-shrink: 0;
// // //           width: 1.25rem;
// // //           height: 1.25rem;
// // //           color: #f59e0b;
// // //         }
// // //         .alert-text {
// // //           margin-left: 0.75rem;
// // //           color: #92400e;
// // //           font-size: 0.875rem;
// // //         }
// // //         .debug-info {
// // //           background: #f0f9ff;
// // //           border: 1px solid #bae6fd;
// // //           color: #0369a1;
// // //           padding: 0.75rem;
// // //           border-radius: 0.5rem;
// // //           margin-bottom: 1rem;
// // //           font-size: 0.875rem;
// // //         }
// // //         svg {
// // //           width: 1.25rem;
// // //           height: 1.25rem;
// // //         }
// // //       `}</style>
// // //     </ClientLayout>
// // //   );
// // // }
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { useRouter } from 'next/navigation';
// // import { useAuth } from '@/contexts/AuthContext';
// // import ClientLayout from '@/app/ClientLayout';

// // export default function AdminCartsPage() {
// //   const [carts, setCarts] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState('');
// //   const [filterStatus, setFilterStatus] = useState('all');
// //   const [searchQuery, setSearchQuery] = useState('');
// //   const [apiStatus, setApiStatus] = useState('');
// //   const { user, token, loading: authLoading } = useAuth();
// //   const router = useRouter();

// //   useEffect(() => {
// //     if (!authLoading && !user) {
// //       router.push('/auth/admin/login');
// //       return;
// //     }

// //     if (!authLoading && user && user.role !== 'admin') {
// //       router.push('/unauthorized');
// //       return;
// //     }

// //     if (user && user.role === 'admin') {
// //       fetchAllCarts();
// //     }
// //   }, [user, authLoading, router]);

// //   const fetchAllCarts = async () => {
// //     try {
// //       setLoading(true);
// //       setError('');
// //       setApiStatus('Fetching carts data...');

// //       // Use token from context or localStorage
// //       const currentToken = token || localStorage.getItem('token');
      
// //       if (!currentToken) {
// //         setError('No authentication token found. Please login again.');
// //         setLoading(false);
// //         return;
// //       }

// //       const response = await fetch('/api/admin/carts', {
// //         headers: {
// //           'Authorization': `Bearer ${currentToken}`,
// //           'Content-Type': 'application/json'
// //         }
// //       });

// //       setApiStatus(`Response status: ${response.status}`);

// //       if (!response.ok) {
// //         if (response.status === 401) {
// //           setError('Authentication failed. Please login again.');
// //           setTimeout(() => router.push('/auth/admin/login'), 2000);
// //           return;
// //         }
        
// //         if (response.status === 403) {
// //           setError('Access denied. Admin privileges required.');
// //           return;
// //         }
        
// //         const errorData = await response.json().catch(() => ({ error: 'Failed to fetch carts' }));
// //         throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
// //       }

// //       const data = await response.json();
      
// //       if (data.success) {
// //         setCarts(data.carts || []);
// //         setApiStatus('Carts loaded successfully');
// //       } else {
// //         throw new Error(data.error || 'Failed to load carts');
// //       }
      
// //     } catch (err) {
// //       console.error('API Error:', err);
// //       const errorMessage = err.message || 'Failed to load carts. Please try again later.';
// //       setError(errorMessage);
// //       setApiStatus(`Error: ${errorMessage}`);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const calculateTotal = (items) => {
// //     if (!items || !Array.isArray(items)) return 0;
// //     return items.reduce((sum, item) => {
// //       const price = Number(item.price) || 0;
// //       const quantity = Number(item.quantity) || 0;
// //       return sum + (price * quantity);
// //     }, 0);
// //   };

// //   const deleteCart = async (userId) => {
// //     if (!confirm('Are you sure you want to delete this cart?')) return;

// //     // Optimistically update UI
// //     const originalCarts = [...carts];
// //     setCarts(carts.filter(cart => cart.userId !== userId));
    
// //     try {
// //       const currentToken = token || localStorage.getItem('token');
// //       const response = await fetch(`/api/admin/carts?userId=${userId}`, {
// //         method: 'DELETE',
// //         headers: {
// //           'Authorization': `Bearer ${currentToken}`,
// //           'Content-Type': 'application/json'
// //         }
// //       });
      
// //       if (!response.ok) {
// //         const errorData = await response.json();
// //         throw new Error(errorData.error || 'Failed to delete cart');
// //       }

// //       // Refresh the list to ensure consistency
// //       fetchAllCarts();
      
// //     } catch (err) {
// //       console.error('Delete error:', err);
// //       // Revert UI change on error
// //       setCarts(originalCarts);
// //       setError(err.message || 'Failed to delete cart. Please try again.');
// //     }
// //   };

// //   const exportToCSV = () => {
// //     const headers = ['User ID', 'User Name', 'Email', 'Items Count', 'Total Value', 'Last Updated'];
// //     const rows = filteredCarts.map(cart => [
// //       cart.userId || 'N/A',
// //       cart.userName || 'Unknown',
// //       cart.userEmail || 'N/A',
// //       cart.items?.length || 0,
// //       calculateTotal(cart.items),
// //       cart.updatedAt ? new Date(cart.updatedAt).toLocaleString() : 'N/A'
// //     ]);

// //     const csvContent = [
// //       headers.join(','),
// //       ...rows.map(row => row.map(field => `"${field}"`).join(','))
// //     ].join('\n');

// //     const blob = new Blob([csvContent], { type: 'text/csv' });
// //     const url = window.URL.createObjectURL(blob);
// //     const a = document.createElement('a');
// //     a.href = url;
// //     a.download = `carts_export_${new Date().toISOString().split('T')[0]}.csv`;
// //     document.body.appendChild(a);
// //     a.click();
// //     document.body.removeChild(a);
// //     window.URL.revokeObjectURL(url);
// //   };

// //   const filteredCarts = carts.filter(cart => {
// //     const userName = cart.userName || '';
// //     const userEmail = cart.userEmail || '';
    
// //     const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //                          userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
// //     if (filterStatus === 'empty') return (!cart.items || cart.items.length === 0) && matchesSearch;
// //     if (filterStatus === 'active') return cart.items && cart.items.length > 0 && matchesSearch;
// //     return matchesSearch;
// //   });

// //   const totalItems = carts.reduce((sum, cart) => sum + (cart.items?.length || 0), 0);
// //   const totalValue = carts.reduce((sum, cart) => sum + calculateTotal(cart.items), 0);
// //   const activeCarts = carts.filter(cart => cart.items && cart.items.length > 0).length;

// //   if (authLoading) {
// //     return (
// //       <ClientLayout>
// //         <div style={{ 
// //           minHeight: '80vh', 
// //           display: 'flex', 
// //           alignItems: 'center', 
// //           justifyContent: 'center',
// //           background: 'linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff)'
// //         }}>
// //           <div style={{ textAlign: 'center' }}>
// //             <div style={{ 
// //               position: 'relative', 
// //               margin: '0 auto 1rem', 
// //               width: '64px', 
// //               height: '64px' 
// //             }}>
// //               <div style={{
// //                 animation: 'spin 1s linear infinite',
// //                 borderRadius: '9999px',
// //                 height: '64px',
// //                 width: '64px',
// //                 borderTop: '4px solid #4f46e5',
// //                 borderBottom: '4px solid #4f46e5'
// //               }}></div>
// //             </div>
// //             <p style={{ color: '#4b5563', fontSize: '1.125rem', fontWeight: '500' }}>Loading carts data...</p>
// //           </div>
// //         </div>
// //       </ClientLayout>
// //     );
// //   }

// //   if (!user || user.role !== 'admin') {
// //     return null;
// //   }

// //   return (
// //     <ClientLayout>
// //       <div className="page-container">
// //         <div className="container">
// //           {/* Header */}
// //           <div className="header">
// //             <h1 className="title">Cart Management</h1>
// //             <p className="subtitle">Monitor and manage all user shopping carts</p>
            
// //             {/* Debug Info - Remove in production */}
// //             {process.env.NODE_ENV === 'development' && apiStatus && (
// //               <div className="debug-info">
// //                 Debug: {apiStatus}
// //               </div>
// //             )}

// //             {error && (
// //               <div className="alert">
// //                 <div className="alert-content">
// //                   <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor">
// //                     <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
// //                   </svg>
// //                   <p className="alert-text">⚠️ {error}</p>
// //                 </div>
// //               </div>
// //             )}
// //           </div>

// //           {/* Statistics Cards */}
// //           <div className="stats-grid">
// //             <div className="stat-card">
// //               <div className="stat-bar" style={{'--color-start': '#6366f1', '--color-end': '#4f46e5'}}></div>
// //               <div className="stat-content">
// //                 <div>
// //                   <p className="stat-label">Total Carts</p>
// //                   <p className="stat-value">{carts.length}</p>
// //                 </div>
// //                 <div className="stat-icon" style={{'--bg-color': '#e0e7ff'}}>🛒</div>
// //               </div>
// //             </div>

// //             <div className="stat-card">
// //               <div className="stat-bar" style={{'--color-start': '#10b981', '--color-end': '#059669'}}></div>
// //               <div className="stat-content">
// //                 <div>
// //                   <p className="stat-label">Active Carts</p>
// //                   <p className="stat-value" style={{color: '#059669'}}>{activeCarts}</p>
// //                 </div>
// //                 <div className="stat-icon" style={{'--bg-color': '#d1fae5'}}>✅</div>
// //               </div>
// //             </div>

// //             <div className="stat-card">
// //               <div className="stat-bar" style={{'--color-start': '#a855f7', '--color-end': '#9333ea'}}></div>
// //               <div className="stat-content">
// //                 <div>
// //                   <p className="stat-label">Total Items</p>
// //                   <p className="stat-value" style={{color: '#9333ea'}}>{totalItems}</p>
// //                 </div>
// //                 <div className="stat-icon" style={{'--bg-color': '#f3e8ff'}}>📦</div>
// //               </div>
// //             </div>

// //             <div className="stat-card">
// //               <div className="stat-bar" style={{'--color-start': '#3b82f6', '--color-end': '#2563eb'}}></div>
// //               <div className="stat-content">
// //                 <div>
// //                   <p className="stat-label">Total Value</p>
// //                   <p className="stat-value" style={{color: '#2563eb'}}>AED {totalValue.toLocaleString()}</p>
// //                 </div>
// //                 <div className="stat-icon" style={{'--bg-color': '#dbeafe'}}>💰</div>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Filters and Search */}
// //           <div className="filters-card">
// //             <div className="filters-content">
// //               <div className="filter-buttons">
// //                 <button
// //                   onClick={() => setFilterStatus('all')}
// //                   className={`filter-btn ${filterStatus === 'all' ? 'filter-btn-all' : 'filter-btn-inactive'}`}
// //                 >
// //                   All Carts
// //                 </button>
// //                 <button
// //                   onClick={() => setFilterStatus('active')}
// //                   className={`filter-btn ${filterStatus === 'active' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
// //                 >
// //                   Active
// //                 </button>
// //                 <button
// //                   onClick={() => setFilterStatus('empty')}
// //                   className={`filter-btn ${filterStatus === 'empty' ? 'filter-btn-empty' : 'filter-btn-inactive'}`}
// //                 >
// //                   Empty
// //                 </button>
// //               </div>

// //               <div className="search-export">
// //                 <div className="search-container">
// //                   <input
// //                     type="text"
// //                     placeholder="Search by name or email..."
// //                     value={searchQuery}
// //                     onChange={(e) => setSearchQuery(e.target.value)}
// //                     className="search-input"
// //                   />
// //                   <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// //                     <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
// //                   </svg>
// //                 </div>
// //                 <button onClick={exportToCSV} className="export-btn">
// //                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// //                     <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
// //                   </svg>
// //                   Export CSV
// //                 </button>
// //                 <button 
// //                   onClick={fetchAllCarts}
// //                   className="export-btn"
// //                   style={{background: 'linear-gradient(to right, #10b981, #059669)'}}
// //                 >
// //                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// //                     <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
// //                   </svg>
// //                   Refresh
// //                 </button>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Carts List */}
// //           <div className="carts-list">
// //             {loading ? (
// //               <div style={{ textAlign: 'center', padding: '3rem' }}>
// //                 <p>Loading carts...</p>
// //               </div>
// //             ) : filteredCarts.length === 0 ? (
// //               <div className="empty-state">
// //                 <span className="empty-icon">📭</span>
// //                 <h3 className="empty-title">
// //                   {carts.length === 0 ? 'No carts found' : 'No carts match your filters'}
// //                 </h3>
// //                 <p className="empty-text">
// //                   {carts.length === 0 
// //                     ? 'There are no shopping carts in the system yet.' 
// //                     : 'Try adjusting your filters or search query'}
// //                 </p>
// //                 <button 
// //                   onClick={fetchAllCarts}
// //                   className="export-btn"
// //                   style={{marginTop: '1rem'}}
// //                 >
// //                   Refresh Data
// //                 </button>
// //               </div>
// //             ) : (
// //               filteredCarts.map((cart) => (
// //                 <div key={cart.userId} className="cart-card">
// //                   <div className="cart-gradient-bar"></div>
// //                   <div className="cart-content">
// //                     <div className="cart-header">
// //                       <div className="cart-user-info">
// //                         <div className="cart-user-name">
// //                           <h3 className="cart-name">{cart.userName || 'Unknown User'}</h3>
// //                           <span className={`status-badge ${cart.items && cart.items.length > 0 ? 'status-active' : 'status-empty'}`}>
// //                             {cart.items && cart.items.length > 0 ? 'Active' : 'Empty'}
// //                           </span>
// //                         </div>
// //                         <div className="cart-email">
// //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// //                             <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
// //                             <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
// //                           </svg>
// //                           <p>{cart.userEmail || 'No email'}</p>
// //                         </div>
// //                         <div className="cart-id">
// //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// //                             <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
// //                           </svg>
// //                           <p>User ID: {cart.userId || 'N/A'}</p>
// //                         </div>
// //                         <div className="cart-updated">
// //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// //                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
// //                           </svg>
// //                           <p>Last updated: {cart.updatedAt ? new Date(cart.updatedAt).toLocaleString() : 'N/A'}</p>
// //                         </div>
// //                       </div>
// //                       <div className="cart-total">
// //                         <p className="cart-total-value">AED {calculateTotal(cart.items).toLocaleString()}</p>
// //                         <p className="cart-items-count">{cart.items?.length || 0} items</p>
// //                       </div>
// //                     </div>

// //                     {cart.items && cart.items.length > 0 && (
// //                       <div className="cart-items-section">
// //                         <h4 className="cart-items-title">
// //                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// //                             <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
// //                           </svg>
// //                           Cart Items:
// //                         </h4>
// //                         <div className="cart-items-list">
// //                           {cart.items.map((item, index) => (
// //                             <div key={index} className="cart-item">
// //                               <div className="cart-item-info">
// //                                 {item.image && (
// //                                   <img 
// //                                     src={item.image} 
// //                                     alt={item.name}
// //                                     className="cart-item-image"
// //                                     onError={(e) => {
// //                                       e.target.style.display = 'none';
// //                                     }}
// //                                   />
// //                                 )}
// //                                 <div>
// //                                   <p className="cart-item-name">{item.name || 'Unknown Product'}</p>
// //                                   <p className="cart-item-qty">Qty: {item.quantity || 0}</p>
// //                                 </div>
// //                               </div>
// //                               <p className="cart-item-price">
// //                                 AED {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
// //                               </p>
// //                             </div>
// //                           ))}
// //                         </div>
// //                       </div>
// //                     )}

// //                     <div className="cart-actions">
// //                       <button
// //                         onClick={() => router.push(`/admin/users/${cart.userId}`)}
// //                         className="action-btn view-btn"
// //                       >
// //                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// //                           <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
// //                           <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
// //                         </svg>
// //                         View User
// //                       </button>
// //                       <button
// //                         onClick={() => deleteCart(cart.userId)}
// //                         className="action-btn delete-btn"
// //                       >
// //                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// //                           <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
// //                         </svg>
// //                         Delete
// //                       </button>
// //                     </div>
// //                   </div>
// //                 </div>
// //               ))
// //             )}
// //           </div>
// //         </div>
// //       </div>

// //       <style jsx>{`
// //         @keyframes spin {
// //           from { transform: rotate(0deg); }
// //           to { transform: rotate(360deg); }
// //         }
// //         @keyframes fadeIn {
// //           from { opacity: 0; transform: translateY(20px); }
// //           to { opacity: 1; transform: translateY(0); }
// //         }
// //         .page-container {
// //           min-height: 100vh;
// //           background: linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff);
// //           padding: 2rem 1rem;
// //           animation: fadeIn 0.6s ease-out;
// //         }
// //         .container {
// //           max-width: 1280px;
// //           margin: 0 auto;
// //         }
// //         .header {
// //           margin-bottom: 2rem;
// //           text-align: center;
// //         }
// //         .title {
// //           font-size: 2.25rem;
// //           font-weight: 700;
// //           background: linear-gradient(to right, #4f46e5, #7c3aed);
// //           -webkit-background-clip: text;
// //           -webkit-text-fill-color: transparent;
// //           background-clip: text;
// //           margin-bottom: 0.5rem;
// //         }
// //         .subtitle {
// //           color: #4b5563;
// //           font-size: 1.125rem;
// //         }
// //         .stats-grid {
// //           display: grid;
// //           grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
// //           gap: 1.5rem;
// //           margin-bottom: 2rem;
// //         }
// //         .stat-card {
// //           background: white;
// //           border-radius: 0.75rem;
// //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// //           overflow: hidden;
// //           transition: all 0.3s;
// //         }
// //         .stat-card:hover {
// //           transform: scale(1.05);
// //           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
// //         }
// //         .stat-bar {
// //           height: 1rem;
// //           background: linear-gradient(to right, var(--color-start), var(--color-end));
// //         }
// //         .stat-content {
// //           padding: 1.5rem;
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //         }
// //         .stat-icon {
// //           background: var(--bg-color);
// //           border-radius: 9999px;
// //           padding: 0.75rem;
// //           font-size: 1.5rem;
// //         }
// //         .stat-label {
// //           color: #6b7280;
// //           font-size: 0.875rem;
// //           font-weight: 500;
// //         }
// //         .stat-value {
// //           font-size: 1.875rem;
// //           font-weight: 700;
// //           color: #111827;
// //         }
// //         .filters-card {
// //           background: white;
// //           border-radius: 0.75rem;
// //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// //           padding: 1.5rem;
// //           margin-bottom: 1.5rem;
// //         }
// //         .filters-content {
// //           display: flex;
// //           flex-direction: column;
// //           gap: 1rem;
// //         }
// //         @media (min-width: 768px) {
// //           .filters-content {
// //             flex-direction: row;
// //             justify-content: space-between;
// //             align-items: center;
// //           }
// //         }
// //         .filter-buttons {
// //           display: flex;
// //           gap: 0.5rem;
// //           flex-wrap: wrap;
// //         }
// //         .filter-btn {
// //           padding: 0.5rem 1rem;
// //           border-radius: 0.5rem;
// //           font-weight: 500;
// //           transition: all 0.3s;
// //           cursor: pointer;
// //           border: none;
// //         }
// //         .filter-btn-inactive {
// //           background: #f3f4f6;
// //           color: #374151;
// //         }
// //         .filter-btn-inactive:hover {
// //           background: #e5e7eb;
// //         }
// //         .filter-btn-all {
// //           background: linear-gradient(to right, #6366f1, #a855f7);
// //           color: white;
// //           box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
// //         }
// //         .filter-btn-active {
// //           background: linear-gradient(to right, #10b981, #059669);
// //           color: white;
// //           box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
// //         }
// //         .filter-btn-empty {
// //           background: linear-gradient(to right, #6b7280, #4b5563);
// //           color: white;
// //           box-shadow: 0 4px 6px -1px rgba(107, 114, 128, 0.3);
// //         }
// //         .search-export {
// //           display: flex;
// //           gap: 0.5rem;
// //           width: 100%;
// //         }
// //         @media (min-width: 768px) {
// //           .search-export {
// //             width: auto;
// //           }
// //         }
// //         .search-container {
// //           position: relative;
// //         }
// //         .search-input {
// //           padding: 0.5rem 1rem 0.5rem 2.5rem;
// //           border: 1px solid #d1d5db;
// //           border-radius: 0.5rem;
// //           width: 100%;
// //           outline: none;
// //           transition: all 0.3s;
// //         }
// //         .search-input:focus {
// //           border-color: #6366f1;
// //           box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
// //         }
// //         .search-icon {
// //           position: absolute;
// //           left: 0.75rem;
// //           top: 50%;
// //           transform: translateY(-50%);
// //           color: #9ca3af;
// //           width: 1.25rem;
// //           height: 1.25rem;
// //         }
// //         .export-btn {
// //           background: linear-gradient(to right, #6366f1, #a855f7);
// //           color: white;
// //           padding: 0.5rem 1rem;
// //           border-radius: 0.5rem;
// //           font-weight: 500;
// //           border: none;
// //           cursor: pointer;
// //           display: flex;
// //           align-items: center;
// //           gap: 0.5rem;
// //           transition: all 0.3s;
// //         }
// //         .export-btn:hover {
// //           background: linear-gradient(to right, #4f46e5, #9333ea);
// //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// //         }
// //         .carts-list {
// //           display: flex;
// //           flex-direction: column;
// //           gap: 1rem;
// //         }
// //         .cart-card {
// //           background: white;
// //           border-radius: 0.75rem;
// //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// //           overflow: hidden;
// //           transition: all 0.3s;
// //         }
// //         .cart-card:hover {
// //           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
// //           transform: translateY(-4px);
// //         }
// //         .cart-gradient-bar {
// //           height: 0.5rem;
// //           background: linear-gradient(to right, #6366f1, #a855f7, #3b82f6);
// //         }
// //         .cart-content {
// //           padding: 1.5rem;
// //         }
// //         .cart-header {
// //           display: flex;
// //           justify-content: space-between;
// //           align-items: start;
// //           margin-bottom: 1rem;
// //           flex-wrap: wrap;
// //           gap: 1rem;
// //         }
// //         .cart-user-info {
// //           flex: 1;
// //         }
// //         .cart-user-name {
// //           display: flex;
// //           align-items: center;
// //           gap: 0.75rem;
// //           margin-bottom: 0.5rem;
// //         }
// //         .cart-name {
// //           font-size: 1.25rem;
// //           font-weight: 700;
// //           color: #111827;
// //         }
// //         .status-badge {
// //           padding: 0.25rem 0.75rem;
// //           border-radius: 9999px;
// //           font-size: 0.75rem;
// //           font-weight: 500;
// //         }
// //         .status-active {
// //           background: #d1fae5;
// //           color: #065f46;
// //         }
// //         .status-empty {
// //           background: #f3f4f6;
// //           color: #374151;
// //         }
// //         .cart-email, .cart-id, .cart-updated {
// //           display: flex;
// //           align-items: center;
// //           gap: 0.5rem;
// //           color: #6b7280;
// //           font-size: 0.875rem;
// //           margin-bottom: 0.25rem;
// //         }
// //         .cart-total {
// //           text-align: right;
// //         }
// //         .cart-total-value {
// //           font-size: 1.5rem;
// //           font-weight: 700;
// //           background: linear-gradient(to right, #4f46e5, #7c3aed);
// //           -webkit-background-clip: text;
// //           -webkit-text-fill-color: transparent;
// //           background-clip: text;
// //         }
// //         .cart-items-count {
// //           color: #6b7280;
// //           font-size: 0.875rem;
// //         }
// //         .cart-items-section {
// //           border-top: 1px solid #e5e7eb;
// //           padding-top: 1rem;
// //           margin-top: 1rem;
// //         }
// //         .cart-items-title {
// //           font-weight: 600;
// //           color: #374151;
// //           margin-bottom: 0.75rem;
// //           display: flex;
// //           align-items: center;
// //           gap: 0.5rem;
// //         }
// //         .cart-items-list {
// //           display: flex;
// //           flex-direction: column;
// //           gap: 0.5rem;
// //         }
// //         .cart-item {
// //           display: flex;
// //           justify-content: space-between;
// //           align-items: center;
// //           background: linear-gradient(to right, #eef2ff, #faf5ff);
// //           border-radius: 0.5rem;
// //           padding: 0.75rem;
// //           border: 1px solid #e0e7ff;
// //         }
// //         .cart-item-info {
// //           display: flex;
// //           align-items: center;
// //           gap: 0.75rem;
// //           flex: 1;
// //         }
// //         .cart-item-image {
// //           width: 3rem;
// //           height: 3rem;
// //           object-fit: cover;
// //           border-radius: 0.375rem;
// //         }
// //         .cart-item-name {
// //           font-weight: 500;
// //           color: #111827;
// //         }
// //         .cart-item-qty {
// //           font-size: 0.875rem;
// //           color: #6b7280;
// //         }
// //         .cart-item-price {
// //           font-weight: 600;
// //           color: #4f46e5;
// //         }
// //         .cart-actions {
// //           display: flex;
// //           gap: 0.5rem;
// //           margin-top: 1rem;
// //           padding-top: 1rem;
// //           border-top: 1px solid #e5e7eb;
// //         }
// //         .action-btn {
// //           flex: 1;
// //           padding: 0.5rem 1rem;
// //           border-radius: 0.5rem;
// //           font-weight: 500;
// //           border: none;
// //           cursor: pointer;
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           gap: 0.5rem;
// //           transition: all 0.3s;
// //         }
// //         .view-btn {
// //           background: linear-gradient(to right, #6366f1, #4f46e5);
// //           color: white;
// //         }
// //         .view-btn:hover {
// //           background: linear-gradient(to right, #4f46e5, #4338ca);
// //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// //         }
// //         .delete-btn {
// //           background: linear-gradient(to right, #ef4444, #dc2626);
// //           color: white;
// //           padding: 0.5rem 1rem;
// //         }
// //         .delete-btn:hover {
// //           background: linear-gradient(to right, #dc2626, #b91c1c);
// //           box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
// //         }
// //         .empty-state {
// //           background: white;
// //           border-radius: 0.75rem;
// //           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
// //           padding: 3rem;
// //           text-align: center;
// //         }
// //         .empty-icon {
// //           font-size: 3.75rem;
// //           margin-bottom: 1rem;
// //           display: block;
// //         }
// //         .empty-title {
// //           font-size: 1.25rem;
// //           font-weight: 600;
// //           color: #374151;
// //           margin-bottom: 0.5rem;
// //         }
// //         .empty-text {
// //           color: #6b7280;
// //         }
// //         .alert {
// //           margin-top: 1rem;
// //           background: #fffbeb;
// //           border-left: 4px solid #f59e0b;
// //           border-radius: 0.5rem;
// //           padding: 1rem;
// //           max-width: 48rem;
// //           margin-left: auto;
// //           margin-right: auto;
// //         }
// //         .alert-content {
// //           display: flex;
// //         }
// //         .alert-icon {
// //           flex-shrink: 0;
// //           width: 1.25rem;
// //           height: 1.25rem;
// //           color: #f59e0b;
// //         }
// //         .alert-text {
// //           margin-left: 0.75rem;
// //           color: #92400e;
// //           font-size: 0.875rem;
// //         }
// //         .debug-info {
// //           background: #f0f9ff;
// //           border: 1px solid #bae6fd;
// //           color: #0369a1;
// //           padding: 0.75rem;
// //           border-radius: 0.5rem;
// //           margin-bottom: 1rem;
// //           font-size: 0.875rem;
// //         }
// //         svg {
// //           width: 1.25rem;
// //           height: 1.25rem;
// //         }
// //       `}</style>
// //     </ClientLayout>
// //   );
// // }
// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/contexts/AuthContext';
// import ClientLayout from '@/app/ClientLayout';

// export default function AdminCartsPage() {
//   const [carts, setCarts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [apiStatus, setApiStatus] = useState('');
//   const { user, token, loading: authLoading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!authLoading) {
//       if (!user) {
//         router.push('/auth/admin/login');
//         return;
//       }

//       if (user.role !== 'admin') {
//         router.push('/unauthorized');
//         return;
//       }

//       if (user.role === 'admin') {
//         fetchAllCarts();
//       }
//     }
//   }, [user, authLoading, router]);

//   const fetchAllCarts = async () => {
//     try {
//       setLoading(true);
//       setError('');
//       setApiStatus('Fetching carts data...');

//       // Use token from context or localStorage with fallback
//       let currentToken = token;
      
//       if (!currentToken) {
//         currentToken = localStorage.getItem('token');
//         console.log('🔑 Using token from localStorage');
//       }

//       if (!currentToken) {
//         setError('No authentication token found. Please login again.');
//         setLoading(false);
//         return;
//       }

//       console.log('🔄 Fetching carts from API...');
      
//       const response = await fetch('/api/admin/carts', {
//         headers: {
//           'Authorization': `Bearer ${currentToken}`,
//           'Content-Type': 'application/json'
//         },
//         cache: 'no-store'
//       });

//       console.log('📨 API Response status:', response.status);
//       setApiStatus(`Response status: ${response.status}`);

//       const responseText = await response.text();
//       console.log('📄 Raw response:', responseText);

//       let data;
//       try {
//         data = JSON.parse(responseText);
//       } catch (parseError) {
//         console.error('❌ JSON parse error:', parseError);
//         throw new Error('Invalid response from server');
//       }

//       if (!response.ok) {
//         if (response.status === 401) {
//           setError('Authentication failed. Please login again.');
//           setTimeout(() => router.push('/auth/admin/login'), 2000);
//           return;
//         }
        
//         if (response.status === 403) {
//           setError('Access denied. Admin privileges required.');
//           return;
//         }
        
//         throw new Error(data.error || `HTTP error! status: ${response.status}`);
//       }

//       console.log('📊 Received data:', data);
      
//       if (data.success) {
//         setCarts(data.carts || []);
//         setApiStatus(`Successfully loaded ${data.carts?.length || 0} carts`);
//         console.log(`✅ Loaded ${data.carts?.length || 0} carts`);
//       } else {
//         throw new Error(data.error || 'Failed to load carts');
//       }
      
//     } catch (err) {
//       console.error('❌ API Error:', err);
//       const errorMessage = err.message || 'Failed to load carts. Please try again later.';
//       setError(errorMessage);
//       setApiStatus(`Error: ${errorMessage}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculateTotal = (items) => {
//     if (!items || !Array.isArray(items)) return 0;
//     return items.reduce((sum, item) => {
//       const price = Number(item.price) || 0;
//       const quantity = Number(item.quantity) || 0;
//       return sum + (price * quantity);
//     }, 0);
//   };

//   const deleteCart = async (userId) => {
//     if (!confirm('Are you sure you want to delete this cart?')) return;

//     // Optimistically update UI
//     const originalCarts = [...carts];
//     setCarts(carts.filter(cart => cart.userId !== userId));
    
//     try {
//       const currentToken = token || localStorage.getItem('token');
//       const response = await fetch(`/api/admin/carts?userId=${userId}`, {
//         method: 'DELETE',
//         headers: {
//           'Authorization': `Bearer ${currentToken}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to delete cart');
//       }

//       // Show success message and refresh
//       setApiStatus('Cart deleted successfully');
//       setTimeout(() => fetchAllCarts(), 1000);
      
//     } catch (err) {
//       console.error('Delete error:', err);
//       // Revert UI change on error
//       setCarts(originalCarts);
//       setError(err.message || 'Failed to delete cart. Please try again.');
//     }
//   };

//   const exportToCSV = () => {
//     const headers = ['User ID', 'User Name', 'Email', 'Items Count', 'Total Value', 'Last Updated'];
//     const rows = filteredCarts.map(cart => [
//       cart.userId || 'N/A',
//       cart.userName || 'Unknown',
//       cart.userEmail || 'N/A',
//       cart.items?.length || 0,
//       `AED ${calculateTotal(cart.items).toLocaleString()}`,
//       cart.updatedAt ? new Date(cart.updatedAt).toLocaleString() : 'N/A'
//     ]);

//     const csvContent = [
//       headers.join(','),
//       ...rows.map(row => row.map(field => `"${field}"`).join(','))
//     ].join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.setAttribute('href', url);
//     link.setAttribute('download', `carts_export_${new Date().toISOString().split('T')[0]}.csv`);
//     link.style.visibility = 'hidden';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const filteredCarts = carts.filter(cart => {
//     const userName = cart.userName || '';
//     const userEmail = cart.userEmail || '';
    
//     const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                          userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
//     if (filterStatus === 'empty') return (!cart.items || cart.items.length === 0) && matchesSearch;
//     if (filterStatus === 'active') return cart.items && cart.items.length > 0 && matchesSearch;
//     return matchesSearch;
//   });

//   const totalItems = carts.reduce((sum, cart) => sum + (cart.items?.length || 0), 0);
//   const totalValue = carts.reduce((sum, cart) => sum + calculateTotal(cart.items), 0);
//   const activeCarts = carts.filter(cart => cart.items && cart.items.length > 0).length;

//   if (authLoading) {
//     return (
//       <ClientLayout>
//         <div style={{ 
//           minHeight: '80vh', 
//           display: 'flex', 
//           alignItems: 'center', 
//           justifyContent: 'center',
//           background: 'linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff)'
//         }}>
//           <div style={{ textAlign: 'center' }}>
//             <div style={{ 
//               position: 'relative', 
//               margin: '0 auto 1rem', 
//               width: '64px', 
//               height: '64px' 
//             }}>
//               <div style={{
//                 animation: 'spin 1s linear infinite',
//                 borderRadius: '9999px',
//                 height: '64px',
//                 width: '64px',
//                 borderTop: '4px solid #4f46e5',
//                 borderBottom: '4px solid #4f46e5'
//               }}></div>
//             </div>
//             <p style={{ color: '#4b5563', fontSize: '1.125rem', fontWeight: '500' }}>Loading carts data...</p>
//           </div>
//         </div>
//       </ClientLayout>
//     );
//   }

//   if (!user || user.role !== 'admin') {
//     return null;
//   }

//   return (
//     <ClientLayout>
//       <div className="page-container">
//         <div className="container">
//           {/* Header */}
//           <div className="header">
//             <h1 className="title">Cart Management</h1>
//             <p className="subtitle">Monitor and manage all user shopping carts</p>
            
//             {/* Debug Info */}
//             {process.env.NODE_ENV === 'development' && apiStatus && (
//               <div className="debug-info">
//                 <strong>Debug:</strong> {apiStatus}
//                 {carts.length > 0 && ` | ${carts.length} carts loaded`}
//               </div>
//             )}

//             {error && (
//               <div className="alert">
//                 <div className="alert-content">
//                   <svg className="alert-icon" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                   </svg>
//                   <p className="alert-text">⚠️ {error}</p>
//                 </div>
//                 <button 
//                   onClick={() => setError('')}
//                   style={{ 
//                     background: 'none', 
//                     border: 'none', 
//                     color: '#92400e', 
//                     cursor: 'pointer',
//                     marginLeft: 'auto'
//                   }}
//                 >
//                   ✕
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Statistics Cards */}
//           <div className="stats-grid">
//             <div className="stat-card">
//               <div className="stat-bar" style={{'--color-start': '#6366f1', '--color-end': '#4f46e5'}}></div>
//               <div className="stat-content">
//                 <div>
//                   <p className="stat-label">Total Carts</p>
//                   <p className="stat-value">{carts.length}</p>
//                 </div>
//                 <div className="stat-icon" style={{'--bg-color': '#e0e7ff'}}>🛒</div>
//               </div>
//             </div>

//             <div className="stat-card">
//               <div className="stat-bar" style={{'--color-start': '#10b981', '--color-end': '#059669'}}></div>
//               <div className="stat-content">
//                 <div>
//                   <p className="stat-label">Active Carts</p>
//                   <p className="stat-value" style={{color: '#059669'}}>{activeCarts}</p>
//                 </div>
//                 <div className="stat-icon" style={{'--bg-color': '#d1fae5'}}>✅</div>
//               </div>
//             </div>

//             <div className="stat-card">
//               <div className="stat-bar" style={{'--color-start': '#a855f7', '--color-end': '#9333ea'}}></div>
//               <div className="stat-content">
//                 <div>
//                   <p className="stat-label">Total Items</p>
//                   <p className="stat-value" style={{color: '#9333ea'}}>{totalItems}</p>
//                 </div>
//                 <div className="stat-icon" style={{'--bg-color': '#f3e8ff'}}>📦</div>
//               </div>
//             </div>

//             <div className="stat-card">
//               <div className="stat-bar" style={{'--color-start': '#3b82f6', '--color-end': '#2563eb'}}></div>
//               <div className="stat-content">
//                 <div>
//                   <p className="stat-label">Total Value</p>
//                   <p className="stat-value" style={{color: '#2563eb'}}>AED {totalValue.toLocaleString()}</p>
//                 </div>
//                 <div className="stat-icon" style={{'--bg-color': '#dbeafe'}}>💰</div>
//               </div>
//             </div>
//           </div>

//           {/* Filters and Search */}
//           <div className="filters-card">
//             <div className="filters-content">
//               <div className="filter-buttons">
//                 <button
//                   onClick={() => setFilterStatus('all')}
//                   className={`filter-btn ${filterStatus === 'all' ? 'filter-btn-all' : 'filter-btn-inactive'}`}
//                 >
//                   All Carts
//                 </button>
//                 <button
//                   onClick={() => setFilterStatus('active')}
//                   className={`filter-btn ${filterStatus === 'active' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
//                 >
//                   Active
//                 </button>
//                 <button
//                   onClick={() => setFilterStatus('empty')}
//                   className={`filter-btn ${filterStatus === 'empty' ? 'filter-btn-empty' : 'filter-btn-inactive'}`}
//                 >
//                   Empty
//                 </button>
//               </div>

//               <div className="search-export">
//                 <div className="search-container">
//                   <input
//                     type="text"
//                     placeholder="Search by name or email..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="search-input"
//                   />
//                   <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
//                   </svg>
//                 </div>
//                 <button onClick={exportToCSV} className="export-btn" disabled={filteredCarts.length === 0}>
//                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
//                   </svg>
//                   Export CSV
//                 </button>
//                 <button 
//                   onClick={fetchAllCarts}
//                   className="export-btn"
//                   style={{background: 'linear-gradient(to right, #10b981, #059669)'}}
//                   disabled={loading}
//                 >
//                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
//                   </svg>
//                   {loading ? 'Refreshing...' : 'Refresh'}
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Carts List */}
//           <div className="carts-list">
//             {loading ? (
//               <div style={{ textAlign: 'center', padding: '3rem' }}>
//                 <div style={{ 
//                   width: '40px', 
//                   height: '40px', 
//                   border: '3px solid #f3f4f6',
//                   borderTop: '3px solid #4f46e5',
//                   borderRadius: '50%',
//                   animation: 'spin 1s linear infinite',
//                   margin: '0 auto 1rem'
//                 }}></div>
//                 <p>Loading carts data...</p>
//               </div>
//             ) : filteredCarts.length === 0 ? (
//               <div className="empty-state">
//                 <span className="empty-icon">📭</span>
//                 <h3 className="empty-title">
//                   {carts.length === 0 ? 'No carts found' : 'No carts match your filters'}
//                 </h3>
//                 <p className="empty-text">
//                   {carts.length === 0 
//                     ? 'There are no shopping carts in the system yet.' 
//                     : 'Try adjusting your filters or search query'}
//                 </p>
//                 <button 
//                   onClick={fetchAllCarts}
//                   className="export-btn"
//                   style={{marginTop: '1rem'}}
//                 >
//                   Refresh Data
//                 </button>
//               </div>
//             ) : (
//               filteredCarts.map((cart) => (
//                 <div key={cart.userId} className="cart-card">
//                   <div className="cart-gradient-bar"></div>
//                   <div className="cart-content">
//                     <div className="cart-header">
//                       <div className="cart-user-info">
//                         <div className="cart-user-name">
//                           <h3 className="cart-name">{cart.userName || 'Unknown User'}</h3>
//                           <span className={`status-badge ${cart.items && cart.items.length > 0 ? 'status-active' : 'status-empty'}`}>
//                             {cart.items && cart.items.length > 0 ? 'Active' : 'Empty'}
//                           </span>
//                         </div>
//                         <div className="cart-email">
//                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                             <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
//                             <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
//                           </svg>
//                           <p>{cart.userEmail || 'No email'}</p>
//                         </div>
//                         <div className="cart-id">
//                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                             <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
//                           </svg>
//                           <p>User ID: {cart.userId || 'N/A'}</p>
//                         </div>
//                         <div className="cart-updated">
//                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
//                           </svg>
//                           <p>Last updated: {cart.updatedAt ? new Date(cart.updatedAt).toLocaleString() : 'N/A'}</p>
//                         </div>
//                       </div>
//                       <div className="cart-total">
//                         <p className="cart-total-value">AED {calculateTotal(cart.items).toLocaleString()}</p>
//                         <p className="cart-items-count">{cart.items?.length || 0} items</p>
//                       </div>
//                     </div>

//                     {cart.items && cart.items.length > 0 && (
//                       <div className="cart-items-section">
//                         <h4 className="cart-items-title">
//                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                             <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
//                           </svg>
//                           Cart Items ({cart.items.length})
//                         </h4>
//                         <div className="cart-items-list">
//                           {cart.items.map((item, index) => (
//                             <div key={index} className="cart-item">
//                               <div className="cart-item-info">
//                                 {item.image && (
//                                   <img 
//                                     src={item.image} 
//                                     alt={item.name}
//                                     className="cart-item-image"
//                                     onError={(e) => {
//                                       e.target.style.display = 'none';
//                                     }}
//                                   />
//                                 )}
//                                 <div>
//                                   <p className="cart-item-name">{item.name || 'Unknown Product'}</p>
//                                   <p className="cart-item-qty">Qty: {item.quantity || 0}</p>
//                                 </div>
//                               </div>
//                               <p className="cart-item-price">
//                                 AED {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
//                               </p>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     <div className="cart-actions">
//                       <button
//                         onClick={() => router.push(`/admin/users/${cart.userId}`)}
//                         className="action-btn view-btn"
//                       >
//                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                           <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
//                           <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
//                         </svg>
//                         View User
//                       </button>
//                       <button
//                         onClick={() => deleteCart(cart.userId)}
//                         className="action-btn delete-btn"
//                       >
//                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
//                           <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
//                         </svg>
//                         Delete Cart
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>

//       <style jsx>{`
//         @keyframes spin {
//           from { transform: rotate(0deg); }
//           to { transform: rotate(360deg); }
//         }
//         @keyframes fadeIn {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .page-container {
//           min-height: 100vh;
//           background: linear-gradient(to bottom right, #eef2ff, #ffffff, #faf5ff);
//           padding: 2rem 1rem;
//           animation: fadeIn 0.6s ease-out;
//         }
//         .container {
//           max-width: 1280px;
//           margin: 0 auto;
//         }
//         .header {
//           margin-bottom: 2rem;
//           text-align: center;
//         }
//         .title {
//           font-size: 2.25rem;
//           font-weight: 700;
//           background: linear-gradient(to right, #4f46e5, #7c3aed);
//           -webkit-background-clip: text;
//           -webkit-text-fill-color: transparent;
//           background-clip: text;
//           margin-bottom: 0.5rem;
//         }
//         .subtitle {
//           color: #4b5563;
//           font-size: 1.125rem;
//         }
//         .stats-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
//           gap: 1.5rem;
//           margin-bottom: 2rem;
//         }
//         .stat-card {
//           background: white;
//           border-radius: 0.75rem;
//           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
//           overflow: hidden;
//           transition: all 0.3s;
//         }
//         .stat-card:hover {
//           transform: scale(1.05);
//           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
//         }
//         .stat-bar {
//           height: 1rem;
//           background: linear-gradient(to right, var(--color-start), var(--color-end));
//         }
//         .stat-content {
//           padding: 1.5rem;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//         }
//         .stat-icon {
//           background: var(--bg-color);
//           border-radius: 9999px;
//           padding: 0.75rem;
//           font-size: 1.5rem;
//         }
//         .stat-label {
//           color: #6b7280;
//           font-size: 0.875rem;
//           font-weight: 500;
//         }
//         .stat-value {
//           font-size: 1.875rem;
//           font-weight: 700;
//           color: #111827;
//         }
//         .filters-card {
//           background: white;
//           border-radius: 0.75rem;
//           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
//           padding: 1.5rem;
//           margin-bottom: 1.5rem;
//         }
//         .filters-content {
//           display: flex;
//           flex-direction: column;
//           gap: 1rem;
//         }
//         @media (min-width: 768px) {
//           .filters-content {
//             flex-direction: row;
//             justify-content: space-between;
//             align-items: center;
//           }
//         }
//         .filter-buttons {
//           display: flex;
//           gap: 0.5rem;
//           flex-wrap: wrap;
//         }
//         .filter-btn {
//           padding: 0.5rem 1rem;
//           border-radius: 0.5rem;
//           font-weight: 500;
//           transition: all 0.3s;
//           cursor: pointer;
//           border: none;
//         }
//         .filter-btn:disabled {
//           opacity: 0.6;
//           cursor: not-allowed;
//         }
//         .filter-btn-inactive {
//           background: #f3f4f6;
//           color: #374151;
//         }
//         .filter-btn-inactive:hover:not(:disabled) {
//           background: #e5e7eb;
//         }
//         .filter-btn-all {
//           background: linear-gradient(to right, #6366f1, #a855f7);
//           color: white;
//           box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
//         }
//         .filter-btn-active {
//           background: linear-gradient(to right, #10b981, #059669);
//           color: white;
//           box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
//         }
//         .filter-btn-empty {
//           background: linear-gradient(to right, #6b7280, #4b5563);
//           color: white;
//           box-shadow: 0 4px 6px -1px rgba(107, 114, 128, 0.3);
//         }
//         .search-export {
//           display: flex;
//           gap: 0.5rem;
//           width: 100%;
//         }
//         @media (min-width: 768px) {
//           .search-export {
//             width: auto;
//           }
//         }
//         .search-container {
//           position: relative;
//           flex: 1;
//         }
//         .search-input {
//           padding: 0.5rem 1rem 0.5rem 2.5rem;
//           border: 1px solid #d1d5db;
//           border-radius: 0.5rem;
//           width: 100%;
//           outline: none;
//           transition: all 0.3s;
//         }
//         .search-input:focus {
//           border-color: #6366f1;
//           box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
//         }
//         .search-icon {
//           position: absolute;
//           left: 0.75rem;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #9ca3af;
//           width: 1.25rem;
//           height: 1.25rem;
//         }
//         .export-btn {
//           background: linear-gradient(to right, #6366f1, #a855f7);
//           color: white;
//           padding: 0.5rem 1rem;
//           border-radius: 0.5rem;
//           font-weight: 500;
//           border: none;
//           cursor: pointer;
//           display: flex;
//           align-items: center;
//           gap: 0.5rem;
//           transition: all 0.3s;
//           white-space: nowrap;
//         }
//         .export-btn:disabled {
//           opacity: 0.6;
//           cursor: not-allowed;
//         }
//         .export-btn:hover:not(:disabled) {
//           background: linear-gradient(to right, #4f46e5, #9333ea);
//           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
//         }
//         .carts-list {
//           display: flex;
//           flex-direction: column;
//           gap: 1rem;
//         }
//         .cart-card {
//           background: white;
//           border-radius: 0.75rem;
//           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
//           overflow: hidden;
//           transition: all 0.3s;
//         }
//         .cart-card:hover {
//           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
//           transform: translateY(-4px);
//         }
//         .cart-gradient-bar {
//           height: 0.5rem;
//           background: linear-gradient(to right, #6366f1, #a855f7, #3b82f6);
//         }
//         .cart-content {
//           padding: 1.5rem;
//         }
//         .cart-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: start;
//           margin-bottom: 1rem;
//           flex-wrap: wrap;
//           gap: 1rem;
//         }
//         .cart-user-info {
//           flex: 1;
//         }
//         .cart-user-name {
//           display: flex;
//           align-items: center;
//           gap: 0.75rem;
//           margin-bottom: 0.5rem;
//         }
//         .cart-name {
//           font-size: 1.25rem;
//           font-weight: 700;
//           color: #111827;
//         }
//         .status-badge {
//           padding: 0.25rem 0.75rem;
//           border-radius: 9999px;
//           font-size: 0.75rem;
//           font-weight: 500;
//         }
//         .status-active {
//           background: #d1fae5;
//           color: #065f46;
//         }
//         .status-empty {
//           background: #f3f4f6;
//           color: #374151;
//         }
//         .cart-email, .cart-id, .cart-updated {
//           display: flex;
//           align-items: center;
//           gap: 0.5rem;
//           color: #6b7280;
//           font-size: 0.875rem;
//           margin-bottom: 0.25rem;
//         }
//         .cart-total {
//           text-align: right;
//         }
//         .cart-total-value {
//           font-size: 1.5rem;
//           font-weight: 700;
//           background: linear-gradient(to right, #4f46e5, #7c3aed);
//           -webkit-background-clip: text;
//           -webkit-text-fill-color: transparent;
//           background-clip: text;
//         }
//         .cart-items-count {
//           color: #6b7280;
//           font-size: 0.875rem;
//         }
//         .cart-items-section {
//           border-top: 1px solid #e5e7eb;
//           padding-top: 1rem;
//           margin-top: 1rem;
//         }
//         .cart-items-title {
//           font-weight: 600;
//           color: #374151;
//           margin-bottom: 0.75rem;
//           display: flex;
//           align-items: center;
//           gap: 0.5rem;
//         }
//         .cart-items-list {
//           display: flex;
//           flex-direction: column;
//           gap: 0.5rem;
//         }
//         .cart-item {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           background: linear-gradient(to right, #eef2ff, #faf5ff);
//           border-radius: 0.5rem;
//           padding: 0.75rem;
//           border: 1px solid #e0e7ff;
//         }
//         .cart-item-info {
//           display: flex;
//           align-items: center;
//           gap: 0.75rem;
//           flex: 1;
//         }
//         .cart-item-image {
//           width: 3rem;
//           height: 3rem;
//           object-fit: cover;
//           border-radius: 0.375rem;
//         }
//         .cart-item-name {
//           font-weight: 500;
//           color: #111827;
//         }
//         .cart-item-qty {
//           font-size: 0.875rem;
//           color: #6b7280;
//         }
//         .cart-item-price {
//           font-weight: 600;
//           color: #4f46e5;
//         }
//         .cart-actions {
//           display: flex;
//           gap: 0.5rem;
//           margin-top: 1rem;
//           padding-top: 1rem;
//           border-top: 1px solid #e5e7eb;
//         }
//         .action-btn {
//           flex: 1;
//           padding: 0.5rem 1rem;
//           border-radius: 0.5rem;
//           font-weight: 500;
//           border: none;
//           cursor: pointer;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           gap: 0.5rem;
//           transition: all 0.3s;
//         }
//         .view-btn {
//           background: linear-gradient(to right, #6366f1, #4f46e5);
//           color: white;
//         }
//         .view-btn:hover {
//           background: linear-gradient(to right, #4f46e5, #4338ca);
//           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
//         }
//         .delete-btn {
//           background: linear-gradient(to right, #ef4444, #dc2626);
//           color: white;
//           padding: 0.5rem 1rem;
//         }
//         .delete-btn:hover {
//           background: linear-gradient(to right, #dc2626, #b91c1c);
//           box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
//         }
//         .empty-state {
//           background: white;
//           border-radius: 0.75rem;
//           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
//           padding: 3rem;
//           text-align: center;
//         }
//         .empty-icon {
//           font-size: 3.75rem;
//           margin-bottom: 1rem;
//           display: block;
//         }
//         .empty-title {
//           font-size: 1.25rem;
//           font-weight: 600;
//           color: #374151;
//           margin-bottom: 0.5rem;
//         }
//         .empty-text {
//           color: #6b7280;
//         }
//         .alert {
//           margin-top: 1rem;
//           background: #fffbeb;
//           border-left: 4px solid #f59e0b;
//           border-radius: 0.5rem;
//           padding: 1rem;
//           max-width: 48rem;
//           margin-left: auto;
//           margin-right: auto;
//           display: flex;
//           align-items: center;
//         }
//         .alert-content {
//           display: flex;
//           align-items: center;
//           flex: 1;
//         }
//         .alert-icon {
//           flex-shrink: 0;
//           width: 1.25rem;
//           height: 1.25rem;
//           color: #f59e0b;
//         }
//         .alert-text {
//           margin-left: 0.75rem;
//           color: #92400e;
//           font-size: 0.875rem;
//         }
//         .debug-info {
//           background: #f0f9ff;
//           border: 1px solid #bae6fd;
//           color: #0369a1;
//           padding: 0.75rem;
//           border-radius: 0.5rem;
//           margin-bottom: 1rem;
//           font-size: 0.875rem;
//           font-family: monospace;
//         }
//         svg {
//           width: 1.25rem;
//           height: 1.25rem;
//         }
//       `}</style>
//     </ClientLayout>
//   );
// }
