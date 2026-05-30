import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface LifeOSDB extends DBSchema {
  store: {
    key: string;
    value: {
      key: string;
      data: unknown;
      updatedAt: number;
      cacheVersion?: number;
      expiresAt?: number;
    };
  };
  syncQueue: {
    key: number;
    value: {
      id?: number;
      action: 'create' | 'update' | 'delete';
      entity: string;
      entityId: string;
      data: unknown;
      timestamp: number;
    };
  };
}

const DB_NAME = 'lifeos-offline';
const DB_VERSION = 2; // Incremented for cache versioning support
const CACHE_VERSION = 1; // Increment this when schema changes
const CACHE_EXPIRY_DAYS = 7; // Cache expires after 7 days

let dbInstance: IDBPDatabase<LifeOSDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<LifeOSDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<LifeOSDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Main data store
      if (!db.objectStoreNames.contains('store')) {
        db.createObjectStore('store', { keyPath: 'key' });
      }
      // Sync queue for offline changes
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
      
      // Migration: Add cache versioning to existing data
      // Note: Migration will happen on next access, not during upgrade
      // This is safer as upgrade handler should be synchronous
    },
  });
  
  // Perform migration after DB is opened (if needed)
  if (dbInstance.version === DB_VERSION) {
    try {
      const tx = dbInstance.transaction('store', 'readwrite');
      const store = tx.objectStore('store');
      const cursor = await store.openCursor();
      
      if (cursor) {
        let migrated = false;
        do {
          const item = cursor.value;
          // Check if item needs migration (missing cacheVersion or expiresAt)
          if (!item.cacheVersion || !item.expiresAt) {
            await cursor.update({
              ...item,
              cacheVersion: CACHE_VERSION,
              expiresAt: Date.now() + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
            });
            migrated = true;
          }
        } while (await cursor.continue());
        
        if (migrated) {
          console.log('[IndexedDB] Migrated cache entries to version', CACHE_VERSION);
        }
      }
      await tx.done;
    } catch (error) {
      console.warn('[IndexedDB] Migration error (non-critical):', error);
    }
  }

  return dbInstance;
}

// Save data to IndexedDB with versioning and expiry
export async function saveToIndexedDB(key: string, data: unknown): Promise<void> {
  const db = await getDB();
  const expiresAt = Date.now() + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await db.put('store', {
    key,
    data,
    updatedAt: Date.now(),
    cacheVersion: CACHE_VERSION,
    expiresAt,
  });
}

// Get data from IndexedDB with version and expiry checking
export async function getFromIndexedDB<T>(key: string): Promise<T | null> {
  const db = await getDB();
  const result = await db.get('store', key);
  
  if (!result) return null;
  
  // Check cache version - invalidate if version mismatch
  if (result.cacheVersion !== undefined && result.cacheVersion !== CACHE_VERSION) {
    console.log(`[IndexedDB] Cache version mismatch for ${key}, clearing...`);
    await db.delete('store', key);
    return null;
  }
  
  // Check expiry - invalidate if expired
  if (result.expiresAt !== undefined && result.expiresAt < Date.now()) {
    console.log(`[IndexedDB] Cache expired for ${key}, clearing...`);
    await db.delete('store', key);
    return null;
  }
  
  return result.data as T | null;
}

// Delete data from IndexedDB
export async function deleteFromIndexedDB(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('store', key);
}

// Add item to sync queue (for offline changes)
export async function addToSyncQueue(
  action: 'create' | 'update' | 'delete',
  entity: string,
  entityId: string,
  data: unknown
): Promise<void> {
  const db = await getDB();
  await db.add('syncQueue', {
    action,
    entity,
    entityId,
    data,
    timestamp: Date.now(),
  });
}

// Get all pending sync items
export async function getPendingSyncItems() {
  const db = await getDB();
  return db.getAll('syncQueue');
}

// Clear sync queue after successful sync
export async function clearSyncQueue(): Promise<void> {
  const db = await getDB();
  await db.clear('syncQueue');
}

// Remove specific item from sync queue
export async function removeSyncItem(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

// Get sync queue count
export async function getSyncQueueCount(): Promise<number> {
  const db = await getDB();
  return db.count('syncQueue');
}

// Export all data for backup
export async function exportAllData(): Promise<Record<string, unknown>> {
  const db = await getDB();
  const allData = await db.getAll('store');
  const result: Record<string, unknown> = {};
  for (const item of allData) {
    result[item.key] = item.data;
  }
  return result;
}

// Import data from backup
export async function importData(data: Record<string, unknown>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('store', 'readwrite');
  const expiresAt = Date.now() + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  for (const [key, value] of Object.entries(data)) {
    await tx.store.put({
      key,
      data: value,
      updatedAt: Date.now(),
      cacheVersion: CACHE_VERSION,
      expiresAt,
    });
  }
  await tx.done;
}

// Clear expired cache entries (can be called periodically)
export async function clearExpiredCache(): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('store', 'readwrite');
  let cleared = 0;
  const now = Date.now();
  
  const cursor = await tx.store.openCursor();
  if (cursor) {
    do {
      const item = cursor.value;
      // Check version mismatch or expiry
      if (
        (item.cacheVersion !== undefined && item.cacheVersion !== CACHE_VERSION) ||
        (item.expiresAt !== undefined && item.expiresAt < now)
      ) {
        await cursor.delete();
        cleared++;
      }
    } while (await cursor.continue());
  }
  
  await tx.done;
  if (cleared > 0) {
    console.log(`[IndexedDB] Cleared ${cleared} expired cache entries`);
  }
  return cleared;
}
