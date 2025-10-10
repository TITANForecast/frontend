/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for Docker/ECS deployment
  // Use default server mode for development (needed for API routes)
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  trailingSlash: true,
  images: {
    // Optimize images for Docker builds, unoptimized for static export
    unoptimized: process.env.NODE_ENV === 'development' || process.env.DOCKER_BUILD !== 'true'
  }
}

module.exports = nextConfig
