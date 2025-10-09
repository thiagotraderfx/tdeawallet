
"use client";

import { generateAccount, mnemonicToSecretKey, secretKeyToMnemonic } from 'algosdk';
import { encryptMnemonic, decryptMnemonic, changePassword } from './crypto';
import { saveWallet, getWallet, getAllWallets, removeWallet as removeWalletFromDB } from './storage/wallet-db';
import type { StoredWallet } from './storage/types';
import { logEvent } from './logger';
import type { Network } from './config';
import { validateMnemonic } from './crypto/validation';

const TTL_MS = 5 * 60 * 1000; // 5 minutos
const unlockedSessions = new Map<string, { account: ReturnType<typeof mnemonicToSecretKey>; timeoutId: NodeJS.Timeout }>();
let activeAddress: string | null = null;

export async function unlockWallet(storedWallet: StoredWallet, password: string): Promise<{ account: ReturnType<typeof mnemonicToSecretKey>, storedWallet: StoredWallet }> {
    const { address, enc } = storedWallet;
    logEvent('wallet_unlock_attempt', { address });

    if (unlockedSessions.has(address)) {
        lockWallet(address);
    }

    try {
        const mnemonic = await decryptMnemonic(enc, password);
        if (!validateMnemonic(mnemonic)) {
            throw new Error("Mnemonic checksum failed after decryption.");
        }
        const account = mnemonicToSecretKey(mnemonic);
        
        const timeoutId = setTimeout(() => {
            console.log(`[keystore] TTL expired for ${address}. Locking wallet.`);
            lockWallet(address);
        }, TTL_MS);

        unlockedSessions.set(address, { account, timeoutId });
        activeAddress = address;
        logEvent('wallet_unlock_success', { address });
        
        return { account, storedWallet };
    } catch (e: any) {
        logEvent('wallet_unlock_failed', { address, reason: e.message });
        throw e;
    }
}

export function lockWallet(address: string): boolean {
    const session = unlockedSessions.get(address);
    if (session) {
        clearTimeout(session.timeoutId);
        if (session.account && session.account.sk) {
            session.account.sk.fill(0);
        }
        unlockedSessions.delete(address);
        if (activeAddress === address) {
            activeAddress = null;
        }
        logEvent('wallet_locked', { address, reason: "zeroized" });
        return true;
    }
    return false;
}

export function getUnlockedAccount(address: string): ReturnType<typeof mnemonicToSecretKey> {
    const session = unlockedSessions.get(address);
    if (!session) {
        throw new Error("Sesión expirada. Por favor desbloquee la billetera.");
    }
    clearTimeout(session.timeoutId);
    session.timeoutId = setTimeout(() => lockWallet(address), TTL_MS);

    return session.account;
}

export function getActiveAddress(): string | null {
    return activeAddress;
}

export async function signTransaction(address: string, txn: import('algosdk').Transaction): Promise<Uint8Array> {
    const account = getUnlockedAccount(address);
    return txn.signTxn(account.sk);
}

export async function createWallet(password: string, label?: string, net: Network = 'TESTNET'): Promise<{ storedWallet: StoredWallet, mnemonic: string }> {
  if (!password || password.length < 12) {
    throw new Error("La contraseña debe tener al menos 12 caracteres.");
  }
  
  const account = generateAccount();
  const mnemonic = secretKeyToMnemonic(account.sk);
  
  if (account.sk) account.sk.fill(0);

  const enc = await encryptMnemonic(mnemonic, password);

  const newWallet: StoredWallet = {
    address: account.addr,
    label: label || `Billetera ${account.addr.slice(0, 6)}...`,
    net,
    enc,
    createdAt: Date.now(),
    meta: {},
  };

  await saveWallet(newWallet);
  logEvent('wallet_created', { address: newWallet.address, net: newWallet.net });
  
  return { storedWallet: newWallet, mnemonic };
}

export async function importWallet(mnemonic: string, password: string, label?: string, net: Network = 'TESTNET'): Promise<StoredWallet> {
  if (!password || password.length < 12) {
    throw new Error("La contraseña debe tener al menos 12 caracteres.");
  }
  
  if (!validateMnemonic(mnemonic)) {
      logEvent('wallet_import_failed', { reason: 'invalid_mnemonic' });
      throw new Error("La frase mnemónica no es válida.");
  }

  const account = mnemonicToSecretKey(mnemonic);

  const enc = await encryptMnemonic(mnemonic, password);

  const newWallet: StoredWallet = {
    address: account.addr,
    label: label || `Importada ${account.addr.slice(0, 6)}...`,
    net,
    enc,
    createdAt: Date.now(),
    meta: {},
  };

  await saveWallet(newWallet);
  logEvent('wallet_imported', { address: newWallet.address, net: newWallet.net });
  return newWallet;
}

export async function changeWalletPassword(address: string, oldPassword: string, newPassword: string): Promise<void> {
    const storedWallet = await getWallet(address);
    if (!storedWallet) {
        throw new Error("La billetera no se encontró.");
    }
    if (!newPassword || newPassword.length < 12) {
        throw new Error("La nueva contraseña debe tener al menos 12 caracteres.");
    }

    const newEnc = await changePassword(storedWallet.enc, oldPassword, newPassword);
    
    const updatedWallet: StoredWallet = {
        ...storedWallet,
        enc: newEnc,
    };

    await saveWallet(updatedWallet);
    logEvent('wallet_password_changed', { address });
}

export async function removeWallet(address: string): Promise<void> {
    lockWallet(address);
    await removeWalletFromDB(address);
    logEvent('wallet_removed', { address });
}

export async function verifyAndReveal(address: string, password: string): Promise<string> {
    const storedWallet = await getWallet(address);
    if (!storedWallet) {
      throw new Error("Billetera no encontrada.");
    }
  
    try {
      const mnemonic = await decryptMnemonic(storedWallet.enc, password);
      return mnemonic;
    } catch (error) {
      throw new Error("Contraseña incorrecta.");
    }
}
