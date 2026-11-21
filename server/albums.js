import { Router } from 'express';
import multer from 'multer';
import { db, slugify, tx, logActivity } from './db.js';
import { config } from './config.js';
import { requirePerm } from './auth.js';
import { downloadDrivePhoto, driveEnabled } from './drive.js';
import { parseVideo } from './video.js';
import { processUpload, removeFiles, mediaUrl, MediaError, watermarkState } from './media.js';

export const adminAlbums = Router();
adminAlbums.use(requirePerm('albums')); // Sale/Tư vấn không có quyền 'albums' -> 403 cho mọi route dưới đây

const KINDS = ['style', 'location', 'category'];
const taxLabel = db.prepare('SELECT label FROM taxonomies WHERE id = ?');
const getAlbumRow = db.prepare('SELECT * FROM albums WHERE id = ?');
const photosOf = db.prepare('SELECT * FROM photos WHERE album_id = ? ORDER BY sort_order, created_at');

export function photoOut(p) {
  return { id: p.id, name: p.original_name, width: p.width, height: p.height, bytes: p.bytes, watermarked: !!p.watermarked, thumb: mediaUrl('thumb', p.id), large: mediaUrl('large', p.id) };
}
function albumOut(a, withPhotos = false) {
  const photos = photosOf.all(a.id);
  const cover = photos.find((p) => p.id === a.cover_photo_id) || photos[0];
  const out = {
    id: a.id, title: a.title, slug: a.slug, description: a.description, sortOrder: a.sort_order,
    styleId: a.style_id, locationId: a.location_id, categoryId: a.category_id,
    style: a.style_id ? taxLabel.get(a.style_id)?.label || '' : '', location: a.location_id ? taxLabel.get(a.location_id)?.label || '' : '', category: a.category_id ? taxLabel.get(a.category_id)?.label || '' : '',
    videoUrl: a.video_url, status: a.status, deletedAt: a.deleted_at, publishedAt: a.published_at, createdAt: a.created_at, updatedAt: a.updated_at,
    coverPhotoId: cover?.id || null, cover: cover ? photoOut(cover) : null, photoCount: photos.length,
  };
  if (withPhotos) out.photos = photos.map(photoOut);
  return out;
}
const bad = (res, error, status = 400, field) => res.status(status).json({ error, field });
function loadAlbum(req, res) {
  const a = getAlbumRow.get(Number(req.params.id));
  if (!a) { bad(res, 'Không tìm thấy album.', 404); return null; }
  return a;
}

// ---- Dashboard ----
adminAlbums.get('/dashboard', (_req, res) => {
  const c = db.prepare(`SELECT
    SUM(deleted_at IS NULL AND status = 'draft') AS drafts,
    SUM(deleted_at IS NULL AND status = 'published') AS published,
    SUM(deleted_at IS NOT NULL) AS trash FROM albums`).get();
  const photos = db.prepare('SELECT COUNT(*) AS n FROM photos p JOIN albums a ON a.id = p.album_id WHERE a.deleted_at IS NULL').get().n;
  const recent = db.prepare(`SELECT ac.action, ac.detail, ac.created_at, ac.album_id, u.name AS user, a.title AS album
    FROM activity ac LEFT JOIN users u ON u.id = ac.user_id LEFT JOIN albums a ON a.id = ac.album_id
    ORDER BY ac.id DESC LIMIT 12`).all();
  res.json({ drafts: c.drafts || 0, published: c.published || 0, trash: c.trash || 0, photos, recent, watermark: watermarkState() });
});

// ---- Phân loại ----
adminAlbums.get('/taxonomies', (_req, res) => {
  const rows = db.prepare('SELECT id, kind, label FROM taxonomies ORDER BY kind, sort_order, label').all();
  res.json(Object.fromEntries(KINDS.map((k) => [k, rows.filter((r) => r.kind === k)])));
});
adminAlbums.post('/taxonomies', (req, res) => {
  const kind = String(req.body?.kind || ''); const label = String(req.body?.label || '').trim().slice(0, 60);
  if (!KINDS.includes(kind)) return bad(res, 'Loại phân loại không hợp lệ.');
  if (!label) return bad(res, 'Nhập tên lựa chọn.', 400, 'label');
  const slug = slugify(label) || 'muc';
  const ex = db.prepare('SELECT id, kind, label FROM taxonomies WHERE kind = ? AND slug = ?').get(kind, slug);
  if (ex) return res.json(ex);
  const max = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM taxonomies WHERE kind = ?').get(kind).m;
  const r = db.prepare('INSERT INTO taxonomies (kind, label, slug, sort_order) VALUES (?, ?, ?, ?)').run(kind, label, slug, max + 1);
  logActivity(req.user.id, 'taxonomy.create', null, `${kind}: ${label}`);
  res.status(201).json({ id: Number(r.lastInsertRowid), kind, label });
});

