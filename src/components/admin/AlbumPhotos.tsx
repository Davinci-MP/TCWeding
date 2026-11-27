"use client";

import { useRef, useState, useTransition } from "react";
import { addAlbumPhotosAction, deleteAlbumPhotoAction, reorderAlbumPhotosAction, setAlbumCoverAction, setAlbumFrameAction } from "@/app/actions/studio";
import { FramedImg } from "@/components/FramedImg";
import { FrameEditor, type FrameTarget } from "@/components/frame/FrameEditor";
import { bookTarget, SITE_TARGETS } from "@/lib/frameTargets";
import { setFrame, type FrameMap, type ImgFrame } from "@/lib/imageFrame";
import { uploadPhoto } from "@/lib/resizeImage";

type Photo = { id: string; url: string; width: number; height: number };

type Edit = { key: string; src: string; title: string; targets: { desktop: FrameTarget; mobile: FrameTarget } };

/**
 * Quản lý ảnh của album: tải nhiều ảnh cùng lúc, đặt ảnh bìa, đổi thứ tự, xoá, chỉnh ảnh.
 * Chỉnh ảnh lưu theo vị trí (Album.frames): bìa ở từng chỗ hiển thị, từng trang album mẫu theo id ảnh (đổi thứ tự không mất).
 */
export function AlbumPhotos({
  albumId,
  photos,
  coverUrl,
  kind = "COLLECTION",
  ratio = 1,
  frames: frames0 = {},
}: {
  albumId: string;
  photos: Photo[];
  coverUrl: string;
  kind?: "COLLECTION" | "SAMPLE";
  /** Tỉ lệ khổ album mẫu (rộng / cao). */
  ratio?: number;
  frames?: FrameMap;
}) {
  const [frames, setFrames] = useState<FrameMap>(frames0);
  const [edit, setEdit] = useState<Edit | null>(null);
  const sample = kind === "SAMPLE";
  const applyFrame = (key: string, f: ImgFrame | null) => {
    setFrames((m) => setFrame(m, key, f)); // hiện ngay, lưu ở server
    start(async () => {
      await setAlbumFrameAction(albumId, key, f);
    });
  };
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

      {cover && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 p-3 text-sm">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Chỉnh ảnh bìa</p>
            <p className="text-xs text-zinc-500">Mỗi chỗ hiển thị bìa có tỉ lệ khác nhau nên căn riêng từng chỗ. Đổi ảnh bìa thì cách căn bìa cũ được bỏ.</p>
          </div>
          {(sample
            ? ([
                ["tile", "Ô album mẫu ở trang chủ", SITE_TARGETS.sampleTile],
                ["book", "Bìa sách (trang Ghép album)", bookTarget(ratio)],
              ] as const)
            : ([
                ["card", "Thẻ album", SITE_TARGETS.albumCard],
                ["hero", "Đầu trang album", SITE_TARGETS.albumHero],
              ] as const)
          ).map(([key, label, targets]) => (
            <button key={key} type="button" className="btn btn-outline" onClick={() => setEdit({ key, src: cover, title: `Chỉnh ảnh bìa · ${label}`, targets })}>
              {label}
              {frames[key] ? " ✓" : ""}
            </button>
          ))}
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
                  {sample ? (
                    <FramedImg src={p.url} frame={frames[`page:${p.id}`]} loading="lazy" className="h-full w-full" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
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
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setFrames((m) => ({ ...Object.fromEntries(Object.entries(m).filter(([k]) => k.startsWith("page:"))) }));
                        start(() => setAlbumCoverAction(albumId, p.url));
                      }}
                      className="whitespace-nowrap rounded px-2 py-1.5 hover:bg-zinc-100"
                    >
                      Làm bìa
                    </button>
                  )}
                  {sample && (
                    <button
                      type="button"
                      onClick={() => setEdit({ key: `page:${p.id}`, src: p.url, title: `Chỉnh trang ${i + 1}`, targets: bookTarget(ratio) })}
                      className="whitespace-nowrap rounded px-2 py-1.5 hover:bg-zinc-100"
                    >
                      Chỉnh{frames[`page:${p.id}`] ? " ✓" : ""}
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
      {!sample && photos.length > 0 && <p className="mt-3 text-xs text-zinc-500">Ảnh trong bộ sưu tập hiện đủ khung hình gốc (không cắt), nên chỉ cần chỉnh ảnh bìa.</p>}
      {edit && (
        <FrameEditor
          src={edit.src}
          title={edit.title}
          value={frames[edit.key] ?? null}
          desktop={edit.targets.desktop}
          mobile={edit.targets.mobile}
          note="Áp dụng là lưu ngay lên website."
          onClose={() => setEdit(null)}
          onApply={(f) => {
            applyFrame(edit.key, f);
            setEdit(null);
          }}
        />
      )}
    </div>
  );
}
