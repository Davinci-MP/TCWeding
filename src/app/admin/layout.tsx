import Link from "next/link";
import { AdminHeader } from "@/components/SiteHeader";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { orderTodo } from "@/lib/orders";

const NAV = [
  ["/admin", "📊 Tổng quan"],
  ["/admin/orders", "🧾 Đơn làm thiệp & video"],
  ["/admin/bookings", "📅 Lịch tư vấn"],
  ["/admin/templates", "🎨 Mẫu thiệp & lượt thích"],
  ["/admin/invitations", "💌 Thiệp đã làm"],
  ["/admin/studio", "🏠 Nội dung trang chủ"],
  ["/admin/about", "🙋 Về tôi"],
  ["/admin/albums", "📷 Bộ sưu tập"],
  ["/admin/ghep-album", "📖 Ghép album (album mẫu)"],
  ["/admin/studio-pricing", "💰 Gói chụp"],
  ["/admin/music", "🎵 Thư viện nhạc"],
  ["/admin/users", "👥 Tài khoản quản trị"],
  ["/admin/settings", "⚙️ Cài đặt"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const open = await db.order.findMany({
    where: { status: { notIn: ["DONE", "CANCELLED"] } },
    select: { status: true, depositClaimedAt: true, finalClaimedAt: true, finalPaidAt: true, messages: { orderBy: { createdAt: "desc" }, take: 1, select: { sender: true } } },
  });
  const todo = open.filter((o) => orderTodo(o).length).length;
  const newBookings = await db.booking.count({ where: { status: "NEW" } });
  return (
    <>
      <AdminHeader email={admin.email} />
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
                {href === "/admin/bookings" && newBookings > 0 && (
                  <span className="ml-2 rounded-full bg-red-700 px-1.5 py-0.5 text-xs font-semibold text-white">
                    {newBookings}
                    <span className="sr-only"> yêu cầu mới</span>
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
