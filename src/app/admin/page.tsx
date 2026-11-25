import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Quản trị" };

export default async function AdminHome() {
  const since = new Date(Date.now() - 7 * 86400000);
  const [users, premium, invitations, published, rsvps, wishes, newUsers, views, recent] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { plan: "PREMIUM" } }),
    db.invitation.count(),
    db.invitation.count({ where: { status: "PUBLISHED" } }),
    db.rsvp.count(),
    db.wish.count(),
    db.user.count({ where: { createdAt: { gte: since } } }),
    db.invitation.aggregate({ _sum: { views: true } }),
    db.invitation.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { email: true } } } }),
  ]);
  const byTemplate = await db.invitation.groupBy({ by: ["templateId"], _count: true, orderBy: { _count: { templateId: "desc" } } });
  const [newBookings, bookings7, albums, samples, recentBookings] = await Promise.all([
    db.booking.count({ where: { status: "NEW" } }),
    db.booking.count({ where: { createdAt: { gte: since } } }),
    db.album.count({ where: { kind: "COLLECTION", status: "PUBLISHED" } }),
    db.album.count({ where: { kind: "SAMPLE", status: "PUBLISHED" } }),
    db.booking.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const studioCards = [
    ["Yêu cầu tư vấn mới", newBookings, `+${bookings7} trong 7 ngày`, "/admin/bookings?status=NEW"],
    ["Album đang hiện", albums, "trong Bộ sưu tập", "/admin/albums"],
    ["Album mẫu đang hiện", samples, "trang /ghep-album", "/admin/ghep-album"],
  ] as const;

  const cards = [
    ["Người dùng", users, `+${newUsers} trong 7 ngày`],
    ["Premium", premium, `${users ? Math.round((premium / users) * 100) : 0}% người dùng`],
    ["Thiệp", invitations, `${published} đã xuất bản`],
    ["Lượt xem thiệp", views._sum.views ?? 0, "tổng cộng"],
    ["Xác nhận tham dự", rsvps, "tổng cộng"],
    ["Lời chúc", wishes, "tổng cộng"],
  ] as const;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-semibold">Tổng quan</h1>
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">Studio</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {studioCards.map(([l, v, sub, href]) => (
            <Link key={l} href={href} className="card transition hover:border-zinc-300">
              <p className="text-sm text-zinc-500">{l}</p>
              <p className={`mt-1 text-3xl font-semibold ${l.startsWith("Yêu cầu") && v > 0 ? "text-red-700" : ""}`}>{v}</p>
              <p className="mt-1 text-xs text-zinc-400">{sub}</p>
            </Link>
          ))}
        </div>
        {recentBookings.length > 0 && (
          <div className="card mt-4">
            <h3 className="font-semibold">Yêu cầu tư vấn gần đây</h3>
            <ul className="mt-3 divide-y divide-zinc-100 text-sm">
              {recentBookings.map((b) => (
                <li key={b.id} className="flex justify-between gap-2 py-2">
                  <Link href={`/admin/bookings/${b.id}`} className="truncate hover:underline">
                    {b.name} · {b.phone}
                  </Link>
                  <span className="shrink-0 text-zinc-400">{b.createdAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <h2 className="-mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Thiệp mời online</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map(([l, v, sub]) => (
          <div key={l} className="card">
            <p className="text-sm text-zinc-500">{l}</p>
            <p className="mt-1 text-3xl font-semibold">{v}</p>
            <p className="mt-1 text-xs text-zinc-400">{sub}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold">Thiệp mới tạo</h2>
          <ul className="mt-3 divide-y divide-zinc-100 text-sm">
            {recent.map((i) => (
              <li key={i.id} className="flex justify-between gap-2 py-2">
                <Link href={`/w/${i.slug}`} target="_blank" className="truncate hover:underline">
                  {i.title}
                </Link>
                <span className="shrink-0 text-zinc-400">{i.user.email}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-semibold">Mẫu được dùng nhiều</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {byTemplate.map((t) => (
              <li key={t.templateId} className="flex items-center gap-3">
                <span className="w-32 truncate">{t.templateId}</span>
                <span className="h-2 rounded bg-brand" style={{ width: `${(t._count / Math.max(1, invitations)) * 100}%` }} />
                <span className="text-zinc-500">{t._count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
