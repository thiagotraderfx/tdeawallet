
"use client";
/**
 * @fileoverview Lógica para migrar billeteras desde el formato antiguo de localStorage (`tdea_wallets_v1`)
 * al nuevo almacenamiento en IndexedDB.
 */

import { saveWallet } from './wallet-db';
import type { StoredWallet } from './types';
import type { EncryptedPayload } from '../crypto';

const V1_STORAGE_KEY = 'tdea_wallets_v1';
const MIGRATION_FLAG_KEY = 'tdea:migration_flag:v2';

interface V1StoredWallet {
  address: string;
  enc: any; // El formato antiguo podría no estar bien tipado.
  net: 'mainnet' | 'testnet';
  label: string;
  createdAt: number;
}

/**
 * Valida si un objeto se parece a una billetera del formato v1.
 * @param obj El objeto a validar.
 * @returns `true` si es un objeto válido del v1, `false` en caso contrario.
 */
function isValidV1Wallet(obj: any): obj is V1StoredWallet {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.address === 'string' &&
    typeof obj.enc === 'object' &&
    obj.enc !== null &&
    typeof obj.enc.ct === 'string' &&
    typeof obj.enc.iv === 'string' &&
    typeof obj.enc.salt === 'string'
  );
}

/**
 * Ejecuta el proceso de migración de localStorage a IndexedDB.
 * - Lee los datos antiguos del `localStorage`.
 * - Valida cada billetera.
 * - Las guarda en el IndexedDB.
 * - Establece una bandera para no volver a ejecutar la migración.
 * @returns El número de billeteras migradas exitosamente.
 */
export async function runMigration(): Promise<number> {
  if (typeof window === 'undefined' || window.localStorage.getItem(MIGRATION_FLAG_KEY)) {
    return 0; // Ya migrado o no estamos en el cliente.
  }

  const oldDataRaw = window.localStorage.getItem(V1_STORAGE_KEY);
  if (!oldDataRaw) {
    window.localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return 0; // No hay nada que migrar.
  }

  let migratedCount = 0;
  try {
    const oldWallets = JSON.parse(oldDataRaw);
    if (!Array.isArray(oldWallets)) {
      throw new Error('El formato antiguo no es un array.');
    }

    for (const walletData of oldWallets) {
      if (isValidV1Wallet(walletData)) {
        // Mapeo al nuevo esquema
        const newEnc: EncryptedPayload = {
            v: 1,
            algorithm: 'AES-GCM',
            kdf: 'PBKDF2',
            iterations: walletData.enc.kdfIter || 200000,
            salt: walletData.enc.salt,
            iv: walletData.enc.iv,
            ct: walletData.enc.ct,
        };

        const newWallet: StoredWallet = {
          address: walletData.address,
          label: walletData.label || `Wallet (migrada)`,
          net: walletData.net === 'mainnet' ? 'MAINNET' : 'TESTNET',
          enc: newEnc,
          createdAt: walletData.createdAt || Date.now(),
          meta: {},
        };
        await saveWallet(newWallet);
        migratedCount++;
      }
    }
    
    console.log(`Migración completada. ${migratedCount} billeteras movidas a IndexedDB.`);
    window.localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    // Opcional: limpiar el storage antiguo
    // window.localStorage.removeItem(V1_STORAGE_KEY);

  } catch (error) {
    console.error(`Error durante la migración de billeteras:`, error);
  }

  return migratedCount;
}
