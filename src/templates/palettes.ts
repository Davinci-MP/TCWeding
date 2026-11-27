// Bảng phối màu cho các biến thể mẫu thiệp (giống cách quocanhwedding.com có nhiều màu cho một thiết kế).
// Mỗi thiết kế gốc giữ nguyên bố cục, chỉ đổi màu; chọn bảng màu cùng "họ" (đầu thiệp sáng / tối)
// để thiết kế không bị vỡ.

export type PaletteColors = {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  accent: string;
  onPrimary: string;
  heroBg: string;
  heroText: string;
};
export type Palette = { id: string; name: string; colors: PaletteColors };
export type PaletteFamily = "light" | "darkHero" | "night";

/** Đầu thiệp sáng, thân thiệp sáng. */
const LIGHT: Palette[] = [
  { id: "nga-champagne", name: "Ngà champagne", colors: { bg: "#fbf7f0", surface: "#ffffff", text: "#3b3127", muted: "#8b7d6b", primary: "#b08d57", accent: "#d9c4a0", onPrimary: "#ffffff", heroBg: "#f5eee2", heroText: "#3b3127" } },
  { id: "hong-phan", name: "Hồng phấn", colors: { bg: "#fdf6f6", surface: "#ffffff", text: "#4a3438", muted: "#9a7f84", primary: "#c97b8a", accent: "#f0c9d0", onPrimary: "#ffffff", heroBg: "#fbeef0", heroText: "#4a3438" } },
  { id: "xanh-xo-thom", name: "Xanh xô thơm", colors: { bg: "#f5f7f2", surface: "#ffffff", text: "#2f3a2f", muted: "#7a857a", primary: "#7d9474", accent: "#c9d6bf", onPrimary: "#ffffff", heroBg: "#eef2ea", heroText: "#2f3a2f" } },
  { id: "xanh-bui", name: "Xanh bụi", colors: { bg: "#f4f6f9", surface: "#ffffff", text: "#2c3644", muted: "#7b8696", primary: "#6f8aa8", accent: "#c7d3e2", onPrimary: "#ffffff", heroBg: "#eaf0f6", heroText: "#2c3644" } },
  { id: "tim-oai-huong", name: "Tím oải hương", colors: { bg: "#f8f6fb", surface: "#ffffff", text: "#3a3346", muted: "#857d93", primary: "#9b86bd", accent: "#d9cdea", onPrimary: "#ffffff", heroBg: "#f1edf8", heroText: "#3a3346" } },
  { id: "kem-mocha", name: "Kem mocha", colors: { bg: "#f7f2ec", surface: "#fffdf9", text: "#3d2f26", muted: "#8c7a6c", primary: "#8a6a52", accent: "#d6c2ae", onPrimary: "#ffffff", heroBg: "#efe5da", heroText: "#3d2f26" } },
  { id: "dat-nung", name: "Đất nung", colors: { bg: "#fbf4ef", surface: "#ffffff", text: "#43291f", muted: "#957567", primary: "#c0643f", accent: "#eab79c", onPrimary: "#ffffff", heroBg: "#f6e7dd", heroText: "#43291f" } },
  { id: "do-hy-kem", name: "Đỏ hỷ kem", colors: { bg: "#fdf7f0", surface: "#ffffff", text: "#4a1d17", muted: "#94665b", primary: "#b3261e", accent: "#e8b04a", onPrimary: "#ffffff", heroBg: "#f8ecdc", heroText: "#4a1d17" } },
  { id: "vang-bo", name: "Vàng bơ", colors: { bg: "#fdf9ee", surface: "#ffffff", text: "#3f3420", muted: "#8f8366", primary: "#c99a2e", accent: "#f0dca0", onPrimary: "#2b2310", heroBg: "#f8f0d8", heroText: "#3f3420" } },
  { id: "xanh-ngoc-nhat", name: "Xanh ngọc nhạt", colors: { bg: "#f2f8f6", surface: "#ffffff", text: "#1f3a35", muted: "#6c8782", primary: "#3f8f80", accent: "#bfe0d8", onPrimary: "#ffffff", heroBg: "#e4f2ee", heroText: "#1f3a35" } },
  { id: "trang-tinh-khoi", name: "Trắng tinh khôi", colors: { bg: "#ffffff", surface: "#fafafa", text: "#222222", muted: "#7a7a7a", primary: "#555555", accent: "#d9d9d9", onPrimary: "#ffffff", heroBg: "#f6f6f4", heroText: "#222222" } },
  { id: "hong-dao", name: "Hồng đào", colors: { bg: "#fff7f2", surface: "#ffffff", text: "#4b2c24", muted: "#9b7a70", primary: "#e0896b", accent: "#f7cdb9", onPrimary: "#ffffff", heroBg: "#fdebe1", heroText: "#4b2c24" } },
];

