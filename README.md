# TCWedding — thiệp mời cưới online (tcwedding.vn)

Nền tảng tạo thiệp cưới online mang thương hiệu TCWedding (chụp ảnh cưới, thiệp mời online và album cưới).
**Triển khai lên VPS:** xem [DEPLOY-VPS.md](DEPLOY-VPS.md). Biến môi trường mẫu: [.env.example](.env.example).

Người dùng đăng ký, chọn mẫu, tuỳ biến nội dung và chia sẻ thiệp bằng link `/w/<slug>`.
Admin quản lý người dùng, gói cước, thiệp và mẫu thiệp.

**Công nghệ:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Prisma 6 (SQLite khi dev) · JWT cookie (jose) · bcrypt · zod

## Chạy thử

```powershell
npm install
npm run setup     # tạo DB + dữ liệu mẫu
npm run dev       # http://localhost:3000
```

Tài khoản mẫu (tạo bởi `prisma/seed.ts`):

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@thiepcuoi.local` | `admin123` (đổi trong `.env`) |
| Người dùng | `demo@thiepcuoi.local` | `demo123` |

Thiệp mẫu đã xuất bản: http://localhost:3000/w/quan-ha?to=Anh%20Nam

## Tính năng

**Khách truy cập / người dùng**
- Kho mẫu thiệp có lọc theo phong cách, “Xem thử” với dữ liệu demo.
- Trình chỉnh sửa có **xem trước trực tiếp** khung điện thoại: cô dâu chú rể, gia đình hai bên, lời mời, nhiều sự kiện (Vu Quy, Thành Hôn, Tiệc cưới, ngày âm lịch, bản đồ Google), chuyện tình yêu, album ảnh, hộp mừng cưới (QR VietQR tự tạo), nhạc nền, màu chủ đạo, bật/tắt từng phần. `Ctrl+S` để lưu.
- Tải ảnh/nhạc lên (`/api/upload`, lưu ở `./uploads`).
- Đường dẫn tuỳ chỉnh, nháp/xuất bản, **link mời đích danh** `?to=Tên khách`.
- Thiệp công khai: màn “Mở thiệp”, đếm ngược, RSVP, sổ lưu bút, nhạc nền, hiệu ứng cuộn.
- Quản lý khách: thống kê, danh sách RSVP, xuất CSV (mở bằng Excel), ẩn/hiện lời chúc.

**Admin** (`/admin`)
- Tổng quan số liệu, mẫu được dùng nhiều.
- Người dùng: tìm kiếm, nâng/hạ gói Premium, cấp quyền admin, xoá.
- Thiệp: tìm kiếm, gỡ/xuất bản, sửa, xoá.
- Mẫu thiệp: bật/tắt, đặt Premium, thứ tự hiển thị.

**Gói cước:** FREE tạo tối đa `FREE_INVITATION_LIMIT` thiệp (trong `src/lib/templates.ts`) và không dùng mẫu Premium. Hiện admin nâng cấp thủ công; có thể nối cổng thanh toán (VNPay/MoMo/PayOS) để tự cập nhật `user.plan`.

## Cấu trúc

```
prisma/schema.prisma        User, Invitation, Rsvp, Wish, TemplateConfig
src/templates/registry.ts   ⭐ Khai báo mẫu thiệp (màu, font, kiểu hero, hoạ tiết)
src/templates/heroes.tsx    Các kiểu phần đầu thiệp: frame, songhy, editorial, floral, starry, split
src/templates/InvitationView.tsx  Render thiệp (dùng chung cho xem trước & thiệp thật)
src/templates/interactive.tsx     Đếm ngược, RSVP, lời chúc, album, mừng cưới, nhạc, phong bì
src/components/editor/      Trình chỉnh sửa
src/app/(site)/             Trang chủ, kho mẫu, đăng nhập/đăng ký
src/app/dashboard/          Khu vực người dùng
src/app/admin/              Khu vực quản trị
src/app/w/[slug]/           Thiệp công khai
src/app/api/                upload, files, rsvp, wishes, invitations (lưu, xuất CSV)
```

## Thêm mẫu thiệp mới

1. Thêm một object vào `TEMPLATES` trong `src/templates/registry.ts` (id, tên, màu, font, `hero`, `ornament`).
2. Muốn bố cục đầu thiệp khác hẳn: viết thêm một component trong `heroes.tsx` và thêm vào `HeroVariant`.
3. Nếu dùng font mới, khai báo trong `fontUrl()` (Google Fonts, nhớ chọn font hỗ trợ tiếng Việt).

Mẫu tự xuất hiện ở kho mẫu, trình chỉnh sửa và trang admin.

## Đưa lên production

- Đổi `AUTH_SECRET`, `ADMIN_PASSWORD` trong `.env`.
- Đổi `provider = "postgresql"` trong `schema.prisma` và `DATABASE_URL` (Supabase/Neon…), chạy `npx prisma db push`.
- Ảnh/nhạc đang lưu trên ổ đĩa (`./uploads`) — nếu deploy lên Vercel/serverless cần chuyển sang S3/Cloudflare R2/Cloudinary (sửa `src/app/api/upload/route.ts`).
- Giới hạn tần suất RSVP/lời chúc đang lưu trong bộ nhớ (`src/lib/rateLimit.ts`); nhiều server thì dùng Redis.
