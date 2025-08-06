/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: false,
  },
  devIndicators: {
    allowedDevOrigins: [
        "https://6000-firebase-studio-1754202302551.cluster-c3a7z3wnwzapkx3rfr5kz62dac.cloudworkstations.dev",
    ],
  },
};

export default nextConfig;
