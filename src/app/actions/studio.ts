"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { toSlug } from "@/lib/invitation";
import { sendNotice } from "@/lib/notify";
import { rateLimit } from "@/lib/rateLimit";
import {
  BOOKING_STATUS,
  PACKAGE_DEFAULTS,
  STUDIO_DEFAULTS,
  bookingServices,
  isAlbumSize,
  isCategory,
  isSampleStyle,
  savePackages,
  saveStudio,
  type FavoritePhoto,
  type StudioContent,
  type StudioPackage,
} from "@/lib/studio";
import { deleteUpload, isUploadUrl } from "@/lib/storage";

type Kind = "COLLECTION" | "SAMPLE";
const kindOf = (v: unknown): Kind => (v === "SAMPLE" ? "SAMPLE" : "COLLECTION");
const validCategory = (kind: Kind, c: string) => (kind === "SAMPLE" ? isSampleStyle(c) : isCategory(c));
const defaultCategory = (kind: Kind) => (kind === "SAMPLE" ? "prewedding" : "studio");
const listPath = (kind: Kind) => (kind === "SAMPLE" ? "/admin/ghep-album" : "/admin/albums");

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
  revalidatePath("/ghep-album");
  if (slug) revalidatePath(`/bo-suu-tap/${slug}`);
}

