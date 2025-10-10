// packages/faucet/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración esencial para monorepos
  output: 'standalone',

  // ÚNICAMENTE incluimos el paquete interno que SÍ necesita transpilación.
  // CRÍTICO: 'lucide-react' DEBE estar AUSENTE de esta lista.
  transpilePackages: ['@tdea/algorand-utils'],

  // Esta lista incluye las dependencias que deben ser tratadas como externas 
  // para resolver el conflicto de versiones de React en el monorepo.
  serverExternalPackages: [
    'react', 
    'react-dom', 
    'lucide-react'
  ],
};

module.exports = nextConfig;