/** Đầu thiệp tối, thân thiệp sáng. */
const DARK_HERO: Palette[] = [
  { id: "do-do-nga", name: "Đỏ đô ngà", colors: { bg: "#fbf6ef", surface: "#ffffff", text: "#3a1d1d", muted: "#8f6b62", primary: "#7d1f2b", accent: "#d8b77a", onPrimary: "#ffffff", heroBg: "#5a1420", heroText: "#f6ead9" } },
  { id: "navy-kem", name: "Navy kem", colors: { bg: "#f6f5f1", surface: "#ffffff", text: "#1f2a3d", muted: "#6f7787", primary: "#23395d", accent: "#c9a961", onPrimary: "#ffffff", heroBg: "#1c2c47", heroText: "#f3ecdc" } },
  { id: "xanh-rung", name: "Xanh rừng", colors: { bg: "#f4f6f1", surface: "#ffffff", text: "#22301f", muted: "#6e7a69", primary: "#2f5233", accent: "#c8b273", onPrimary: "#ffffff", heroBg: "#1f3523", heroText: "#efeadb" } },
  { id: "den-tuyen-vang", name: "Đen tuyền ánh vàng", colors: { bg: "#f7f5f0", surface: "#ffffff", text: "#1d1b18", muted: "#77716a", primary: "#a8843f", accent: "#d9bd7d", onPrimary: "#ffffff", heroBg: "#141311", heroText: "#f1e7cf" } },
  { id: "ngoc-bich-kem", name: "Ngọc bích kem", colors: { bg: "#f2f7f6", surface: "#ffffff", text: "#173733", muted: "#62807b", primary: "#1f6f66", accent: "#d4b06a", onPrimary: "#ffffff", heroBg: "#123f3a", heroText: "#eef3ee" } },
  { id: "tim-man", name: "Tím mận", colors: { bg: "#f8f4f7", surface: "#ffffff", text: "#35202f", muted: "#86707f", primary: "#6b2f5c", accent: "#d6a9c4", onPrimary: "#ffffff", heroBg: "#3d1b35", heroText: "#f5e8ef" } },
  { id: "nau-chocolate", name: "Nâu chocolate", colors: { bg: "#f8f2ec", surface: "#ffffff", text: "#3a2619", muted: "#8a7363", primary: "#7a4b2a", accent: "#d8b48a", onPrimary: "#ffffff", heroBg: "#3a2416", heroText: "#f6e9d8" } },
  { id: "xanh-co-ban", name: "Xanh coban", colors: { bg: "#f4f6fb", surface: "#ffffff", text: "#1b2440", muted: "#6c7590", primary: "#2b4bc7", accent: "#f2c14e", onPrimary: "#ffffff", heroBg: "#1d33a0", heroText: "#f4f6ff" } },
];

