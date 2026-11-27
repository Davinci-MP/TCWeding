// Luồng khách chọn mẫu & điền thông tin làm thiệp ở /thiep (không cần tài khoản).
// Dùng được cả client lẫn server.

import { DEMO_COUPLE, DEMO_PHOTOS, defaultInvitationData, uid, unsplash, type InvitationData } from "@/lib/invitation";
import { lunarText } from "@/lib/lunar";
import { FONTS } from "@/lib/fonts";
import { ALL_PALETTES } from "@/templates/palettes";
import { TEMPLATES, type TemplateDef } from "@/templates/registry";

/* ------------------------------ Mã mẫu ------------------------------ */

/** Mã ngắn hiển thị cho khách và dùng trên URL: TC-01, TC-02… (theo thứ tự trong registry, chỉ thêm vào cuối). */
export function templateCode(id: string) {
  const i = TEMPLATES.findIndex((t) => t.id === id);
  return i < 0 ? "" : `TC-${String(i + 1).padStart(2, "0")}`;
}

/** Nhận "tc-02", "TC-02" hoặc id gốc ("classic-ivory"), trả về id gốc. */
export function templateIdFrom(codeOrId: string) {
  const s = decodeURIComponent(codeOrId).trim().toLowerCase();
  const m = /^tc-(\d{1,3})$/.exec(s);
  if (m) return TEMPLATES[Number(m[1]) - 1]?.id ?? "";
  return TEMPLATES.some((t) => t.id === s) ? s : "";
}

export const templateHash = (id: string) => templateCode(id).toLowerCase();

/** Dữ liệu gọn của một mẫu để gửi xuống trình duyệt (thư viện mẫu, trang chủ). */
export function toTplLite(t: TemplateDef & { isPremium: boolean }) {
  const base = t.baseId ? TEMPLATES.find((x) => x.id === t.baseId) : undefined;
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    premium: t.isPremium,
    fonts: fontLabel(t),
    design: (base ?? t).name,
    color: t.colorName ?? "Màu gốc",
  };
}

