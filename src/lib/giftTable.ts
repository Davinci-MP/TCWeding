import "server-only";
import { db } from "./db";

export type GiftRow = Awaited<ReturnType<typeof giftRows>>[number];

/** Bảng tiền mừng online của một thiệp (không kèm ảnh bill), cũ → mới để đánh STT ổn định. */
export async function giftRows(invitationId: string) {
  const rows = await db.giftRecord.findMany({
    where: { invitationId },
    orderBy: { createdAt: "asc" },
    select: { id: true, code: true, side: true, receiverLabel: true, senderName: true, senderBank: true, senderAccountMasked: true, transferAt: true, content: true, amount: true, txnCode: true, status: true, createdAt: true },
  });
  return rows.map((r, i) => ({ ...r, stt: i + 1 }));
}

export const confirmedTotal = (rows: GiftRow[]) => rows.reduce((s, r) => s + (r.status === "CONFIRMED" ? (r.amount ?? 0) : 0), 0);
