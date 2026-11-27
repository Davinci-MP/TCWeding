// Kiểu dữ liệu nội dung thiệp + giá trị mặc định. Dùng được cả client lẫn server.

import { cleanFieldStyles, type FieldStyles } from "./fieldTypo";

export type Person = {
  name: string; // tên gọi ngắn hiển thị lớn, vd "Minh Anh"
  fullName: string;
  father: string;
  mother: string;
  address: string; // địa chỉ nhà trai/nhà gái
  bio: string;
  photo: string;
};

export type WeddingEvent = {
  id: string;
  title: string; // "Lễ Vu Quy", "Lễ Thành Hôn", "Tiệc cưới"
  date: string; // datetime-local: 2026-12-20T11:00
  lunarDate: string; // "Nhằm ngày 01 tháng 11 năm Bính Ngọ"
  venue: string;
  address: string;
  mapUrl: string;
};

export type StoryItem = { id: string; date: string; title: string; content: string; photo: string };
export type ScheduleItem = { id: string; time: string; title: string; description: string };
export type FaqItem = { id: string; q: string; a: string };

export type GiftAccount = {
  id: string;
  label: string; // "Mừng cưới chú rể"
  bankCode: string; // mã VietQR, vd VCB. Để trống nếu tự tải ảnh QR
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrImage: string;
  /** Bên nhận: "groom" nhà trai, "bride" nhà gái, "" = suy ra từ tiêu đề (thiệp cũ). */
  side?: "groom" | "bride" | "";
};

export type EffectKind = "" | "petals" | "hearts" | "snow" | "stars" | "leaves" | "gold" | "none";

export type SectionKey =
  | "quote"
  | "families"
  | "couple"
  | "calendar"
  | "events"
  | "schedule"
  | "story"
  | "gallery"
  | "video"
  | "dresscode"
  | "faq"
  | "rsvp"
  | "gift"
  | "wishes";

export type InvitationData = {
  groom: Person;
  bride: Person;
  weddingDate: string; // datetime-local, dùng cho đếm ngược
  headline: string;
  invitationText: string;
  coverPhoto: string;
  quote: { text: string; author: string };
  events: WeddingEvent[];
  schedule: ScheduleItem[];
  story: StoryItem[];
  gallery: string[];
  featurePhoto: string; // ảnh tràn màn hình giữa thiệp
  videoUrl: string; // YouTube
  dressCode: { note: string; colors: string[] };
  faqs: FaqItem[];
  gifts: GiftAccount[];
  /** Nhạc nền: "" = theo mẫu, "off" = tắt, "file" = file ở musicUrl, còn lại là mã bài dựng sẵn. */
  music: string;
  musicUrl: string;
  musicName: string; // tên hiển thị của file nhạc
  musicStart: number; // giây bắt đầu phát
  primaryColor: string; // "" = dùng màu của mẫu
  effect: EffectKind; // "" = dùng hiệu ứng của mẫu
  sections: Record<SectionKey, boolean>;
  thankYouPhoto: string;
  closingText: string;
  /** Điểm lấy nét của ảnh nền ("x% y%") — người dùng kéo chỉnh trong trình soạn thảo. */
  photoPos: PhotoPos;
  /** Kiểu chữ riêng (tên font trong src/lib/fonts.ts). "" = dùng font của mẫu. */
  fontHeading: string;
  fontBody: string;
  fontScript: string;
  /** Cỡ chữ tên cô dâu chú rể ở đầu thiệp (1 = theo mẫu). Tên dài vẫn tự thu nhỏ cho vừa màn hình. */
  nameScale: number;
  /** Cỡ chữ phần nội dung (lời mời, gia đình, sự kiện…), 1 = theo mẫu. */
  textScale: number;
  /** Kiểu chữ riêng từng ô (ID ô → font/cỡ chữ), ưu tiên hơn kiểu chữ chung ở trên. Xem src/lib/fieldTypo.ts. */
  fieldStyles: FieldStyles;
};

