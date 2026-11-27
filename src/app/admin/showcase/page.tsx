import Link from "next/link";
import { db } from "@/lib/db";
import { listTemplates } from "@/lib/templates";
import { templateCode, templateHash } from "@/lib/thiep";
import { getTemplateDef } from "@/templates/registry";

export const metadata = { title: "Bản giới thiệu & ảnh bìa mẫu" };

export default async function AdminShowcases() {
  const [list, templates, configs] = await Promise.all([
    db.templateShowcase.findMany({ orderBy: { updatedAt: "desc" }, take: 200 }),
    listTemplates({ includeInactive: true }),
    db.templateConfig.findMany({ select: { id: true, coverUrl: true, showcaseId: true } }),
  ]);
  const cfg = new Map(configs.map((c) => [c.id, c]));
  const withCover = templates.filter((t) => cfg.get(t.id)?.coverUrl).length;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Bản giới thiệu & ảnh bìa mẫu</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Tạo bản giới thiệu từ thiệp admin làm hộ (nút “Tạo bản giới thiệu cho mẫu” ở trang Thiệp đã làm hoặc chi tiết đơn). Bản giới thiệu chỉ giữ thiết kế; tên, ảnh, địa chỉ, STK… của khách luôn bị thay bằng dữ liệu demo.
        </p>
      </div>

      <section className="card overflow-x-auto p-0">
        <h2 className="px-4 pt-4 font-semibold">Bản giới thiệu</h2>
        {list.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">Chưa có bản giới thiệu nào.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3">Mẫu đích</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Cập nhật</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3">
                    {templateCode(s.templateId)} · {getTemplateDef(s.templateId).name}
                  </td>
                  <td className="px-4 py-3">{s.status === "PUBLISHED" ? "🟢 Đang dùng cho “Xem mẫu”" : "⚪ Nháp"}</td>
                  <td className="px-4 py-3 text-zinc-500">{s.updatedAt.toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/showcase/${s.id}`} className="text-xs text-brand hover:underline">
                      Mở
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card p-0">
        <h2 className="px-4 pt-4 font-semibold">Ảnh bìa trong kho mẫu</h2>
        <p className="px-4 text-sm text-zinc-500">
          {withCover}/{templates.length} mẫu đang dùng ảnh bìa riêng; còn lại dùng ảnh demo mặc định.
        </p>
        <ul className="mt-3 divide-y divide-zinc-100 text-sm">
          {templates.map((t) => {
            const c = cfg.get(t.id);
            return (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <span className="w-16 font-mono text-xs">{templateCode(t.id)}</span>
                <span className="min-w-40 flex-1">
                  {t.name}
                  {t.baseId ? <span className="text-xs text-zinc-500"> · biến thể màu</span> : null}
                </span>
                <span className="text-xs text-zinc-500">{c?.coverUrl ? "Ảnh bìa riêng" : "Ảnh demo"}{c?.showcaseId ? " · có bản giới thiệu" : ""}</span>
                <a href={`/thiep#${templateHash(t.id)}`} target="_blank" className="text-xs text-brand hover:underline">
                  Xem mẫu
                </a>
                <Link href={`/admin/showcase/cover/${t.id}`} className="text-xs text-brand hover:underline">
                  Ảnh bìa
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
