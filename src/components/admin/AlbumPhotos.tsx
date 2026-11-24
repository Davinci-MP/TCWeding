"use client";

import { useRef, useState, useTransition } from "react";
import { addAlbumPhotosAction, deleteAlbumPhotoAction, reorderAlbumPhotosAction, setAlbumCoverAction } from "@/app/actions/studio";
import { uploadPhoto } from "@/lib/resizeImage";

type Photo = { id: string; url: string; width: number; height: number };

/** Quản lý ảnh của album: tải nhiều ảnh cùng lúc, đặt ảnh bìa, đổi thứ tự, xoá. */
export function AlbumPhotos({ albumId, photos, coverUrl }: { albumId: string; photos: Photo[]; coverUrl: string }) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const cover = coverUrl || photos[0]?.url;

  async function upload(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setErrors([]);
    setProgress({ done: 0, total: images.length });
    const ok: { i: number; url: string; width: number; height: number }[] = [];
    const errs: string[] = [];
    // Tải 3 ảnh song song: nhanh hơn tuần tự mà không làm treo trình duyệt khi nén ảnh lớn.
    let next = 0;
    const worker = async () => {
      while (next < images.length) {
        const i = next++;
        const f = images[i];
        try {
          ok.push({ i, ...(await uploadPhoto(f)) });
        } catch (e) {
          errs.push((e as Error).message);
        }
        setProgress((p) => p && { ...p, done: p.done + 1 });
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    // Giữ đúng thứ tự file đã chọn dù ảnh tải xong không theo thứ tự.
    ok.sort((a, b) => a.i - b.i);
    if (ok.length) await addAlbumPhotosAction(albumId, ok.map(({ url, width, height }) => ({ url, width, height })));
    setErrors(errs);
    setProgress(null);
  }

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= photos.length) return;
    const ids = photos.map((p) => p.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    start(() => reorderAlbumPhotosAction(albumId, ids));
  };

  return (
    <div className={pending ? "opacity-70 transition" : "transition"}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!progress) void upload([...e.dataTransfer.files]);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm transition ${
          dragOver ? "border-brand bg-brand/5" : "border-zinc-300 bg-zinc-50"
        }`}
      >
        {progress ? (
          <>
            <p className="font-medium">
              Đang tải ảnh {progress.done}/{progress.total}…
            </p>
            <div className="h-1.5 w-64 max-w-full overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full bg-brand transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
          </>
        ) : (
          <>
            <p className="text-zinc-600">Kéo thả ảnh vào đây, hoặc</p>
            <button type="button" className="btn btn-primary" onClick={() => input.current?.click()}>
              Chọn ảnh từ máy
            </button>
            <p className="text-xs text-zinc-500">Chọn được nhiều ảnh cùng lúc. Ảnh lớn được tự thu nhỏ còn cạnh dài 2400px.</p>
          </>
        )}
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            void upload(files);
          }}
        />
      </div>

      {errors.length > 0 && (
        <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          <p className="font-medium">{errors.length} ảnh chưa tải lên được:</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.slice(0, 8).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {photos.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">Album chưa có ảnh. Album không có ảnh sẽ không hiện ảnh bìa trên trang chủ.</p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p, i) => {
            const isCover = p.url === cover;
            return (
              <li key={p.id} className={`overflow-hidden rounded-lg border bg-white ${isCover ? "border-brand ring-2 ring-brand/30" : "border-zinc-200"}`}>
                <div className="relative aspect-square bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 text-xs tabular-nums text-white">{i + 1}</span>
                  {isCover && <span className="absolute right-1.5 top-1.5 rounded bg-brand px-1.5 py-0.5 text-xs font-medium text-white">Ảnh bìa</span>}
                </div>
                <div className="flex items-center gap-1 p-1.5 text-xs">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || pending} aria-label={`Đưa ảnh ${i + 1} lên trước`} className="rounded px-2 py-1.5 hover:bg-zinc-100 disabled:opacity-30">
                    ←
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1 || pending} aria-label={`Đưa ảnh ${i + 1} ra sau`} className="rounded px-2 py-1.5 hover:bg-zinc-100 disabled:opacity-30">
                    →
                  </button>
                  {!isCover && (
                    <button type="button" disabled={pending} onClick={() => start(() => setAlbumCoverAction(albumId, p.url))} className="whitespace-nowrap rounded px-2 py-1.5 hover:bg-zinc-100">
                      Làm bìa
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => confirm("Xoá ảnh này khỏi album?") && start(() => deleteAlbumPhotoAction(p.id))}
                    className="ml-auto rounded px-2 py-1.5 text-red-600 hover:bg-red-50"
                  >
                    Xoá
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
