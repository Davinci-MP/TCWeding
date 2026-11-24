import "server-only";
import { db } from "@/lib/db";

/** Loại album. Thứ tự này cũng là thứ tự bộ lọc trên /bo-suu-tap. */
export const ALBUM_CATEGORIES = [
  { id: "studio", label: "Studio" },
  { id: "ngoai-canh", label: "Ngoại cảnh" },
  { id: "phong-su", label: "Phóng sự cưới" },
] as const;
export type AlbumCategory = (typeof ALBUM_CATEGORIES)[number]["id"];
export const categoryLabel = (id: string) => ALBUM_CATEGORIES.find((c) => c.id === id)?.label ?? "";
export const isCategory = (id: string): id is AlbumCategory => ALBUM_CATEGORIES.some((c) => c.id === id);

export type StudioService = { title: string; body: string; image: string };
export type StudioStat = { value: string; label: string };
export type StudioContent = {
  heroTitle: string;
  heroLead: string;
  heroImage: string;
  introTitle: string;
  introBody: string;
  introImage: string;
  /** Chỉ hiện các con số có đủ giá trị và nhãn — không tự điền số giả. */
  stats: StudioStat[];
  services: StudioService[];
  contact: {
    area: string;
    phone: string;
    email: string;
    address: string;
    hours: string;
    zalo: string;
    facebook: string;
    instagram: string;
    tiktok: string;
  };
};

export const STUDIO_DEFAULTS: StudioContent = {
  heroTitle: "Ảnh cưới giữ nguyên cách hai bạn nhìn nhau",
  heroLead: "Chụp ảnh cưới studio và ngoại cảnh, thiệp mời online và album in cho các cặp đôi.",
  heroImage: "",
  introTitle: "Một ekip nhỏ, theo hai bạn từ buổi tư vấn đến cuốn album",
  introBody:
    "TCWedding chụp ít buổi mỗi tháng để dành đủ thời gian cho từng cặp đôi: chọn concept, chọn trang phục, chụp và chỉnh màu.",
  introImage: "",
  stats: [
    { value: "", label: "" },
    { value: "", label: "" },
    { value: "", label: "" },
  ],
  services: [
    { title: "Chụp ảnh cưới", body: "Studio, ngoại cảnh và phóng sự ngày cưới. Tư vấn concept, trang phục và địa điểm trước buổi chụp.", image: "" },
    { title: "Thiệp mời online", body: "Thiệp cưới gửi bằng một đường link: khách xác nhận tham dự, xem bản đồ và gửi lời chúc ngay trên điện thoại.", image: "" },
    { title: "Album & ảnh in", body: "Thiết kế và in album cưới, ảnh phóng lớn treo tường từ chính bộ ảnh của hai bạn.", image: "" },
  ],
  contact: { area: "", phone: "", email: "", address: "", hours: "", zalo: "", facebook: "", instagram: "", tiktok: "" },
};

const KEY = "studio";

/** Nội dung trang chủ studio: bản admin đã lưu trộn với mặc định để luôn đủ trường. */
export async function getStudio(): Promise<StudioContent> {
  const row = await db.siteSetting.findUnique({ where: { key: KEY } }).catch(() => null);
  if (!row) return STUDIO_DEFAULTS;
  try {
    const s = JSON.parse(row.value) as Partial<StudioContent>;
    const d = STUDIO_DEFAULTS;
    return {
      ...d,
      ...s,
      stats: d.stats.map((x, i) => ({ ...x, ...s.stats?.[i] })),
      services: d.services.map((x, i) => ({ ...x, ...s.services?.[i] })),
      contact: { ...d.contact, ...s.contact },
    };
  } catch {
    return STUDIO_DEFAULTS;
  }
}

export async function saveStudio(content: StudioContent) {
  const value = JSON.stringify(content);
  await db.siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
}

/** Link gọi điện / Zalo từ số điện thoại người quản trị nhập. */
export function contactLinks(c: StudioContent["contact"]) {
  const digits = c.phone.replace(/\D/g, "");
  return {
    tel: digits ? `tel:${c.phone.trim().startsWith("+") ? "+" : ""}${digits}` : "",
    zalo: c.zalo || (digits ? `https://zalo.me/${digits}` : ""),
    mail: c.email ? `mailto:${c.email}` : "",
  };
}

const coverOf = (a: { coverUrl: string; photos: { url: string; width: number; height: number }[] }) => {
  const p = a.coverUrl ? a.photos.find((x) => x.url === a.coverUrl) ?? { url: a.coverUrl, width: 0, height: 0 } : a.photos[0];
  return p ?? null;
};

/** Album đã xuất bản, kèm ảnh bìa và số ảnh. `featuredFirst` đưa album nổi bật lên đầu (dùng ở trang chủ). */
export async function listPublishedAlbums(opts: { category?: string; take?: number; featuredFirst?: boolean } = {}) {
  const rows = await db.album.findMany({
    where: { status: "PUBLISHED", ...(opts.category ? { category: opts.category } : {}) },
    orderBy: opts.featuredFirst ? [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }] : [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: opts.take,
    include: { photos: { orderBy: { sortOrder: "asc" }, select: { url: true, width: true, height: true } } },
  });
  return rows.map(({ photos, ...a }) => ({ ...a, cover: coverOf({ coverUrl: a.coverUrl, photos }), photoCount: photos.length }));
}
export type AlbumCard = Awaited<ReturnType<typeof listPublishedAlbums>>[number];

export async function getPublishedAlbum(slug: string) {
  const a = await db.album.findUnique({ where: { slug }, include: { photos: { orderBy: { sortOrder: "asc" } } } });
  if (!a || a.status !== "PUBLISHED") return null;
  return { ...a, cover: coverOf(a) };
}

/** Một ảnh dọc trong các album đã xuất bản, không trùng ảnh bìa — dùng khi admin chưa chọn ảnh phần giới thiệu. */
export async function pickPortraitPhoto(exclude: string[]) {
  const rows = await db.albumPhoto.findMany({
    where: { album: { status: "PUBLISHED" }, url: { notIn: exclude } },
    orderBy: [{ album: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    take: 40,
    select: { url: true, width: true, height: true },
  });
  return rows.find((p) => p.height > p.width)?.url ?? rows[0]?.url ?? "";
}
