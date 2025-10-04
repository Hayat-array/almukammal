/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Disable TypeScript checking
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  
  experimental: {
    optimizeCss: true,
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  output: 'standalone',
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;