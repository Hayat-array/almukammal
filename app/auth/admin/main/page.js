// // 'use client';

// // import { useEffect, useState } from 'react';
// // import { useRouter } from 'next/navigation';
// // import { useAuth } from '@/contexts/AuthContext';
// // import ClientLayout from '@/app/ClientLayout';

// // export default function AdminPage() {
// //   const [stats, setStats] = useState({
// //     users: 0,
// //     admins: 0,
// //     customers: 0,
// //     orders: 0,
// //     pendingOrders: 0,
// //     completedOrders: 0,
// //     totalRevenue: 0
// //   });
// //   const [users, setUsers] = useState([]);
// //   const [orders, setOrders] = useState([]);
// //   const [customers, setCustomers] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState('');
// //   const [activeTab, setActiveTab] = useState('dashboard');
// //   const { user, token, loading: authLoading } = useAuth();
// //   const router = useRouter();

// //   useEffect(() => {
// //     if (!authLoading && !user) {
// //       router.push('/auth/admin/login');
// //       return;
// //     }

// //     if (!authLoading && user && user.role !== 'admin') {
// //       router.push('/');
// //       return;
// //     }

// //     if (user && user.role === 'admin') {
// //       fetchDashboardData();
// //     }
// //   }, [user, authLoading, router]);

// //   const fetchDashboardData = async () => {
// //     try {
// //       // Fetch stats
// //       const statsResponse = await fetch('/api/admin/stats', {
// //         headers: {
// //           'Authorization': `Bearer ${token}`
// //         }
// //       });

// //       if (statsResponse.ok) {
// //         const statsData = await statsResponse.json();
// //         setStats(statsData.stats);
// //       }

// //       // Fetch users
// //       const usersResponse = await fetch('/api/admin/users', {
// //         headers: {
// //           'Authorization': `Bearer ${token}`
// //         }
// //       });

// //       if (usersResponse.ok) {
// //         const usersData = await usersResponse.json();
// //         setUsers(usersData.users || []);
// //       }

// //       // Fetch orders
// //       const ordersResponse = await fetch('/api/admin/orders', {
// //         headers: {
// //           'Authorization': `Bearer ${token}`
// //         }
// //       });

// //       if (ordersResponse.ok) {
// //         const ordersData = await ordersResponse.json();
// //         setOrders(ordersData.orders || []);
// //       }

// //       // Fetch customers
// //       const customersResponse = await fetch('/api/admin/customers', {
// //         headers: {
// //           'Authorization': `Bearer ${token}`
// //         }
// //       });

// //       if (customersResponse.ok) {
// //         const customersData = await customersResponse.json();
// //         setCustomers(customersData.customers || []);
// //       }
// //     } catch (err) {
// //       setError('Error loading dashboard data');
// //       console.error(err);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const toggleUserRole = async (userId, currentRole) => {
// //     try {
// //       const response = await fetch('/api/admin/users', {
// //         method: 'PATCH',
// //         headers: {
// //           'Content-Type': 'application/json',
// //           'Authorization': `Bearer ${token}`
// //         },
// //         body: JSON.stringify({
// //           userId,
// //           role: currentRole === 'admin' ? 'user' : 'admin'
// //         })
// //       });

// //       if (response.ok) {
// //         fetchDashboardData();
// //       } else {
// //         alert('Failed to update user role');
// //       }
// //     } catch (err) {
// //       console.error(err);
// //       alert('Error updating user role');
// //     }
// //   };

// //   const deleteUser = async (userId) => {
// //     if (!confirm('Are you sure you want to delete this user?')) return;

// //     try {
// //       const response = await fetch('/api/admin/users', {
// //         method: 'DELETE',
// //         headers: {
// //           'Content-Type': 'application/json',
// //           'Authorization': `Bearer ${token}`
// //         },
// //         body: JSON.stringify({ userId })
// //       });

// //       if (response.ok) {
// //         fetchDashboardData();
// //       } else {
// //         alert('Failed to delete user');
// //       }
// //     } catch (err) {
// //       console.error(err);
// //       alert('Error deleting user');
// //     }
// //   };

// //   const updateOrderStatus = async (orderId, status) => {
// //     try {
// //       const response = await fetch(`/api/admin/orders/${orderId}/status`, {
// //         method: 'PATCH',
// //         headers: {
// //           'Content-Type': 'application/json',
// //           'Authorization': `Bearer ${token}`
// //         },
// //         body: JSON.stringify({ status })
// //       });

// //       if (response.ok) {
// //         fetchDashboardData();
// //       } else {
// //         alert('Failed to update order status');
// //       }
// //     } catch (err) {
// //       console.error(err);
// //       alert('Error updating order status');
// //     }
// //   };

