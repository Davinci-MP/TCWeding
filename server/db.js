import { DatabaseSync } from 'node:sqlite';
import { paths } from './config.js';

export const db = new DatabaseSync(paths.db);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'sale', 'marketing')),
  pass_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS taxonomies (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('style', 'location', 'category')),
  label TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (kind, slug)
);
CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  cover_photo_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  style_id INTEGER REFERENCES taxonomies(id) ON DELETE SET NULL,
  location_id INTEGER REFERENCES taxonomies(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES taxonomies(id) ON DELETE SET NULL,
  video_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  deleted_at TEXT,
  published_at TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  original_file TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  bytes INTEGER NOT NULL,
  watermarked INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS photos_album ON photos(album_id, sort_order);
CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  album_id INTEGER,
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

if (!db.prepare('PRAGMA table_info(photos)').all().some((column) => column.name === 'drive_file_id')) {
  db.exec('ALTER TABLE photos ADD COLUMN drive_file_id TEXT');
}
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS photos_drive_source ON photos(album_id, drive_file_id) WHERE drive_file_id IS NOT NULL');

// Lựa chọn phân loại ban đầu; người quản trị thêm lựa chọn mới trong /admin/
const SEED_TAX = {
  style: ['Studio', 'Ngoại cảnh', 'Phóng sự cưới', 'Lookbook'],
  category: ['Ảnh cưới', 'Pre-wedding', 'Ngày cưới', 'Áo dài'],
  location: [],
};
const hasTax = db.prepare('SELECT COUNT(*) AS n FROM taxonomies').get().n;
if (!hasTax) {
  const ins = db.prepare('INSERT INTO taxonomies (kind, label, slug, sort_order) VALUES (?, ?, ?, ?)');
  for (const [kind, labels] of Object.entries(SEED_TAX)) labels.forEach((l, i) => ins.run(kind, l, slugify(l), i));
}

export function slugify(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function tx(fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
}

export function logActivity(userId, action, albumId = null, detail = '') {
  db.prepare('INSERT INTO activity (user_id, action, album_id, detail) VALUES (?, ?, ?, ?)').run(userId, action, albumId, detail);
}
