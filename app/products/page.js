// // 'use client';

// // import { useSearchParams, useRouter } from 'next/navigation';
// // import ProductCard from '@/components/ProductCard';
// // import Pagination from '@/components/Pagination';
// // import products from '@/data/products';

// // const ITEMS_PER_PAGE = 8;

// // export default function ProductsPage() {
// //   const searchParams = useSearchParams();
// //   const router = useRouter();
// //   const currentPage = parseInt(searchParams.get('page')) || 1;
  
// //   const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
// //   const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
// //   const endIndex = startIndex + ITEMS_PER_PAGE;
// //   const currentProducts = products.slice(startIndex, endIndex);

// //   const handlePageChange = (page) => {
// //     router.push(`/products?page=${page}`);
// //   };

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
// //       <div className="container mx-auto px-4">
// //         {/* Header */}
// //         <div className="text-center mb-12">
// //           <h1 className="text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
// //             Premium Laptops
// //           </h1>
// //           <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
// //             Discover our exclusive collection of high-performance laptops for gaming, business, and creative work
// //           </p>
// //           <div className="mt-6 bg-white rounded-2xl shadow-lg inline-flex items-center space-x-2 px-6 py-3">
// //             <span className="text-gray-600">Showing</span>
// //             <span className="font-bold text-blue-600">{startIndex + 1}-{Math.min(endIndex, products.length)}</span>
// //             <span className="text-gray-600">of</span>
// //             <span className="font-bold text-purple-600">{products.length}</span>
// //             <span className="text-gray-600">laptops</span>
// //           </div>
// //         </div>

// //         {/* Products Grid */}
// //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
// //           {currentProducts.map(product => (
// //             <ProductCard key={product.id} product={product} />
// //           ))}
// //         </div>

// //         {/* Enhanced Pagination */}
// //         <Pagination 
// //           currentPage={currentPage}
// //           totalPages={totalPages}
// //           onPageChange={handlePageChange}
// //         />

// //         {/* Quick Navigation */}
// //         <div className="text-center mt-8">
// //           <p className="text-gray-600 mb-4">Quick Jump to Page</p>
// //           <div className="flex flex-wrap justify-center gap-2">
// //             {[1, 2, 3, 4, 5].filter(page => page <= totalPages).map(page => (
// //               <button
// //                 key={page}
// //                 onClick={() => handlePageChange(page)}
// //                 className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
// //                   page === currentPage
// //                     ? 'bg-blue-600 text-white shadow-lg'
// //                     : 'bg-white text-gray-700 shadow-md hover:bg-blue-50 hover:text-blue-600'
// //                 }`}
// //               >
// //                 {page}
// //               </button>
// //             ))}
// //             {totalPages > 5 && (
// //               <span className="px-4 py-2 text-gray-500">...</span>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
// 'use client';

// import { useSearchParams, useRouter } from 'next/navigation';
// import ProductCard from '@/components/ProductCard';
// import Pagination from '@/components/Pagination';
// import products from '@/data/products';

// const ITEMS_PER_PAGE = 8;

// export default function ProductsPage() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const currentPage = parseInt(searchParams.get('page')) || 1;
  
//   const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
//   const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
//   const endIndex = startIndex + ITEMS_PER_PAGE;
//   const currentProducts = products.slice(startIndex, endIndex);

//   const handlePageChange = (page) => {
//     router.push(`/products?page=${page}`);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6">
//       <div className="container mx-auto px-4 max-w-7xl">
//         {/* Header - More Compact */}
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//             Premium Laptops
//           </h1>
//           <p className="text-lg text-gray-600 max-w-2xl mx-auto">
//             Discover our exclusive collection of high-performance laptops
//           </p>
//           <div className="mt-4 bg-white rounded-lg shadow-sm inline-flex items-center space-x-2 px-4 py-2">
//             <span className="text-gray-600 text-sm">Showing</span>
//             <span className="font-bold text-blue-600 text-sm">{startIndex + 1}-{Math.min(endIndex, products.length)}</span>
//             <span className="text-gray-600 text-sm">of</span>
//             <span className="font-bold text-purple-600 text-sm">{products.length}</span>
//             <span className="text-gray-600 text-sm">laptops</span>
//           </div>
//         </div>

//         {/* Products Grid - Better spacing */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
//           {currentProducts.map(product => (
//             <ProductCard key={product.id} product={product} />
//           ))}
//         </div>

//         {/* Pagination */}
//         <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
//           <Pagination 
//             currentPage={currentPage}
//             totalPages={totalPages}
//             onPageChange={handlePageChange}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }
// 'use client';

