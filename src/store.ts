import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { openDatabaseAsync } from 'expo-sqlite';
import { Cycle, fromKey } from './dates';
import {
  emptyPhotos,
  MAX_ENTRY_PHOTOS,
  MAX_PHOTO_BASE64_LENGTH,
  type EntryPhoto,
} from './journal/entryPhotos';

export type Entry = { date: string; body: string };
export type EntryWithPhotos = Entry & { photos: EntryPhoto[] };
export type Review = {
  cycle: string;
  period: string;
  answers: string;
  done: number;
};

async function openDiary() {
  const db = await openDatabaseAsync('still-me.db');
  try {
    const cipher = await db.getFirstAsync<{ cipher_version: string }>(
      'PRAGMA cipher_version',
    );
    if (!cipher?.cipher_version)
      throw new Error('SQLCipher development build required');

    let key = await SecureStore.getItemAsync('diary-db-key');
    if (!key) {
      const bytes = await Crypto.getRandomBytesAsync(32);
      key = Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join('');
      await SecureStore.setItemAsync('diary-db-key', key, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      });
    }
    if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('Invalid database key');
    await db.execAsync(`PRAGMA key = "x'${key}'"; PRAGMA journal_mode = WAL;`);
    const { user_version } = (await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    ))!;
    if (user_version < 2) {
      await db.withTransactionAsync(async () => {
        if (user_version === 0) {
          await db.execAsync(`
            CREATE TABLE entries (id TEXT PRIMARY KEY, date TEXT NOT NULL UNIQUE, body TEXT NOT NULL, updated_at TEXT NOT NULL);
            CREATE TABLE reviews (cycle TEXT NOT NULL, period TEXT NOT NULL, answers TEXT NOT NULL, done INTEGER NOT NULL, PRIMARY KEY (cycle, period));
            CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
          `);
        }
        await db.execAsync(`
          ALTER TABLE entries ADD COLUMN photos_json TEXT NOT NULL DEFAULT '[]';
          ALTER TABLE entries ADD COLUMN photo_count INTEGER NOT NULL DEFAULT 0;
          PRAGMA user_version = 2;
        `);
      });
    }
    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}

let database: ReturnType<typeof openDiary> | undefined;
export function getDatabase() {
  database ??= openDiary().catch((error) => {
    database = undefined;
    throw error;
  });
  return database;
}

export async function saveEntry(
  date: string,
  body: string,
  {
    onlyIfMissing = false,
    photos,
  }: { onlyIfMissing?: boolean; photos?: EntryPhoto[] } = {},
) {
  if (
    photos &&
    (photos.length > MAX_ENTRY_PHOTOS ||
      photos.some((photo) => photo.base64.length > MAX_PHOTO_BASE64_LENGTH))
  ) {
    throw new Error('Entry photos exceed the storage limit');
  }
  const db = await getDatabase();
  const updatePhotos =
    photos === undefined
      ? ''
      : ', photos_json = excluded.photos_json, photo_count = excluded.photo_count';
  const conflict = onlyIfMissing
    ? 'DO NOTHING'
    : 'DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at' +
      updatePhotos;
  const result = await db.runAsync(
    `INSERT INTO entries (id, date, body, updated_at, photos_json, photo_count)
     VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(date) ${conflict}`,
    Crypto.randomUUID(),
    date,
    body.trim(),
    new Date().toISOString(),
    JSON.stringify(photos ?? emptyPhotos),
    photos?.length ?? 0,
  );
  return result.changes > 0;
}

export async function loadEntry(date: string): Promise<EntryWithPhotos | null> {
  const db = await getDatabase();
  const entry = await db.getFirstAsync<Entry & { photos_json: string }>(
    'SELECT date, body, photos_json FROM entries WHERE date = ?',
    date,
  );
  return entry
    ? {
        date: entry.date,
        body: entry.body,
        photos: JSON.parse(entry.photos_json),
      }
    : null;
}

export async function loadEntryPhotos(date: string): Promise<EntryPhoto[]> {
  const db = await getDatabase();
  const entry = await db.getFirstAsync<{ photos_json: string }>(
    'SELECT photos_json FROM entries WHERE date = ? AND photo_count > 0',
    date,
  );
  return entry ? JSON.parse(entry.photos_json) : emptyPhotos;
}

export async function deleteEntry(date: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM entries WHERE date = ?', date);
}

export async function setSetting(key: string, value: string) {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings VALUES (?, ?)',
    key,
    value,
  );
}

export async function loadEntriesInRange(start: string, end: string) {
  const db = await getDatabase();
  return db.getAllAsync<Entry>(
    'SELECT date, body FROM entries WHERE date >= ? AND date < ? ORDER BY date DESC',
    start,
    end,
  );
}

export async function loadPastEntries(
  date: string,
  cycle: Cycle,
  limit: number,
) {
  const rule = {
    week: ["strftime('%w', date)", String(fromKey(date).getDay())],
    month: ['substr(date, 9, 2)', date.slice(8)],
    year: ['substr(date, 6, 5)', date.slice(5)],
  }[cycle];
  const db = await getDatabase();
  return db.getAllAsync<Entry>(
    `SELECT date, body FROM entries WHERE date < ? AND ${rule[0]} = ? ORDER BY date DESC LIMIT ?`,
    date,
    rule[1],
    limit,
  );
}
