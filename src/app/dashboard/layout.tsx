import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <>
      <SiteHeader />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </>
  );
}
