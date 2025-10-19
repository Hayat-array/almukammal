// // // // // // // // // 'use client';

// // // // // // // // // import { createContext, useState, useContext, useEffect } from 'react';
// // // // // // // // // import { useRouter } from 'next/navigation';

// // // // // // // // // const AuthContext = createContext();

// // // // // // // // // export function AuthProvider({ children }) {
// // // // // // // // //   const [user, setUser] = useState(null);
// // // // // // // // //   const [loading, setLoading] = useState(true);
// // // // // // // // //   const router = useRouter();

// // // // // // // // //   useEffect(() => {
// // // // // // // // //     checkUserLoggedIn();
// // // // // // // // //   }, []);

// // // // // // // // //   const checkUserLoggedIn = async () => {
// // // // // // // // //     try {
// // // // // // // // //       const token = localStorage.getItem('token');
// // // // // // // // //       if (token) {
// // // // // // // // //         const response = await fetch('/api/auth/me', {
// // // // // // // // //           headers: {
// // // // // // // // //             Authorization: `Bearer ${token}`,
// // // // // // // // //           },
// // // // // // // // //         });

// // // // // // // // //         if (response.ok) {
// // // // // // // // //           const userData = await response.json();
// // // // // // // // //           setUser(userData);
// // // // // // // // //         } else {
// // // // // // // // //           localStorage.removeItem('token');
// // // // // // // // //         }
// // // // // // // // //       }
// // // // // // // // //     } catch (error) {
// // // // // // // // //       console.error('Error checking auth:', error);
// // // // // // // // //       localStorage.removeItem('token');
// // // // // // // // //     } finally {
// // // // // // // // //       setLoading(false);
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   const login = async (email, password) => {
// // // // // // // // //     try {
// // // // // // // // //       const response = await fetch('/api/auth/login', {
// // // // // // // // //         method: 'POST',
// // // // // // // // //         headers: {
// // // // // // // // //           'Content-Type': 'application/json',
// // // // // // // // //         },
// // // // // // // // //         body: JSON.stringify({ email, password }),
// // // // // // // // //       });

// // // // // // // // //       const data = await response.json();

// // // // // // // // //       if (response.ok) {
// // // // // // // // //         localStorage.setItem('token', data.token);
// // // // // // // // //         setUser(data.user);
// // // // // // // // //         return { success: true };
// // // // // // // // //       } else {
// // // // // // // // //         return { success: false, error: data.message };
// // // // // // // // //       }
// // // // // // // // //     } catch (error) {
// // // // // // // // //       return { success: false, error: 'An error occurred during login' };
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   const register = async (userData) => {
// // // // // // // // //     try {
// // // // // // // // //       const response = await fetch('/api/auth/register', {
// // // // // // // // //         method: 'POST',
// // // // // // // // //         headers: {
// // // // // // // // //           'Content-Type': 'application/json',
// // // // // // // // //         },
// // // // // // // // //         body: JSON.stringify(userData),
// // // // // // // // //       });

// // // // // // // // //       const data = await response.json();

// // // // // // // // //       if (response.ok) {
// // // // // // // // //         localStorage.setItem('token', data.token);
// // // // // // // // //         setUser(data.user);
// // // // // // // // //         return { success: true };
// // // // // // // // //       } else {
// // // // // // // // //         return { success: false, error: data.message };
// // // // // // // // //       }
// // // // // // // // //     } catch (error) {
// // // // // // // // //       return { success: false, error: 'An error occurred during registration' };
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   const logout = () => {
// // // // // // // // //     localStorage.removeItem('token');
// // // // // // // // //     localStorage.removeItem('cart');
// // // // // // // // //     setUser(null);
// // // // // // // // //     router.push('/');
// // // // // // // // //   };

// // // // // // // // //   const value = {
// // // // // // // // //     user,
// // // // // // // // //     login,
// // // // // // // // //     register,
// // // // // // // // //     logout,
// // // // // // // // //     loading,
// // // // // // // // //   };

// // // // // // // // //   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// // // // // // // // // }

// // // // // // // // // export const useAuth = () => {
// // // // // // // // //   const context = useContext(AuthContext);
// // // // // // // // //   if (context === undefined) {
// // // // // // // // //     throw new Error('useAuth must be used within an AuthProvider');
// // // // // // // // //   }
// // // // // // // // //   return context;
// // // // // // // // // };
// // // // // // // // 'use client';

// // // // // // // // import { createContext, useContext, useState, useEffect } from 'react';
// // // // // // // // import { useRouter } from 'next/navigation';

// // // // // // // // const AuthContext = createContext();

// // // // // // // // export function AuthProvider({ children }) {
// // // // // // // //   const [user, setUser] = useState(null);
// // // // // // // //   const [loading, setLoading] = useState(true);
// // // // // // // //   const [token, setToken] = useState(null);
// // // // // // // //   const router = useRouter();

// // // // // // // //   useEffect(() => {
// // // // // // // //     // Check for token in localStorage on mount
// // // // // // // //     const checkAuth = async () => {
// // // // // // // //       try {
// // // // // // // //         const storedToken = localStorage.getItem('token');
// // // // // // // //         if (storedToken) {
// // // // // // // //           setToken(storedToken);
// // // // // // // //           // Verify token with backend
// // // // // // // //           const response = await fetch('/api/auth/me', {
// // // // // // // //             headers: {
// // // // // // // //               'Authorization': `Bearer ${storedToken}`
// // // // // // // //             }
// // // // // // // //           });

// // // // // // // //           if (response.ok) {
// // // // // // // //             const userData = await response.json();
// // // // // // // //             setUser(userData);
// // // // // // // //           } else {
// // // // // // // //             // Token invalid, clear it
// // // // // // // //             localStorage.removeItem('token');
// // // // // // // //             setToken(null);
// // // // // // // //           }
// // // // // // // //         }
// // // // // // // //       } catch (error) {
// // // // // // // //         console.error('Auth check error:', error);
// // // // // // // //         localStorage.removeItem('token');
// // // // // // // //         setToken(null);
// // // // // // // //       } finally {
// // // // // // // //         setLoading(false);
// // // // // // // //       }
// // // // // // // //     };

// // // // // // // //     checkAuth();
// // // // // // // //   }, []);

// // // // // // // //   const login = async (email, password) => {
// // // // // // // //     try {
// // // // // // // //       const response = await fetch('/api/auth/login', {
// // // // // // // //         method: 'POST',
// // // // // // // //         headers: {
// // // // // // // //           'Content-Type': 'application/json',
// // // // // // // //         },
// // // // // // // //         body: JSON.stringify({ email, password }),
// // // // // // // //       });

// // // // // // // //       const data = await response.json();

// // // // // // // //       if (response.ok) {
// // // // // // // //         localStorage.setItem('token', data.token);
// // // // // // // //         setToken(data.token);
// // // // // // // //         setUser(data.user);
// // // // // // // //         return { success: true };
// // // // // // // //       } else {
// // // // // // // //         return { success: false, error: data.message || 'Login failed' };
// // // // // // // //       }
// // // // // // // //     } catch (error) {
// // // // // // // //       console.error('Login error:', error);
// // // // // // // //       return { success: false, error: 'Network error. Please try again.' };
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   const register = async (formData) => {
// // // // // // // //     try {
// // // // // // // //       const response = await fetch('/api/auth/register', {
// // // // // // // //         method: 'POST',
// // // // // // // //         headers: {
// // // // // // // //           'Content-Type': 'application/json',
// // // // // // // //         },
// // // // // // // //         body: JSON.stringify(formData),
// // // // // // // //       });

// // // // // // // //       const data = await response.json();

// // // // // // // //       if (response.ok) {
// // // // // // // //         localStorage.setItem('token', data.token);
// // // // // // // //         setToken(data.token);
// // // // // // // //         setUser(data.user);
// // // // // // // //         return { success: true };
// // // // // // // //       } else {
// // // // // // // //         return { success: false, error: data.message || 'Registration failed' };
// // // // // // // //       }
// // // // // // // //     } catch (error) {
// // // // // // // //       console.error('Registration error:', error);
// // // // // // // //       return { success: false, error: 'Network error. Please try again.' };
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   const logout = () => {
// // // // // // // //     localStorage.removeItem('token');
// // // // // // // //     setToken(null);
// // // // // // // //     setUser(null);
// // // // // // // //     router.push('/');
// // // // // // // //   };

// // // // // // // //   return (
// // // // // // // //     <AuthContext.Provider value={{ user, loading, login, register, logout, token }}>
// // // // // // // //       {children}
// // // // // // // //     </AuthContext.Provider>
// // // // // // // //   );
// // // // // // // // }

// // // // // // // // export function useAuth() {
// // // // // // // //   const context = useContext(AuthContext);
// // // // // // // //   if (!context) {
// // // // // // // //     throw new Error('useAuth must be used within an AuthProvider');
// // // // // // // //   }
// // // // // // // //   return context;
// // // // // // // // }
// // // // // // // 'use client';

// // // // // // // import { createContext, useContext, useState, useEffect } from 'react';
// // // // // // // import { useRouter } from 'next/navigation';

// // // // // // // const AuthContext = createContext();

// // // // // // // export function AuthProvider({ children }) {
// // // // // // //   const [user, setUser] = useState(null);
// // // // // // //   const [loading, setLoading] = useState(true);
// // // // // // //   const [token, setToken] = useState(null);
// // // // // // //   const router = useRouter();

// // // // // // //   useEffect(() => {
// // // // // // //     // Check for token in localStorage on mount
// // // // // // //     const checkAuth = async () => {
// // // // // // //       try {
// // // // // // //         const storedToken = localStorage.getItem('token');
// // // // // // //         if (storedToken) {
// // // // // // //           setToken(storedToken);
// // // // // // //           // Verify token with backend
// // // // // // //           const response = await fetch('/api/auth/me', {
// // // // // // //             headers: {
// // // // // // //               'Authorization': `Bearer ${storedToken}`
// // // // // // //             }
// // // // // // //           });

// // // // // // //           if (response.ok) {
// // // // // // //             const userData = await response.json();
// // // // // // //             setUser(userData);
// // // // // // //           } else {
// // // // // // //             // Token invalid, clear it
// // // // // // //             localStorage.removeItem('token');
// // // // // // //             setToken(null);
// // // // // // //           }
// // // // // // //         }
// // // // // // //       } catch (error) {
// // // // // // //         console.error('Auth check error:', error);
// // // // // // //         localStorage.removeItem('token');
// // // // // // //         setToken(null);
// // // // // // //       } finally {
// // // // // // //         setLoading(false);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     checkAuth();
// // // // // // //   }, []);

// // // // // // //   const handleSubmit = async (e) => {
// // // // // // //   e.preventDefault();
// // // // // // //   setLoading(true);
// // // // // // //   setError('');

// // // // // // //   const result = await login(formData.email, formData.password);
  
// // // // // // //   if (result.success) {
// // // // // // //     // Wait a moment for the AuthContext to update
// // // // // // //     setTimeout(() => {
// // // // // // //       // Get the updated user from AuthContext
// // // // // // //       const { user } = useAuth();
// // // // // // //       if (user && user.role === 'admin') {
// // // // // // //         router.push('/auth/admin');
// // // // // // //       } else {
// // // // // // //         setError('Access denied. Admin privileges required.');
// // // // // // //         localStorage.removeItem('token');
// // // // // // //         window.location.reload();
// // // // // // //       }
// // // // // // //     }, 100);
// // // // // // //   } else {
// // // // // // //     setError(result.error);
// // // // // // //   }
  
// // // // // // //   setLoading(false);
// // // // // // // };
// // // // // // //   const login = async (email, password) => {
// // // // // // //     try {
// // // // // // //       const response = await fetch('/api/auth/login', {
// // // // // // //         method: 'POST',
// // // // // // //         headers: {
// // // // // // //           'Content-Type': 'application/json',
// // // // // // //         },
// // // // // // //         body: JSON.stringify({ email, password }),
// // // // // // //       });

// // // // // // //       const data = await response.json();

// // // // // // //       if (response.ok) {
// // // // // // //         localStorage.setItem('token', data.token);
// // // // // // //         setToken(data.token);
// // // // // // //         setUser(data.user);
// // // // // // //         return { success: true };
// // // // // // //       } else {
// // // // // // //         return { success: false, error: data.message || 'Login failed' };
// // // // // // //       }
// // // // // // //     } catch (error) {
// // // // // // //       console.error('Login error:', error);
// // // // // // //       return { success: false, error: 'Network error. Please try again.' };
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const register = async (formData) => {
// // // // // // //     try {
// // // // // // //       const response = await fetch('/api/auth/register', {
// // // // // // //         method: 'POST',
// // // // // // //         headers: {
// // // // // // //           'Content-Type': 'application/json',
// // // // // // //         },
// // // // // // //         body: JSON.stringify(formData),
// // // // // // //       });

// // // // // // //       const data = await response.json();

// // // // // // //       if (response.ok) {
// // // // // // //         localStorage.setItem('token', data.token);
// // // // // // //         setToken(data.token);
// // // // // // //         setUser(data.user);
// // // // // // //         return { success: true };
// // // // // // //       } else {
// // // // // // //         return { success: false, error: data.message || 'Registration failed' };
// // // // // // //       }
// // // // // // //     } catch (error) {
// // // // // // //       console.error('Registration error:', error);
// // // // // // //       return { success: false, error: 'Network error. Please try again.' };
// // // // // // //     }
// // // // // // //   };

// // // // // // //   const logout = () => {
// // // // // // //     localStorage.removeItem('token');
// // // // // // //     setToken(null);
// // // // // // //     setUser(null);
// // // // // // //     router.push('/');
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <AuthContext.Provider value={{ user, loading, login, register, logout, token }}>
// // // // // // //       {children}
// // // // // // //     </AuthContext.Provider>
// // // // // // //   );
// // // // // // // }

// // // // // // // export function useAuth() {
// // // // // // //   const context = useContext(AuthContext);
// // // // // // //   if (!context) {
// // // // // // //     throw new Error('useAuth must be used within an AuthProvider');
// // // // // // //   }
// // // // // // //   return context;
// // // // // // // }

// // // // // // 'use client';

// // // // // // import { createContext, useContext, useState, useEffect } from 'react';
// // // // // // import { useRouter } from 'next/navigation';

// // // // // // const AuthContext = createContext();

// // // // // // export function AuthProvider({ children }) {
// // // // // //   const [user, setUser] = useState(null);
// // // // // //   const [loading, setLoading] = useState(true);
// // // // // //   const [token, setToken] = useState(null);
// // // // // //   const router = useRouter();

// // // // // //   useEffect(() => {
// // // // // //     // Check for token in localStorage on mount
// // // // // //     const checkAuth = async () => {
// // // // // //       try {
// // // // // //         const storedToken = localStorage.getItem('token');
// // // // // //         if (storedToken) {
// // // // // //           setToken(storedToken);
// // // // // //           // Verify token with backend
// // // // // //           const response = await fetch('/api/auth/me', {
// // // // // //             headers: {
// // // // // //               'Authorization': `Bearer ${storedToken}`
// // // // // //             }
// // // // // //           });

// // // // // //           if (response.ok) {
// // // // // //             const userData = await response.json();
// // // // // //             setUser(userData);
// // // // // //           } else {
// // // // // //             // Token invalid, clear it
// // // // // //             localStorage.removeItem('token');
// // // // // //             setToken(null);
// // // // // //           }
// // // // // //         }
// // // // // //       } catch (error) {
// // // // // //         console.error('Auth check error:', error);
// // // // // //         localStorage.removeItem('token');
// // // // // //         setToken(null);
// // // // // //       } finally {
// // // // // //         setLoading(false);
// // // // // //       }
// // // // // //     };

// // // // // //     checkAuth();
// // // // // //   }, []);

// // // // // //   const login = async (email, password) => {
// // // // // //     try {
// // // // // //       const response = await fetch('/api/auth/login', {
// // // // // //         method: 'POST',
// // // // // //         headers: {
// // // // // //           'Content-Type': 'application/json',
// // // // // //         },
// // // // // //         body: JSON.stringify({ email, password }),
// // // // // //       });

// // // // // //       const data = await response.json();

// // // // // //       if (response.ok) {
// // // // // //         localStorage.setItem('token', data.token);
// // // // // //         setToken(data.token);
// // // // // //         setUser(data.user);
// // // // // //         return { success: true, user: data.user };
// // // // // //       } else {
// // // // // //         return { success: false, error: data.message || 'Login failed' };
// // // // // //       }
// // // // // //     } catch (error) {
// // // // // //       console.error('Login error:', error);
// // // // // //       return { success: false, error: 'Network error. Please try again.' };
// // // // // //     }
// // // // // //   };

// // // // // //   const register = async (formData) => {
// // // // // //     try {
// // // // // //       const response = await fetch('/api/auth/register', {
// // // // // //         method: 'POST',
// // // // // //         headers: {
// // // // // //           'Content-Type': 'application/json',
// // // // // //         },
// // // // // //         body: JSON.stringify(formData),
// // // // // //       });

// // // // // //       const data = await response.json();

// // // // // //       if (response.ok) {
// // // // // //         localStorage.setItem('token', data.token);
// // // // // //         setToken(data.token);
// // // // // //         setUser(data.user);
// // // // // //         return { success: true };
// // // // // //       } else {
// // // // // //         return { success: false, error: data.message || 'Registration failed' };
// // // // // //       }
// // // // // //     } catch (error) {
// // // // // //       console.error('Registration error:', error);
// // // // // //       return { success: false, error: 'Network error. Please try again.' };
// // // // // //     }
// // // // // //   };

// // // // // //   const logout = () => {
// // // // // //     localStorage.removeItem('token');
// // // // // //     setToken(null);
// // // // // //     setUser(null);
// // // // // //     router.push('/');
// // // // // //   };

// // // // // //   const updateUser = (updatedUserData) => {
// // // // // //     setUser(updatedUserData);
// // // // // //   };

// // // // // //   const isAuthenticated = () => {
// // // // // //     return !!user && !!token;
// // // // // //   };

// // // // // //   const isAdmin = () => {
// // // // // //     return user?.role === 'admin';
// // // // // //   };

// // // // // //   return (
// // // // // //     <AuthContext.Provider value={{ 
// // // // // //       user, 
// // // // // //       loading, 
// // // // // //       login, 
// // // // // //       register, 
// // // // // //       logout, 
// // // // // //       token,
// // // // // //       updateUser,
// // // // // //       isAuthenticated,
// // // // // //       isAdmin
// // // // // //     }}>
// // // // // //       {children}
// // // // // //     </AuthContext.Provider>
// // // // // //   );
// // // // // // }

// // // // // // export function useAuth() {
// // // // // //   const context = useContext(AuthContext);
// // // // // //   if (!context) {
// // // // // //     throw new Error('useAuth must be used within an AuthProvider');
// // // // // //   }
// // // // // //   return context;
// // // // // // }
// // // // // 'use client';

// // // // // import { createContext, useContext, useState, useEffect } from 'react';
// // // // // import { useRouter } from 'next/navigation';

// // // // // const AuthContext = createContext();

// // // // // export function AuthProvider({ children }) {
// // // // //   const [user, setUser] = useState(null);
// // // // //   const [token, setToken] = useState(null);
// // // // //   const [loading, setLoading] = useState(true);
// // // // //   const router = useRouter();

// // // // //   // Load user and token from localStorage immediately
// // // // //   useEffect(() => {
// // // // //     const savedToken = localStorage.getItem('token');
// // // // //     const savedUser = localStorage.getItem('user');

// // // // //     if (savedToken && savedUser) {
// // // // //       setToken(savedToken);
// // // // //       setUser(JSON.parse(savedUser));
// // // // //     }

// // // // //     verifyToken(savedToken);
// // // // //   }, []);

// // // // //   // Verify user session with backend
// // // // //   const verifyToken = async (storedToken) => {
// // // // //     try {
// // // // //       if (!storedToken) {
// // // // //         setLoading(false);
// // // // //         return;
// // // // //       }
// // // // //       const response = await fetch('/api/auth/me', {
// // // // //         headers: { Authorization: `Bearer ${storedToken}` },
// // // // //       });

// // // // //       if (response.ok) {
// // // // //         const userData = await response.json();
// // // // //         setUser(userData);
// // // // //         localStorage.setItem('user', JSON.stringify(userData));
// // // // //       } else {
// // // // //         localStorage.removeItem('token');
// // // // //         localStorage.removeItem('user');
// // // // //         setUser(null);
// // // // //         setToken(null);
// // // // //       }
// // // // //     } catch (error) {
// // // // //       console.error('Auth check error:', error);
// // // // //       localStorage.removeItem('token');
// // // // //       localStorage.removeItem('user');
// // // // //       setUser(null);
// // // // //       setToken(null);
// // // // //     } finally {
// // // // //       setLoading(false);
// // // // //     }
// // // // //   };

// // // // //   const login = async (email, password) => {
// // // // //     try {
// // // // //       const response = await fetch('/api/auth/login', {
// // // // //         method: 'POST',
// // // // //         headers: { 'Content-Type': 'application/json' },
// // // // //         body: JSON.stringify({ email, password }),
// // // // //       });

// // // // //       const data = await response.json();

// // // // //       if (response.ok) {
// // // // //         localStorage.setItem('token', data.token);
// // // // //         localStorage.setItem('user', JSON.stringify(data.user));
// // // // //         setToken(data.token);
// // // // //         setUser(data.user);
// // // // //         return { success: true };
// // // // //       } else {
// // // // //         return { success: false, error: data.message || 'Login failed' };
// // // // //       }
// // // // //     } catch (error) {
// // // // //       return { success: false, error: 'Network error. Please try again.' };
// // // // //     }
// // // // //   };

// // // // //   const logout = () => {
// // // // //     localStorage.removeItem('token');
// // // // //     localStorage.removeItem('user');
// // // // //     setToken(null);
// // // // //     setUser(null);
// // // // //     router.push('/');
// // // // //   };

// // // // //   return (
// // // // //     <AuthContext.Provider value={{ user, token, loading, login, logout }}>
// // // // //       {children}
// // // // //     </AuthContext.Provider>
// // // // //   );
// // // // // }

// // // // // export function useAuth() {
// // // // //   const context = useContext(AuthContext);
// // // // //   if (!context) {
// // // // //     throw new Error('useAuth must be used within an AuthProvider');
// // // // //   }
// // // // //   return context;
// // // // // }
// // // // 'use client';

// // // // import { createContext, useContext, useState, useEffect } from 'react';
// // // // import { useRouter } from 'next/navigation';

// // // // const AuthContext = createContext();

// // // // export function AuthProvider({ children }) {
// // // //   const [user, setUser] = useState(null);
// // // //   const [token, setToken] = useState(null);
// // // //   const [loading, setLoading] = useState(true);
// // // //   const router = useRouter();

// // // //   useEffect(() => {
// // // //     const initializeAuth = async () => {
// // // //       try {
// // // //         const savedToken = localStorage.getItem('token');
// // // //         const savedUser = localStorage.getItem('user');

// // // //         if (savedToken && savedUser) {
// // // //           setToken(savedToken);
// // // //           const userData = JSON.parse(savedUser);
// // // //           setUser(userData);
          
// // // //           // Verify token with backend (ADDED: Token verification)
// // // //           const response = await fetch('/api/auth/me', {
// // // //             headers: { 
// // // //               'Authorization': `Bearer ${savedToken}`,
// // // //               'Content-Type': 'application/json'
// // // //             },
// // // //           });

// // // //           if (!response.ok) {
// // // //             throw new Error('Token verification failed');
// // // //           }

// // // //           const freshUserData = await response.json();
// // // //           setUser(freshUserData);
// // // //           localStorage.setItem('user', JSON.stringify(freshUserData));
// // // //         }
// // // //       } catch (error) {
// // // //         console.error('Auth initialization error:', error);
// // // //         // Don't logout immediately, let the user try with stored credentials
// // // //       } finally {
// // // //         setLoading(false);
// // // //       }
// // // //     };

// // // //     initializeAuth();
// // // //   }, []);

// // // //   const login = async (email, password) => {
// // // //     try {
// // // //       const response = await fetch('/api/auth/login', {
// // // //         method: 'POST',
// // // //         headers: { 'Content-Type': 'application/json' },
// // // //         body: JSON.stringify({ email, password }),
// // // //       });

// // // //       const data = await response.json();

// // // //       if (response.ok && data.success) {
// // // //         localStorage.setItem('token', data.token);
// // // //         localStorage.setItem('user', JSON.stringify(data.user));
// // // //         setToken(data.token);
// // // //         setUser(data.user);
// // // //         return { success: true };
// // // //       } else {
// // // //         return { 
// // // //           success: false, 
// // // //           error: data.message || data.error || 'Login failed' 
// // // //         };
// // // //       }
// // // //     } catch (error) {
// // // //       console.error('Login error:', error);
// // // //       return { success: false, error: 'Network error. Please try again.' };
// // // //     }
// // // //   };

// // // //   const logout = () => {
// // // //     localStorage.removeItem('token');
// // // //     localStorage.removeItem('user');
// // // //     setToken(null);
// // // //     setUser(null);
// // // //     router.push('/');
// // // //   };

// // // //   return (
// // // //     <AuthContext.Provider value={{ 
// // // //       user, 
// // // //       token, 
// // // //       loading, 
// // // //       login, 
// // // //       logout 
// // // //     }}>
// // // //       {children}
// // // //     </AuthContext.Provider>
// // // //   );
// // // // }

// // // // export function useAuth() {
// // // //   const context = useContext(AuthContext);
// // // //   if (!context) {
// // // //     throw new Error('useAuth must be used within an AuthProvider');
// // // //   }
// // // //   return context;
// // // // }
// // // 'use client';

// // // import { createContext, useContext, useState, useEffect } from 'react';
// // // import { useRouter } from 'next/navigation';

// // // const AuthContext = createContext();

// // // export function AuthProvider({ children }) {
// // //   const [user, setUser] = useState(null);
// // //   const [token, setToken] = useState(null);
// // //   const [loading, setLoading] = useState(true);
// // //   const router = useRouter();

// // //   useEffect(() => {
// // //     const initializeAuth = async () => {
// // //       try {
// // //         const savedToken = localStorage.getItem('token');
// // //         const savedUser = localStorage.getItem('user');

// // //         if (savedToken && savedUser) {
// // //           setToken(savedToken);
// // //           const userData = JSON.parse(savedUser);
// // //           setUser(userData);
          
// // //           // Verify token with backend
// // //           const response = await fetch('/api/auth/me', {
// // //             headers: { 
// // //               'Authorization': `Bearer ${savedToken}`,
// // //               'Content-Type': 'application/json'
// // //             },
// // //           });

// // //           if (!response.ok) {
// // //             throw new Error('Token verification failed');
// // //           }

// // //           const freshUserData = await response.json();
// // //           setUser(freshUserData);
// // //           localStorage.setItem('user', JSON.stringify(freshUserData));
// // //         }
// // //       } catch (error) {
// // //         console.error('Auth initialization error:', error);
// // //         // Don't logout immediately, let the user try with stored credentials
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     };

// // //     initializeAuth();
// // //   }, []);

// // //   const login = async (email, password) => {
// // //     try {
// // //       const response = await fetch('/api/auth/login', {
// // //         method: 'POST',
// // //         headers: { 'Content-Type': 'application/json' },
// // //         body: JSON.stringify({ email, password }),
// // //       });

// // //       const data = await response.json();

// // //       if (response.ok && data.success) {
// // //         localStorage.setItem('token', data.token);
// // //         localStorage.setItem('user', JSON.stringify(data.user));
// // //         setToken(data.token);
// // //         setUser(data.user);
// // //         return { success: true };
// // //       } else {
// // //         return { 
// // //           success: false, 
// // //           error: data.message || data.error || 'Login failed' 
// // //         };
// // //       }
// // //     } catch (error) {
// // //       console.error('Login error:', error);
// // //       return { success: false, error: 'Network error. Please try again.' };
// // //     }
// // //   };

// // //   const logout = () => {
// // //     localStorage.removeItem('token');
// // //     localStorage.removeItem('user');
// // //     setToken(null);
// // //     setUser(null);
// // //     router.push('/');
// // //   };

// // //   return (
// // //     <AuthContext.Provider value={{ 
// // //       user, 
// // //       token, 
// // //       loading, 
// // //       login, 
// // //       logout 
// // //     }}>
// // //       {children}
// // //     </AuthContext.Provider>
// // //   );
// // // }

// // // export function useAuth() {
// // //   const context = useContext(AuthContext);
// // //   if (!context) {
// // //     throw new Error('useAuth must be used within an AuthProvider');
// // //   }
// // //   return context;
// // // }
// // 'use client';

// // import { createContext, useContext, useState, useEffect } from 'react';
// // import { useRouter } from 'next/navigation';

// // const AuthContext = createContext();

// // export function AuthProvider({ children }) {
// //   const [user, setUser] = useState(null);
// //   const [token, setToken] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const router = useRouter();

// //   useEffect(() => {
// //     const initializeAuth = async () => {
// //       try {
// //         const savedToken = localStorage.getItem('token');
// //         const savedUser = localStorage.getItem('user');

// //         if (savedToken && savedUser) {
// //           setToken(savedToken);
// //           const userData = JSON.parse(savedUser);
// //           setUser(userData);
          
// //           // Verify token with backend
// //           const response = await fetch('/api/auth/me', {
// //             headers: { 
// //               'Authorization': `Bearer ${savedToken}`,
// //               'Content-Type': 'application/json'
// //             },
// //           });

// //           if (!response.ok) {
// //             throw new Error('Token verification failed');
// //           }

// //           const freshUserData = await response.json();
// //           setUser(freshUserData);
// //           localStorage.setItem('user', JSON.stringify(freshUserData));
// //         }
// //       } catch (error) {
// //         console.error('Auth initialization error:', error);
// //         // Don't logout immediately, let the user try with stored credentials
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     initializeAuth();
// //   }, []);

// //   const login = async (email, password) => {
// //     try {
// //       const response = await fetch('/api/auth/login', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({ email, password }),
// //       });

// //       const data = await response.json();

// //       if (response.ok && data.success) {
// //         localStorage.setItem('token', data.token);
// //         localStorage.setItem('user', JSON.stringify(data.user));
// //         setToken(data.token);
// //         setUser(data.user);
// //         return { success: true };
// //       } else {
// //         return { 
// //           success: false, 
// //           error: data.message || data.error || 'Login failed' 
// //         };
// //       }
// //     } catch (error) {
// //       console.error('Login error:', error);
// //       return { success: false, error: 'Network error. Please try again.' };
// //     }
// //   };

// //   // ADD THIS REGISTER FUNCTION
// //   const register = async (userData) => {
// //     try {
// //       const response = await fetch('/api/auth/register', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify(userData),
// //       });

// //       const data = await response.json();

// //       if (response.ok && data.success) {
// //         localStorage.setItem('token', data.token);
// //         localStorage.setItem('user', JSON.stringify(data.user));
// //         setToken(data.token);
// //         setUser(data.user);
// //         return { success: true };
// //         if (result.success) {
// //         router.push('/auth/login'); 
// //         }
// //         else {
// //         setError(result.error);
// //         }

// //       } else {
// //         return { 
// //           success: false, 
// //           error: data.message || data.error || 'Registration failed' 
// //         };
// //       }
// //     } catch (error) {
// //       console.error('Registration error:', error);
// //       return { success: false, error: 'Network error. Please try again.' };
// //     }
// //   };

// //   const logout = () => {
// //     localStorage.removeItem('token');
// //     localStorage.removeItem('user');
// //     setToken(null);
// //     setUser(null);
// //     router.push('/');
// //   };

// //   return (
// //     <AuthContext.Provider value={{ 
// //       user, 
// //       token, 
// //       loading, 
// //       login, 
// //       register, // ADD THIS LINE
// //       logout 
// //     }}>
// //       {children}
// //     </AuthContext.Provider>
// //   );
// // }

// // export function useAuth() {
// //   const context = useContext(AuthContext);
// //   if (!context) {
// //     throw new Error('useAuth must be used within an AuthProvider');
// //   }
// //   return context;
// // }
// 'use client';

// import { createContext, useContext, useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';

// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   // Load stored auth data on first load
//   useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         const savedToken = localStorage.getItem('token');
//         const savedUser = localStorage.getItem('user');

//         if (savedToken && savedUser) {
//           setToken(savedToken);
//           const userData = JSON.parse(savedUser);
//           setUser(userData);

//           // Optionally verify token with backend
//           const response = await fetch('/api/auth/me', {
//             headers: { 
//               'Authorization': `Bearer ${savedToken}`,
//               'Content-Type': 'application/json'
//             },
//           });

//           if (response.ok) {
//             const freshUserData = await response.json();
//             setUser(freshUserData);
//             localStorage.setItem('user', JSON.stringify(freshUserData));
//           } else {
//             throw new Error('Token verification failed');
//           }
//         }
//       } catch (error) {
//         console.error('Auth initialization error:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initializeAuth();
//   }, []);

//   // -------------------------
//   // LOGIN FUNCTION
//   // -------------------------
//   const login = async (email, password) => {
//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await response.json();

//       if (response.ok && data.success) {
//         localStorage.setItem('token', data.token);
//         localStorage.setItem('user', JSON.stringify(data.user));
//         setToken(data.token);
//         setUser(data.user);
//         router.push('/'); // ✅ redirect after login
//         return { success: true };
//       } else {
//         return { 
//           success: false, 
//           error: data.message || data.error || 'Login failed' 
//         };
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       return { success: false, error: 'Network error. Please try again.' };
//     }
//   };

//   // -------------------------
//   // REGISTER FUNCTION
//   // -------------------------
//   const register = async (userData) => {
//     try {
//       const response = await fetch('/api/auth/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(userData),
//       });

//       const data = await response.json();

//       if (response.ok && data.success) {
//         // Optionally store user info (you can skip token here if not returned)
//         localStorage.setItem('user', JSON.stringify(data.user));
//         setUser(data.user);
//         router.push('/auth/login');
//         return { success: true };
//       } else {
//         return { 
//           success: false, 
//           error: data.message || data.error || 'Registration failed' 
//         };
//       }
//     } catch (error) {
//       console.error('Registration error:', error);
//       return { success: false, error: 'Network error. Please try again.' };
//     }
//   };

//   // -------------------------
//   // LOGOUT FUNCTION
//   // -------------------------
//   const logout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     setToken(null);
//     setUser(null);
//     router.push('/');
//   };

//   return (
//     <AuthContext.Provider value={{ 
//       user, 
//       token, 
//       loading, 
//       login, 
//       register, 
//       logout 
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        // ✅ Avoid unnecessary API call if token is missing or invalid
        if (
          savedToken &&
          savedToken !== 'null' &&
          savedToken !== 'undefined' &&
          savedUser
        ) {
          setToken(savedToken);
          const userData = JSON.parse(savedUser);
          setUser(userData);

          // ✅ Token exists, now verify with backend
          const response = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${savedToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const freshUserData = await response.json();
            setUser(freshUserData);
            localStorage.setItem('user', JSON.stringify(freshUserData));
          } else {
            throw new Error('Token verification failed');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);

        // ✅ Clear bad session data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        router.push('/'); // ✅ redirect after login
        return { success: true };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        router.push('/auth/login');
        return { success: true };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Registration failed',
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
