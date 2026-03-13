/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["passkit-generator"],
  },
};

module.exports = nextConfig;