/** Tên font hiển thị gọn: "'Playfair Display', serif" → "Playfair Display". */
export const fontLabel = (t: Pick<TemplateDef, "fonts">) =>
  [t.fonts.heading, t.fonts.script].map((f) => f.split(",")[0].replace(/['"]/g, "").trim()).filter((v, i, a) => a.indexOf(v) === i).join(" · ");

/** Mô tả ngắn một mẫu: bộ sưu tập · tông màu. */
export const templateMeta = (t: Pick<TemplateDef, "category" | "name">) => `${t.category} · ${t.name}`;

/* ------------------------------ Bản nháp ------------------------------ */

export type DraftEvent = { id: string; title: string; date: string; time: string; lunar: string; venue: string; address: string; mapUrl: string };
export type DraftGift = { name: string; bank: string; number: string; qr: string };

export type ThiepDraft = {
  templateId: string;
  groom: { name: string; rank: string; father: string; mother: string; address: string };
  bride: { name: string; rank: string; father: string; mother: string; address: string };
  events: DraftEvent[];
  gifts: { groom: DraftGift; bride: DraftGift };
  /** "" = để studio chọn; "track:<id>" nhạc dựng sẵn; "lib:<id>" thư viện nhạc; "other" bài khác */
  music: string;
  musicYoutube: string;
  slideshow: boolean;
  slideshowId: string;
  /** Ảnh đã tải lên (/api/files/... hoặc Vercel Blob). */
  photos: string[];
  photoLinks: string;
  contactName: string;
  phone: string;
  note: string;
};

const emptyGift = (): DraftGift => ({ name: "", bank: "", number: "", qr: "" });
export const emptyEvent = (title = ""): DraftEvent => ({ id: uid(), title, date: "", time: "", lunar: "", venue: "", address: "", mapUrl: "" });

export function emptyDraft(templateId = ""): ThiepDraft {
  return {
    templateId,
    groom: { name: "", rank: "", father: "", mother: "", address: "" },
    bride: { name: "", rank: "", father: "", mother: "", address: "" },
    events: [emptyEvent("Lễ Vu Quy"), emptyEvent("Lễ Thành Hôn"), emptyEvent("Tiệc Cưới")],
    gifts: { groom: emptyGift(), bride: emptyGift() },
    music: "",
    musicYoutube: "",
    slideshow: false,
    slideshowId: "",
    photos: [],
    photoLinks: "",
    contactName: "",
    phone: "",
    note: "",
  };
}

/** Thông tin mẫu để khách "Điền thử" và xem ngay thiệp trông thế nào. */
export function sampleDraft(templateId: string): ThiepDraft {
  const d = emptyDraft(templateId);
  const ev = (title: string, date: string, time: string, venue: string, address: string): DraftEvent => ({ ...emptyEvent(title), date, time, lunar: lunarText(date), venue, address });
  return {
    ...d,
    groom: { name: DEMO_COUPLE.groom, rank: "Trưởng nam", father: "Ông Trần Văn Hùng", mother: "Bà Nguyễn Thị Lan", address: "Phường Hưng Bình, TP Vinh, Nghệ An" },
    bride: { name: DEMO_COUPLE.bride, rank: "Út nữ", father: "Ông Lê Quang Minh", mother: "Bà Phạm Thị Hoa", address: "Thị trấn Nghi Xuân, Hà Tĩnh" },
    events: [
      ev("Lễ Vu Quy", "2027-01-09", "08:30", "Tư gia nhà gái", "Thị trấn Nghi Xuân, Hà Tĩnh"),
      ev("Lễ Thành Hôn", "2027-01-10", "09:00", "Tư gia nhà trai", "Phường Hưng Bình, TP Vinh, Nghệ An"),
      ev("Tiệc Cưới", "2027-01-10", "17:30", "Trung tâm tiệc cưới Hoa Sen", "Đường Lê Hồng Phong, TP Vinh, Nghệ An"),
    ],
  };
}

/** Đọc bản nháp lưu trên máy, trộn với mặc định để luôn đủ trường. */
export function normalizeDraft(raw: unknown): ThiepDraft {
  const base = emptyDraft();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<ThiepDraft>;
  const str = (v: unknown, max = 300) => (typeof v === "string" ? v.slice(0, max) : "");
  const person = (p: unknown) => {
    const x = (p ?? {}) as Record<string, unknown>;
    return { name: str(x.name, 60), rank: str(x.rank, 40), father: str(x.father, 80), mother: str(x.mother, 80), address: str(x.address, 200) };
  };
  const gift = (g: unknown): DraftGift => {
    const x = (g ?? {}) as Record<string, unknown>;
    return { name: str(x.name, 80), bank: str(x.bank, 80), number: str(x.number, 30), qr: safeFile(str(x.qr)) };
  };
  const events = Array.isArray(r.events)
    ? r.events.slice(0, 8).map((e) => {
        const x = (e ?? {}) as Record<string, unknown>;
        return {
          id: str(x.id, 40) || uid(),
          title: str(x.title, 60),
          date: /^\d{4}-\d{2}-\d{2}$/.test(str(x.date)) ? str(x.date) : "",
          time: /^\d{2}:\d{2}$/.test(str(x.time)) ? str(x.time) : "",
          lunar: str(x.lunar, 80),
          venue: str(x.venue, 120),
          address: str(x.address, 200),
          mapUrl: /^https:\/\//.test(str(x.mapUrl)) ? str(x.mapUrl, 500) : "",
        };
      })
    : base.events;
  return {
    templateId: str(r.templateId, 60),
    groom: person(r.groom),
    bride: person(r.bride),
    events,
    gifts: { groom: gift(r.gifts?.groom), bride: gift(r.gifts?.bride) },
    music: str(r.music, 80),
    musicYoutube: str(r.musicYoutube, 300),
    slideshow: !!r.slideshow,
    slideshowId: str(r.slideshowId, 20),
    photos: Array.isArray(r.photos) ? r.photos.map((u) => safeFile(str(u))).filter(Boolean).slice(0, MAX_THIEP_PHOTOS) : [],
    photoLinks: str(r.photoLinks, 1000),
    contactName: str(r.contactName, 80),
    phone: str(r.phone, 20),
    note: str(r.note, 2000),
  };
}

export const MAX_THIEP_PHOTOS = 30;
/** Chỉ nhận file đã tải lên hệ thống: ổ đĩa (/api/files/…) hoặc Vercel Blob (thư mục uploads/). */
export const safeFile = (u: string) =>
  /^\/api\/files\/[a-z0-9]{16,40}\.(jpg|png|webp)$/.test(u) || /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/uploads\/[a-z0-9]{16,40}\.(jpg|png|webp)$/.test(u) ? u : "";

/** Ngày cưới chính: ngày của lễ có chữ "thành hôn"/"tiệc", không có thì lễ đầu tiên có ngày. */
export function mainDate(d: ThiepDraft) {
  const dated = d.events.filter((e) => e.date);
  const main = dated.find((e) => /thành hôn/i.test(e.title)) ?? dated.find((e) => /tiệc/i.test(e.title)) ?? dated[0];
  return main ? { date: main.date, time: main.time || "11:00" } : null;
}

/** Bản nháp → dữ liệu thiệp để xem trước và để admin dựng thiệp. Thiếu ảnh thì dùng ảnh minh hoạ khi xem trước. */
export function draftToInvitationData(d: ThiepDraft, opts: { demoPhotos?: boolean } = {}): InvitationData {
  const data = defaultInvitationData();
  const photos = d.photos.length ? d.photos : opts.demoPhotos ? DEMO_GALLERY : [];
  data.groom = { ...data.groom, name: d.groom.name || "Chú Rể", fullName: d.groom.name, father: d.groom.father, mother: d.groom.mother, address: d.groom.address, bio: d.groom.rank };
  data.bride = { ...data.bride, name: d.bride.name || "Cô Dâu", fullName: d.bride.name, father: d.bride.father, mother: d.bride.mother, address: d.bride.address, bio: d.bride.rank };
  const main = mainDate(d);
  data.weddingDate = main ? `${main.date}T${main.time}` : "";
  const events = d.events.filter((e) => e.title || e.date || e.venue);
  if (events.length)
    data.events = events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date ? `${e.date}T${e.time || "11:00"}` : "",
      lunarDate: e.lunar || lunarText(e.date),
      venue: e.venue,
      address: e.address,
      mapUrl: e.mapUrl,
    }));
  data.coverPhoto = photos[0] ?? "";
  data.featurePhoto = photos[1] ?? "";
  data.thankYouPhoto = photos[photos.length - 1] ?? "";
  data.gallery = photos;
  data.gifts = (
    [
      ["Mừng cưới nhà trai", d.gifts.groom],
      ["Mừng cưới nhà gái", d.gifts.bride],
    ] as const
  )
    .filter(([, g]) => g.number || g.qr)
    .map(([label, g]) => ({ id: uid(), label, bankCode: "", bankName: g.bank, accountNumber: g.number, accountName: g.name, qrImage: g.qr }));
  if (d.music.startsWith("track:")) data.music = d.music.slice(6);
  if (!data.gifts.length) data.sections = { ...data.sections, gift: false };
  data.sections = { ...data.sections, story: false, schedule: false, video: false, dresscode: false, faq: false, quote: false };
  return data;
}

