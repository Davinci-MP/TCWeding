# Hướng dẫn deploy TCWedding (thiệp mời online) lên VPS

> Tài liệu này viết cho **agent (Claude Code) chạy ở máy chính** để triển khai repo
> `Davinci-MP/TCWeding` lên một VPS Ubuntu. Làm theo đúng thứ tự; mỗi bước có lệnh kiểm tra.
> Người đọc là người cũng làm theo được.

## 0. Trước khi bắt đầu — hỏi chủ dự án những thứ sau (không tự đoán)

| Cần có | Ghi chú |
|---|---|
| Địa chỉ IP VPS + cách SSH (user, khoá SSH) | Khuyến nghị Ubuntu 22.04/24.04, tối thiểu 1 vCPU / 2 GB RAM / 20 GB ổ |
| Quyền quản lý DNS của `tcwedding.vn` | Hiện tên miền đang trỏ về **Vercel** (website portfolio cũ). Chỉ đổi DNS khi chủ dự án đồng ý |
| Email + mật khẩu quản trị muốn dùng | Mật khẩu ≥ 10 ký tự. **Không** ghi mật khẩu vào file trong repo hay vào lịch sử chat |
| Nhánh sẽ deploy | Code nằm ở nhánh `feat/thiep-moi-online` (PR vào `main`). Hỏi đã merge chưa |

⚠️ **Lưu ý về Vercel:** repo này trước là website portfolio tĩnh deploy trên Vercel. Nếu Vercel vẫn
nối với nhánh `main`, khi merge PR Vercel sẽ cố build app Next.js này và **sẽ chạy sai** (Vercel
không giữ được file SQLite và ảnh tải lên). Hãy nhắc chủ dự án ngắt kết nối dự án Vercel (hoặc tắt
auto-deploy) trước/sau khi merge, rồi trỏ DNS về VPS.

## 1. Tổng quan kiến trúc

