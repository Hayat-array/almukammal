'use client';

import { useState, use } from 'react';
import products from '../../../data/products';
import Link from 'next/link';
import styles from './ProductDetail.module.css';

export default function ProductDetail({ params }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Unwrap params using React.use() for Next.js 15
  const resolvedParams = use(params);
  const id = resolvedParams?.id;
  const product = (Array.isArray(products) ? products : [])
    .find(p => String(p.id) === String(id));

  if (!product) {
    return (
      <div className={styles.notFound}>
        <h2>Product not found</h2>
        <p>We couldn't find the product you're looking for.</p>
        <div className={styles.notFoundActions}>
          <Link href="/products" className={styles.linkButton}>Back to products</Link>
        </div>
      </div>
    );
  }

  const imageBasePath = "/images/products/";
  const gallery = [product.image, ...(product.images || [])]
    .filter(Boolean)
    .map(img => `${imageBasePath}${img}`)
    .slice(0, 4);

  const related = (Array.isArray(products) ? products : [])
    .filter(p => String(p.category) === String(product.category) && String(p.id) !== String(product.id))
    .slice(0, 4);

  // Handle Add to Cart
  const handleAddToCart = () => {
    try {
      // Get cart from localStorage, ensure it's a valid array
      let cart = [];
      const storedCart = localStorage.getItem('cart');
      
      if (storedCart && storedCart !== 'null' && storedCart !== 'undefined') {
        try {
          cart = JSON.parse(storedCart);
          // Ensure cart is an array
          if (!Array.isArray(cart)) {
            cart = [];
          }
        } catch (e) {
          console.error('Error parsing cart:', e);
          cart = [];
        }
      }
      
      // Find existing item
      const existingItemIndex = cart.findIndex(item => item.id === product.id);
      
      if (existingItemIndex !== -1) {
        // Update existing item quantity
        cart[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to cart
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: gallery[0],
          quantity: quantity
        });
      }
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Dispatch custom event to update cart count
      window.dispatchEvent(new Event('cartUpdated'));
      
      alert(`${product.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  // Handle Buy Now
  const handleBuyNow = () => {
    handleAddToCart();
    window.location.href = '/checkout';
  };

  // Handle mouse move for zoom effect
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  // Generate WhatsApp message
  const getWhatsAppLink = () => {
    const message = `Hi, I'm interested in *${product.name}*\nPrice: AED ${product.price || ''}\n\nPlease provide more details.`;
    return `https://wa.me/971509550121?text=${encodeURIComponent(message)}`;
  };

  // Generate Email link
  const getEmailLink = () => {
    const subject = `Inquiry about ${product.name}`;
    const body = `Hello,\n\nI'm interested in ${product.name}\nPrice: AED ${product.price || ''}\n\nPlease provide more details about availability and delivery.\n\nThank you.`;
    return `mailto:info.almukammal@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.topGrid}>
        <div className={styles.gallery}>
          <div 
            className={styles.mainImageContainer}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <img
              src={gallery[selectedImage] || '/placeholder-laptop.jpg'}
              alt={`${product.name} main`}
              className={styles.mainImage}
              style={isHovering ? {
                transform: 'scale(1.5)',
                transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                transition: 'transform 0.1s ease-out'
              } : {}}
            />
          </div>
          <div className={styles.thumbs}>
            {gallery.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${product.name} ${i + 1}`}
                className={`${styles.thumb} ${selectedImage === i ? styles.thumbActive : ''}`}
                onClick={() => setSelectedImage(i)}
              />
            ))}
          </div>
        </div>

        <div className={styles.info}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{product.name}</h1>
            <span className={styles.model}>{product.model || ''}</span>
          </div>

          <p className={styles.summary}>{product.summary || product.description || ''}</p>

          <div className={styles.badges}>
            {product.isNew && <span className={styles.badge}>New</span>}
            {product.isBestSeller && <span className={styles.badge}>Best Seller</span>}
            {product.freeShipping && <span className={styles.badge}>Free Shipping</span>}
          </div>

          <div className={styles.price}>AED {product.price?.toLocaleString() ?? product.price ?? ''}</div>

          <div className={styles.specsGrid}>
            {product.specs && Object.entries(product.specs).slice(0, 4).map(([k, v]) => (
              <div key={k} className={styles.specCard}>
                <div className={styles.specKey}>{k}</div>
                <div className={styles.specVal}>{v}</div>
              </div>
            ))}
          </div>

          {/* Quantity Selector */}
          <div className={styles.quantitySelector}>
            <label>Quantity:</label>
            <div className={styles.quantityControls}>
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className={styles.quantityBtn}
              >
                -
              </button>
              <span className={styles.quantityValue}>{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className={styles.quantityBtn}
              >
                +
              </button>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.primary} onClick={handleAddToCart}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Add to Cart
            </button>
            <button className={styles.primaryAlt} onClick={handleBuyNow}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Buy Now
            </button>
            {/* <a
              className={`${styles.secondary} ${styles.whatsappBtn}`}
              href={getWhatsAppLink()}
              target="_blank"
              rel="noreferrer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </a>
            <a
              className={`${styles.secondary} ${styles.emailBtn}`}
              href={getEmailLink()}
              target="_blank"
              rel="noreferrer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m2 7 10 7 10-7"/>
              </svg>
              Email
            </a> */}
          </div>

          <div className={styles.metaRow}>
            <div><strong>Warranty:</strong> {product.warranty ?? '1 Year'}</div>
            <div><strong>Delivery:</strong> {product.delivery ?? 'Free in UAE (2-5 days)'}</div>
          </div>
        </div>
      </div>

      <div className={styles.details}>
        <h2>Product Highlights</h2>
        <p>{product.longDescription ?? product.description}</p>
        {Array.isArray(product.highlights) && (
          <ul className={styles.highlights}>
            {product.highlights.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        )}
        <h3>Warranty & Delivery</h3>
        <p><strong>Warranty:</strong> {product.warranty ?? '1 Year'}</p>
        <p><strong>Delivery:</strong> {product.delivery ?? 'Free in UAE (2-5 days)'}</p>
      </div>

      {related.length > 0 && (
        <div className={styles.relatedSection}>
          <h3>Related Products</h3>
          <div className={styles.relatedGrid}>
            {related.map(r => (
              <Link key={r.id} href={`/products/${r.id}`} className={styles.relatedCard}>
                <img
                  src={`/images/products/${r.image || 'placeholder-laptop.jpg'}`}
                  alt={r.name}
                  className={styles.relatedImg}
                />
                <div className={styles.relatedName}>{r.name}</div>
                <div className={styles.relatedPrice}>AED {r.price?.toLocaleString() ?? r.price ?? ''}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}