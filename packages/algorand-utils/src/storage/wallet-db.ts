"use client";

import { openDB, type DBSchema } from "idb";
import type { StoredWallet } from "./types";
import { logEvent } from '../logger';

const DB_NAME_BASE = 'TdeAWallet';
const DB_NAMESPACE = 'wallet'; 
const DB_NAME = `${DB_NAME_BASE}_${DB_NAMESPACE}`;
const DB_VERSION = 2; 
const STORE_NAME = 'wallets';

interface WalletDBSchema extends DBSchema {
  [STORE_NAME]: {
    key: string; // address
    value: StoredWallet;
    indexes: { 'createdAt': number };
  };
}

async function getDB() {
  if (typeof window === 'undefined') {
    throw new Error("IndexedDB can only be accessed in the browser.");
  }
  return openDB<WalletDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // CORRECCIÓN: 'objectStoreStoreNames' cambiado a 'objectStoreNames'
      if (!db.objectStoreNames.contains(STORE_NAME)) { 
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'address' });
        store.createIndex('createdAt', 'createdAt');
      }
    },
  });
}

export async function saveWallet(wallet: StoredWallet): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, wallet);
}

export async function getWallet(address: string): Promise<StoredWallet | undefined> {
  const db = await getDB();
  const wallet = await db.get(STORE_NAME, address);
  return wallet;
}

export async function getAllWallets(): Promise<StoredWallet[]> {
  try {
    const db = await getDB();
    const wallets = await db.getAll(STORE_NAME).catch(err => {
      console.error('wallet-db.getAllWallets read error:', err);
      logEvent('wallet_db_read_error', { message: String(err) });
      return [];
    });
    return (Array.isArray(wallets) ? wallets : []).sort((a,b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('wallet-db.getAllWallets fatal:', err);
    logEvent('wallet_db_fatal', { message: String(err) });
    return [];
  }
}

export async function removeWallet(address: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, address);
}