// ---- Album ----
adminAlbums.get('/albums', (req, res) => {
  const s = String(req.query.status || 'all');
  const where = { draft: "deleted_at IS NULL AND status = 'draft'", published: "deleted_at IS NULL AND status = 'published'", trash: 'deleted_at IS NOT NULL' }[s] || 'deleted_at IS NULL';
  const rows = db.prepare(`SELECT * FROM albums WHERE ${where} ORDER BY sort_order, updated_at DESC`).all();
  res.json(rows.map((a) => albumOut(a)));
});

function validate(body, currentId) {
  const title = String(body.title ?? '').trim();
  if (!title) return { error: 'Nhập tên album.', field: 'title' };
  if (title.length > 150) return { error: 'Tên album tối đa 150 ký tự.', field: 'title' };
  const slug = slugify(body.slug || title);
  if (!slug) return { error: 'Slug không hợp lệ.', field: 'slug' };
  const dupe = db.prepare('SELECT id FROM albums WHERE slug = ? AND id != ?').get(slug, currentId || 0);
  if (dupe) return { error: `Slug "${slug}" đã được dùng cho album khác.`, field: 'slug', status: 409 };
  const description = String(body.description ?? '').slice(0, 5000);
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Math.trunc(Number(body.sortOrder)) : 0;
  const tax = {};
  for (const k of KINDS) {
    const v = body[`${k}Id`];
    if (v === null || v === '' || v === undefined) { tax[k] = null; continue; }
    const row = db.prepare('SELECT id FROM taxonomies WHERE id = ? AND kind = ?').get(Number(v), k);
    if (!row) return { error: 'Phân loại không hợp lệ.', field: `${k}Id` };
    tax[k] = row.id;
  }
  const video = parseVideo(body.videoUrl);
  if (!video.ok) return { error: 'Link video chỉ nhận YouTube hoặc Vimeo.', field: 'videoUrl' };
  return { value: { title, slug, description, sortOrder, tax, videoUrl: String(body.videoUrl || '').trim() } };
}

