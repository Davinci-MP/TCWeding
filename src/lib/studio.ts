import "server-only";
import { db } from "@/lib/db";
import { findFont } from "@/lib/fonts";
import { isBodySize, isTitleSize, type BodySize, type TitleSize } from "@/lib/typo";

/** Loại album. Thứ tự này cũng là thứ tự bộ lọc trên /bo-suu-tap. */
export const ALBUM_CATEGORIES = [
  { id: "studio", label: "Studio" },
  { id: "ngoai-canh", label: "Ngoại cảnh" },
  { id: "phong-su", label: "Phóng sự cưới" },
] as const;
export type AlbumCategory = (typeof ALBUM_CATEGORIES)[number]["id"];
export const categoryLabel = (id: string) => ALBUM_CATEGORIES.find((c) => c.id === id)?.label ?? "";
export const isCategory = (id: string): id is AlbumCategory => ALBUM_CATEGORIES.some((c) => c.id === id);

/* ---------------- Album mẫu (album in để khách lật xem) ---------------- */

export const SAMPLE_STYLES = [
  { id: "prewedding", label: "Prewedding" },
  { id: "phong-su", label: "Phóng sự cưới" },
  { id: "anh-phong", label: "Ảnh phóng & ảnh cổng" },
] as const;
export const sampleStyleLabel = (id: string) => SAMPLE_STYLES.find((c) => c.id === id)?.label ?? "";
export const isSampleStyle = (id: string) => SAMPLE_STYLES.some((c) => c.id === id);

/** Khổ album & ảnh phóng (rộng x cao, cm). */
export const ALBUM_SIZE_GROUPS = [
  { id: "vuong", label: "Album vuông", note: "Mở ra thành trải 2:1, hợp cả prewedding lẫn phóng sự.", sizes: ["25x25", "30x30", "35x35", "40x40"] },
  { id: "doc", label: "Album dọc", note: "Tôn dáng cô dâu, hợp ảnh chân dung.", sizes: ["20x30", "25x35", "30x40"] },
  { id: "ngang", label: "Album ngang", note: "Trải rộng như thước phim, hợp ảnh phong cảnh.", sizes: ["30x20", "35x25", "40x30"] },
  { id: "phong", label: "Ảnh phóng · ảnh cổng", note: "Treo phòng cưới hoặc đặt ở cổng tiệc.", sizes: ["40x60", "60x90", "60x160"] },
] as const;
export const ALBUM_SIZES: string[] = ALBUM_SIZE_GROUPS.flatMap((g) => [...g.sizes]);
export const isAlbumSize = (s: string) => ALBUM_SIZES.includes(s);
export const sizeLabel = (s: string) => (s ? `${s.replace("x", " × ")} cm` : "");
/** Tỉ lệ rộng / cao của MỘT trang album, dùng để dựng khung lật trang. */
export function sizeRatio(s: string) {
  const [w, h] = s.split("x").map(Number);
  return w > 0 && h > 0 ? w / h : 1;
}

/* ---------------- Bảng giá gói chụp ---------------- */

export type StudioPackage = {
  id: string;
  name: string;
  price: string;
  unit: string;
  tagline: string;
  features: string[];
  highlight: boolean;
  badge: string;
};

/** Nội dung mẫu: admin sửa giá và quyền lợi thật ở /admin/studio-pricing. */
export const PACKAGE_DEFAULTS: StudioPackage[] = [
  {
    id: "studio",
    name: "Gói Studio",
    price: "Liên hệ",
    unit: "",
    tagline: "Chụp trong studio, gọn gàng và tiết kiệm.",
    features: ["Chụp tại studio, 2 phông nền", "2 bộ trang phục cô dâu, chú rể", "Trang điểm, làm tóc", "30 ảnh chỉnh sửa, 1 album"],
    highlight: false,
    badge: "",
  },
  {
    id: "concept",
    name: "Gói Concept",
    price: "Liên hệ",
    unit: "",
    tagline: "Concept ánh sáng riêng cho hai bạn.",
    features: ["Studio + 2 concept ánh sáng riêng", "3 bộ trang phục cao cấp", "Trang điểm, làm tóc theo concept", "50 ảnh chỉnh sửa, album + ảnh phóng", "Tặng thiệp mời online"],
    highlight: true,
    badge: "Được chọn nhiều",
  },
  {
    id: "tron-goi",
    name: "Gói Trọn gói",
    price: "Liên hệ",
    unit: "",
    tagline: "Studio, ngoại cảnh và mọi thứ cho ngày cưới.",
    features: ["Studio + ngoại cảnh", "4 bộ trang phục", "Ekip trang điểm theo suốt buổi chụp", "Toàn bộ file gốc, album cao cấp", "Thiệp online + slideshow chiếu tiệc"],
    highlight: false,
    badge: "",
  },
];

const PACKAGES_KEY = "studio_packages";

