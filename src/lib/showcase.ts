import "server-only";
import { db } from "./db";
import { demoInvitationData, parseInvitationData, type InvitationData } from "./invitation";
import { applyCover, parseCoverFrame, parseCoverHistory, type TemplateCoverMap } from "./templateCover";
import { getTemplateDef } from "@/templates/registry";

/**
 * Dựng dữ liệu bản giới thiệu SẠCH từ thiệp admin làm hộ: chỉ chép thiết kế (màu, font, cỡ chữ, hiệu ứng, phần hiển thị).
 * Toàn bộ nội dung (tên, ảnh, địa chỉ, bản đồ, STK/VietQR, lời mời…) lấy từ dữ liệu demo dùng chung.
 * Ảnh: chỉ ảnh demo công khai hoặc ảnh của album studio đã xuất bản (publicPhotos). Không chép ảnh nào của thiệp gốc.
 */
export function buildShowcaseData(templateId: string, source: InvitationData, publicPhotos: string[] = []): InvitationData {
  const demo = demoInvitationData(getTemplateDef(templateId).demoCover);
  const pick = (i: number, fallback: string) => publicPhotos[i] || fallback;
  return {
    ...demo,
    primaryColor: source.primaryColor,
    effect: source.effect,
    sections: { ...source.sections },
    fontHeading: source.fontHeading,
    fontBody: source.fontBody,
    fontScript: source.fontScript,
    nameScale: source.nameScale,
    textScale: source.textScale,
    fieldStyles: source.fieldStyles,
    // nhạc tự tải lên là file riêng của khách → dùng nhạc theo mẫu
    music: source.music === "file" ? "" : source.music,
    musicUrl: "",
    musicName: "",
    musicStart: source.music === "file" ? 0 : source.musicStart,
    coverPhoto: pick(0, demo.coverPhoto),
    featurePhoto: pick(1, demo.featurePhoto),
    thankYouPhoto: pick(2, demo.thankYouPhoto),
    gallery: publicPhotos.length > 3 ? publicPhotos.slice(3, 15) : demo.gallery,
    frames: {},
    photoPos: { ...demo.photoPos },
  };
}

/** Ảnh bìa riêng của các mẫu (chỉ mẫu đã đặt ảnh bìa). */
export async function getCoverMap(): Promise<TemplateCoverMap> {
  const rows = await db.templateConfig.findMany({ where: { coverUrl: { not: "" } }, select: { id: true, coverUrl: true, coverFrame: true } });
  return Object.fromEntries(rows.map((r) => [r.id, { url: r.coverUrl, frame: parseCoverFrame(r.coverFrame) }]));
}

/** Dữ liệu công khai cho "Xem mẫu": bản giới thiệu đã duyệt (nếu có), ảnh bìa riêng của mẫu đè lên ô ảnh bìa. */
export async function publicShowcaseData(templateId: string): Promise<InvitationData | null> {
  const cfg = await db.templateConfig.findUnique({ where: { id: templateId } });
  if (!cfg) return null;
  const cover = cfg.coverUrl ? { url: cfg.coverUrl, frame: parseCoverFrame(cfg.coverFrame) } : null;
  if (cfg.showcaseId) {
    const sc = await db.templateShowcase.findUnique({ where: { id: cfg.showcaseId } });
    if (sc && sc.status === "PUBLISHED" && sc.templateId === templateId) return applyCover(parseInvitationData(sc.data), cover);
  }
  return cover ? applyCover(demoInvitationData(getTemplateDef(templateId).demoCover), cover) : null;
}

/** Ảnh bìa đang dùng + lịch sử của một mẫu (trang admin). */
export async function getCoverState(templateId: string) {
  const cfg = await db.templateConfig.findUnique({ where: { id: templateId } });
  return {
    current: cfg?.coverUrl ? { url: cfg.coverUrl, frame: parseCoverFrame(cfg.coverFrame) } : null,
    history: parseCoverHistory(cfg?.coverHistory ?? "[]"),
    showcaseId: cfg?.showcaseId ?? "",
  };
}

/** Ảnh được phép công khai để làm ảnh bìa / ảnh bản giới thiệu: ảnh của album studio đã xuất bản. */
export async function publicPhotoCandidates(): Promise<{ url: string; label: string }[]> {
  const albums = await db.album.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: { photos: { orderBy: { sortOrder: "asc" }, select: { url: true } } },
  });
  const seen = new Set<string>();
  return albums.flatMap((a) =>
    a.photos.filter((p) => !seen.has(p.url) && seen.add(p.url)).map((p) => ({ url: p.url, label: a.title })),
  );
}

/** Mẫu đứng sau mẫu đích trong kho mẫu (để xem trước lưới). */
export async function galleryNeighbors(templateId: string, n = 7): Promise<string[]> {
  const { listTemplates } = await import("./templates");
  const ids = (await listTemplates()).map((t) => t.id);
  const i = ids.indexOf(templateId);
  const rest = i < 0 ? ids : [...ids.slice(i + 1), ...ids.slice(0, i)];
  return rest.filter((id) => id !== templateId).slice(0, n);
}
