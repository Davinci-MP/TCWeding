import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteBookingAction, updateBookingAction } from "@/app/actions/studio";
import { ConfirmButton } from "@/components/ConfirmButton";
import { db } from "@/lib/db";
import { BOOKING_STATUS, bookingServices, parseFavorites } from "@/lib/studio";

export const metadata = { title: "Yêu cầu tư vấn" };

export default async function AdminBooking({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const [b, services] = await Promise.all([db.booking.findUnique({ where: { id } }), bookingServices()]);
  if (!b) notFound();
  const favs = parseFavorites(b.favorites);
  const digits = b.phone.replace(/\D/g, "");
  const zalo = `https://zalo.me/${digits.startsWith("84") ? `0${digits.slice(2)}` : digits}`;
  const rows: [string, React.ReactNode][] = [
    ["Họ tên", b.name],
    [
      "Điện thoại",
      <span key="p" className="flex flex-wrap gap-3">
        <a href={`tel:${b.phone}`} className="underline">
          {b.phone}
        </a>
        <a href={zalo} target="_blank" rel="noopener noreferrer" className="text-brand underline">
          Nhắn Zalo ↗
        </a>
      </span>,
    ],
    ["Dịch vụ", services.find((s) => s.id === b.service)?.label || "Chưa chọn"],
    ["Ngày chụp dự kiến", b.shootDate ? b.shootDate.split("-").reverse().join("/") : "Chưa có"],
    ["Gửi lúc", b.createdAt.toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" })],
  ];

  return (
    <div className="max-w-4xl">
      <Link href="/admin/bookings" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Lịch tư vấn
      </Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">{b.name}</h1>
      {saved && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Đã lưu.
        </p>
      )}

      <section className="card mt-6 p-5">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-zinc-500">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {b.message && (
          <div className="mt-5 border-t border-zinc-100 pt-4">
            <p className="text-sm text-zinc-500">Lời nhắn</p>
            <p className="mt-1 whitespace-pre-line">{b.message}</p>
          </div>
        )}
      </section>

      <section className="card mt-6 p-5">
        <h2 className="font-semibold">Ảnh khách thả tim ({favs.length})</h2>
        {favs.length ? (
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {favs.map((f) => (
              <li key={f.url}>
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden rounded-lg bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                </a>
                <Link href={`/bo-suu-tap/${f.album}`} target="_blank" className="mt-1 block truncate text-xs text-zinc-500 hover:underline">
                  {f.albumTitle}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Khách không gửi kèm ảnh.</p>
        )}
      </section>

      <form action={updateBookingAction} className="card mt-6 space-y-4 p-5">
        <input type="hidden" name="id" value={b.id} />
        <fieldset className="text-sm">
          <legend className="font-medium">Trạng thái</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {Object.entries(BOOKING_STATUS).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2">
                <input type="radio" name="status" value={k} defaultChecked={b.status === k} /> {v.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm">
          <span className="font-medium">Ghi chú nội bộ</span>
          <textarea name="adminNote" defaultValue={b.adminNote} rows={3} maxLength={2000} className="input mt-1" placeholder="Đã gọi, hẹn gặp thứ 7…" />
        </label>
        <button className="btn btn-primary">Lưu</button>
      </form>

      <form action={deleteBookingAction} className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 p-5">
        <p className="text-sm text-zinc-600">Xoá yêu cầu này. Không khôi phục được.</p>
        <input type="hidden" name="id" value={b.id} />
        <ConfirmButton message={`Xoá yêu cầu của ${b.name}? Không khôi phục được.`}>Xoá</ConfirmButton>
      </form>
    </div>
  );
}
