/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: { formats: ["image/avif", "image/webp"], remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }, { protocol: "https", hostname: "images.pexels.com" }] },
}
module.exports = nextConfig
