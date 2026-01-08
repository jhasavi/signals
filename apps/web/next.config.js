/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.mlspin.com',
      },
    ],
  },
};

module.exports = nextConfig;
