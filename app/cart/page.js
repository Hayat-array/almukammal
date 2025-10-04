'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './cart.css';

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setLoading(false);
  }, []);

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeItem = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    if (confirm('Are you sure you want to clear the cart?')) {
      setCart([]);
      localStorage.removeItem('cart');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 5000 ? 0 : 50; // Free shipping over AED 5000
  const total = subtotal + shipping;

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="spinner"></div>
        <p>Loading cart...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <div className="empty-icon">🛒</div>
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <Link href="/products" className="shop-button">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <h1>Shopping Cart</h1>
          <button onClick={clearCart} className="clear-button">
            Clear Cart
          </button>
        </div>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="item-image" />
                
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p className="item-price">AED {item.price.toLocaleString()}</p>
                </div>

                <div className="item-quantity">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="qty-btn"
                  >
                    -
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="qty-btn"
                  >
                    +
                  </button>
                </div>

                <div className="item-total">
                  <p>AED {(item.price * item.quantity).toLocaleString()}</p>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="remove-btn"
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <h2>Order Summary</h2>
            
            <div className="summary-row">
              <span>Subtotal ({cart.length} items)</span>
              <span>AED {subtotal.toLocaleString()}</span>
            </div>

            <div className="summary-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `AED ${shipping}`}</span>
            </div>

            {shipping === 0 && (
              <div className="free-shipping-notice">
                🎉 You've qualified for free shipping!
              </div>
            )}

            {subtotal < 5000 && subtotal > 0 && (
              <div className="shipping-notice">
                Add AED {(5000 - subtotal).toLocaleString()} more for free shipping
              </div>
            )}

            <div className="summary-divider"></div>

            <div className="summary-row summary-total">
              <span>Total</span>
              <span>AED {total.toLocaleString()}</span>
            </div>

            <Link href="/checkout" className="checkout-button">
              Proceed to Checkout
            </Link>

            <Link href="/products" className="continue-shopping">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}