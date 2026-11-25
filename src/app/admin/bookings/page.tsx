import Link from "next/link";
import { db } from "@/lib/db";
import { BOOKING_STATUS, bookingServices, parseFavorites } from "@/lib/studio";

export const metadata = { title: "Lịch tư vấn" };

const fmtDate = (d: string) => (d ? d.split("-").reverse().join("/") : "");

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ status?: string; deleted?: string }> }) {
  const { status, deleted } = await searchParams;
  const filter = status && status in BOOKING_STATUS ? status : undefined;
  const [rows, counts, services] = await Promise.all([
    db.booking.findMany({ where: filter ? { status: filter } : {}, orderBy: { createdAt: "desc" }, take: 300 }),
    db.booking.groupBy({ by: ["status"], _count: true }),
    bookingServices(),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const serviceLabel = (id: string) => services.find((s) => s.id === id)?.label ?? "";
  const tabs = [["", "Tất cả", counts.reduce((n, c) => n + c._count, 0)] as const, ...Object.entries(BOOKING_STATUS).map(([k, v]) => [k, v.label, count(k)] as const)];

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-3xl font-semibold">Lịch tư vấn</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Yêu cầu khách gửi từ form Liên hệ ở trang chủ, kèm ảnh khách đã thả tim. Nối Telegram ở{" "}
        <Link href="/admin/settings" className="underline">
          Cài đặt
        </Link>{" "}
        để yêu cầu mới báo về điện thoại.
      </p>
      {deleted && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Đã xoá yêu cầu.
        </p>
      )}
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Lọc theo trạng thái">
        {tabs.map(([k, label, n]) => (
          <Link
            key={k}
            href={k ? `/admin/bookings?status=${k}` : "/admin/bookings"}
            aria-current={(filter ?? "") === k ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm ${(filter ?? "") === k ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"}`}
          >
            {label} <span className="tabular-nums opacity-70">{n}</span>
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">Chưa có yêu cầu nào.</p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
          {rows.map((b) => {
            const st = BOOKING_STATUS[b.status] ?? BOOKING_STATUS.NEW;
            const favs = parseFavorites(b.favorites);
            return (
              <li key={b.id}>
                <Link href={`/admin/bookings/${b.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-zinc-50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {b.name} <span className="font-normal text-zinc-500">· {b.phone}</span>
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {[serviceLabel(b.service), b.shootDate && `Chụp ${fmtDate(b.shootDate)}`, favs.length && `❤ ${favs.length} ảnh`, b.message].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="text-xs tabular-nums text-zinc-400">{b.createdAt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" })}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.tone}`}>{st.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
