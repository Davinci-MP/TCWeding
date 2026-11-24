import type { DemoPhotoKey, EffectKind } from "@/lib/invitation";

// Danh sách mẫu thiệp. Thêm mẫu mới: thêm 1 object vào TEMPLATES
// (chọn hero/ornament có sẵn hoặc viết thêm biến thể trong InvitationView).

export type HeroVariant =
  | "frame"
  | "songhy"
  | "editorial"
  | "floral"
  | "starry"
  | "split"
  | "postcard"
  | "lotus"
  | "wave"
  | "deco"
  | "polaroid"
  | "cinema"
  | "magazine"
  | "blossom"
  | "watercolor"
  | "marble"
  | "velvet"
  | "crest"
  | "geo"
  | "triptych"
  | "bento"
  | "typo"
  | "boarding"
  | "scrapbook"
  | "envelope"
  | "herbarium"
  | "vinyl"
  | "ink"
  | "moon"
  | "offset";
export type Ornament = "line" | "songhy" | "none" | "leaf" | "star" | "heart" | "lotus" | "wave" | "deco" | "blossom" | "laurel" | "sprig" | "enso";

/** Hệ bố cục cho các mục bên trong thiệp — làm các mẫu khác nhau ở cả phần thân. */
export type LayoutFamily = "classic" | "editorial" | "romantic" | "heritage" | "luxe" | "modern" | "journal" | "zen";

export const LAYOUT_NAMES: Record<LayoutFamily, string> = {
  classic: "Cổ điển",
  editorial: "Tạp chí",
  romantic: "Lãng mạn",
  heritage: "Di sản",
  luxe: "Dạ tiệc",
  modern: "Bento",
  journal: "Sổ tay",
  zen: "Thiền",
};

export type FrameShape = "arch" | "circle" | "rounded" | "rect" | "octagon" | "polaroid";

type TemplateBase = {
  id: string;
  name: string;
  description: string;
  category: "Cổ điển" | "Truyền thống" | "Hiện đại" | "Thiên nhiên" | "Lãng mạn" | "Sang trọng";
  premium: boolean; // mặc định — admin có thể đổi trong trang quản trị
  hero: HeroVariant;
  ornament: Ornament;
  headingUppercase?: boolean;
  fonts: { heading: string; body: string; script: string };
  colors: {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    primary: string;
    accent: string;
    onPrimary: string;
    heroBg: string; // nền khu vực đầu thiệp
    heroText: string;
  };
};

export type TemplateDef = TemplateBase & {
  effect: Exclude<EffectKind, "">; // hiệu ứng nền mặc định
  frame: FrameShape; // kiểu khung ảnh chân dung
  demoCover: DemoPhotoKey; // ảnh bìa khi xem thử
  layout: LayoutFamily;
};

const families = (...f: string[]) =>
  "https://fonts.googleapis.com/css2?" +
  f.map((x) => `family=${x}`).join("&") +
  "&display=swap&subset=vietnamese";

