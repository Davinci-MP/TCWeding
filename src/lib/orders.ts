// Đơn đặt làm thiệp: kiểu dữ liệu và hàm dùng chung client lẫn server.

export type OrderStatus = "NEW" | "WORKING" | "REVIEW" | "APPROVED" | "DONE" | "CANCELLED";

export const ORDER_STATUS: Record<OrderStatus, string> = {
  NEW: "Mới đặt",
  WORKING: "Đang làm",
  REVIEW: "Chờ khách duyệt",
  APPROVED: "Khách đã duyệt",
  DONE: "Đã bàn giao",
  CANCELLED: "Đã huỷ",
};

export const ORDER_STEPS: OrderStatus[] = ["NEW", "WORKING", "REVIEW", "APPROVED", "DONE"];

export const MAX_ORDER_PHOTOS = 30;

export const isOpen = (status: string) => status !== "DONE" && status !== "CANCELLED";

export const money = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

export const viDate = (iso: string) => iso.split("-").reverse().join("/");

type Todo = { status: string; depositClaimedAt: Date | null; finalClaimedAt: Date | null; finalPaidAt: Date | null; messages: { sender: string }[] };

/** Việc admin cần xử lý; messages chỉ cần tin mới nhất. */
export function orderTodo(o: Todo) {
  return [
    o.status === "NEW" && (o.depositClaimedAt ? "Kiểm tra cọc" : "Đơn mới"),
    o.status === "APPROVED" && o.finalClaimedAt && !o.finalPaidAt && "Kiểm tra thanh toán",
    isOpen(o.status) && o.messages[0]?.sender === "CUSTOMER" && "Tin nhắn mới",
  ].filter((x): x is string => !!x);
}

export type OrderSettings = {
  enabled: boolean;
  price: number;
  deposit: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  /** Thời gian làm, số lần sửa, hoàn cọc… do admin viết. */
  intro: string;
};

export const DEFAULT_ORDER_SETTINGS: OrderSettings = { enabled: false, price: 0, deposit: 0, bankCode: "", accountNumber: "", accountName: "", intro: "" };

/** Đủ thông tin để nhận đơn chưa. */
export function settingsError(s: OrderSettings) {
  if (s.price <= 0) return "Cần nhập giá dịch vụ.";
  if (s.deposit > s.price) return "Tiền cọc không được lớn hơn giá.";
  if (!s.bankCode || !s.accountNumber || !s.accountName) return "Cần nhập đủ ngân hàng, số tài khoản và chủ tài khoản.";
  return "";
}

export function paymentQrUrl(s: OrderSettings, amount: number, code: string) {
  const q = new URLSearchParams({ amount: String(amount), addInfo: code, accountName: s.accountName });
  return `https://img.vietqr.io/image/${s.bankCode}-${s.accountNumber}-compact2.png?${q}`;
}
