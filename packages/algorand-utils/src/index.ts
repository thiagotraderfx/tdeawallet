/**
 * @fileoverview Archivo de barril principal para el paquete @tdea/algorand-utils.
 * Exporta todas las funcionalidades públicas desde un solo lugar.
 */

// Exportaciones donde NO hay conflictos de nombres
export * from './crypto';
export * from './storage/types';
export * from './storage/local-compat';
export * from './assets/classifier';
export * from './config';
export * from './logger';

// Exportaciones CONFLICTIVAS (se usa alias para evitar el error 'removeWallet')

// 1. Exportamos todo desde keystore, incluyendo su versión de removeWallet
export * from './keystore'; 

// 2. Exportamos las funciones de wallet-db, pero renombramos la función 'removeWallet'
// para que no choque con la de 'keystore'.
export { 
    saveWallet, 
    getWallet, 
    getAllWallets, 
    removeWallet as removeWalletFromStorage // <-- ¡SOLUCIÓN FINAL DE AMBIGÜEDAD!
} from './storage/wallet-db';
