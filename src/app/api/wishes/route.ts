import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const schema = z.object({
  slug: z.string().max(80),
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(80),
  message: z.string().trim().min(1, "Vui lòng nhập lời chúc").max(500),
});

export async function POST(req: Request) {
  if (!rateLimit(`wish:${clientIp(req)}`, 5)) {
    return NextResponse.json({ error: "Bạn gửi quá nhanh, vui lòng thử lại sau." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { slug, name, message } = parsed.data;
  const inv = await db.invitation.findUnique({ where: { slug }, select: { id: true, status: true } });
  if (!inv || inv.status !== "PUBLISHED") return NextResponse.json({ error: "Thiệp không tồn tại" }, { status: 404 });
  const wish = await db.wish.create({ data: { invitationId: inv.id, name, message } });
  return NextResponse.json({ id: wish.id, name: wish.name, message: wish.message, createdAt: wish.createdAt.toISOString() });
}
