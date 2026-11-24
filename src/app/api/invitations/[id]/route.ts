import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, getOwnedInvitation } from "@/lib/auth";
import { db } from "@/lib/db";
import { SLUG_RE } from "@/lib/invitation";
import { getTemplateWithConfig } from "@/lib/templates";

const schema = z.object({
  templateId: z.string(),
  slug: z.string().regex(SLUG_RE, "Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang (3–60 ký tự)"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  data: z.record(z.string(), z.unknown()),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const inv = await getOwnedInvitation((await params).id, user);
  if (!inv) return NextResponse.json({ error: "Không tìm thấy thiệp" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { templateId, slug, status, data } = parsed.data;

  const json = JSON.stringify(data);
  if (json.length > 200_000) return NextResponse.json({ error: "Dữ liệu thiệp quá lớn" }, { status: 413 });

  const tpl = await getTemplateWithConfig(templateId);
  if (!tpl) return NextResponse.json({ error: "Mẫu không tồn tại" }, { status: 400 });
  const privileged = user.plan === "PREMIUM" || user.role === "ADMIN";
  if (templateId !== inv.templateId && (!tpl.isActive || (tpl.isPremium && !privileged))) {
    return NextResponse.json({ error: "Mẫu này cần gói Premium" }, { status: 403 });
  }

  if (slug !== inv.slug && (await db.invitation.findUnique({ where: { slug } }))) {
    return NextResponse.json({ error: "Đường dẫn này đã có người dùng" }, { status: 409 });
  }

  const g = (data.groom as { name?: string })?.name ?? "";
  const b = (data.bride as { name?: string })?.name ?? "";
  const updated = await db.invitation.update({
    where: { id: inv.id },
    data: { templateId, slug, status, data: json, title: `${g} & ${b}`.slice(0, 120) },
  });
  return NextResponse.json({ ok: true, updatedAt: updated.updatedAt });
}
