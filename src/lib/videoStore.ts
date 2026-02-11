// src/lib/videoStore.ts
// IndexedDB に Blob(動画) を保存して、idで取り出す

export type StoredVideo = {
  id: string;
  createdAt: number;
  mimeType: string;
  blob: Blob;
};

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

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);

        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);

        t.oncomplete = () => db.close();
        t.onerror = () => {
          db.close();
          reject(t.error);
        };
      })
  );
}

export async function saveVideo(blob: Blob, mimeType: string): Promise<string> {
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const item: StoredVideo = {
    id,
    createdAt: Date.now(),
    mimeType: mimeType || blob.type || "video/mp4",
    blob,
  };
  await tx("readwrite", (s) => s.put(item));
  return id;
}

export async function loadVideo(id: string): Promise<StoredVideo | null> {
  const res = await tx<any>("readonly", (s) => s.get(id));
  return res ? (res as StoredVideo) : null;
}

export async function getVideoObjectURL(id: string): Promise<string | null> {
  const item = await loadVideo(id);
  if (!item) return null;
  return URL.createObjectURL(item.blob);
}

export async function deleteVideo(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}