// //   if (authLoading) {
// //     return (
// //       <ClientLayout>
// //         <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
// //           <p>Loading...</p>
// //         </div>
// //       </ClientLayout>
// //     );
// //   }

// //   if (!user || user.role !== 'admin') {
// //     return null;
// //   }

// //   return (
// //     <ClientLayout>
// //       <div style={{ 
// //         minHeight: '80vh', 
// //         padding: '2rem 0',
// //         background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
// //       }}>
// //         <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
// //           <div style={{ 
// //             background: 'white', 
// //             borderRadius: '1rem', 
// //             padding: '2rem',
// //             boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
// //           }}>
// //             {/* Header */}
// //             <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
// //               <div style={{
// //                 background: '#dc2626',
// //                 color: 'white',
// //                 width: '3rem',
// //                 height: '3rem',
// //                 borderRadius: '0.5rem',
// //                 display: 'flex',
// //                 alignItems: 'center',
// //                 justifyContent: 'center',
// //                 marginRight: '1rem'
// //               }}>
// //                 <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
// //                 </svg>
// //               </div>
// //               <div>
// //                 <h1 style={{ 
// //                   fontSize: '2rem', 
// //                   fontWeight: 'bold', 
// //                   color: '#1f2937'
// //                 }}>
// //                   Admin Dashboard
// //                 </h1>
// //                 <p style={{ color: '#6b7280' }}>
// //                   Welcome back, {user.name}
// //                 </p>
// //               </div>
// //             </div>

// //             {error && (
// //               <div style={{ 
// //                 background: '#fee2e2', 
// //                 border: '1px solid #ef4444',
// //                 color: '#991b1b',
// //                 padding: '1rem',
// //                 borderRadius: '0.5rem',
// //                 marginBottom: '1rem'
// //               }}>
// //                 {error}
// //               </div>
// //             )}

// //             {/* Tabs */}
// //             <div style={{ 
// //               display: 'flex', 
// //               gap: '0.5rem', 
// //               marginBottom: '2rem',
// //               borderBottom: '1px solid #e5e7eb'
// //             }}>
// //               {['dashboard', 'users', 'orders', 'customers'].map(tab => (
// //                 <button
// //                   key={tab}
// //                   onClick={() => setActiveTab(tab)}
// //                   style={{
// //                     padding: '0.75rem 1.5rem',
// //                     background: activeTab === tab ? '#dc2626' : 'transparent',
// //                     color: activeTab === tab ? 'white' : '#6b7280',
// //                     border: 'none',
// //                     borderRadius: '0.5rem 0.5rem 0 0',
// //                     fontWeight: '600',
// //                     cursor: 'pointer',
// //                     textTransform: 'capitalize'
// //                   }}
// //                 >
// //                   {tab}
// //                 </button>
// //               ))}
// //             </div>

// //             {loading ? (
// //               <div style={{ textAlign: 'center', padding: '3rem' }}>
// //                 <p>Loading...</p>
// //               </div>
// //             ) : (
// //               <>
// //                 {/* Dashboard Tab */}
// //                 {activeTab === 'dashboard' && (
// //                   <div>
// //                     {/* Stats Grid */}
// //                     <div style={{ 
// //                       display: 'grid', 
// //                       gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
// //                       gap: '1.5rem',
// //                       marginBottom: '2rem'
// //                     }}>
// //                       <div style={{ 
// //                         background: '#f0f9ff',
// //                         border: '1px solid #bae6fd',
// //                         borderRadius: '0.75rem',
// //                         padding: '1.5rem',
// //                         textAlign: 'center'
// //                       }}>
// //                         <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0369a1', marginBottom: '0.5rem' }}>
// //                           {stats.users}
// //                         </div>
// //                         <div style={{ color: '#0c4a6e', fontWeight: '600' }}>Total Users</div>
// //                       </div>
                      
// //                       <div style={{ 
// //                         background: '#f0fdf4',
// //                         border: '1px solid #bbf7d0',
// //                         borderRadius: '0.75rem',
// //                         padding: '1.5rem',
// //                         textAlign: 'center'
// //                       }}>
// //                         <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d', marginBottom: '0.5rem' }}>
// //                           {stats.orders}
// //                         </div>
// //                         <div style={{ color: '#166534', fontWeight: '600' }}>Total Orders</div>
// //                       </div>
                      
// //                       <div style={{ 
// //                         background: '#fef3c7',
// //                         border: '1px solid #fcd34d',
// //                         borderRadius: '0.75rem',
// //                         padding: '1.5rem',
// //                         textAlign: 'center'
// //                       }}>
// //                         <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.5rem' }}>
// //                           ${stats.totalRevenue.toFixed(2)}
// //                         </div>
// //                         <div style={{ color: '#92400e', fontWeight: '600' }}>Total Revenue</div>
// //                       </div>

