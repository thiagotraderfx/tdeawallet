// packages/faucet/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración esencial para monorepos:
  // Necesario para que Next.js/Vercel pueda compilar módulos fuera de esta carpeta.
  output: 'standalone',

  // 1. ELIMINACIÓN DEL CONFLICTO: Esta lista está limpia.
  // CRÍTICO: 'lucide-react' fue removido de aquí. Solo incluimos el paquete interno.
  transpilePackages: ['@tdea/algorand-utils'],

  // 2. SOLUCIÓN DEL ERROR DE REACT (useFormState):
  // Fuerza a Next.js a tratar estos paquetes como externos y a usar la versión
  // única y correcta (18.3.1) de la raíz del monorepo.
  serverExternalPackages: [
    'react', 
    'react-dom', 
    'lucide-react' // Sigue siendo externo, pero no transpilado
  ],

  // Eliminamos cualquier bloque 'experimental' desactualizado.
};

// Se utiliza 'module.exports' para la máxima compatibilidad con el sistema de módulos de Next.js.
module.exports = nextConfig;
