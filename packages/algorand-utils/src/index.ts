/**
 * @fileoverview Archivo de barril principal para el paquete @tdea/algorand-utils.
 * Exporta todas las funcionalidades públicas desde un solo lugar.
 */

// Exportaciones donde NO hay conflictos de nombres
export * from './crypto'; // CORRECCIÓN: Se elimina el .js
export * from './storage/types'; // CORRECCIÓN: Se elimina el .js
export * from './storage/local-compat'; // CORRECCIÓN: Se elimina el .js
export * from './assets/classifier'; // CORRECCIÓN: Se elimina el .js
export * from './config'; // CORRECCIÓN: Se elimina el .js
export * from './logger'; // CORRECCIÓN: Se elimina el .js

// Exportaciones CONFLICTIVAS (se usa alias para evitar el error 'removeWallet')

// 1. Exportamos todo desde keystore, incluyendo su versión de removeWallet
export * from './keystore'; // CORRECCIÓN: Se elimina el .js

// 2. Exportamos las funciones de wallet-db, pero renombramos la función 'removeWallet'
// para que no choque con la de 'keystore'.
export { 
    saveWallet, 
    getWallet, 
    getAllWallets, 
    removeWallet as removeWalletFromStorage 
} from './storage/wallet-db'; // CORRECCIÓN: Se elimina el .js
