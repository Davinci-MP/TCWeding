/**
 * Áp kế hoạch ảnh bìa kho mẫu (scripts/data/cover-plan.json: templateId → ảnh studio công khai) vào TemplateConfig.
 * Mặc định chỉ in kế hoạch (không ghi). --apply để ghi. Ảnh bìa đang dùng được đẩy vào lịch sử (khôi phục được ở admin).
 * Mẫu admin đã tự đặt ảnh bìa thì bỏ qua (trừ khi --force). Không đổi thứ tự / Premium / mã mẫu.
 *
 *   npx tsx scripts/apply-covers.mts                 # local, xem trước
 *   npx tsx scripts/apply-covers.mts --apply         # local, ghi
 *   npx tsx --env-file=.env.turso scripts/apply-covers.mts --apply   # production (cần turso:push trước)
 *   --from 1 --to 30                                 # chỉ mẫu TC-01..TC-30
 *   --no-resize                                      # dùng thẳng ảnh gốc (mặc định: lưu bản thu nhỏ 1200px, nhẹ hơn nhiều lần)
 */
import { readFileSync } from "fs";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { createPrisma } from "../src/lib/prisma";
import { cleanCoverUrl, COVER_HISTORY_MAX, parseCoverHistory } from "../src/lib/templateCover";
import { TEMPLATES } from "../src/templates/registry";

// src/lib/storage.ts có import "server-only" (chỉ có trong bundle của Next): thay bằng module rỗng khi chạy bằng tsx
registerHooks({ resolve: (spec, ctx, next) => (spec === "server-only" ? { url: pathToFileURL("scripts/stubs/empty.mjs").href, shortCircuit: true } : next(spec, ctx)) });
const { saveUpload, usingBlob } = await import("../src/lib/storage");

const args = process.argv.slice(2);
const flag = (k: string) => args.includes(k);
const num = (k: string, d: number) => (args.includes(k) ? Number(args[args.indexOf(k) + 1]) : d);
const apply = flag("--apply");
const force = flag("--force");
const from = num("--from", 1);
const to = num("--to", TEMPLATES.length);
const resize = !flag("--no-resize");
if (apply && resize && process.env.TURSO_DATABASE_URL && !usingBlob()) {
  console.error("Ghi production cần BLOB_READ_WRITE_TOKEN để lưu ảnh thu nhỏ lên Vercel Blob (hoặc chạy với --no-resize).");
  process.exit(1);
}
const COVER_MAX = 1200;
const resized = new Map<string, string>();
/** Tải ảnh gốc, thu nhỏ cạnh dài về 1200px (JPEG 82), lưu bằng storage của dự án. Ảnh dùng lại cho nhiều mẫu chỉ xử lý một lần. */
async function smallCopy(url: string) {
  if (!resize) return url;
  const hit = resized.get(url);
  if (hit) return hit;
  let res: Response | null = null;
  for (let i = 0; i < 4 && !res?.ok; i++) res = await fetch(url).catch(() => null); // mạng chập chờn: thử lại
  if (!res?.ok) throw new Error(`Tải ảnh lỗi ${res?.status ?? "mạng"}: ${url}`);
  const out = await sharp(Buffer.from(await res.arrayBuffer())).rotate().resize(COVER_MAX, COVER_MAX, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  const saved = await saveUpload(out, "jpg", "image/jpeg");
  resized.set(url, saved);
  return saved;
}

const plan: Record<string, { url: string; frame?: unknown; note?: string }> = JSON.parse(readFileSync("scripts/data/cover-plan.json", "utf8"));
const db = createPrisma();
const configs = new Map((await db.templateConfig.findMany()).map((c) => [c.id, c]));
const stats = { planned: 0, applied: 0, skippedManual: 0, same: 0, noPlan: 0 };
const noPlan: string[] = [];

for (const [i, t] of TEMPLATES.entries()) {
  const code = `TC-${String(i + 1).padStart(2, "0")}`;
  if (i + 1 < from || i + 1 > to) continue;
  const p = plan[t.id];
  const url = cleanCoverUrl(p?.url);
  if (!url) {
    stats.noPlan++;
    noPlan.push(code);
    continue;
  }
  stats.planned++;
  const cfg = configs.get(t.id);
  if (cfg?.coverUrl === url) {
    stats.same++;
    continue;
  }
  if (cfg?.coverUrl && !force) {
    stats.skippedManual++;
    console.log(`${code} bỏ qua: đã có ảnh bìa riêng (admin đặt hoặc lần chạy trước); --force để thay`);
    continue;
  }
  if (!apply) continue;
  const history = cfg?.coverUrl ? [{ url: cfg.coverUrl, frame: null, at: new Date().toISOString() }, ...parseCoverHistory(cfg.coverHistory)] : parseCoverHistory(cfg?.coverHistory ?? "[]");
  const small = await smallCopy(url);
  const data = { coverUrl: small, coverFrame: p.frame ? JSON.stringify(p.frame) : "", coverHistory: JSON.stringify(history.slice(0, COVER_HISTORY_MAX)) };
  await db.templateConfig.upsert({ where: { id: t.id }, create: { id: t.id, isActive: true, isPremium: t.premium, sortOrder: i, ...data }, update: data });
  stats.applied++;
}
console.log(apply ? "ĐÃ GHI" : "XEM TRƯỚC (thêm --apply để ghi)", stats);
if (noPlan.length) console.log("Giữ ảnh demo (không có ô ảnh bìa trong thumbnail / chưa có ảnh phù hợp):", noPlan.join(", "));
