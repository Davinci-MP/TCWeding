import Link from "next/link";
import { notFound } from "next/navigation";
import { demoInvitationData } from "@/lib/invitation";
import { getTemplateDef } from "@/templates/registry";
import { getTemplateWithConfig } from "@/lib/templates";
import { InvitationView } from "@/templates/InvitationView";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTemplateWithConfig((await params).id);
  return { title: t ? `Xem thử: ${t.name}` : "Không tìm thấy" };
}

/** Xem thử toàn màn hình một mẫu với dữ liệu demo. */
export default async function TemplatePreview({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTemplateWithConfig((await params).id);
  if (!t || !t.isActive) notFound();
  return (
    <>
      <div className="fixed right-3 top-3 z-[55] flex items-center gap-3 rounded-full bg-zinc-900/80 py-1.5 pl-4 pr-1.5 text-xs text-white shadow-lg backdrop-blur">
        <span className="hidden whitespace-nowrap sm:inline">Bạn đang xem thử mẫu {t.name}</span>
        <Link href={`/dashboard/new?template=${t.id}`} className="whitespace-nowrap rounded-full bg-white px-3 py-1.5 font-semibold text-zinc-900">
          Dùng mẫu này
        </Link>
      </div>
      <InvitationView templateId={t.id} data={demoInvitationData(getTemplateDef(t.id).demoCover)} slug="demo" mode="demo" guestName="Anh Nam & Gia đình" />
    </>
  );
}
