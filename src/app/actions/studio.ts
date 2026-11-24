"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toSlug } from "@/lib/invitation";
import { STUDIO_DEFAULTS, isCategory, saveStudio, type StudioContent } from "@/lib/studio";
import { FILE_NAME_RE, UPLOAD_DIR } from "@/lib/uploads";

/** Ảnh phải là file đã tải lên hệ thống hoặc link https. */
const imageUrl = (v: unknown) => {
  const s = String(v ?? "").trim();
  return /^\/api\/files\/[a-z0-9]+\.(jpg|png|webp|gif)$/.test(s) || /^https:\/\/[^\s"'<>]+$/.test(s) ? s : "";
};

/** Link mạng xã hội: thêm https:// nếu thiếu, bỏ link không hợp lệ. */
const webUrl = (v: unknown) => {
  const s = String(v ?? "").trim();
  if (!s) return "";
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
};

function refreshPublic(slug?: string) {
  revalidatePath("/");
  revalidatePath("/bo-suu-tap");
  if (slug) revalidatePath(`/bo-suu-tap/${slug}`);
}

export async function saveStudioAction(fd: FormData) {
  await requireAdmin();
  const str = (k: string, max = 200) => String(fd.get(k) ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
  const one = (k: string, max = 200) => str(k, max).replace(/\s+/g, " ");
  const content: StudioContent = {
    heroTitle: one("heroTitle", 120) || STUDIO_DEFAULTS.heroTitle,
    heroLead: one("heroLead", 300),
    heroImage: imageUrl(fd.get("heroImage")),
    introTitle: one("introTitle", 150),
    introBody: str("introBody", 2000).replace(/\n{3,}/g, "\n\n"),
    introImage: imageUrl(fd.get("introImage")),
    stats: STUDIO_DEFAULTS.stats.map((_, i) => ({ value: one(`stats.${i}.value`, 20), label: one(`stats.${i}.label`, 60) })),
    services: STUDIO_DEFAULTS.services.map((_, i) => ({
      title: one(`services.${i}.title`, 60),
      body: one(`services.${i}.body`, 300),
      image: imageUrl(fd.get(`services.${i}.image`)),
    })),
    contact: {
      area: one("contact.area", 120),
      phone: one("contact.phone", 30).replace(/[^\d+ .()-]/g, ""),
      email: /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(one("contact.email", 120)) ? one("contact.email", 120) : "",
      address: one("contact.address", 200),
      hours: one("contact.hours", 120),
      zalo: webUrl(fd.get("contact.zalo")),
      facebook: webUrl(fd.get("contact.facebook")),
      instagram: webUrl(fd.get("contact.instagram")),
      tiktok: webUrl(fd.get("contact.tiktok")),
    },
  };
  await saveStudio(content);
  refreshPublic();
  revalidatePath("/admin/studio");
  redirect("/admin/studio?saved=1");
}

// ---------------- Album ----------------

async function uniqueSlug(base: string, exceptId?: string) {
  const root = toSlug(base) || "album";
  for (let i = 0; ; i++) {
    const slug = i ? `${root}-${i + 1}` : root;
    const hit = await db.album.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === exceptId) return slug;
  }
}

export async function createAlbumAction(fd: FormData) {
  await requireAdmin();
  const title = String(fd.get("title") ?? "").trim().slice(0, 120);
  if (!title) redirect("/admin/albums?error=title");
  const category = String(fd.get("category") ?? "");
  const last = await db.album.aggregate({ _max: { sortOrder: true } });
  const album = await db.album.create({
    data: { title, slug: await uniqueSlug(title), category: isCategory(category) ? category : "studio", sortOrder: (last._max.sortOrder ?? 0) + 1 },
  });
  redirect(`/admin/albums/${album.id}`);
}

export async function updateAlbumAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const old = await db.album.findUnique({ where: { id } });
  if (!old) redirect("/admin/albums");
  const title = String(fd.get("title") ?? "").trim().slice(0, 120) || old.title;
  const wantSlug = toSlug(String(fd.get("slug") ?? "")) || title;
  const category = String(fd.get("category") ?? "");
  const album = await db.album.update({
    where: { id },
    data: {
      title,
      slug: await uniqueSlug(wantSlug, id),
      description: String(fd.get("description") ?? "").replace(/\r\n?/g, "\n").trim().slice(0, 2000),
      location: String(fd.get("location") ?? "").trim().slice(0, 120),
      category: isCategory(category) ? category : old.category,
      status: fd.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      featured: fd.get("featured") === "on",
      sortOrder: Number(fd.get("sortOrder") ?? old.sortOrder) || 0,
    },
  });
  refreshPublic(old.slug);
  if (album.slug !== old.slug) refreshPublic(album.slug);
  revalidatePath("/admin/albums");
  redirect(`/admin/albums/${id}?saved=1`);
}