adminAlbums.post('/albums', (req, res) => {
  const v = validate(req.body || {});
  if (v.error) return bad(res, v.error, v.status || 400, v.field);
  const { title, slug, description, sortOrder, tax, videoUrl } = v.value;
  const r = db.prepare(`INSERT INTO albums (title, slug, description, sort_order, style_id, location_id, category_id, video_url, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(title, slug, description, sortOrder, tax.style, tax.location, tax.category, videoUrl, req.user.id);
  const id = Number(r.lastInsertRowid);
  logActivity(req.user.id, 'album.create', id);
  res.status(201).json(albumOut(getAlbumRow.get(id), true));
});

adminAlbums.get('/albums/:id', (req, res) => { const a = loadAlbum(req, res); if (a) res.json(albumOut(a, true)); });

adminAlbums.put('/albums/:id', (req, res) => {
  const a = loadAlbum(req, res); if (!a) return;
  const v = validate(req.body || {}, a.id);
  if (v.error) return bad(res, v.error, v.status || 400, v.field);
  const { title, slug, description, sortOrder, tax, videoUrl } = v.value;
  db.prepare(`UPDATE albums SET title = ?, slug = ?, description = ?, sort_order = ?, style_id = ?, location_id = ?, category_id = ?, video_url = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(title, slug, description, sortOrder, tax.style, tax.location, tax.category, videoUrl, a.id);
  logActivity(req.user.id, 'album.update', a.id);
  res.json(albumOut(getAlbumRow.get(a.id), true));
});

adminAlbums.post('/albums/:id/publish', (req, res) => {
  const a = loadAlbum(req, res); if (!a) return;
  if (a.deleted_at) return bad(res, 'Album đang ở thùng rác. Khôi phục trước khi xuất bản.', 409);
  const photos = photosOf.all(a.id);
  if (!photos.length) return bad(res, 'Cần ít nhất một ảnh trước khi xuất bản.', 409);
  const cover = photos.some((p) => p.id === a.cover_photo_id) ? a.cover_photo_id : photos[0].id;
  db.prepare(`UPDATE albums SET status = 'published', cover_photo_id = ?, published_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(cover, a.id);
  logActivity(req.user.id, 'album.publish', a.id);
  res.json(albumOut(getAlbumRow.get(a.id), true));
});
adminAlbums.post('/albums/:id/unpublish', (req, res) => {
  const a = loadAlbum(req, res); if (!a) return;
  db.prepare(`UPDATE albums SET status = 'draft', updated_at = datetime('now') WHERE id = ?`).run(a.id);
  logActivity(req.user.id, 'album.unpublish', a.id);
  res.json(albumOut(getAlbumRow.get(a.id), true));
});
adminAlbums.post('/albums/:id/trash', (req, res) => {
  const a = loadAlbum(req, res); if (!a) return;
  db.prepare(`UPDATE albums SET status = 'draft', deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(a.id);
  logActivity(req.user.id, 'album.trash', a.id);
  res.json(albumOut(getAlbumRow.get(a.id)));
});
adminAlbums.post('/albums/:id/restore', (req, res) => {
  const a = loadAlbum(req, res); if (!a) return;
  db.prepare(`UPDATE albums SET deleted_at = NULL, updated_at = datetime('now') WHERE id = ?`).run(a.id);
  logActivity(req.user.id, 'album.restore', a.id);
  res.json(albumOut(getAlbumRow.get(a.id)));
});

// Bản xem trước: cùng định dạng với API công khai nhưng thấy cả nháp (chỉ người có quyền)
adminAlbums.get('/albums/:id/preview', (req, res) => {
  const a = loadAlbum(req, res); if (!a) return;
  res.json(publicDetail(a));
});

// ---- Ảnh ----
const findDrivePhoto = db.prepare('SELECT * FROM photos WHERE album_id = ? AND drive_file_id = ?');
const nextPhotoOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM photos WHERE album_id = ?');
const insertPhoto = db.prepare(`
  INSERT INTO photos (id, album_id, original_name, original_file, width, height, bytes, watermarked, sort_order, drive_file_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(album_id, drive_file_id) WHERE drive_file_id IS NOT NULL DO NOTHING
`);
const photoById = db.prepare('SELECT * FROM photos WHERE id = ?');
const updateCover = db.prepare(`UPDATE albums SET cover_photo_id = COALESCE(cover_photo_id, ?), updated_at = datetime('now') WHERE id = ?`);

function checkPhotoAlbum(album, draftOnly) {
  if (!album) throw new MediaError('Không tìm thấy album.', 404);
  if (album.deleted_at) throw new MediaError('Album đang ở thùng rác.', 409);
  if (draftOnly && album.status !== 'draft') throw new MediaError('Chỉ nhập ảnh Drive vào album nháp.', 409);
}

async function savePhoto(albumId, photo, userId, driveId = null) {
  const cleanup = () => removeFiles({ id: photo.id, original_file: photo.originalFile, drive_file_id: driveId });
  let row;
  try {
    row = tx(() => {
      checkPhotoAlbum(getAlbumRow.get(albumId), !!driveId);
      const result = insertPhoto.run(photo.id, albumId, photo.originalName, photo.originalFile, photo.width,
        photo.height, photo.bytes, photo.watermarked, nextPhotoOrder.get(albumId).n, driveId);
      if (!result.changes) return findDrivePhoto.get(albumId, driveId);
      updateCover.run(photo.id, albumId);
      logActivity(userId, driveId ? 'photo.drive-import' : 'photo.upload', albumId, photo.originalName);
      return photoById.get(photo.id);
    });
  } catch (err) {
    await cleanup();
    throw err;
  }
  if (row.id !== photo.id) await cleanup();
  return row;
}

adminAlbums.get('/drive/config', (_req, res) => {
  res.json({ enabled: driveEnabled(), ...(driveEnabled() ? config.drive : {}) });
});

adminAlbums.post('/albums/:id/photos/drive', async (req, res) => {
  if (!driveEnabled()) return bad(res, 'Chưa cấu hình Google Drive.', 503);
  const albumId = Number(req.params.id);
  const { fileId, name } = req.body || {};
  try {
    checkPhotoAlbum(getAlbumRow.get(albumId), true);
    const existing = typeof fileId === 'string' && findDrivePhoto.get(albumId, fileId);
    if (existing) return res.json(photoOut(existing));
    const buffer = await downloadDrivePhoto(req.body || {});
    const photo = await processUpload(buffer, name, { fromDrive: true });
    const row = await savePhoto(albumId, photo, req.user.id, fileId);
    res.status(row.id === photo.id ? 201 : 200).json(photoOut(row));
  } catch (err) {
    if (err instanceof MediaError) return bad(res, err.message, err.status);
    console.error(err);
    bad(res, 'Lỗi máy chủ khi nhập ảnh từ Google Drive.', 500);
  }
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 } });
adminAlbums.post('/albums/:id/photos', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return bad(res, `Ảnh vượt quá ${config.maxUploadMb} MB.`, 413);
      return bad(res, 'Tải lên không hợp lệ.', 400);
    }
    const a = getAlbumRow.get(Number(req.params.id));
    if (!a) return bad(res, 'Không tìm thấy album.', 404);
    if (a.deleted_at) return bad(res, 'Album đang ở thùng rác.', 409);
    if (!req.file) return bad(res, 'Chưa chọn tệp.', 400);
    try {
      const p = await processUpload(req.file.buffer, Buffer.from(req.file.originalname, 'latin1').toString('utf8'));
      const row = await savePhoto(a.id, p, req.user.id);
      res.status(201).json(photoOut(row));
    } catch (e) {
      if (e instanceof MediaError) return bad(res, e.message, e.status);
      console.error(e); bad(res, 'Lỗi máy chủ khi xử lý ảnh.', 500);
    }
  });
});

