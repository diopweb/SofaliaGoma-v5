/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next.js 15 enables this by default, but we can be explicit
    ppr: true, 
  },
  // allowedDevOrigins is a top-level configuration key, not under experimental
  allowedDevOrigins: ["https://*.cloudworkstations.dev"],
};

export default nextConfig;
