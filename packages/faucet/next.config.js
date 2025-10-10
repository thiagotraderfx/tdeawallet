/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración necesaria para monorepos para que Vercel encuentre los archivos de construcción
  output: 'standalone',

  // Configuración de monorepo: transpila paquetes que residen fuera del directorio actual
  // Asumiendo que @tdea/algorand-utils es un paquete local enlazado.
  transpilePackages: ['@tdea/algorand-utils'],

  // CONFIGURACIÓN CRÍTICA PARA RESOLVER EL CONFLICTO DE VERSIÓN DE REACT
  // Al externalizar 'react' y 'react-dom' de los Server Components, forzamos
  // a Next.js a usar la versión singular definida en el package.json raíz.
  experimental: {
    serverComponentsExternalPackages: [
      'react', 
      'react-dom', 
      // Agregar 'lucide-react' ya que es otra dependencia grande y compartida
      'lucide-react'
    ],
  },
};

// Se utiliza 'module.exports' ya que es la forma más compatible con Next.js/CommonJS,
// aunque se puede usar 'export default nextConfig' con la configuración de 'type: module'.
module.exports = nextConfig;
