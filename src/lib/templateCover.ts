// Ảnh bìa riêng của từng mẫu trong kho mẫu (TemplateConfig.coverUrl + coverFrame). Dùng được ở cả client và server.
// Ảnh bìa chỉ thay ô "ảnh bìa" (data.coverPhoto + frames.cover) của dữ liệu demo / bản giới thiệu: thiệp khách không bị ảnh hưởng.

import { cleanFrame, setFrame, type ImgFrame } from "./imageFrame";
import type { InvitationData } from "./invitation";

export type TemplateCover = { url: string; frame: ImgFrame | null };
export type TemplateCoverMap = Record<string, TemplateCover>;
export type CoverHistoryItem = TemplateCover & { at: string };

export const COVER_HISTORY_MAX = 10;

/** Chỉ nhận ảnh https hoặc ảnh tải lên của site (/uploads/…). */
export function cleanCoverUrl(raw: unknown): string {
  const s = typeof raw === "string" ? raw.trim().slice(0, 1000) : "";
  return /^https:\/\/[^\s"'<>]+$/.test(s) || /^\/uploads\/[\w./-]+$/.test(s) ? s : "";
}

export function parseCoverFrame(raw: string): ImgFrame | null {
  try {
    return raw ? cleanFrame(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function parseCoverHistory(raw: string): CoverHistoryItem[] {
  try {
    const a = JSON.parse(raw || "[]");
    if (!Array.isArray(a)) return [];
    return a
      .map((h) => ({ url: cleanCoverUrl(h?.url), frame: cleanFrame(h?.frame), at: typeof h?.at === "string" ? h.at.slice(0, 40) : "" }))
      .filter((h) => h.url)
      .slice(0, COVER_HISTORY_MAX);
  } catch {
    return [];
  }
}

/** Đặt ảnh bìa của mẫu vào dữ liệu hiển thị (thumbnail, bản demo, bản giới thiệu). Không có ảnh bìa riêng → giữ nguyên. */
export function applyCover<T extends InvitationData>(data: T, cover: TemplateCover | null | undefined): T {
  if (!cover?.url) return data;
  return { ...data, coverPhoto: cover.url, frames: setFrame(data.frames, "cover", cover.frame) };
}
