import { Router } from 'express';
import { db, tx, logActivity } from './db.js';
import { requirePerm } from './auth.js';

// Thông tin website: liên hệ, mạng xã hội, nội dung trang chủ. Lưu dạng key-value trong SQLite.
db.exec(`CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

// Nội dung trang chủ mặc định — trùng với chữ có sẵn trong index.html (hiện khi trường để trống)
export const HOME_DEFAULTS = {
  heroTitle: 'Ảnh cưới giữ nguyên cách hai bạn nhìn nhau',
  heroLead: 'Chụp ảnh cưới studio và ngoại cảnh, thiệp mời online và album in cho các cặp đôi.',
  introTitle: 'Một ekip nhỏ, theo hai bạn từ buổi tư vấn đến cuốn album',
  introBody: 'TCWedding chụp ít buổi mỗi tháng để dành đủ thời gian cho từng cặp đôi: chọn concept, chọn trang phục, chụp và chỉnh màu.',
};

const SOCIAL_HOSTS = {
  zalo: ['zalo.me', 'chat.zalo.me', 'oa.zalo.me'],
  facebook: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com', 'fb.com', 'fb.me'],
  tiktok: ['tiktok.com', 'www.tiktok.com', 'vt.tiktok.com', 'm.tiktok.com'],
  instagram: ['instagram.com', 'www.instagram.com'],
};

// group: nhóm hiển thị; max: độ dài tối đa; kind: cách kiểm tra
export const FIELDS = {
  phone: { group: 'contact', max: 30, kind: 'phone' },
  email: { group: 'contact', max: 120, kind: 'email' },
  address: { group: 'contact', max: 200, kind: 'text' },
  hours: { group: 'contact', max: 200, kind: 'text' },
  area: { group: 'contact', max: 120, kind: 'text' },
  zalo: { group: 'social', max: 300, kind: 'url' },
  facebook: { group: 'social', max: 300, kind: 'url' },
  tiktok: { group: 'social', max: 300, kind: 'url' },
  instagram: { group: 'social', max: 300, kind: 'url' },
  heroTitle: { group: 'home', max: 120, kind: 'text' },
  heroLead: { group: 'home', max: 300, kind: 'text' },
  introTitle: { group: 'home', max: 150, kind: 'text' },
  introBody: { group: 'home', max: 2000, kind: 'multiline' },
};
const NAMES = { zalo: 'Zalo', facebook: 'Facebook', tiktok: 'TikTok', instagram: 'Instagram' };

// Trả { value } đã chuẩn hoá hoặc { error } cho một trường
function check(key, raw) {
  const f = FIELDS[key];
  if (raw !== undefined && raw !== null && typeof raw !== 'string') return { error: 'Giá trị không hợp lệ.' };
  let v = String(raw ?? '').replace(/\r\n?/g, '\n');
  v = f.kind === 'multiline' ? v.trim().replace(/\n{3,}/g, '\n\n') : v.replace(/\s+/g, ' ').trim();
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v)) return { error: 'Có ký tự không hợp lệ.' };
  if (v.length > f.max) return { error: `Tối đa ${f.max} ký tự.` };
  if (!v) return { value: '' };
  if (f.kind === 'phone') {
    if (!/^\+?[0-9 .()-]+$/.test(v)) return { error: 'Chỉ dùng số, khoảng trắng, dấu chấm, gạch ngang hoặc dấu + ở đầu.' };
    const digits = v.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) return { error: 'Số điện thoại cần từ 8 đến 15 chữ số.' };
  }
  if (f.kind === 'email' && !/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(v)) return { error: 'Email chưa đúng định dạng, ví dụ lienhe@tcwedding.vn.' };
  if (f.kind === 'url') {
    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
    let u;
    try { u = new URL(withScheme); } catch { return { error: `Liên kết ${NAMES[key]} không hợp lệ.` }; }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return { error: 'Liên kết phải bắt đầu bằng https://.' };
    if (u.username || u.password) return { error: `Liên kết ${NAMES[key]} không hợp lệ.` };
    if (!SOCIAL_HOSTS[key].includes(u.hostname.toLowerCase())) return { error: `Cần là liên kết ${NAMES[key]} (${SOCIAL_HOSTS[key][0]}).` };
    u.protocol = 'https:';
    v = u.toString();
  }
  return { value: v };
}

const rows = () => Object.fromEntries(db.prepare('SELECT key, value FROM site_settings').all().map((r) => [r.key, r.value]));
export function readSettings() {
  const stored = rows();
  return Object.fromEntries(Object.keys(FIELDS).map((k) => [k, stored[k] ?? '']));
}

// ---- API quản trị: chỉ vai trò có quyền 'site' (Admin) ----
export const adminSite = Router();
adminSite.use('/site-settings', requirePerm('site'));

function adminView() {
  const meta = db.prepare(`SELECT s.updated_at, u.name FROM site_settings s LEFT JOIN users u ON u.id = s.updated_by ORDER BY s.updated_at DESC LIMIT 1`).get();
  return { values: readSettings(), defaults: HOME_DEFAULTS, updatedAt: meta?.updated_at || null, updatedBy: meta?.name || null };
}
adminSite.get('/site-settings', (_req, res) => res.json(adminView()));

adminSite.put('/site-settings', (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : null;
  if (!body) return res.status(400).json({ error: 'Dữ liệu không hợp lệ.' });
  const current = readSettings();
  const next = {}; const fields = {};
  for (const key of Object.keys(FIELDS)) {
    if (!(key in body)) { next[key] = current[key]; continue; } // trường không gửi lên: giữ nguyên
    const r = check(key, body[key]);
    if (r.error) fields[key] = r.error; else next[key] = r.value;
  }
  // có lỗi: không lưu trường nào, dữ liệu cũ giữ nguyên
  if (Object.keys(fields).length) return res.status(400).json({ error: 'Một số trường chưa hợp lệ. Thông tin chưa được lưu.', fields });
  const changed = Object.keys(FIELDS).filter((k) => next[k] !== current[k]);
  if (changed.length) {
    tx(() => {
      const up = db.prepare(`INSERT INTO site_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at`);
      for (const k of changed) up.run(k, next[k], req.user.id);
    });
    logActivity(req.user.id, 'site.update', null, `${changed.length} trường`);
  }
  res.json({ ...adminView(), changed });
});

// ---- API công khai: chỉ trường được phép hiển thị; liên hệ/mạng xã hội trống thì bỏ ----
export function publicSite() {
  const s = readSettings();
  const pick = (group) => Object.fromEntries(Object.keys(FIELDS).filter((k) => FIELDS[k].group === group && s[k]).map((k) => [k, s[k]]));
  const contact = pick('contact');
  if (contact.phone) contact.phoneHref = `tel:${contact.phone.trim().startsWith('+') ? '+' : ''}${contact.phone.replace(/\D/g, '')}`;
  if (contact.email) contact.emailHref = `mailto:${contact.email}`;
  const home = Object.fromEntries(Object.keys(HOME_DEFAULTS).map((k) => [k, s[k] || HOME_DEFAULTS[k]]));
  return { contact, social: pick('social'), home };
}
