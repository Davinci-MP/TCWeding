/**
 * Lập kế hoạch ảnh bìa kho mẫu từ ẢNH STUDIO CÔNG KHAI (album COLLECTION đã xuất bản), ghi scripts/data/cover-plan.json.
 *   npx tsx --env-file=.env.turso scripts/plan-covers.mts --fetch   # lấy danh sách ảnh album đã xuất bản → .tmp/studio-photos.json
 *   npx tsx scripts/plan-covers.mts                                 # ghép ảnh theo phong cách mẫu → cover-plan.json
 * Duyệt ở đúng kích thước thumbnail: /dev/covers (?view=photos để xem mã ảnh, ?only=new). Áp: scripts/apply-covers.mts.
 * Nhóm ảnh (mã "<album>-<ảnh>") được chọn tay sau khi xem; loại ảnh ngang, ảnh mờ/chi tiết, ảnh một người.
 * Mẫu không có ô ảnh bìa trong thumbnail (Polaroid, Cobalt) bị bỏ khỏi kế hoạch sau khi đo ở /dev/covers.
 */
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { createPrisma } from "../src/lib/prisma";
import { TEMPLATES } from "../src/templates/registry";

if (process.argv.includes("--fetch")) {
  const db = createPrisma();
  const albums = await db.album.findMany({
    where: { status: "PUBLISHED", kind: "COLLECTION" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { title: true, photos: { orderBy: { sortOrder: "asc" }, select: { url: true, width: true, height: true } } },
  });
  const list = albums.flatMap((a, ai) => a.photos.map((p, pi) => ({ id: `${ai}-${pi}`, album: a.title, url: p.url, w: p.width, h: p.height })));
  mkdirSync(".tmp", { recursive: true });
  writeFileSync(".tmp/studio-photos.json", JSON.stringify(list, null, 1));
  console.log(list.length, "ảnh");
  process.exit(0);
}
const NO_THUMB_COVER = /^(polaroid-fun|cobalt-type)/; // thumbnail của các mẫu này không hiện ảnh bìa
const photos: { id: string; url: string }[] = JSON.parse(readFileSync(".tmp/studio-photos.json", "utf8"));
const url = new Map(photos.map((p) => [p.id, p.url]));
const P = (s: string) => s.split(" ");
const pools: Record<string, string[]> = {
  classic: P("0-1 0-3 0-4 0-2 0-8 7-0 7-2 7-3 7-1 7-11 7-5 7-7 0-0 0-5 0-7 7-4 7-6"),
  modern: P("1-0 1-2 1-3 1-4 1-6 1-7 1-8 1-9 3-0 3-2 3-4 4-0 4-1 4-5 4-8 4-9 1-5 4-4 4-6 4-7 3-1 3-3 4-2 4-3"),
  nature: P("2-0 2-1 2-2 2-3 2-5 2-6 2-7 2-8 8-0 8-1 8-2 8-3 8-4 8-5 8-7 8-8 8-11 8-13 8-14 9-0 9-2 9-3 9-5 9-6 9-1 9-4"),
  aodai: P("5-0 5-1 5-2 5-3 5-4 5-5 5-6 5-7 5-8"),
  red: P("6-0 6-1 6-2 6-3 6-4 6-6 6-7"),
  dark: P("11-0 11-6 11-7 4-9 1-7 1-0 4-5 1-9 3-4"),
  fun: P("10-0 10-3 10-4 10-5 7-9 1-11 1-10 7-8 10-6"),
};
const lum = (h: string) => { const n = parseInt(h.replace("#", "").slice(0, 6), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 2.55; };
const used = new Map<string, number>();
const byBase = new Map<string, Set<string>>();
const plan: Record<string, { url: string; frame: null; note: string }> = {};
for (const t of TEMPLATES) {
  const base = t.baseId ?? t.id;
  const dark = lum(t.colors.heroBg) < 30;
  const red = /song-hy|do-hy|do-do-nga|burgundy/.test(t.id);
  const pool =
    t.category === "Truyền thống" ? (red || t.id === "song-hy" ? "red" : "aodai")
    : red && dark ? "red"
    : /polaroid|citrus|kraft|retro/.test(t.id) ? "fun"
    : dark ? "dark"
    : t.category === "Thiên nhiên" || /wildflower|watercolor|garden/.test(t.id) ? "nature"
    : t.category === "Hiện đại" ? "modern"
    : "classic";
  const seen = byBase.get(base) ?? new Set();
  const cand = pools[pool].filter((id) => url.has(id) && !seen.has(id)).sort((a, b) => (used.get(a) ?? 0) - (used.get(b) ?? 0));
  const pick = cand[0];
  used.set(pick, (used.get(pick) ?? 0) + 1);
  seen.add(pick);
  byBase.set(base, seen);
  plan[t.id] = { url: url.get(pick)!, frame: null, note: `${pool} ${pick}` };
}
// bỏ sau khi chọn (giữ nguyên thứ tự chọn ảnh của các mẫu khác như bản đã duyệt)
for (const id of Object.keys(plan)) if (NO_THUMB_COVER.test(id)) delete plan[id];
writeFileSync("scripts/data/cover-plan.json", `${JSON.stringify(plan, null, 1)}\n`);
console.log(Object.keys(plan).length, "max reuse", Math.max(...used.values()));
