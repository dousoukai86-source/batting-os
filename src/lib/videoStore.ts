// src/lib/videoStore.ts
// IndexedDB に動画 Blob を保存/取得する最小実装

const DB_NAME = "batting_os_db";
const DB_VERSION = 1;
const STORE = "videos";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveVideoBlob(blob: Blob): Promise<string> {
  const db = await openDB();
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.put({ id, blob, createdAt: Date.now(), type: blob.type, size: blob.size });

    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadVideoBlob(id: string): Promise<Blob | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.get(id);

    req.onsuccess = () => {
      const row = req.result as { blob: Blob } | undefined;
      resolve(row?.blob ?? null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteVideoBlob(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}