// import { useSearchParams, useRouter } from 'next/navigation';
// import ProductCard from '@/components/ProductCard';
// import Pagination from '@/components/Pagination';
// import products from '@/data/products';

// const ITEMS_PER_PAGE = 8;

// export default function ProductsPage() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const currentPage = parseInt(searchParams.get('page')) || 1;
  
//   const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
//   const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
//   const endIndex = startIndex + ITEMS_PER_PAGE;
//   const currentProducts = products.slice(startIndex, endIndex);

//   const handlePageChange = (page) => {
//     router.push(`/products?page=${page}`);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6">
//       <div className="container mx-auto px-4 max-w-7xl">
//         {/* Header - More Compact */}
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//             Premium Laptops
//           </h1>
//           <p className="text-lg text-gray-600 max-w-2xl mx-auto">
//             Discover our exclusive collection of high-performance laptops
//           </p>
//           <div className="mt-4 bg-white rounded-lg shadow-sm inline-flex items-center space-x-2 px-4 py-2">
//             <span className="text-gray-600 text-sm">Showing</span>
//             <span className="font-bold text-blue-600 text-sm">{startIndex + 1}-{Math.min(endIndex, products.length)}</span>
//             <span className="text-gray-600 text-sm">of</span>
//             <span className="font-bold text-purple-600 text-sm">{products.length}</span>
//             <span className="text-gray-600 text-sm">laptops</span>
//           </div>
//         </div>

//         {/* Products Grid - Better spacing */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
//           {currentProducts.map(product => (
//             <ProductCard key={product.id} product={product} />
//           ))}
//         </div>

//         {/* Pagination - Pass totalItems prop */}
//         <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
//           <Pagination 
//             currentPage={currentPage}
//             totalPages={totalPages}
//             totalItems={products.length} // Add this line
//             onPageChange={handlePageChange}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import products from '@/data/products';

const ITEMS_PER_PAGE = 8;
// In ProductsPage.js - Add this sorting logic
const currentYear = new Date().getFullYear();

// Sort products by date (newest first) and mark new ones
const sortedProducts = [...products].sort((a, b) => {
  const yearA = a.year || (a.releaseDate ? new Date(a.releaseDate).getFullYear() : 0);
  const yearB = b.year || (b.releaseDate ? new Date(b.releaseDate).getFullYear() : 0);
  return yearB - yearA;
}).map(product => ({
  ...product,
  isNew: (product.year === currentYear) || 
         (product.releaseDate && new Date(product.releaseDate).getFullYear() === currentYear)
}));

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = parseInt(searchParams.get('page')) || 1;
  
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = products.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    router.push(`/products?page=${page}`);
  };

  return (
    <>
      <style jsx>{`
        .products-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
          padding: 1.5rem 0;
        }
        
        .products-container {
          max-width: 80rem;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        /* Header Styles */
        .products-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .products-title {
          font-size: 1.875rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 0.75rem;
          background: linear-gradient(to right, #2563eb, #9333ea);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .products-subtitle {
          font-size: 1.125rem;
          color: #4b5563;
          max-width: 42rem;
          margin: 0 auto;
        }
        
        .products-counter {
          margin-top: 1rem;
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
        }
        
        .counter-text {
          color: #4b5563;
          font-size: 0.875rem;
        }
        
        .counter-number {
          font-weight: bold;
          color: #2563eb;
          font-size: 0.875rem;
        }
        
        .counter-number.total {
          color: #9333ea;
        }
        
        /* Products Grid */
        .products-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        /* Small screens (640px and up) */
        @media (min-width: 640px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        /* Large screens (1024px and up) */
        @media (min-width: 1024px) {
          .products-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        /* Extra large screens (1280px and up) */
        @media (min-width: 1280px) {
          .products-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        /* Pagination Container */
        .pagination-container {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
        }
      `}</style>
      
      <div className="products-page">
        <div className="products-container">
          {/* Header - More Compact */}
          <div className="products-header">
            <h1 className="products-title">
              Premium Laptops
            </h1>
            <p className="products-subtitle">
              Discover our exclusive collection of high-performance laptops
            </p>
            <div className="products-counter">
              <span className="counter-text">Showing</span>
              <span className="counter-number">{startIndex + 1}-{Math.min(endIndex, products.length)}</span>
              <span className="counter-text">of</span>
              <span className="counter-number total">{products.length}</span>
              <span className="counter-text">laptops</span>
            </div>
          </div>

          {/* Products Grid - Better spacing */}
          <div className="products-grid">
            {currentProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          <div className="pagination-container">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={products.length}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </>
  );
}