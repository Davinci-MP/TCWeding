import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { db } from './db.js';
import { config } from './config.js';

// Vai trò và quyền. Kiểm tra quyền luôn ở API, giao diện chỉ ẩn/hiện cho tiện.
export const ROLES = {
  admin: { label: 'Admin', perms: ['albums', 'users', 'site'] }, // 'site': Thông tin website
  marketing: { label: 'Marketing/Design', perms: ['albums'] },
  sale: { label: 'Sale/Tư vấn', perms: [] }, // các phân hệ khách hàng/hợp đồng sẽ cấp quyền ở mốc sau
};
export const can = (user, perm) => !!user && !!ROLES[user.role]?.perms.includes(perm);

export function hashPassword(pw) {
  const salt = randomBytes(16);
  const key = scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}
export function verifyPassword(pw, stored) {
  const [alg, s, k] = String(stored).split('$');
  if (alg !== 'scrypt' || !s || !k) return false;
  const key = Buffer.from(k, 'base64');
  const test = scryptSync(String(pw), Buffer.from(s, 'base64'), key.length, { N: 16384, r: 8, p: 1 });
  return timingSafeEqual(key, test);
}

const COOKIE = 'tc_session';
const sha = (t) => createHash('sha256').update(t).digest('hex');

export function createSession(res, userId) {
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + config.sessionDays * 864e5);
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha(token), userId, expires.toISOString());
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: config.isProd, expires, path: '/' });
}
export function destroySession(req, res) {
  const t = readCookie(req);
  if (t) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(t));
  res.clearCookie(COOKIE, { path: '/' });
}
function readCookie(req) {
  const m = (req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

// Gắn req.user nếu phiên hợp lệ
export function loadUser(req, _res, next) {
  const t = readCookie(req);
  if (t) {
    const row = db.prepare(`SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`).get(sha(t), new Date().toISOString());
    if (row) req.user = row;
  }
  next();
}

export const requireAuth = (req, res, next) => (req.user ? next() : res.status(401).json({ error: 'Bạn cần đăng nhập.' }));
export const requirePerm = (perm) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Bạn cần đăng nhập.' });
  if (!can(req.user, perm)) return res.status(403).json({ error: 'Tài khoản của bạn không có quyền thực hiện thao tác này.' });
  next();
};

// Chống CSRF cho các lệnh ghi: Origin phải trùng host hoặc nằm trong ALLOWED_ORIGINS
export function sameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin) return next(); // công cụ dòng lệnh / cùng trang không gửi Origin; cookie SameSite=Lax vẫn bảo vệ
  try {
    const o = new URL(origin);
    if (o.host === req.headers.host || config.allowedOrigins.includes(o.origin)) return next();
  } catch {}
  res.status(403).json({ error: 'Nguồn yêu cầu không hợp lệ.' });
}

// Giới hạn đăng nhập sai trong 15 phút (mặc định 10 lần cho mỗi khoá)
const fails = new Map();
export function loginLimited(key, max = 10) {
  const now = Date.now(); const f = fails.get(key);
  if (f && now - f.t > 15 * 60e3) { fails.delete(key); return false; }
  return !!f && f.n >= max;
}
export function loginFailed(key) { const f = fails.get(key) || { n: 0, t: Date.now() }; f.n++; fails.set(key, f); }
export function loginOk(key) { fails.delete(key); }

// Tạo tài khoản từ biến môi trường khi chưa tồn tại
export function seedUsers() {
  const env = process.env;
  const seeds = [
    [env.ADMIN_EMAIL, env.ADMIN_PASSWORD, env.ADMIN_NAME || 'Quản trị TCWedding', 'admin'],
    [env.MARKETING_EMAIL, env.MARKETING_PASSWORD, env.MARKETING_NAME || 'Marketing', 'marketing'],
    [env.SALE_EMAIL, env.SALE_PASSWORD, env.SALE_NAME || 'Tư vấn', 'sale'],
  ];
  const find = db.prepare('SELECT id FROM users WHERE email = ?');
  const ins = db.prepare('INSERT INTO users (email, name, role, pass_hash) VALUES (?, ?, ?, ?)');
  for (const [email, pw, name, role] of seeds) {
    if (email && pw && !find.get(email)) { ins.run(email, name, role, hashPassword(pw)); console.log(`[seed] tạo tài khoản ${role}: ${email}`); }
  }
  const n = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (!n) console.warn('[cảnh báo] Chưa có tài khoản nào. Đặt ADMIN_EMAIL và ADMIN_PASSWORD trong .env rồi khởi động lại.');
}
