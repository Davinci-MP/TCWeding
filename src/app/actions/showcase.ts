"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { cleanFrame, type ImgFrame } from "@/lib/imageFrame";
import { parseInvitationData } from "@/lib/invitation";
import { buildShowcaseData } from "@/lib/showcase";
import { cleanCoverUrl, COVER_HISTORY_MAX, parseCoverHistory, type CoverHistoryItem } from "@/lib/templateCover";
import { TEMPLATES } from "@/templates/registry";

const isTemplate = (id: string) => TEMPLATES.some((t) => t.id === id);

/**
 * Tạo / cập nhật cấu hình mẫu mà KHÔNG đổi thứ tự hay gói của mẫu: mẫu chưa có dòng cấu hình thì tạo với
 * thứ tự = vị trí trong registry và Premium theo code (giống listTemplates khi chưa có cấu hình).
 */
async function upsertConfig(templateId: string, data: { coverUrl?: string; coverFrame?: string; coverHistory?: string; showcaseId?: string }) {
  const i = TEMPLATES.findIndex((t) => t.id === templateId);
  const t = TEMPLATES[i];
  await db.templateConfig.upsert({
    where: { id: templateId },
    create: { id: templateId, isActive: true, isPremium: t.premium, sortOrder: i, ...data },
    update: data,
  });
}

function revalidateGallery(templateId?: string) {
  revalidatePath("/", "layout"); // trang chủ, /thiep có kho mẫu
  revalidatePath("/admin/templates");
  revalidatePath("/admin/showcase");
  if (templateId) revalidatePath(`/admin/showcase/cover/${templateId}`);
}

/** Ảnh công khai của album studio đã xuất bản (ảnh bìa trước). */
async function albumPhotos(albumId: string): Promise<string[]> {
  if (!albumId) return [];
  const a = await db.album.findUnique({ where: { id: albumId }, include: { photos: { orderBy: { sortOrder: "asc" }, select: { url: true } } } });
  if (!a || a.status !== "PUBLISHED") return [];
  const urls = a.photos.map((p) => p.url);
  return a.coverUrl && urls.includes(a.coverUrl) ? [a.coverUrl, ...urls.filter((u) => u !== a.coverUrl)] : urls;
}

/** Từ thiệp admin làm hộ → bản giới thiệu nháp, độc lập (sửa thiệp gốc sau này không ảnh hưởng). */
export async function createShowcaseAction(fd: FormData) {
  await requireAdmin();
  const inv = await db.invitation.findUnique({ where: { id: String(fd.get("invitationId") ?? "") } });
  if (!inv) redirect("/admin/invitations");
  const templateId = isTemplate(inv.templateId) ? inv.templateId : TEMPLATES[0].id;
  const sc = await db.templateShowcase.create({
    data: { templateId, sourceInvitationId: inv.id, data: JSON.stringify(buildShowcaseData(templateId, parseInvitationData(inv.data))) },
  });
  redirect(`/admin/showcase/${sc.id}`);
}

/** Đổi mẫu đích (mẫu gốc hoặc biến thể màu) và/hoặc album studio lấy ảnh; dựng lại dữ liệu sạch từ thiệp gốc. */
export async function updateShowcaseAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const sc = await db.templateShowcase.findUnique({ where: { id } });
  if (!sc) return;
  const templateId = String(fd.get("templateId") ?? sc.templateId);
  if (!isTemplate(templateId)) return;
  const inv = sc.sourceInvitationId ? await db.invitation.findUnique({ where: { id: sc.sourceInvitationId }, select: { data: true } }) : null;
  const source = inv ? parseInvitationData(inv.data) : parseInvitationData(sc.data);
  const albumId = String(fd.get("albumId") ?? "");
  const data = buildShowcaseData(templateId, source, await albumPhotos(albumId));
  // đổi mẫu đích khi đang là bản công khai của mẫu cũ → gỡ khỏi mẫu cũ
  if (sc.status === "PUBLISHED" && templateId !== sc.templateId) {
    await db.templateConfig.updateMany({ where: { id: sc.templateId, showcaseId: id }, data: { showcaseId: "" } });
  }
  await db.templateShowcase.update({ where: { id }, data: { templateId, albumId, data: JSON.stringify(data), ...(templateId !== sc.templateId ? { status: "DRAFT" } : {}) } });
  revalidateGallery(templateId);
  revalidatePath(`/admin/showcase/${id}`);
}

