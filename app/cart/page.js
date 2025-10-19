
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // ✅ EFFICIENT: Memoized cart load
  const loadCart = useCallback(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(Array.isArray(parsedCart) ? parsedCart : []);
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('❌ Cart load error:', error);
      setCart([]);
      localStorage.removeItem('cart'); // Clean corrupt data
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      loadCart();
      setLoading(false);
    }
  }, [user, authLoading, router, loadCart]);

  // ✅ EFFICIENT: Memoized quantity update
  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedCart = cart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  }, [cart]);

  // ✅ EFFICIENT: Memoized remove
  const removeItem = useCallback((productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  }, [cart]);

  // ✅ EFFICIENT: Memoized clear
  const clearCart = useCallback(() => {
    if (confirm('Are you sure you want to clear the cart?')) {
      setCart([]);
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
    }
  }, []);

  // ✅ EFFICIENT: Memoized totals
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const shipping = subtotal > 5000 ? 0 : 50;
  const total = subtotal + shipping;

  if (loading || authLoading) {
    return (
      <div style={{ 
        minHeight: '80vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', 
            border: '4px solid #e5e7eb', 
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading cart...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (cart.length === 0) {
    return (
      <div style={{ minHeight: '80vh', padding: '2rem 0', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: '1rem' 
            }}>🛒</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Your cart is empty</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link href="/products" style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              display: 'inline-block',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', padding: '2rem 0', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            Shopping Cart ({cart.length} items)
          </h1>
          {cart.length > 0 && (
            <button 
              onClick={clearCart} 
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Clear Cart
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
          {/* Cart Items */}
          <div style={{ 
            background: 'white', 
            borderRadius: '0.75rem', 
            padding: '1.5rem', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' 
          }}>
            {cart.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                gap: '1rem',
                padding: '1rem 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <img
                  src={item.image || '/placeholder.jpg'}
                  alt={item.name}
                  style={{ 
                    width: '100px', 
                    height: '100px', 
                    objectFit: 'cover', 
                    borderRadius: '0.5rem',
                    background: '#f3f4f6'
                  }}
                  onError={(e) => {
                    e.target.src = '/placeholder.jpg';
                  }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {item.name}
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    {item.description}
                  </p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>
                    AED {Number(item.price).toLocaleString()}
                  </p>
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-end', 
                  gap: '0.5rem',
                  minWidth: '120px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      style={{
                        width: '2rem', height: '2rem',
                        border: '1px solid #d1d5db', background: 'white',
                        borderRadius: '0.375rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span style={{ 
                      minWidth: '2rem', 
                      textAlign: 'center', 
                      fontWeight: '500' 
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      style={{
                        width: '2rem', height: '2rem',
                        border: '1px solid #d1d5db', background: 'white',
                        borderRadius: '0.375rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      +
                    </button>
                  </div>
                  <div style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '600', 
                    color: '#1e293b' 
                  }}>
                    AED {(Number(item.price) * Number(item.quantity)).toLocaleString()}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      color: '#ef4444', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: '0.875rem',
                      padding: '0.25rem 0.5rem'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div style={{ 
            background: 'white', 
            borderRadius: '0.75rem', 
            padding: '1.5rem', 
            height: 'fit-content', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            position: 'sticky',
            top: '2rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Order Summary
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Subtotal ({cart.length} items)</span>
              <span>AED {subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span>Shipping</span>
              <span style={{ color: shipping === 0 ? '#10b981' : '#6b7280' }}>
                {shipping === 0 ? 'FREE' : `AED ${shipping}`}
              </span>
            </div>

            {shipping === 0 && (
              <div style={{
                padding: '0.75rem', backgroundColor: '#f0fdf4', color: '#166534',
                borderRadius: '0.375rem', fontSize: '0.875rem', marginBottom: '1rem',
                textAlign: 'center', border: '1px solid #bbf7d0'
              }}>
                🎉 Free shipping unlocked!
              </div>
            )}

            {subtotal < 5000 && subtotal > 0 && (
              <div style={{
                padding: '0.75rem', backgroundColor: '#fef3c7', color: '#92400e',
                borderRadius: '0.375rem', fontSize: '0.875rem', marginBottom: '1rem',
                textAlign: 'center', border: '1px solid #fed7aa'
              }}>
                Add AED {(5000 - subtotal).toLocaleString()} more for FREE shipping
              </div>
            )}

            <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '1rem 0' }}></div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '1.5rem', 
              fontWeight: 'bold', 
              fontSize: '1.25rem',
              color: '#1f2937'
            }}>
              <span>Total</span>
              <span style={{ color: '#dc2626' }}>
                AED {total.toLocaleString()}
              </span>
            </div>

            <Link href="/checkout" style={{
              width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white', border: 'none', padding: '1rem',
              borderRadius: '0.5rem', fontSize: '1rem', fontWeight: '600',
              cursor: 'pointer', display: 'block', textAlign: 'center',
              textDecoration: 'none', transition: 'all 0.2s ease',
              marginBottom: '1rem'
            }}>
              🛒 Proceed to Checkout
            </Link>

            <Link href="/products" style={{
              display: 'block', textAlign: 'center', color: '#6b7280',
              textDecoration: 'none', fontSize: '0.875rem'
            }}>
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}