import Link from "next/link";
import type { TemplateWithConfig } from "@/lib/templates";
import { TemplateThumb } from "./TemplateThumb";

export function TemplateGrid({
  templates,
  action,
}: {
  templates: TemplateWithConfig[];
  /** Nếu truyền vào: hiện nút "Dùng mẫu này" gọi server action */
  action?: (fd: FormData) => Promise<void>;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <div key={t.id} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-lg">
          <div className="relative">
            <TemplateThumb templateId={t.id} />
            {t.isPremium && (
              <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 shadow">
                ★ PREMIUM
              </span>
            )}
          </div>
          <div className="border-t border-zinc-100 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t.name}</h3>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{t.category}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{t.description}</p>
            <div className="mt-4 flex gap-2">
              <Link href={`/templates/${t.id}`} target="_blank" className="btn btn-outline flex-1">
                Xem thử
              </Link>
              {action ? (
                <form action={action} className="flex-1">
                  <input type="hidden" name="templateId" value={t.id} />
                  <button className="btn btn-primary w-full">Dùng mẫu này</button>
                </form>
              ) : (
                <Link href={`/dashboard/new?template=${t.id}`} className="btn btn-primary flex-1">
                  Dùng mẫu này
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
