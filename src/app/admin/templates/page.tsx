import Link from "next/link";
import { updateTemplateConfigAction } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { listTemplates } from "@/lib/templates";

export const metadata = { title: "Mẫu thiệp" };

export default async function AdminTemplates() {
  const templates = await listTemplates({ includeInactive: true });
  const usage = await db.invitation.groupBy({ by: ["templateId"], _count: true });
  const used = new Map(usage.map((u) => [u.templateId, u._count]));
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Mẫu thiệp</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Bật/tắt mẫu, đặt mẫu Premium và thứ tự hiển thị. Để thêm mẫu mới, khai báo trong <code>src/templates/registry.ts</code>.
      </p>
      <div className="mt-6 space-y-3">
        {templates.map((t) => (
          <form key={t.id} action={updateTemplateConfigAction} className="card flex flex-wrap items-center gap-4 p-4">
            <input type="hidden" name="id" value={t.id} />
            <div className="flex h-12 w-24 overflow-hidden rounded-lg">
              {[t.colors.heroBg, t.colors.primary, t.colors.bg, t.colors.accent].map((c, k) => (
                <span key={k} className="flex-1" style={{ background: c }} />
              ))}
            </div>
            <div className="min-w-48 flex-1">
              <p className="font-semibold">{t.name}</p>
              <p className="text-xs text-zinc-500">
                {t.id} · {t.category} · {used.get(t.id) ?? 0} thiệp đang dùng
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={t.isActive} /> Hiển thị
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPremium" defaultChecked={t.isPremium} /> Premium
            </label>
            <label className="flex items-center gap-2 text-sm">
              Thứ tự <input type="number" name="sortOrder" defaultValue={t.sortOrder} className="input w-20" />
            </label>
            <Link href={`/templates/${t.id}`} target="_blank" className="btn btn-outline">
              Xem
            </Link>
            <button className="btn btn-primary">Lưu</button>
          </form>
        ))}
      </div>
    </div>
  );
}
