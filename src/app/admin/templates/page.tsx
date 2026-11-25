import Link from "next/link";
import { updateTemplateConfigAction } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { listTemplates } from "@/lib/templates";
import { templateCode, templateHash } from "@/lib/thiep";

export const metadata = { title: "Mẫu thiệp" };

export default async function AdminTemplates({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const [all, usage, favs, ordered, { sort }] = await Promise.all([
    listTemplates({ includeInactive: true }),
    db.invitation.groupBy({ by: ["templateId"], _count: true }),
    db.templateFavorite.groupBy({ by: ["templateId"], _count: true }),
    db.order.groupBy({ by: ["templateId"], _count: true }),
    searchParams,
  ]);
  const used = new Map(usage.map((u) => [u.templateId, u._count]));
  const liked = new Map(favs.map((u) => [u.templateId, u._count]));
  const orders = new Map(ordered.map((u) => [u.templateId, u._count]));
  const templates = sort === "likes" ? [...all].sort((a, b) => (liked.get(b.id) ?? 0) - (liked.get(a.id) ?? 0)) : all;
  const visitors = await db.templateFavorite.groupBy({ by: ["visitorId"] }).then((r) => r.length);
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Mẫu thiệp</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Bật/tắt mẫu, đặt mẫu Premium và thứ tự hiển thị ở trang /thiep. ❤ là số khách đã thả tim mẫu (khách không cần tài khoản, nhận diện bằng cookie ẩn danh). Để thêm mẫu mới, khai báo trong <code>src/templates/registry.ts</code>.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-zinc-500">{visitors} khách đã thả tim · Sắp xếp:</span>
        <Link href="/admin/templates" className={`rounded-full px-3 py-1.5 ${sort !== "likes" ? "bg-zinc-900 text-white" : "bg-zinc-100"}`}>
          Thứ tự hiển thị
        </Link>
        <Link href="/admin/templates?sort=likes" className={`rounded-full px-3 py-1.5 ${sort === "likes" ? "bg-zinc-900 text-white" : "bg-zinc-100"}`}>
          Được thích nhiều nhất
        </Link>
      </div>
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
              <p className="font-semibold">
                {templateCode(t.id)} · {t.name}
              </p>
              <p className="text-xs text-zinc-500">
                {t.category} · <span className="font-medium text-red-700">❤ {liked.get(t.id) ?? 0}</span> · {orders.get(t.id) ?? 0} đơn · {used.get(t.id) ?? 0} thiệp đang dùng
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
            <Link href={`/thiep#${templateHash(t.id)}`} target="_blank" className="btn btn-outline">
              Xem
            </Link>
            <button className="btn btn-primary">Lưu</button>
          </form>
        ))}
      </div>
    </div>
  );
}