export async function getPackages(): Promise<StudioPackage[]> {
  const row = await db.siteSetting.findUnique({ where: { key: PACKAGES_KEY } }).catch(() => null);
  if (!row) return PACKAGE_DEFAULTS;
  try {
    const saved = JSON.parse(row.value) as Partial<StudioPackage>[];
    return PACKAGE_DEFAULTS.map((d, i) => ({ ...d, ...saved[i], id: d.id }));
  } catch {
    return PACKAGE_DEFAULTS;
  }
}

export async function savePackages(pkgs: StudioPackage[]) {
  const value = JSON.stringify(pkgs);
  await db.siteSetting.upsert({ where: { key: PACKAGES_KEY }, create: { key: PACKAGES_KEY, value }, update: { value } });
}

/* ---------------- Đặt lịch tư vấn ---------------- */

/** Dịch vụ khách chọn trong form: các gói chụp (tên lấy từ bảng giá) + dịch vụ khác cố định. */
export const OTHER_SERVICES = [
  { id: "thiep-moi", label: "Thiệp mời online" },
  { id: "slideshow", label: "Slideshow tiệc cưới" },
  { id: "album", label: "Ghép / in album cưới" },
  { id: "khac", label: "Khác" },
] as const;

export async function bookingServices() {
  const pkgs = await getPackages();
  return [...pkgs.filter((p) => p.name).map((p) => ({ id: p.id, label: p.name })), ...OTHER_SERVICES.map((s) => ({ id: s.id as string, label: s.label as string }))];
}

export const BOOKING_STATUS: Record<string, { label: string; tone: string }> = {
  NEW: { label: "Mới", tone: "bg-red-50 text-red-700" },
  CONTACTED: { label: "Đã liên hệ", tone: "bg-amber-50 text-amber-800" },
  DONE: { label: "Đã chốt", tone: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "Không chốt", tone: "bg-zinc-100 text-zinc-600" },
};

export type FavoritePhoto = { url: string; album: string; albumTitle: string };
export function parseFavorites(json: string): FavoritePhoto[] {
  try {
    const a = JSON.parse(json);
    return Array.isArray(a) ? a.filter((x) => x && typeof x.url === "string") : [];
  } catch {
    return [];
  }
}

export type StudioService = { title: string; body: string; image: string };
export type StudioStat = { value: string; label: string };
export type StudioStep = { title: string; body: string };
export type StudioFaq = { q: string; a: string };
export const STEP_SLOTS = 4;
export const FAQ_SLOTS = 8;
/** Kiểu chữ toàn website: font tiêu đề / nội dung, cỡ tiêu đề đầu trang, cỡ tiêu đề mục, cỡ chữ nội dung. */
export type StudioTypo = { headingFont: string; bodyFont: string; heroSize: TitleSize; titleSize: TitleSize; bodySize: BodySize };
export const TYPO_DEFAULTS: StudioTypo = { headingFont: "Cormorant Garamond", bodyFont: "Be Vietnam Pro", heroSize: "auto", titleSize: "auto", bodySize: "md" };
export function cleanTypo(t: Partial<StudioTypo> | undefined): StudioTypo {
  const d = TYPO_DEFAULTS;
  return {
    headingFont: t?.headingFont && findFont(t.headingFont) ? t.headingFont : d.headingFont,
    bodyFont: t?.bodyFont && findFont(t.bodyFont) ? t.bodyFont : d.bodyFont,
    heroSize: isTitleSize(t?.heroSize) ? t.heroSize : d.heroSize,
    titleSize: isTitleSize(t?.titleSize) ? t.titleSize : d.titleSize,
    bodySize: isBodySize(t?.bodySize) ? t.bodySize : d.bodySize,
  };
}

