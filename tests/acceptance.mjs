// Kiểm thử nghiệm thu Mốc 1 — chạy: npm run test:acceptance
// Tự khởi động server riêng (cổng 8799, dữ liệu trong .tmp/acceptance) để không đụng dữ liệu thật trong data/.
import { spawn } from 'node:child_process';
import { rmSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(import.meta.dirname, '..');
const DATA = join(ROOT, '.tmp', 'acceptance');
const PORT = 8799;
const BASE = `http://localhost:${PORT}`;
const env = process.env;
if (!env.ADMIN_PASSWORD || !env.SALE_PASSWORD || !env.MARKETING_PASSWORD) { console.error('Cần ADMIN_*, MARKETING_*, SALE_* trong .env (chạy qua npm run test:acceptance).'); process.exit(1); }

const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? `  — ${info}` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let server;
async function startServer() {
  server = spawn(process.execPath, ['server/index.js'], { cwd: ROOT, env: { ...env, PORT: String(PORT), DATA_DIR: DATA, MAX_UPLOAD_MB: '5', ALLOWED_ORIGINS: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  for (let i = 0; i < 50; i++) { try { if ((await fetch(`${BASE}/api/health`)).ok) return; } catch {} await sleep(200); }
  throw new Error('Server không khởi động được');
}
const stopServer = () => new Promise((r) => { server.once('exit', r); server.kill(); });

class Client {
  constructor() { this.cookie = ''; }
  async req(method, path, body, extra = {}) {
    const headers = { ...(this.cookie ? { cookie: this.cookie } : {}), ...extra.headers };
    let payload;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) { headers['content-type'] = 'application/json'; payload = JSON.stringify(body); }
    const r = await fetch(BASE + path, { method, headers, body: payload, redirect: 'manual' });
    const sc = r.headers.get('set-cookie'); if (sc) this.cookie = sc.split(';')[0];
    const ct = r.headers.get('content-type') || '';
    const data = ct.includes('json') ? await r.json() : await r.arrayBuffer();
    return { status: r.status, data, headers: r.headers };
  }
  login(email, password) { return this.req('POST', '/api/auth/login', { email, password }); }
  upload(albumId, buf, name, type) { const fd = new FormData(); fd.append('file', new Blob([buf], { type }), name); return this.req('POST', `/api/admin/albums/${albumId}/photos`, fd); }
}

// ảnh thử: gradient màu ấm, kích thước khác nhau
const img = (w, h, hue, fmt) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},35%,72%)"/><stop offset="1" stop-color="hsl(${hue + 25},30%,32%)"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg))[fmt]().toBuffer();
};

