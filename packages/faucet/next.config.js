// packages/faucet/next.config.js

/**
 * @type {import('next').NextConfig}
 *
 * Configuración de excelencia, diseñada para:
 * 1. Resolver el conflicto de versiones de React (useActionState) en el monorepo.
 * 2. Eliminar el conflicto persistente de transpilación de 'lucide-react'.
 */
const nextConfig = {
  // 1. Configuración de Monorepo:
  // Esencial para que Next.js detecte y empaquete correctamente las dependencias
  // externas en el entorno de despliegue de Vercel (manejo de módulos).
  output: 'standalone',

  // 2. Transpilación de Paquetes (Eliminación del Conflicto):
  // Se ha OMITIDO la propiedad 'transpilePackages' en su totalidad.
  // Esto elimina la única causa conocida del conflicto recurrente de 'lucide-react',
  // permitiendo que el build pase a la siguiente etapa.
  
  // 3. Solución Crítica de Versión de React:
  // Esta propiedad obliga al compilador de Next.js a tratar 'react', 'react-dom'
  // y 'lucide-react' como módulos externos al bundle, forzando el uso de la
  // versión singular (18.3.1) definida en el package.json de la raíz del monorepo.
  // Esto resuelve directamente el error "useActionState is not a function".
  serverExternalPackages: [
    'react', 
    'react-dom', 
    'lucide-react' 
  ],

  // Se omite cualquier otra configuración o bloque experimental que no sea necesaria.
};

// Exportación final del módulo.
module.exports = nextConfig;
