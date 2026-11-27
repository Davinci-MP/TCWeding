import { canManageInvitation } from "@/lib/auth";
import { db } from "@/lib/db";

// Ảnh bill: chỉ phát sau khi kiểm quyền, không cho lưu cache chung.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const rec = await db.giftRecord.findUnique({
    where: { code: (await params).code },
    select: { invitationId: true, invitation: { select: { userId: true } }, bill: { select: { mime: true, data: true } } },
  });
  if (!rec?.bill || !(await canManageInvitation(rec.invitationId, rec.invitation.userId))) return new Response("Không tìm thấy", { status: 404 });
  return new Response(new Uint8Array(rec.bill.data), {
    headers: { "Content-Type": rec.bill.mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'" },
  });
}