// //                       <div style={{ 
// //                         background: '#fee2e2',
// //                         border: '1px solid #fecaca',
// //                         borderRadius: '0.75rem',
// //                         padding: '1.5rem',
// //                         textAlign: 'center'
// //                       }}>
// //                         <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#991b1b', marginBottom: '0.5rem' }}>
// //                           {stats.pendingOrders}
// //                         </div>
// //                         <div style={{ color: '#7f1d1d', fontWeight: '600' }}>Pending Orders</div>
// //                       </div>
// //                     </div>

// //                     {/* Recent Orders */}
// //                     <div>
// //                       <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
// //                         Recent Orders
// //                       </h3>
// //                       <div style={{ overflowX: 'auto' }}>
// //                         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
// //                           <thead>
// //                             <tr style={{ background: '#f3f4f6' }}>
// //                               <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Order #</th>
// //                               <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Customer</th>
// //                               <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Amount</th>
// //                               <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Status</th>
// //                               <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Date</th>
// //                             </tr>
// //                           </thead>
// //                           <tbody>
// //                             {orders.slice(0, 5).map(order => (
// //                               <tr key={order._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
// //                                 <td style={{ padding: '0.75rem' }}>#{order.orderNumber}</td>
// //                                 <td style={{ padding: '0.75rem' }}>{order.customer?.name || 'N/A'}</td>
// //                                 <td style={{ padding: '0.75rem' }}>${order.totalAmount.toFixed(2)}</td>
// //                                 <td style={{ padding: '0.75rem' }}>
// //                                   <span style={{
// //                                     background: order.status === 'delivered' ? '#10b981' : 
// //                                               order.status === 'pending' ? '#f59e0b' : '#6b7280',
// //                                     color: 'white',
// //                                     padding: '0.25rem 0.5rem',
// //                                     borderRadius: '0.25rem',
// //                                     fontSize: '0.75rem'
// //                                   }}>
// //                                     {order.status}
// //                                   </span>
// //                                 </td>
// //                                 <td style={{ padding: '0.75rem' }}>
// //                                   {new Date(order.orderDate).toLocaleDateString()}
// //                                 </td>
// //                               </tr>
// //                             ))}
// //                           </tbody>
// //                         </table>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 )}

// //                 {/* Users Tab */}
// //                 {activeTab === 'users' && (
// //                   <div>
// //                     <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
// //                       User Management
// //                     </h3>
// //                     <div style={{ overflowX: 'auto' }}>
// //                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
// //                         <thead>
// //                           <tr style={{ background: '#f3f4f6' }}>
// //                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
// //                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
// //                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Role</th>
// //                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Joined</th>
// //                             <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Actions</th>
// //                           </tr>
// //                         </thead>
// //                         <tbody>
// //                           {users.map(u => (
// //                             <tr key={u._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
// //                               <td style={{ padding: '0.75rem' }}>
// //                                 {u.name}
// //                                 {u._id === user._id && (
// //                                   <span style={{ 
// //                                     marginLeft: '0.5rem',
// //                                     fontSize: '0.75rem',
// //                                     background: '#3b82f6',
// //                                     color: 'white',
// //                                     padding: '0.125rem 0.5rem',
// //                                     borderRadius: '0.25rem'
// //                                   }}>You</span>
// //                                 )}
// //                               </td>
// //                               <td style={{ padding: '0.75rem' }}>{u.email}</td>
// //                               <td style={{ padding: '0.75rem' }}>
// //                                 <span style={{ 
// //                                   background: u.role === 'admin' ? '#dc2626' : '#6b7280',
// //                                   color: 'white',
// //                                   padding: '0.25rem 0.75rem',
// //                                   borderRadius: '0.375rem',
// //                                   fontSize: '0.75rem',
// //                                   fontWeight: '600'
// //                                 }}>
// //                                   {u.role}
// //                                 </span>
// //                               </td>
// //                               <td style={{ padding: '0.75rem', color: '#6b7280' }}>
// //                                 {new Date(u.createdAt).toLocaleDateString()}
// //                               </td>
// //                               <td style={{ padding: '0.75rem', textAlign: 'center' }}>
// //                                 <button
// //                                   onClick={() => toggleUserRole(u._id, u.role)}
// //                                   disabled={u._id === user._id}
// //                                   style={{ 
// //                                     background: u._id === user._id ? '#d1d5db' : '#3b82f6',
// //                                     color: 'white',
// //                                     border: 'none',
// //                                     padding: '0.375rem 0.75rem',
// //                                     borderRadius: '0.375rem',
// //                                     fontSize: '0.75rem',
// //                                     cursor: u._id === user._id ? 'not-allowed' : 'pointer',
// //                                     marginRight: '0.5rem'
// //                                   }}
// //                                 >
// //                                   {u.role === 'admin' ? 'Demote' : 'Promote'}
// //                                 </button>
// //                                 <button
// //                                   onClick={() => deleteUser(u._id)}
// //                                   disabled={u._id === user._id}
// //                                   style={{ 
// //                                     background: u._id === user._id ? '#d1d5db' : '#ef4444',
// //                                     color: 'white',
// //                                     border: 'none',
// //                                     padding: '0.375rem 0.75rem',
// //                                     borderRadius: '0.375rem',
// //                                     fontSize: '0.75rem',
// //                                     cursor: u._id === user._id ? 'not-allowed' : 'pointer'
// //                                   }}
// //                                 >
// //                                   Delete
// //                                 </button>
// //                               </td>
// //                             </tr>
// //                           ))}
// //                         </tbody>
// //                       </table>
// //                     </div>
// //                   </div>
// //                 )}

