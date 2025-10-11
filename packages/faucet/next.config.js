// packages/faucet/next.config.js

/**
 * @type {import('next').NextConfig}
 *
 * Configuración de excelencia para el módulo 'faucet' en un entorno de monorepo.
 * Esta configuración aborda directamente los conflictos de versión de React (useActionState)
 * y los problemas de compilación en Vercel.
 */
const nextConfig = {
  // 1. Configuración de Monorepo (Output Standalone)
  // Permite que Next.js detecte y empaquete correctamente las dependencias de la raíz
  // y de otros workspaces, lo cual es esencial para el deploy en Vercel.
  output: 'standalone',

  // 2. Transpilación de Paquetes
  // CRÍTICO: Esta lista solo debe contener paquetes internos que no están pre-compilados
  // y que están enlazados. Se ha eliminado 'lucide-react' para evitar el conflicto
  // con 'serverExternalPackages'.
  transpilePackages: ['@tdea/algorand-utils'],

  // 3. Solución de Versión de React (El 'Santo Grial')
  // Esta propiedad CRÍTICA fuerza a los Server Components (SSR/prerender) a NO
  // empaquetar estas dependencias. En su lugar, usa la versión singular y forzada
  // (React 18.3.1) definida en el package.json de la raíz, resolviendo el
  // 'TypeError: useActionState is not a function'.
  serverExternalPackages: [
    'react', 
    'react-dom', 
    'lucide-react' // Se mantiene externo para evitar problemas de duplicación en el bundle
  ],

  // Se omite la propiedad 'experimental' ya que 'serverExternalPackages' es ahora de nivel superior.
};

// Exportación del módulo para máxima compatibilidad con el sistema de módulos de Next.js/CommonJS.
module.exports = nextConfig;
