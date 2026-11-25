import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { saveUploadResponse } from "@/lib/storage";
import { ALLOWED } from "@/lib/uploads";

const SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.toString("latin1", 1, 4) === "PNG",
  "image/webp": (b) => b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP",
};

/**
 * Khách tải ảnh cưới / ảnh QR khi điền form làm thiệp, chưa cần tài khoản hay đơn.
 * Chỉ nhận ảnh JPG/PNG/WEBP thật (kiểm tra chữ ký file), tối đa 5MB, giới hạn theo IP.
 */
export async function POST(req: Request) {
  if (!rateLimit(`thiep-upload:${clientIp(req)}`, 80, 3600_000)) return NextResponse.json({ error: "Bạn tải quá nhiều ảnh, vui lòng thử lại sau" }, { status: 429 });
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Không có file" }, { status: 400 });
  const check = SIGNATURES[file.type];
  const rule = ALLOWED[file.type];
  if (!check || !rule) return NextResponse.json({ error: "Chỉ nhận ảnh JPG, PNG, WEBP" }, { status: 415 });
  if (file.size > rule.max) return NextResponse.json({ error: "Ảnh tối đa 5MB" }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  if (!check(buf)) return NextResponse.json({ error: "File không phải ảnh hợp lệ" }, { status: 415 });
  const r = await saveUploadResponse(buf, rule.ext, file.type);
  return "url" in r ? NextResponse.json({ url: r.url }) : NextResponse.json({ error: r.error }, { status: r.status });
}
