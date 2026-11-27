"use server";

import { revalidatePath } from "next/cache";
import { canManageInvitation } from "@/lib/auth";
import { db } from "@/lib/db";
import { isGiftStatus } from "@/lib/gifts";

/** Chủ thiệp / người quản lý thiệp đổi trạng thái một dòng tiền mừng (Chờ xác nhận / Đã xác nhận / Từ chối). */
export async function setGiftStatusAction(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const status = fd.get("status");
  if (!isGiftStatus(status)) return;
  const rec = await db.giftRecord.findUnique({ where: { id }, select: { invitationId: true, code: true, invitation: { select: { userId: true } } } });
  if (!rec || !(await canManageInvitation(rec.invitationId, rec.invitation.userId))) return;
  await db.giftRecord.update({ where: { id }, data: { status, reviewedAt: status === "PENDING" ? null : new Date() } });
  const back = String(fd.get("back") ?? "");
  if (back.startsWith("/")) revalidatePath(back);
  revalidatePath(`/b/${rec.code}`);
}