// //                 {/* Orders Tab */}
// //                 {activeTab === 'orders' && (
// //                   <div>
// //                     <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
// //                       Order Management
// //                     </h3>
// //                     <div style={{ overflowX: 'auto' }}>
// //                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
// //                         <thead>
// //                           <tr style={{ background: '#f3f4f6' }}>
// //                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Order #</th>
// //                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Customer</th>
// //                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Items</th>
// //                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Total</th>
// //                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Status</th>
// //                             <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Actions</th>
// //                           </tr>
// //                         </thead>
// //                         <tbody>
// //                           {orders.map(order => (
// //                             <tr key={order._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
// //                               <td style={{ padding: '0.75rem' }}>#{order.orderNumber}</td>
// //                               <td style={{ padding: '0.75rem' }}>{order.customer?.name || 'N/A'}</td>
// //                               <td style={{ padding: '0.75rem' }}>{order.items.length} items</td>
// //                               <td style={{ padding: '0.75rem' }}>${order.totalAmount.toFixed(2)}</td>
// //                               <td style={{ padding: '0.75rem' }}>
// //                                 <select
// //                                   value={order.status}
// //                                   onChange={(e) => updateOrderStatus(order._id, e.target.value)}
// //                                   style={{
// //                                     padding: '0.25rem 0.5rem',
// //                                     borderRadius: '0.25rem',
// //                                     border: '1px solid #d1d5db',
// //                                     fontSize: '0.875rem'
// //                                   }}
// //                                 >
// //                                   <option value="pending">Pending</option>
// //                                   <option value="processing">Processing</option>
// //                                   <option value="shipped">Shipped</option>
// //                                   <option value="delivered">Delivered</option>
// //                                   <option value="cancelled">Cancelled</option>
// //                                 </select>
// //                               </td>
// //                               <td style={{ padding: '0.75rem', textAlign: 'center' }}>
// //                                 <button
// //                                   style={{
// //                                     background: '#3b82f6',
// //                                     color: 'white',
// //                                     border: 'none',
// //                                     padding: '0.375rem 0.75rem',
// //                                     borderRadius: '0.375rem',
// //                                     fontSize: '0.75rem',
// //                                     cursor: 'pointer'
// //                                   }}
// //                                 >
// //                                   View
// //                                 </button>
// //                               </td>
// //                             </tr>
// //                           ))}
// //                         </tbody>
// //                       </table>
// //                     </div>
// //                   </div>
// //                 )}

// //                 {/* Customers Tab */}
// //                 {activeTab === 'customers' && (
// //                   <div>
// //                     <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
// //                       Customer Management
// //                     </h3>
// //                     <div style={{ overflowX: 'auto' }}>
// //                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
// //                         <thead>
// //                           <tr style={{ background: '#f3f4f6' }}>
// //                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
// //                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
// //                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Phone</th>
// //                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Address</th>
// //                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Joined</th>
// //                           </tr>
// //                         </thead>
// //                         <tbody>
// //                           {customers.map(customer => (
// //                             <tr key={customer._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
// //                               <td style={{ padding: '0.75rem' }}>{customer.name}</td>
// //                               <td style={{ padding: '0.75rem' }}>{customer.email}</td>
// //                               <td style={{ padding: '0.75rem' }}>{customer.phone || 'N/A'}</td>
// //                               <td style={{ padding: '0.75rem' }}>{customer.address || 'N/A'}</td>
// //                               <td style={{ padding: '0.75rem', color: '#6b7280' }}>
// //                                 {new Date(customer.createdAt).toLocaleDateString()}
// //                               </td>
// //                             </tr>
// //                           ))}
// //                         </tbody>
// //                       </table>
// //                     </div>
// //                   </div>
// //                 )}
// //               </>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </ClientLayout>
// //   );
// // }
// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/contexts/AuthContext';
// import ClientLayout from '@/app/ClientLayout';