const DEMO_GALLERY = (["coupleClose", "coupleField", "coupleLaugh", "coupleVeilKiss", "coupleSunset", "rings", "coupleHill", "bouquet"] as const).map((k) => unsplash(DEMO_PHOTOS[k], 1200));

/** Tóm tắt các mục không nằm trong dữ liệu thiệp, để admin đọc trong đơn. */
export function draftExtras(d: ThiepDraft, musicLabel: string, slideshowLabel: string) {
  const lines = [
    d.groom.rank && `Thứ bậc chú rể: ${d.groom.rank}`,
    d.bride.rank && `Thứ bậc cô dâu: ${d.bride.rank}`,
    `Nhạc nền: ${musicLabel}`,
    d.musicYoutube && `Link nhạc YouTube: ${d.musicYoutube}`,
    d.slideshow ? `Làm thêm video slideshow: CÓ${slideshowLabel ? ` (mẫu ${slideshowLabel})` : ""}` : "",
    d.photoLinks && `Link ảnh: ${d.photoLinks}`,
    d.note && `Yêu cầu thêm: ${d.note}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/* ------------------------------ Slideshow ------------------------------ */

export const SLIDE_SCRIPTS = [
  { id: "chao", label: "Lời chào & tri ân", title: "Cùng nhau viết nên ngày hạnh phúc", line: "Trân trọng chào đón gia đình và những người thân yêu." },
  { id: "cam-on", label: "Cảm ơn mọi người", title: "Chào mừng đến với ngày vui", line: "Cảm ơn mọi người đã đến chung vui cùng chúng mình." },
  { id: "bo-me", label: "Tri ân bố mẹ", title: "Gửi bố mẹ", line: "Thước phim nhỏ chúng con dành tặng bố mẹ hai bên." },
  { id: "love", label: "Love story", title: "Our love story", line: "Chuyện tình của chúng mình, kể bằng những khung hình." },
  // Thêm sau — chỉ dùng cho mẫu từ SS-31 trở đi để mẫu cũ không đổi
  { id: "save-date", label: "Save the date", title: "Save the date", line: "Hẹn gặp bạn trong ngày vui của chúng mình." },
  { id: "hanh-trinh", label: "Hành trình yêu", title: "Hành trình của chúng mình", line: "Từ lần đầu gặp gỡ đến ngày về chung một nhà." },
  { id: "dem-nguoc", label: "Đếm ngược giờ G", title: "Chỉ còn ít phút nữa thôi", line: "Cô dâu chú rể sắp bước ra lễ đường." },
  { id: "loi-cam-on", label: "Lời cảm ơn cuối tiệc", title: "Cảm ơn vì đã ở đây", line: "Sự hiện diện của bạn là món quà ý nghĩa nhất." },
] as const;

export const SLIDE_MOTIONS = [
  { id: "fade", label: "Nhẹ nhàng" },
  { id: "slide", label: "Lướt ngang" },
  { id: "cinema", label: "Điện ảnh" },
  // Thêm sau
  { id: "kenburns", label: "Phóng chậm" },
  { id: "polaroid", label: "Khung Polaroid" },
  { id: "split", label: "Chia đôi khung hình" },
  { id: "film", label: "Cuộn phim" },
] as const;

export type SlideStyle = {
  id: string;
  code: string;
  script: (typeof SLIDE_SCRIPTS)[number];
  motion: (typeof SLIDE_MOTIONS)[number];
  /** Tông màu lấy từ một mẫu thiệp (hoặc một bảng màu) để video cùng tông với thiệp. */
  palette: { name: string; bg: string; text: string; accent: string; heading: string; script: string };
};

const OLD_SCRIPTS = 4;
const OLD_MOTIONS = 3;
const OLD_STYLES = 30;
const code = (n: number) => `SS-${String(n).padStart(2, "0")}`;

/**
 * Mẫu slideshow:
 * 1. Mỗi mẫu thiệp sinh một mẫu cùng tông màu (SS-01…). 30 mẫu đầu giữ nguyên kịch bản/chuyển cảnh như trước.
 * 2. Thêm mỗi bảng màu × 4 kiểu khung hình mới (Phóng chậm, Polaroid, Chia đôi, Cuộn phim).
 * Chỉ thêm vào cuối để mã SS-xx khách đã chọn không đổi.
 */
const fromTemplates: SlideStyle[] = TEMPLATES.map((t, i) => {
  const old = i < OLD_STYLES;
  return {
    id: code(i + 1).toLowerCase(),
    code: code(i + 1),
    script: SLIDE_SCRIPTS[old ? i % OLD_SCRIPTS : i % SLIDE_SCRIPTS.length],
    motion: SLIDE_MOTIONS[old ? Math.floor(i / OLD_SCRIPTS) % OLD_MOTIONS : Math.floor(i / SLIDE_SCRIPTS.length) % SLIDE_MOTIONS.length],
    palette: { name: t.name, bg: t.colors.heroBg, text: t.colors.heroText, accent: t.colors.primary, heading: t.fonts.heading, script: t.fonts.script },
  };
});

const SERIFS = FONTS.filter((f) => f.kind === "serif");
const SCRIPTS = FONTS.filter((f) => f.kind === "script" && !["Patrick Hand", "Pangolin", "Itim", "Mali"].includes(f.name));
const NEW_MOTIONS = SLIDE_MOTIONS.slice(OLD_MOTIONS);
const fromPalettes: SlideStyle[] = ALL_PALETTES.flatMap((p, pi) =>
  NEW_MOTIONS.map((m, mi) => {
    const n = TEMPLATES.length + pi * NEW_MOTIONS.length + mi + 1;
    const heading = SERIFS[(pi + mi) % SERIFS.length];
    const script = SCRIPTS[(pi * 3 + mi) % SCRIPTS.length];
    return {
      id: code(n).toLowerCase(),
      code: code(n),
      script: SLIDE_SCRIPTS[(pi + mi * 3) % SLIDE_SCRIPTS.length],
      motion: m,
      palette: { name: p.name, bg: p.colors.heroBg, text: p.colors.heroText, accent: p.colors.primary, heading: `'${heading.name}', serif`, script: `'${script.name}', cursive` },
    };
  }),
);

export const SLIDE_STYLES: SlideStyle[] = [...fromTemplates, ...fromPalettes];
export const getSlideStyle = (id: string) => SLIDE_STYLES.find((s) => s.id === id.toLowerCase());

/** Ảnh minh hoạ cho xem trước slideshow (12 cảnh = mở đầu + 10 ảnh + kết). */
export const SLIDE_DEMO_PHOTOS = (
  ["coupleClose", "coupleField", "coupleLaugh", "coupleVeilKiss", "coupleSunset", "coupleHill", "coupleWalk", "coupleBeach", "coupleForehead", "coupleDance"] as const
).map((k) => unsplash(DEMO_PHOTOS[k], 1280));