export async function saveStudioAction(fd: FormData) {
  await requireAdmin();
  const str = (k: string, max = 200) => String(fd.get(k) ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
  const one = (k: string, max = 200) => str(k, max).replace(/\s+/g, " ");
  const content: StudioContent = {
    seoTitle: one("seoTitle", 70),
    seoDescription: one("seoDescription", 200),
    footerText: one("footerText", 200),
    pricingNote: one("pricingNote", 300),
    albumNote: str("albumNote", 600),
    steps: STUDIO_DEFAULTS.steps.map((_, i) => ({ title: one(`steps.${i}.title`, 60), body: one(`steps.${i}.body`, 300) })),
    faqs: STUDIO_DEFAULTS.faqs.map((_, i) => ({ q: one(`faqs.${i}.q`, 200), a: str(`faqs.${i}.a`, 1000) })),
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
  revalidatePath("/", "layout"); // chân trang và các trang dùng chung nội dung
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
  const kind = kindOf(fd.get("kind"));
  if (!title) redirect(`${listPath(kind)}?error=title`);
  const category = String(fd.get("category") ?? "");
  const size = String(fd.get("size") ?? "");
  const last = await db.album.aggregate({ where: { kind }, _max: { sortOrder: true } });
  const album = await db.album.create({
    data: {
      kind,
      title,
      slug: await uniqueSlug(title),
      category: validCategory(kind, category) ? category : defaultCategory(kind),
      size: kind === "SAMPLE" && isAlbumSize(size) ? size : kind === "SAMPLE" ? "30x30" : "",
      sortOrder: (last._max.sortOrder ?? 0) + 1,
    },
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
  const kind = kindOf(old.kind);
  const size = String(fd.get("size") ?? "");
  const album = await db.album.update({
    where: { id },
    data: {
      title,
      slug: await uniqueSlug(wantSlug, id),
      description: String(fd.get("description") ?? "").replace(/\r\n?/g, "\n").trim().slice(0, 2000),
      location: String(fd.get("location") ?? "").trim().slice(0, 120),
      category: validCategory(kind, category) ? category : old.category,
      size: kind === "SAMPLE" && isAlbumSize(size) ? size : old.size,
      status: fd.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      featured: fd.get("featured") === "on",
      sortOrder: Number(fd.get("sortOrder") ?? old.sortOrder) || 0,
    },
  });
  refreshPublic(old.slug);
  if (album.slug !== old.slug) refreshPublic(album.slug);
  revalidatePath(listPath(kind));
  redirect(`/admin/albums/${id}?saved=1`);
}

/** Xoá file đã tải lên (ổ đĩa hoặc Vercel Blob) nếu không còn album/ảnh nào khác dùng. */
async function removeUploads(urls: string[]) {
  for (const url of urls) {
    if (!isUploadUrl(url)) continue;
    const used = await db.albumPhoto.count({ where: { url } });
    if (!used) await deleteUpload(url);
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
  const back = listPath(kindOf(album?.kind));
  revalidatePath(back);
  redirect(`${back}?deleted=1`);
}

// ---------------- Bảng giá gói chụp ----------------

export async function savePackagesAction(fd: FormData) {
  await requireAdmin();
  const one = (k: string, max: number) => String(fd.get(k) ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const pkgs: StudioPackage[] = PACKAGE_DEFAULTS.map((d) => ({
    id: d.id,
    name: one(`${d.id}.name`, 40),
    price: one(`${d.id}.price`, 30),
    unit: one(`${d.id}.unit`, 40),
    tagline: one(`${d.id}.tagline`, 200),
    features: String(fd.get(`${d.id}.features`) ?? "")
      .split(/\r?\n/)
      .map((l) => l.trim().slice(0, 120))
      .filter(Boolean)
      .slice(0, 12),
    highlight: fd.get(`${d.id}.highlight`) === "on",
    badge: one(`${d.id}.badge`, 30),
  }));
  await savePackages(pkgs);
  revalidatePath("/");
  revalidatePath("/admin/studio-pricing");
  redirect("/admin/studio-pricing?saved=1");
}

// ---------------- Đặt lịch tư vấn ----------------

export type BookingState = { error?: string; ok?: boolean } | undefined;

const bookingSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập họ tên").max(80, "Họ tên quá dài"),
  phone: z
    .string()
    .transform((s) => s.replace(/[\s.()-]/g, ""))
    .pipe(z.string().regex(/^(\+84|0)\d{9,10}$/, "Số điện thoại không hợp lệ")),
  shootDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày chụp không hợp lệ")]),
  service: z.string().max(40),
  message: z.string().trim().max(2000, "Lời nhắn quá dài (tối đa 2000 ký tự)"),
});

/** Ảnh khách thả tim: chỉ nhận ảnh thật sự thuộc album đã xuất bản, tối đa 60 ảnh. */
async function cleanFavorites(raw: unknown): Promise<FavoritePhoto[]> {
  let list: unknown;
  try {
    list = JSON.parse(String(raw ?? "[]"));
  } catch {
    return [];
  }
  if (!Array.isArray(list)) return [];
  const urls = [...new Set(list.map((x) => (x && typeof x === "object" ? String((x as { url?: unknown }).url ?? "") : "")).filter(Boolean))].slice(0, 60);
  if (!urls.length) return [];
  const rows = await db.albumPhoto.findMany({
    where: { url: { in: urls }, album: { status: "PUBLISHED" } },
    select: { url: true, album: { select: { slug: true, title: true } } },
  });
  const byUrl = new Map(rows.map((r) => [r.url, r]));
  return urls.flatMap((u) => {
    const r = byUrl.get(u);
    return r ? [{ url: r.url, album: r.album.slug, albumTitle: r.album.title }] : [];
  });
}

export async function createBookingAction(_: BookingState, fd: FormData): Promise<BookingState> {
  if (String(fd.get("website") ?? "")) return { error: "Không gửi được yêu cầu." }; // bẫy bot
  const parsed = bookingSchema.safeParse({
    name: fd.get("name") ?? "",
    phone: fd.get("phone") ?? "",
    shootDate: fd.get("shootDate") ?? "",
    service: fd.get("service") ?? "",
    message: fd.get("message") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
  if (!rateLimit(`booking:${ip}`, 5, 3600_000)) return { error: "Bạn gửi quá nhiều lần, vui lòng thử lại sau hoặc gọi trực tiếp." };

  const services = await bookingServices();
  const service = services.find((s) => s.id === parsed.data.service);
  const favorites = await cleanFavorites(fd.get("favorites"));
  const b = await db.booking.create({
    data: { ...parsed.data, service: service?.id ?? "", favorites: JSON.stringify(favorites) },
  });
  const base = (process.env.APP_URL || "https://tcwedding.vn").replace(/\/$/, "");
  after(() =>
    sendNotice(
      [
        "Yêu cầu tư vấn mới",
        `${b.name} · ${b.phone}`,
        service ? `Dịch vụ: ${service.label}` : "",
        b.shootDate ? `Ngày chụp: ${b.shootDate.split("-").reverse().join("/")}` : "",
        favorites.length ? `Thả tim ${favorites.length} ảnh` : "",
        `${base}/admin/bookings/${b.id}`,
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  );
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function updateBookingAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const status = String(fd.get("status") ?? "");
  await db.booking.update({
    where: { id },
    data: {
      ...(status in BOOKING_STATUS ? { status } : {}),
      adminNote: String(fd.get("adminNote") ?? "").replace(/\r\n?/g, "\n").trim().slice(0, 2000),
    },
  });
  revalidatePath("/admin", "layout");
  redirect(`/admin/bookings/${id}?saved=1`);
}

export async function deleteBookingAction(fd: FormData) {
  await requireAdmin();
  await db.booking.deleteMany({ where: { id: String(fd.get("id")) } });
  revalidatePath("/admin", "layout");
  redirect("/admin/bookings?deleted=1");
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

// ---------------- Trang Về tôi ----------------

export async function saveAboutAction(fd: FormData) {
  await requireAdmin();
  const { ABOUT_DEFAULTS, saveAbout } = await import("@/lib/about");
  const str = (k: string, max = 200) => String(fd.get(k) ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
  const one = (k: string, max = 200) => str(k, max).replace(/\s+/g, " ");
  await saveAbout({
    eyebrow: one("eyebrow", 80),
    headline: one("headline", 200) || ABOUT_DEFAULTS.headline,
    name: one("name", 80) || ABOUT_DEFAULTS.name,
    role: one("role", 120),
    intro: str("intro", 600),
    photo: imageUrl(fd.get("photo")),
    stats: ABOUT_DEFAULTS.stats.map((_, i) => ({ value: one(`stats.${i}.value`, 20), label: one(`stats.${i}.label`, 60) })),
    storyTitle: one("storyTitle", 150),
    storyBody: str("storyBody", 4000).replace(/\n{3,}/g, "\n\n"),
    fieldsTitle: one("fieldsTitle", 100) || ABOUT_DEFAULTS.fieldsTitle,
    fields: ABOUT_DEFAULTS.fields.map((_, i) => ({ title: one(`fields.${i}.title`, 80), body: one(`fields.${i}.body`, 400) })),
    blocks: ABOUT_DEFAULTS.blocks.map((_, i) => ({
      eyebrow: one(`blocks.${i}.eyebrow`, 60),
      title: one(`blocks.${i}.title`, 200),
      body: str(`blocks.${i}.body`, 3000).replace(/\n{3,}/g, "\n\n"),
    })),
    reviewText: one("reviewText", 400),
    reviewUrl: webUrl(fd.get("reviewUrl")),
  });
  revalidatePath("/ve-toi");
  revalidatePath("/admin/about");
  redirect("/admin/about?saved=1");
}
