import Link from "next/link";
import { db } from "@/lib/db";
import { isOpen, money, ORDER_STATUS, viDate, type OrderStatus } from "@/lib/orders";
import { getOrderSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Đơn đặt thiệp" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; saved?: string }> }) {
  const { status, saved } = await searchParams;
  const filter = status && Object.hasOwn(ORDER_STATUS, status) ? status : undefined;
  const [orders, settings, counts] = await Promise.all([
    db.order.findMany({ where: filter ? { status: filter } : undefined, orderBy: { updatedAt: "desc" }, take: 200, include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } }),
    getOrderSettings(),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Đơn đặt thiệp</h1>
      {saved && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Đã lưu cài đặt.
        </p>
      )}
      <details className="card" open={!settings.enabled}>
        <summary className="cursor-pointer font-semibold">Cài đặt dịch vụ: {settings.enabled ? `đang nhận đơn, ${money(settings.price)}` : "đang tắt"}</summary>
        <SettingsForm initial={settings} />
      </details>
      <nav className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/orders" className={`rounded-full border px-3 py-1.5 ${!filter ? "border-brand text-brand" : "border-zinc-200"}`}>
          Tất cả
        </Link>
        {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={`rounded-full border px-3 py-1.5 ${filter === s ? "border-brand text-brand" : "border-zinc-200"}`}>
            {ORDER_STATUS[s]} ({counts.find((c) => c.status === s)?._count ?? 0})
          </Link>
        ))}
      </nav>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3">Đơn</th>
              <th className="px-4 py-3">Khách</th>
              <th className="px-4 py-3">Ngày cưới</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Cần xử lý</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const todo = [
                o.status === "NEW" && o.depositClaimedAt && "Kiểm tra cọc",
                o.status === "APPROVED" && o.finalClaimedAt && !o.finalPaidAt && "Kiểm tra thanh toán",
                isOpen(o.status) && o.messages[0]?.sender === "CUSTOMER" && "Tin nhắn mới",
              ].filter(Boolean);
              return (
                <tr key={o.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                      {o.groom} & {o.bride}
                    </Link>
                    <p className="font-mono text-xs text-zinc-500">{o.code}</p>
                  </td>
                  <td className="px-4 py-3">
                    {o.contactName}
                    <p className="text-xs text-zinc-500">{o.phone}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{viDate(o.weddingDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{ORDER_STATUS[o.status as OrderStatus]}</td>
                  <td className="px-4 py-3 font-semibold text-brand">{todo.join(", ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!orders.length && <p className="p-6 text-center text-sm text-zinc-500">Chưa có đơn nào.</p>}
      </div>
    </div>
  );
}