try {
  rmSync(DATA, { recursive: true, force: true }); mkdirSync(DATA, { recursive: true });
  await startServer();
  const anon = new Client(); const admin = new Client(); const sale = new Client(); const mkt = new Client();

  // 1. Chưa đăng nhập
  const unauth = await Promise.all([anon.req('GET', '/api/admin/dashboard'), anon.req('GET', '/api/admin/albums'), anon.req('POST', '/api/admin/albums', { title: 'x' }), anon.req('GET', '/api/admin/taxonomies')]);
  check('Chưa đăng nhập: API quản trị trả 401', unauth.every((r) => r.status === 401), unauth.map((r) => r.status).join(','));
  check('Đăng nhập sai mật khẩu bị từ chối', (await new Client().login(env.ADMIN_EMAIL, 'sai-mat-khau')).status === 401);

  // 2. Sale/Tư vấn
  const sl = await sale.login(env.SALE_EMAIL, env.SALE_PASSWORD);
  check('Sale đăng nhập được', sl.status === 200 && sl.data.role === 'sale');
  const saleCalls = await Promise.all([sale.req('GET', '/api/admin/dashboard'), sale.req('GET', '/api/admin/albums'), sale.req('POST', '/api/admin/albums', { title: 'Sale tạo' }), sale.req('GET', '/api/admin/taxonomies'), sale.req('POST', '/api/admin/albums/1/photos', new FormData())]);
  check('Sale: mọi API quản trị album trả 403', saleCalls.every((r) => r.status === 403), saleCalls.map((r) => r.status).join(','));

  // 3. Admin tạo 2 album
  check('Admin đăng nhập được', (await admin.login(env.ADMIN_EMAIL, env.ADMIN_PASSWORD)).status === 200);
  const tax = (await admin.req('GET', '/api/admin/taxonomies')).data;
  const newLoc = await admin.req('POST', '/api/admin/taxonomies', { kind: 'location', label: 'Hồ Tây, Hà Nội' });
  check('Thêm lựa chọn phân loại mới (địa điểm)', newLoc.status === 201 && newLoc.data.label === 'Hồ Tây, Hà Nội');
  const A = await admin.req('POST', '/api/admin/albums', { title: 'Chiều hoàng hôn Hồ Tây', description: 'Buổi chụp ngoại cảnh lúc hoàng hôn.', styleId: tax.style[1].id, categoryId: tax.category[0].id, locationId: newLoc.data.id, sortOrder: 1, videoUrl: 'https://youtu.be/dQw4w9WgXcQ' });
  const B = await admin.req('POST', '/api/admin/albums', { title: 'Studio phông trắng', styleId: tax.style[0].id, categoryId: tax.category[0].id });
  check('Tạo 2 album (nháp)', A.status === 201 && B.status === 201 && A.data.status === 'draft' && B.data.slug === 'studio-phong-trang', `${A.data.slug}, ${B.data.slug}`);
  check('Slug trùng bị từ chối (409)', (await admin.req('POST', '/api/admin/albums', { title: 'Khác', slug: 'studio-phong-trang' })).status === 409);
  check('Link video không phải YouTube/Vimeo bị từ chối', (await admin.req('PUT', `/api/admin/albums/${B.data.id}`, { title: 'Studio phông trắng', videoUrl: 'https://example.com/v.mp4' })).status === 400);
  check('Không xuất bản được album chưa có ảnh', (await admin.req('POST', `/api/admin/albums/${B.data.id}/publish`)).status === 409);

  // 4. Tải nhiều ảnh cùng lúc, có 1 file không hợp lệ và 1 file quá dung lượng
  const files = [
    [await img(4000, 2667, 20, 'jpeg'), 'hoang-hon-01.jpg', 'image/jpeg'],
    [await img(2400, 3600, 30, 'jpeg'), 'hoang-hon-02.jpg', 'image/jpeg'],
    [await img(1800, 1200, 10, 'png'), 'hoang-hon-03.png', 'image/png'],
    [await img(2000, 2000, 40, 'webp'), 'hoang-hon-04.webp', 'image/webp'],
    [Buffer.from('day khong phai la anh'), 'gia-mao.jpg', 'image/jpeg'],
    [Buffer.alloc(6 * 1024 * 1024, 7), 'qua-lon.jpg', 'image/jpeg'],
  ];
  const ups = await Promise.all(files.map(([b, n, t]) => admin.upload(A.data.id, b, n, t)));
  check('Tải lên đồng thời: 4 ảnh hợp lệ được xử lý', ups.slice(0, 4).every((r) => r.status === 201), ups.map((r) => r.status).join(','));
  check('File không phải ảnh bị máy chủ từ chối (415)', ups[4].status === 415, ups[4].data.error);
  check('File quá dung lượng bị máy chủ từ chối (413)', ups[5].status === 413, ups[5].data.error);
  const thumbMeta = await sharp(join(DATA, 'media', 'thumb', `${ups[0].data.id}.webp`)).metadata();
  const largeMeta = await sharp(join(DATA, 'media', 'large', `${ups[0].data.id}.webp`)).metadata();
  check('Tạo bản thumbnail và bản xem lớn (WebP, nhẹ hơn gốc)', thumbMeta.width <= 720 && largeMeta.width <= 2200 && thumbMeta.format === 'webp', `gốc 4000px → thumb ${thumbMeta.width}px, large ${largeMeta.width}px`);
  check('Bản gốc lưu riêng trong thư mục nội bộ', existsSync(join(DATA, 'originals', `${ups[0].data.id}.jpg`)));
  const retry = await admin.upload(A.data.id, await img(1600, 1067, 15, 'jpeg'), 'thu-lai.jpg', 'image/jpeg');
  check('Thử lại một ảnh sau lỗi: tải lên thành công', retry.status === 201);
  const upB = await Promise.all([admin.upload(B.data.id, await img(2000, 3000, 35, 'jpeg'), 'studio-01.jpg', 'image/jpeg'), admin.upload(B.data.id, await img(3000, 2000, 25, 'jpeg'), 'studio-02.jpg', 'image/jpeg')]);
  check('Album 2: tải 2 ảnh', upB.every((r) => r.status === 201));

  // 5. Đổi thứ tự + ảnh bìa
  let a = (await admin.req('GET', `/api/admin/albums/${A.data.id}`)).data;
  const rev = a.photos.map((p) => p.id).reverse();
  a = (await admin.req('PUT', `/api/admin/albums/${A.data.id}/photos/order`, { ids: rev })).data;
  check('Kéo đổi thứ tự ảnh được lưu', a.photos.map((p) => p.id).join() === rev.join());
  const firstCover = a.coverPhotoId;
  a = (await admin.req('PUT', `/api/admin/albums/${A.data.id}/cover`, { photoId: a.photos[2].id })).data;
  check('Đổi ảnh bìa', a.coverPhotoId === a.photos[2].id && a.coverPhotoId !== firstCover);

  // 6. Xuất bản A, giữ B nháp
  const pub = await admin.req('POST', `/api/admin/albums/${A.data.id}/publish`);
  check('Xuất bản album 1', pub.status === 200 && pub.data.status === 'published');
  const prev = await admin.req('GET', `/api/admin/albums/${B.data.id}/preview`);
  check('Xem trước album nháp (quản trị)', prev.status === 200 && prev.data.photos.length === 2);
  check('Xem trước bị chặn với khách', (await anon.req('GET', `/api/admin/albums/${B.data.id}/preview`)).status === 401);

  // 7. Khách (như cửa sổ ẩn danh — không cookie)
  let list = await anon.req('GET', '/api/public/albums');
  check('Công khai: chỉ album đã xuất bản xuất hiện', list.status === 200 && list.data.length === 1 && list.data[0].slug === A.data.slug, list.data.map((x) => x.slug).join(','));
  check('Công khai: album nháp trả 404', (await anon.req('GET', `/api/public/albums/${B.data.slug}`)).status === 404);
  const det = await anon.req('GET', `/api/public/albums/${A.data.slug}`);
  const raw = JSON.stringify(det.data);
  check('Công khai: chi tiết có ảnh + video, không lộ bản gốc / id nội bộ', det.data.photos.length === 5 && det.data.video?.provider === 'youtube' && !/original|\.jpg|\.png|"id"/.test(raw));
  check('Công khai: thứ tự và ảnh bìa theo quản trị', det.data.photos[0].thumb === a.photos[0].thumb && det.data.cover.thumb === a.photos[2].thumb);
  check('Ảnh của album đã xuất bản tải được không cần đăng nhập', (await anon.req('GET', det.data.photos[0].thumb)).status === 200);
  const bThumb = prev.data.photos[0].thumb;
  check('Ảnh của album nháp bị chặn với khách (404)', (await anon.req('GET', bThumb)).status === 404);
  check('Ảnh của album nháp xem được khi đăng nhập quản trị', (await admin.req('GET', bThumb)).status === 200);
  check('Không có đường dẫn công khai tới bản gốc', (await anon.req('GET', `/data/originals/${ups[0].data.id}.jpg`)).status === 404 && (await anon.req('GET', `/originals/${ups[0].data.id}.jpg`)).status === 404);

  // 8. Marketing/Design có quyền album
  await mkt.login(env.MARKETING_EMAIL, env.MARKETING_PASSWORD);
  check('Marketing/Design truy cập được API album', (await mkt.req('GET', '/api/admin/albums')).status === 200);

  // 9. Gỡ xuất bản
  await admin.req('POST', `/api/admin/albums/${A.data.id}/unpublish`);
  list = await anon.req('GET', '/api/public/albums');
  check('Gỡ xuất bản: album biến mất khỏi API công khai', list.data.length === 0);
  check('Gỡ xuất bản: ảnh không còn tải được với khách', (await anon.req('GET', det.data.photos[0].thumb)).status === 404);
  await admin.req('POST', `/api/admin/albums/${A.data.id}/publish`);

  // 10. Thùng rác + khôi phục
  await admin.req('POST', `/api/admin/albums/${B.data.id}/trash`);
  const trash = (await admin.req('GET', '/api/admin/albums?status=trash')).data;
  const restored = await admin.req('POST', `/api/admin/albums/${B.data.id}/restore`);
  check('Chuyển vào thùng rác và khôi phục', trash.length === 1 && restored.data.deletedAt === null && restored.data.status === 'draft');

  const dash = (await admin.req('GET', '/api/admin/dashboard')).data;
  check('Dashboard: đếm nháp/xuất bản + hoạt động gần đây', dash.drafts === 1 && dash.published === 1 && dash.recent.length > 0, `nháp ${dash.drafts}, xuất bản ${dash.published}, ảnh ${dash.photos}`);
  check('Watermark tắt khi chưa có logo TCWedding', dash.watermark.active === false && dash.watermark.hasAsset === false);

  // 11. Khởi động lại server: dữ liệu còn nguyên
  await stopServer(); await startServer();
  const after = (await admin.req('GET', '/api/admin/dashboard'));
  const listAfter = await anon.req('GET', '/api/public/albums');
  check('Sau khởi động lại: dữ liệu và phiên đăng nhập còn nguyên', after.status === 200 && after.data.published === 1 && after.data.drafts === 1 && after.data.photos === dash.photos && listAfter.data.length === 1);
  check('Sau khởi động lại: file ảnh còn trên đĩa', readdirSync(join(DATA, 'media', 'large')).length === dash.photos);

  // 12. Đăng xuất
  await admin.req('POST', '/api/auth/logout');
  check('Đăng xuất: phiên bị huỷ', (await admin.req('GET', '/api/admin/albums')).status === 401);

  // 13. Trang tĩnh
  const pages = await Promise.all(['/', '/admin/', '/profile/'].map((p) => anon.req('GET', p)));
  check('Trang /, /admin/, /profile/ phục vụ từ bản build', pages.every((r) => r.status === 200), pages.map((r) => r.status).join(','));
} catch (e) {
  check('Chạy kịch bản', false, e.stack);
} finally {
  if (server && server.exitCode === null) await stopServer();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} kiểm tra đạt`);
process.exit(failed ? 1 : 0);
