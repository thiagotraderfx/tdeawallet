
// next.config.ts (RAÍZ DEL MONOREPO)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. CONFIGURACIÓN DE MONOREPO CRÍTICA
  output: 'standalone', // Obliga al empaquetamiento correcto de las dependencias.

  // 2. SOLUCIÓN FINAL DE DEPENDENCIAS (useActionState y Lucide-React)
  // Esta línea obliga a que el compilador del servidor use la versión única 
  // de estas librerías desde la raíz del monorepo, resolviendo el conflicto de 
  // doble React/Lucide-React que causan los fallos.
  serverExternalPackages: [
    'react', 
    'react-dom', 
    'lucide-react'
  ],

  // 3. Transpilación y Experimentales
  transpilePackages: ['@tdea/wallet', '@tdea/faucet', '@tdea/algorand-utils'],
  
  experimental: {
    serverActions: {
      executionTimeout: 120, // Se mantiene el timeout
    },
  },
  
  // 4. Configuración de Imágenes y Dev (Mantenida)
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
