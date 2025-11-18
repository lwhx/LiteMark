import { getStorage, type StorageData } from './db.js';

export type StorageProvider = 'vercel-blob' | 's3' | 'oss' | 'cos' | 'webdav';

export interface StorageConfig {
  provider: StorageProvider;
  [key: string]: any;
}

export async function getStorageConfig(): Promise<StorageConfig | null> {
  const storage: StorageData = await getStorage();
  return storage?.config || null;
}

export async function saveStorageConfig(config: StorageConfig): Promise<void> {
  const storage: StorageData = await getStorage();
  if (storage) {
    storage.config = config;
    if (storage.save) {
      await storage.save();
    }
  }
}

