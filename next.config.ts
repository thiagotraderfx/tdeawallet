// next.config.ts (RAÍZ DEL MONOREPO)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // CONFIGURACIÓN CRÍTICA PARA SANEAMIENTO DE MONOREPO
  output: 'standalone', 

  // SOLUCIÓN FINAL A CONFLICTOS DE DEPENDENCIAS (React y Lucide-React).
  serverExternalPackages: [
    'react', 
    'react-dom', 
    'lucide-react'
  ],

  // Mantiene la transpilación para que Next.js compile el código de los workspaces
  transpilePackages: ['@tdea/wallet', '@tdea/faucet', '@tdea/algorand-utils'],
  
  // CONFIGURACIONES ORIGINALES DEL PROYECTO
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
