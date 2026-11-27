import { existsSync, readFileSync } from "fs";
import { notFound } from "next/navigation";
import { TemplateThumb } from "@/components/TemplateThumb";
import { templateCode } from "@/lib/thiep";
import { TEMPLATES } from "@/templates/registry";

// Trang QA nội bộ (dev hoặc TCW_QA=1): duyệt kế hoạch ảnh bìa kho mẫu ở đúng kích thước thumbnail thật.
// ?view=photos: bảng ảnh studio công khai (.tmp/studio-photos.json) kèm mã để chọn.
// Mặc định: thumbnail từng mẫu với ảnh trong scripts/data/cover-plan.json (cột trái: ảnh hiện tại, phải: ảnh mới).

type Photo = { id: string; album: string; url: string; w: number; h: number };
type Plan = Record<string, { url: string; frame?: { x: number; y: number; z: number; fit: "cover" | "contain" } | null; note?: string }>;
const read = <T,>(p: string, d: T): T => (existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as T) : d);

export default async function CoverQa({ searchParams }: { searchParams: Promise<{ view?: string; from?: string; to?: string; w?: string; only?: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.TCW_QA !== "1") notFound();
  const sp = await searchParams;
  if (sp.view === "photos") {
    const photos = read<Photo[]>(".tmp/studio-photos.json", []);
    return (
      <div className="grid grid-cols-6 gap-2 p-3 text-[11px] lg:grid-cols-10">
        {photos.map((p) => (
          <figure key={p.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover" />
            <figcaption className="font-mono">
              {p.id} {p.w > p.h ? "▭" : ""}
            </figcaption>
          </figure>
        ))}
      </div>
    );
  }
  const plan = read<Plan>("scripts/data/cover-plan.json", {});
  const from = Number(sp.from ?? 1) - 1;
  const to = Number(sp.to ?? 108);
  const w = Number(sp.w ?? 163); // 163 = cột kho mẫu trên điện thoại 375px, ~270 trên máy tính
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-5 bg-[#f6f2ec] p-3">
      {TEMPLATES.slice(from, to).map((t) => {
        const c = plan[t.id];
        return (
          <figure key={t.id} className="flex gap-1">
            {(sp.only === "new" ? [c ? { url: c.url, frame: c.frame ?? null } : null] : [null, c ? { url: c.url, frame: c.frame ?? null } : null]).map((cover, k) => (
              <div key={k} style={{ width: w }} className={`overflow-hidden rounded-2xl ${!c && (k || sp.only === "new") ? "opacity-30" : ""}`}>
                <TemplateThumb templateId={t.id} height={340} cover={cover} />
              </div>
            ))}
            <figcaption className="w-10 text-[11px] font-semibold [writing-mode:vertical-rl]">
              {templateCode(t.id)} {c ? "✓" : "—"} {c?.note ?? ""}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
