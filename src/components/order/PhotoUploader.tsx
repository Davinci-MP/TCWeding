"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Thu nhỏ trước khi gửi, để ảnh điện thoại không vượt 5MB và gửi nhanh hơn. */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s);
  c.height = Math.round(bmp.height * s);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error("encode"))), "image/jpeg", 0.88));
}

export function PhotoUploader({ token, room }: { token: string; room: number }) {
  const router = useRouter();
  const [left, setLeft] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  async function send(files: File[]) {
    const bad: string[] = files.length > room ? [`Chỉ gửi thêm được ${room} ảnh`] : [];
    const take = files.slice(0, room);
    setErrors([]);
    for (let i = 0; i < take.length; i++) {
      setLeft(take.length - i);
      const blob = await shrink(take[i]).catch(() => null);
      if (!blob) {
        bad.push(`${take[i].name}: không đọc được, hãy đổi sang JPG`);
        continue;
      }
      const fd = new FormData();
      fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      const res = await fetch(`/api/orders/${token}/photos`, { method: "POST", body: fd }).catch(() => null);
      if (!res?.ok) bad.push(`${take[i].name}: ${(await res?.json().catch(() => null))?.error ?? "lỗi mạng"}`);
    }
    setLeft(0);
    setErrors(bad);
    router.refresh();
  }

  return (
    <div>
      {room > 0 ? (
        <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-4 text-center focus-within:border-brand hover:border-brand">
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={left > 0}
            className="sr-only"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              send(files);
            }}
          />
          <span className="font-semibold" aria-live="polite">
            {left ? `Đang gửi, còn ${left} ảnh…` : "Chọn ảnh để gửi"}
          </span>
          <span className="mt-1 text-xs text-zinc-500">Còn gửi được {room} ảnh. Ảnh đầu tiên dùng làm ảnh bìa.</span>
        </label>
      ) : (
        <p className="text-sm text-zinc-500">Đã đủ số ảnh tối đa.</p>
      )}
      {errors.length > 0 && (
        <ul role="alert" className="mt-2 text-sm text-red-700">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
