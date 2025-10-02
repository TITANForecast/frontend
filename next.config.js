/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for Docker deployment
  output: 'standalone',
  
  // Enable experimental features for better performance
  experimental: {
    // Add experimental features here if needed
  },
  
  // Image optimization settings
  images: {
    unoptimized: false, // Enable optimization for server-side rendering
  },
  
  // Environment-specific configurations
  ...(process.env.NODE_ENV === 'production' && {
    // Production-specific settings
    compress: true,
    poweredByHeader: false,
  }),
}

module.exports = nextConfig
