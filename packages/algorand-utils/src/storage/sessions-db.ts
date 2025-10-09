/**
 * @fileoverview Driver de almacenamiento para las sesiones del Bridge en IndexedDB.
 */

import { openDB, type DBSchema } from 'idb';
import type { StoredSession } from './types';

const DB_NAME = 'TdeAWallet_Ensayo_DB'; // Usa la base de datos exclusiva de /ensayo
const DB_VERSION = 2; // La versión debe ser consistente en todos los drivers de la misma DB.
const SESSION_STORE_NAME = 'bridge-sessions';

interface EnsayoDBSchema extends DBSchema {
  'wallets': {
    key: string;
    value: any;
    indexes: { 'createdAt': number };
  };
  [SESSION_STORE_NAME]: {
    key: string; // sessionId
    value: StoredSession;
    indexes: { 'lastActivity': number };
  };
}

async function getDB() {
  return openDB<EnsayoDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const walletStore = db.createObjectStore('wallets', { keyPath: 'address' });
        walletStore.createIndex('createdAt', 'createdAt');
      }
      if (oldVersion < 2) {
         if (!db.objectStoreNames.contains(SESSION_STORE_NAME)) {
            const sessionStore = db.createObjectStore(SESSION_STORE_NAME, { keyPath: 'sessionId' });
            sessionStore.createIndex('lastActivity', 'lastActivity');
        }
      }
    },
  });
}

export async function saveSession(session: StoredSession): Promise<void> {
  const db = await getDB();
  await db.put(SESSION_STORE_NAME, session);
}

export async function getSession(sessionId: string): Promise<StoredSession | undefined> {
  const db = await getDB();
  return db.get(SESSION_STORE_NAME, sessionId);
}

export async function getAllSessions(): Promise<StoredSession[]> {
  const db = await getDB();
  return (await db.getAllFromIndex(SESSION_STORE_NAME, 'lastActivity')).reverse();
}

export async function removeSession(sessionId: string): Promise<void> {
  const db = await getDB();
  await db.delete(SESSION_STORE_NAME, sessionId);
}
