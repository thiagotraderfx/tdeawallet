import { openDB, type DBSchema } from 'idb';
import type { ClassifiedAsset } from '@tdea/algorand-utils';

const DB_NAME = 'TdeAWalletAssetCache';
const DB_VERSION = 1;
const STORE_NAME = 'asset-metadata';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface AssetCacheDBSchema extends DBSchema {
  [STORE_NAME]: {
    key: number; // assetId
    value: {
        asset: ClassifiedAsset;
        timestamp: number;
    };
  };
}

const memoryCache = new Map<number, { asset: ClassifiedAsset; timestamp: number }>();
const MAX_MEM_CACHE_SIZE = 200;

async function getDB() {
  return openDB<AssetCacheDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'asset.id' });
      }
    },
  });
}

export async function getCachedAsset(assetId: number): Promise<ClassifiedAsset | null> {
    if (memoryCache.has(assetId)) {
        const entry = memoryCache.get(assetId)!;
        if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
            memoryCache.delete(assetId);
            memoryCache.set(assetId, entry);
            return entry.asset;
        } else {
            memoryCache.delete(assetId);
        }
    }

    const db = await getDB();
    const result = await db.get(STORE_NAME, assetId);
    if (result && (Date.now() - result.timestamp < CACHE_TTL_MS)) {
        updateMemoryCache(assetId, result.asset, result.timestamp);
        return result.asset;
    }

    return null;
}

export async function setCachedAsset(assetId: number, asset: ClassifiedAsset): Promise<void> {
    const timestamp = Date.now();
    
    updateMemoryCache(assetId, asset, timestamp);
    
    const db = await getDB();
    await db.put(STORE_NAME, { asset, timestamp });
}

export async function clearCacheFor(assetId: number): Promise<void> {
    memoryCache.delete(assetId);
    const db = await getDB();
    await db.delete(STORE_NAME, assetId);
}

function updateMemoryCache(assetId: number, asset: ClassifiedAsset, timestamp: number) {
    if (memoryCache.has(assetId)) {
        memoryCache.delete(assetId);
    }
    memoryCache.set(assetId, { asset, timestamp });
    if (memoryCache.size > MAX_MEM_CACHE_SIZE) {
        const oldestKey = memoryCache.keys().next().value;
        memoryCache.delete(oldestKey);
    }
}
