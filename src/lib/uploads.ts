import "server-only";
import path from "node:path";

/** Thư mục lưu file người dùng tải lên. Production nên thay bằng S3/R2/Cloudinary. */
export const UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");

export const ALLOWED: Record<string, { ext: string; max: number }> = {
  "image/jpeg": { ext: "jpg", max: 5 * 1024 * 1024 },
  "image/png": { ext: "png", max: 5 * 1024 * 1024 },
  "image/webp": { ext: "webp", max: 5 * 1024 * 1024 },
  "image/gif": { ext: "gif", max: 5 * 1024 * 1024 },
  "audio/mpeg": { ext: "mp3", max: 12 * 1024 * 1024 },
  "audio/mp4": { ext: "m4a", max: 12 * 1024 * 1024 },
  "audio/x-m4a": { ext: "m4a", max: 12 * 1024 * 1024 },
};

export const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
};

export const FILE_NAME_RE = /^[a-z0-9]{16,40}\.(jpg|png|webp|gif|mp3|m4a)$/;