export const NAME_SCALE_RANGE = { min: 0.6, max: 1.4 } as const;
export const TEXT_SCALE_RANGE = { min: 0.85, max: 1.3 } as const;
const clampNum = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(max, Math.max(min, n)) : 1;
};

export type PhotoPosKey = "cover" | "feature" | "thanks";
export type PhotoPos = Record<PhotoPosKey, string>;
export const DEFAULT_PHOTO_POS: PhotoPos = { cover: "50% 50%", feature: "50% 50%", thanks: "50% 50%" };

export const SECTION_LABELS: Record<SectionKey, string> = {
  quote: "Lời trích dẫn",
  families: "Gia đình hai họ",
  couple: "Cô dâu & Chú rể",
  calendar: "Lịch & đếm ngược",
  events: "Sự kiện cưới",
  schedule: "Lịch trình ngày cưới",
  story: "Chuyện tình yêu",
  gallery: "Album ảnh",
  video: "Video",
  dresscode: "Trang phục",
  faq: "Hỏi đáp",
  rsvp: "Xác nhận tham dự",
  gift: "Hộp mừng cưới",
  wishes: "Sổ lưu bút",
};

export const EFFECT_LABELS: Record<Exclude<EffectKind, "">, string> = {
  petals: "Cánh hoa rơi",
  hearts: "Trái tim bay",
  snow: "Tuyết rơi",
  stars: "Sao lấp lánh",
  leaves: "Lá rơi",
  gold: "Kim tuyến vàng",
  none: "Không hiệu ứng",
};

export const BANKS: { code: string; name: string }[] = [
  { code: "VCB", name: "Vietcombank" },
  { code: "TCB", name: "Techcombank" },
  { code: "MB", name: "MB Bank" },
  { code: "ACB", name: "ACB" },
  { code: "BIDV", name: "BIDV" },
  { code: "ICB", name: "VietinBank" },
  { code: "VPB", name: "VPBank" },
  { code: "TPB", name: "TPBank" },
  { code: "VBA", name: "Agribank" },
  { code: "STB", name: "Sacombank" },
  { code: "VIB", name: "VIB" },
  { code: "SHB", name: "SHB" },
];

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const emptyPerson = (): Person => ({
  name: "",
  fullName: "",
  father: "",
  mother: "",
  address: "",
  bio: "",
  photo: "",
});

const ALL_SECTIONS_ON = Object.fromEntries(Object.keys(SECTION_LABELS).map((k) => [k, true])) as Record<SectionKey, boolean>;

export function defaultInvitationData(): InvitationData {
  return {
    groom: { ...emptyPerson(), name: "Chú Rể" },
    bride: { ...emptyPerson(), name: "Cô Dâu" },
    weddingDate: "",
    headline: "Save the Date",
    invitationText:
      "Trân trọng kính mời bạn đến dự bữa tiệc chung vui cùng gia đình chúng tôi. Sự hiện diện của bạn là niềm vinh hạnh lớn nhất!",
    coverPhoto: "",
    quote: { text: "", author: "" },
    events: [{ id: uid(), title: "Tiệc Cưới", date: "", lunarDate: "", venue: "", address: "", mapUrl: "" }],
    schedule: [],
    story: [],
    gallery: [],
    featurePhoto: "",
    videoUrl: "",
    dressCode: { note: "", colors: [] },
    faqs: [],
    gifts: [],
    music: "",
    musicUrl: "",
    musicName: "",
    musicStart: 0,
    primaryColor: "",
    effect: "",
    sections: { ...ALL_SECTIONS_ON },
    thankYouPhoto: "",
    photoPos: { ...DEFAULT_PHOTO_POS },
    fontHeading: "",
    fontBody: "",
    fontScript: "",
    nameScale: 1,
    textScale: 1,
    fieldStyles: {},
    closingText: "Cảm ơn bạn rất nhiều vì đã gửi những lời chúc mừng tốt đẹp nhất đến đám cưới của chúng tôi!",
  };
}

