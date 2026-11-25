import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOpen, MAX_ORDER_PHOTOS } from "@/lib/orders";
import { rateLimit } from "@/lib/rateLimit";
import { saveUpload } from "@/lib/storage";
import { ALLOWED } from "@/lib/uploads";

const SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.toString("latin1", 1, 4) === "PNG",
  "image/webp": (b) => b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP",
};

/** Khách gửi ảnh cho đơn bằng link bí mật, không cần tài khoản. Mỗi lần một ảnh. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await db.order.findUnique({ where: { token }, include: { _count: { select: { photos: true } } } });
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404 });
  if (!isOpen(order.status)) return NextResponse.json({ error: "Đơn đã đóng" }, { status: 409 });
  if (order._count.photos >= MAX_ORDER_PHOTOS) return NextResponse.json({ error: `Tối đa ${MAX_ORDER_PHOTOS} ảnh` }, { status: 409 });
  if (!rateLimit(`order-photo:${order.id}`, 60, 600_000)) return NextResponse.json({ error: "Bạn gửi quá nhanh, vui lòng thử lại sau" }, { status: 429 });

  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Không có file" }, { status: 400 });
  const check = SIGNATURES[file.type];
  const rule = ALLOWED[file.type];
  if (!check || !rule) return NextResponse.json({ error: "Chỉ nhận ảnh JPG, PNG, WEBP" }, { status: 415 });
  if (file.size > rule.max) return NextResponse.json({ error: "Ảnh tối đa 5MB" }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  if (!check(buf)) return NextResponse.json({ error: "File không phải ảnh hợp lệ" }, { status: 415 });

  const url = await saveUpload(buf, rule.ext, file.type);
  await db.orderPhoto.create({ data: { orderId: order.id, url } });
  revalidatePath(`/don/${token}`);
  return NextResponse.json({ ok: true });
}
