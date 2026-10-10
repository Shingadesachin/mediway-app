/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
    optimizePackageImports: ["lucide-react"],
    // Make sure the native SQLite file is shipped with the serverless functions on Vercel.
    outputFileTracingIncludes: { "/api/**/*": ["./node_modules/better-sqlite3/**/*"] },
  },
};
export default nextConfig;