/** Duyệt: bản giới thiệu thành nội dung "Xem mẫu" của mẫu đích (thay bản đã duyệt trước đó nếu có). */
export async function publishShowcaseAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const sc = await db.templateShowcase.findUnique({ where: { id } });
  if (!sc) return;
  const publish = fd.get("publish") !== "0";
  if (publish) {
    await db.templateShowcase.updateMany({ where: { templateId: sc.templateId, status: "PUBLISHED", id: { not: id } }, data: { status: "DRAFT" } });
    await db.templateShowcase.update({ where: { id }, data: { status: "PUBLISHED" } });
    await upsertConfig(sc.templateId, { showcaseId: id });
  } else {
    await db.templateShowcase.update({ where: { id }, data: { status: "DRAFT" } });
    await db.templateConfig.updateMany({ where: { id: sc.templateId, showcaseId: id }, data: { showcaseId: "" } });
  }
  revalidateGallery(sc.templateId);
  revalidatePath(`/admin/showcase/${id}`);
}

export async function deleteShowcaseAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const sc = await db.templateShowcase.findUnique({ where: { id } });
  if (sc) {
    await db.templateConfig.updateMany({ where: { showcaseId: id }, data: { showcaseId: "" } });
    await db.templateShowcase.delete({ where: { id } });
    revalidateGallery(sc.templateId);
  }
  redirect("/admin/showcase");
}

/** Lưu ảnh bìa của mẫu (ảnh + cách căn). Ảnh bìa đang dùng được đẩy vào lịch sử để khôi phục. */
export async function saveTemplateCoverAction(templateId: string, url: string, frame: ImgFrame | null): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (!isTemplate(templateId)) return { ok: false, error: "Mẫu không tồn tại" };
  const clean = cleanCoverUrl(url);
  if (!clean) return { ok: false, error: "Ảnh không hợp lệ" };
  const f = frame ? cleanFrame(frame) : null;
  const fStr = f ? JSON.stringify(f) : "";
  const cfg = await db.templateConfig.findUnique({ where: { id: templateId } });
  let history = parseCoverHistory(cfg?.coverHistory ?? "[]");
  if (cfg?.coverUrl && !(cfg.coverUrl === clean && cfg.coverFrame === fStr)) {
    const prev: CoverHistoryItem = { url: cfg.coverUrl, frame: cleanFrame(safeJson(cfg.coverFrame)), at: new Date().toISOString() };
    history = [prev, ...history.filter((h) => h.url !== clean && h.url !== prev.url)];
  } else history = history.filter((h) => h.url !== clean);
  await upsertConfig(templateId, { coverUrl: clean, coverFrame: fStr, coverHistory: JSON.stringify(history.slice(0, COVER_HISTORY_MAX)) });
  revalidateGallery(templateId);
  return { ok: true };
}

/** Quay lại ảnh bìa mặc định (ảnh demo của mẫu). Ảnh bìa đang dùng vẫn giữ trong lịch sử. */
export async function resetTemplateCoverAction(templateId: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  const cfg = await db.templateConfig.findUnique({ where: { id: templateId } });
  if (!cfg?.coverUrl) return { ok: true };
  const history = [{ url: cfg.coverUrl, frame: cleanFrame(safeJson(cfg.coverFrame)), at: new Date().toISOString() }, ...parseCoverHistory(cfg.coverHistory).filter((h) => h.url !== cfg.coverUrl)];
  await upsertConfig(templateId, { coverUrl: "", coverFrame: "", coverHistory: JSON.stringify(history.slice(0, COVER_HISTORY_MAX)) });
  revalidateGallery(templateId);
  return { ok: true };
}

function safeJson(s: string): unknown {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
