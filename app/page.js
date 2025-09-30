// import Link from 'next/link';
// import ProductCard from '@/components/ProductCard';
// import products from '@/data/products';

// export default function Home() {
//   const featuredProducts = products.slice(0, 8);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
//       {/* Hero Section */}
//       <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
//         <div className="container mx-auto px-4 text-center max-w-4xl">
//           <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
//             Premium Laptops
//             <span className="block text-xl md:text-2xl font-light mt-2">For Every Need</span>
//           </h1>
//           <p className="text-lg mb-8 leading-relaxed">
//             Discover the perfect laptop for gaming, business, or creativity. Latest technology, best prices.
//           </p>
//           <Link 
//             href="/products"
//             className="inline-block bg-white text-blue-600 px-6 py-3 rounded-xl font-bold text-base hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-xl"
//           >
//             Explore All Laptops →
//           </Link>
//         </div>
//       </section>

//       {/* Featured Products */}
//       <section className="py-12">
//         <div className="container mx-auto px-4 max-w-7xl">
//           <div className="text-center mb-8">
//             <h2 className="text-3xl font-bold text-gray-800 mb-3">
//               Featured Laptops
//             </h2>
//             <p className="text-lg text-gray-600 max-w-2xl mx-auto">
//               Handpicked selection of our most popular laptops
//             </p>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
//             {featuredProducts.map(product => (
//               <ProductCard key={product.id} product={product} />
//             ))}
//           </div>

//           <div className="text-center">
//             <Link 
//               href="/products"
//               className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold text-base hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
//             >
//               View All {products.length} Laptops
//             </Link>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import products from '@/data/products';
import './Home.css';

export default function Home() {
  const featuredProducts = products.slice(0, 8);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section fade-in">
        <div className="hero-container">
          <h1 className="hero-title">
            Premium Laptops
            <span className="hero-subtitle">For Every Need</span>
          </h1>
          <p className="hero-description">
            Discover the perfect laptop for gaming, business, or creativity. 
            Latest technology, best prices, and exceptional performance.
          </p>
          <Link href="/products" className="hero-button">
            Explore All Laptops →
          </Link>
        </div>
      </section>

      {/* Stats Section (Optional) */}
      <section className="stats-section slide-in-left">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">Laptop Models</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">1000+</span>
            <span className="stat-label">Happy Customers</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Customer Support</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">1 Year</span>
            <span className="stat-label">Warranty</span>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="featured-container">
          <div className="featured-header slide-in-right">
            <h2 className="featured-title">Featured Laptops</h2>
            <p className="featured-subtitle">
              Handpicked selection of our most popular and high-performance laptops
            </p>
          </div>

          <div className="featured-grid">
            {featuredProducts.map((product, index) => (
              <div 
                key={product.id} 
                className="fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <div className="featured-footer">
            <Link href="/products" className="view-all-button">
              View All {products.length} Laptops
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}