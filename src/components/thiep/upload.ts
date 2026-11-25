"use client";

/** Thu nhỏ ảnh trên máy khách (cạnh dài tối đa `max`px, JPEG) rồi tải lên /api/thiep/upload. */
export async function uploadThiepPhoto(file: File, max = 2000): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name}: không phải ảnh.`);
  const bitmap = await createImageBitmap(file).catch(() => null);
  let blob: Blob = file;
  if (bitmap) {
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    if (scale < 1 || file.size > 1.5 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type)) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      blob = (await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86))) ?? file;
    }
    bitmap.close();
  } else if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    throw new Error(`${file.name}: trình duyệt không đọc được ảnh này (thử JPG hoặc PNG).`);
  }
  const fd = new FormData();
  fd.append("file", blob instanceof File ? blob : new File([blob], "anh.jpg", { type: blob.type || "image/jpeg" }));
  const r = await fetch("/api/thiep/upload", { method: "POST", body: fd });
  const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!r.ok || !j.url) throw new Error(`${file.name}: ${j.error ?? "tải lên thất bại"}`);
  return j.url;
}
