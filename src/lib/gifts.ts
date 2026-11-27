// Tiền mừng online: dùng chung cho Hộp mừng cưới (client) và API / trang quản lý (server).

import type { GiftAccount } from "./invitation";

export type GiftSide = "groom" | "bride";
export type GiftStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export const GIFT_STATUS: Record<GiftStatus, { label: string; cls: string }> = {
  PENDING: { label: "Chờ xác nhận", cls: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Đã xác nhận", cls: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Từ chối", cls: "bg-zinc-200 text-zinc-600" },
};
export const isGiftStatus = (v: unknown): v is GiftStatus => v === "PENDING" || v === "CONFIRMED" || v === "REJECTED";

export const SIDE_LABEL: Record<GiftSide, string> = { groom: "Nhà trai", bride: "Nhà gái" };
export const sideToDb = (s: GiftSide | "") => (s === "groom" ? "GROOM" : s === "bride" ? "BRIDE" : "");
export const sideFromDb = (s: string): GiftSide | "" => (s === "GROOM" ? "groom" : s === "BRIDE" ? "bride" : "");

/** Bên nhận của tài khoản: chọn trong trình soạn thảo, thiệp cũ thì đoán theo tiêu đề. */
export function giftSide(g: GiftAccount): GiftSide | "" {
  if (g.side === "groom" || g.side === "bride") return g.side;
  const t = g.label.toLowerCase();
  if (/chú rể|chu re|nhà trai|nha trai|groom/.test(t)) return "groom";
  if (/cô dâu|co dau|nhà gái|nha gai|bride/.test(t)) return "bride";
  return "";
}

/** Bỏ dấu tiếng Việt, chỉ giữ chữ số và khoảng trắng (nội dung chuyển khoản an toàn cho mọi ngân hàng). */
export function plainText(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Nội dung chuyển khoản gợi ý, vd "MUNG CUOI QUAN HA" (tối đa 25 ký tự để vừa mọi app). */
export function giftContent(groom: string, bride: string) {
  const last = (n: string) => plainText(n).split(" ").pop() ?? "";
  return `MUNG CUOI ${last(groom)} ${last(bride)}`.trim().toUpperCase().slice(0, 25).trim();
}

/** Che số tài khoản người gửi: chỉ giữ 4 số cuối. */
export function maskAccount(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (!d) return "";
  return `••••${d.slice(-4)}`;
}

export const money = (n: number) => `${n.toLocaleString("vi-VN")} đ`;

/** Mã link ngắn ngẫu nhiên (base62, 10 ký tự ≈ 59 bit). */
export function randomCode(len = 10) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => abc[b % abc.length]).join("");
}

export const BILL_MAX_BYTES = 1_500_000;
export const BILL_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
