import { AdminHeader } from "@/components/SiteHeader";
import { requireAdmin } from "@/lib/auth";

/** Trình soạn thiệp chỉ dành cho admin (khách không còn tài khoản, studio làm thiệp hộ). */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <>
      <AdminHeader email={admin.email} />
      <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
    </>
  );
}
