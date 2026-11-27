// Cách căn ảnh thủ công cho từng VỊ TRÍ hiển thị (ảnh gốc không bị cắt / sửa).
// Dùng chung cho trang quản trị website, trình sửa thiệp, bản xem trước và trang công khai.
//
// Khoá vị trí (key): mỗi chỗ hiển thị một khoá riêng, nên cùng một tệp ảnh dùng cho banner và album vẫn có hai
// cách căn độc lập. Danh sách ảnh dùng khoá ổn định (id mục, hoặc "gallery:<url>") để đổi thứ tự không mất cách căn.
// Vị trí chưa có thiết lập → hiển thị như cũ.

import type { CSSProperties } from "react";

export type FrameFit = "cover" | "contain";
/** x, y: điểm căn (%) của ảnh trùng với điểm cùng tỉ lệ của khung · z: thu phóng (1 = vừa khung) · fit: lấp đầy / hiện toàn bộ. */
export type FrameView = { x: number; y: number; z: number; fit: FrameFit };
/** m: cách căn riêng trên điện thoại (khung có tỉ lệ khác máy tính). Không có = dùng chung. */
export type ImgFrame = FrameView & { m?: FrameView };
export type FrameMap = Record<string, ImgFrame>;

export const DEFAULT_VIEW: FrameView = { x: 50, y: 50, z: 1, fit: "cover" };
export const ZOOM_RANGE = { min: 1, max: 4 } as const;
const MAX_KEYS = 600;

const num = (v: unknown, min: number, max: number, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};
const round = (n: number, p = 2) => Math.round(n * 10 ** p) / 10 ** p;

export function cleanView(raw: unknown): FrameView | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    x: round(num(r.x, 0, 100, 50), 1),
    y: round(num(r.y, 0, 100, 50), 1),
    z: round(num(r.z, ZOOM_RANGE.min, ZOOM_RANGE.max, 1), 3),
    fit: r.fit === "contain" ? "contain" : "cover",
  };
}

/** Làm sạch một thiết lập (từ client / DB). Nhận cả dạng cũ "x% y%" của photoPos. */
export function cleanFrame(raw: unknown): ImgFrame | null {
  if (typeof raw === "string") return frameFromPos(raw);
  const v = cleanView(raw);
  if (!v) return null;
  const m = cleanView((raw as Record<string, unknown>).m);
  return m ? { ...v, m } : v;
}

/** Làm sạch cả bảng thiết lập: khoá là chuỗi ngắn, giá trị hợp lệ, tối đa MAX_KEYS vị trí. */
export function cleanFrames(raw: unknown): FrameMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: FrameMap = {};
  let n = 0;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (n >= MAX_KEYS) break;
    if (!k || k.length > 700) continue;
    const f = cleanFrame(v);
    if (f && !isDefaultFrame(f)) {
      out[k] = f;
      n++;
    }
  }
  return out;
}

export const sameView = (a: FrameView, b: FrameView) => a.x === b.x && a.y === b.y && a.z === b.z && a.fit === b.fit;
export const isDefaultFrame = (f: ImgFrame) => sameView(f, DEFAULT_VIEW) && !f.m;

/** Đặt / bỏ thiết lập của một vị trí (null hoặc mặc định = xoá, ảnh hiển thị như cũ). */
export function setFrame(map: FrameMap | undefined, key: string, frame: ImgFrame | null): FrameMap {
  const next = { ...(map ?? {}) };
  if (!frame || isDefaultFrame(frame)) delete next[key];
  else next[key] = frame;
  return next;
}

/** Đổi khoá khi ảnh trong danh sách bị thay (vd gallery:<url cũ> → gallery:<url mới>). */
export function renameFrame(map: FrameMap | undefined, from: string, to: string): FrameMap {
  if (!map?.[from]) return map ?? {};
  const next = { ...map, [to]: map[from] };
  delete next[from];
  return next;
}

export function frameFromPos(pos: string | undefined): ImgFrame | null {
  const m = pos?.match(/(-?[\d.]+)%\s+(-?[\d.]+)%/);
  if (!m) return null;
  return { ...DEFAULT_VIEW, x: num(m[1], 0, 100, 50), y: num(m[2], 0, 100, 50) };
}

export const viewPos = (v: FrameView) => `${v.x}% ${v.y}%`;

/**
 * Biến CSS cho khung ảnh (.tcw-frame trong globals.css). data-m: "c" = đổi cách căn theo bề ngang khung chứa
 * (thiệp — .tpl-root là container), "v" = theo bề ngang màn hình (trang website).
 */
export function frameAttrs(f: ImgFrame, scope: "container" | "viewport" = "viewport"): { style: CSSProperties; "data-m"?: string } {
  const style = {
    "--fx": `${f.x}%`,
    "--fy": `${f.y}%`,
    "--fz": f.z,
    "--ffit": f.fit,
    ...(f.m ? { "--mx": `${f.m.x}%`, "--my": `${f.m.y}%`, "--mz": f.m.z, "--mfit": f.m.fit } : {}),
  } as CSSProperties;
  return f.m ? { style, "data-m": scope === "container" ? "c" : "v" } : { style };
}
