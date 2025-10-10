// packages/faucet/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Configuración esencial para monorepos
  // Permite que Next.js compile y mueva correctamente los módulos a la estructura de Vercel.
  output: 'standalone',

  // 2. Definición de paquetes para transpilación
  // Solo incluimos tu paquete interno enlazado aquí.
  transpilePackages: ['@tdea/algorand-utils'],

  // 3. LA SOLUCIÓN DEFINITIVA PARA EL CONFLICTO DE VERSIÓN DE REACT
  // Esta propiedad CRÍTICA fuerza a los Server Components a buscar estas dependencias
  // en los 'node_modules' de la raíz, respetando la versión exacta (18.3.1) definida
  // con los 'overrides' en el package.json de la raíz. Esto previene el error
  // 'useActionState is not a function'.
  serverExternalPackages: [
    'react', 
    'react-dom', 
    'lucide-react'
  ],

  // Eliminamos el bloque 'experimental' desactualizado para prevenir advertencias y errores.
};

// Usa 'module.exports' para la máxima compatibilidad con el sistema de módulos de Next.js
module.exports = nextConfig;
