/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use standalone mode for Docker (Dokploy), but not for Netlify
  output: process.env.NET_PUBLIC_ENV === 'netlify' || process.env.NETLIFY ? undefined : 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
};
module.exports = nextConfig;
