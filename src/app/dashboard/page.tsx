import Link from "next/link";
import { deleteInvitationAction } from "@/app/actions/invitations";
import { ConfirmButton } from "@/components/ConfirmButton";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseInvitationData } from "@/lib/invitation";
import { FREE_INVITATION_LIMIT } from "@/lib/templates";
import { getTemplateDef } from "@/templates/registry";

export const metadata = { title: "Thiệp của tôi" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const { error } = await searchParams;
  const invitations = await db.invitation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { rsvps: true, wishes: true } } },
  });
  const isFree = user.plan !== "PREMIUM" && user.role !== "ADMIN";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Xin chào, {user.name} 👋</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gói hiện tại:{" "}
            <span className={`font-semibold ${isFree ? "" : "text-amber-600"}`}>{isFree ? "Miễn phí" : "Premium ★"}</span>
            {isFree && ` · tối đa ${FREE_INVITATION_LIMIT} thiệp, chỉ mẫu thường`}
          </p>
        </div>
        <Link href="/dashboard/new" className="btn btn-primary">
          + Tạo thiệp mới
        </Link>
      </div>

      {error === "limit" && (
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Gói miễn phí chỉ tạo được {FREE_INVITATION_LIMIT} thiệp. Nâng cấp Premium để tạo thêm và dùng mẫu cao cấp.
        </p>
      )}

      {invitations.length === 0 ? (
        <div className="card mt-10 py-16 text-center">
          <p className="text-5xl">💌</p>
          <p className="mt-4 text-zinc-600">Bạn chưa có thiệp nào.</p>
          <Link href="/dashboard/new" className="btn btn-primary mt-6">
            Tạo thiệp đầu tiên
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {invitations.map((inv) => {
            const d = parseInvitationData(inv.data);
            return (
              <div key={inv.id} className="card flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {d.groom.name} & {d.bride.name}
                    </h2>
                    <p className="text-sm text-zinc-500">Mẫu: {getTemplateDef(inv.templateId).name}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${inv.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}
                  >
                    {inv.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-lg bg-zinc-50 py-2">
                    <div className="text-lg font-semibold">{inv.views}</div>Lượt xem
                  </div>
                  <div className="rounded-lg bg-zinc-50 py-2">
                    <div className="text-lg font-semibold">{inv._count.rsvps}</div>Xác nhận
                  </div>
                  <div className="rounded-lg bg-zinc-50 py-2">
                    <div className="text-lg font-semibold">{inv._count.wishes}</div>Lời chúc
                  </div>
                </div>
                <p className="truncate text-sm text-zinc-500">
                  Link: <span className="font-mono text-zinc-700">/w/{inv.slug}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/dashboard/${inv.id}/edit`} className="btn btn-primary">
                    Chỉnh sửa
                  </Link>
                  <Link href={`/dashboard/${inv.id}/guests`} className="btn btn-outline">
                    Khách mời & lời chúc
                  </Link>
                  <Link href={`/w/${inv.slug}`} target="_blank" className="btn btn-outline">
                    Xem thiệp ↗
                  </Link>
                  <form action={deleteInvitationAction} className="ml-auto">
                    <input type="hidden" name="id" value={inv.id} />
                    <ConfirmButton message="Xoá thiệp này cùng toàn bộ xác nhận và lời chúc? Không thể hoàn tác.">Xoá</ConfirmButton>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