// export default function AdminPage() {
//   const [stats, setStats] = useState({
//     users: 0,
//     admins: 0,
//     customers: 0,
//     orders: 0,
//     pendingOrders: 0,
//     completedOrders: 0,
//     totalRevenue: 0
//   });
//   const [users, setUsers] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [customers, setCustomers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [activeTab, setActiveTab] = useState('dashboard');
//   const { user, token, loading: authLoading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!authLoading && !user) {
//       router.push('/auth/admin/login');
//       return;
//     }

//     if (!authLoading && user && user.role !== 'admin') {
//       router.push('/');
//       return;
//     }

//     if (user && user.role === 'admin') {
//       fetchDashboardData();
//     }
//   }, [user, authLoading, router]);

//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);
//       setError('');
      
//       // ✅ FIXED! SAFE TOKEN
//       const currentToken = token || localStorage.getItem('token');
      
//       if (!currentToken) {
//         setError('No authentication token. Please login again.');
//         router.push('/auth/admin/login');
//         return;
//       }

//       // Fetch stats
//       const statsResponse = await fetch('/api/admin/stats', {
//         headers: { 'Authorization': `Bearer ${currentToken}` }
//       });

//       if (statsResponse.ok) {
//         const statsData = await statsResponse.json();
//         setStats(statsData.stats || stats);
//       }

//       // Fetch users
//       const usersResponse = await fetch('/api/admin/users', {
//         headers: { 'Authorization': `Bearer ${currentToken}` }
//       });

//       if (usersResponse.ok) {
//         const usersData = await usersResponse.json();
//         setUsers(usersData.users || []);
//       }

//       // Fetch orders
//       const ordersResponse = await fetch('/api/admin/orders', {
//         headers: { 'Authorization': `Bearer ${currentToken}` }
//       });

//       if (ordersResponse.ok) {
//         const ordersData = await ordersResponse.json();
//         setOrders(ordersData.orders || []);
//       }

//       // Fetch customers
//       const customersResponse = await fetch('/api/admin/customers', {
//         headers: { 'Authorization': `Bearer ${currentToken}` }
//       });

