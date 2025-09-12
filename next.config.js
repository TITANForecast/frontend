/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  serverExternalPackages: ['ag-grid-community', 'ag-grid-enterprise']
}

module.exports = nextConfig