export function fontUrl(t: TemplateDef) {
  const map: Record<string, string> = {
    "Cormorant Garamond": "Cormorant+Garamond:ital,wght@0,400;0,600;1,400",
    "Great Vibes": "Great+Vibes",
    Lora: "Lora:ital,wght@0,400;0,600;1,400",
    "Playfair Display": "Playfair+Display:ital,wght@0,400;0,700;1,400",
    "Dancing Script": "Dancing+Script:wght@500;700",
    "Be Vietnam Pro": "Be+Vietnam+Pro:wght@300;400;600",
    Montserrat: "Montserrat:wght@300;400;600",
    Quicksand: "Quicksand:wght@400;600",
    Charm: "Charm:wght@400;700",
    "Josefin Sans": "Josefin+Sans:wght@300;400;600",
    Pacifico: "Pacifico",
    "Patrick Hand": "Patrick+Hand",
    Prata: "Prata",
    Spectral: "Spectral:ital,wght@0,300;0,400;0,600;1,300;1,400",
    "Imperial Script": "Imperial+Script",
    "Yeseva One": "Yeseva+One",
    "EB Garamond": "EB+Garamond:ital,wght@0,400;0,600;1,400",
    Allura: "Allura",
    Fraunces: "Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..800",
    Ephesis: "Ephesis",
    "Bricolage Grotesque": "Bricolage+Grotesque:opsz,wght@12..96,300..800",
    "Space Grotesk": "Space+Grotesk:wght@400;500;700",
    Pangolin: "Pangolin",
    Unbounded: "Unbounded:wght@400;700;900",
    Itim: "Itim",
    Mali: "Mali:wght@400;600",
  };
  const names = new Set(
    [t.fonts.heading, t.fonts.body, t.fonts.script].map((f) => f.split(",")[0].replace(/['"]/g, "").trim()),
  );
  return families(...[...names].map((n) => map[n]).filter(Boolean));
}

const BASE: TemplateBase[] = [
  {
    id: "classic-ivory",
    name: "Ivory Cổ Điển",
    description: "Tông kem – vàng ánh kim, khung viền thanh lịch, chữ thư pháp mềm mại.",
    category: "Cổ điển",
    premium: false,
    hero: "frame",
    ornament: "line",
    fonts: { heading: "'Cormorant Garamond', serif", body: "'Lora', serif", script: "'Great Vibes', cursive" },
    colors: {
      bg: "#faf6ef",
      surface: "#ffffff",
      text: "#3d3428",
      muted: "#8a7d6b",
      primary: "#b08d57",
      accent: "#e9dcc4",
      onPrimary: "#ffffff",
      heroBg: "#f3ebdd",
      heroText: "#3d3428",
    },
  },
  {
    id: "song-hy",
    name: "Song Hỷ Truyền Thống",
    description: "Đỏ – vàng rực rỡ với chữ Hỷ, mang đậm nét cưới hỏi Việt Nam.",
    category: "Truyền thống",
    premium: false,
    hero: "songhy",
    ornament: "songhy",
    fonts: { heading: "'Playfair Display', serif", body: "'Be Vietnam Pro', sans-serif", script: "'Charm', cursive" },
    colors: {
      bg: "#fff8ef",
      surface: "#ffffff",
      text: "#4a1a12",
      muted: "#8c5a4a",
      primary: "#b3121f",
      accent: "#d9a520",
      onPrimary: "#fff6dc",
      heroBg: "#9e0f1a",
      heroText: "#f8dc8a",
    },
  },
  {
    id: "minimal-mono",
    name: "Minimal Đơn Sắc",
    description: "Phong cách tạp chí hiện đại, đen – trắng, ảnh lớn, chữ in hoa giãn cách.",
    category: "Hiện đại",
    premium: false,
    hero: "editorial",
    ornament: "none",
    headingUppercase: true,
    fonts: { heading: "'Montserrat', sans-serif", body: "'Be Vietnam Pro', sans-serif", script: "'Playfair Display', serif" },
    colors: {
      bg: "#ffffff",
      surface: "#f5f5f4",
      text: "#111111",
      muted: "#6b6b6b",
      primary: "#111111",
      accent: "#d4d4d4",
      onPrimary: "#ffffff",
      heroBg: "#111111",
      heroText: "#ffffff",
    },
  },
  {
    id: "garden-sage",
    name: "Khu Vườn Xanh",
    description: "Xanh lá sage dịu mát, hoạ tiết lá cây — hợp đám cưới ngoài trời.",
    category: "Thiên nhiên",
    premium: true,
    hero: "floral",
    ornament: "leaf",
    fonts: { heading: "'Cormorant Garamond', serif", body: "'Be Vietnam Pro', sans-serif", script: "'Dancing Script', cursive" },
    colors: {
      bg: "#f4f6f0",
      surface: "#ffffff",
      text: "#2f3a2a",
      muted: "#6f7d66",
      primary: "#62775a",
      accent: "#d8c3a5",
      onPrimary: "#ffffff",
      heroBg: "#e6ecdf",
      heroText: "#2f3a2a",
    },
  },
  {
    id: "starry-night",
    name: "Đêm Đầy Sao",
    description: "Nền xanh đêm huyền ảo, ánh sao lấp lánh và chữ vàng sang trọng.",
    category: "Lãng mạn",
    premium: true,
    hero: "starry",
    ornament: "star",
    fonts: { heading: "'Playfair Display', serif", body: "'Be Vietnam Pro', sans-serif", script: "'Great Vibes', cursive" },
    colors: {
      bg: "#0f1b33",
      surface: "#17284b",
      text: "#f3ead7",
      muted: "#a9b3c9",
      primary: "#d9b56f",
      accent: "#2a3d66",
      onPrimary: "#0f1b33",
      heroBg: "#0b1428",
      heroText: "#f3ead7",
    },
  },
  {
    id: "blush-pastel",
    name: "Hồng Pastel",
    description: "Hồng phấn ngọt ngào, bố cục chia đôi ảnh – chữ, điểm xuyết trái tim.",
    category: "Lãng mạn",
    premium: false,
    hero: "split",
    ornament: "heart",
    fonts: { heading: "'Playfair Display', serif", body: "'Quicksand', sans-serif", script: "'Dancing Script', cursive" },
    colors: {
      bg: "#fff6f7",
      surface: "#ffffff",
      text: "#4b2e35",
      muted: "#9a7480",
      primary: "#d4788b",
      accent: "#f6d3da",
      onPrimary: "#ffffff",
      heroBg: "#fde8ec",
      heroText: "#4b2e35",
    },
  },
  {
    id: "vintage-postcard",
    name: "Bưu Thiếp Vintage",
    description: "Giấy kraft cổ điển, tem thư và dấu bưu điện — như một lá thư tay gửi khách mời.",
    category: "Cổ điển",
    premium: false,
    hero: "postcard",
    ornament: "line",
    fonts: { heading: "'Lora', serif", body: "'Patrick Hand', cursive", script: "'Dancing Script', cursive" },
    colors: {
      bg: "#f3ead9",
      surface: "#fbf6ec",
      text: "#4a3626",
      muted: "#8b6f55",
      primary: "#8a5a35",
      accent: "#e2cfae",
      onPrimary: "#fbf6ec",
      heroBg: "#e6d5b8",
      heroText: "#4a3626",
    },
  },
  {
    id: "lotus-hue",
    name: "Sen Tím Huế",
    description: "Tím Huế mộng mơ cùng hoa sen vàng, nét duyên dáng của áo dài cố đô.",
    category: "Truyền thống",
    premium: true,
    hero: "lotus",
    ornament: "lotus",
    fonts: { heading: "'Cormorant Garamond', serif", body: "'Be Vietnam Pro', sans-serif", script: "'Charm', cursive" },
    colors: {
      bg: "#f7f2f8",
      surface: "#ffffff",
      text: "#3b2448",
      muted: "#7d6889",
      primary: "#6b3f86",
      accent: "#d9b968",
      onPrimary: "#fff8e6",
      heroBg: "#4a2a5e",
      heroText: "#f5e6c4",
    },
  },
  {
    id: "ocean-breeze",
    name: "Gió Biển",
    description: "Xanh biển trong trẻo, sóng nước nhẹ nhàng — dành cho tiệc cưới bãi biển.",
    category: "Thiên nhiên",
    premium: false,
    hero: "wave",
    ornament: "wave",
    fonts: { heading: "'Josefin Sans', sans-serif", body: "'Quicksand', sans-serif", script: "'Pacifico', cursive" },
    colors: {
      bg: "#f3f9fb",
      surface: "#ffffff",
      text: "#1f3d4d",
      muted: "#5f7f8f",
      primary: "#2a7f9e",
      accent: "#f1e3c8",
      onPrimary: "#ffffff",
      heroBg: "#d8eef5",
      heroText: "#1f3d4d",
    },
  },
  {
    id: "emerald-deco",
    name: "Lục Bảo Art Deco",
    description: "Xanh ngọc lục bảo và vàng kim, đường nét Art Deco hình học đầy quyền quý.",
    category: "Cổ điển",
    premium: true,
    hero: "deco",
    ornament: "deco",
    headingUppercase: true,
    fonts: { heading: "'Josefin Sans', sans-serif", body: "'Be Vietnam Pro', sans-serif", script: "'Great Vibes', cursive" },
    colors: {
      bg: "#f4f1e8",
      surface: "#ffffff",
      text: "#163a33",
      muted: "#5d7069",
      primary: "#b8954a",
      accent: "#dfe8e3",
      onPrimary: "#0f2e28",
      heroBg: "#0f3b33",
      heroText: "#efe3c2",
    },
  },
  {
    id: "polaroid-fun",
    name: "Polaroid Trẻ Trung",
    description: "Ảnh polaroid xếp ngẫu hứng, màu cam san hô tươi vui cho cặp đôi năng động.",
    category: "Hiện đại",
    premium: false,
    hero: "polaroid",
    ornament: "heart",
    fonts: { heading: "'Josefin Sans', sans-serif", body: "'Quicksand', sans-serif", script: "'Pacifico', cursive" },
    colors: {
      bg: "#fffaf2",
      surface: "#ffffff",
      text: "#3a2e2a",
      muted: "#8a7a72",
      primary: "#ef6f53",
      accent: "#ffe1d6",
      onPrimary: "#ffffff",
      heroBg: "#fff1e3",
      heroText: "#3a2e2a",
    },
  },
  {
    id: "noir-gold",
    name: "Noir Gold",
    description: "Đen tuyền và vàng sâm-panh, mở đầu như một thước phim — sang trọng, điện ảnh.",
    category: "Hiện đại",
    premium: true,
    hero: "cinema",
    ornament: "deco",
    headingUppercase: true,
    fonts: { heading: "'Cormorant Garamond', serif", body: "'Be Vietnam Pro', sans-serif", script: "'Great Vibes', cursive" },
    colors: {
      bg: "#111012",
      surface: "#1b191c",
      text: "#ece6da",
      muted: "#a39c90",
      primary: "#cfae6e",
      accent: "#2a272b",
      onPrimary: "#111012",
      heroBg: "#0a090b",
      heroText: "#ece6da",
    },
  },
  {
    id: "magazine-cover",
    name: "Tạp Chí Cưới",
    description: "Cặp đôi lên trang bìa tạp chí: măng-sét lớn, tít phụ, bố cục biên tập táo bạo.",
    category: "Hiện đại",
    premium: false,
    hero: "magazine",
    ornament: "none",
    headingUppercase: true,
    fonts: { heading: "'Playfair Display', serif", body: "'Be Vietnam Pro', sans-serif", script: "'Playfair Display', serif" },
    colors: {
      bg: "#f7f5f2",
      surface: "#ffffff",
      text: "#141414",
      muted: "#6e6a66",
      primary: "#c2272d",
      accent: "#ebe6df",
      onPrimary: "#ffffff",
      heroBg: "#141414",
      heroText: "#ffffff",
    },
  },
  {
    id: "peach-blossom",
    name: "Hoa Đào Xuân",
    description: "Cành đào ngày Tết, đỏ son và hồng phấn — ấm áp, sum vầy cho đám cưới mùa xuân.",
    category: "Truyền thống",
    premium: false,
    hero: "blossom",
    ornament: "blossom",
    fonts: { heading: "'Playfair Display', serif", body: "'Be Vietnam Pro', sans-serif", script: "'Charm', cursive" },
    colors: {
      bg: "#fff7f4",
      surface: "#ffffff",
      text: "#4b1f22",
      muted: "#93645f",
      primary: "#c23b3f",
      accent: "#f6cfd0",
      onPrimary: "#fff7f4",
      heroBg: "#fdeee9",
      heroText: "#4b1f22",
    },
  },
  {
    id: "watercolor-lilac",
    name: "Lilac Màu Nước",
    description: "Những vệt màu nước tím hoa cà loang nhẹ, chữ viết tay bay bổng như tranh vẽ.",
    category: "Lãng mạn",
    premium: true,
    hero: "watercolor",
    ornament: "heart",
    fonts: { heading: "'Cormorant Garamond', serif", body: "'Quicksand', sans-serif", script: "'Great Vibes', cursive" },
    colors: {
      bg: "#faf8fc",
      surface: "#ffffff",
      text: "#3a3046",
      muted: "#857a91",
      primary: "#8a6bb0",
      accent: "#e9e0f3",
      onPrimary: "#ffffff",
      heroBg: "#f6f1fb",
      heroText: "#3a3046",
    },
  },
  {
    id: "marble-luxe",
    name: "Cẩm Thạch",
    description: "Nền đá cẩm thạch vân xám, chữ lồng ánh nhũ vàng và khung oval viền đôi — tinh tế như thiệp in nổi.",
    category: "Sang trọng",
    premium: true,
    hero: "marble",
    ornament: "line",
    fonts: { heading: "'Prata', serif", body: "'Spectral', serif", script: "'Imperial Script', cursive" },
    colors: {
      bg: "#f7f5f2",
      surface: "#ffffff",
      text: "#2b2a28",
      muted: "#85807a",
      primary: "#a8843f",
      accent: "#ebe6de",
      onPrimary: "#ffffff",
      heroBg: "#efebe5",
      heroText: "#2b2a28",
    },
  },
  {
    id: "burgundy-velvet",
    name: "Nhung Đỏ Rượu",
    description: "Màn nhung đỏ rượu vang kéo mở như sân khấu, ánh vàng ấm trên nền tối — cho tiệc cưới buổi tối.",
    category: "Sang trọng",
    premium: true,
    hero: "velvet",
    ornament: "deco",
    fonts: { heading: "'Yeseva One', serif", body: "'Lora', serif", script: "'Great Vibes', cursive" },
    colors: {
      bg: "#1d0d12",
      surface: "#2a141b",
      text: "#f2e6dc",
      muted: "#c4a9a0",
      primary: "#d4af6a",
      accent: "#3a1c25",
      onPrimary: "#1d0d12",
      heroBg: "#14080c",
      heroText: "#f6ead8",
    },
  },
  {
    id: "royal-crest",
    name: "Huy Hiệu Hoàng Gia",
    description: "Xanh hải quân và nguyệt quế vàng, chữ lồng như gia huy, ngày cưới viết bằng số La Mã.",
    category: "Sang trọng",
    premium: true,
    hero: "crest",
    ornament: "laurel",
    headingUppercase: true,
    fonts: { heading: "'EB Garamond', serif", body: "'Be Vietnam Pro', sans-serif", script: "'Allura', cursive" },
    colors: {
      bg: "#f5f3ee",
      surface: "#ffffff",
      text: "#1e2a44",
      muted: "#6b7389",
      primary: "#1e2a44",
      accent: "#e6e1d6",
      onPrimary: "#f5f3ee",
      heroBg: "#1e2a44",
      heroText: "#efe8d8",
    },
  },
  {
    id: "rose-gold",
    name: "Vàng Hồng",
    description: "Hồng phấn ánh kim, khung lục giác tự vẽ nét khi mở thiệp — hiện đại mà vẫn nữ tính.",
    category: "Sang trọng",
    premium: false,
    hero: "geo",
    ornament: "deco",
    fonts: { heading: "'Fraunces', serif", body: "'Quicksand', sans-serif", script: "'Ephesis', cursive" },
    colors: {
      bg: "#fbf5f2",
      surface: "#ffffff",
      text: "#4a3532",
      muted: "#9a817c",
      primary: "#b7826f",
      accent: "#f3e2dc",
      onPrimary: "#ffffff",
      heroBg: "#f6e9e4",
      heroText: "#4a3532",
    },
  },
  {
    id: "terracotta-arch",
    name: "Đất Nung",
    description: "Ba ô vòm ghép thành một bức ảnh, tông đất nung ấm và chữ đậm cỡ lớn.",
    category: "Hiện đại",
    premium: false,
    hero: "triptych",
    ornament: "none",
    fonts: { heading: "'Bricolage Grotesque', sans-serif", body: "'Be Vietnam Pro', sans-serif", script: "'Fraunces', serif" },
    colors: {
      bg: "#f6efe7",
      surface: "#fffaf4",
      text: "#3b2a22",
      muted: "#8c7464",
      primary: "#c0603e",
      accent: "#ecd9c6",
      onPrimary: "#ffffff",
      heroBg: "#f1e4d6",
      heroText: "#3b2a22",
    },
  },
  {
    id: "citrus-bento",
    name: "Chanh Vàng Bento",
    description: "Lưới ô bento tươi sáng: ảnh, tên, ngày và số ngày còn lại hiện cùng lúc ngay khi mở.",
    category: "Hiện đại",
    premium: false,
    hero: "bento",
    ornament: "none",
    fonts: { heading: "'Space Grotesk', sans-serif", body: "'Be Vietnam Pro', sans-serif", script: "'Pangolin', cursive" },
    colors: {
      bg: "#fbfaf3",
      surface: "#ffffff",
      text: "#1f2218",
      muted: "#6f7363",
      primary: "#e3b505",
      accent: "#eef0dc",
      onPrimary: "#1f2218",
      heroBg: "#f1f2e6",
      heroText: "#1f2218",
    },
  },
  {
    id: "cobalt-type",
    name: "Cobalt Táo Bạo",
    description: "Tên cô dâu chú rể cỡ khổng lồ, ảnh cưới in lồng trong từng nét chữ trên nền xanh cobalt.",
    category: "Hiện đại",
    premium: true,
    hero: "typo",
    ornament: "none",
    headingUppercase: true,
    fonts: { heading: "'Unbounded', sans-serif", body: "'Be Vietnam Pro', sans-serif", script: "'Allura', cursive" },
    colors: {
      bg: "#f4f6fb",
      surface: "#ffffff",
      text: "#0e1a3d",
      muted: "#5a6587",
      primary: "#2443d6",
      accent: "#dfe5fa",
      onPrimary: "#ffffff",
      heroBg: "#2443d6",
      heroText: "#ffffff",
    },
  },
  {
    id: "mint-boarding",
    name: "Chuyến Bay Hạnh Phúc",
    description: "Thiệp mời dạng thẻ lên máy bay: khởi hành từ chú rể, hạ cánh nơi cô dâu, ghi tên từng khách.",
    category: "Hiện đại",
    premium: false,
    hero: "boarding",
    ornament: "heart",
    fonts: { heading: "'Space Grotesk', sans-serif", body: "'Quicksand', sans-serif", script: "'Pacifico', cursive" },
    colors: {
      bg: "#f2f8f5",
      surface: "#ffffff",
      text: "#17332b",
      muted: "#5f7a71",
      primary: "#2f8f74",
      accent: "#d6efe5",
      onPrimary: "#ffffff",
      heroBg: "#dff1ea",
      heroText: "#17332b",
    },
  },
  {
    id: "kraft-scrapbook",
    name: "Sổ Tay Kraft",
    description: "Trang sổ giấy kraft dán ảnh bằng băng keo, chữ viết tay và sticker trái tim — vui và gần gũi.",
    category: "Lãng mạn",
    premium: false,
    hero: "scrapbook",
    ornament: "heart",
    fonts: { heading: "'Itim', cursive", body: "'Mali', cursive", script: "'Pangolin', cursive" },
    colors: {
      bg: "#efe4d2",
      surface: "#f8f1e4",
      text: "#3d2f22",
      muted: "#7f6a55",
      primary: "#c0504d",
      accent: "#f2d27a",
      onPrimary: "#ffffff",
      heroBg: "#d9c4a3",
      heroText: "#3d2f22",
    },
  },
  {
    id: "love-letter",
    name: "Thư Tay",
    description: "Phong bì gắn dấu sáp tự mở nắp, lá thư có ảnh cưới trượt lên — như nhận một lá thư tay thật.",
    category: "Cổ điển",
    premium: true,
    hero: "envelope",
    ornament: "line",
    fonts: { heading: "'EB Garamond', serif", body: "'Lora', serif", script: "'Imperial Script', cursive" },
    colors: {
      bg: "#f8f3ec",
      surface: "#fffdf9",
      text: "#2f2a3a",
      muted: "#7b7588",
      primary: "#7b2d3b",
      accent: "#ead9c8",
      onPrimary: "#ffffff",
      heroBg: "#e8ddd0",
      heroText: "#2f2a3a",
    },
  },
  {
    id: "wildflower-herbarium",
    name: "Hoa Đồng Nội",
    description: "Tiêu bản hoa ép khô, ảnh kẹp góc giấy và nhãn mẫu vật ghi ngày cưới — mộc mạc kiểu nhà vườn.",
    category: "Thiên nhiên",
    premium: false,
    hero: "herbarium",
    ornament: "sprig",
    fonts: { heading: "'Spectral', serif", body: "'Spectral', serif", script: "'Ephesis', cursive" },
    colors: {
      bg: "#f4f1e6",
      surface: "#fbf9f1",
      text: "#2e3324",
      muted: "#707461",
      primary: "#9c6b1f",
      accent: "#ece3c8",
      onPrimary: "#ffffff",
      heroBg: "#f0ecdd",
      heroText: "#2e3324",
    },
  },
  {
    id: "retro-vinyl",
    name: "Đĩa Than Retro",
    description: "Bìa album là ảnh cưới, đĩa than trượt ra và quay, các nghi lễ xếp như danh sách bài hát mặt A.",
    category: "Hiện đại",
    premium: true,
    hero: "vinyl",
    ornament: "star",
    fonts: { heading: "'Fraunces', serif", body: "'Space Grotesk', sans-serif", script: "'Pacifico', cursive" },
    colors: {
      bg: "#f5ead8",
      surface: "#fff6e8",
      text: "#2d1e17",
      muted: "#7f6553",
      primary: "#d9542b",
      accent: "#f1c96a",
      onPrimary: "#ffffff",
      heroBg: "#2d1e17",
      heroText: "#f5ead8",
    },
  },
  {
    id: "ink-wash",
    name: "Thuỷ Mặc",
    description: "Núi mực loang, cuộn tranh treo chứa ảnh cưới và triện son đỏ — thanh tịnh, đậm chất Á Đông.",
    category: "Truyền thống",
    premium: true,
    hero: "ink",
    ornament: "enso",
    fonts: { heading: "'Spectral', serif", body: "'Be Vietnam Pro', sans-serif", script: "'Charm', cursive" },
    colors: {
      bg: "#f5f3ee",
      surface: "#ffffff",
      text: "#1d1d1b",
      muted: "#74736d",
      primary: "#b3261e",
      accent: "#e6e3dc",
      onPrimary: "#ffffff",
      heroBg: "#f1eee7",
      heroText: "#1d1d1b",
    },
  },
  {
    id: "full-moon",
    name: "Trăng Rằm",
    description: "Ảnh cưới tròn như vầng trăng nhô lên giữa trời đêm tím — hợp đám cưới ngày rằm, tiệc tối.",
    category: "Lãng mạn",
    premium: false,
    hero: "moon",
    ornament: "star",
    fonts: { heading: "'Prata', serif", body: "'Quicksand', sans-serif", script: "'Allura', cursive" },
    colors: {
      bg: "#f3f2f8",
      surface: "#ffffff",
      text: "#24233b",
      muted: "#6e6d88",
      primary: "#5b57a6",
      accent: "#e3e1f1",
      onPrimary: "#ffffff",
      heroBg: "#14132b",
      heroText: "#f1ede0",
    },
  },
  {
    id: "linen-offset",
    name: "Lanh Mộc",
    description: "Nền vải lanh, ảnh lớn đặt lệch, tên viết dọc theo mép — tối giản kiểu tạp chí nội thất.",
    category: "Hiện đại",
    premium: false,
    hero: "offset",
    ornament: "enso",
    fonts: { heading: "'Fraunces', serif", body: "'Be Vietnam Pro', sans-serif", script: "'Imperial Script', cursive" },
    colors: {
      bg: "#efebe4",
      surface: "#f7f4ef",
      text: "#2b2925",
      muted: "#7b766d",
      primary: "#5d5a52",
      accent: "#dcd5ca",
      onPrimary: "#ffffff",
      heroBg: "#e9e4db",
      heroText: "#2b2925",
    },
  },
];

const EXTRAS: Record<string, Pick<TemplateDef, "effect" | "frame" | "demoCover" | "layout">> = {
  "classic-ivory": { effect: "petals", frame: "arch", demoCover: "coupleVeilKiss", layout: "classic" },
  "song-hy": { effect: "gold", frame: "circle", demoCover: "coupleClose", layout: "heritage" },
  "minimal-mono": { effect: "none", frame: "rect", demoCover: "coupleBW", layout: "editorial" },
  "garden-sage": { effect: "leaves", frame: "arch", demoCover: "coupleForest", layout: "romantic" },
  "starry-night": { effect: "stars", frame: "circle", demoCover: "coupleSunset", layout: "classic" },
  "blush-pastel": { effect: "hearts", frame: "rounded", demoCover: "coupleField", layout: "romantic" },
  "vintage-postcard": { effect: "none", frame: "rect", demoCover: "coupleCanoe", layout: "heritage" },
  "lotus-hue": { effect: "gold", frame: "arch", demoCover: "brideBlossom", layout: "heritage" },
  "ocean-breeze": { effect: "none", frame: "circle", demoCover: "coupleBeach", layout: "classic" },
  "emerald-deco": { effect: "gold", frame: "octagon", demoCover: "coupleCastle", layout: "heritage" },
  "polaroid-fun": { effect: "hearts", frame: "polaroid", demoCover: "coupleLaugh", layout: "romantic" },
  "noir-gold": { effect: "gold", frame: "rect", demoCover: "coupleHallway", layout: "editorial" },
  "magazine-cover": { effect: "none", frame: "rect", demoCover: "coupleBlue", layout: "editorial" },
  "peach-blossom": { effect: "petals", frame: "circle", demoCover: "coupleForehead", layout: "heritage" },
  "watercolor-lilac": { effect: "petals", frame: "rounded", demoCover: "coupleVineyard", layout: "romantic" },
  "marble-luxe": { effect: "gold", frame: "arch", demoCover: "coupleEstate", layout: "luxe" },
  "burgundy-velvet": { effect: "gold", frame: "arch", demoCover: "coupleDance", layout: "luxe" },
  "royal-crest": { effect: "none", frame: "octagon", demoCover: "coupleWalk", layout: "luxe" },
  "rose-gold": { effect: "petals", frame: "rounded", demoCover: "brideSea", layout: "luxe" },
  "terracotta-arch": { effect: "none", frame: "arch", demoCover: "coupleHill", layout: "modern" },
  "citrus-bento": { effect: "none", frame: "rounded", demoCover: "coupleLaugh", layout: "modern" },
  "cobalt-type": { effect: "none", frame: "rect", demoCover: "coupleBW", layout: "modern" },
  "mint-boarding": { effect: "none", frame: "rounded", demoCover: "coupleBeach", layout: "modern" },
  "kraft-scrapbook": { effect: "hearts", frame: "polaroid", demoCover: "coupleField", layout: "journal" },
  "love-letter": { effect: "petals", frame: "rect", demoCover: "brideLetter", layout: "journal" },
  "wildflower-herbarium": { effect: "leaves", frame: "rect", demoCover: "coupleForest", layout: "journal" },
  "retro-vinyl": { effect: "none", frame: "circle", demoCover: "coupleSunset", layout: "journal" },
  "ink-wash": { effect: "none", frame: "rect", demoCover: "coupleClose", layout: "zen" },
  "full-moon": { effect: "stars", frame: "circle", demoCover: "coupleCanoe", layout: "zen" },
  "linen-offset": { effect: "none", frame: "rect", demoCover: "coupleVineyard", layout: "zen" },
};

export const TEMPLATES: TemplateDef[] = BASE.map((t) => ({
  ...t,
  ...(EXTRAS[t.id] ?? { effect: "none", frame: "rounded", demoCover: "coupleClose", layout: "classic" }),
}));

export function getTemplateDef(id: string): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
