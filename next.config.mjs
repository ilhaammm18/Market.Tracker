/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["lightweight-charts", "fancy-canvas"],
  images: {
    domains: ["assets.coingecko.com", "images.unsplash.com"],
  },
};

export default nextConfig;
