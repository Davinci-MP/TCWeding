import { getCurrentUser, getOwnedInvitation } from "@/lib/auth";
import { db } from "@/lib/db";

const esc = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s; // chống CSV injection khi mở bằng Excel
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const inv = await getOwnedInvitation((await params).id, user);
  if (!inv) return new Response("Not found", { status: 404 });

  const rsvps = await db.rsvp.findMany({ where: { invitationId: inv.id }, orderBy: { createdAt: "asc" } });
  const label = { YES: "Tham dự", NO: "Không đến", MAYBE: "Chưa chắc" } as Record<string, string>;
  const rows = [
    ["Tên", "SĐT", "Trạng thái", "Số người", "Khách của", "Ghi chú", "Thời gian"],
    ...rsvps.map((r) => [
      r.name,
      r.phone,
      label[r.attending] ?? r.attending,
      r.attending === "NO" ? 0 : r.guests,
      r.side === "GROOM" ? "Nhà trai" : r.side === "BRIDE" ? "Nhà gái" : "",
      r.note,
      r.createdAt.toLocaleString("vi-VN"),
    ]),
  ];
  // BOM để Excel hiển thị đúng tiếng Việt
  const csv = "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="khach-moi-${inv.slug}.csv"`,
    },
  });
}
