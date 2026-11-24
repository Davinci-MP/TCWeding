import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { requireAdmin } from "@/lib/auth";

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
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}
