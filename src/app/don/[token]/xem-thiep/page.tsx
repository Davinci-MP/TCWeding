import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseInvitationData } from "@/lib/invitation";
import { InvitationView } from "@/templates/InvitationView";

export const metadata: Metadata = { title: "Bản nháp thiệp", robots: { index: false, follow: false }, referrer: "same-origin" };

/** Khách xem bản nháp bằng link đơn, chỉ từ lúc shop gửi duyệt. */
export default async function DraftPreview({ params }: { params: Promise<{ token: string }> }) {
  const o = await db.order.findUnique({ where: { token: (await params).token }, include: { invitation: true } });
  if (!o?.invitation || !["REVIEW", "APPROVED"].includes(o.status)) notFound();
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[60] bg-amber-400 py-1.5 text-center text-sm font-semibold text-amber-950">Bản nháp để duyệt</div>
      <InvitationView templateId={o.invitation.templateId} data={parseInvitationData(o.invitation.data)} slug={o.invitation.slug} mode="preview" wishes={[]} />
    </>
  );
}
