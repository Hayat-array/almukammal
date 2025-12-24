'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import styles from './ProductDetail.module.css';

const MASTER_COLORS = [
  { name: 'Space Grey', hex: '#53565a' },
  { name: 'Silver', hex: '#c0c0c0' },
  { name: 'Midnight', hex: '#191970' },
  { name: 'Starlight', hex: '#f0ead6' },
  { name: 'Gold', hex: '#ffd700' },
  { name: 'Rose Gold', hex: '#b76e79' },
  { name: 'Graphite', hex: '#41424c' },
  { name: 'Black', hex: '#1c1c1c' },
  { name: 'White', hex: '#f5f5f7' },
  { name: 'Blue', hex: '#007aff' }
];

export default function ProductDetail() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [thumbsLoaded, setThumbsLoaded] = useState({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const mainImageRef = useRef(null);

  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const isAuthenticated = !!(user && token);
  const id = params?.id;

  // Fetch product from MongoDB
  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;

      try {
        const response = await fetch(`/api/products/${id}`);
        const data = await response.json();
        console.log('Product API Response:', { status: response.status, hasProduct: !!data.product, data });

        if (response.ok && data.product) {
          setProduct(data.product);
          if (data.product.colors && Array.isArray(data.product.colors) && data.product.colors.length > 0) {
            setSelectedColor(data.product.colors[0]);
          } else if (data.product.colors && typeof data.product.colors === 'string') {
            // Handle case where colors might come as string
            const cols = data.product.colors.split(',').map(c => c.trim()).filter(Boolean);
            if (cols.length > 0) setSelectedColor(cols[0]);
          }
          console.log('Processed colors:', data.product.colors, 'Initial selected:', selectedColor);
        } else {
          console.error('Product not found:', data.error || 'No product in response');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  // Reset image selection when color changes
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedColor]);

  // Memoize image gallery - filter by selected color if applicable
  const gallery = useMemo(() => {
    if (!product) return [];

    const uniqueImages = new Set();
    // Combine main image and images array
    const allImages = [];
    if (product.image) allImages.push(product.image);
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img && !allImages.includes(img)) allImages.push(img);
      });
    }

    const colorMap = product.imageColorMap || [];

    allImages.forEach((img) => {
      const mapping = colorMap.find(m => m.url === img);

      // If a color is selected, hide images mapped to OTHER colors
      if (selectedColor && mapping && mapping.color && mapping.color !== 'All') {
        if (mapping.color.toLowerCase() !== selectedColor.toLowerCase()) {
          return; // Skip this image
        }
      }

      uniqueImages.add(img);
    });

    const result = Array.from(uniqueImages)
      .map(img => img.startsWith('/') || img.startsWith('http') ? img : `/${img}`);

    return result.length > 0 ? result : (product.image ? [product.image.startsWith('/') || product.image.startsWith('http') ? product.image : `/${product.image}`] : []);
  }, [product, selectedColor]);

  // Show notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Require authentication
  const requireAuth = useCallback((actionCallback) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return false;
    }
    return actionCallback();
  }, [isAuthenticated]);

  // Handle Add to Cart
  const handleAddToCart = useCallback(async () => {
    return requireAuth(async () => {
      if (isAddingToCart) return;

      setIsAddingToCart(true);

      try {
        let cart = [];
        const cartKey = user?.id ? `cart_${user.id}` : 'cart';
        const storedCart = localStorage.getItem(cartKey);

        if (storedCart && storedCart !== 'null' && storedCart !== 'undefined') {
          try {
            cart = JSON.parse(storedCart);
            if (!Array.isArray(cart)) cart = [];
          } catch (e) {
            cart = [];
          }
        }

        const existingItemIndex = cart.findIndex(item => item.id === product.id || item.id === product._id);

        if (existingItemIndex !== -1) {
          cart[existingItemIndex].quantity += quantity;
        } else {
          cart.push({
            id: product.id || product._id,
            name: product.name,
            price: product.price,
            image: gallery[0],
            quantity: quantity,
            color: selectedColor,
            userId: user?.id
          });
        }

        localStorage.setItem(cartKey, JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));

        showNotification(`${product.name} added to cart!`);
      } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add item to cart. Please try again.', 'error');
      } finally {
        setIsAddingToCart(false);
      }
    });
  }, [product, quantity, gallery, showNotification, isAddingToCart, user, requireAuth]);

  // Handle Buy Now
  const handleBuyNow = useCallback(async () => {
    return requireAuth(async () => {
      await handleAddToCart();
      router.push('/checkout');
    });
  }, [handleAddToCart, router, requireAuth]);

  // Handle mouse move for zoom
  const handleMouseMove = useCallback((e) => {
    if (!mainImageRef.current) return;

    const rect = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  }, []);

  // Handle quantity change
  const handleQuantityChange = useCallback((newQuantity) => {
    const maxQuantity = product?.stock || 10;
    const validQuantity = Math.max(1, Math.min(newQuantity, maxQuantity));
    setQuantity(validQuantity);
  }, [product]);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Handle thumbnail load
  const handleThumbLoad = useCallback((index) => {
    setThumbsLoaded(prev => ({ ...prev, [index]: true }));
  }, []);

  // Handle login redirect
  const handleLoginRedirect = useCallback(() => {
    setShowLoginModal(false);
    router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
  }, [router]);

  // Handle signup redirect
  const handleSignupRedirect = useCallback(() => {
    setShowLoginModal(false);
    router.push('/auth/register?redirect=' + encodeURIComponent(window.location.pathname));
  }, [router]);

  // Handle close login modal
  const handleCloseLoginModal = useCallback(() => {
    setShowLoginModal(false);
  }, []);

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  // Product not found
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

  return (
    <>
      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Join Us to Continue</h3>
              <button
                className={styles.closeButton}
                onClick={handleCloseLoginModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <p>Please log in or create an account to add items to your cart and make purchases.</p>
              <div className={styles.modalActions}>
                <button
                  className={styles.primary}
                  onClick={handleLoginRedirect}
                >
                  Login to Your Account
                </button>
                <button
                  className={styles.primaryAlt}
                  onClick={handleSignupRedirect}
                >
                  Create New Account
                </button>
                <button
                  className={styles.secondary}
                  onClick={handleCloseLoginModal}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span className={styles.separator}>/</span>
          <Link href="/products">Products</Link>
          <span className={styles.separator}>/</span>
          <span className={styles.current}>{product.name}</span>
        </div>

        <div className={styles.topGrid}>
          {/* Image Gallery */}
          <div className={styles.gallery}>
            <div
              className={styles.mainImageContainer}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              ref={mainImageRef}
            >
              {!imageLoaded && (
                <div className={styles.imagePlaceholder}>
                  <div className={styles.imageSpinner}></div>
                </div>
              )}
              <img
                src={gallery[selectedImage] || '/placeholder.jpg'}
                alt={`${product.name} main`}
                loading="lazy"
                className={`${styles.mainImage} ${imageLoaded ? styles.loaded : ''}`}
                style={isHovering ? {
                  transform: 'scale(2)',
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                } : {}}
                onLoad={handleImageLoad}
                onError={(e) => {
                  e.target.src = '/placeholder.jpg';
                  setImageLoaded(true);
                }}
              />
              {isHovering && (
                <div
                  className={styles.zoomIndicator}
                  style={{
                    left: `${mousePosition.x}%`,
                    top: `${mousePosition.y}%`,
                  }}
                />
              )}
            </div>

            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className={styles.thumbs}>
                {gallery.map((src, i) => (
                  <div
                    key={i}
                    className={`${styles.thumbContainer} ${selectedImage === i ? styles.thumbActive : ''}`}
                    onClick={() => setSelectedImage(i)}
                  >
                    {!thumbsLoaded[i] && (
                      <div className={styles.thumbPlaceholder}></div>
                    )}
                    <img
                      src={src}
                      alt={`${product.name} ${i + 1}`}
                      className={`${styles.thumb} ${thumbsLoaded[i] ? styles.loaded : ''}`}
                      onLoad={() => handleThumbLoad(i)}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/placeholder.jpg';
                        setThumbsLoaded(prev => ({ ...prev, [i]: true }));
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* RELOCATED COLOR SELECTION */}
            <div className={styles.colorSelectorSection}>
              <span className={styles.colorSelectorTitle}>Select Finish / Color</span>
              <div className={styles.colorGrid}>
                {MASTER_COLORS.map((colorObj, index) => {
                  const isAvailable = Array.isArray(product.colors) &&
                    product.colors.some(c => (c && typeof c === 'string' ? c.toLowerCase() : '') === colorObj.name.toLowerCase());

                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => isAvailable && setSelectedColor(colorObj.name)}
                      className={`
                        ${styles.colorChip} 
                        ${selectedColor === colorObj.name ? styles.active : ''} 
                        ${!isAvailable ? styles.unavailable : ''}
                      `}
                      title={isAvailable ? `Select ${colorObj.name}` : `${colorObj.name} not available`}
                    >
                      <span
                        className={styles.colorPreview}
                        style={{ background: colorObj.hex }}
                      ></span>
                      {colorObj.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className={styles.info}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{product.name}</h1>
              {product.brand && <span className={styles.model}>{product.brand}</span>}
            </div>

            <div className={styles.rating}>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < (product.ratings?.average || 4) ? styles.starFilled : styles.starEmpty}>★</span>
                ))}
              </div>
              <span className={styles.reviewCount}>({product.ratings?.count || 12} reviews)</span>
            </div>

            <p className={styles.summary}>{product.description || ''}</p>

            <div className={styles.priceRow}>
              {product.discountBadge && (
                <div style={{
                  display: 'inline-block',
                  background: '#dc2626',
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  marginBottom: '12px'
                }}>
                  {product.discountBadge}
                </div>
              )}
              <div className={styles.price}>
                {product.discountedPrice ? (
                  <>
                    <span style={{ textDecoration: 'line-through', fontSize: '0.7em', opacity: 0.6, marginRight: '12px', color: '#6b7280' }}>
                      AED {product.price?.toLocaleString()}
                    </span>
                    <span style={{ color: '#16a34a' }}>
                      AED {product.discountedPrice?.toLocaleString()}
                    </span>
                  </>
                ) : (
                  `AED ${product.price?.toLocaleString() ?? product.price ?? ''}`
                )}
              </div>
            </div>

            <div className={styles.stockInfo}>
              <span className={`${styles.stock} ${product.stock > 0 ? styles.inStock : styles.outOfStock}`}>
                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </span>
            </div>

            {/* Specs Grid */}
            {product.specs && (
              <div className={styles.specsGrid}>
                {Object.entries(product.specs).slice(0, 4).map(([k, v]) => (
                  <div key={k} className={styles.specCard}>
                    <div className={styles.specKey}>{k}</div>
                    <div className={styles.specVal}>{v}</div>
                  </div>
                ))}
              </div>
            )}


            {/* Quantity Selector */}
            <div className={styles.quantitySelector}>
              <label>Quantity:</label>
              <div className={styles.quantityControls}>
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className={styles.quantityBtn}
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock || 10}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className={styles.quantityInput}
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className={styles.quantityBtn}
                  aria-label="Increase quantity"
                  disabled={quantity >= (product.stock || 10)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actions}>
              <button
                className={styles.primary}
                onClick={handleAddToCart}
                disabled={isAddingToCart || product.stock <= 0 || authLoading}
              >
                {isAddingToCart ? (
                  <>
                    <div className={styles.btnSpinner}></div>
                    Adding...
                  </>
                ) : (
                  <b>Add to Cart</b>
                )}
              </button>
              <button
                className={styles.primaryAlt}
                onClick={handleBuyNow}
                disabled={product.stock <= 0 || authLoading}
              >
                <b>Buy Now</b>
              </button>
            </div>

            {!isAuthenticated && !authLoading && (
              <div className={styles.authNotice}>
                <p>💡 <strong>Login or Sign Up required</strong> to add items to cart and make purchases</p>
              </div>
            )}

            <div className={styles.metaRow}>
              <div><strong>Warranty:</strong> {product.warranty ?? '1 Year'}</div>
              <div><strong>Delivery:</strong> Free in UAE (2-5 days)</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'details' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Product Details
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'specs' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            Specifications
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'details' && (
            <div className={styles.details}>
              <h2>Product Highlights</h2>
              <p>{product.description}</p>
              <h3>Warranty & Delivery</h3>
              <p><strong>Warranty:</strong> {product.warranty ?? '1 Year'}</p>
              <p><strong>Delivery:</strong> Free in UAE (2-5 days)</p>
            </div>
          )}

          {activeTab === 'specs' && product.specs && (
            <div className={styles.specifications}>
              <h2>Specifications</h2>
              <div className={styles.specsTable}>
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className={styles.specRow}>
                    <div className={styles.specKey}>{k}</div>
                    <div className={styles.specVal}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}