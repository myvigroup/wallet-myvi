/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["passkit-generator"],
    outputFileTracingIncludes: {
      "/api/pass/generate": ["./passes/**/*", "./certs/**/*"],
    },
  },
};

module.exports = nextConfig;
