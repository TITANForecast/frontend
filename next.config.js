/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    // Disable ESLint during builds for deployment testing
    // Developer is working on linting fixes in separate branch
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
