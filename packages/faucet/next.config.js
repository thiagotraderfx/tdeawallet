// packages/faucet/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración esencial para monorepos
  output: 'standalone',

  // CRÍTICO: 'lucide-react' fue REMOVIDO de esta lista.
  // Solo incluimos tu paquete interno enlazado aquí.
  transpilePackages: ['@tdea/algorand-utils'],

  // Esta lista resuelve el problema de la versión de React (useFormState / useActionState).
  serverExternalPackages: [
    'react', 
    'react-dom', 
    'lucide-react'
  ],
};

module.exports = nextConfig;
