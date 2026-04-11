const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Nezastavuj build kvůli ESLint chybám
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Nezastavuj build kvůli TypeScript chybám
    ignoreBuildErrors: true,
  },
};

module.exports = withNextIntl(nextConfig);
