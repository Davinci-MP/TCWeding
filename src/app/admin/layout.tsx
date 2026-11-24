import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { orderTodo } from "@/lib/orders";

const NAV = [
  ["/admin", "📊 Tổng quan"],
  ["/admin/users", "👥 Người dùng"],
  ["/admin/invitations", "💌 Thiệp cưới"],
  ["/admin/orders", "🧾 Đơn đặt thiệp"],
  ["/admin/templates", "🎨 Mẫu thiệp"],
  ["/admin/pricing", "💳 Bảng giá"],
  ["/admin/music", "🎵 Thư viện nhạc"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const open = await db.order.findMany({
    where: { status: { notIn: ["DONE", "CANCELLED"] } },
    select: { status: true, depositClaimedAt: true, finalClaimedAt: true, finalPaidAt: true, messages: { orderBy: { createdAt: "desc" }, take: 1, select: { sender: true } } },
  });
  const todo = open.filter((o) => orderTodo(o).length).length;
  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:flex-row">
        <aside className="md:w-56 md:shrink-0">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Quản trị hệ thống</p>
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {NAV.map(([href, label]) => (
              <Link key={href} href={href} className="shrink-0 rounded-lg px-3 py-2 text-sm hover:bg-zinc-100">
                {label}
                {href === "/admin/orders" && todo > 0 && (
                  <span className="ml-2 rounded-full bg-red-700 px-1.5 py-0.5 text-xs font-semibold text-white">
                    {todo}
                    <span className="sr-only"> đơn cần xử lý</span>
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}
