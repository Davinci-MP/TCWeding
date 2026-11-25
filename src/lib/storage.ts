import "server-only";
import { randomBytes } from "node:crypto";
import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, head, put } from "@vercel/blob";
import { FILE_NAME_RE, UPLOAD_DIR } from "@/lib/uploads";

/**
 * Nơi lưu file người dùng tải lên (ảnh, nhạc).
 * - Có BLOB_READ_WRITE_TOKEN (Vercel Blob đã nối với project): lưu lên Vercel Blob, URL dạng https://….public.blob.vercel-storage.com/uploads/…
 * - Không có: lưu vào thư mục uploads/ trên ổ đĩa, phục vụ qua /api/files/<tên> (chạy trên máy, VPS).
 */
export const usingBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

/** URL file trên Vercel Blob của website (chỉ thư mục uploads/). */
export const BLOB_URL_RE = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/uploads\/[A-Za-z0-9._-]+$/;

const localName = (url: string) => {
  const m = /^\/api\/files\/([^/?#]+)$/.exec(url);
  return m && FILE_NAME_RE.test(m[1]) ? m[1] : "";
};

/** URL hợp lệ của một file đã tải lên hệ thống (ổ đĩa hoặc Blob). */
export const isUploadUrl = (url: string) => !!localName(url) || BLOB_URL_RE.test(url);

/** Lỗi cấu hình nơi lưu file: thông báo rõ cho admin thay vì lỗi 500 chung chung. */
export class StorageError extends Error {}

/** Lưu file, trả về URL để hiển thị. */
export async function saveUpload(data: Buffer, ext: string, contentType: string): Promise<string> {
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  if (usingBlob()) {
    try {
      const blob = await put(`uploads/${name}`, data, { access: "public", contentType, addRandomSuffix: false, cacheControlMaxAge: 31536000 });
      return blob.url;
    } catch (e) {
      const msg = (e as Error).message || "";
      console.error("[storage] Vercel Blob put failed:", msg);
      if (/private/i.test(msg))
        throw new StorageError("Kho Vercel Blob đang để chế độ Private. Hãy tạo Blob store chế độ Public, nối với project rồi Redeploy.");
      if (/token|unauthor|forbidden|access denied/i.test(msg))
        throw new StorageError("Khoá Vercel Blob không hợp lệ. Nối lại Blob store với project (Storage) rồi Redeploy.");
      throw new StorageError(`Vercel Blob báo lỗi: ${msg.slice(0, 160)}`);
    }
  }
  // Vercel không có ổ đĩa ghi được: thiếu Blob thì báo rõ thay vì lỗi ghi file
  if (process.env.VERCEL)
    throw new StorageError("Chưa nối Vercel Blob: vào Vercel › Storage › Blob, nối với project (Production) rồi Redeploy để có BLOB_READ_WRITE_TOKEN.");
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), data);
  return `/api/files/${name}`;
}

/** Gọi saveUpload trong API: lỗi cấu hình trả về JSON có lời nhắn dễ hiểu. */
export async function saveUploadResponse(data: Buffer, ext: string, contentType: string): Promise<{ url: string } | { error: string; status: number }> {
  try {
    return { url: await saveUpload(data, ext, contentType) };
  } catch (e) {
    if (e instanceof StorageError) return { error: e.message, status: 503 };
    console.error("[storage] upload failed:", e);
    return { error: "Không lưu được file, vui lòng thử lại.", status: 500 };
  }
}

/** Xoá file; bỏ qua lỗi (file đã mất, URL ngoài hệ thống). */
export async function deleteUpload(url: string) {
  try {
    if (BLOB_URL_RE.test(url)) {
      if (usingBlob()) await del(url);
      return;
    }
    const name = localName(url);
    if (name) await unlink(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name));
  } catch {
    /* bỏ qua */
  }
}

/** File còn tồn tại không (dùng khi khách gửi form kèm URL ảnh). */
export async function uploadExists(url: string) {
  try {
    if (BLOB_URL_RE.test(url)) {
      if (!usingBlob()) return false;
      await head(url);
      return true;
    }
    const name = localName(url);
    if (!name) return false;
    await access(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name));
    return true;
  } catch {
    return false;
  }
}
