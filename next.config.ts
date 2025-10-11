// next.config.ts (RAÍZ DEL MONOREPO)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // CRÍTICO PARA MONOREPO Y VERCEL STANDALONE
  output: 'standalone', 

  // SOLUCIÓN FINAL A CONFLICTOS DE DEPENDENCIAS (useActionState y Lucide-React).
  // Fuerza al compilador del servidor a usar las copias ÚNICAS de estas librerías desde la raíz.
  serverExternalPackages: [
    'react', 
    'react-dom', 
    'lucide-react'
  ],

  // Mantiene la transpilación para que Next.js compile el código de los workspaces
  transpilePackages: ['@tdea/wallet', '@tdea/faucet', '@tdea/algorand-utils'],
  
  // Se mantienen las configuraciones originales:
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
