# TCWedding: thiệp mời cưới online

Website tạo và gửi thiệp cưới online (tcwedding.vn). Khách tự làm thiệp từ 30 mẫu hoặc đặt TCWedding làm hộ, rồi gửi bằng link `/w/<đường-dẫn>`. TCWedding chỉ làm thiệp mời online, không chụp ảnh cưới và không dàn trang album.

**Đọc phần nào?**

| Bạn cần | Xem |
|---|---|
| Chạy thử trên máy | [1. Chạy trên máy](#1-chạy-trên-máy) |
| Đưa lên máy chủ | [2. Đưa lên VPS](#2-đưa-lên-vps), chi tiết ở [DEPLOY-VPS.md](DEPLOY-VPS.md) |
| Thiết lập sau khi web chạy | [3. Thiết lập lần đầu](#3-thiết-lập-lần-đầu) |
| Dùng hằng ngày | [4. Hướng dẫn sử dụng](#4-hướng-dẫn-sử-dụng) |
| Cập nhật, sao lưu, xử lý lỗi | [5. Vận hành](#5-vận-hành) |
| Sửa code, thêm mẫu | [6. Dành cho lập trình viên](#6-dành-cho-lập-trình-viên) |

## 1. Chạy trên máy

Cần Node.js 20.9 trở lên (khuyên dùng 22) và Git.

```bash
git clone https://github.com/Davinci-MP/TCWeding.git
cd TCWeding
npm ci
cp .env.example .env
```

Mở `.env` và sửa 4 dòng sau, giữ nguyên các dòng còn lại:

```ini
DATABASE_URL="file:./dev.db"
AUTH_SECRET="mot-chuoi-bat-ky-chi-dung-tren-may"
APP_URL="http://localhost:3000"
ADMIN_PASSWORD="mat-khau-ban-tu-chon"
```

```bash
npm run setup     # tạo cơ sở dữ liệu, tài khoản admin và dữ liệu mẫu
npm run dev       # mở http://localhost:3000
```

- Admin: email ở `ADMIN_EMAIL` và mật khẩu bạn vừa chọn.
- Người dùng mẫu: `demo@thiepcuoi.local` / `demo123` (chỉ tạo trên máy, không tạo ở production).
- Thiệp mẫu: http://localhost:3000/w/quan-ha?to=Anh%20Nam

## 2. Đưa lên VPS

**Cần có**

- VPS Ubuntu 22.04/24.04, tối thiểu 1 vCPU, 2 GB RAM, 20 GB ổ cứng.
- Tên miền trỏ về VPS và HTTPS. Production bắt buộc HTTPS thì mới đăng nhập được.
- Node.js 22, PM2, Nginx, certbot, sqlite3.

**Không dùng Vercel hay nền tảng serverless**: cơ sở dữ liệu SQLite và ảnh khách tải lên nằm trên ổ đĩa, serverless sẽ làm mất. `vercel.json` đã tắt tự deploy.

### Các bước chính

Cài gói hệ thống, tạo user `tcwedding`, cấp quyền đọc repo, cấu hình Nginx và HTTPS: làm theo [DEPLOY-VPS.md](DEPLOY-VPS.md) mục 2 đến 8. Phần của ứng dụng như sau, chạy bằng user `tcwedding`:

```bash
cd /var/www/tcwedding
cp .env.example .env && chmod 600 .env
openssl rand -base64 32                  # chép kết quả vào AUTH_SECRET
nano .env                                # điền theo bảng bên dưới

npm ci --include=dev                     # cần cả devDependencies để build
npx prisma db push                       # tạo bảng
NODE_ENV=production npm run db:seed      # tạo tài khoản admin
npm run build
mkdir -p uploads

pm2 start ecosystem.config.cjs
pm2 save
curl -sI http://127.0.0.1:3000 | head -1 # kỳ vọng HTTP/1.1 200 OK
```

Chạy `db:seed` **trước khi** mở web cho người ngoài: nếu email admin đã có người đăng ký, lệnh này sẽ cấp quyền admin cho chính tài khoản đó.

Để web tự chạy lại sau khi VPS khởi động lại, chạy `pm2 startup` theo DEPLOY-VPS.md mục 6.

### Biến môi trường (`.env`)

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `DATABASE_URL` | Có | Giữ `"file:./prod.db"`; file nằm ở `prisma/prod.db` |
| `AUTH_SECRET` | Có | Chuỗi ngẫu nhiên ký phiên đăng nhập. Đổi chuỗi này thì mọi người bị đăng xuất |
| `APP_URL` | Có | Địa chỉ thật, ví dụ `"https://tcwedding.vn"`. Dùng cho ảnh xem trước khi chia sẻ và link trong thông báo. Đặt trước khi build, đổi thì phải build lại |
| `ADMIN_EMAIL` | Có | Email tài khoản admin |
| `ADMIN_PASSWORD` | Có | Tối thiểu 10 ký tự, chỉ dùng khi seed tạo tài khoản lần đầu |
| `SEED_DEMO` | Không | Để `"false"` ở production. `"true"` tạo tài khoản demo có mật khẩu công khai |
| `TELEGRAM_API_URL` | Không | Chỉ đặt khi dùng máy chủ Telegram Bot API riêng hoặc khi thử. Mặc định `https://api.telegram.org` |

Giá dịch vụ, tài khoản ngân hàng và mã bot Telegram **không** nằm trong `.env`; admin nhập trên web.

## 3. Thiết lập lần đầu

Đăng nhập ở `/login` bằng tài khoản admin, web sẽ mở `/admin`.

1. **Bảng giá** (`/admin/pricing`): sửa giá và nội dung gói hiển thị ở trang chủ. Giá mặc định chỉ là mẫu.
2. **Mẫu thiệp** (`/admin/templates`): bật/tắt mẫu, đánh dấu Premium, đổi thứ tự.
3. **Thư viện nhạc** (`/admin/music`): thêm bài nhạc có quyền sử dụng, nếu muốn. Web đã có sẵn nhạc dựng.
4. **Đơn đặt thiệp** (`/admin/orders`), nếu nhận làm thiệp hộ:
   - Nhập giá, tiền cọc (để trống nếu không cọc), tài khoản ngân hàng, ghi chú cho khách.
   - Tick "Nhận đơn đặt làm thiệp" rồi lưu. Dịch vụ mặc định tắt; khi bật, mục "Đặt làm thiệp" mới hiện trên menu.
5. **Thông báo Telegram** (cùng trang), nếu muốn báo về điện thoại:
   - Trong Telegram, nhắn `@BotFather` lệnh `/newbot`, đặt tên và lấy mã bot.
   - Dán mã vào "Thông báo Telegram", bấm "Lưu bot".
   - Bấm "Mở @tên_bot", nhấn Start trong Telegram, quay lại bấm "Tôi đã bấm Start". Bạn nhận được tin thử là xong.
   - VPS phải gọi ra được `https://api.telegram.org`. Chỉ nối được một người nhận.

**Kiểm tra nhanh:** tạo một thiệp, tải ảnh, xuất bản, mở link trên điện thoại. Nếu nhận đơn: đặt một đơn thử, xem Telegram có báo không, rồi huỷ và xoá đơn.

## 4. Hướng dẫn sử dụng

### Khách tự làm thiệp

1. Đăng ký tại `/register`, vào `/dashboard`, chọn mẫu.
2. Điền nội dung, xem trước ngay bên cạnh, bấm lưu (hoặc `Ctrl+S`).
3. Đặt đường dẫn, xuất bản và gửi link. Thêm `?to=Tên khách` để mời đích danh, ví dụ `/w/quan-ha?to=Anh%20Nam`.
4. Trang khách mời cho xem ai tham dự, lời chúc, ẩn lời chúc và xuất CSV mở bằng Excel.

Gói Cơ bản tạo 1 thiệp với mẫu thường. Gói Premium dùng mọi mẫu và tạo nhiều thiệp. **Chưa có thanh toán tự động cho gói**: admin nhận tiền rồi nâng cấp ở `/admin/users`.

### Khách đặt TCWedding làm thiệp

| Bước | Khách | Admin, tại `/admin/orders` |
|---|---|---|
| 1 | Điền đơn ở `/dat-lam-thiep`, lưu link đơn riêng `/don/...` | Nhận thông báo đơn mới |
| 2 | Chuyển cọc bằng QR, bấm "Tôi đã chuyển khoản" | **Xem tài khoản ngân hàng**, thấy tiền rồi mới bấm "Xác nhận đã nhận cọc" |
| 3 | Gửi ảnh (tối đa 30), nhắn tin ở trang đơn | Bấm "Tạo thiệp từ đơn", hoàn thiện nội dung, bấm "Gửi khách duyệt" |
| 4 | Xem thiệp nháp, duyệt; hoặc nhắn tin để yêu cầu sửa | Nếu cần sửa thì sửa rồi gửi duyệt lại |
| 5 | Chuyển phần còn lại, báo đã chuyển | Kiểm tra tiền, xác nhận, bấm "Xuất bản và bàn giao" |
| 6 | Gửi thiệp cho khách mời; có thể chuyển thiệp về tài khoản của mình | |

Đơn không cọc thì ở bước 2 admin bấm "Bắt đầu làm". Ảnh khách gửi thêm sau bước 3 được đưa vào thiệp bằng nút "Thêm ảnh chưa dùng vào album".

- Web không tự đối soát ngân hàng.
- Ai có link đơn đều xem được đơn. Khách mất link thì admin sao chép lại ở trang chi tiết đơn.
- Cột "Cần xử lý" và số trên menu cho biết đơn nào đang chờ. Tin Telegram lỗi không được gửi lại, nên vẫn cần xem trang này.

### Công cụ miễn phí

- `/man-hinh-led`: tạo video chạy màn hình LED tiệc cưới.
- `/slideshow`: tạo video trình chiếu ảnh.

Cả hai dựng video ngay trong trình duyệt, ảnh không tải lên máy chủ. Giữ tab mở trong lúc xuất.

### Trang quản trị

| Trang | Việc làm được |
|---|---|
| `/admin` | Xem số liệu |
| `/admin/users` | Đổi gói, cấp quyền admin, xoá người dùng |
| `/admin/invitations` | Gỡ/xuất bản, sửa, xoá thiệp |
| `/admin/orders` | Đơn đặt thiệp, cài đặt dịch vụ, Telegram |
| `/admin/templates` | Bật/tắt, Premium, thứ tự mẫu |
| `/admin/pricing` | Nội dung bảng giá |
| `/admin/music` | Thư viện nhạc |

Web **chưa có đổi mật khẩu hay quên mật khẩu**, kể cả cho admin. Nếu mất mật khẩu admin: đặt `ADMIN_EMAIL` (email chưa đăng ký) và `ADMIN_PASSWORD` mới trong `.env`, chạy lại `NODE_ENV=production npm run db:seed` để tạo admin mới, rồi hạ quyền tài khoản cũ ở `/admin/users`. Chạy seed lại không đổi mật khẩu của tài khoản đã có.

## 5. Vận hành

### Cập nhật phiên bản

```bash
cd /var/www/tcwedding
/home/tcwedding/backup.sh     # script ở DEPLOY-VPS.md mục 11
git pull
npm ci --include=dev
npx prisma db push
npm run build
pm2 reload tcwedding
```

Nếu `prisma db push` cảnh báo mất dữ liệu thì **dừng lại** và hỏi chủ dự án.

### Sao lưu

Phải sao lưu `prisma/prod.db`, thư mục `uploads/` và cất riêng một bản `.env`. Cả ba không có trong Git. Script tự động hằng ngày ở DEPLOY-VPS.md mục 11 sao lưu hai thứ đầu. File cơ sở dữ liệu chứa thông tin khách và mã bot Telegram, nên giữ bản sao lưu kín.

### Lỗi thường gặp

| Triệu chứng | Cách xử lý |
|---|---|
| Đăng nhập xong bị đá ra | Đang mở bằng HTTP, phải dùng HTTPS |
| `Thiếu AUTH_SECRET trong .env` | Điền `AUTH_SECRET`, chạy `pm2 reload tcwedding` |
| Trang admin hoặc trang đơn báo lỗi thiếu bảng | Chạy `npx prisma db push`, rồi `pm2 reload tcwedding` |
| Tải ảnh/nhạc lỗi 413 | Thêm `client_max_body_size 15m` vào Nginx |
| Không ghi được ảnh | `sudo chown -R tcwedding:tcwedding /var/www/tcwedding/uploads` |
| Build báo thiếu Tailwind/TypeScript | Chạy lại `npm ci --include=dev` |
| Build hết RAM | Thêm swap, xem DEPLOY-VPS.md mục 13 |
| Không có "Đặt làm thiệp" trên menu | Dịch vụ đang tắt ở `/admin/orders` |
| Telegram không báo | Mở "Thông báo Telegram" xem lỗi, bấm "Gửi tin thử". Kiểm tra bằng `curl -I https://api.telegram.org` trên VPS |

Xem log: `pm2 logs tcwedding --lines 50`.

### Giới hạn cần biết

- Chỉ chạy **một tiến trình trên một máy chủ** (SQLite, file trên ổ đĩa, giới hạn tần suất trong bộ nhớ). Không bật PM2 cluster.
- Ảnh tối đa 5 MB, nhạc tối đa 12 MB. Ảnh khách gửi theo đơn chỉ nhận JPG, PNG, WEBP.
- Xoá thiệp hay người dùng không xoá ảnh đã tải lên trong `uploads/`.
- Chưa gửi email hoặc Zalo.

## 6. Dành cho lập trình viên

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma 6 + SQLite, phiên đăng nhập JWT.

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy chế độ phát triển |
| `npm run typecheck` | Kiểm tra kiểu |
| `npm run build` / `npm start` | Build / chạy bản production |
| `npm run db:push` | Áp `schema.prisma` vào cơ sở dữ liệu |
| `npm run db:seed` | Tạo admin (và dữ liệu mẫu khi không phải production) |

```
prisma/                  schema và seed
src/app/(home)/          trang chủ, LED, slideshow, đặt thiệp, trang đơn
src/app/(site)/          kho mẫu, đăng nhập, đăng ký
src/app/dashboard/       khu vực người dùng
src/app/admin/           quản trị
src/app/w/[slug]/        thiệp công khai
src/app/actions/         server actions
src/app/api/             tải file, RSVP, lời chúc, lưu thiệp, ảnh đơn
src/components/          editor, đơn hàng, LED/slideshow, trang chủ
src/templates/           khai báo và giao diện các mẫu thiệp
src/lib/                 đăng nhập, đơn, thông báo, cài đặt, tải file
uploads/                 file tải lên (không có trong Git)
```

**Thêm mẫu thiệp:** thêm một mục vào `BASE` trong `src/templates/registry.ts`. Muốn phần đầu thiệp khác hẳn thì thêm component trong `heroes*.tsx` và khai báo ở `HeroVariant`. Font mới khai báo trong `fontUrl()` và phải hỗ trợ tiếng Việt.

**Đổi giới hạn gói Cơ bản:** `FREE_INVITATION_LIMIT` trong `src/lib/templates.ts`.

Không commit `.env`, `prisma/*.db`, `uploads/`.
