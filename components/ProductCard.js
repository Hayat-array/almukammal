// // // 'use client';

// // // import { useState, useEffect } from 'react';
// // // import './ProductCard.css';

// // // export default function ProductCard({ product }) {
// // //   const [imgSrc, setImgSrc] = useState('/placeholder-laptop.jpg');
// // //   const [isLoading, setIsLoading] = useState(true);
// // //   const [imageLoaded, setImageLoaded] = useState(false);
// // //   const [showDefault, setShowDefault] = useState(false);
// // //   const specs = product.specs || {};

// // //   const currentYear = new Date().getFullYear();
  
// // //   // Check if product is new (current year)
// // //   const isNewProduct = product.year === currentYear || 
// // //     (product.releaseDate && new Date(product.releaseDate).getFullYear() === currentYear);

// // //   // List of supported image formats
// // //   const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.tiff'];

// // //   // Function to check if the image path has a valid extension
// // //   const hasValidImageExtension = (filename) => {
// // //     return supportedFormats.some(format => 
// // //       filename.toLowerCase().endsWith(format)
// // //     );
// // //   };

// // //   // Function to get image path with fallback
// // //   const getImagePath = () => {
// // //     if (!product.image) return '/placeholder-laptop.jpg';
    
// // //     // If image already has a full URL or path
// // //     if (product.image.startsWith('http') || product.image.startsWith('/')) {
// // //       return product.image;
// // //     }
    
// // //     // Check if it has a valid extension
// // //     if (hasValidImageExtension(product.image)) {
// // //       return `/images/${product.image}`;
// // //     }
    
// // //     // If no extension or invalid extension, try common formats
// // //     return `/images/${product.image}.jpg`;
// // //   };

// // //   useEffect(() => {
// // //     let timeoutId;
// // //     let isMounted = true;

// // //     const loadImage = async () => {
// // //       if (!isMounted) return;

// // //       const imageUrl = getImagePath();
      
// // //       try {
// // //         const img = new Image();
        
// // //         img.onload = () => {
// // //           if (isMounted) {
// // //             setImageLoaded(true);
// // //             setImgSrc(imageUrl);
// // //             setIsLoading(false);
// // //             clearTimeout(timeoutId);
// // //           }
// // //         };
        
// // //         img.onerror = () => {
// // //           if (isMounted) {
// // //             // Try fallback extensions if first attempt fails
// // //             const fallbackExtensions = ['.jpg', '.png', '.webp', '.jpeg'];
// // //             let fallbackIndex = 0;
            
// // //             const tryFallback = () => {
// // //               if (fallbackIndex < fallbackExtensions.length && isMounted) {
// // //                 const fallbackUrl = `/images/${product.image}${fallbackExtensions[fallbackIndex]}`;
// // //                 const fallbackImg = new Image();
                
// // //                 fallbackImg.onload = () => {
// // //                   if (isMounted) {
// // //                     setImageLoaded(true);
// // //                     setImgSrc(fallbackUrl);
// // //                     setIsLoading(false);
// // //                     clearTimeout(timeoutId);
// // //                   }
// // //                 };
                
// // //                 fallbackImg.onerror = () => {
// // //                   fallbackIndex++;
// // //                   tryFallback();
// // //                 };
                
// // //                 fallbackImg.src = fallbackUrl;
// // //               } else if (isMounted) {
// // //                 // All fallbacks failed
// // //                 setImageLoaded(false);
// // //                 setShowDefault(true);
// // //                 setIsLoading(false);
// // //                 clearTimeout(timeoutId);
// // //               }
// // //             };
            
// // //             tryFallback();
// // //           }
// // //         };
        
// // //         img.src = imageUrl;
        
// // //       } catch (error) {
// // //         if (isMounted) {
// // //           setImageLoaded(false);
// // //           setShowDefault(true);
// // //           setIsLoading(false);
// // //           clearTimeout(timeoutId);
// // //         }
// // //       }
// // //     };

// // //     // Set 8-second timeout
// // //     timeoutId = setTimeout(() => {
// // //       if (isMounted && !imageLoaded) {
// // //         setShowDefault(true);
// // //         setIsLoading(false);
// // //       }
// // //     }, 8000);

// // //     // Start loading the image
// // //     loadImage();

// // //     return () => {
// // //       isMounted = false;
// // //       clearTimeout(timeoutId);
// // //     };
// // //   }, [product.image, imageLoaded]);

// // //   const handleImageError = () => {
// // //     setImageLoaded(false);
// // //     setShowDefault(true);
// // //     setIsLoading(false);
// // //   };

// // //   const handleImageLoad = () => {
// // //     setImageLoaded(true);
// // //     setIsLoading(false);
// // //   };

// // //   if (isLoading) {
// // //     return (
// // //       <div className="product-card loading">
// // //         <div className="product-image-container">
// // //           <div className="image-loader">
// // //             <div className="loader-spinner"></div>
// // //             <p className="loader-text">Loading image...</p>
// // //           </div>
// // //         </div>
// // //         <div className="product-info">
// // //           <div className="skeleton-loading" style={{ height: '1.5rem', marginBottom: '0.5rem' }}></div>
// // //           <div className="skeleton-loading" style={{ height: '2.5rem', marginBottom: '1rem' }}></div>
// // //           <div className="specs-section">
// // //             <div className="skeleton-loading" style={{ height: '1rem', marginBottom: '0.5rem' }}></div>
// // //             {[1, 2, 3, 4].map(i => (
// // //               <div key={i} className="skeleton-loading" style={{ height: '0.8rem', marginBottom: '0.25rem' }}></div>
// // //             ))}
// // //           </div>
// // //           <div className="action-buttons">
// // //             <div className="skeleton-loading" style={{ height: '2.5rem' }}></div>
// // //             <div className="skeleton-loading" style={{ height: '2.5rem' }}></div>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="product-card">
// // //       {/* Product Image - Fixed Height */}
// // //       <div className="product-image-container">
// // //         {showDefault && !imageLoaded ? (
// // //           <div className="no-photo-found">
// // //             <svg className="no-photo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
// // //             </svg>
// // //             <p>No Photo Available</p>
// // //           </div>
// // //         ) : (
// // //           <img 
// // //             src={imgSrc}
// // //             alt={product.name} 
// // //             className="product-image"
// // //             onError={handleImageError}
// // //             onLoad={handleImageLoad}
// // //           />
// // //         )}
// // //         {/* Price Badge */}
// // //         <div className="price-badge">
// // //           AED {product.price.toLocaleString()}
// // //         </div>
        
