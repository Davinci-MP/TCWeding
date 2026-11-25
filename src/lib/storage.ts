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

/** Lưu file, trả về URL để hiển thị. */
export async function saveUpload(data: Buffer, ext: string, contentType: string): Promise<string> {
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  if (usingBlob()) {
    const blob = await put(`uploads/${name}`, data, { access: "public", contentType, addRandomSuffix: false, cacheControlMaxAge: 31536000 });
    return blob.url;
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), data);
  return `/api/files/${name}`;
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
