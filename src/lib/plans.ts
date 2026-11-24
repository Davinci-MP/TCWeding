// Gói cước hiển thị trên trang chủ. Admin chỉnh tại /admin/pricing (lưu trong bảng SiteSetting);
// DEFAULT_PLANS chỉ dùng khi admin chưa lưu lần nào.
// Giới hạn thực tế của gói Free nằm ở FREE_INVITATION_LIMIT (src/lib/templates.ts).

export type Plan = {
  id: "FREE" | "PREMIUM";
  name: string;
  price: string;
  unit: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  /** Nhãn nhỏ cạnh tên gói nổi bật, ví dụ "Đầy đủ nhất". */
  badge?: string;
};

export const DEFAULT_PLANS: Plan[] = [
  {
    id: "FREE",
    name: "Cơ bản",
    price: "0đ",
    unit: "mãi mãi",
    tagline: "Đủ để có một tấm thiệp đẹp và gửi cho mọi người.",
    features: ["1 thiệp cưới", "Các mẫu thiệp tiêu chuẩn", "Xác nhận tham dự & sổ lưu bút", "Hộp mừng cưới với mã QR", "Link mời đích danh từng khách"],
    cta: "Bắt đầu miễn phí",
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "299.000đ",
    unit: "/ đám cưới",
    tagline: "Toàn bộ mẫu cao cấp và mọi tính năng cho ngày trọng đại.",
    features: [
      "Tất cả mẫu thiệp, kể cả mẫu Premium",
      "Tạo nhiều thiệp (lễ vu quy, lễ thành hôn…)",
      "Nhạc nền & video pre-wedding",
      "Xuất danh sách khách ra Excel",
      "Hỗ trợ ưu tiên qua Zalo",
    ],
    cta: "Nâng cấp Premium",
    highlight: true,
    badge: "Đầy đủ nhất",
  },
];
