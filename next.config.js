/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export for production builds
  ...(process.env.NODE_ENV === 'production' && {
    trailingSlash: true,
    images: {
      unoptimized: true
    }
  })
}

module.exports = nextConfig
