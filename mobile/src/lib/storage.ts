import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_VERSION = 1;
const CACHE_EXPIRY_DAYS = 7;
const CACHE_PREFIX = 'cache:';
const SYNC_QUEUE_PREFIX = 'syncQueue:';

interface CacheEntry {
  data: unknown;
  updatedAt: number;
  cacheVersion: number;
  expiresAt: number;
}

export async function saveToStorage(key: string, data: unknown): Promise<void> {
  const entry: CacheEntry = {
    data,
    updatedAt: Date.now(),
    cacheVersion: CACHE_VERSION,
    expiresAt: Date.now() + CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  };
  await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
}

export async function getFromStorage<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
  if (!raw) return null;
  try {
    const entry: CacheEntry = JSON.parse(raw);
    if (entry.cacheVersion !== CACHE_VERSION) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    if (entry.expiresAt < Date.now()) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return entry.data as T;
  } catch {
    return null;
  }
}

export async function deleteFromStorage(key: string): Promise<void> {
  await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
}

export async function addToSyncQueue(
  action: 'create' | 'update' | 'delete',
  entity: string,
  entityId: string,
  data: unknown
): Promise<void> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const item = { id, action, entity, entityId, data, timestamp: Date.now() };
  await AsyncStorage.setItem(`${SYNC_QUEUE_PREFIX}${id}`, JSON.stringify(item));
}

type SyncItem = { id: string; action: 'create' | 'update' | 'delete'; entity: string; entityId: string; data: unknown; timestamp: number };

export async function getPendingSyncItems(): Promise<SyncItem[]> {
  const keys = await AsyncStorage.getAllKeys();
  const queueKeys = keys.filter(k => k.startsWith(SYNC_QUEUE_PREFIX));
  if (queueKeys.length === 0) return [];
  const results: SyncItem[] = [];
  for (const key of queueKeys) {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      try {
        results.push(JSON.parse(raw));
      } catch {}
    }
  }
  return results;
}

export async function removeSyncItem(id: string): Promise<void> {
  await AsyncStorage.removeItem(`${SYNC_QUEUE_PREFIX}${id}`);
}

export async function clearSyncQueue(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const queueKeys = keys.filter(k => k.startsWith(SYNC_QUEUE_PREFIX));
  await Promise.all(queueKeys.map(k => AsyncStorage.removeItem(k)));
}

export async function getSyncQueueCount(): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();
  return keys.filter(k => k.startsWith(SYNC_QUEUE_PREFIX)).length;
}
