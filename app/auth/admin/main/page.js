
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/app/ClientLayout';
export default function AdminPage() {
  const [stats, setStats] = useState({
    users: 0,
    admins: 0,
    customers: 0,
    orders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    cpu: '',
    ram: '',
    storage: '',
    display: '',
    gpu: '',
    mainImage: null,
    sideImage: null,
    backImage: null,
    mainImageUrl: '',
    sideImageUrl: '',
    backImageUrl: '',
    colors: ''
  });
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/admin/login');
      return;
    }
    if (!authLoading && user && user.role !== 'admin') {
      router.push('/');
      return;
    }
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setError('');
      const currentToken = token || localStorage.getItem('token');
      if (!currentToken) {
        setError('No authentication token. Please login again.');
        router.push('/auth/admin/login');
        return;
      }
      // Fetch all data in parallel
      const [statsResponse, usersResponse, ordersResponse, customersResponse, productsResponse] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        }).catch(() => ({ ok: false })),
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        }).catch(() => ({ ok: false })),
        fetch('/api/admin/orders', {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        }).catch(() => ({ ok: false })),
        fetch('/api/admin/customers', {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        }).catch(() => ({ ok: false })),
        fetch('/api/admin/products', {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        }).catch(() => ({ ok: false }))
      ]);
      // Handle stats
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || stats);
      }
      // Handle users
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }
      // Handle orders
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData.orders || []);
      }
      // Handle customers
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        setCustomers(customersData.customers || []);
      }
      // Handle products
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.products || []);
      }
    } catch (err) {
      setError('Error loading dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const toggleUserRole = async (userId, currentRole) => {
    try {
      const currentToken = token || localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          userId,
          role: currentRole === 'admin' ? 'user' : 'admin'
        })
      });
      const data = await response.json();
      if (response.ok) {
        // Update local state immediately
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u._id === userId
              ? { ...u, role: currentRole === 'admin' ? 'user' : 'admin' }
              : u
          )
        );
        // Update stats
        setStats(prev => ({
          ...prev,
          admins: currentRole === 'admin' ? prev.admins - 1 : prev.admins + 1
        }));
      } else {
        alert(data.error || 'Failed to update user role');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating user role');
    }
  };
  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const currentToken = token || localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (response.ok) {
        // Remove from local state
        setUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
        // Update stats
        const deletedUser = users.find(u => u._id === userId);
        if (deletedUser) {
          setStats(prev => ({
            ...prev,
            users: prev.users - 1,
            admins: deletedUser.role === 'admin' ? prev.admins - 1 : prev.admins
          }));
        }
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting user');
    }
  };
  const updateOrderStatus = async (orderId, status) => {
    try {
      const currentToken = token || localStorage.getItem('token');
      if (!currentToken) {
        setError('No authentication token. Please login again.');
        return;
      }
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (response.ok) {
        // Update the order in state immediately for better UX
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId
              ? { ...order, status: data.order.status }
              : order
          )
        );
        // Update stats if needed
        if (status === 'delivered') {
          setStats(prev => ({
            ...prev,
            pendingOrders: prev.pendingOrders - 1,
            completedOrders: prev.completedOrders + 1
          }));
        } else if (status === 'pending') {
          setStats(prev => ({
            ...prev,
            pendingOrders: prev.pendingOrders + 1,
            completedOrders: prev.completedOrders - 1
          }));
        }
      } else {
        alert(data.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Error updating order status');
    }
  };
  const viewOrderDetails = (order) => {
    const items = order.items || [];
    const itemsList = items.map(item =>
      `- ${item.name || 'N/A'} (Qty: ${item.quantity || 0}, Price: $${Number(item.price || 0).toFixed(2)})`
    ).join('\n');
    alert(`Order Details:\n\nOrder #: ${order.orderNumber || 'N/A'}\nCustomer: ${order.customer?.name || 'N/A'}\nEmail: ${order.customer?.email || 'N/A'}\nStatus: ${order.status || 'N/A'}\nTotal: $${Number(order.totalAmount || 0).toFixed(2)}\n\nItems:\n${itemsList || 'No items'}`);
  };
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const currentToken = token || localStorage.getItem('token');
      const formData = new FormData();
      // Append all product data
      formData.append('name', newProduct.name);
      formData.append('description', newProduct.description);
      formData.append('price', newProduct.price);
      formData.append('cpu', newProduct.cpu);
      formData.append('ram', newProduct.ram);
      formData.append('storage', newProduct.storage);
      formData.append('display', newProduct.display);
      formData.append('gpu', newProduct.gpu);
      // Append images if selected
      if (newProduct.mainImage) formData.append('mainImage', newProduct.mainImage);
      if (newProduct.sideImage) formData.append('sideImage', newProduct.sideImage);
      if (newProduct.backImage) formData.append('backImage', newProduct.backImage);

      formData.append('mainImageUrl', newProduct.mainImageUrl);
      formData.append('sideImageUrl', newProduct.sideImageUrl);
      formData.append('backImageUrl', newProduct.backImageUrl);

      formData.append(`colors`, newProduct.colors);

      // Append additional images
      newProduct.additionalImages.forEach((img, index) => {
        if (img.file) formData.append(`additionalImage_${index}`, img.file);
        if (img.url) formData.append(`additionalImageUrl_${index}`, img.url);
      });

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        alert('Product added successfully!');
        setShowAddProduct(false);
        setNewProduct({
          name: '',
          description: '',
          price: '',
          cpu: '',
          ram: '',
          storage: '',
          display: '',
          gpu: '',
          mainImage: null,
          sideImage: null,
          backImage: null,
          mainImageUrl: '',
          sideImageUrl: '',
          backImageUrl: '',
          colors: '',
          additionalImages: []
        });
        fetchDashboardData(); // Refresh products list
      } else {
        alert(data.error || 'Failed to add product');
      }
    } catch (err) {
      console.error('Error adding product:', err);
      alert('Error adding product');
    }
  };
  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const currentToken = token || localStorage.getItem('token');
      const response = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ productId })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Product deleted successfully!');
        fetchDashboardData(); // Refresh products list
      } else {
        alert(data.error || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Error deleting product');
    }
  };
  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setNewProduct(prev => ({ ...prev, [field]: file }));
    }
  };
  if (authLoading) {
    return (
      <ClientLayout>
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #dc2626',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p>Loading...</p>
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
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        minHeight: '80vh',
        padding: '2.5rem 1rem 4rem',
        background: 'var(--bg-canvas, #F7F8FA)'
      }}>
        <div style={{ maxWidth: '84rem', margin: '0 auto' }}>
          <div style={{
            background: 'white',
            borderRadius: '28px',
            padding: '2.5rem',
            border: '1px solid rgba(0, 0, 0, 0.07)',
            boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.02)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  background: '#0B0B0D',
                  color: 'white',
                  width: '3.2rem',
                  height: '3.2rem',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem',
                  boxShadow: '0 8px 24px rgba(11, 11, 13, 0.25)'
                }}>
                  <svg style={{ width: '1.6rem', height: '1.6rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div style={{
                    display: 'inline-block',
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    color: '#0866FF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    background: 'rgba(8, 102, 255, 0.08)',
                    padding: '2px 9px',
                    borderRadius: '9999px',
                    marginBottom: '4px'
                  }}>
                    Command Center
                  </div>
                  <h1 style={{
                    fontSize: '1.9rem',
                    fontWeight: '850',
                    color: '#080808',
                    letterSpacing: '-0.02em',
                    margin: 0
                  }}>
                    Admin Dashboard
                  </h1>
                  <p style={{ color: '#64748B', margin: '0.15rem 0 0 0', fontSize: '0.9rem' }}>
                    Welcome back, {user.name || 'Admin'}
                  </p>
                </div>
              </div>
              <button
                onClick={fetchDashboardData}
                disabled={refreshing}
                style={{
                  background: refreshing ? '#9ca3af' : '#0B0B0D',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '9999px',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  fontWeight: '750',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                }}
                onMouseOver={(e) => { if (!refreshing) e.currentTarget.style.background = '#0866FF'; }}
                onMouseOut={(e) => { if (!refreshing) e.currentTarget.style.background = '#0B0B0D'; }}
              >
                {refreshing ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.6rem',
              marginBottom: '2rem',
              paddingBottom: '1.25rem',
              borderBottom: '1px solid #EEF0F3',
              overflowX: 'auto'
            }}>
              {[
                { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                { id: 'users', label: 'Users', icon: '👥' },
                { id: 'products', label: 'Products', icon: '💻' },
                { id: 'orders', label: 'Orders', icon: '📦' },
                { id: 'customers', label: 'Customers', icon: '🛍️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.65rem 1.4rem',
                    background: activeTab === tab.id ? '#0B0B0D' : '#F8FAFC',
                    color: activeTab === tab.id ? '#FFFFFF' : '#64748B',
                    border: activeTab === tab.id ? '1.5px solid #0B0B0D' : '1.5px solid #E2E8F0',
                    borderRadius: '9999px',
                    fontWeight: '750',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: activeTab === tab.id ? '0 4px 14px rgba(11, 11, 13, 0.2)' : 'none'
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #dc2626',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }}></div>
                <p>Loading dashboard...</p>
              </div>
            ) : (
              <>
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                  <div>
                    {/* Stats Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1.5rem',
                      marginBottom: '2rem'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                        border: '1px solid #93c5fd',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        textAlign: 'center',
                        transition: 'transform 0.2s'
                      }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '0.5rem' }}>
                          {stats.users || 0}
                        </div>
                        <div style={{ color: '#1e3a8a', fontWeight: '600' }}>👥 Total Users</div>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                        border: '1px solid #86efac',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        textAlign: 'center',
                        transition: 'transform 0.2s'
                      }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d', marginBottom: '0.5rem' }}>
                          {stats.admins || 0}
                        </div>
                        <div style={{ color: '#166534', fontWeight: '600' }}>👑 Admins</div>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                        border: '1px solid #fcd34d',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        textAlign: 'center',
                        transition: 'transform 0.2s'
                      }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.5rem' }}>
                          ${Number(stats.totalRevenue || 0).toFixed(2)}
                        </div>
                        <div style={{ color: '#92400e', fontWeight: '600' }}>💰 Total Revenue</div>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                        border: '1px solid #fca5a5',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        textAlign: 'center',
                        transition: 'transform 0.2s'
                      }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#991b1b', marginBottom: '0.5rem' }}>
                          {stats.pendingOrders || 0}
                        </div>
                        <div style={{ color: '#7f1d1d', fontWeight: '600' }}>⏳ Pending Orders</div>
                      </div>
                    </div>
                    {/* Recent Orders */}
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📦 Recent Orders
                      </h3>
                      {orders.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '3rem',
                          background: '#f9fafb',
                          borderRadius: '0.5rem',
                          color: '#6b7280'
                        }}>
                          <p>No orders found</p>
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f3f4f6' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Order #</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Customer</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Amount</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Status</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.slice(0, 5).map(order => (
                                <tr key={order._id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s' }}>
                                  <td style={{ padding: '0.75rem' }}>#{order.orderNumber || 'N/A'}</td>
                                  <td style={{ padding: '0.75rem' }}>{order.customer?.name || 'N/A'}</td>
                                  <td style={{ padding: '0.75rem', fontWeight: '600' }}>${Number(order.totalAmount || 0).toFixed(2)}</td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <span style={{
                                      background: order.status === 'delivered' ? '#10b981' :
                                        order.status === 'pending' ? '#f59e0b' :
                                          order.status === 'processing' ? '#3b82f6' :
                                            order.status === 'shipped' ? '#8b5cf6' :
                                              order.status === 'cancelled' ? '#ef4444' : '#6b7280',
                                      color: 'white',
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: '9999px',
                                      fontSize: '0.75rem',
                                      fontWeight: '600'
                                    }}>
                                      {order.status || 'N/A'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                                    {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      👥 User Management
                    </h3>
                    {users.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: '#f9fafb',
                        borderRadius: '0.5rem',
                        color: '#6b7280'
                      }}>
                        <p>No users found</p>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f3f4f6' }}>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Role</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Joined</th>
                              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map(u => (
                              <tr key={u._id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s' }}>
                                <td style={{ padding: '0.75rem' }}>
                                  {u.name || 'N/A'}
                                  {u._id === user._id && (
                                    <span style={{
                                      marginLeft: '0.5rem',
                                      fontSize: '0.75rem',
                                      background: '#3b82f6',
                                      color: 'white',
                                      padding: '0.125rem 0.5rem',
                                      borderRadius: '0.25rem'
                                    }}>You</span>
                                  )}
                                </td>
                                <td style={{ padding: '0.75rem' }}>{u.email || 'N/A'}</td>
                                <td style={{ padding: '0.75rem' }}>
                                  <span style={{
                                    background: u.role === 'admin' ? '#dc2626' : '#6b7280',
                                    color: 'white',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                  }}>
                                    {u.role === 'admin' ? '👑 Admin' : '👤 User'}
                                  </span>
                                </td>
                                <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  <button
                                    onClick={() => toggleUserRole(u._id, u.role)}
                                    disabled={u._id === user._id}
                                    style={{
                                      background: u._id === user._id ? '#d1d5db' : '#3b82f6',
                                      color: 'white',
                                      border: 'none',
                                      padding: '0.375rem 0.75rem',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem',
                                      cursor: u._id === user._id ? 'not-allowed' : 'pointer',
                                      marginRight: '0.5rem',
                                      transition: 'background 0.2s'
                                    }}
                                  >
                                    {u.role === 'admin' ? 'Demote' : 'Promote'}
                                  </button>
                                  <button
                                    onClick={() => deleteUser(u._id)}
                                    disabled={u._id === user._id}
                                    style={{
                                      background: u._id === user._id ? '#d1d5db' : '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      padding: '0.375rem 0.75rem',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem',
                                      cursor: u._id === user._id ? 'not-allowed' : 'pointer',
                                      transition: 'background 0.2s'
                                    }}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📦 Order Management
                    </h3>
                    {orders.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: '#f9fafb',
                        borderRadius: '0.5rem',
                        color: '#6b7280'
                      }}>
                        <p>No orders found</p>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f3f4f6' }}>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Order #</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Customer</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Items</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Total</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Status</th>
                              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map(order => (
                              <tr key={order._id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s' }}>
                                <td style={{ padding: '0.75rem', fontWeight: '600' }}>#{order.orderNumber || 'N/A'}</td>
                                <td style={{ padding: '0.75rem' }}>{order.customer?.name || 'N/A'}</td>
                                <td style={{ padding: '0.75rem' }}>{(order.items || []).length} items</td>
                                <td style={{ padding: '0.75rem', fontWeight: '600' }}>${Number(order.totalAmount || 0).toFixed(2)}</td>
                                <td style={{ padding: '0.75rem' }}>
                                  <select
                                    value={order.status || 'pending'}
                                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                    style={{
                                      padding: '0.375rem 0.5rem',
                                      borderRadius: '0.375rem',
                                      border: '1px solid #d1d5db',
                                      fontSize: '0.875rem',
                                      minWidth: '140px',
                                      cursor: 'pointer',
                                      background: 'white'
                                    }}
                                  >
                                    <option value="pending">⏳ Pending</option>
                                    <option value="processing">🔄 Processing</option>
                                    <option value="shipped">📦 Shipped</option>
                                    <option value="delivered">✅ Delivered</option>
                                    <option value="cancelled">❌ Cancelled</option>
                                  </select>
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  <button
                                    onClick={() => viewOrderDetails(order)}
                                    style={{
                                      background: '#3b82f6',
                                      color: 'white',
                                      border: 'none',
                                      padding: '0.375rem 0.75rem',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.target.style.background = '#2563eb'}
                                    onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                {/* Customers Tab */}
                {activeTab === 'customers' && (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🛍️ Customer Management
                    </h3>
                    {customers.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: '#f9fafb',
                        borderRadius: '0.5rem',
                        color: '#6b7280'
                      }}>
                        <p>No customers found</p>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f3f4f6' }}>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Phone</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Address</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Joined</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customers.map(customer => (
                              <tr key={customer._id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s' }}>
                                <td style={{ padding: '0.75rem' }}>{customer.name || 'N/A'}</td>
                                <td style={{ padding: '0.75rem' }}>{customer.email || 'N/A'}</td>
                                <td style={{ padding: '0.75rem' }}>{customer.phone || 'N/A'}</td>
                                <td style={{ padding: '0.75rem' }}>{customer.address || 'N/A'}</td>
                                <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                                  {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                {/* Products Tab */}
                {activeTab === 'products' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#080808', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        💻 Product Catalog Management
                      </h3>
                      <button
                        onClick={() => setShowAddProduct(!showAddProduct)}
                        style={{
                          background: showAddProduct ? '#64748B' : '#0B0B0D',
                          color: 'white',
                          border: 'none',
                          padding: '0.7rem 1.4rem',
                          borderRadius: '9999px',
                          cursor: 'pointer',
                          fontWeight: '750',
                          fontSize: '0.88rem',
                          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: '0 4px 14px rgba(11, 11, 13, 0.15)'
                        }}
                        onMouseOver={(e) => { if (!showAddProduct) e.currentTarget.style.background = '#0866FF'; }}
                        onMouseOut={(e) => { if (!showAddProduct) e.currentTarget.style.background = '#0B0B0D'; }}
                      >
                        {showAddProduct ? 'Cancel' : '+ Add New Product'}
                      </button>
                    </div>
                    {/* Add Product Form */}
                    {showAddProduct && (
                      <div style={{
                        background: '#f9fafb',
                        padding: '2rem',
                        borderRadius: '0.75rem',
                        marginBottom: '2rem',
                        border: '2px solid #e5e7eb'
                      }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', color: '#374151' }}>
                          Add New Laptop
                        </h4>
                        <form onSubmit={handleAddProduct}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>Product Name *</label>
                              <input
                                type="text"
                                required
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '0.5rem',
                                  fontSize: '1rem'
                                }}
                                placeholder="e.g., Gaming Beast X1"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>Price (AED) *</label>
                              <input
                                type="number"
                                required
                                value={newProduct.price}
                                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '0.5rem',
                                  fontSize: '1rem'
                                }}
                                placeholder="e.g., 2500"
                              />
                            </div>
                          </div>
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>Description *</label>
                            <textarea
                              required
                              value={newProduct.description}
                              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                              rows={3}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.5rem',
                                fontSize: '1rem',
                                resize: 'vertical'
                              }}
                              placeholder="Brief description of the laptop..."
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>CPU *</label>
                              <input
                                type="text"
                                required
                                value={newProduct.cpu}
                                onChange={(e) => setNewProduct({ ...newProduct, cpu: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '0.5rem',
                                  fontSize: '1rem'
                                }}
                                placeholder="e.g., Intel Core i7-11800H"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>RAM *</label>
                              <input
                                type="text"
                                required
                                value={newProduct.ram}
                                onChange={(e) => setNewProduct({ ...newProduct, ram: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '0.5rem',
                                  fontSize: '1rem'
                                }}
                                placeholder="e.g., 16GB DDR4"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>Storage *</label>
                              <input
                                type="text"
                                required
                                value={newProduct.storage}
                                onChange={(e) => setNewProduct({ ...newProduct, storage: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '0.5rem',
                                  fontSize: '1rem'
                                }}
                                placeholder="e.g., 512GB SSD"
                              />
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>Display *</label>
                              <input
                                type="text"
                                required
                                value={newProduct.display}
                                onChange={(e) => setNewProduct({ ...newProduct, display: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '0.5rem',
                                  fontSize: '1rem'
                                }}
                                placeholder="e.g., 15.6 inch 144Hz FHD"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>GPU *</label>
                              <input
                                type="text"
                                required
                                value={newProduct.gpu}
                                onChange={(e) => setNewProduct({ ...newProduct, gpu: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '0.5rem',
                                  fontSize: '1rem'
                                }}
                                placeholder="e.g., NVIDIA RTX 3060"
                              />
                            </div>
                          </div>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <h5 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>Product Images</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                              <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Main Image</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Method 1: From Your Device</div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'mainImage')}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '0.5rem',
                                      fontSize: '0.875rem'
                                    }}
                                  />
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Method 2: From URL (Google Drive, etc.)</div>
                                  <input
                                    type="text"
                                    placeholder="https://example.com/photo.jpg"
                                    value={newProduct.mainImageUrl}
                                    onChange={(e) => setNewProduct({ ...newProduct, mainImageUrl: e.target.value })}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '0.5rem',
                                      fontSize: '0.875rem'
                                    }}
                                  />
                                </div>
                                {newProduct.mainImage && <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>✓ {newProduct.mainImage.name}</p>}
                              </div>
                              <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Side Image</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Method 1: From Device</div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'sideImage')}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '0.5rem',
                                      fontSize: '0.875rem'
                                    }}
                                  />
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Method 2: From URL</div>
                                  <input
                                    type="text"
                                    placeholder="https://..."
                                    value={newProduct.sideImageUrl}
                                    onChange={(e) => setNewProduct({ ...newProduct, sideImageUrl: e.target.value })}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '0.5rem',
                                      fontSize: '0.875rem'
                                    }}
                                  />
                                </div>
                                {newProduct.sideImage && <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>✓ {newProduct.sideImage.name}</p>}
                              </div>
                              <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Back Image</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Method 1: From Device</div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'backImage')}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '0.5rem',
                                      fontSize: '0.875rem'
                                    }}
                                  />
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Method 2: From URL</div>
                                  <input
                                    type="text"
                                    placeholder="https://..."
                                    value={newProduct.backImageUrl}
                                    onChange={(e) => setNewProduct({ ...newProduct, backImageUrl: e.target.value })}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '0.5rem',
                                      fontSize: '0.875rem'
                                    }}
                                  />
                                </div>
                                {newProduct.backImage && <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>✓ {newProduct.backImage.name}</p>}

                                <div style={{ marginTop: '1.5rem' }}>
                                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                                    Available Colors (comma separated)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Space Grey, Silver, Midnight"
                                    value={newProduct.colors}
                                    onChange={(e) => setNewProduct({ ...newProduct, colors: e.target.value })}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '0.5rem',
                                      fontSize: '0.875rem'
                                    }}
                                  />
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    {newProduct.colors.split(',').map(c => c.trim()).filter(Boolean).map((c, i) => (
                                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                        <span style={{
                                          width: '10px',
                                          height: '10px',
                                          borderRadius: '50%',
                                          background: (name => {
                                            const mapping = { 'space grey': '#53565a', 'space gray': '#53565a', 'silver': '#c0c0c0', 'midnight': '#191970', 'starlight': '#f0ead6', 'rose gold': '#b76e79', 'gold': '#ffd700', 'graphite': '#41424c', 'black': '#1c1c1c', 'white': '#f5f5f7', 'blue': '#007aff' };
                                            return mapping[name.toLowerCase()] || name;
                                          })(c),
                                          border: '1px solid rgba(0,0,0,0.1)'
                                        }}></span>
                                        {c}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Additional Images Section */}
                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h6 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Additional Images</h6>
                                <button
                                  type="button"
                                  onClick={() => setNewProduct({
                                    ...newProduct,
                                    additionalImages: [...newProduct.additionalImages, { file: null, url: '' }]
                                  })}
                                  style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.4rem 1rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                                  }}
                                >
                                  <span>+</span> Add Another Photo Slot
                                </button>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                {newProduct.additionalImages.map((img, index) => (
                                  <div key={index} style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '0.5rem', position: 'relative' }}>
                                    <button
                                      type="button"
                                      onClick={() => setNewProduct({
                                        ...newProduct,
                                        additionalImages: newProduct.additionalImages.filter((_, i) => i !== index)
                                      })}
                                      style={{
                                        position: 'absolute',
                                        top: '0.25rem',
                                        right: '0.25rem',
                                        background: '#fee2e2',
                                        color: '#ef4444',
                                        border: 'none',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      ✕
                                    </button>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const updated = [...newProduct.additionalImages];
                                          updated[index].file = e.target.files[0];
                                          setNewProduct({ ...newProduct, additionalImages: updated });
                                        }}
                                        style={{ width: '100%', fontSize: '0.75rem' }}
                                      />
                                      <input
                                        type="text"
                                        placeholder="Or image URL"
                                        value={img.url}
                                        onChange={(e) => {
                                          const updated = [...newProduct.additionalImages];
                                          updated[index].url = e.target.value;
                                          setNewProduct({ ...newProduct, additionalImages: updated });
                                        }}
                                        style={{
                                          width: '100%',
                                          padding: '0.25rem 0.5rem',
                                          border: '1px solid #d1d5db',
                                          borderRadius: '0.25rem',
                                          fontSize: '0.75rem'
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button
                            type="submit"
                            style={{
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: 'white',
                              border: 'none',
                              padding: '0.875rem 2rem',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '1rem',
                              width: '100%',
                              transition: 'all 0.2s',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            ✅ Add Product
                          </button>
                        </form>
                      </div>
                    )}
                    {/* Products List */}
                    {products.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: '#f9fafb',
                        borderRadius: '0.5rem',
                        color: '#6b7280'
                      }}>
                        <p>No products found</p>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #EEF0F3' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #EEF0F3' }}>
                              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>Item ID</th>
                              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>Device</th>
                              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>Product Name</th>
                              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>Price</th>
                              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>Finishes</th>
                              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>Specifications</th>
                              <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B', textAlign: 'center' }}>Manage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map(product => {
                              const prodId = product._id || product.id;
                              const rawImg = product.image || (Array.isArray(product.images) && product.images[0]);
                              const cleanImg = rawImg?.startsWith('http') ? rawImg : `/${String(rawImg || '').replace(/^\/+/, '')}`;
                              return (
                                <tr key={prodId} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                                  <td style={{ padding: '1rem' }}>
                                    <span style={{
                                      background: '#F1F5F9',
                                      color: '#0F172A',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.78rem',
                                      fontFamily: 'monospace',
                                      fontWeight: '700'
                                    }}>
                                      #{String(prodId).slice(-8)}
                                    </span>
                                  </td>
                                  <td style={{ padding: '1rem' }}>
                                    <img
                                      src={cleanImg || '/placeholder.jpg'}
                                      alt={product.name}
                                      style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}
                                      onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                                    />
                                  </td>
                                  <td style={{ padding: '1rem', fontWeight: '750', color: '#080808', fontSize: '0.92rem' }}>
                                    {product.name}
                                  </td>
                                  <td style={{ padding: '1rem', color: '#080808', fontWeight: '800', fontSize: '0.92rem' }}>
                                    AED {Number(product.price).toLocaleString()}
                                  </td>
                                  <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                                      {product.colors && product.colors.map((c, i) => (
                                        <span key={i} title={c} style={{
                                          width: '13px',
                                          height: '13px',
                                          borderRadius: '50%',
                                          background: (name => {
                                            const mapping = { 'space grey': '#53565a', 'space gray': '#53565a', 'silver': '#c0c0c0', 'midnight': '#191970', 'starlight': '#f0ead6', 'rose gold': '#b76e79', 'gold': '#ffd700', 'graphite': '#41424c', 'black': '#1c1c1c', 'white': '#f5f5f7', 'blue': '#007aff' };
                                            return mapping[name.toLowerCase()] || name;
                                          })(c),
                                          border: '1px solid rgba(0,0,0,0.15)'
                                        }}></span>
                                      ))}
                                      {(!product.colors || product.colors.length === 0) && <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>None</span>}
                                    </div>
                                  </td>
                                  <td style={{ padding: '1rem', fontSize: '0.82rem', color: '#64748B', lineHeight: '1.4' }}>
                                    <strong style={{ color: '#334155' }}>{product.specs?.cpu || 'Core'}</strong><br />
                                    {product.specs?.ram || 'RAM'} • {product.specs?.storage || 'Storage'}
                                  </td>
                                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                      <button
                                        onClick={() => router.push(`/auth/admin/products/edit/${prodId}`)}
                                        style={{
                                          background: '#0B0B0D',
                                          color: 'white',
                                          border: 'none',
                                          padding: '0.45rem 1rem',
                                          borderRadius: '9999px',
                                          fontSize: '0.8rem',
                                          fontWeight: '750',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.4rem',
                                          transition: 'all 0.15s ease',
                                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#0866FF'}
                                        onMouseOut={(e) => e.currentTarget.style.background = '#0B0B0D'}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProduct(prodId)}
                                        style={{
                                          background: '#FEF2F2',
                                          color: '#DC2626',
                                          border: '1px solid #FECACA',
                                          padding: '0.45rem 0.9rem',
                                          borderRadius: '9999px',
                                          fontSize: '0.8rem',
                                          fontWeight: '750',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.4rem',
                                          transition: 'all 0.15s ease'
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.background = '#DC2626'; e.currentTarget.style.color = '#FFFFFF'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div >
    </ClientLayout >
  );
}