import { ImageLoader } from '@src/services/ImageLoader/ImageLoader';

const DB_NAME = 'mini-puzzle';
const DB_VERSION = 1;
const STORE = 'images';

/** Name of the bundled default image; its record is pinned and never trimmed away. */
export const DEFAULT_NAME = 'default.jpg';

export class ImageStore {
  static readonly RECENT_LIMIT = 5;

  static list = async (): Promise<ImageStore.StoredImage[]> => {
    const db = await open_db();

    try {
      const all = (await read_all(db)).map(item => with_thumb(item)).sort((a, b) => b.added - a.added);

      // The default image is pinned to the end of the list and never counts toward the recent limit.
      const recents = all.filter(item => item.name !== DEFAULT_NAME).slice(0, ImageStore.RECENT_LIMIT);
      const fallback = all.find(item => item.name === DEFAULT_NAME);

      return fallback ? [...recents, fallback] : recents;
    } finally {
      db.close();
    }
  };

  static save = async (blob: Blob, name: string): Promise<ImageStore.StoredImage> => {
    const db = await open_db();

    try {
      const all = await read_all(db);
      const existing = all.find(item => item.name === name && item.blob.size === blob.size);

      if (existing) {
        existing.added = Date.now();

        if (!existing.thumb) {
          existing.thumb = await ImageLoader.create_thumbnail(blob);
        }

        await run(db, 'readwrite', store => store.put(existing));
        await trim(db);

        return with_thumb(existing);
      }

      const record = { name, blob, thumb: await ImageLoader.create_thumbnail(blob), added: Date.now() };
      const id = await run<number>(db, 'readwrite', store => store.add(record));
      await trim(db);

      return with_thumb({ id, ...record });
    } finally {
      db.close();
    }
  };

  static load = async (id: number): Promise<ImageStore.StoredImage | null> => {
    const db = await open_db();

    try {
      const image = await run<ImageStore.StoredImage | undefined>(db, 'readonly', store => store.get(id));

      return image ? with_thumb(image) : null;
    } finally {
      db.close();
    }
  };

  // Backfills thumbnails for records written before previews existed (e.g. the seeded default), so
  // the recent list never falls back to decoding a full-size image.
  static ensure_thumbs = async (): Promise<void> => {
    const db = await open_db();

    try {
      const all = await read_all(db);

      for (const item of all) {
        const record = with_thumb(item);

        if (record.thumb !== null || record.blob.size === 0) {
          continue;
        }

        const thumb = await ImageLoader.create_thumbnail(record.blob);

        if (thumb === null) {
          continue;
        }

        record.thumb = thumb;

        await run(db, 'readwrite', store => store.put(record));
      }
    } finally {
      db.close();
    }
  };

  static remove = async (id: number): Promise<void> => {
    const db = await open_db();

    try {
      await run(db, 'readwrite', store => store.delete(id));
    } finally {
      db.close();
    }
  };
}

export namespace ImageStore {
  export type StoredImage = {
    /** Auto-increment primary key. */
    id: number;
    /** Original file name, used only for de-duplication. */
    name: string;
    /** Full-size source blob the puzzle is built from. */
    blob: Blob;
    /** Small square preview stored alongside `blob` so lists never decode the full image. */
    thumb: Blob | null;
    /** Timestamp (ms) used to order the recent list, newest first. */
    added: number;
  };
}

// Records written before thumbnails existed have no `thumb`; normalise them to null.
const with_thumb = (item: ImageStore.StoredImage): ImageStore.StoredImage => ({ ...item, thumb: item.thumb ?? null });

const open_db = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });

        store.createIndex('added', 'added');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('indexedDB open failed'));
  });

const run = <T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest,
): Promise<T> =>
  new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = fn(transaction.objectStore(STORE));

    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error ?? new Error('indexedDB request failed'));
  });

const read_all = (db: IDBDatabase): Promise<ImageStore.StoredImage[]> =>
  run<ImageStore.StoredImage[]>(db, 'readonly', store => store.getAll());

const trim = async (db: IDBDatabase): Promise<void> => {
  // The default image never counts toward the limit, so it is excluded before trimming.
  const all = (await read_all(db)).filter(item => item.name !== DEFAULT_NAME);

  if (all.length <= ImageStore.RECENT_LIMIT) {
    return;
  }

  const extra = all.sort((a, b) => b.added - a.added).slice(ImageStore.RECENT_LIMIT);

  for (const item of extra) {
    await run(db, 'readwrite', store => store.delete(item.id));
  }
};
