import Link from "next/link";
import { setInvitationStatusAction } from "@/app/actions/admin";
import { deleteInvitationAction } from "@/app/actions/invitations";
import { createShowcaseAction } from "@/app/actions/showcase";
import { ConfirmButton } from "@/components/ConfirmButton";
import { db } from "@/lib/db";
import { getTemplateDef } from "@/templates/registry";

export const metadata = { title: "Quản lý thiệp" };

export default async function AdminInvitations({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const list = await db.invitation.findMany({
    where: q ? { OR: [{ slug: { contains: q } }, { title: { contains: q } }, { user: { email: { contains: q } } }] } : undefined,
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { email: true } }, _count: { select: { rsvps: true, wishes: true } } },
    take: 200,
  });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Thiệp cưới</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Tìm slug, tên, email…" className="input w-64" />
          <button className="btn btn-outline">Tìm</button>
        </form>
      </div>
      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3">Thiệp</th>
              <th className="px-4 py-3">Chủ</th>
              <th className="px-4 py-3">Mẫu</th>
              <th className="px-4 py-3">Xem / RSVP / Chúc</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id} className="border-t border-zinc-100">
                <td className="px-4 py-3">
                  <Link href={`/w/${i.slug}`} target="_blank" className="font-medium hover:underline">
                    {i.title}
                  </Link>
                  <p className="font-mono text-xs text-zinc-500">/w/{i.slug}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600">{i.user.email}</td>
                <td className="px-4 py-3">{getTemplateDef(i.templateId).name}</td>
                <td className="px-4 py-3">
                  {i.views} / {i._count.rsvps} / {i._count.wishes}
                </td>
                <td className="px-4 py-3">
                  <form action={setInvitationStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={i.id} />
                    <input type="hidden" name="status" value={i.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                    <span>{i.status === "PUBLISHED" ? "🟢 Công khai" : "⚪ Nháp"}</span>
                    <button className="text-xs text-brand hover:underline">{i.status === "PUBLISHED" ? "Gỡ" : "Xuất bản"}</button>
                  </form>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Link href={`/dashboard/${i.id}/edit`} className="mr-3 text-xs text-brand hover:underline">
                    Sửa
                  </Link>
                  <form action={createShowcaseAction} className="mr-3 inline">
                    <input type="hidden" name="invitationId" value={i.id} />
                    <button className="text-xs text-brand hover:underline" title="Tạo bản giới thiệu độc lập (chỉ lấy thiết kế, dùng tên + ảnh demo)">
                      Tạo bản giới thiệu cho mẫu
                    </button>
                  </form>
                  <form action={deleteInvitationAction} className="inline">
                    <input type="hidden" name="id" value={i.id} />
                    <ConfirmButton message="Xoá thiệp này?" className="text-xs text-red-600 hover:underline">
                      Xoá
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