// // //         {/* New Badge - Show if product is from current year */}
// // //         {isNewProduct && (
// // //           <div className="new-badge">
// // //             NEW
// // //           </div>
// // //         )}
        
// // //         {/* Year Badge - Show if year is available */}
// // //         {(product.year || product.releaseDate) && (
// // //           <div className="year-badge">
// // //             {product.year || new Date(product.releaseDate).getFullYear()}
// // //           </div>
// // //         )}
// // //       </div>

// // //       {/* Rest of your component remains the same */}
// // //       <div className="product-info">
// // //         {/* Product Name */}
// // //         <h3 className="product-name">
// // //           {product.name}
// // //         </h3>
        
// // //         {/* Description */}
// // //         <p className="product-description">
// // //           {product.description}
// // //         </p>

// // //         {/* Specifications - Compact */}
// // //         <div className="specs-section">
// // //           <h4 className="specs-title">
// // //             <svg className="specs-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
// // //             </svg>
// // //             Key Specs
// // //           </h4>
// // //           <div className="specs-list">
// // //             {specs.cpu && (
// // //               <div className="spec-item">
// // //                 <span className="spec-label">CPU:</span>
// // //                 <span className="spec-value">{specs.cpu}</span>
// // //               </div>
// // //             )}
// // //             {specs.ram && (
// // //               <div className="spec-item">
// // //                 <span className="spec-label">RAM:</span>
// // //                 <span className="spec-value">{specs.ram}</span>
// // //               </div>
// // //             )}
// // //             {specs.storage && (
// // //               <div className="spec-item">
// // //                 <span className="spec-label">Storage:</span>
// // //                 <span className="spec-value">{specs.storage}</span>
// // //               </div>
// // //             )}
// // //             {specs.display && (
// // //               <div className="spec-item">
// // //                 <span className="spec-label">Display:</span>
// // //                 <span className="spec-value">{specs.display}</span>
// // //               </div>
// // //             )}
// // //           </div>
// // //         </div>

// // //         {/* Action Buttons - Fixed at bottom */}
// // //         <div className="action-buttons">
// // //           <a
// // //             href={`https://wa.me/+971509550121?text=${encodeURIComponent(`I'm interested in ${product.name} -  AED ${product.price}`)}`}
// // //             target="_blank"
// // //             rel="noopener noreferrer"
// // //             className="whatsapp-btn"
// // //           >
// // //             <svg className="btn-icon" fill="currentColor" viewBox="0 0 24 24">
// // //               <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.176-1.24-6.16-3.495-8.411"/>
// // //             </svg>
// // //             <span>WhatsApp</span>
// // //           </a>
          
// // //           <a
// // //             href={`https://mail.google.com/mail/?view=cm&fs=1&to=info.almukammal@gmail.com&su=${encodeURIComponent(`Inquiry about ${product.name}`)}&body=${encodeURIComponent(`Hello, I'm interested in the ${product.name} priced at  AED ${product.price}. Please provide more details.`)}`}
// // //             target="_blank"
// // //             rel="noopener noreferrer"
// // //             className="email-btn"
// // //           >
// // //             <svg className="btn-icon" fill="currentColor" viewBox="0 0 24 24">
// // //               <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
// // //             </svg>
// // //             <span>Email</span>
// // //           </a>
// // //         </div>

// // //         {/* Additional Info */}
// // //         <div className="additional-info">
// // //           <span className="info-item">
// // //             <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
// // //             </svg>
// // //             <span>Free Ship</span>
// // //           </span>
// // //           <span className="info-item">
// // //             <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
// // //             </svg>
// // //             <span>1 Year</span>
// // //           </span>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }
// // // // 'use client';

// // // // import { useState, useEffect } from 'react';
// // // // import Link from 'next/link';
// // // // import './ProductCard.css';

// // // // export default function ProductCard({ product }) {
// // // //   // Add safety check for product
// // // //   if (!product) {
// // // //     return (
// // // //       <div className="product-card loading">
// // // //         <div className="product-image-container">
// // // //           <div className="image-loader">
// // // //             <div className="loader-spinner"></div>
// // // //             <p className="loader-text">Product not available</p>
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   const [imgSrc, setImgSrc] = useState('/placeholder-laptop.jpg');
// // // //   const [isLoading, setIsLoading] = useState(true);
// // // //   const [imageLoaded, setImageLoaded] = useState(false);
// // // //   const [showDefault, setShowDefault] = useState(false);
  
// // // //   // Safe access to specs with fallback
// // // //   const specs = product?.specs || {};

// // // //   const currentYear = new Date().getFullYear();
  
// // // //   // Check if product is new (current year)
// // // //   const isNewProduct = product?.year === currentYear || 
// // // //     (product?.releaseDate && new Date(product.releaseDate).getFullYear() === currentYear);

// // // //   // List of supported image formats
// // // //   const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.tiff'];

// // // //   // Function to check if the image path has a valid extension
// // // //   const hasValidImageExtension = (filename) => {
// // // //     if (!filename) return false;
// // // //     return supportedFormats.some(format => 
// // // //       filename.toLowerCase().endsWith(format)
// // // //     );
// // // //   };

// // // //   // Function to get image path with fallback
// // // //   const getImagePath = () => {
// // // //     if (!product?.image) return '/placeholder-laptop.jpg';
    
// // // //     // If image already has a full URL or path
// // // //     if (product.image.startsWith('http') || product.image.startsWith('/')) {
// // // //       return product.image;
// // // //     }
    
// // // //     // Check if it has a valid extension
// // // //     if (hasValidImageExtension(product.image)) {
// // // //       return `/images/${product.image}`;
// // // //     }
    
// // // //     // If no extension or invalid extension, try common formats
// // // //     return `/images/${product.image}.jpg`;
// // // //   };

