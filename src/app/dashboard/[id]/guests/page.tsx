import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteRsvpAction, setWishHiddenAction } from "@/app/actions/invitations";
import { ConfirmButton } from "@/components/ConfirmButton";
import { getOwnedInvitation, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Khách mời & lời chúc" };

const ATTEND: Record<string, [string, string]> = {
  YES: ["Tham dự", "bg-emerald-100 text-emerald-700"],
  MAYBE: ["Chưa chắc", "bg-amber-100 text-amber-700"],
  NO: ["Không đến", "bg-zinc-100 text-zinc-600"],
};

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const inv = await getOwnedInvitation((await params).id, user);
  if (!inv) notFound();
  const [rsvps, wishes] = await Promise.all([
    db.rsvp.findMany({ where: { invitationId: inv.id }, orderBy: { createdAt: "desc" } }),
    db.wish.findMany({ where: { invitationId: inv.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const yes = rsvps.filter((r) => r.attending === "YES");
  const stats = [
    ["Phản hồi", rsvps.length],
    ["Sẽ tham dự", yes.length],
    ["Tổng số khách", yes.reduce((s, r) => s + r.guests, 0)],
    ["Nhà trai / Nhà gái", `${yes.filter((r) => r.side === "GROOM").length} / ${yes.filter((r) => r.side === "BRIDE").length}`],
    ["Lời chúc", wishes.length],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Thiệp của tôi
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">{inv.title}</h1>
        <div className="flex gap-2">
          <Link href={`/dashboard/${inv.id}/edit`} className="btn btn-outline">
            Chỉnh sửa thiệp
          </Link>
          <a href={`/api/invitations/${inv.id}/export`} className="btn btn-primary">
            ⬇ Xuất Excel (CSV)
          </a>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(([l, v]) => (
          <div key={l} className="card p-4 text-center">
            <div className="text-2xl font-semibold">{v}</div>
            <div className="text-sm text-zinc-500">{l}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-semibold">Xác nhận tham dự</h2>
      <div className="card mt-3 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">SĐT</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Số người</th>
              <th className="px-4 py-3">Khách của</th>
              <th className="px-4 py-3">Ghi chú</th>
              <th className="px-4 py-3">Thời gian</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rsvps.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  Chưa có xác nhận nào.
                </td>
              </tr>
            )}
            {rsvps.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">{r.phone}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${ATTEND[r.attending]?.[1]}`}>{ATTEND[r.attending]?.[0]}</span>
                </td>
                <td className="px-4 py-3">{r.attending === "NO" ? "-" : r.guests}</td>
                <td className="px-4 py-3">{r.side === "GROOM" ? "Nhà trai" : r.side === "BRIDE" ? "Nhà gái" : "-"}</td>
                <td className="max-w-xs px-4 py-3 text-zinc-600">{r.note}</td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-500">{r.createdAt.toLocaleString("vi-VN")}</td>
                <td className="px-4 py-3">
                  <form action={deleteRsvpAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <ConfirmButton message="Xoá phản hồi này?" className="text-xs text-red-600 hover:underline">
                      Xoá
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Sổ lưu bút</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {wishes.length === 0 && <p className="text-zinc-500">Chưa có lời chúc nào.</p>}
        {wishes.map((w) => (
          <div key={w.id} className={`card p-4 ${w.hidden ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{w.name}</p>
              <form action={setWishHiddenAction}>
                <input type="hidden" name="id" value={w.id} />
                <input type="hidden" name="hidden" value={w.hidden ? "0" : "1"} />
                <button className="text-xs text-brand hover:underline">{w.hidden ? "Hiện lại" : "Ẩn khỏi thiệp"}</button>
              </form>
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">{w.message}</p>
            <p className="mt-2 text-xs text-zinc-400">{w.createdAt.toLocaleString("vi-VN")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
