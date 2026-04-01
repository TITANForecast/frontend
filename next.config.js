/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for Docker/ECS deployment
  // Use default server mode for development (needed for API routes)
  output: process.env.DOCKER_BUILD === "true" ? "standalone" : undefined,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    // Optimize images for Docker builds, unoptimized for static export
    unoptimized:
      process.env.NODE_ENV === "development" ||
      process.env.DOCKER_BUILD !== "true",
  },
  // Externalize pdfkit and archiver to avoid bundling issues
  serverExternalPackages: ["pdfkit", "archiver"],
  experimental: {
    serverComponentsExternalPackages: ["pdfkit", "archiver"],
  },
};

module.exports = nextConfig;