// // // //   useEffect(() => {
// // // //     let timeoutId;
// // // //     let isMounted = true;

// // // //     const loadImage = async () => {
// // // //       if (!isMounted || !product?.image) return;

// // // //       const imageUrl = getImagePath();
      
// // // //       try {
// // // //         const img = new Image();
        
// // // //         img.onload = () => {
// // // //           if (isMounted) {
// // // //             setImageLoaded(true);
// // // //             setImgSrc(imageUrl);
// // // //             setIsLoading(false);
// // // //             clearTimeout(timeoutId);
// // // //           }
// // // //         };
        
// // // //         img.onerror = () => {
// // // //           if (isMounted) {
// // // //             // Try fallback extensions if first attempt fails
// // // //             const fallbackExtensions = ['.jpg', '.png', '.webp', '.jpeg'];
// // // //             let fallbackIndex = 0;
            
// // // //             const tryFallback = () => {
// // // //               if (fallbackIndex < fallbackExtensions.length && isMounted) {
// // // //                 const fallbackUrl = `/images/${product.image}${fallbackExtensions[fallbackIndex]}`;
// // // //                 const fallbackImg = new Image();
                
// // // //                 fallbackImg.onload = () => {
// // // //                   if (isMounted) {
// // // //                     setImageLoaded(true);
// // // //                     setImgSrc(fallbackUrl);
// // // //                     setIsLoading(false);
// // // //                     clearTimeout(timeoutId);
// // // //                   }
// // // //                 };
                
// // // //                 fallbackImg.onerror = () => {
// // // //                   fallbackIndex++;
// // // //                   tryFallback();
// // // //                 };
                
// // // //                 fallbackImg.src = fallbackUrl;
// // // //               } else if (isMounted) {
// // // //                 // All fallbacks failed
// // // //                 setImageLoaded(false);
// // // //                 setShowDefault(true);
// // // //                 setIsLoading(false);
// // // //                 clearTimeout(timeoutId);
// // // //               }
// // // //             };
            
// // // //             tryFallback();
// // // //           }
// // // //         };
        
// // // //         img.src = imageUrl;
        
// // // //       } catch (error) {
// // // //         if (isMounted) {
// // // //           setImageLoaded(false);
// // // //           setShowDefault(true);
// // // //           setIsLoading(false);
// // // //           clearTimeout(timeoutId);
// // // //         }
// // // //       }
// // // //     };

// // // //     // Set 8-second timeout
// // // //     timeoutId = setTimeout(() => {
// // // //       if (isMounted && !imageLoaded) {
// // // //         setShowDefault(true);
// // // //         setIsLoading(false);
// // // //       }
// // // //     }, 8000);

// // // //     // Start loading the image
// // // //     loadImage();

// // // //     return () => {
// // // //       isMounted = false;
// // // //       clearTimeout(timeoutId);
// // // //     };
// // // //   }, [product?.image, imageLoaded]);

// // // //   const handleImageError = () => {
// // // //     setImageLoaded(false);
// // // //     setShowDefault(true);
// // // //     setIsLoading(false);
// // // //   };

// // // //   const handleImageLoad = () => {
// // // //     setImageLoaded(true);
// // // //     setIsLoading(false);
// // // //   };

// // // //   const handleWhatsAppClick = (e) => {
// // // //     e.preventDefault();
// // // //     e.stopPropagation();
// // // //     const url = `https://wa.me/+971509550121?text=${encodeURIComponent(`I'm interested in ${product?.name || 'this product'} - ₹${product?.price || ''}`)}`;
// // // //     window.open(url, '_blank');
// // // //   };

// // // //   const handleEmailClick = (e) => {
// // // //     e.preventDefault();
// // // //     e.stopPropagation();
// // // //     const url = `https://mail.google.com/mail/?view=cm&fs=1&to=info.almukammal@gmail.com&su=${encodeURIComponent(`Inquiry about ${product?.name || 'product'}`)}&body=${encodeURIComponent(`Hello, I'm interested in the ${product?.name || 'this product'} priced at ₹${product?.price || ''}. Please provide more details.`)}`;
// // // //     window.open(url, '_blank');
// // // //   };

