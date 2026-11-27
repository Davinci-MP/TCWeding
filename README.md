# TCWedding: chụp ảnh cưới, album & thiệp mời online

Website của studio TCWedding (tcwedding.vn). Trang chủ `/` là trang studio: bộ sưu tập ảnh cưới (khách thả tim ảnh thích), bảng giá gói chụp, album mẫu lật trang và form đặt lịch tư vấn. Thiệp cưới online ở `/thiep`: khách **không cần tài khoản**, chọn mẫu, xem thiệp chạy thật, thả tim, điền thông tin và gửi cho studio làm; thiệp hoàn thiện gửi bằng link `/w/<đường-dẫn>`. Ngoài ra có Slideshow tiệc cưới, Ghép album và trang Về tôi.

**Đọc phần nào?**

| Bạn cần | Xem |
|---|---|
| Chạy thử trên máy | [1. Chạy trên máy](#1-chạy-trên-máy) |
| Đưa lên mạng | [2. Đưa lên Vercel](#2-đưa-lên-vercel-cách-đang-dùng) (Turso + Vercel Blob), hoặc [2b. VPS](#2b-đưa-lên-vps-cách-khác) ([DEPLOY-VPS.md](DEPLOY-VPS.md)) |
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
- Trang quản trị: gõ `/admin` (không có nút đăng nhập trên website).
- Thiệp mẫu: http://localhost:3000/w/quan-ha?to=Anh%20Nam

## 2. Đưa lên Vercel (cách đang dùng)

Trên Vercel website dùng **Turso** (SQLite online) làm cơ sở dữ liệu và **Vercel Blob** để lưu ảnh, nhạc tải lên, vì Vercel không có ổ đĩa lưu lâu dài. Code tự nhận: có `TURSO_DATABASE_URL` thì dùng Turso, có `BLOB_READ_WRITE_TOKEN` thì dùng Blob; không có thì dùng file SQLite và thư mục `uploads/` như khi chạy trên máy / VPS.

> Gói Hobby (miễn phí) của Vercel chỉ dành cho mục đích cá nhân, phi thương mại. Website studio nhận đơn nên dùng gói **Pro**.

### Bước 1. Tạo database Turso (dùng riêng cho website)

1. Vào https://app.turso.tech › **Create Database**, đặt tên `tcwedding`, vùng **Singapore** (gần Việt Nam). Không dùng chung database với dự án khác.
2. Mở database › chép **URL** (dạng `libsql://tcwedding-….turso.io`).
3. Bấm **Create Token** (quyền Read & Write, không hết hạn) › chép **token**.

### Bước 2. Tạo bảng và tài khoản admin trên Turso (chạy trên máy, 1 lần)

```bash
cp .env.turso.example .env.turso   # PowerShell: Copy-Item .env.turso.example .env.turso
# mở .env.turso, điền TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, ADMIN_EMAIL, ADMIN_PASSWORD (≥ 10 ký tự)
npm run turso:push   # tạo bảng
npm run turso:seed   # tạo tài khoản admin
```

`.env.turso` chứa khoá bí mật, đã được `.gitignore`, không commit.

### Bước 3. Tạo project Vercel

1. https://vercel.com › **Add New… › Project** › chọn repo `Davinci-MP/TCWeding` › Framework: **Next.js**.
2. Mở **Environment Variables**, thêm (cho Production và Preview):

| Biến | Giá trị |
|---|---|
| `TURSO_DATABASE_URL` | URL ở bước 1 |
| `TURSO_AUTH_TOKEN` | token ở bước 1 |
| `DATABASE_URL` | `file:./dev.db` (chỉ để Prisma không báo thiếu; website dùng Turso) |
| `AUTH_SECRET` | chuỗi ngẫu nhiên dài, tạo bằng lệnh bên dưới |
| `APP_URL` | `https://www.tcwedding.vn` |

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

3. Bấm **Deploy**.
4. Vào tab **Storage › Create Database › Blob**, đặt tên, nối với project này. Vercel tự thêm `BLOB_READ_WRITE_TOKEN`. Vào **Deployments › Redeploy** để bản đang chạy nhận biến mới.
5. Mở `https://<tên-project>.vercel.app/admin`, đăng nhập bằng tài khoản ở bước 2, thử tải một ảnh trong Bộ sưu tập.

### Bước 4. Chuyển tên miền tcwedding.vn sang project mới

1. Ở project **cũ** (đang báo lỗi): **Settings › Domains** › gỡ `tcwedding.vn` và `www.tcwedding.vn`. Nên **Settings › Git › Disconnect** (hoặc xoá project cũ) để nó không tự deploy theo repo nữa.
2. Ở project **mới**: **Settings › Domains** › thêm `www.tcwedding.vn` (chính) và `tcwedding.vn` (chuyển hướng về www). DNS đang trỏ về Vercel sẵn nên thường không phải sửa DNS.

### Cập nhật về sau

- Gộp code vào `main` là Vercel tự deploy.
- Khi `prisma/schema.prisma` thay đổi (thêm bảng, cột): chạy `npm run turso:push` trên máy **trước** khi gộp vào `main`. Script tự so sánh và chỉ thêm phần còn thiếu; nếu có lệnh xoá dữ liệu, script dừng lại và yêu cầu chạy lại với `-- --yes` (hãy sao lưu trước).
- Sao lưu: Turso có lịch sử khôi phục theo thời điểm (tuỳ gói); ảnh nằm trong Vercel Blob của project.

## 2b. Đưa lên VPS (cách khác)

**Cần có**

- VPS Ubuntu 22.04/24.04, tối thiểu 1 vCPU, 2 GB RAM, 20 GB ổ cứng.
- Tên miền trỏ về VPS và HTTPS. Production bắt buộc HTTPS thì mới đăng nhập được.
- Node.js 22, PM2, Nginx, certbot, sqlite3.

Trên VPS website dùng file SQLite và thư mục `uploads/` trên ổ đĩa: **không** đặt `TURSO_DATABASE_URL` hay `BLOB_READ_WRITE_TOKEN`.

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

Admin vào bằng cách gõ thẳng `/admin` (web chuyển sang `/login`). Trên website **không có** nút đăng nhập hay đăng ký: khách không cần tài khoản.

1. **Nội dung trang chủ** (`/admin/studio`), **Về tôi** (`/admin/about`): chữ, ảnh, liên hệ, mạng xã hội, quy trình, hỏi đáp, SEO.
2. **Gói chụp** (`/admin/studio-pricing`): giá thật cho 3 gói. Giá mặc định là "Liên hệ".
3. **Bộ sưu tập** (`/admin/albums`) và **Ghép album** (`/admin/ghep-album`): tải ảnh thật lên.
4. **Mẫu thiệp** (`/admin/templates`): bật/tắt mẫu, đổi thứ tự; xem mẫu nào được khách thả tim nhiều.
5. **Đơn làm thiệp & video** (`/admin/orders`) › Cài đặt dịch vụ: phí làm thiệp, ghi chú cho khách. Muốn thu cọc thì điền tiền cọc + ngân hàng và tick "Thu tiền cọc".
6. **Cài đặt** (`/admin/settings`): đổi mật khẩu admin, nối **Telegram** để đơn mới / yêu cầu tư vấn báo về điện thoại:
   - Trong Telegram, nhắn `@BotFather` lệnh `/newbot`, lấy mã bot, dán vào "Thông báo Telegram", bấm "Lưu bot".
   - Bấm "Mở @tên_bot", nhấn Start, quay lại bấm "Tôi đã bấm Start". Nhận được tin thử là xong. VPS phải gọi ra được `https://api.telegram.org`.
7. **Thư viện nhạc** (`/admin/music`): thêm bài có quyền sử dụng; khách chọn được trong form làm thiệp.

**Kiểm tra nhanh:** vào `/thiep`, thả tim một mẫu, chọn mẫu, bấm "Điền thử thông tin mẫu", tải 1–2 ảnh, nhập số điện thoại, bấm "Gửi cho studio"; xem đơn ở `/admin/orders` và tin Telegram; rồi huỷ và xoá đơn.

## 4. Hướng dẫn sử dụng

### Thiệp cưới online: khách không cần tài khoản

Một trang `/thiep`, điều hướng bằng `#` giống quocanhwedding.com/thiep:

| Địa chỉ | Khách thấy |
|---|---|
| `/thiep` | Thư viện mẫu (mã TC-01, TC-02…), lọc theo loại hoặc **Đã thích**. Bấm mẫu mở hộp: *Chọn mẫu này & điền thông tin*, *Xem thiệp chạy thật*, *Thả tim mẫu này*, ‹ › |
| `/thiep#tc-02` | Thiệp chạy thật của mẫu TC-02 (dữ liệu mẫu), thanh trên cùng: ♡, *Chọn mẫu này* |
| `/thiep#chon-tc-02` | Form 9 bước, chọn sẵn mẫu TC-02: mẫu · cô dâu chú rể (thứ bậc) · gia đình · lịch cưới (ngày âm **tự tính**) · hộp mừng cưới (ảnh QR) · nhạc nền · video slideshow · ảnh cưới (tối đa 30) · liên hệ |
| `/thiep#xem` | Xem trước thiệp với thông tin khách đã điền (chưa có ảnh thì dùng ảnh minh hoạ) |

- **107 mẫu thiệp** = 30 thiết kế gốc + 77 biến thể màu (`src/templates/palettes.ts`: bảng màu theo họ đầu thiệp sáng / tối; Song Hỷ, Burgundy Velvet, Ocean Breeze không có biến thể vì có màu vẽ cố định). Thư viện lọc theo loại, **thiết kế**, **màu sắc**, đã thích.
- **207 mẫu slideshow**: mỗi mẫu thiệp một mẫu cùng tông + mỗi bảng màu × 4 kiểu khung mới (Phóng chậm, Polaroid, Chia đôi, Cuộn phim); 8 kịch bản (thêm Save the date, Hành trình yêu, Đếm ngược, Lời cảm ơn cuối tiệc). Mã TC-xx / SS-xx cũ giữ nguyên, mẫu mới chỉ thêm vào cuối.
- Bản nháp lưu trên máy khách, điền dở quay lại vẫn còn. "Gửi cho studio" tạo **đơn mới** (không trả tiền trước) và đưa khách tới trang đơn riêng `/don/...`.
- **Thả tim mẫu**: lưu trên server theo cookie ẩn danh `tcw_vid` (1 năm). Lần sau khách quay lại vẫn thấy mẫu đã thích; admin thấy số ❤ từng mẫu ở `/admin/templates` và các mẫu khách đã thích trong chi tiết đơn.
- Trang chủ có mục **Thiệp cưới online** (8 mẫu, cùng hộp chọn mẫu) và **Slideshow tiệc cưới** (`/#slideshow`): 30 mẫu video theo kịch bản / chuyển cảnh / tông màu, xem toàn màn hình, "Chọn mẫu này" tick sẵn bước 7 trong form.
- Link cũ tự chuyển: `/thiep-moi`, `/templates`, `/templates/<id>`, `/dat-lam-thiep`, `/register` → `/thiep`; `/album-mau` → `/ghep-album`.

### Đơn làm thiệp (admin, tại `/admin/orders`)

| Bước | Khách (trang `/don/...`) | Admin |
|---|---|---|
| 1 | Gửi form ở `/thiep` | Nhận thông báo; xem thông tin khách điền, mẫu khách đã thả tim |
| 2 | Chuyển cọc bằng QR nếu studio bật thu cọc | Xác nhận đã nhận cọc, hoặc bấm "Bắt đầu làm" nếu không cọc |
| 3 | Gửi thêm ảnh, nhắn tin | "Tạo thiệp từ đơn": trình soạn thiệp **điền sẵn** gia đình, lịch cưới, mừng cưới, nhạc, ảnh; hoàn thiện rồi "Gửi khách duyệt" |
| 4 | Xem thiệp nháp, duyệt hoặc nhắn yêu cầu sửa | Sửa rồi gửi duyệt lại |
| 5 | Chuyển phần còn lại | Xác nhận, "Xuất bản và bàn giao" |
| 6 | Gửi link thiệp cho khách mời; mở lại trang đơn để xem **ai xác nhận tham dự và lời chúc** | |

- Web không tự đối soát ngân hàng. Ai có link đơn đều xem được đơn; khách mất link thì admin sao chép lại ở trang chi tiết đơn.

### Bản đồ sự kiện

Mỗi sự kiện chỉ hiện bản đồ khi đã nhập **Link Google Maps** hợp lệ (toạ độ trong link được dùng nếu có, không thì dùng địa chỉ). Để trống / xoá link thì không có khối bản đồ; tên địa điểm, địa chỉ, giờ vẫn hiện.

### Kiểu chữ và nội dung dài

- **Website:** tiêu đề tự chọn cỡ theo độ dài câu (câu dài không còn chiếm cả màn hình), từ quá dài tự xuống dòng. Chỉnh font và cỡ chữ ở Nội dung trang chủ › Kiểu chữ toàn website.
- **Thiệp:** tên cô dâu chú rể ở đầu thiệp tự thu nhỏ cho vừa màn hình điện thoại (`src/templates/fit.ts`). Trong trình soạn thiệp (tab Giao diện › Kiểu chữ) chọn font tiêu đề / viết tay / nội dung (danh sách font tiếng Việt ở `src/lib/fonts.ts`), cỡ chữ tên và cỡ chữ nội dung.
- **Kiểu chữ riêng từng ô:** trong trình soạn thiệp, bấm vào chữ trên bản xem trước (hoặc nút **Aa** cạnh ô nhập) để chỉnh font và cỡ chữ (10–96 px) chỉ cho ô đó, ví dụ tên cô dâu, lời mời, địa điểm từng sự kiện. Nút **Dùng mặc định của mẫu** bỏ thiết lập riêng của ô. Dữ liệu lưu trong `fieldStyles` theo ID ổn định của ô (`src/lib/fieldTypo.ts`); trong mẫu, phần tử hiển thị ô mang `data-tf` (component `F` ở `src/templates/parts.tsx`). Ô chưa chỉnh dùng kiểu chữ chung ở trên; server chỉ nhận font trong danh sách và cỡ chữ trong giới hạn. Trên màn hình hẹp hơn 360px chữ tự co theo bề ngang.

### Mừng cưới online (chưa nối API ngân hàng)

- **Tài khoản nhận:** trong trình soạn thảo gõ tên / tên viết tắt / mã / BIN rồi chọn ngân hàng trong danh mục VietQR (`src/lib/vnBanks.ts`, có OCB); lưu mã VietQR + BIN. Có ngân hàng hợp lệ, STK và tên chủ TK là thiệp tự hiện VietQR, không cần tải ảnh QR (ảnh QR riêng của thiệp cũ vẫn được giữ). STK là chuỗi, giữ số 0 đầu.
- **Khách:** ở Hộp mừng cưới chọn tab **Nhà trai / Nhà gái** → **Mừng cưới ngay** → chọn app ngân hàng của mình. App có ⚡ (MB, VietinBank iPay, BIDV, ACB ONE, OCB OMNI): khách nhập số tiền (tài liệu Web Call App của VietQR ghi `am` bắt buộc) rồi bấm **Mở … · điền sẵn** — link `dl.vietqr.io/pay?app=<app gửi>&ba=<STK>@<mã ngân hàng nhận>&am&tn&bn&url` (url quay về `#mung-cuoi-ve-<id tài khoản>` để về đúng bên nhận). App khác: mở thẳng app (scheme / intent VietQR công bố), không điền sẵn. Luôn có mã VietQR, **Lưu mã QR** (VietQR trả SVG → trình duyệt chuyển sang PNG), sao chép STK và nội dung.
- **Quay lại thiệp:** hỏi “Bạn đã chuyển khoản chưa?” một lần cho mỗi lượt mở app (kể cả khi trang bị tải lại). Nút **Tôi đã chuyển khoản** luôn có trong hộp. “Mừng tại đám cưới” không tạo dòng nào.
- **Popup “Mừng Cưới”:** có nút Quay lại ở mỗi bước (giữ bên nhận, dữ liệu đã điền và ảnh đã chọn trong lần mở popup) và bước **Xem lại** trước khi **Gửi bill**. Form: Ngân hàng gửi → STK gửi → Ngày giờ chuyển → Số tiền (hai cột trên màn rộng, một cột trên điện thoại), rồi Mã giao dịch (không bắt buộc).
- **STK nhận:** chữ số thẳng hàng, đều nhau (lining + tabular), nhóm 4 số; chỉnh font / cỡ riêng như các ô khác (bấm vào STK trên bản xem trước).
- **Gửi bill:** ảnh được nén trên máy khách, lưu trong database (bảng `GiftBill`, không đưa lên kho ảnh công khai). Chưa có OCR: khách nhập tay, trường nào bill không có thì để trống. STK người gửi chỉ lưu 4 số cuối. Gửi lại cùng yêu cầu (mất mạng) không tạo dòng trùng.
- **Chủ thiệp:** bảng **Tiền mừng online** ở trang Khách mời của thiệp (`/dashboard/<id>/guests`) và trang đơn của cô dâu chú rể (`/don/<token>`). Dòng mới luôn **Chờ xác nhận**; đối chiếu với app ngân hàng rồi bấm **Xác nhận / Từ chối**. Chỉ dòng đã xác nhận được cộng vào tổng. **Xuất CSV** có cột ID bản ghi.
- **Link bill `/b/<mã>`:** chỉ mở được bởi admin, tài khoản sở hữu thiệp, hoặc người đã mở link đơn của thiệp (cookie ký số, `src/lib/auth.ts`).
- Chưa có đồng bộ Google Sheets.
- Khi đưa lên Turso: chạy `npm run turso:push` để tạo bảng `GiftRecord`, `GiftBill`.

### Studio: bộ sưu tập, ghép album, bảng giá, về tôi, đặt lịch

| Trang khách xem | Admin quản lý |
|---|---|
| `/bo-suu-tap`, `/bo-suu-tap/<album>`: album ảnh cưới, khách **thả tim** từng ảnh | `/admin/albums` |
| `/ghep-album`: album mẫu **lật trang**, lọc phong cách / khổ, giá & mô tả dịch vụ, nút "Đặt ghép album" | `/admin/ghep-album`; giá & mô tả ở `/admin/studio` |
| `/#bang-gia`: 3 gói chụp, "Chọn gói này" chọn sẵn gói trong form | `/admin/studio-pricing` |
| `/ve-toi`: giới thiệu nhiếp ảnh gia, con số, lĩnh vực, portfolio, đánh giá, liên hệ | `/admin/about` |
| `/#lien-he`: form đặt lịch tư vấn **kèm ảnh đã thả tim** | `/admin/bookings` |

- Ảnh thả tim trong bộ sưu tập lưu trên trình duyệt khách (tối đa 60), gửi đi cùng yêu cầu tư vấn.
- Khi phát triển (`npm run setup`), seed tạo 6 album và 3 album mẫu bằng ảnh Unsplash. Production không tạo, trừ khi `SEED_DEMO=true`.

### Công cụ miễn phí

- `/man-hinh-led`: tạo video chạy màn hình LED tiệc cưới.
- `/slideshow`: tự làm video trình chiếu ảnh.

Cả hai dựng video ngay trong trình duyệt, ảnh không tải lên máy chủ. Giữ tab mở trong lúc xuất.

### Trang quản trị

| Trang | Việc làm được |
|---|---|
| `/admin` | Số liệu studio và thiệp |
| `/admin/orders` | Đơn làm thiệp & video, cài đặt phí / cọc / ngân hàng |
| `/admin/bookings` | Yêu cầu đặt lịch tư vấn |
| `/admin/templates` | Bật/tắt, thứ tự mẫu; số ❤, số đơn từng mẫu |
| `/admin/invitations` | Thiệp đã làm: gỡ/xuất bản, sửa, xoá |
| `/admin/studio` · `/admin/about` | Nội dung trang chủ, **kiểu chữ toàn website** (font tiêu đề / nội dung, cỡ tiêu đề đầu trang, cỡ tiêu đề mục, cỡ chữ nội dung), SEO, chân trang, ghép album · trang Về tôi |
| `/admin/albums` · `/admin/ghep-album` | Bộ sưu tập ảnh · album mẫu lật trang |
| `/admin/studio-pricing` | Bảng giá gói chụp |
| `/admin/music` | Thư viện nhạc |
| `/admin/users` | Tài khoản quản trị: cấp/hạ quyền, đặt mật khẩu mới, xoá |
| `/admin/settings` | Đổi mật khẩu, thông báo Telegram |

Chỉ tài khoản quyền admin đăng nhập được. Nếu mất mật khẩu admin: đặt `ADMIN_EMAIL` (email chưa có) và `ADMIN_PASSWORD` mới trong `.env`, chạy `NODE_ENV=production npm run db:seed` để tạo admin mới, rồi hạ quyền tài khoản cũ ở `/admin/users`. Chạy seed lại không đổi mật khẩu của tài khoản đã có.

### Chỉnh ảnh thủ công

- Nút **Chỉnh ảnh** cạnh ảnh đã tải lên: kéo bằng chuột / ngón tay, lăn chuột hoặc chụm hai ngón để thu phóng, **Lấp đầy khung** / **Hiện toàn bộ ảnh**, **Căn riêng trên điện thoại**, **Đặt lại**, **Áp dụng**. Hai khung xem trước (máy tính, điện thoại) đúng tỉ lệ và góc bo của chỗ hiển thị. Ảnh gốc không bị cắt.
- **Trình sửa thiệp** (cả thiệp làm hộ): ảnh bìa, ảnh tràn giữa thiệp, ảnh nền lời cảm ơn, ảnh cô dâu / chú rể, ảnh chuyện tình, từng ảnh album. Khung xem trước đo đúng mẫu đang chọn (điện thoại từ khung xem trước, máy tính từ bản thiệp ẩn rộng 1280px); khung điện thoại cập nhật ngay khi kéo. Lưu trong `data.frames` theo khoá vị trí (`cover`, `story.<id>`, `gallery:<url>`…) — đổi thứ tự album không mất cách căn.
- **Quản trị website**: trang chủ (ảnh nền, ảnh giới thiệu, ảnh dịch vụ), Về tôi (chân dung) — lưu kèm nút Lưu; album: bìa ở thẻ album / đầu trang album / ô album mẫu / bìa sách, từng trang album mẫu (lưu ngay, cột `Album.frames`).
- Không áp dụng: ảnh QR mừng cưới (cắt sẽ hỏng mã), bill chuyển khoản và ảnh khách gửi theo đơn (giữ ảnh gốc), ảnh trong lưới bộ sưu tập (hiện nguyên khung hình, không cắt).
- Khi đưa lên Turso: `npm run turso:push` để thêm cột `Album.frames`.

### Kiểm tra kho mẫu (QA)

- Trang `/dev/mau/<id mẫu>?data=long|empty` hiển thị trọn thiệp với dữ liệu thử (tên / địa chỉ dài có dấu, OCB + STK số 0 đầu, thiếu ảnh / bản đồ) và tự đo tràn khung. Chỉ chạy ở `npm run dev` hoặc khi server bật `TCW_QA=1`; website thật trả 404.
- Đo tràn khung toàn bộ mẫu ở 320 / 390 / 768 / 1440 px: `node scripts/qa-templates.mjs --base http://localhost:3000` (cần Chrome, Node ≥ 22). Chụp ảnh: thêm `--shots --designs`; chụp riêng một mục: `--shots --designs --section mung-cuoi --widths 390`. Kết quả ở `.tmp/qa`.
- Tương phản màu (WCAG) của mọi mẫu và biến thể: `npx tsx scripts/qa-contrast.mts` (`--raw` để xem bảng màu gốc). Khi vẽ thiệp, màu chủ đạo và chữ trên nút tự được chỉnh cho đủ tương phản (`accessiblePrimary` trong `src/templates/palettes.ts`).
- Mẫu mới chỉ thêm vào `LATE` trong `src/templates/registry.ts` (sau biến thể màu) để mã TC-xx của mẫu cũ không đổi. Mẫu 108: **Xà Cừ Gấp Nếp** (`pearl-fold`, `src/templates/heroes-pearl.tsx`).

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
src/app/dashboard/       trình soạn thiệp (chỉ admin)
src/app/(home)/thiep/    chọn mẫu, thiệp chạy thật, form làm thiệp (#hash)
src/components/thiep/    thư viện mẫu, hộp chọn mẫu, form, slideshow, thả tim
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

**Mã mẫu TC-xx** tính theo thứ tự trong `TEMPLATES`: chỉ thêm mẫu mới vào cuối để mã cũ (và link khách đã lưu) không đổi.

Không commit `.env`, `prisma/*.db`, `uploads/`.
