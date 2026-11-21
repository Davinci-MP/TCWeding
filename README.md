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
| Admin | Album & Portfolio, **Thông tin website** (+ quyền `users` dành cho mốc sau) |
| Marketing/Design | Album & Portfolio |
| Sale/Tư vấn | Đăng nhập, xem tổng quan; **mọi API album và Thông tin website trả 403** |

Quyền được kiểm tra ở API (`requirePerm('albums')`, `requirePerm('site')`), giao diện chỉ ẩn menu cho gọn.
Tạo thêm tài khoản: thêm cặp `*_EMAIL` / `*_PASSWORD` vào `.env` rồi khởi động lại (chỉ tạo khi email chưa tồn tại).

## API
Công khai (chỉ album `published`, chưa vào thùng rác; không trả id nội bộ hay đường dẫn bản gốc):
- `GET /api/public/albums` · `GET /api/public/albums/:slug`
- `GET /media/thumb|large/<id>.webp` — chỉ trả ảnh của album đã xuất bản; ảnh album nháp chỉ trả cho người có quyền album

Quản trị (`/api/admin/*`, cần đăng nhập + quyền `albums`): dashboard, taxonomies, albums CRUD,
`publish` / `unpublish` / `trash` / `restore` / `preview`, tải ảnh (`POST /albums/:id/photos`, 1 tệp/yêu cầu),
`photos/order`, `cover`, `DELETE /photos/:id`. Đăng nhập: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

## Thông tin website (`/admin/#/site-settings`, chỉ Admin)
Liên hệ (điện thoại, email, địa chỉ, giờ mở cửa, khu vực), mạng xã hội (Zalo, Facebook, TikTok, Instagram)
và nội dung trang chủ (tiêu đề chính, mô tả, tiêu đề + nội dung giới thiệu). Lưu trong bảng `site_settings` (`server/site.js`).
- `GET` / `PUT /api/admin/site-settings` — quyền `site`. Server kiểm tra từng trường; có trường lỗi thì **không lưu trường nào**
  và trả `{ error, fields: { tên_trường: lỗi } }`. Liên kết mạng xã hội chỉ nhận đúng tên miền của mạng đó, tự thêm `https://`.
- `GET /api/public/site` — chỉ trả `contact`, `social` (bỏ trường trống, kèm `phoneHref`/`emailHref`) và `home`
  (trường trống thay bằng mặc định `HOME_DEFAULTS`, trùng chữ có sẵn trong `index.html`).
- Trang công khai (`src/site.js`, nạp qua `main.js`) điền vào phần tử có `data-site`, `data-site-link`, `data-site-wrap`, `data-site-group`
  ở đầu trang chủ, phần giới thiệu, mục Liên hệ và footer (cả `/profile/`). Dữ liệu được điền bằng JavaScript sau khi tải trang.

## Watermark
Tắt cho tới khi có logo TCWedding. Khi có: lưu PNG nền trong suốt vào `data/brand/watermark.png`, đặt `WATERMARK_ENABLED=true`, khởi động lại.
Logo đóng lên bản thumb/large của **ảnh tải lên sau đó**; bản gốc luôn giữ nguyên trong `data/originals/`.
(Đóng dấu lại ảnh đã tải trước đó: chưa có ở Mốc 1.)

## Triển khai: Vercel (trang tĩnh) + Render (API, SQLite, ảnh)
```
trình duyệt ──> www.tcwedding.vn (Vercel)
                 ├─ /, /admin/, /profile/, /assets/*   file tĩnh từ dist/
                 └─ /api/*, /media/*  ──rewrite──>  tcwedding-api.onrender.com (Render, ổ đĩa /var/data)
```
Cấu hình nằm trong repo: `render.yaml` (Blueprint) và `vercel.json` (rewrite). Trình duyệt chỉ thấy một tên miền nên cookie đăng nhập hoạt động bình thường.

1. **Đưa code vào `main`**: merge `feat/site-settings` và `deploy/render-vercel` (qua pull request). Vercel tự deploy lại từ `main`.
2. **Render** › New › Blueprint › chọn repo `Davinci-MP/TCWeding`. Render đọc `render.yaml` và tạo service `tcwedding-api`
   (gói trả phí vì có ổ đĩa 5 GB tại `/var/data`). Điền `ADMIN_EMAIL`, `ADMIN_PASSWORD` (mật khẩu mạnh) và nếu dùng Drive thì 3 biến Google.
   Tài khoản admin được tạo ở lần khởi động đầu; dữ liệu ở máy local **không** tự chuyển lên.
