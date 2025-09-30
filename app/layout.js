// import Link from 'next/link';
// import './globals.css';
// import './RootLayout.css';


// export const metadata = {
//   title: 'AL MUKAMMAL COMPUTER TRADING LLC - Premium Laptops',
//    description: 'Discover the best laptops for gaming, business, and creative work. Latest technology, competitive prices, and exceptional performance.',
//   icons: {
//     icon: '/favicon.png',
//   },
// };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body className="layout-body">
//         {/* Navigation */}
//         <nav className="navigation">
//           <div className="nav-container">
//             <div className="nav-content">

             
//               <Link href="/" className="logo-link">
//                 <div className="logo-icon">
//                   <div className="logo-img"></div>
//                 </div>
//                 <span className="logo-text">
//                   AL MUKAMMAL COMPUTER TRADING LLC
//                 </span>
//               </Link>
//               <div className="nav-links">
//                 <Link 
//                   href="/" 
//                   className="nav-link"
//                 >
//                   Home
//                 </Link>
//                 <Link 
//                   href="/products" 
//                   className="nav-button"
//                 >
//                   All Laptops
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </nav>

//         {/* Main Content */}
//         <main>{children}</main>

//         {/* Footer */}
//         <footer className="footer">
//           <div className="footer-container">
//             <div className="footer-content">
//               <h3 className="footer-title">AL MUKAMMAL COMPUTER TRADING LLC</h3>
//               <p className="footer-description">
//                 Your trusted partner for premium laptops and computing solutions. 
//                 We bring you the latest technology with exceptional service.
//               </p>
//               <div className="footer-contact">
//                 <span>📞 +971 50 955 0121</span>
//                 <span>✉️ info@laptopstore.com</span>
//               </div>
//               <div className="footer-bottom">
//                 <p>&copy; 2025 AL MUKAMMAL COMPUTER TRADING LLC. All rights reserved. Premium laptop solutions.</p>
//               </div>
//             </div>
//           </div>
//         </footer>
//       </body>
//     </html>
//   );
// }
import Link from 'next/link';
import './globals.css';
import './RootLayout.css';

export const metadata = {
  title: 'AL MUKAMMAL COMPUTER TRADING LLC - Premium Laptops',
  description: 'Discover the best laptops for gaming, business, and creative work. Latest technology, competitive prices, and exceptional performance.',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="layout-body">
        {/* Navigation */}
        <nav className="navigation">
          <div className="nav-container">
            <div className="nav-content">
              <Link href="/" className="logo-link">
                 <div className="logo-icon">
                   <div className="logo-img"></div>
                 </div>
                 <span className="logo-text">
                   AL MUKAMMAL COMPUTER TRADING LLC
                 </span>
              </Link>
              <div className="nav-links">
                <Link href="/" className="nav-link">
                  Home
                </Link>
                <Link href="/products" className="nav-button">
                  All Laptops
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">{children}</main>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-container">
            <div className="footer-content">
              <h3 className="footer-title">AL MUKAMMAL COMPUTER TRADING LLC</h3>
              <p className="footer-description">
                Your trusted partner for premium laptops and computing solutions. 
                We bring you the latest technology with exceptional service.
              </p>
              <div className="footer-contact">
                <span>📞 +971 50 955 0121</span>
                <span>✉️ info.almukammal@gmail.com</span>
              </div>
              <div className="footer-bottom">
                <p>&copy; 2025 AL MUKAMMAL COMPUTER TRADING LLC. All rights reserved. Premium laptop solutions.</p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}