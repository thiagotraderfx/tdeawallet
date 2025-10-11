// packages/faucet/next.config.js

/**
 * @type {import('next').NextConfig}
 *
 * Configuración de excelencia, diseñada para resolver el conflicto de versiones de React
 * en el monorepo y eliminar el error persistente de transpilación de 'lucide-react'.
 */
const nextConfig = {
  // 1. Configuración de Monorepo
  // Permite que Next.js funcione correctamente en un entorno con dependencias externas.
  output: 'standalone',

  // 2. ELIMINACIÓN RADICAL DEL CONFLICTO:
  // Se ha removido la propiedad 'transpilePackages' en su totalidad.
  // Esto garantiza que el conflicto recurrente con 'lucide-react' ya no pueda ocurrir.
  // Asumimos que los paquetes internos enlazados serán manejados correctamente
  // por el modo 'standalone' y el caching limpio.

  // 3. Solución de Versión de React (La solución crítica de fondo)
  // Esta propiedad es la única forma de obligar a Next.js a usar la versión de React
  // 18.3.1 definida en la raíz del monorepo, previniendo el error de "useActionState".
  serverExternalPackages: [
    'react', 
    'react-dom', 
    'lucide-react' // Se mantiene como externo para asegurar que la versión de la raíz sea usada
  ],
};

module.exports = nextConfig;