3. **Kiểm tra URL Render**: nếu service không có đúng địa chỉ `https://tcwedding-api.onrender.com`, sửa 2 dòng `destination` trong `vercel.json` rồi merge lại.
4. **Thử**: `https://www.tcwedding.vn/api/health` trả `{"ok":true}`; đăng nhập `https://www.tcwedding.vn/admin/`; lưu Thông tin website; tải thử **một ảnh lớn hơn 5 MB**.
5. **Nếu ảnh lớn bị lỗi 413 qua Vercel** (Vercel có giới hạn 4,5 MB cho body của Functions; chưa xác nhận được có áp dụng cho rewrite hay không):
   Render đã phục vụ cả trang tĩnh, nên chỉ cần thêm tên miền `www.tcwedding.vn` vào service Render (Settings › Custom Domains) và trỏ DNS sang Render, không phải sửa code.
6. **Sao lưu**: ổ đĩa Render chứa toàn bộ SQLite + ảnh; kiểm tra mục Disks › Snapshots của service và tải bản sao định kỳ.

Biến môi trường quan trọng trên Render: `NODE_ENV=production` (cookie `Secure`), `DATA_DIR=/var/data`,
`ALLOWED_ORIGINS=https://www.tcwedding.vn,https://tcwedding.vn` (Origin của trình duyệt khác Host gửi tới Render),
`TRUST_PROXY=2` (Vercel + Render, để giới hạn đăng nhập sai theo đúng IP khách).
Ảnh của album đã xuất bản có `Cache-Control: max-age=300`, nên sau khi gỡ xuất bản ảnh có thể còn trong bộ nhớ đệm tối đa 5 phút.

## Điều kiện chung khi tự host (VPS)
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

## Nhập nhiều ảnh từ Google Drive

1. Tạo hoặc chọn một dự án Google Cloud. Bật **Google Drive API** và **Google Picker API**.
2. Thiết lập màn hình đồng ý OAuth và thêm tài khoản Google của bạn làm người dùng thử nếu ứng dụng còn ở chế độ Testing. Tạo OAuth Client ID loại **Web application** và thêm origin bạn dùng để mở admin (ví dụ `http://localhost:8787`, `http://localhost:5173` hoặc `https://tcwedding.vn`).
3. Tạo API key cho Picker, giới hạn theo origin website và Google Picker API. Điền `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_PICKER_API_KEY` và `GOOGLE_CLOUD_PROJECT_NUMBER` trong `.env`. Số dự án khác với tên hoặc ID dự án. Khởi động lại server.
4. Vào **Album & Portfolio**, lưu một album nháp rồi bấm **Nhập ảnh từ Google Drive**. Chọn nhiều ảnh JPG, PNG hoặc WebP. Bạn có thể thử lại từng ảnh lỗi. Nếu phiên Drive hết hạn, mở lại bộ chọn và chọn lại ảnh cần nhập. Cùng một tệp Drive trong cùng album chỉ tạo một ảnh.
5. Kiểm tra ảnh đã nhập, chọn **Đặt làm bìa**, dùng **Xem trước**, rồi bấm **Xuất bản** khi sẵn sàng.

TCWedding tải tệp đã chọn bằng quyền Google `drive.file`. Token ngắn hạn chỉ phục vụ lần nhập và không lưu vào SQLite. Ảnh gốc nằm trên Drive. Máy chủ tạo bản WebP 720 px và 2200 px, giữ cơ chế watermark và quyền xem ảnh nháp của album hiện có.

Mặc định hai bản WebP được lưu trong `DATA_DIR/drive-media`. Để chuyển dung lượng sang ổ riêng, cấu hình `DRIVE_MEDIA_DIR` trỏ vào ổ lưu trữ bền vững trước khi nhập. Nếu đổi đường dẫn sau khi đã nhập ảnh, di chuyển cả thư mục `thumb` và `large` sang vị trí mới. Sao lưu thư mục này cùng SQLite. Website vẫn phục vụ ảnh qua `/media/` để kiểm tra quyền xem ảnh nháp.
