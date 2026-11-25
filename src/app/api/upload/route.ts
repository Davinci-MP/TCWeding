import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveUpload } from "@/lib/storage";
import { ALLOWED } from "@/lib/uploads";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const fd = await req.formData().catch(() => null);
  const file = fd?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Không có file" }, { status: 400 });

  const rule = ALLOWED[file.type];
  if (!rule) return NextResponse.json({ error: "Chỉ hỗ trợ ảnh JPG/PNG/WEBP/GIF và nhạc MP3/M4A" }, { status: 415 });
  if (file.size > rule.max)
    return NextResponse.json({ error: `File quá lớn (tối đa ${rule.max / 1024 / 1024}MB)` }, { status: 413 });

  const url = await saveUpload(Buffer.from(await file.arrayBuffer()), rule.ext, file.type);
  return NextResponse.json({ url });
}
