import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { ensureVisitorId, readVisitorId } from "@/lib/visitor";
import { TEMPLATES } from "@/templates/registry";

const MAX = 100;

/** Danh sách mẫu thiệp khách này đã thả tim (theo cookie ẩn danh). */
export async function GET() {
  const vid = await readVisitorId();
  if (!vid) return NextResponse.json({ templates: [] });
  const rows = await db.templateFavorite.findMany({ where: { visitorId: vid }, orderBy: { createdAt: "asc" }, select: { templateId: true } });
  return NextResponse.json({ templates: rows.map((r) => r.templateId) }, { headers: { "Cache-Control": "no-store" } });
}

/** Thả tim / bỏ tim một mẫu: { templateId, liked }. */
export async function POST(req: Request) {
  if (!rateLimit(`fav:${clientIp(req)}`, 120, 600_000)) return NextResponse.json({ error: "Thao tác quá nhanh" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { templateId?: unknown; liked?: unknown } | null;
  const templateId = String(body?.templateId ?? "");
  if (!TEMPLATES.some((t) => t.id === templateId)) return NextResponse.json({ error: "Mẫu không tồn tại" }, { status: 400 });
  const vid = await ensureVisitorId();
  if (body?.liked) {
    const count = await db.templateFavorite.count({ where: { visitorId: vid } });
    if (count >= MAX) return NextResponse.json({ error: `Tối đa ${MAX} mẫu` }, { status: 409 });
    await db.templateFavorite.upsert({ where: { visitorId_templateId: { visitorId: vid, templateId } }, create: { visitorId: vid, templateId }, update: {} });
  } else {
    await db.templateFavorite.deleteMany({ where: { visitorId: vid, templateId } });
  }
  return GET();
}
