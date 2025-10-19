// components/AddToCartButton.js
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AddToCartButton({ product }) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const addToCart = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setIsLoading(true);
    
    try {
      // Get current cart
      const response = await fetch('/api/cart');
      let cart = { items: [] };
      
      if (response.ok) {
        cart = await response.json();
      }
      
      // Check if product already in cart
      const existingItemIndex = cart.items.findIndex(item => item.productId === product.id);
      
      if (existingItemIndex !== -1) {
        // Update quantity if already in cart
        cart.items[existingItemIndex].quantity += 1;
      } else {
        // Add new item
        cart.items.push({
          productId: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image,
          quantity: 1
        });
      }
      
      // Update cart
      const updateResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: cart.items }),
      });
      
      if (updateResponse.ok) {
        window.dispatchEvent(new Event('cartUpdated'));
        // Show success message
        alert('Product added to cart!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={addToCart}
      disabled={isLoading}
      style={{
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: isLoading ? 0.7 : 1
      }}
    >
      {isLoading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}