/** Parse JSON từ DB và trộn với mặc định để luôn đủ trường (an toàn khi thêm trường mới). */
export function parseInvitationData(json: string | null | undefined): InvitationData {
  const base = defaultInvitationData();
  if (!json) return base;
  try {
    const raw = JSON.parse(json) as Partial<InvitationData>;
    return {
      ...base,
      ...raw,
      groom: { ...base.groom, ...raw.groom },
      bride: { ...base.bride, ...raw.bride },
      quote: { ...base.quote, ...raw.quote },
      dressCode: { ...base.dressCode, ...raw.dressCode },
      sections: { ...base.sections, ...raw.sections },
      photoPos: { ...base.photoPos, ...raw.photoPos },
      // thiệp cũ chỉ có musicUrl: coi như đã chọn file riêng
      music: raw.music ?? (raw.musicUrl ? "file" : ""),
      musicStart: Number(raw.musicStart) || 0,
      events: raw.events ?? base.events,
      schedule: raw.schedule ?? [],
      story: raw.story ?? [],
      gallery: raw.gallery ?? [],
      faqs: raw.faqs ?? [],
      gifts: raw.gifts ?? [],
      fontHeading: typeof raw.fontHeading === "string" ? raw.fontHeading : "",
      fontBody: typeof raw.fontBody === "string" ? raw.fontBody : "",
      fontScript: typeof raw.fontScript === "string" ? raw.fontScript : "",
      nameScale: clampNum(raw.nameScale ?? 1, NAME_SCALE_RANGE.min, NAME_SCALE_RANGE.max),
      textScale: clampNum(raw.textScale ?? 1, TEXT_SCALE_RANGE.min, TEXT_SCALE_RANGE.max),
      fieldStyles: cleanFieldStyles(raw.fieldStyles),
    };
  } catch {
    return base;
  }
}

/* ------------------------------------------------------------------ */
/* Ảnh demo: Unsplash (giấy phép Unsplash, dùng miễn phí)              */
/* ------------------------------------------------------------------ */
export const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

export const DEMO_PHOTOS = {
  coupleClose: "1652494268816-8e3d0282cf2f",
  coupleLaugh: "1591164473007-703c2c1c4905",
  coupleBlue: "1532107240529-37e00566655d",
  coupleVeilKiss: "1606216794079-73f85bbd57d5",
  coupleField: "1546032996-6dfacbacbf3f",
  coupleHill: "1532712938310-34cb3982ef74",
  coupleVineyard: "1779475501433-69a3a0b310f8",
  coupleForest: "1769540209843-c1e6a462b9d3",
  coupleCastle: "1550784718-990c6de52adf",
  coupleEstate: "1775126964671-43b4c1a1c5ce",
  coupleHallway: "1757647630063-dd5cd82271f3",
  coupleWalk: "1775126964334-93899cb3725a",
  coupleForehead: "1596457221755-b96bc3a6df18",
  coupleSunset: "1551198643-b2a9ed2e3236",
  coupleBeach: "1648526593789-0f4111100931",
  coupleCanoe: "1558599308-acc9feb34773",
  coupleBW: "1460978812857-470ed1c77af0",
  coupleDance: "1660227767957-3ecc696e0dec",
  brideSea: "1701266109883-7f0e76a75b64",
  brideBlossom: "1670972027764-3f2a63066d59",
  brideLetter: "1731994710363-4bfb946ce10c",
  handsHold: "1561287495-a3fe1fd28504",
  rings: "1684244276932-6ae853774c4d",
  ringsCard: "1783818412147-fc24a0d05830",
  table: "1767050241759-a35754ea2471",
  placeSetting: "1767050362923-79ff3b7971dc",
  bouquet: "1731994710373-849feb905390",
  shoes: "1721176411936-a28a77f75896",
  lace: "1525169087805-031a4da0623c",
} as const;