// // // //   if (isLoading) {
// // // //     return (
// // // //       <div className="product-card loading">
// // // //         <div className="product-image-container">
// // // //           <div className="image-loader">
// // // //             <div className="loader-spinner"></div>
// // // //             <p className="loader-text">Loading image...</p>
// // // //           </div>
// // // //         </div>
// // // //         <div className="product-info">
// // // //           <div className="skeleton-loading" style={{ height: '1.5rem', marginBottom: '0.5rem' }}></div>
// // // //           <div className="skeleton-loading" style={{ height: '2.5rem', marginBottom: '1rem' }}></div>
// // // //           <div className="specs-section">
// // // //             <div className="skeleton-loading" style={{ height: '1rem', marginBottom: '0.5rem' }}></div>
// // // //             {[1, 2, 3, 4].map(i => (
// // // //               <div key={i} className="skeleton-loading" style={{ height: '0.8rem', marginBottom: '0.25rem' }}></div>
// // // //             ))}
// // // //           </div>
// // // //           <div className="action-buttons">
// // // //             <div className="skeleton-loading" style={{ height: '2.5rem' }}></div>
// // // //             <div className="skeleton-loading" style={{ height: '2.5rem' }}></div>
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   return (
// // // //     <div className="product-card-wrapper">
// // // //       <Link href={`/products/${product?.id}`} className="product-card-link">
// // // //         <div className="product-card">
// // // //           {/* Product Image Container */}
// // // //           <div className="product-image-container">
// // // //             {showDefault && !imageLoaded ? (
// // // //               <div className="no-photo-found">
// // // //                 <svg className="no-photo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
// // // //                 </svg>
// // // //                 <p>No Photo Available</p>
// // // //               </div>
// // // //             ) : (
// // // //               <img 
// // // //                 src={imgSrc}
// // // //                 alt={product?.name || 'Product'} 
// // // //                 className="product-image"
// // // //                 onError={handleImageError}
// // // //                 onLoad={handleImageLoad}
// // // //               />
// // // //             )}
// // // //             {/* Price Badge */}
// // // //             <div className="price-badge">
// // // //               ₹{product?.price?.toLocaleString() || '0'}
// // // //             </div>
            
// // // //             {/* New Badge */}
// // // //             {isNewProduct && (
// // // //               <div className="new-badge">
// // // //                 NEW
// // // //               </div>
// // // //             )}
            
// // // //             {/* Year Badge */}
// // // //             {(product?.year || product?.releaseDate) && (
// // // //               <div className="year-badge">
// // // //                 {product?.year || new Date(product.releaseDate).getFullYear()}
// // // //               </div>
// // // //             )}
// // // //           </div>

// // // //           {/* Product Info */}
// // // //           <div className="product-info">
// // // //             <h3 className="product-name">
// // // //               {product?.name || 'Product Name'}
// // // //             </h3>
            
// // // //             <p className="product-description">
// // // //               {product?.description || 'Product description not available'}
// // // //             </p>

// // // //             {/* Specifications */}
// // // //             <div className="specs-section">
// // // //               <h4 className="specs-title">
// // // //                 <svg className="specs-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
// // // //                 </svg>
// // // //                 Key Specs
// // // //               </h4>
// // // //               <div className="specs-list">
// // // //                 {specs.cpu && (
// // // //                   <div className="spec-item">
// // // //                     <span className="spec-label">CPU:</span>
// // // //                     <span className="spec-value">{specs.cpu}</span>
// // // //                   </div>
// // // //                 )}
// // // //                 {specs.ram && (
// // // //                   <div className="spec-item">
// // // //                     <span className="spec-label">RAM:</span>
// // // //                     <span className="spec-value">{specs.ram}</span>
// // // //                   </div>
// // // //                 )}
// // // //                 {specs.storage && (
// // // //                   <div className="spec-item">
// // // //                     <span className="spec-label">Storage:</span>
// // // //                     <span className="spec-value">{specs.storage}</span>
// // // //                   </div>
// // // //                 )}
// // // //                 {specs.display && (
// // // //                   <div className="spec-item">
// // // //                     <span className="spec-label">Display:</span>
// // // //                     <span className="spec-value">{specs.display}</span>
// // // //                   </div>
// // // //                 )}
// // // //               </div>
// // // //             </div>

// // // //             {/* Additional Info */}
// // // //             <div className="additional-info">
// // // //               <span className="info-item">
// // // //                 <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
// // // //                 </svg>
// // // //                 <span>Free Ship</span>
// // // //               </span>
// // // //               <span className="info-item">
// // // //                 <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
// // // //                 </svg>
// // // //                 <span>1 Year</span>
// // // //               </span>
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       </Link>

// // // //       {/* Action Buttons - Outside the Link */}
// // // //       <div className="action-buttons">
// // // //         <button
// // // //           className="whatsapp-btn"
// // // //           onClick={handleWhatsAppClick}
// // // //         >
// // // //           <svg className="btn-icon" fill="currentColor" viewBox="0 0 24 24">
// // // //             <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.176-1.24-6.16-3.495-8.411"/>
// // // //           </svg>
// // // //           <span>WhatsApp</span>
// // // //         </button>
        
// // // //         <button
// // // //           className="email-btn"
// // // //           onClick={handleEmailClick}
// // // //         >
// // // //           <svg className="btn-icon" fill="currentColor" viewBox="0 0 24 24">
// // // //             <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
// // // //           </svg>
// // // //           <span>Email</span>
// // // //         </button>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import Link from 'next/link';
// // import './ProductCard.css';

// // export default function ProductCard({ product }) {
// //   // Safety check for product
// //   if (!product) {
// //     return (
// //       <div className="product-card loading">
// //         <div className="product-image-container">
// //           <div className="image-loader">
// //             <div className="loader-spinner"></div>
// //             <p className="loader-text">Product not available</p>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   const [imgSrc, setImgSrc] = useState('/placeholder-laptop.jpg');
// //   const [isLoading, setIsLoading] = useState(true);
// //   const [imageLoaded, setImageLoaded] = useState(false);
// //   const [showDefault, setShowDefault] = useState(false);
  
// //   // Safe access to specs with fallback
// //   const specs = product?.specs || {};

// //   const currentYear = new Date().getFullYear();
  
// //   // Check if product is new (current year)
// //   const isNewProduct = product?.year === currentYear || 
// //     (product?.releaseDate && new Date(product.releaseDate).getFullYear() === currentYear);

// //   // List of supported image formats
// //   const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.tiff'];

// //   // Function to check if the image path has a valid extension
// //   const hasValidImageExtension = (filename) => {
// //     if (!filename) return false;
// //     return supportedFormats.some(format => 
// //       filename.toLowerCase().endsWith(format)
// //     );
// //   };

// //   // Function to get image path with fallback
// //   const getImagePath = () => {
// //     if (!product?.image) return '/placeholder-laptop.jpg';
    
// //     // If image already has a full URL or path
// //     if (product.image.startsWith('http') || product.image.startsWith('/')) {
// //       return product.image;
// //     }
    
// //     // Check if it has a valid extension
// //     if (hasValidImageExtension(product.image)) {
// //       return `/images/${product.image}`;
// //     }
    
// //     // If no extension or invalid extension, try common formats
// //     return `/images/${product.image}.jpg`;
// //   };

// //   useEffect(() => {
// //     let timeoutId;
// //     let isMounted = true;

// //     const loadImage = async () => {
// //       if (!isMounted || !product?.image) return;

// //       const imageUrl = getImagePath();
      
// //       try {
// //         const img = new Image();
        
// //         img.onload = () => {
// //           if (isMounted) {
// //             setImageLoaded(true);
// //             setImgSrc(imageUrl);
// //             setIsLoading(false);
// //             clearTimeout(timeoutId);
// //           }
// //         };
        
// //         img.onerror = () => {
// //           if (isMounted) {
// //             // Try fallback extensions if first attempt fails
// //             const fallbackExtensions = ['.jpg', '.png', '.webp', '.jpeg'];
// //             let fallbackIndex = 0;
            
// //             const tryFallback = () => {
// //               if (fallbackIndex < fallbackExtensions.length && isMounted) {
// //                 const fallbackUrl = `/images/${product.image}${fallbackExtensions[fallbackIndex]}`;
// //                 const fallbackImg = new Image();
                
// //                 fallbackImg.onload = () => {
// //                   if (isMounted) {
// //                     setImageLoaded(true);
// //                     setImgSrc(fallbackUrl);
// //                     setIsLoading(false);
// //                     clearTimeout(timeoutId);
// //                   }
// //                 };
                
// //                 fallbackImg.onerror = () => {
// //                   fallbackIndex++;
// //                   tryFallback();
// //                 };
                
// //                 fallbackImg.src = fallbackUrl;
// //               } else if (isMounted) {
// //                 // All fallbacks failed
// //                 setImageLoaded(false);
// //                 setShowDefault(true);
// //                 setIsLoading(false);
// //                 clearTimeout(timeoutId);
// //               }
// //             };
            
// //             tryFallback();
// //           }
// //         };
        
// //         img.src = imageUrl;
        
// //       } catch (error) {
// //         if (isMounted) {
// //           setImageLoaded(false);
// //           setShowDefault(true);
// //           setIsLoading(false);
// //           clearTimeout(timeoutId);
// //         }
// //       }
// //     };

// //     // Set 8-second timeout
// //     timeoutId = setTimeout(() => {
// //       if (isMounted && !imageLoaded) {
// //         setShowDefault(true);
// //         setIsLoading(false);
// //       }
// //     }, 8000);

// //     // Start loading the image
// //     loadImage();

// //     return () => {
// //       isMounted = false;
// //       clearTimeout(timeoutId);
// //     };
// //   }, [product?.image, imageLoaded]);

// //   const handleImageError = () => {
// //     setImageLoaded(false);
// //     setShowDefault(true);
// //     setIsLoading(false);
// //   };

// //   const handleImageLoad = () => {
// //     setImageLoaded(true);
// //     setIsLoading(false);
// //   };

// //   const handleWhatsAppClick = (e) => {
// //     e.preventDefault();
// //     e.stopPropagation();
// //     const url = `https://wa.me/+971509550121?text=${encodeURIComponent(`I'm interested in ${product?.name || 'this product'} - AED ${product?.price || ''}`)}`;
// //     window.open(url, '_blank');
// //   };

// //   const handleEmailClick = (e) => {
// //     e.preventDefault();
// //     e.stopPropagation();
// //     const url = `https://mail.google.com/mail/?view=cm&fs=1&to=info.almukammal@gmail.com&su=${encodeURIComponent(`Inquiry about ${product?.name || 'product'}`)}&body=${encodeURIComponent(`Hello, I'm interested in the ${product?.name || 'this product'} priced at AED ${product?.price || ''}. Please provide more details.`)}`;
// //     window.open(url, '_blank');
// //   };

// //   if (isLoading) {
// //     return (
// //       <div className="product-card loading">
// //         <div className="product-image-container">
// //           <div className="image-loader">
// //             <div className="loader-spinner"></div>
// //             <p className="loader-text">Loading image...</p>
// //           </div>
// //         </div>
// //         <div className="product-info">
// //           <div className="skeleton-loading" style={{ height: '1.5rem', marginBottom: '0.5rem' }}></div>
// //           <div className="skeleton-loading" style={{ height: '2.5rem', marginBottom: '1rem' }}></div>
// //           <div className="specs-section">
// //             <div className="skeleton-loading" style={{ height: '1rem', marginBottom: '0.5rem' }}></div>
// //             {[1, 2, 3, 4].map(i => (
// //               <div key={i} className="skeleton-loading" style={{ height: '0.8rem', marginBottom: '0.25rem' }}></div>
// //             ))}
// //           </div>
// //           <div className="action-buttons">
// //             <div className="skeleton-loading" style={{ height: '2.5rem' }}></div>
// //             <div className="skeleton-loading" style={{ height: '2.5rem' }}></div>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="product-card-wrapper">
// //       <Link href={`/products/${product?.id}`} className="product-card-link">
// //         <div className="product-card">
// //           {/* Product Image Container */}
// //           <div className="product-image-container">
// //             {showDefault && !imageLoaded ? (
// //               <div className="no-photo-found">
// //                 <svg className="no-photo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
// //                 </svg>
// //                 <p>No Photo Available</p>
// //               </div>
// //             ) : (
// //               <img 
// //                 src={imgSrc}
// //                 alt={product?.name || 'Product'} 
// //                 className="product-image"
// //                 onError={handleImageError}
// //                 onLoad={handleImageLoad}
// //               />
// //             )}
// //             {/* Price Badge */}
// //             <div className="price-badge">
// //               AED {product?.price?.toLocaleString() || '0'}
// //             </div>
            
// //             {/* New Badge */}
// //             {isNewProduct && (
// //               <div className="new-badge">
// //                 NEW
// //               </div>
// //             )}
            
// //             {/* Year Badge */}
// //             {(product?.year || product?.releaseDate) && (
// //               <div className="year-badge">
// //                 {product?.year || new Date(product.releaseDate).getFullYear()}
// //               </div>
// //             )}
// //           </div>

// //           {/* Product Info */}
// //           <div className="product-info">
// //             <h3 className="product-name">
// //               {product?.name || 'Product Name'}
// //             </h3>
            
// //             <p className="product-description">
// //               {product?.description || 'Product description not available'}
// //             </p>

            
// //             {/* Specifications */}
// //             <div className="specs-section">
// //               <h4 className="specs-title">
// //                 <svg className="specs-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
// //                 </svg>
// //                 Key Specs
// //               </h4>
// //               <div className="specs-list">
// //                 {specs.cpu && (
// //                   <div className="spec-item">
// //                     <span className="spec-label">CPU:</span>
// //                     <span className="spec-value">{specs.cpu}</span>
// //                   </div>
// //                 )}
// //                 {specs.ram && (
// //                   <div className="spec-item">
// //                     <span className="spec-label">RAM:</span>
// //                     <span className="spec-value">{specs.ram}</span>
// //                   </div>
// //                 )}
// //                 {specs.storage && (
// //                   <div className="spec-item">
// //                     <span className="spec-label">Storage:</span>
// //                     <span className="spec-value">{specs.storage}</span>
// //                   </div>
// //                 )}
// //                 {specs.display && (
// //                   <div className="spec-item">
// //                     <span className="spec-label">Display:</span>
// //                     <span className="spec-value">{specs.display}</span>
// //                   </div>
// //                 )}
// //               </div>
// //             </div>
            
// //              {/* Action Buttons - Outside the Link */}
            
// //             <div className="action-buttons">
// //               <button
// //                 className="whatsapp-btn"
// //                 onClick={handleWhatsAppClick}
// //               >
// //                 <svg className="btn-icon" fill="currentColor" viewBox="0 0 24 24">
// //                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.176-1.24-6.16-3.495-8.411"/>
// //                 </svg>
// //                 <span>WhatsApp</span>
// //               </button>
                    
// //               <button
// //                 className="email-btn"
// //                 onClick={handleEmailClick}
// //               >
// //                 <svg className="btn-icon" fill="currentColor" viewBox="0 0 24 24">
// //                   <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
// //                 </svg>
// //                 <span>Email</span>
// //               </button>
// //             </div>
            
// //             {/* Additional Info */}
// //             <div className="additional-info">
// //               <span className="info-item">
// //                 <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
// //                 </svg>
// //                 <span>Free Ship</span>
// //               </span>
// //               <span className="info-item">
// //                 <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
// //                 </svg>
// //                 <span>1 Year</span>
// //               </span>
// //             </div>
// //           </div>
// //         </div>
// //       </Link>

// //     </div>
// //   );
// // }
// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import './ProductCard.css';

// export default function ProductCard({ product }) {
//   // Safety check for product
//   if (!product) {
//     return (
//       <div className="product-card loading">
//         <div className="product-image-container">
//           <div className="image-loader">
//             <div className="loader-spinner"></div>
//             <p className="loader-text">Product not available</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const [imgSrc, setImgSrc] = useState('/placeholder-laptop.jpg');
//   const [isLoading, setIsLoading] = useState(true);
//   const [imageLoaded, setImageLoaded] = useState(false);
//   const [showDefault, setShowDefault] = useState(false);
  
//   // Safe access to specs with fallback
//   const specs = product?.specs || {};

//   const currentYear = new Date().getFullYear();
  
//   // Check if product is new (current year)
//   const isNewProduct = product?.year === currentYear || 
//     (product?.releaseDate && new Date(product.releaseDate).getFullYear() === currentYear);

//   // List of supported image formats
//   const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.tiff'];

//   // Function to check if the image path has a valid extension
//   const hasValidImageExtension = (filename) => {
//     if (!filename) return false;
//     return supportedFormats.some(format => 
//       filename.toLowerCase().endsWith(format)
//     );
//   };

//   // Function to get image path with fallback
//   const getImagePath = () => {
//     if (!product?.image) return '/placeholder-laptop.jpg';
    
//     // If image already has a full URL or path
//     if (product.image.startsWith('http') || product.image.startsWith('/')) {
//       return product.image;
//     }
    
//     // Check if it has a valid extension
//     if (hasValidImageExtension(product.image)) {
//       return `/images/${product.image}`;
//     }
    
//     // If no extension or invalid extension, try common formats
//     return `/images/${product.image}.jpg`;
//   };

//   useEffect(() => {
//     let timeoutId;
//     let isMounted = true;

//     const loadImage = async () => {
//       if (!isMounted || !product?.image) return;

//       const imageUrl = getImagePath();
      
//       try {
//         const img = new Image();
        
//         img.onload = () => {
//           if (isMounted) {
//             setImageLoaded(true);
//             setImgSrc(imageUrl);
//             setIsLoading(false);
//             clearTimeout(timeoutId);
//           }
//         };
        
//         img.onerror = () => {
//           if (isMounted) {
//             // Try fallback extensions if first attempt fails
//             const fallbackExtensions = ['.jpg', '.png', '.webp', '.jpeg'];
//             let fallbackIndex = 0;
            
//             const tryFallback = () => {
//               if (fallbackIndex < fallbackExtensions.length && isMounted) {
//                 const fallbackUrl = `/images/${product.image}${fallbackExtensions[fallbackIndex]}`;
//                 const fallbackImg = new Image();
                
//                 fallbackImg.onload = () => {
//                   if (isMounted) {
//                     setImageLoaded(true);
//                     setImgSrc(fallbackUrl);
//                     setIsLoading(false);
//                     clearTimeout(timeoutId);
//                   }
//                 };
                
//                 fallbackImg.onerror = () => {
//                   fallbackIndex++;
//                   tryFallback();
//                 };
                
//                 fallbackImg.src = fallbackUrl;
//               } else if (isMounted) {
//                 // All fallbacks failed
//                 setImageLoaded(false);
//                 setShowDefault(true);
//                 setIsLoading(false);
//                 clearTimeout(timeoutId);
//               }
//             };
            
//             tryFallback();
//           }
//         };
        
//         img.src = imageUrl;
        
//       } catch (error) {
//         if (isMounted) {
//           setImageLoaded(false);
//           setShowDefault(true);
//           setIsLoading(false);
//           clearTimeout(timeoutId);
//         }
//       }
//     };

//     // Set 8-second timeout
//     timeoutId = setTimeout(() => {
//       if (isMounted && !imageLoaded) {
//         setShowDefault(true);
//         setIsLoading(false);
//       }
//     }, 8000);

//     // Start loading the image
//     loadImage();

//     return () => {
//       isMounted = false;
//       clearTimeout(timeoutId);
//     };
//   }, [product?.image, imageLoaded]);

//   const handleImageError = () => {
//     setImageLoaded(false);
//     setShowDefault(true);
//     setIsLoading(false);
//   };

//   const handleImageLoad = () => {
//     setImageLoaded(true);
//     setIsLoading(false);
//   };

//   const handleWhatsAppClick = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     const url = `https://wa.me/+971509550121?text=${encodeURIComponent(`I'm interested in ${product?.name || 'this product'} - AED ${product?.price || ''}`)}`;
//     window.open(url, '_blank');
//   };

//   const handleEmailClick = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     const url = `https://mail.google.com/mail/?view=cm&fs=1&to=info.almukammal@gmail.com&su=${encodeURIComponent(`Inquiry about ${product?.name || 'product'}`)}&body=${encodeURIComponent(`Hello, I'm interested in the ${product?.name || 'this product'} priced at AED ${product?.price || ''}. Please provide more details.`)}`;
//     window.open(url, '_blank');
//   };

//   if (isLoading) {
//     return (
//       <div className="product-card loading">
//         <div className="product-image-container">
//           <div className="image-loader">
//             <div className="loader-spinner"></div>
//             <p className="loader-text">Loading image...</p>
//           </div>
//         </div>
//         <div className="product-info">
//           <div className="skeleton-loading" style={{ height: '1.5rem', marginBottom: '0.5rem' }}></div>
//           <div className="skeleton-loading" style={{ height: '2.5rem', marginBottom: '1rem' }}></div>
//           <div className="specs-section">
//             <div className="skeleton-loading" style={{ height: '1rem', marginBottom: '0.5rem' }}></div>
//             {[1, 2, 3, 4].map(i => (
//               <div key={i} className="skeleton-loading" style={{ height: '0.8rem', marginBottom: '0.25rem' }}></div>
//             ))}
//           </div>
//           <div className="action-buttons">
//             <div className="skeleton-loading" style={{ height: '2.5rem' }}></div>
//             <div className="skeleton-loading" style={{ height: '2.5rem' }}></div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="product-card-wrapper">
//       <Link href={`/products/${product?.id}`} className="product-card-link">
//         <div className="product-card">
//           {/* Product Image Container */}
//           <div className="product-image-container">
//             {showDefault && !imageLoaded ? (
//               <div className="no-photo-found">
//                 <svg className="no-photo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                 </svg>
//                 <p>No Photo Available</p>
//               </div>
//             ) : (
//               <img 
//                 src={imgSrc}
//                 alt={product?.name || 'Product'} 
//                 className="product-image"
//                 onError={handleImageError}
//                 onLoad={handleImageLoad}
//               />
//             )}
//             {/* Price Badge */}
//             <div className="price-badge">
//               AED {product?.price?.toLocaleString() || '0'}
//             </div>
            
//             {/* New Badge */}
//             {isNewProduct && (
//               <div className="new-badge">
//                 NEW
//               </div>
//             )}
            
//             {/* Year Badge */}
//             {(product?.year || product?.releaseDate) && (
//               <div className="year-badge">
//                 {product?.year || new Date(product.releaseDate).getFullYear()}
//               </div>
//             )}
//           </div>

//           {/* Product Info */}
//           <div className="product-info">
//             <h3 className="product-name">
//               {product?.name || 'Product Name'}
//             </h3>
            
//             <p className="product-description">
//               {product?.description || 'Product description not available'}
//             </p>

//             {/* Specifications */}
//             <div className="specs-section">
//               <h4 className="specs-title">
//                 <svg className="specs-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                 </svg>
//                 Key Specs
//               </h4>
//               <div className="specs-list">
//                 {specs.cpu && (
//                   <div className="spec-item">
//                     <span className="spec-label">CPU:</span>
//                     <span className="spec-value">{specs.cpu}</span>
//                   </div>
//                 )}
//                 {specs.ram && (
//                   <div className="spec-item">
//                     <span className="spec-label">RAM:</span>
//                     <span className="spec-value">{specs.ram}</span>
//                   </div>
//                 )}
//                 {specs.storage && (
//                   <div className="spec-item">
//                     <span className="spec-label">Storage:</span>
//                     <span className="spec-value">{specs.storage}</span>
//                   </div>
//                 )}
//                 {specs.display && (
//                   <div className="spec-item">
//                     <span className="spec-label">Display:</span>
//                     <span className="spec-value">{specs.display}</span>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Action Buttons - Placed before Additional Info */}
//             <div className="action-buttons">
//               <button
//                 className="whatsapp-btn"
//                 onClick={handleWhatsAppClick}
//               >
//                 <svg className="btn-icon" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.176-1.24-6.16-3.495-8.411"/>
//                 </svg>
//                 <span>WhatsApp</span>
//               </button>
                    
//               <button
//                 className="email-btn"
//                 onClick={handleEmailClick}
//               >
//                 <svg className="btn-icon" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
//                 </svg>
//                 <span>Email</span>
//               </button>
//             </div>

//             {/* Additional Info */}
//             <div className="additional-info">
//               <span className="info-item">
//                 <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                 </svg>
//                 <span>Free Ship</span>
//               </span>
//               <span className="info-item">
//                 <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//                 </svg>
//                 <span>1 Year</span>
//               </span>
//             </div>
//           </div>
//         </div>
//       </Link>
//     </div>
//   );
// }
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './ProductCard.css';

export default function ProductCard({ product }) {
  // Safety check for product
  if (!product) {
    return (
      <div className="product-card loading">
        <div className="product-image-container">
          <div className="image-loader">
            <div className="loader-spinner"></div>
            <p className="loader-text">Product not available</p>
          </div>
        </div>
      </div>
    );
  }

  const [imgSrc, setImgSrc] = useState('/placeholder-laptop.jpg');
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDefault, setShowDefault] = useState(false);
  
  // Safe access to specs with fallback
  const specs = product?.specs || {};

  const currentYear = new Date().getFullYear();
  
  // Check if product is new (current year)
  const isNewProduct = product?.year === currentYear || 
    (product?.releaseDate && new Date(product.releaseDate).getFullYear() === currentYear);

  // List of supported image formats
  const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.tiff'];

  // Function to check if the image path has a valid extension
  const hasValidImageExtension = (filename) => {
    if (!filename) return false;
    return supportedFormats.some(format => 
      filename.toLowerCase().endsWith(format)
    );
  };

  // Function to get image path with fallback
  const getImagePath = () => {
    if (!product?.image) return '/placeholder-laptop.jpg';
    
    // If image already has a full URL or path
    if (product.image.startsWith('http') || product.image.startsWith('/')) {
      return product.image;
    }
    
    // Check if it has a valid extension
    if (hasValidImageExtension(product.image)) {
      return `/images/${product.image}`;
    }
    
    // If no extension or invalid extension, try common formats
    return `/images/${product.image}.jpg`;
  };

  useEffect(() => {
    let timeoutId;
    let isMounted = true;

    const loadImage = async () => {
      if (!isMounted || !product?.image) return;

      const imageUrl = getImagePath();
      
      try {
        const img = new Image();
        
        img.onload = () => {
          if (isMounted) {
            setImageLoaded(true);
            setImgSrc(imageUrl);
            setIsLoading(false);
            clearTimeout(timeoutId);
          }
        };
        
        img.onerror = () => {
          if (isMounted) {
            // Try fallback extensions if first attempt fails
            const fallbackExtensions = ['.jpg', '.png', '.webp', '.jpeg'];
            let fallbackIndex = 0;
            
            const tryFallback = () => {
              if (fallbackIndex < fallbackExtensions.length && isMounted) {
                const fallbackUrl = `/images/${product.image}${fallbackExtensions[fallbackIndex]}`;
                const fallbackImg = new Image();
                
                fallbackImg.onload = () => {
                  if (isMounted) {
                    setImageLoaded(true);
                    setImgSrc(fallbackUrl);
                    setIsLoading(false);
                    clearTimeout(timeoutId);
                  }
                };
                
                fallbackImg.onerror = () => {
                  fallbackIndex++;
                  tryFallback();
                };
                
                fallbackImg.src = fallbackUrl;
              } else if (isMounted) {
                // All fallbacks failed
                setImageLoaded(false);
                setShowDefault(true);
                setIsLoading(false);
                clearTimeout(timeoutId);
              }
            };
            
            tryFallback();
          }
        };
        
        img.src = imageUrl;
        
      } catch (error) {
        if (isMounted) {
          setImageLoaded(false);
          setShowDefault(true);
          setIsLoading(false);
          clearTimeout(timeoutId);
        }
      }
    };

    // Set 8-second timeout
    timeoutId = setTimeout(() => {
      if (isMounted && !imageLoaded) {
        setShowDefault(true);
        setIsLoading(false);
      }
    }, 8000);

    // Start loading the image
    loadImage();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [product?.image, imageLoaded]);

  const handleImageError = () => {
    setImageLoaded(false);
    setShowDefault(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setIsLoading(false);
  };

  const handleWhatsAppClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `https://wa.me/+971509550121?text=${encodeURIComponent(`I'm interested in ${product?.name || 'this product'} - AED ${product?.price || ''}`)}`;
    window.open(url, '_blank');
  };

  const handleEmailClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=info.almukammal@gmail.com&su=${encodeURIComponent(`Inquiry about ${product?.name || 'product'}`)}&body=${encodeURIComponent(`Hello, I'm interested in the ${product?.name || 'this product'} priced at AED ${product?.price || ''}. Please provide more details.`)}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="product-card loading">
        <div className="product-image-container">
          <div className="image-loader">
            <div className="loader-spinner"></div>
            <p className="loader-text">Loading image...</p>
          </div>
        </div>
        <div className="product-info">
          <div className="skeleton-loading" style={{ height: '1.2rem', marginBottom: '0.5rem' }}></div>
          <div className="skeleton-loading" style={{ height: '2rem', marginBottom: '0.75rem' }}></div>
          <div className="specs-section">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-loading" style={{ height: '0.8rem', marginBottom: '0.25rem' }}></div>
            ))}
          </div>
          <div className="action-buttons">
            <div className="skeleton-loading" style={{ height: '2rem' }}></div>
            <div className="skeleton-loading" style={{ height: '2rem' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-card-wrapper">
      <Link href={`/products/${product?.id}`} className="product-card-link">
        <div className="product-card">
          {/* Product Image Container */}
          <div className="product-image-container">
            {showDefault && !imageLoaded ? (
              <div className="no-photo-found">
                <svg className="no-photo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No Photo Available</p>
              </div>
            ) : (
              <img 
                src={imgSrc}
                alt={product?.name || 'Product'} 
                className="product-image"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            )}
            {/* Price Badge */}
            <div className="price-badge">
              AED {product?.price?.toLocaleString() || '0'}
            </div>
            
            {/* New Badge */}
            {isNewProduct && (
              <div className="new-badge">
                NEW
              </div>
            )}
            
            {/* Year Badge */}
            {(product?.year || product?.releaseDate) && (
              <div className="year-badge">
                {product?.year || new Date(product.releaseDate).getFullYear()}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            <h3 className="product-name">
              {product?.name || 'Product Name'}
            </h3>
            
            <p className="product-description">
              {product?.description || 'Product description not available'}
            </p>

            {/* Specifications */}
            <div className="specs-section">
              <h4 className="specs-title">
                <svg className="specs-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Key Specs
              </h4>
              <div className="specs-list">
                {specs.cpu && (
                  <div className="spec-item">
                    <span className="spec-label">CPU:</span>
                    <span className="spec-value">{specs.cpu}</span>
                  </div>
                )}
                {specs.ram && (
                  <div className="spec-item">
                    <span className="spec-label">RAM:</span>
                    <span className="spec-value">{specs.ram}</span>
                  </div>
                )}
                {specs.storage && (
                  <div className="spec-item">
                    <span className="spec-label">Storage:</span>
                    <span className="spec-value">{specs.storage}</span>
                  </div>
                )}
                {specs.display && (
                  <div className="spec-item">
                    <span className="spec-label">Display:</span>
                    <span className="spec-value">{specs.display}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Placed before Additional Info */}
            <div className="action-buttons">
              <button
                className="whatsapp-btn"
                onClick={handleWhatsAppClick}
              >
                <svg className="btn-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.176-1.24-6.16-3.495-8.411"/>
                </svg>
                <span>WhatsApp</span>
              </button>
                    
              <button
                className="email-btn"
                onClick={handleEmailClick}
              >
                <svg className="btn-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span>Email</span>
              </button>
            </div>

            {/* Additional Info */}
            <div className="additional-info">
              <span className="info-item">
                <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Free Ship</span>
              </span>
              <span className="info-item">
                <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>1 Year</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}