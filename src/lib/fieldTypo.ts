// Kiểu chữ riêng cho từng ô nội dung của thiệp (font + cỡ chữ), lưu trong InvitationData.fieldStyles
// theo ID ổn định của ô. Dùng chung cho trình soạn thảo, bản xem trước và trang thiệp công khai
// (cả hai đều render qua InvitationView → fieldTypoCss). Dùng được cả client lẫn server.
//
// ID ô:
//   - ô đơn: "groom.name", "bride.name", "headline", "weddingDate", "invitationText", "quote.text", ...
//   - ô trong danh sách: "event.<id>.venue", "story.<id>.title", "schedule.<id>.time", "faq.<id>.q", ...
//     (<id> là id ổn định của mục, không đổi khi sắp xếp lại).
// Trong mẫu thiệp, phần tử hiển thị ô mang thuộc tính data-tf="<ID ô>" (xem <F> trong templates/parts.tsx).

import { findFont, fontFamily, googleFontsUrl } from "./fonts";

export type FieldStyle = { font?: string; size?: number };
export type FieldStyles = Record<string, FieldStyle>;

/** Cỡ chữ cho phép (px, đo ở khung thiệp rộng từ 360px; màn hình hẹp hơn tự thu nhỏ theo tỉ lệ). */
export const FIELD_SIZE_RANGE = { min: 10, max: 96 } as const;
/** Bề rộng khung (px) mà cỡ chữ đã chọn hiển thị đúng 100%; hẹp hơn thì thu nhỏ theo tỉ lệ để không tràn. */
const REF_WIDTH = 360;
const MAX_FIELDS = 300;

export const FIELD_ID_RE = /^[A-Za-z0-9_-]{1,40}(?:\.[A-Za-z0-9_-]{1,40}){0,2}$/;

export const clampFieldSize = (n: number) => Math.round(Math.min(FIELD_SIZE_RANGE.max, Math.max(FIELD_SIZE_RANGE.min, n)));

/** Làm sạch dữ liệu từ client/DB: chỉ giữ ID hợp lệ, font trong danh sách cho phép, cỡ chữ trong giới hạn. */
export function cleanFieldStyles(raw: unknown): FieldStyles {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: FieldStyles = {};
  let n = 0;
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (n >= MAX_FIELDS) break;
    if (!FIELD_ID_RE.test(id) || !v || typeof v !== "object") continue;
    const s = v as Record<string, unknown>;
    const style: FieldStyle = {};
    if (typeof s.font === "string" && findFont(s.font)) style.font = s.font;
    const size = Number(s.size);
    if (s.size != null && Number.isFinite(size) && size > 0) style.size = clampFieldSize(size);
    if (style.font || style.size) {
      out[id] = style;
      n++;
    }
  }
  return out;
}

/** Đặt / bỏ kiểu chữ của một ô (patch rỗng = xoá hẳn ô đó khỏi dữ liệu). */
export function setFieldStyle(styles: FieldStyles, id: string, patch: FieldStyle | null): FieldStyles {
  const next = { ...styles };
  const merged: FieldStyle = patch ? { ...next[id], ...patch } : {};
  if (!merged.font) delete merged.font;
  if (!merged.size) delete merged.size;
  if (merged.font || merged.size) next[id] = merged;
  else delete next[id];
  return next;
}

/** Font cần tải thêm cho các ô đã chọn font riêng. */
export function fieldFontsUrl(styles: FieldStyles) {
  return googleFontsUrl(Object.values(styles).flatMap((s) => (s.font ? [s.font] : [])));
}

const num = (n: number) => String(Math.round(n * 1000) / 1000);

/**
 * CSS áp kiểu chữ riêng cho từng ô, đặt trong .tpl-root của thiệp.
 * - Font áp cho cả phần tử con (vd ngày có nhiều span).
 * - Cỡ chữ: min(Npx, N/3.6 cqi) → đúng N px khi khung thiệp ≥ 360px, nhỏ hơn thì co theo bề ngang
 *   để chữ không tràn trên điện thoại. Chia cho --tf-zoom để bỏ phần phóng to của "Cỡ chữ nội dung /
 *   Cỡ chữ tên" chung (thiết lập riêng của ô được ưu tiên), còn phần tự co tên dài vẫn giữ.
 */
export function fieldTypoCss(styles: FieldStyles) {
  const rules: string[] = [];
  for (const [id, s] of Object.entries(styles)) {
    if (!FIELD_ID_RE.test(id)) continue;
    const sel = `.tpl-root [data-tf="${id}"]`;
    const family = s.font ? fontFamily(s.font) : "";
    if (family) rules.push(`${sel},${sel} *{font-family:${family}}`);
    if (s.size) {
      const n = clampFieldSize(s.size);
      rules.push(`${sel}{font-size:calc(min(${n}px,${num((n * 100) / REF_WIDTH)}cqi) / var(--tf-zoom,1));overflow-wrap:anywhere}${sel} *{font-size:inherit}`);
    }
  }
  return rules.join("\n");
}

/* ------------------------------ Tên hiển thị của ô (trình soạn thảo) ------------------------------ */

type LabelData = {
  events: { id: string; title: string }[];
  story: { id: string; title: string }[];
  schedule: { id: string; title: string }[];
  faqs: { id: string; q: string }[];
};

const SINGLE: Record<string, string> = {
  "groom.name": "Tên chú rể",
  "bride.name": "Tên cô dâu",
  "groom.fullName": "Họ tên chú rể",
  "bride.fullName": "Họ tên cô dâu",
  "groom.parents": "Bố mẹ chú rể",
  "bride.parents": "Bố mẹ cô dâu",
  "groom.address": "Địa chỉ nhà trai",
  "bride.address": "Địa chỉ nhà gái",
  "groom.bio": "Giới thiệu chú rể",
  "bride.bio": "Giới thiệu cô dâu",
  headline: "Dòng tiêu đề",
  weddingDate: "Ngày cưới (đầu thiệp)",
  invitationText: "Lời mời",
  "quote.text": "Câu trích dẫn",
  "quote.author": "Tác giả trích dẫn",
  closingText: "Lời cảm ơn cuối thiệp",
};

const PART: Record<string, Record<string, string>> = {
  event: { title: "tên sự kiện", lunarDate: "ngày âm lịch", venue: "địa điểm", address: "địa chỉ" },
  story: { date: "thời gian", title: "tiêu đề", content: "nội dung" },
  schedule: { time: "giờ", title: "hoạt động", description: "mô tả" },
  faq: { q: "câu hỏi", a: "trả lời" },
};

export function fieldLabel(id: string, data: LabelData) {
  if (SINGLE[id]) return SINGLE[id];
  const [kind, itemId, part] = id.split(".");
  const partLabel = PART[kind]?.[part];
  if (!partLabel) return id;
  const list = { event: data.events, story: data.story, schedule: data.schedule, faq: data.faqs }[kind] ?? [];
  const i = list.findIndex((x) => x.id === itemId);
  const item = list[i] as { title?: string; q?: string } | undefined;
  const name = { event: "Sự kiện", story: "Chuyện tình", schedule: "Lịch trình", faq: "Hỏi đáp" }[kind];
  const title = item?.title || item?.q || (i >= 0 ? `${name} ${i + 1}` : name);
  return `${title} · ${partLabel}`;
}
