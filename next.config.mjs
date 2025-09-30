// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   images: {
//     domains: [],
//   },
// // };

// // // export default nextConfig;
// // /** @type {import('next').NextConfig} */
// // const nextConfig = {
//   // Basic configuration for Next.js 15
//   experimental: {
//     optimizeCss: true,
//   },
//   // Optional: Enable SWC minification (faster builds)
//   swcMinify: true,
//   // Optional: Compiler options
//   compiler: {
//     removeConsole: process.env.NODE_ENV === 'production',
//   },
// }

// export default nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  experimental: {
    optimizeCss: true,
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default nextConfig;