adminAlbums.put('/albums/:id/photos/order', (req, res) => {
  const a = loadAlbum(req, res); if (!a) return;
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : null;
  const current = photosOf.all(a.id).map((p) => p.id);
  if (!ids || ids.length !== current.length || new Set(ids).size !== ids.length || !ids.every((i) => current.includes(i))) return bad(res, 'Danh sách thứ tự ảnh không khớp với album.');
  tx(() => { const up = db.prepare('UPDATE photos SET sort_order = ? WHERE id = ? AND album_id = ?'); ids.forEach((id, i) => up.run(i, id, a.id)); });
  db.prepare(`UPDATE albums SET updated_at = datetime('now') WHERE id = ?`).run(a.id);
  logActivity(req.user.id, 'photo.reorder', a.id);
  res.json(albumOut(getAlbumRow.get(a.id), true));
});

adminAlbums.put('/albums/:id/cover', (req, res) => {
  const a = loadAlbum(req, res); if (!a) return;
  const p = db.prepare('SELECT id FROM photos WHERE id = ? AND album_id = ?').get(String(req.body?.photoId || ''), a.id);
  if (!p) return bad(res, 'Ảnh không thuộc album này.');
  db.prepare(`UPDATE albums SET cover_photo_id = ?, updated_at = datetime('now') WHERE id = ?`).run(p.id, a.id);
  logActivity(req.user.id, 'album.cover', a.id);
  res.json(albumOut(getAlbumRow.get(a.id), true));
});

adminAlbums.delete('/photos/:pid', async (req, res) => {
  const p = db.prepare('SELECT * FROM photos WHERE id = ?').get(String(req.params.pid));
  if (!p) return bad(res, 'Không tìm thấy ảnh.', 404);
  db.prepare('DELETE FROM photos WHERE id = ?').run(p.id);
  const a = getAlbumRow.get(p.album_id);
  if (a.cover_photo_id === p.id) {
    const next = photosOf.all(a.id)[0];
    db.prepare('UPDATE albums SET cover_photo_id = ? WHERE id = ?').run(next?.id || null, a.id);
  }
  db.prepare(`UPDATE albums SET updated_at = datetime('now') WHERE id = ?`).run(a.id);
  await removeFiles(p);
  logActivity(req.user.id, 'photo.delete', a.id, p.original_name);
  res.json(albumOut(getAlbumRow.get(a.id), true));
});

// ---- Định dạng công khai (dùng chung cho API công khai và xem trước) ----
export function publicSummary(a) {
  const o = albumOut(a);
  return { slug: o.slug, title: o.title, style: o.style, location: o.location, category: o.category, photoCount: o.photoCount, cover: o.cover && { thumb: o.cover.thumb, large: o.cover.large, width: o.cover.width, height: o.cover.height } };
}
export function publicDetail(a) {
  const v = parseVideo(a.video_url);
  return {
    ...publicSummary(a), description: a.description, video: v.ok && v.embed ? { provider: v.provider, embed: v.embed } : null,
    photos: photosOf.all(a.id).map((p) => ({ thumb: mediaUrl('thumb', p.id), large: mediaUrl('large', p.id), width: p.width, height: p.height })),
  };
}
