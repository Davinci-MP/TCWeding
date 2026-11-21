import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { config, paths } from './config.js';
import { db } from './db.js';
import { loadUser, requireAuth, sameOrigin, createSession, destroySession, verifyPassword, seedUsers, ROLES, can, loginLimited, loginFailed, loginOk } from './auth.js';
import { adminAlbums, publicSummary, publicDetail } from './albums.js';

seedUsers();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.use((_req, res, next) => { res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN' }); next(); });
app.use(express.json({ limit: '1mb' }));
app.use(loadUser);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---- Đăng nhập ----
const me = (u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, roleLabel: ROLES[u.role].label, perms: ROLES[u.role].perms });
app.post('/api/auth/login', sameOrigin, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase(); const pw = String(req.body?.password || '');
  const key = `${req.ip}|${email}`;
  if (loginLimited(key)) return res.status(429).json({ error: 'Đăng nhập sai quá nhiều lần. Thử lại sau 15 phút.' });
  const u = db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(email);
  if (!u || !verifyPassword(pw, u.pass_hash)) { loginFailed(key); return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' }); }
  loginOk(key);
  createSession(res, u.id);
  res.json(me(u));
});
app.post('/api/auth/logout', sameOrigin, (req, res) => { destroySession(req, res); res.json({ ok: true }); });
app.get('/api/auth/me', requireAuth, (req, res) => { res.set('Cache-Control', 'no-store'); res.json(me(req.user)); });

// ---- Quản trị ----
app.use('/api/admin', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, sameOrigin, adminAlbums);

// ---- Công khai: chỉ album đã xuất bản, không có bản gốc ----
const PUB = "status = 'published' AND deleted_at IS NULL";
app.get('/api/public/albums', (_req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json(db.prepare(`SELECT * FROM albums WHERE ${PUB} ORDER BY sort_order, published_at DESC`).all().map(publicSummary));
});
app.get('/api/public/albums/:slug', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  const a = db.prepare(`SELECT * FROM albums WHERE slug = ? AND ${PUB}`).get(String(req.params.slug));
  if (!a) return res.status(404).json({ error: 'Không tìm thấy album.' });
  res.json(publicDetail(a));
});

// ---- Ảnh hiển thị: chỉ phục vụ khi album đã xuất bản, hoặc người xem có quyền quản trị album ----
app.get('/media/:size/:file', (req, res) => {
  const { size, file } = req.params;
  const m = /^([0-9a-f-]{36})\.webp$/.exec(file);
  if (!['thumb', 'large'].includes(size) || !m) return res.sendStatus(404);
  const row = db.prepare('SELECT a.status, a.deleted_at FROM photos p JOIN albums a ON a.id = p.album_id WHERE p.id = ?').get(m[1]);
  if (!row) return res.sendStatus(404);
  const isPublic = row.status === 'published' && !row.deleted_at;
  if (!isPublic && !can(req.user, 'albums')) return res.sendStatus(404);
  res.set('Cache-Control', isPublic ? 'public, max-age=300' : 'private, no-store');
  // tên file đã khớp regex UUID ở trên; dotfiles:'allow' để DATA_DIR nằm trong thư mục có dấu chấm (vd .tmp) vẫn chạy
  res.sendFile(join(paths[size], file), { dotfiles: 'allow' }, (err) => { if (err && !res.headersSent) res.sendStatus(404); });
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Không tìm thấy.' }));

// ---- Trang tĩnh đã build (npm run build) ----
if (existsSync(config.distDir)) {
  app.use('/admin', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use(express.static(config.distDir, { extensions: ['html'], index: 'index.html' }));
}

app.use((err, _req, res, _next) => { console.error(err); if (!res.headersSent) res.status(err.status || 500).json({ error: err.status === 400 ? 'Yêu cầu không hợp lệ.' : 'Lỗi máy chủ.' }); });

app.listen(config.port, () => {
  console.log(`TCWedding server: http://localhost:${config.port}/  ·  quản trị: http://localhost:${config.port}/admin/`);
  if (!existsSync(config.distDir)) console.log('(chưa có dist/ — chạy "npm run build" hoặc dùng "npm run dev")');
});
