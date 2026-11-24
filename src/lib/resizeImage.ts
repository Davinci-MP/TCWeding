"use client";

import { uploadFile } from "@/components/editor/fields";

/**
 * Thu nhỏ ảnh trên trình duyệt trước khi tải lên (cạnh dài tối đa `max`px, JPEG chất lượng 0.86):
 * ảnh gốc từ máy ảnh 10–25MB còn khoảng 0.5–1.5MB, vừa giới hạn tải lên và tải trang nhanh hơn.
 * Trả về URL đã tải lên và kích thước thật để trang hiển thị giữ đúng tỉ lệ khi ảnh chưa tải xong.
 */
export async function uploadPhoto(file: File, max = 2400): Promise<{ url: string; width: number; height: number }> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name}: không phải file ảnh.`);
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`${file.name}: trình duyệt không đọc được ảnh này (thử JPG hoặc PNG).`);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  // Ảnh nhỏ, nhẹ và không phải GIF: giữ nguyên file gốc.
  if (scale === 1 && file.size < 1.5 * 1024 * 1024 && file.type !== "image/gif") {
    bitmap.close();
    return { url: await uploadFile(file), width, height };
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
  if (!blob) throw new Error(`${file.name}: không nén được ảnh.`);
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return { url: await uploadFile(new File([blob], name, { type: "image/jpeg" })), width, height };
}
