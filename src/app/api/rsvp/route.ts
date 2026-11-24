import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const schema = z.object({
  slug: z.string().max(80),
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(80),
  phone: z.string().trim().max(20).optional(),
  attending: z.enum(["YES", "NO", "MAYBE"]),
  guests: z.coerce.number().int().min(1).max(20).optional(),
  side: z.enum(["GROOM", "BRIDE", ""]).optional(),
  note: z.string().trim().max(300).optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`rsvp:${clientIp(req)}`, 5)) {
    return NextResponse.json({ error: "Bạn gửi quá nhanh, vui lòng thử lại sau." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;
  const inv = await db.invitation.findUnique({ where: { slug: d.slug }, select: { id: true, status: true } });
  if (!inv || inv.status !== "PUBLISHED") return NextResponse.json({ error: "Thiệp không tồn tại" }, { status: 404 });
  await db.rsvp.create({
    data: {
      invitationId: inv.id,
      name: d.name,
      phone: d.phone || null,
      attending: d.attending,
      guests: d.attending === "NO" ? 0 : (d.guests ?? 1),
      side: d.side || null,
      note: d.note || null,
    },
  });
  return NextResponse.json({ ok: true });
}
