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





  const login = async (email, password, isAdminLogin = false, isDeliveryLogin = false) => {
    try {
      const isActualAdmin = isAdminLogin === true || isAdminLogin === 'admin';
      const isActualDelivery = isDeliveryLogin === true || isDeliveryLogin === 'delivery';
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          isAdminLogin: isActualAdmin,
          isDeliveryLogin: isActualDelivery
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Migrate cart to user-specific storage
        const oldCart = localStorage.getItem('cart');
        if (oldCart) {
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
        return {
          success: false,
          error: data.message || 'Login failed',
          needsVerification: data.needsVerification || false,
          email: data.email || null,
        };
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

      if (response.ok && data.success) {
        if (data.needsVerification) {
          return {
            success: true,
            needsVerification: true,
            email: data.email,
            message: data.message,
          };
        }

        // Fallback for immediate activation if ever used
        if (data.token) {
          localStorage.removeItem('cart');
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setCookie('token', data.token);
          setCookie('user_role', 'user');
          setToken(data.token);
          setUser(data.user);
        }
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const verifyOtp = async ({ email, otp, purpose = 'registration' }) => {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, purpose }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.token && data.user) {
          localStorage.removeItem('cart');
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setCookie('token', data.token);
          setCookie('user_role', data.user.role || 'user');
          setToken(data.token);
          setUser(data.user);
        }
        return { success: true, message: data.message, user: data.user };
      } else {
        return {
          success: false,
          error: data.message || 'Verification failed',
          remainingAttempts: data.remainingAttempts,
          code: data.code,
        };
      }
    } catch (error) {
      console.error('OTP verification network error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const resendOtp = async ({ email, purpose = 'registration' }) => {
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose }),
      });

      const data = await response.json();
      return {
        success: response.ok && data.success,
        message: data.message,
        waitSeconds: data.waitSeconds,
        cooldownSeconds: data.cooldownSeconds,
      };
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { success: false, message: 'Network error. Please try again.' };
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
        verifyOtp,
        resendOtp,
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
