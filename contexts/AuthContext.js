'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* Helper to manage cookies */
  const setCookie = (name, value, days = 7) => {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  };

  const removeCookie = (name) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          const userData = JSON.parse(savedUser);
          setUser(userData);

          // Verify token with backend
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`,
              'Content-Type': 'application/json'
            },
          });

          if (response.ok) {
            const freshUserData = await response.json();
            setUser(freshUserData);
            localStorage.setItem('user', JSON.stringify(freshUserData));

            // ✅ Sync Cookies (Fixes infinite redirect loop if cookies missing)
            setCookie('token', savedToken);
            setCookie('user_role', freshUserData.role || 'user');

            // ✅ Redirect away from login pages OR Home if Admin
            const path = window.location.pathname;
            if (path.includes('/auth/login') || path.includes('/auth/register') || path.includes('/auth/admin/login')) {
              if (freshUserData.role === 'admin') {
                router.push('/admin');
              } else {
                router.push('/');
              }
            } else if (path === '/' && freshUserData.role === 'admin') {
              // ✅ Force Admin to Dashboard if on Home
              router.push('/admin');
            }

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

        // Ensure cookies are gone too if local storage was bad
        removeCookie('token');
        removeCookie('user_role');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);





  const login = async (email, password, isAdminLogin = false) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, isAdminLogin }),
      });

      const data = await response.json();

      if (response.ok) {
        // Migrate cart to user-specific storage
        const oldCart = localStorage.getItem('cart');
        if (oldCart) {
          // Save old cart to user-specific key
          localStorage.setItem(`cart_${data.user._id}`, oldCart);
          localStorage.removeItem('cart'); // Clear generic cart
        }

        // Load user's specific cart
        const userCart = localStorage.getItem(`cart_${data.user._id}`);
        if (userCart) {
          localStorage.setItem('cart', userCart);
        }

        // Store in localStorage (for client-side compat)
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Store in cookies (for middleware)
        setCookie('token', data.token);
        setCookie('user_role', data.user.role || 'user');

        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (formData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear any previous cart data
        localStorage.removeItem('cart');

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); // Fixed: ensure user is saved

        setCookie('token', data.token);
        setCookie('user_role', 'user'); // Default to user for register

        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    // Save current cart to user-specific storage before logout
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentCart = localStorage.getItem('cart');
    if (currentUser._id && currentCart) {
      localStorage.setItem(`cart_${currentUser._id}`, currentCart);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart'); // Clear active cart
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userProfileImage');

    removeCookie('token');
    removeCookie('user_role');

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
