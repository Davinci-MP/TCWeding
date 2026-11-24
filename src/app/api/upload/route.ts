import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ALLOWED, UPLOAD_DIR } from "@/lib/uploads";

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

  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomBytes(12).toString("hex")}.${rule.ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/api/files/${name}` });
}
