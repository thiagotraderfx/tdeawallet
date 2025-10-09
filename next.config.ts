
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tdea/wallet', '@tdea/faucet', '@tdea/algorand-utils'],
  experimental: {
    serverActions: {
      executionTimeout: 120, // Aumenta el timeout a 120 segundos
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  devIndicators: {
    allowedDevOrigins: [
      '*.cluster-hkcruqmgzbd2aqcdnktmz6k7ba.cloudworkstations.dev',
    ],
  },
};

export default nextConfig;