//       if (customersResponse.ok) {
//         const customersData = await customersResponse.json();
//         setCustomers(customersData.customers || []);
//       }
//     } catch (err) {
//       setError('Error loading dashboard data');
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const toggleUserRole = async (userId, currentRole) => {
//     try {
//       const currentToken = token || localStorage.getItem('token');
//       const response = await fetch('/api/admin/users', {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${currentToken}`
//         },
//         body: JSON.stringify({
//           userId,
//           role: currentRole === 'admin' ? 'user' : 'admin'
//         })
//       });

//       if (response.ok) {
//         fetchDashboardData();
//       } else {
//         alert('Failed to update user role');
//       }
//     } catch (err) {
//       console.error(err);
//       alert('Error updating user role');
//     }
//   };

//   const deleteUser = async (userId) => {
//     if (!confirm('Are you sure you want to delete this user?')) return;

//     try {
//       const currentToken = token || localStorage.getItem('token');
//       const response = await fetch('/api/admin/users', {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${currentToken}`
//         },
//         body: JSON.stringify({ userId })
//       });

//       if (response.ok) {
//         fetchDashboardData();
//       } else {
//         alert('Failed to delete user');
//       }
//     } catch (err) {
//       console.error(err);
//       alert('Error deleting user');
//     }
//   };

//   const updateOrderStatus = async (orderId, status) => {
//     try {
//       const currentToken = token || localStorage.getItem('token');
//       const response = await fetch(`/api/admin/orders/${orderId}/status`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${currentToken}`
//         },
//         body: JSON.stringify({ status })
//       });

//       if (response.ok) {
//         fetchDashboardData();
//       } else {
//         alert('Failed to update order status');
//       }
//     } catch (err) {
//       console.error(err);
//       alert('Error updating order status');
//     }
//   };

//   if (authLoading) {
//     return (
//       <ClientLayout>
//         <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//           <p>Loading...</p>
//         </div>
//       </ClientLayout>
//     );
//   }

//   if (!user || user.role !== 'admin') {
//     return null;
//   }

//   return (
//     <ClientLayout>
//       <div style={{ 
//         minHeight: '80vh', 
//         padding: '2rem 0',
//         background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
//       }}>
//         <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
//           <div style={{ 
//             background: 'white', 
//             borderRadius: '1rem', 
//             padding: '2rem',
//             boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
//           }}>
//             {/* Header */}
//             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
//               <div style={{ display: 'flex', alignItems: 'center' }}>
//                 <div style={{
//                   background: '#dc2626',
//                   color: 'white',
//                   width: '3rem',
//                   height: '3rem',
//                   borderRadius: '0.5rem',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   marginRight: '1rem'
//                 }}>
//                   <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                   </svg>
//                 </div>
//                 <div>
//                   <h1 style={{ 
//                     fontSize: '2rem', 
//                     fontWeight: 'bold', 
//                     color: '#1f2937'
//                   }}>
//                     Admin Dashboard
//                   </h1>
//                   <p style={{ color: '#6b7280' }}>
//                     Welcome back, {user.name}
//                   </p>
//                 </div>
//               </div>
              
//               {/* ✅ NEW! REFRESH BUTTON */}
//               <button 
//                 onClick={fetchDashboardData}
//                 disabled={loading}
//                 style={{
//                   background: loading ? '#9ca3af' : '#dc2626',
//                   color: 'white',
//                   border: 'none',
//                   padding: '0.75rem 1.5rem',
//                   borderRadius: '0.5rem',
//                   cursor: loading ? 'not-allowed' : 'pointer',
//                   fontWeight: '600'
//                 }}
//               >
//                 {loading ? 'Refreshing...' : '🔄 Refresh'}
//               </button>
//             </div>

//             {error && (
//               <div style={{ 
//                 background: '#fee2e2', 
//                 border: '1px solid #ef4444',
//                 color: '#991b1b',
//                 padding: '1rem',
//                 borderRadius: '0.5rem',
//                 marginBottom: '1rem'
//               }}>
//                 {error}
//               </div>
//             )}

//             {/* Tabs */}
//             <div style={{ 
//               display: 'flex', 
//               gap: '0.5rem', 
//               marginBottom: '2rem',
//               borderBottom: '1px solid #e5e7eb'
//             }}>
//               {['dashboard', 'users', 'orders', 'customers'].map(tab => (
//                 <button
//                   key={tab}
//                   onClick={() => setActiveTab(tab)}
//                   style={{
//                     padding: '0.75rem 1.5rem',
//                     background: activeTab === tab ? '#dc2626' : 'transparent',
//                     color: activeTab === tab ? 'white' : '#6b7280',
//                     border: 'none',
//                     borderRadius: '0.5rem 0.5rem 0 0',
//                     fontWeight: '600',
//                     cursor: 'pointer',
//                     textTransform: 'capitalize'
//                   }}
//                 >
//                   {tab}
//                 </button>
//               ))}
//             </div>

//             {loading ? (
//               <div style={{ textAlign: 'center', padding: '3rem' }}>
//                 <p>Loading dashboard...</p>
//               </div>
//             ) : (
//               <>
//                 {/* Dashboard Tab */}
//                 {activeTab === 'dashboard' && (
//                   <div>
//                     {/* Stats Grid */}
//                     <div style={{ 
//                       display: 'grid', 
//                       gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
//                       gap: '1.5rem',
//                       marginBottom: '2rem'
//                     }}>
//                       <div style={{ 
//                         background: '#f0f9ff',
//                         border: '1px solid #bae6fd',
//                         borderRadius: '0.75rem',
//                         padding: '1.5rem',
//                         textAlign: 'center'
//                       }}>
//                         <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0369a1', marginBottom: '0.5rem' }}>
//                           {stats.users || 0}
//                         </div>
//                         <div style={{ color: '#0c4a6e', fontWeight: '600' }}>Total Users</div>
//                       </div>
                      
//                       <div style={{ 
//                         background: '#f0fdf4',
//                         border: '1px solid #bbf7d0',
//                         borderRadius: '0.75rem',
//                         padding: '1.5rem',
//                         textAlign: 'center'
//                       }}>
//                         <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d', marginBottom: '0.5rem' }}>
//                           {stats.admins || 0}
//                         </div>
//                         <div style={{ color: '#166534', fontWeight: '600' }}>Admins</div>
//                       </div>
                      
//                       <div style={{ 
//                         background: '#fef3c7',
//                         border: '1px solid #fcd34d',
//                         borderRadius: '0.75rem',
//                         padding: '1.5rem',
//                         textAlign: 'center'
//                       }}>
//                         <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.5rem' }}>
//                           ${Number(stats.totalRevenue || 0).toFixed(2)}
//                         </div>
//                         <div style={{ color: '#92400e', fontWeight: '600' }}>Total Revenue</div>
//                       </div>

//                       <div style={{ 
//                         background: '#fee2e2',
//                         border: '1px solid #fecaca',
//                         borderRadius: '0.75rem',
//                         padding: '1.5rem',
//                         textAlign: 'center'
//                       }}>
//                         <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#991b1b', marginBottom: '0.5rem' }}>
//                           {stats.pendingOrders || 0}
//                         </div>
//                         <div style={{ color: '#7f1d1d', fontWeight: '600' }}>Pending Orders</div>
//                       </div>
//                     </div>

//                     {/* Recent Orders */}
//                     <div>
//                       <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
//                         Recent Orders
//                       </h3>
//                       <div style={{ overflowX: 'auto' }}>
//                         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                           <thead>
//                             <tr style={{ background: '#f3f4f6' }}>
//                               <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Order #</th>
//                               <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Customer</th>
//                               <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Amount</th>
//                               <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Status</th>
//                               <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Date</th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {/* ✅ FIXED! SAFE ORDERS */}
//                             {(orders || []).slice(0, 5).map(order => (
//                               <tr key={order._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
//                                 <td style={{ padding: '0.75rem' }}>#{order.orderNumber || 'N/A'}</td>
//                                 <td style={{ padding: '0.75rem' }}>{order.customer?.name || 'N/A'}</td>
//                                 <td style={{ padding: '0.75rem' }}>${Number(order.totalAmount || 0).toFixed(2)}</td>
//                                 <td style={{ padding: '0.75rem' }}>
//                                   <span style={{
//                                     background: order.status === 'delivered' ? '#10b981' : 
//                                               order.status === 'pending' ? '#f59e0b' : '#6b7280',
//                                     color: 'white',
//                                     padding: '0.25rem 0.5rem',
//                                     borderRadius: '0.25rem',
//                                     fontSize: '0.75rem'
//                                   }}>
//                                     {order.status || 'N/A'}
//                                   </span>
//                                 </td>
//                                 <td style={{ padding: '0.75rem' }}>
//                                   {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
//                                 </td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* Users Tab */}
//                 {activeTab === 'users' && (
//                   <div>
//                     <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
//                       User Management
//                     </h3>
//                     <div style={{ overflowX: 'auto' }}>
//                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                         <thead>
//                           <tr style={{ background: '#f3f4f6' }}>
//                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
//                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
//                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Role</th>
//                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Joined</th>
//                             <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Actions</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {(users || []).map(u => (
//                             <tr key={u._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
//                               <td style={{ padding: '0.75rem' }}>
//                                 {u.name || 'N/A'}
//                                 {u._id === user._id && (
//                                   <span style={{ 
//                                     marginLeft: '0.5rem',
//                                     fontSize: '0.75rem',
//                                     background: '#3b82f6',
//                                     color: 'white',
//                                     padding: '0.125rem 0.5rem',
//                                     borderRadius: '0.25rem'
//                                   }}>You</span>
//                                 )}
//                               </td>
//                               <td style={{ padding: '0.75rem' }}>{u.email || 'N/A'}</td>
//                               <td style={{ padding: '0.75rem' }}>
//                                 <span style={{ 
//                                   background: u.role === 'admin' ? '#dc2626' : '#6b7280',
//                                   color: 'white',
//                                   padding: '0.25rem 0.75rem',
//                                   borderRadius: '0.375rem',
//                                   fontSize: '0.75rem',
//                                   fontWeight: '600'
//                                 }}>
//                                   {u.role || 'N/A'}
//                                 </span>
//                               </td>
//                               <td style={{ padding: '0.75rem', color: '#6b7280' }}>
//                                 {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
//                               </td>
//                               <td style={{ padding: '0.75rem', textAlign: 'center' }}>
//                                 <button
//                                   onClick={() => toggleUserRole(u._id, u.role)}
//                                   disabled={u._id === user._id}
//                                   style={{ 
//                                     background: u._id === user._id ? '#d1d5db' : '#3b82f6',
//                                     color: 'white',
//                                     border: 'none',
//                                     padding: '0.375rem 0.75rem',
//                                     borderRadius: '0.375rem',
//                                     fontSize: '0.75rem',
//                                     cursor: u._id === user._id ? 'not-allowed' : 'pointer',
//                                     marginRight: '0.5rem'
//                                   }}
//                                 >
//                                   {u.role === 'admin' ? 'Demote' : 'Promote'}
//                                 </button>
//                                 <button
//                                   onClick={() => deleteUser(u._id)}
//                                   disabled={u._id === user._id}
//                                   style={{ 
//                                     background: u._id === user._id ? '#d1d5db' : '#ef4444',
//                                     color: 'white',
//                                     border: 'none',
//                                     padding: '0.375rem 0.75rem',
//                                     borderRadius: '0.375rem',
//                                     fontSize: '0.75rem',
//                                     cursor: u._id === user._id ? 'not-allowed' : 'pointer'
//                                   }}
//                                 >
//                                   Delete
//                                 </button>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 )}

//                 {/* Orders Tab */}
//                 {activeTab === 'orders' && (
//                   <div>
//                     <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
//                       Order Management
//                     </h3>
//                     <div style={{ overflowX: 'auto' }}>
//                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                         <thead>
//                           <tr style={{ background: '#f3f4f6' }}>
//                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Order #</th>
//                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Customer</th>
//                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Items</th>
//                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Total</th>
//                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Status</th>
//                             <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Actions</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {(orders || []).map(order => (
//                             <tr key={order._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
//                               <td style={{ padding: '0.75rem' }}>#{order.orderNumber || 'N/A'}</td>
//                               <td style={{ padding: '0.75rem' }}>{order.customer?.name || 'N/A'}</td>
//                               <td style={{ padding: '0.75rem' }}>{(order.items || []).length} items</td>
//                               <td style={{ padding: '0.75rem' }}>${Number(order.totalAmount || 0).toFixed(2)}</td>
//                               <td style={{ padding: '0.75rem' }}>
//                                 <select
//                                   value={order.status || 'pending'}
//                                   onChange={(e) => updateOrderStatus(order._id, e.target.value)}
//                                   style={{
//                                     padding: '0.25rem 0.5rem',
//                                     borderRadius: '0.25rem',
//                                     border: '1px solid #d1d5db',
//                                     fontSize: '0.875rem'
//                                   }}
//                                 >
//                                   <option value="pending">Pending</option>
//                                   <option value="processing">Processing</option>
//                                   <option value="shipped">Shipped</option>
//                                   <option value="delivered">Delivered</option>
//                                   <option value="cancelled">Cancelled</option>
//                                 </select>
//                               </td>
//                               <td style={{ padding: '0.75rem', textAlign: 'center' }}>
//                                 <button
//                                   style={{
//                                     background: '#3b82f6',
//                                     color: 'white',
//                                     border: 'none',
//                                     padding: '0.375rem 0.75rem',
//                                     borderRadius: '0.375rem',
//                                     fontSize: '0.75rem',
//                                     cursor: 'pointer'
//                                   }}
//                                 >
//                                   View
//                                 </button>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 )}

//                 {/* Customers Tab */}
//                 {activeTab === 'customers' && (
//                   <div>
//                     <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
//                       Customer Management
//                     </h3>
//                     <div style={{ overflowX: 'auto' }}>
//                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                         <thead>
//                           <tr style={{ background: '#f3f4f6' }}>
//                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
//                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
//                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Phone</th>
//                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Address</th>
//                             <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Joined</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {(customers || []).map(customer => (
//                             <tr key={customer._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
//                               <td style={{ padding: '0.75rem' }}>{customer.name || 'N/A'}</td>
//                               <td style={{ padding: '0.75rem' }}>{customer.email || 'N/A'}</td>
//                               <td style={{ padding: '0.75rem' }}>{customer.phone || 'N/A'}</td>
//                               <td style={{ padding: '0.75rem' }}>{customer.address || 'N/A'}</td>
//                               <td style={{ padding: '0.75rem', color: '#6b7280' }}>
//                                 {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </ClientLayout>
//   );
// }
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);
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
      const [statsResponse, usersResponse, ordersResponse, customersResponse] = await Promise.all([
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
        padding: '2rem 0',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '1rem', 
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                  color: 'white',
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold', 
                    color: '#1f2937',
                    margin: 0
                  }}>
                    Admin Dashboard
                  </h1>
                  <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                    Welcome back, {user.name || 'Admin'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={fetchDashboardData}
                disabled={refreshing}
                style={{
                  background: refreshing ? '#9ca3af' : 'linear-gradient(135deg, #dc2626, #ef4444)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
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
                    🔄 Refresh
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
              gap: '0.5rem', 
              marginBottom: '2rem',
              borderBottom: '2px solid #e5e7eb',
              overflowX: 'auto'
            }}>
              {[
                { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
                { id: 'users', label: '👥 Users', icon: '👥' },
                { id: 'orders', label: '📦 Orders', icon: '📦' },
                { id: 'customers', label: '🛍️ Customers', icon: '🛍️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: activeTab === tab.id ? '#dc2626' : 'transparent',
                    color: activeTab === tab.id ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '0.5rem 0.5rem 0 0',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {tab.icon} {tab.label.split(' ')[1]}
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
              </>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}