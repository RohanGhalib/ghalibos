import { openDB, IDBPDatabase } from 'idb';
import { PendingOperation } from '../types/vfs';

const DB_NAME = 'ghalibos-vfs-queue';
const STORE_NAME = 'pending-ops';
const DB_VERSION = 1;

let db: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (!db) {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return db;
}

export async function enqueueOperation(op: PendingOperation): Promise<void> {
  const database = await getDb();
  await database.put(STORE_NAME, op);
}

export async function drainQueue(): Promise<PendingOperation[]> {
  const database = await getDb();
  const all = await database.getAll(STORE_NAME) as PendingOperation[];
  if (all.length === 0) return [];

  for (const op of all) {
    console.info('[OfflineQueue] Flushing op', op);
    await database.delete(STORE_NAME, op.id);
  }

  return all;
}

export async function getPendingOps(): Promise<PendingOperation[]> {
  const database = await getDb();
  return database.getAll(STORE_NAME) as Promise<PendingOperation[]>;
}
