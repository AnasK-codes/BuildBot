/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React features since this is a headless API
  reactStrictMode: false,

  env: {
    PRISMA_CLIENT_ENGINE_TYPE: 'library',
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default nextConfig;
