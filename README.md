# TCWedding — tcwedding.vn

Website portfolio ảnh cưới + trang quản trị `/admin/`.
Giao diện: Vite + HTML/CSS/JS thuần. Máy chủ: Node.js + Express, dữ liệu SQLite (`node:sqlite`), xử lý ảnh bằng sharp.

## Chạy trên máy (Windows/macOS/Linux, cần Node.js ≥ 22.13 — đang dùng 24)

Lần đầu:
```bash
npm install
```
Tạo `.env` từ `.env.example` nếu chưa có, đặt `ADMIN_EMAIL` / `ADMIN_PASSWORD` (tài khoản được tạo khi server khởi động).

**Cách 1 — giống môi trường thật (khuyên dùng để thử):**
```bash
npm run build
npm start
```
- Website công khai: http://localhost:8787/ (Bộ sưu tập: http://localhost:8787/#bo-suu-tap)
- Quản trị: http://localhost:8787/admin/

**Cách 2 — khi sửa giao diện (tự tải lại):**
```bash
npm run dev
```
- Website: http://localhost:5173/ · Quản trị: http://localhost:5173/admin/ (Vite chuyển `/api`, `/media` sang server cổng 8787)

**Kiểm thử nghiệm thu** (server riêng cổng 8799, dữ liệu tạm `.tmp/`, không đụng `data/`):
```bash
npm run build
npm run test:acceptance
```

## Cấu trúc
```
index.html, profile/          Trang công khai (Ngày 1). #bo-suu-tap đọc album đã xuất bản từ API
admin/index.html              Trang quản trị (SPA, src/admin/)
src/collection.js             Lưới album + trình xem album/ảnh lớn công khai (#album-<slug>)
src/admin/                    admin.js, admin.css
server/index.js               Express: auth, API công khai, phục vụ ảnh, phục vụ dist/
server/albums.js              API quản trị album/ảnh/phân loại (yêu cầu quyền "albums")
server/auth.js                Mật khẩu (scrypt), phiên (cookie HttpOnly), vai trò & quyền, chống CSRF
server/media.js               Kiểm tra tệp, tạo thumb 720px + large 2200px (WebP), watermark
server/db.js                  Lược đồ SQLite
data/                         (không commit) tcwedding.sqlite, originals/ (bản gốc, không public), media/thumb|large
tests/acceptance.mjs          Kịch bản nghiệm thu Mốc 1
```

## Vai trò
| Vai trò | Quyền Mốc 1 |
|---|---|
| Admin | Album & Portfolio (+ quyền `users` dành cho mốc sau) |
| Marketing/Design | Album & Portfolio |
| Sale/Tư vấn | Đăng nhập, xem tổng quan; **mọi API album trả 403** |

Quyền được kiểm tra ở API (`requirePerm('albums')`), giao diện chỉ ẩn menu cho gọn.
Tạo thêm tài khoản: thêm cặp `*_EMAIL` / `*_PASSWORD` vào `.env` rồi khởi động lại (chỉ tạo khi email chưa tồn tại).

## API
Công khai (chỉ album `published`, chưa vào thùng rác; không trả id nội bộ hay đường dẫn bản gốc):
- `GET /api/public/albums` · `GET /api/public/albums/:slug`
- `GET /media/thumb|large/<id>.webp` — chỉ trả ảnh của album đã xuất bản; ảnh album nháp chỉ trả cho người có quyền album

Quản trị (`/api/admin/*`, cần đăng nhập + quyền `albums`): dashboard, taxonomies, albums CRUD,
`publish` / `unpublish` / `trash` / `restore` / `preview`, tải ảnh (`POST /albums/:id/photos`, 1 tệp/yêu cầu),
`photos/order`, `cover`, `DELETE /photos/:id`. Đăng nhập: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

## Watermark
Tắt cho tới khi có logo TCWedding. Khi có: lưu PNG nền trong suốt vào `data/brand/watermark.png`, đặt `WATERMARK_ENABLED=true`, khởi động lại.
Logo đóng lên bản thumb/large của **ảnh tải lên sau đó**; bản gốc luôn giữ nguyên trong `data/originals/`.
(Đóng dấu lại ảnh đã tải trước đó: chưa có ở Mốc 1.)

## Điều kiện để đưa lên hosting (chưa làm ở Mốc 1)
- Cần máy chủ chạy **Node.js ≥ 22.13** liên tục (VPS, hoặc hosting hỗ trợ Node như Render/Railway/Fly.io có ổ đĩa bền vững).
  Hosting tĩnh thuần (Cloudflare Pages, Netlify tĩnh) **không chạy được** phần quản trị nếu không viết lại API cho nền tảng đó.
- Ổ đĩa bền vững cho `DATA_DIR` (SQLite + ảnh), có sao lưu định kỳ thư mục này.
- HTTPS phía trước (Nginx/Caddy hoặc nền tảng), đặt `NODE_ENV=production` (bật cookie `Secure`) và `ALLOWED_ORIGINS=https://tcwedding.vn`.
- Mật khẩu thật, mạnh trong `.env` trên máy chủ; không dùng mật khẩu thử của máy local.
- Giới hạn kích thước upload ở reverse proxy ≥ `MAX_UPLOAD_MB` (vd Nginx `client_max_body_size 30m`).

## Tiến độ
- [x] Ngày 1: header, menu mobile, hero, giới thiệu, footer, khung các section, khung /profile/
- [x] Mốc 1: /admin/ (đăng nhập, dashboard, Album & Portfolio), tải ảnh, xuất bản → /#bo-suu-tap
- [ ] Thiệp mời · Bảng giá · Liên hệ (kết nối form) · Profile · Khách hàng (Sale) · Domain/hosting