export type DemoPhotoKey = keyof typeof DEMO_PHOTOS;
const P = (k: DemoPhotoKey, w?: number) => unsplash(DEMO_PHOTOS[k], w);

/** Dữ liệu mẫu để xem trước các mẫu thiệp. `cover` cho phép mỗi mẫu dùng ảnh bìa riêng. */
export function demoInvitationData(cover: DemoPhotoKey = "coupleClose"): InvitationData {
  const d = defaultInvitationData();
  return {
    ...d,
    groom: {
      name: "Minh Quân",
      fullName: "Nguyễn Minh Quân",
      father: "Ông Nguyễn Văn Hùng",
      mother: "Bà Trần Thị Lan",
      address: "Phường Ngọc Hà, Ba Đình, Hà Nội",
      bio: "Kỹ sư phần mềm, nghiện cà phê phin buổi sáng và những chuyến đi không định trước.",
      photo: P("coupleLaugh", 800),
    },
    bride: {
      name: "Thu Hà",
      fullName: "Lê Thu Hà",
      father: "Ông Lê Văn Phúc",
      mother: "Bà Phạm Thị Mai",
      address: "Phường Hàng Bạc, Hoàn Kiếm, Hà Nội",
      bio: "Cô giáo dạy văn, thích hoa cúc hoạ mi, mèo mướp và những bức thư viết tay.",
      photo: P("brideSea", 800),
    },
    weddingDate: "2027-01-16T11:00",
    headline: "Save the Date",
    invitationText:
      "Hai gia đình chúng tôi trân trọng báo tin Lễ Thành Hôn của con chúng tôi và kính mời bạn đến chung vui, chứng kiến khoảnh khắc thiêng liêng này.",
    coverPhoto: P(cover, 1600),
    quote: {
      text: "Yêu nhau không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng.",
      author: "Antoine de Saint-Exupéry",
    },
    events: [
      {
        id: "e1",
        title: "Lễ Vu Quy",
        date: "2027-01-16T08:00",
        lunarDate: "Nhằm ngày 08 tháng Chạp năm Bính Ngọ",
        venue: "Tư gia nhà gái",
        address: "12 Hàng Bạc, Hoàn Kiếm, Hà Nội",
        mapUrl: "",
      },
      {
        id: "e2",
        title: "Tiệc Cưới",
        date: "2027-01-16T11:00",
        lunarDate: "Nhằm ngày 08 tháng Chạp năm Bính Ngọ",
        venue: "Sảnh Hoa Sen · Trung tâm Tiệc cưới Lotus",
        address: "88 Láng Hạ, Đống Đa, Hà Nội",
        mapUrl: "",
      },
    ],
    schedule: [
      { id: "t1", time: "10:30", title: "Đón khách", description: "Chụp ảnh lưu niệm cùng cô dâu chú rể tại sảnh." },
      { id: "t2", time: "11:00", title: "Làm lễ", description: "Nghi thức thành hôn, rót rượu và cắt bánh." },
      { id: "t3", time: "11:30", title: "Khai tiệc", description: "Thưởng thức thực đơn và âm nhạc acoustic." },
      { id: "t4", time: "13:00", title: "Tiễn khách", description: "Cảm ơn và gửi tặng quà nhỏ cho từng vị khách." },
    ],
    story: [
      {
        id: "s1",
        date: "Tháng 9 · 2019",
        title: "Lần đầu gặp gỡ",
        content: "Một buổi chiều mưa ở thư viện Quốc gia, hai người cùng với tay lấy một cuốn sách. Anh nhường, em cười — và thế là bắt đầu.",
        photo: P("brideLetter", 900),
      },
      {
        id: "s2",
        date: "Tháng 2 · 2022",
        title: "Những chuyến đi",
        content: "Từ hồ Tây đến Hội An, từ Mộc Châu mùa mận nở đến Phú Quốc nắng gắt — chúng mình học cách yêu nhau qua từng chặng đường.",
        photo: P("coupleCanoe", 900),
      },
      {
        id: "s3",
        date: "Tháng 6 · 2026",
        title: "Lời cầu hôn",
        content: "Dưới bầu trời Đà Lạt lất phất sương, anh quỳ xuống với chiếc nhẫn giấu trong hộp bánh. Em đã nói: “Có”.",
        photo: P("rings", 900),
      },
    ],
    gallery: (
      ["coupleVeilKiss", "coupleField", "brideBlossom", "coupleVineyard", "coupleHallway", "coupleForest", "handsHold", "coupleCastle", "coupleDance", "coupleBW", "bouquet", "coupleSunset"] as DemoPhotoKey[]
    ).map((k) => P(k, 1000)),
    featurePhoto: P("coupleWalk", 1800),
    videoUrl: "",
    dressCode: {
      note: "Khách mời vui lòng chọn trang phục tông pastel nhẹ nhàng để cùng tạo nên những bức ảnh thật đẹp.",
      colors: ["#ede6dc", "#c9d6c1", "#d7c4d9", "#f1d3cf", "#cfd9e3"],
    },
    faqs: [
      { id: "f1", q: "Có chỗ đỗ xe ô tô không?", a: "Trung tâm có hầm để xe miễn phí cho khách mời, lối vào từ phố Nguyễn Chí Thanh." },
      { id: "f2", q: "Tôi có thể đưa trẻ nhỏ đi cùng không?", a: "Rất hoan nghênh! Vui lòng ghi số người khi xác nhận tham dự để chúng mình chuẩn bị chỗ ngồi." },
      { id: "f3", q: "Nên đến lúc mấy giờ?", a: "Bạn có thể đến từ 10:30 để chụp ảnh cùng cô dâu chú rể trước khi làm lễ." },
    ],
    gifts: [
      { id: "b1", label: "Mừng cưới chú rể", bankCode: "VCB", bankName: "Vietcombank", accountNumber: "0123456789", accountName: "NGUYEN MINH QUAN", qrImage: "" },
      { id: "b2", label: "Mừng cưới cô dâu", bankCode: "TCB", bankName: "Techcombank", accountNumber: "1903456789", accountName: "LE THU HA", qrImage: "" },
    ],
    thankYouPhoto: P("coupleSunset", 1600),
    closingText: "Sự hiện diện của bạn là món quà ý nghĩa nhất với chúng mình. Hẹn gặp bạn trong ngày vui!",
  };
}

