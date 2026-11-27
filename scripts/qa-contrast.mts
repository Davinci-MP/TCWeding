// Độ tương phản màu của mọi mẫu (gốc + biến thể màu) theo WCAG 2.1.
//   npx tsx scripts/qa-contrast.mts
// Chữ thường cần ≥ 4.5, chữ lớn / tiêu đề / viền nút ≥ 3.
import { TEMPLATES } from "../src/templates/registry";
import { accessiblePrimary } from "../src/templates/palettes";

function lum(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [n >> 16, (n >> 8) & 255, n & 255]
    .map((v) => v / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
}
export const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const CHECKS: [string, (c: (typeof TEMPLATES)[number]["colors"]) => [string, string], number][] = [
  ["chữ / nền", (c) => [c.text, c.bg], 4.5],
  ["chữ / thẻ", (c) => [c.text, c.surface], 4.5],
  ["chữ phụ / nền", (c) => [c.muted, c.bg], 3],
  ["chữ phụ / thẻ", (c) => [c.muted, c.surface], 3],
  ["chữ đầu thiệp / nền đầu thiệp", (c) => [c.heroText, c.heroBg], 4.5],
  ["chữ nút / nút", (c) => [c.onPrimary, c.primary], 4.5],
  ["màu chủ đạo / nền (tiêu đề nhỏ, viền nút)", (c) => [c.primary, c.bg], 3],
  ["màu chủ đạo / thẻ", (c) => [c.primary, c.surface], 3],
];

let fail = 0;
const rows: string[] = [];
// Đo trên màu thực tế khi vẽ thiệp (InvitationView chỉnh màu chủ đạo qua accessiblePrimary). --raw: đo bảng màu gốc.
const RAW = process.argv.includes("--raw");
for (const t of TEMPLATES) {
  const fixed = accessiblePrimary(t.colors.primary, t.colors.bg, t.colors.onPrimary, t.colors.text);
  const colors = RAW ? t.colors : { ...t.colors, primary: fixed.primary, onPrimary: fixed.onPrimary };
  const bad = CHECKS.map(([name, pick, min]) => {
    const [a, b] = pick(colors);
    const r = ratio(a, b);
    return r < min ? `${name} ${r.toFixed(2)} < ${min}` : "";
  }).filter(Boolean);
  if (bad.length) {
    fail++;
    rows.push(`${t.id}: ${bad.join("; ")}`);
  }
}
console.log(`${RAW ? "[bảng màu gốc] " : "[màu khi vẽ thiệp] "}Kiểm tra ${TEMPLATES.length} mẫu × ${CHECKS.length} cặp màu. Không đạt: ${fail} mẫu.`);
for (const r of rows) console.log("- " + r);
