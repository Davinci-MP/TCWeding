# TCWedding — Tài sản & nội dung cần bổ sung trước khi công khai

Trên bản xem trước, mọi chỗ còn thiếu được đánh dấu bằng **[chữ trong ngoặc vuông, gạch đứt]**,
và mọi ô ảnh trống ghi "Ảnh chờ bổ sung · tên-file".

## 1. Thương hiệu
| Hạng mục | Định dạng | Ghi chú |
|---|---|---|
| Logo chính | SVG (ưu tiên) hoặc PNG nền trong suốt, ≥ 600px | Đặt tên `public/images/logo.svg` — hiện đang dùng chữ "TC / TCWedding" tạm |
| Logo bản sáng (cho nền tối) | SVG/PNG | Dùng ở footer và header trên ảnh hero |
| Favicon / biểu tượng vuông | SVG hoặc PNG 512×512 | Thay `public/favicon.svg` |
| Màu thương hiệu | Mã HEX | Bảng màu hiện tại là **tạm** (kem + đỏ rượu vang), nằm ở đầu `src/styles/main.css` |
| Font (nếu có quy định) | Tên font | Hiện dùng Cormorant Garamond + Be Vietnam Pro (đều hỗ trợ tiếng Việt) |

## 2. Ảnh (thả vào `public/images/` đúng tên — trang tự hiện ảnh, không cần sửa code)
| File | Vị trí | Kích thước gợi ý |
|---|---|---|
| `hero.jpg` | Ảnh mở đầu toàn màn hình | Ảnh ngang, ≥ 2400px cạnh dài, chủ thể lệch phải hoặc ở giữa (chữ nằm góc trái dưới) |
| `intro.jpg` | Phần giới thiệu ngắn | Ảnh dọc 4:5, ≥ 1200px |
| `album-01.jpg` … `album-06.jpg` | Ảnh bìa 6 album (Bộ sưu tập) | Ngang 3:2, ≥ 1600px |
| `thiep-01.jpg` … `thiep-03.jpg` | Ảnh chụp màn hình 3 mẫu thiệp online | Dọc ~9:17 (ảnh chụp điện thoại) |
| `profile.jpg` | Chân dung nhiếp ảnh gia (/profile/) | Dọc 4:5, ≥ 1200px |
| `og.jpg` | Ảnh hiện khi chia sẻ link Facebook/Zalo | 1200×630 |

Ngoài ra, cho bước Bộ sưu tập: toàn bộ ảnh của từng album (tên album, 15–40 ảnh/album, phân loại studio / ngoại cảnh / phóng sự).

## 3. Nội dung chữ
- Tỉnh/thành và khu vực hoạt động (hero, footer).
- Tên nhiếp ảnh gia / người sáng lập, năm thành lập, đoạn giới thiệu thật.
- 3 con số: số cặp đôi đã chụp, số năm làm nghề, số concept studio (chỉ dùng số thật).
- Xác nhận hoặc sửa tiêu đề hero: "Ảnh cưới giữ nguyên cách hai bạn nhìn nhau".
- Bảng giá: tên gói, giá, hạng mục từng gói, gói nổi bật (bước 4).
- Mô tả ngắn 3 dịch vụ trên /profile/.

## 4. Thông tin liên hệ
- Số điện thoại / Zalo, email, địa chỉ studio, giờ làm việc.
- Link Facebook, TikTok, Instagram (hoặc kênh khác).
- Biểu mẫu đặt lịch gửi về đâu: email, Zalo, Google Sheet hay hệ thống riêng (bước 5).

## 5. Kỹ thuật (khi duyệt xong)
- Quyền quản lý DNS của tcwedding.vn và nơi hosting mong muốn (gợi ý: Cloudflare Pages).
