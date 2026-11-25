import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { usingBlob } from "@/lib/storage";

/**
 * Cấp quyền cho trình duyệt tải thẳng file lớn (nhạc tới 12MB) lên Vercel Blob.
 * Vercel giới hạn mỗi yêu cầu gửi lên máy chủ khoảng 4,5MB nên không thể đi qua /api/upload.
 * Chỉ admin được dùng. Không bật Vercel Blob thì trả 501 để trình duyệt quay về /api/upload.
 */
export async function POST(request: Request) {
  if (!usingBlob()) return NextResponse.json({ error: "Chưa bật Vercel Blob" }, { status: 501 });
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getCurrentUser();
        if (user?.role !== "ADMIN") throw new Error("Chỉ quản trị viên được tải file lớn.");
        if (!/^uploads\/[a-z0-9]{16,40}\.(jpg|png|webp|gif|mp3|m4a)$/.test(pathname)) throw new Error("Tên file không hợp lệ.");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "audio/mpeg", "audio/mp4", "audio/x-m4a"],
          maximumSizeInBytes: 12 * 1024 * 1024,
          addRandomSuffix: false,
          cacheControlMaxAge: 31536000,
        };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