export type StudioContent = {
  typo: StudioTypo;
  /** Tiêu đề & mô tả hiện trên Google, Facebook, Zalo khi chia sẻ trang chủ. Trống = mặc định. */
  seoTitle: string;
  seoDescription: string;
  /** Câu ngắn dưới logo ở chân trang. */
  footerText: string;
  /** Câu dưới tiêu đề Bảng giá gói chụp. */
  pricingNote: string;
  /** Trang Ghép album: giá và mô tả dịch vụ ghép album (vd "Ghép album 400.000đ, nhận file in 300 DPI"). */
  albumNote: string;
  /** Quy trình (tối đa 4 bước) và hỏi đáp (tối đa 8 câu). Bước/câu trống thì ẩn. */
  steps: StudioStep[];
  faqs: StudioFaq[];
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
  typo: TYPO_DEFAULTS,
  seoTitle: "",
  seoDescription: "",
  footerText: "Chụp ảnh cưới, thiệp mời online và album cưới.",
  pricingNote: "Chi phí cuối cùng được xác nhận sau buổi tư vấn, tuỳ theo concept và hạng mục hai bạn chọn.",
  albumNote: "Studio chọn ảnh, chỉnh màu đồng bộ và dàn trang theo mẫu hai bạn thích. Duyệt bản thiết kế qua Zalo, nhận file in 300 DPI gửi được mọi xưởng in.",
  steps: [
    { title: "Tư vấn", body: "Trao đổi về phong cách, ngày chụp và ngân sách để xây dựng concept riêng cho hai bạn." },
    { title: "Chuẩn bị", body: "Chọn váy cưới, vest và lên phương án trang điểm, làm tóc cùng ekip." },
    { title: "Ngày chụp", body: "Dẫn dắt nhẹ nhàng, kiểm soát ánh sáng để hai bạn thoải mái, tự nhiên." },
    { title: "Hậu kỳ & bàn giao", body: "Chọn ảnh, chỉnh màu, in album và bàn giao file chất lượng cao, kèm thiệp và slideshow nếu cần." },
  ],
  faqs: [
    { q: "Nên chọn phong cách ảnh cưới như thế nào?", a: "Hãy xem bộ sưu tập và thả tim những ảnh hai bạn thích. Gửi danh sách đó khi đặt lịch, studio sẽ dựa vào đó gợi ý concept, trang phục và địa điểm phù hợp." },
    { q: "Nên đặt lịch trước ngày cưới bao lâu?", a: "Nên đặt trước 1–3 tháng, nhất là vào mùa cưới cuối năm, để có thời gian chuẩn bị trang phục và chọn ngày chụp đẹp trời." },
    { q: "Thiệp mời online hoạt động thế nào?", a: "Thiệp là một đường link gửi qua Zalo, Messenger. Khách mời xem bản đồ, xác nhận tham dự và gửi lời chúc ngay trên điện thoại. Hai bạn có thể tự làm hoặc nhờ studio làm bằng chính ảnh cưới." },
    { q: "Album cưới được làm ra sao?", a: "Hai bạn chọn khổ album và một mẫu dàn trang trong mục Album mẫu. Studio chọn ảnh, chỉnh màu đồng bộ, dàn trang và gửi bản duyệt trước khi in." },
    { q: "Làm sao để đặt lịch tư vấn?", a: "Điền form ở cuối trang hoặc nhắn Zalo. Studio sẽ liên hệ lại để hẹn buổi gặp tại studio hoặc gọi video." },
    { q: "", a: "" },
    { q: "", a: "" },
    { q: "", a: "" },
  ],
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
      // Đã lưu thì dùng đúng bản admin lưu (kể cả ô trống), chưa lưu thì dùng mặc định.
      steps: d.steps.map((x, i) => (Array.isArray(s.steps) ? { title: "", body: "", ...(s.steps[i] as Partial<StudioStep> | undefined) } : x)),
      faqs: d.faqs.map((x, i) => (Array.isArray(s.faqs) ? { q: "", a: "", ...(s.faqs[i] as Partial<StudioFaq> | undefined) } : x)),
      contact: { ...d.contact, ...s.contact },
      typo: cleanTypo(s.typo),
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
    where: { kind: "COLLECTION", status: "PUBLISHED", ...(opts.category ? { category: opts.category } : {}) },
    orderBy: opts.featuredFirst ? [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }] : [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: opts.take,
    include: { photos: { orderBy: { sortOrder: "asc" }, select: { url: true, width: true, height: true } } },
  });
  return rows.map(({ photos, ...a }) => ({ ...a, cover: coverOf({ coverUrl: a.coverUrl, photos }), photoCount: photos.length }));
}
export type AlbumCard = Awaited<ReturnType<typeof listPublishedAlbums>>[number];

export async function getPublishedAlbum(slug: string) {
  const a = await db.album.findUnique({ where: { slug }, include: { photos: { orderBy: { sortOrder: "asc" } } } });
  if (!a || a.status !== "PUBLISHED" || a.kind !== "COLLECTION") return null;
  return { ...a, cover: coverOf(a) };
}

/** Album mẫu đã xuất bản, lọc theo phong cách / khổ. */
export async function listSampleAlbums(opts: { style?: string; size?: string } = {}) {
  const rows = await db.album.findMany({
    where: { kind: "SAMPLE", status: "PUBLISHED", ...(opts.style ? { category: opts.style } : {}), ...(opts.size ? { size: opts.size } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { photos: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, width: true, height: true } } },
  });
  return rows.map(({ photos, ...a }) => ({ ...a, photos, cover: coverOf({ coverUrl: a.coverUrl, photos }), photoCount: photos.length }));
}
export type SampleAlbum = Awaited<ReturnType<typeof listSampleAlbums>>[number];

/** Một ảnh dọc trong các album đã xuất bản, không trùng ảnh bìa — dùng khi admin chưa chọn ảnh phần giới thiệu. */
export async function pickPortraitPhoto(exclude: string[]) {
  const rows = await db.albumPhoto.findMany({
    where: { album: { status: "PUBLISHED", kind: "COLLECTION" }, url: { notIn: exclude } },
    orderBy: [{ album: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    take: 40,
    select: { url: true, width: true, height: true },
  });
  return rows.find((p) => p.height > p.width)?.url ?? rows[0]?.url ?? "";
}
