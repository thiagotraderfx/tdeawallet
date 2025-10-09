
import type { Network } from '../config';

export type EncryptedPayload = {
  v: 1;
  algorithm: 'AES-GCM';
  kdf: 'PBKDF2';
  iterations: number;
  salt: string; // hex
  iv: string;   // hex
  ct: string;   // base64 (ciphertext + authTag)
};

/**
 * Define la estructura de una billetera tal como se guarda en IndexedDB.
 * NUNCA guardamos claves privadas o mnemónicos en texto plano.
 */
export interface StoredWallet {
  address: string;
  label: string;
  net: Network;
  enc: EncryptedPayload;
  createdAt: number;
  meta: Record<string, any>;
}

export type BridgeScope = 'request_accounts' | 'sign_transactions' | 'post_transactions';

/**
 * Define la estructura de una sesión de Bridge guardada.
 */
export interface StoredSession {
    sessionId: string;
    dappName: string;
    dappUrl: string;
    dappIcon?: string;
    scopes: BridgeScope[];
    createdAt: number;
    lastActivity: number;
    connectedAccount: string; // La dirección de la billetera conectada
}