- **App:** Next.js 16 (App Router) + React 19, chạy bằng `next start` ở `127.0.0.1:3000`.
- **CSDL:** SQLite qua Prisma — file `prisma/prod.db` (đường dẫn đặt trong `DATABASE_URL`).
- **File tải lên** (ảnh, nhạc): thư mục `uploads/` ở gốc repo, phục vụ qua `/api/files/<tên>`.
- **Tiến trình:** PM2 (`ecosystem.config.cjs`, tên app `tcwedding`).
- **Web server:** Nginx reverse proxy + HTTPS (Let's Encrypt / certbot).
- **Cần sao lưu:** `prisma/prod.db` và `uploads/`. Hai thứ này **không** nằm trong git.

## 2. Chuẩn bị VPS (chạy một lần)

```bash
# Gói cơ bản
sudo apt update && sudo apt -y upgrade
sudo apt -y install git nginx ufw curl build-essential sqlite3

# Node.js 22 LTS (Next 16 cần Node >= 20.9)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt -y install nodejs
node -v   # kỳ vọng v22.x

# PM2
sudo npm i -g pm2

# Tường lửa: chỉ mở SSH + HTTP/HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

Tạo user chạy app (không chạy bằng root):

```bash
sudo adduser --disabled-password --gecos "" tcwedding
sudo mkdir -p /var/www/tcwedding && sudo chown tcwedding:tcwedding /var/www/tcwedding
```

Các bước sau chạy bằng user `tcwedding` (`sudo -iu tcwedding`) trừ chỗ có `sudo`.

## 3. Lấy code

Repo là private → cần quyền đọc trên VPS. Cách gọn nhất là **deploy key** chỉ-đọc:

```bash
ssh-keygen -t ed25519 -C "tcwedding-vps" -f ~/.ssh/tcwedding_deploy -N ""
cat ~/.ssh/tcwedding_deploy.pub
```

→ Đưa khoá công khai cho chủ dự án thêm vào GitHub: *Repo → Settings → Deploy keys → Add* (không tick "write").

```bash
cat >> ~/.ssh/config <<'EOF'
Host github-tcwedding
  HostName github.com
  IdentityFile ~/.ssh/tcwedding_deploy
  IdentitiesOnly yes
EOF

git clone git@github-tcwedding:Davinci-MP/TCWeding.git /var/www/tcwedding
cd /var/www/tcwedding
git checkout main        # hoặc feat/thiep-moi-online nếu PR chưa merge
```

## 4. Cấu hình môi trường

```bash
cd /var/www/tcwedding
cp .env.example .env
chmod 600 .env
openssl rand -base64 32   # dán kết quả vào AUTH_SECRET
nano .env
```

Điền:

| Biến | Giá trị |
|---|---|
| `DATABASE_URL` | `"file:./prod.db"` (giữ nguyên) |
| `AUTH_SECRET` | chuỗi vừa tạo — **giữ cố định**, đổi là mọi người bị đăng xuất |
| `APP_URL` | `"https://tcwedding.vn"` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | do chủ dự án cung cấp |
| `SEED_DEMO` | `"false"` |

## 5. Cài đặt, tạo CSDL, build

```bash
cd /var/www/tcwedding
npm ci                                   # tự chạy prisma generate
npx prisma db push                       # tạo/cập nhật bảng trong prisma/prod.db
NODE_ENV=production npm run db:seed      # tạo tài khoản admin (chỉ admin, không tạo demo)
npm run build
mkdir -p uploads
```

Kiểm tra: `ls -la prisma/prod.db` có file; `npm run build` kết thúc không lỗi.

## 6. Chạy bằng PM2

```bash
cd /var/www/tcwedding
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u tcwedding --hp /home/tcwedding   # chạy lệnh sudo mà PM2 in ra
curl -sI http://127.0.0.1:3000 | head -1                 # kỳ vọng: HTTP/1.1 200 OK
```

## 7. Nginx

`sudo nano /etc/nginx/sites-available/tcwedding`:

```nginx
server {
    listen 80;
    server_name tcwedding.vn www.tcwedding.vn;

    # Ảnh tối đa 5MB, nhạc tối đa 12MB (xem src/lib/uploads.ts)
    client_max_body_size 15m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }

    # Tài nguyên build có hash → cache lâu
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tcwedding /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 8. DNS + HTTPS

1. **Hỏi chủ dự án trước.** Đổi bản ghi DNS của `tcwedding.vn`:
   `A @ → <IP VPS>` và `A www → <IP VPS>` (hoặc `CNAME www → tcwedding.vn`). Xoá bản ghi đang trỏ về Vercel.
2. Chờ DNS cập nhật: `dig +short tcwedding.vn` trả về IP VPS.
3. Cấp chứng chỉ:

```bash
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d tcwedding.vn -d www.tcwedding.vn --redirect -m <email-chủ-dự-án> --agree-tos -n
sudo certbot renew --dry-run
```

Cookie đăng nhập có cờ `Secure` khi chạy production → **bắt buộc truy cập qua HTTPS** mới đăng nhập được.

## 9. Kiểm tra sau deploy (checklist)

- [ ] `https://tcwedding.vn` mở trang chủ có logo TCWedding.
- [ ] `https://tcwedding.vn/templates` hiện 30 mẫu; mở "Xem thử" một mẫu, bấm "Mở thiệp" → có nhạc.
- [ ] Đăng nhập `/login` bằng tài khoản admin → vào được `/admin`.
- [ ] `/admin/pricing` và `/admin/music` mở được.
- [ ] `/admin/orders` mở được (cần `npx prisma db push` để tạo bảng đơn). Dịch vụ mặc định tắt, chủ dự án tự nhập giá và tài khoản nhận tiền. Thông báo đơn qua Telegram cần VPS gọi ra được `https://api.telegram.org` và `APP_URL` đúng tên miền.
- [ ] Tạo thiệp thử, tải 1 ảnh lên → ảnh hiện (kiểm tra quyền ghi thư mục `uploads/`). Xoá thiệp thử sau đó.
- [ ] Đăng xuất rồi đăng ký tài khoản mới → tạo được thiệp.
- [ ] `pm2 logs tcwedding --lines 50` không có lỗi.

## 10. Cập nhật phiên bản mới

```bash
cd /var/www/tcwedding
/home/tcwedding/backup.sh                 # sao lưu trước (script ở mục 11)
git pull
npm ci
npx prisma db push          # áp thay đổi schema (nếu có)
npm run build
pm2 reload tcwedding
```

Nếu `prisma db push` cảnh báo **mất dữ liệu** → dừng lại, sao lưu, hỏi chủ dự án trước khi dùng `--accept-data-loss`.

## 11. Sao lưu

Tạo `/home/tcwedding/backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
APP=/var/www/tcwedding
DEST=/home/tcwedding/backups
STAMP=$(date +%F-%H%M)
mkdir -p "$DEST"
sqlite3 "$APP/prisma/prod.db" ".backup '$DEST/db-$STAMP.db'"
tar -czf "$DEST/uploads-$STAMP.tar.gz" -C "$APP" uploads
find "$DEST" -type f -mtime +14 -delete   # giữ 14 ngày
```

```bash
chmod +x /home/tcwedding/backup.sh
(crontab -l 2>/dev/null; echo "30 3 * * * /home/tcwedding/backup.sh") | crontab -
```

Khuyến nghị chép thêm thư mục `backups/` ra ngoài VPS (rclone lên Google Drive / S3).

## 12. Khôi phục / quay lại bản trước

```bash
pm2 stop tcwedding
git log --oneline -5 && git checkout <commit-trước>
npm ci && npm run build
cp /home/tcwedding/backups/db-<ngày>.db prisma/prod.db   # chỉ khi cần khôi phục dữ liệu
pm2 start tcwedding
```

## 13. Sự cố thường gặp

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| Đăng nhập xong vẫn bị đá ra | Đang truy cập bằng HTTP — cookie `Secure` chỉ gửi qua HTTPS |
| `Thiếu AUTH_SECRET trong .env` | Chưa điền `AUTH_SECRET`; sửa `.env` rồi `pm2 reload tcwedding` |
| Tải ảnh/nhạc lỗi 413 | Thiếu `client_max_body_size 15m` trong Nginx |
| Tải lên lỗi quyền | `sudo chown -R tcwedding:tcwedding /var/www/tcwedding/uploads` |
| Nhạc MP3 không phát trên iPhone | API `/api/files` đã hỗ trợ Range; kiểm tra Nginx không tắt `Accept-Ranges` |
| Hết RAM khi `npm run build` | Thêm swap 2 GB: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |

## 14. Không được làm

- Không commit `.env`, `prisma/*.db`, `uploads/`.
- Không chạy `npm run db:seed` với `SEED_DEMO=true` trên production (tạo tài khoản mật khẩu `demo123`).
- Không đổi DNS, xoá dự án Vercel hay merge PR khi chưa có xác nhận của chủ dự án.
- Không mở cổng 3000 ra Internet (app chỉ nghe `127.0.0.1`).
