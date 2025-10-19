
'use client';

import { useState, use, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import products from '../../../data/products';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import styles from './ProductDetail.module.css';

export default function ProductDetail({ params }) {
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
  const mainImageRef = useRef(null);

  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  
  // Compute isAuthenticated based on user and token
  const isAuthenticated = !!(user && token);

  // Unwrap params using React.use() for Next.js 15
  const resolvedParams = use(params);
  const id = resolvedParams?.id;

  // Memoize product lookup
  const product = useMemo(() => {
    return (Array.isArray(products) ? products : [])
      .find(p => String(p.id) === String(id));
  }, [id]);

  // Memoize image gallery
  const gallery = useMemo(() => {
    if (!product) return [];
    const imageBasePath = "/images/products/";
    return [product.image, ...(product.images || [])]
      .filter(Boolean)
      .map(img => `${imageBasePath}${img}`)
      .slice(0, 4);
  }, [product]);

  // Memoize related products
  const related = useMemo(() => {
    if (!product) return [];
    return (Array.isArray(products) ? products : [])
      .filter(p => String(p.category) === String(product.category) && String(p.id) !== String(product.id))
      .slice(0, 4);
  }, [product]);

  // Set loading state
  useEffect(() => {
    if (product) {
      setIsLoading(false);
    }
  }, [product]);

  // Show notification function with better UX
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Check authentication and show login modal if not authenticated
  const requireAuth = useCallback((actionCallback) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return false;
    }
    return actionCallback();
  }, [isAuthenticated]);

  // Handle Add to Cart with authentication
  const handleAddToCart = useCallback(async () => {
    return requireAuth(async () => {
      if (isAddingToCart) return;
      
      setIsAddingToCart(true);
      
      try {
        // Get cart from localStorage, ensure it's a valid array
        let cart = [];
        const cartKey = user?.id ? `cart_${user.id}` : 'cart';
        const storedCart = localStorage.getItem(cartKey);
        
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
            quantity: quantity,
            userId: user?.id // Associate with user
          });
        }
        
        // Save to localStorage with user-specific key if available
        localStorage.setItem(cartKey, JSON.stringify(cart));
        
        // Dispatch custom event to update cart count
        window.dispatchEvent(new Event('cartUpdated'));
        
        // Show notification instead of alert
        showNotification(`${product.name} added to cart!`);
      } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add item to cart. Please try again.', 'error');
      } finally {
        setIsAddingToCart(false);
      }
    });
  }, [product, quantity, gallery, showNotification, isAddingToCart, user, requireAuth]);

  // Handle Buy Now with authentication
  const handleBuyNow = useCallback(async () => {
    return requireAuth(async () => {
      await handleAddToCart();
      router.push('/checkout');
    });
  }, [handleAddToCart, router, requireAuth]);

  // Handle mouse move for zoom effect
  const handleMouseMove = useCallback((e) => {
    if (!mainImageRef.current) return;
    
    const rect = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  }, []);

  // Generate WhatsApp message
  const getWhatsAppLink = useCallback(() => {
    if (!product) return '#';
    const message = `Hi, I'm interested in *${product.name}*\nPrice: AED ${product.price || ''}\n\nPlease provide more details.`;
    return `https://wa.me/971509550121?text=${encodeURIComponent(message)}`;
  }, [product]);

  // Generate Email link
  const getEmailLink = useCallback(() => {
    if (!product) return '#';
    const subject = `Inquiry about ${product.name}`;
    const body = `Hello,\n\nI'm interested in ${product.name}\nPrice: AED ${product.price || ''}\n\nPlease provide more details about availability and delivery.\n\nThank you.`;
    return `mailto:info.almukammal@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [product]);

  // Handle quantity change with validation
  const handleQuantityChange = useCallback((newQuantity) => {
    const maxQuantity = product.stock || 10; // Default max quantity if not specified
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

  // Product not found state
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
      
      {/* Enhanced Login/Signup Required Modal */}
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
              <div className={styles.modalFooter}>
                <p>By continuing, you agree to our <Link href="/terms" onClick={handleCloseLoginModal}>Terms</Link> and <Link href="/privacy" onClick={handleCloseLoginModal}>Privacy Policy</Link></p>
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
                src={gallery[selectedImage] || '/placeholder-laptop.jpg'}
                alt={`${product.name} main`}
                loading="lazy"
                className={`${styles.mainImage} ${imageLoaded ? styles.loaded : ''}`}
                style={isHovering ? {
                  transform: 'scale(2)',
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                } : {}}
                onLoad={handleImageLoad}
                onError={(e) => {
                  e.target.src = '/placeholder-laptop.jpg';
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
                      e.target.style.display = 'none';
                      setThumbsLoaded(prev => ({ ...prev, [i]: true }));
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.info}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{product.name}</h1>
              <span className={styles.model}>{product.model || ''}</span>
            </div>

            <div className={styles.rating}>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < (product.rating || 4) ? styles.starFilled : styles.starEmpty}>★</span>
                ))}
              </div>
              <span className={styles.reviewCount}>({product.reviews || 12} reviews)</span>
            </div>

            <p className={styles.summary}>{product.summary || product.description || ''}</p>

            <div className={styles.badges}>
              {product.isNew && <span className={styles.badge}>New</span>}
              {product.isBestSeller && <span className={styles.badge}>Best Seller</span>}
              {product.freeShipping && <span className={styles.badge}>Free Shipping</span>}
              {product.discount && <span className={`${styles.badge} ${styles.discountBadge}`}>-{product.discount}%</span>}
            </div>

            <div className={styles.priceRow}>
              <div className={styles.price}>AED {product.price?.toLocaleString() ?? product.price ?? ''}</div>
              {product.originalPrice && (
                <div className={styles.originalPrice}>AED {product.originalPrice.toLocaleString()}</div>
              )}
            </div>

            <div className={styles.stockInfo}>
              <span className={`${styles.stock} ${product.stock > 0 ? styles.inStock : styles.outOfStock}`}>
                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </span>
            </div>

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
                  <>
                    <b>Add to Cart</b>
                  </>
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
              <div><strong>Delivery:</strong> {product.delivery ?? 'Free in UAE (2-5 days)'}</div>
            </div>
            
            <div className={styles.features}>
              <div className={styles.feature}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                <span>Authentic Product</span>
              </div>
              <div className={styles.feature}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16,8 20,8 23,11 23,16 16,16"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                <span>Free Delivery</span>
              </div>
              <div className={styles.feature}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Secure Payment</span>
              </div>
            </div>
          </div>
        </div>

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
          <button 
            className={`${styles.tab} ${activeTab === 'reviews' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'details' && (
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
          )}
          
          {activeTab === 'specs' && (
            <div className={styles.specifications}>
              <h2>Specifications</h2>
              {product.specs && (
                <div className={styles.specsTable}>
                  {Object.entries(product.specs).map(([k, v]) => (
                    <div key={k} className={styles.specRow}>
                      <div className={styles.specKey}>{k}</div>
                      <div className={styles.specVal}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div className={styles.reviews}>
              <h2>Customer Reviews</h2>
              <div className={styles.reviewSummary}>
                <div className={styles.averageRating}>
                  <div className={styles.ratingNumber}>{product.rating || 4.5}</div>
                  <div className={styles.stars}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < (product.rating || 4.5) ? styles.starFilled : styles.starEmpty}>★</span>
                    ))}
                  </div>
                  <div className={styles.reviewCount}>{product.reviews || 12} Reviews</div>
                </div>
              </div>
              <div className={styles.reviewList}>
                <div className={styles.review}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewerName}>John Doe</div>
                    <div className={styles.reviewDate}>October 15, 2023</div>
                    <div className={styles.reviewRating}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < 5 ? styles.starFilled : styles.starEmpty}>★</span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.reviewContent}>
                    Great product! Exactly as described and works perfectly. Highly recommend.
                  </div>
                </div>
                <div className={styles.review}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewerName}>Jane Smith</div>
                    <div className={styles.reviewDate}>September 28, 2023</div>
                    <div className={styles.reviewRating}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < 4 ? styles.starFilled : styles.starEmpty}>★</span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.reviewContent}>
                    Good quality product. Fast delivery and excellent customer service.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div className={styles.relatedSection}>
            <h3>Related Products</h3>
            <div className={styles.relatedGrid}>
              {related.map(r => (
                <Link key={r.id} href={`/products/${r.id}`} className={styles.relatedCard}>
                  <div className={styles.relatedImageContainer}>
                    <img
                      src={`/images/products/${r.image || 'placeholder-laptop.jpg'}`}
                      alt={r.name}
                      className={styles.relatedImg}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/placeholder-laptop.jpg';
                      }}
                    />
                    {r.discount && (
                      <div className={styles.discountBadge}>-{r.discount}%</div>
                    )}
                  </div>
                  <div className={styles.relatedContent}>
                    <div className={styles.relatedName}>{r.name}</div>
                    <div className={styles.relatedPriceRow}>
                      <div className={styles.relatedPrice}>AED {r.price?.toLocaleString() ?? r.price ?? ''}</div>
                      {r.originalPrice && (
                        <div className={styles.relatedOriginalPrice}>AED {r.originalPrice.toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}