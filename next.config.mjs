/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverComponentsExternalPackages: ["better-sqlite3"] },
};
export default nextConfig;
