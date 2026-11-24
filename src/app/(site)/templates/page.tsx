import { TemplateGrid } from "@/components/TemplateGrid";
import { listTemplates } from "@/lib/templates";

export const metadata = { title: "Mẫu thiệp" };

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const all = await listTemplates();
  const categories = [...new Set(all.map((t) => t.category))];
  const templates = cat ? all.filter((t) => t.category === cat) : all;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-semibold">Kho mẫu thiệp</h1>
      <p className="mt-2 text-zinc-500">Bấm “Xem thử” để trải nghiệm thiệp thật với dữ liệu mẫu.</p>
      <div className="my-8 flex flex-wrap gap-2">
        <a href="/templates" className={`rounded-full px-4 py-1.5 text-sm ${!cat ? "bg-brand text-white" : "bg-zinc-100"}`}>
          Tất cả
        </a>
        {categories.map((c) => (
          <a
            key={c}
            href={`/templates?cat=${encodeURIComponent(c)}`}
            className={`rounded-full px-4 py-1.5 text-sm ${cat === c ? "bg-brand text-white" : "bg-zinc-100"}`}
          >
            {c}
          </a>
        ))}
      </div>
      <TemplateGrid templates={templates} />
    </div>
  );
}