/** Xoá file trong uploads/ nếu không còn album/ảnh nào khác dùng. */
async function removeUploads(urls: string[]) {
  for (const url of urls) {
    const name = url.replace(/^\/api\/files\//, "");
    if (name === url || !FILE_NAME_RE.test(name)) continue;
    const used = await db.albumPhoto.count({ where: { url } });
    if (!used) await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
  }
}

export async function deleteAlbumAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const album = await db.album.findUnique({ where: { id }, include: { photos: { select: { url: true } } } });
  if (album) {
    await db.album.delete({ where: { id } });
    await removeUploads(album.photos.map((p) => p.url));
    refreshPublic(album.slug);
  }
  revalidatePath("/admin/albums");
  redirect("/admin/albums?deleted=1");
}

// Các action dưới đây được gọi trực tiếp từ trình quản lý ảnh (client component).

export async function addAlbumPhotosAction(albumId: string, photos: { url: string; width: number; height: number }[]) {
  await requireAdmin();
  const album = await db.album.findUnique({ where: { id: albumId }, select: { slug: true } });
  if (!album) return { error: "Không tìm thấy album." };
  const clean = photos
    .slice(0, 200)
    .map((p) => ({ url: imageUrl(p.url), width: Math.max(0, Math.round(Number(p.width) || 0)), height: Math.max(0, Math.round(Number(p.height) || 0)) }))
    .filter((p) => p.url);
  const last = await db.albumPhoto.aggregate({ where: { albumId }, _max: { sortOrder: true } });
  const start = (last._max.sortOrder ?? -1) + 1;
  await db.albumPhoto.createMany({ data: clean.map((p, i) => ({ ...p, albumId, sortOrder: start + i })) });
  refreshPublic(album.slug);
  revalidatePath(`/admin/albums/${albumId}`);
  return { ok: true };
}

export async function deleteAlbumPhotoAction(photoId: string) {
  await requireAdmin();
  const photo = await db.albumPhoto.findUnique({ where: { id: photoId }, include: { album: { select: { id: true, slug: true, coverUrl: true } } } });
  if (!photo) return;
  await db.albumPhoto.delete({ where: { id: photoId } });
  if (photo.album.coverUrl === photo.url) await db.album.update({ where: { id: photo.album.id }, data: { coverUrl: "" } });
  await removeUploads([photo.url]);
  refreshPublic(photo.album.slug);
  revalidatePath(`/admin/albums/${photo.album.id}`);
}

export async function reorderAlbumPhotosAction(albumId: string, ids: string[]) {
  await requireAdmin();
  const album = await db.album.findUnique({ where: { id: albumId }, select: { slug: true } });
  if (!album) return;
  await db.$transaction(ids.slice(0, 500).map((id, i) => db.albumPhoto.updateMany({ where: { id, albumId }, data: { sortOrder: i } })));
  refreshPublic(album.slug);
  revalidatePath(`/admin/albums/${albumId}`);
}

export async function setAlbumCoverAction(albumId: string, url: string) {
  await requireAdmin();
  const album = await db.album.update({ where: { id: albumId }, data: { coverUrl: imageUrl(url) } });
  refreshPublic(album.slug);
  revalidatePath(`/admin/albums/${albumId}`);
}
