// packages/faucet/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración esencial para monorepos para que Vercel encuentre los archivos de construcción
  output: 'standalone',

  // ÚLTIMA CORRECCIÓN: Solo incluimos tu paquete interno enlazado aquí.
  // Lucide-react fue eliminado de esta lista para resolver el conflicto con serverExternalPackages.
  transpilePackages: ['@tdea/algorand-utils'],

  // Configuración CRÍTICA para Monorepo/Server Components
  // Esto fuerza a usar la versión de React de la raíz, resolviendo el TypeError.
  serverExternalPackages: [
    'react', 
    'react-dom', 
    'lucide-react' // Lucide-react sigue siendo externo para evitar conflictos de bundling
  ],
};

// Se utiliza 'module.exports' para la máxima compatibilidad con Next.js
module.exports = nextConfig;