/** Đầu thiệp tối, thân thiệp tối (mẫu "đêm"). */
const NIGHT: Palette[] = [
  { id: "dem-navy", name: "Đêm navy", colors: { bg: "#101a2e", surface: "#16233b", text: "#eae6dc", muted: "#9ba3b4", primary: "#d9b56f", accent: "#8fa4c9", onPrimary: "#101a2e", heroBg: "#0a1222", heroText: "#f3ecdc" } },
  { id: "den-vang", name: "Đen vàng", colors: { bg: "#121110", surface: "#1b1a18", text: "#ece5d6", muted: "#9c958a", primary: "#cfae6e", accent: "#7c6a4a", onPrimary: "#121110", heroBg: "#0b0a09", heroText: "#f3e9d2" } },
  { id: "xanh-reu-dem", name: "Xanh rêu đêm", colors: { bg: "#111a14", surface: "#18241c", text: "#e6ebdf", muted: "#94a196", primary: "#c8b273", accent: "#6e8a6c", onPrimary: "#111a14", heroBg: "#0b130e", heroText: "#eef0e4" } },
  { id: "tim-dem", name: "Tím đêm", colors: { bg: "#17122a", surface: "#201a38", text: "#ebe6f5", muted: "#a39cb8", primary: "#d6b5e8", accent: "#7d6bb0", onPrimary: "#17122a", heroBg: "#0f0b1e", heroText: "#f3eefb" } },
  { id: "do-ruou-dem", name: "Đỏ rượu đêm", colors: { bg: "#1d0d12", surface: "#2a141b", text: "#f2e3e1", muted: "#b39a9c", primary: "#d4af6a", accent: "#8a3346", onPrimary: "#1d0d12", heroBg: "#14080c", heroText: "#f6e6d8" } },
];

export const PALETTES: Record<PaletteFamily, Palette[]> = { light: LIGHT, darkHero: DARK_HERO, night: NIGHT };
export const ALL_PALETTES: Palette[] = [...LIGHT, ...DARK_HERO, ...NIGHT];

/** Độ sáng tương đối của màu hex (0 tối … 1 sáng). Không phải hex thì coi như sáng. */
export function luminance(hex: string) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 1;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Họ màu của một mẫu gốc: đầu thiệp sáng / đầu tối thân sáng / cả thiệp tối. */
export function familyOf(c: { heroBg: string; bg: string }): PaletteFamily {
  if (luminance(c.heroBg) > 0.35) return "light";
  return luminance(c.bg) > 0.35 ? "darkHero" : "night";
}

/* ---------------- Độ tương phản (WCAG 2.1) ---------------- */

/** Tỉ lệ tương phản giữa hai màu hex (1 … 21). */
export function contrastRatio(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToHex(h: number, s: number, l: number) {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
  };
  return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const isHex = (c: string) => /^#[0-9a-f]{6}$/i.test(c.trim());

/**
 * Màu chủ đạo dễ đọc: giữ sắc màu, chỉnh độ sáng từng bước nhỏ tới khi chữ trên nút (onPrimary) đạt ≥ 4.5:1 và màu chủ đạo
 * trên nền thiệp đạt ≥ 3:1 (tiêu đề nhỏ, viền nút). Chữ trên nút chọn trắng hoặc màu chữ tối, cái nào rõ hơn.
 * Dùng khi vẽ thiệp (InvitationView) nên mọi mẫu và biến thể màu cùng được sửa, bảng màu gốc không đổi.
 */
export function accessiblePrimary(primary: string, bg: string, onPrimaryHint: string, darkText: string) {
  if (!isHex(primary) || !isHex(bg)) return { primary, onPrimary: onPrimaryHint };
  const dark = isHex(darkText) && luminance(darkText) < 0.2 ? darkText : "#1f1a17";
  const pickOn = (p: string) => (contrastRatio("#ffffff", p) >= contrastRatio(dark, p) ? "#ffffff" : dark);
  let p = primary;
  let on = isHex(onPrimaryHint) ? onPrimaryHint : pickOn(p);
  if (contrastRatio(on, p) < 4.5) on = pickOn(p);
  const ok = () => contrastRatio(on, p) >= 4.5 && contrastRatio(p, bg) >= 3;
  if (ok()) return { primary: p, onPrimary: on };
  // nền sáng → làm đậm màu chủ đạo; nền tối → làm sáng
  const towardDark = luminance(bg) > 0.4;
  const [h, s, l0] = hexToHsl(p);
  for (let i = 1, l = l0; i <= 30; i++) {
    l = Math.max(0, Math.min(1, l + (towardDark ? -0.015 : 0.015)));
    p = hslToHex(h, s, l);
    on = contrastRatio(on, p) >= 4.5 ? on : pickOn(p);
    if (ok()) break;
  }
  return { primary: p, onPrimary: on };
}
