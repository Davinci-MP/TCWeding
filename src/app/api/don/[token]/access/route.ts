import { NextResponse } from "next/server";
import { grantInvitationAccess } from "@/lib/auth";
import { db } from "@/lib/db";

// Người mở link đơn được quyền xem bill tiền mừng của thiệp trong đơn (cookie ký số, xem lib/auth.ts).
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const o = await db.order.findUnique({ where: { token: (await params).token }, select: { invitationId: true } });
  if (!o?.invitationId) return NextResponse.json({ ok: false }, { status: 404 });
  await grantInvitationAccess(o.invitationId);
  return NextResponse.json({ ok: true });
}
