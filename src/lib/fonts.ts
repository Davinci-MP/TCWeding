// Danh sách font có hỗ trợ tiếng Việt (Google Fonts), dùng chung cho mẫu thiệp, trình soạn thiệp
// và phần chỉnh kiểu chữ của website. Dùng được cả client lẫn server.

export type FontKind = "serif" | "sans" | "script";
export type FontDef = { name: string; kind: FontKind; param: string; fallback: string };

export const FONTS: FontDef[] = [
  // Có chân — tiêu đề trang nhã
  { name: "Cormorant Garamond", kind: "serif", param: "Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400", fallback: "serif" },
  { name: "Playfair Display", kind: "serif", param: "Playfair+Display:ital,wght@0,400;0,700;1,400", fallback: "serif" },
  { name: "Lora", kind: "serif", param: "Lora:ital,wght@0,400;0,600;1,400", fallback: "serif" },
  { name: "Prata", kind: "serif", param: "Prata", fallback: "serif" },
  { name: "EB Garamond", kind: "serif", param: "EB+Garamond:ital,wght@0,400;0,600;1,400", fallback: "serif" },
  { name: "Spectral", kind: "serif", param: "Spectral:ital,wght@0,300;0,400;0,600;1,300;1,400", fallback: "serif" },
  { name: "Fraunces", kind: "serif", param: "Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..800", fallback: "serif" },
  { name: "Yeseva One", kind: "serif", param: "Yeseva+One", fallback: "serif" },
  { name: "Noto Serif Display", kind: "serif", param: "Noto+Serif+Display:ital,wght@0,400;0,600;1,400", fallback: "serif" },
  { name: "Noto Serif", kind: "serif", param: "Noto+Serif:ital,wght@0,400;0,600;1,400", fallback: "serif" },
  // Không chân — nội dung dễ đọc
  { name: "Be Vietnam Pro", kind: "sans", param: "Be+Vietnam+Pro:wght@300;400;500;600;700", fallback: "sans-serif" },
  { name: "Montserrat", kind: "sans", param: "Montserrat:wght@300;400;600", fallback: "sans-serif" },
  { name: "Quicksand", kind: "sans", param: "Quicksand:wght@400;600", fallback: "sans-serif" },
  { name: "Josefin Sans", kind: "sans", param: "Josefin+Sans:wght@300;400;600", fallback: "sans-serif" },
  { name: "Nunito", kind: "sans", param: "Nunito:wght@300;400;600;700", fallback: "sans-serif" },
  { name: "Mulish", kind: "sans", param: "Mulish:wght@300;400;600", fallback: "sans-serif" },
  { name: "Bricolage Grotesque", kind: "sans", param: "Bricolage+Grotesque:opsz,wght@12..96,300..800", fallback: "sans-serif" },
  { name: "Space Grotesk", kind: "sans", param: "Space+Grotesk:wght@400;500;700", fallback: "sans-serif" },
  { name: "Unbounded", kind: "sans", param: "Unbounded:wght@400;700;900", fallback: "sans-serif" },
  // Viết tay / thư pháp — tên cô dâu chú rể
  { name: "Great Vibes", kind: "script", param: "Great+Vibes", fallback: "cursive" },
  { name: "Dancing Script", kind: "script", param: "Dancing+Script:wght@500;700", fallback: "cursive" },
  { name: "Allura", kind: "script", param: "Allura", fallback: "cursive" },
  { name: "Alex Brush", kind: "script", param: "Alex+Brush", fallback: "cursive" },
  { name: "Charm", kind: "script", param: "Charm:wght@400;700", fallback: "cursive" },
  { name: "Imperial Script", kind: "script", param: "Imperial+Script", fallback: "cursive" },
  { name: "Ephesis", kind: "script", param: "Ephesis", fallback: "cursive" },
  { name: "Pacifico", kind: "script", param: "Pacifico", fallback: "cursive" },
  { name: "Patrick Hand", kind: "script", param: "Patrick+Hand", fallback: "cursive" },
  { name: "Pangolin", kind: "script", param: "Pangolin", fallback: "cursive" },
  { name: "Itim", kind: "script", param: "Itim", fallback: "cursive" },
  { name: "Mali", kind: "script", param: "Mali:wght@400;600", fallback: "cursive" },
];

export const FONT_KIND_LABEL: Record<FontKind, string> = { serif: "Có chân (trang nhã)", sans: "Không chân (hiện đại)", script: "Viết tay / thư pháp" };

/** "'Playfair Display', serif" → "Playfair Display". */
export const fontName = (family: string) => family.split(",")[0].replace(/['"]/g, "").trim();
export const findFont = (name: string) => FONTS.find((f) => f.name === name);
/** Tên font → giá trị CSS font-family. Font không có trong danh sách trả "". */
export const fontFamily = (name: string) => {
  const f = findFont(name);
  return f ? `'${f.name}', ${f.fallback}` : "";
};

/** URL Google Fonts (có bảng chữ tiếng Việt) cho các font đã chọn. Bỏ qua font không có trong danh sách. */
export function googleFontsUrl(names: string[]) {
  const params = [...new Set(names.map(fontName))].map((n) => findFont(n)?.param).filter(Boolean);
  return params.length ? `https://fonts.googleapis.com/css2?${params.map((p) => `family=${p}`).join("&")}&display=swap&subset=vietnamese` : "";
}
