/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React features since this is a headless API
  reactStrictMode: false,

  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
