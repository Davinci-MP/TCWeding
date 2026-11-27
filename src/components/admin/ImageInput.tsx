"use client";

import { useRef, useState } from "react";
import { FramedImg } from "@/components/FramedImg";
import { FrameEditor, type FrameTarget } from "@/components/frame/FrameEditor";
import type { ImgFrame } from "@/lib/imageFrame";
import { uploadPhoto } from "@/lib/resizeImage";

/**
 * Ô chọn ảnh cho biểu mẫu server action: tải ảnh lên rồi đặt URL vào ô ẩn `name`.
 * frameName + targets: bật "Chỉnh ảnh" (căn, thu phóng, lấp đầy / hiện toàn bộ, căn riêng điện thoại) — thiết lập gửi kèm
 * form trong ô ẩn frameName (JSON), ảnh gốc không đổi.
 */
export function ImageInput({
  name,
  defaultValue = "",
  label,
  hint,
  aspect = "aspect-[3/2]",
  frameName,
  frame: frame0 = null,
  targets,
}: {
  name: string;
  defaultValue?: string;
  label: string;
  hint?: string;
  aspect?: string;
  frameName?: string;
  frame?: ImgFrame | null;
  /** Tỉ lệ + góc bo của chỗ ảnh hiển thị trên máy tính và điện thoại. */
  targets?: { desktop: FrameTarget; mobile: FrameTarget };
}) {
  const [url, setUrl] = useState(defaultValue);
  const [frame, setFrame] = useState<ImgFrame | null>(frame0);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="text-sm">
      <span className="font-medium">{label}</span>
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      <input type="hidden" name={name} value={url} />
      {frameName && <input type="hidden" name={frameName} value={frame ? JSON.stringify(frame) : ""} />}
      <div className="mt-2 flex items-start gap-3">
        <div className={`${aspect} w-36 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100`}>
          {url ? (
            <FramedImg src={url} frame={frame} className="h-full w-full" />
          ) : (
            <span className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-400">Chưa có ảnh</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" className="btn btn-outline" disabled={busy} onClick={() => ref.current?.click()}>
            {busy ? "Đang tải…" : url ? "Đổi ảnh" : "Chọn ảnh"}
          </button>
          {url && frameName && targets && (
            <button type="button" className="btn btn-outline" onClick={() => setEditing(true)}>
              Chỉnh ảnh{frame ? " ✓" : ""}
            </button>
          )}
          {url && (
            <button
              type="button"
              className="text-left text-xs text-red-600 hover:underline"
              onClick={() => {
                setUrl("");
                setFrame(null);
              }}
            >
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
            setFrame(null); // ảnh mới: bắt đầu từ cách hiển thị mặc định
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
      {editing && targets && (
        <FrameEditor
          src={url}
          title={`Chỉnh ảnh · ${label}`}
          value={frame}
          desktop={targets.desktop}
          mobile={targets.mobile}
          note="Sau khi áp dụng, bấm Lưu ở cuối trang để cập nhật website."
          onClose={() => setEditing(false)}
          onApply={(f) => {
            setFrame(f && (f.x !== 50 || f.y !== 50 || f.z !== 1 || f.fit !== "cover" || f.m) ? f : null);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
