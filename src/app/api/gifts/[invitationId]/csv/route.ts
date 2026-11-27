import { canManageInvitation } from "@/lib/auth";
import { db } from "@/lib/db";
import { GIFT_STATUS, isGiftStatus, SIDE_LABEL, sideFromDb } from "@/lib/gifts";
import { confirmedTotal, giftRows } from "@/lib/giftTable";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  // chặn công thức khi mở bằng Excel (=, +, -, @)
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(req: Request, { params }: { params: Promise<{ invitationId: string }> }) {
  const inv = await db.invitation.findUnique({ where: { id: (await params).invitationId }, select: { id: true, slug: true, userId: true } });
  if (!inv || !(await canManageInvitation(inv.id, inv.userId))) return new Response("Không tìm thấy", { status: 404 });
  const origin = new URL(req.url).origin;
  const rows = await giftRows(inv.id);
  const head = ["STT", "Bên nhận", "Tên người gửi", "Ngân hàng gửi", "STK gửi (đã che)", "Ngày giờ chuyển", "Nội dung", "Số tiền", "Mã giao dịch", "Link bill", "Trạng thái", "ID bản ghi"];
  const lines = rows.map((r) => {
    const side = sideFromDb(r.side);
    return [r.stt, side ? SIDE_LABEL[side] : r.receiverLabel, r.senderName, r.senderBank, r.senderAccountMasked, r.transferAt.replace("T", " "), r.content, r.amount ?? "", r.txnCode, `${origin}/b/${r.code}`, isGiftStatus(r.status) ? GIFT_STATUS[r.status].label : r.status, r.id];
  });
  lines.push(["", "", "", "", "", "", "Tổng đã xác nhận", confirmedTotal(rows), "", "", "", ""]);
  const csv = "﻿" + [head, ...lines].map((l) => l.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="tien-mung-${inv.slug}.csv"`, "Cache-Control": "private, no-store" },
  });
}
