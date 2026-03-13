/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["passkit-generator"],
    outputFileTracingIncludes: {
      "/api/pass/generate": ["./passes/**/*", "./passes/**/*.pass/**/*", "./certs/**/*"],
    },
  },
};

module.exports = nextConfig;
