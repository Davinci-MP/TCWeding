"use client";

import { useRef, useState } from "react";
import { uploadPhoto } from "@/lib/resizeImage";

/** Ô chọn ảnh cho biểu mẫu server action: tải ảnh lên rồi đặt URL vào ô ẩn `name`. */
export function ImageInput({ name, defaultValue = "", label, hint, aspect = "aspect-[3/2]" }: { name: string; defaultValue?: string; label: string; hint?: string; aspect?: string }) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="text-sm">
      <span className="font-medium">{label}</span>
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      <input type="hidden" name={name} value={url} />
      <div className="mt-2 flex items-start gap-3">
        <div className={`${aspect} w-36 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100`}>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-400">Chưa có ảnh</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" className="btn btn-outline" disabled={busy} onClick={() => ref.current?.click()}>
            {busy ? "Đang tải…" : url ? "Đổi ảnh" : "Chọn ảnh"}
          </button>
          {url && (
            <button type="button" className="text-left text-xs text-red-600 hover:underline" onClick={() => setUrl("")}>
              Bỏ ảnh
            </button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          setError("");
          try {
            setUrl((await uploadPhoto(f)).url);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
