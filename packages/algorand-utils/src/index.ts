/**
 * @fileoverview Archivo de barril principal para el paquete @tdea/algorand-utils.
 * Exporta todas las funcionalidades públicas desde un solo lugar.
 */

// Exportaciones donde NO hay conflictos de nombres
export * from './crypto.js'; // CORREGIDO
export * from './storage/types.js'; // CORREGIDO
export * from './storage/local-compat.js'; // CORREGIDO
export * from './assets/classifier.js'; // CORREGIDO
export * from './config.js'; // CORREGIDO
export * from './logger.js'; // CORREGIDO

// Exportaciones CONFLICTIVAS (se usa alias para evitar el error 'removeWallet')

// 1. Exportamos todo desde keystore, incluyendo su versión de removeWallet
export * from './keystore.js'; // CORREGIDO

// 2. Exportamos las funciones de wallet-db, pero renombramos la función 'removeWallet'
// para que no choque con la de 'keystore'.
export { 
    saveWallet, 
    getWallet, 
    getAllWallets, 
    removeWallet as removeWalletFromStorage 
} from './storage/wallet-db.js'; // CORREGIDO