export function giftQrUrl(g: GiftAccount, addInfo = "Mung cuoi") {
  if (g.qrImage) return g.qrImage;
  if (!g.bankCode || !g.accountNumber) return "";
  const q = new URLSearchParams({ accountName: g.accountName, addInfo });
  return `https://img.vietqr.io/image/${g.bankCode}-${g.accountNumber}-compact.png?${q}`;
}

/** Lấy ID video YouTube từ link (youtu.be, watch?v=, shorts, embed). */
export function youtubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  return m?.[1] ?? "";
}

/** Link "Thêm vào Google Calendar" cho một sự kiện. */
export function googleCalendarUrl(title: string, start: string, location: string, details = "") {
  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return "";
  const end = new Date(d.getTime() + 3 * 3600_000);
  const f = (x: Date) => x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const q = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${f(d)}/${f(end)}`, location, details });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export function initials(a: string, b: string) {
  const first = (s: string) => (s.trim().split(/\s+/).pop() ?? "").charAt(0).toUpperCase();
  return `${first(a) || "A"}${first(b) || "B"}`;
}

export function toSlug(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Chỉ cho phép link http(s) hoặc đường dẫn nội bộ — chặn javascript: trong href. */
export function safeUrl(url: string) {
  return /^(https?:\/\/|\/(?!\/))/i.test(url.trim()) ? url.trim() : "";
}

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$/;
