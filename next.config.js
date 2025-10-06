/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for Docker/ECS deployment
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : 'export',
  trailingSlash: true,
  images: {
    // Optimize images for Docker builds, unoptimized for static export
    unoptimized: process.env.DOCKER_BUILD !== 'true'
  }
}

module.exports = nextConfig
