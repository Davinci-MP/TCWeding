"use client";

import { useEffect, useRef, useState } from "react";
import { getTrackUrl } from "@/templates/music/synth";
import { TRACKS } from "@/templates/music/tracks";
import { downloadBlob, ensureFonts, pickVideoFormat, recordCanvas, slugifyVi } from "@/lib/videoRecorder";
import { drawSlideshow, preparePhoto, SLIDE_H, SLIDE_W, totalDuration, type SlidePhoto, type SlideText } from "./slideshowScenes";

const MAX_PHOTOS = 40;
const PACES = [
  [4000, "Nhanh", "4 giây/ảnh"],
  [6000, "Vừa", "6 giây/ảnh"],
  [8000, "Chậm", "8 giây/ảnh"],
] as const;

type LibraryTrack = { id: string; name: string; url: string };
type Music = { kind: "none" } | { kind: "builtin"; id: string } | { kind: "library"; id: string } | { kind: "file"; name: string; url: string };

function fmt(ms: number) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function SlideshowStudio({ library }: { library: LibraryTrack[] }) {
  const [photos, setPhotos] = useState<SlidePhoto[]>([]);
  const [loading, setLoading] = useState(0);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [text, setText] = useState<SlideText>({ groom: "", bride: "", date: "", thanks: "Cảm ơn quý khách đã đến chung vui" });
  const [pace, setPace] = useState<number>(6000);
  const [music, setMusic] = useState<Music>({ kind: "builtin", id: TRACKS[0].id });
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [format, setFormat] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timeRef = useRef(0);
  const total = totalDuration(photos.length, pace);
  const busy = progress !== null;
  // Vòng phát đọc giá trị mới nhất, nên sửa nội dung khi đang phát thấy ngay
  const live = useRef({ photos, pace, text, total });
  live.current = { photos, pace, text, total };

  useEffect(() => {
    const f = pickVideoFormat();
    setFormat(f ? f.ext.toUpperCase() : null);
    ensureFonts();
  }, []);

  // Vẽ lại khung hình hiện tại khi đổi nội dung (lúc đang dừng)
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || playing || busy) return;
    ensureFonts().then(() => drawSlideshow(ctx, timeRef.current === 0 ? 3000 : Math.min(timeRef.current, total), photos, pace, text));
  }, [photos, pace, text, playing, busy, total, time]);

  async function musicUrl(m: Music): Promise<string | null> {
    if (m.kind === "none") return null;
    if (m.kind === "builtin") return getTrackUrl(m.id);
    if (m.kind === "library") return library.find((x) => x.id === m.id)?.url ?? null;
    return m.url;
  }

  // Phát xem trước theo thời gian thực, kèm nhạc
  useEffect(() => {
    if (!playing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let cancelled = false;
    const from = timeRef.current >= total ? 0 : timeRef.current;
    let audio: HTMLAudioElement | null = null;
    (async () => {
      const url = await musicUrl(music);
      if (cancelled) return;
      if (url) {
        audio = new Audio(url);
        audio.loop = true;
        audio.currentTime = from / 1000;
        audioRef.current = audio;
        audio.play().catch(() => null);
      }
      const start = performance.now() - from;
      const tick = () => {
        const t = performance.now() - start;
        const now = live.current;
        if (t >= now.total) {
          timeRef.current = 0;
          setTime(0);
          setPlaying(false);
          return;
        }
        timeRef.current = t;
        drawSlideshow(ctx, t, now.photos, now.pace, now.text);
        setTime(t);
        raf = requestAnimationFrame(tick);
      };
      tick();
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      audio?.pause();
      audioRef.current = null;
    };
  }, [playing]);

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(f.name));
    const room = MAX_PHOTOS - photos.length;
    const take = list.slice(0, room);
    const bad: string[] = list.length > room ? [`${list.length - room} ảnh vượt quá giới hạn ${MAX_PHOTOS} ảnh`] : [];
    setLoading(take.length);
    const ready: SlidePhoto[] = [];
    for (const f of take) {
      try {
        ready.push(await preparePhoto(f));
      } catch {
        bad.push(`${f.name} (không đọc được, hãy đổi sang JPG)`);
      }
      setLoading((n) => n - 1);
    }
    setPhotos((p) => [...p, ...ready]);
    setSkipped(bad);
  }

  function move(i: number, d: number) {
    setPhotos((p) => {
      const j = i + d;
      if (j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function exportVideo() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !photos.length) return;
    setPlaying(false);
    setError("");
    setProgress(0);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await ensureFonts();
      const url = await musicUrl(music);
      let audio: HTMLAudioElement | null = null;
      if (url) {
        audio = new Audio(url);
        audio.loop = true;
        audio.preload = "auto";
      }
      const { blob, ext } = await recordCanvas(canvas, {
        durationMs: total,
        draw: (t) => drawSlideshow(ctx, t, photos, pace, text),
        audio,
        bitrate: 12_000_000,
        onProgress: setProgress,
        signal: ac.signal,
      });
      downloadBlob(blob, `slideshow-${slugifyVi(`${text.groom} ${text.bride}`)}.${ext}`);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message || "Không tạo được video.");
    } finally {
      setProgress(null);
      abortRef.current = null;
    }
  }

  const setField = (k: keyof SlideText) => (e: React.ChangeEvent<HTMLInputElement>) => setText({ ...text, [k]: e.target.value });
  const musicValue = music.kind === "none" ? "none" : music.kind === "file" ? "file" : `${music.kind}:${music.id}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        <div className="rounded-2xl bg-[#0d0b0a] p-3 shadow-2xl ring-1 ring-black/10 sm:p-5">
          <canvas ref={canvasRef} width={SLIDE_W} height={SLIDE_H} className="block h-auto w-full rounded-md" aria-label="Xem trước slideshow" />
          <div className="mt-3 flex items-center gap-3 text-white">
            <button
              type="button"
              disabled={!photos.length || busy}
              onClick={() => setPlaying((p) => !p)}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={playing ? "Tạm dừng" : "Phát xem trước"}
            >
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={total}
              step={100}
              value={Math.min(time, total)}
              disabled={playing || busy || !photos.length}
              onChange={(e) => {
                timeRef.current = Number(e.target.value);
                setTime(timeRef.current);
              }}
              className="min-w-0 flex-1 accent-[#d8cdbf]"
              aria-label="Tua đến thời điểm"
            />
            <span className="w-24 shrink-0 text-right text-xs tabular-nums text-white/60">
              {fmt(time)} / {fmt(total)}
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
              Ảnh ({photos.length}/{MAX_PHOTOS})
            </h2>
            {photos.length > 0 && (
              <button type="button" disabled={busy} onClick={() => setPhotos([])} className="cursor-pointer text-sm text-zinc-500 underline-offset-4 hover:text-red-700 hover:underline">
                Xoá hết
              </button>
            )}
          </div>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!busy) addFiles(e.dataTransfer.files);
            }}
            className="mt-3 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white px-4 py-6 text-center transition hover:border-brand"
          >
            <input type="file" accept="image/*" multiple className="sr-only" disabled={busy || photos.length >= MAX_PHOTOS} onChange={(e) => {
            if (e.target.files) addFiles(Array.from(e.target.files));
            e.target.value = "";
          }} />
            <span className="font-semibold text-zinc-800">{loading ? `Đang đọc ${loading} ảnh…` : "Chọn ảnh hoặc kéo thả vào đây"}</span>
            <span className="mt-1 text-sm text-zinc-500">10–20 ảnh là đẹp nhất. Ảnh chỉ nằm trên máy bạn, không tải lên mạng.</span>
          </label>
          {skipped.length > 0 && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              Bỏ qua: {skipped.join("; ")}
            </p>
          )}
          {photos.length > 0 && (
            <ol className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
              {photos.map((p, i) => (
                <li key={p.id} className="group relative overflow-hidden rounded-xl bg-zinc-200">
                  <img src={p.thumb} alt={p.name} className="aspect-[4/3] w-full object-cover" />
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 text-xs font-semibold text-white">{i + 1}</span>
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent p-1">
                    <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} className="h-9 w-9 cursor-pointer rounded-lg text-white hover:bg-white/20 disabled:opacity-30" aria-label={`Đưa ảnh ${i + 1} lên trước`}>
                      ←
                    </button>
                    <button type="button" disabled={busy} onClick={() => setPhotos((x) => x.filter((y) => y.id !== p.id))} className="h-9 w-9 cursor-pointer rounded-lg text-white hover:bg-red-600/80" aria-label={`Bỏ ảnh ${i + 1}`}>
                      ✕
                    </button>
                    <button type="button" disabled={busy || i === photos.length - 1} onClick={() => move(i, 1)} className="h-9 w-9 cursor-pointer rounded-lg text-white hover:bg-white/20 disabled:opacity-30" aria-label={`Đưa ảnh ${i + 1} ra sau`}>
                      →
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <fieldset disabled={busy} className="space-y-3">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Thẻ mở đầu & kết thúc</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Chú rể</span>
              <input className="input" value={text.groom} onChange={setField("groom")} maxLength={40} placeholder="Minh Khang" />
            </label>
            <label className="block">
              <span className="label">Cô dâu</span>
              <input className="input" value={text.bride} onChange={setField("bride")} maxLength={40} placeholder="Thu Trang" />
            </label>
          </div>
          <label className="block">
            <span className="label">Ngày cưới</span>
            <input type="date" className="input" value={text.date} onChange={setField("date")} />
          </label>
          <label className="block">
            <span className="label">Lời cảm ơn ở cuối</span>
            <input className="input" value={text.thanks} onChange={setField("thanks")} maxLength={60} />
          </label>
        </fieldset>

        <fieldset disabled={busy}>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Tốc độ</legend>
          <div className="flex gap-2">
            {PACES.map(([ms, label, hint]) => (
              <button
                key={ms}
                type="button"
                onClick={() => setPace(ms)}
                aria-pressed={pace === ms}
                className={`min-h-11 flex-1 cursor-pointer rounded-xl border px-2 py-1.5 text-sm ${pace === ms ? "border-brand bg-brand text-white" : "border-zinc-200 bg-white hover:border-zinc-400"}`}
              >
                <span className="block font-semibold">{label}</span>
                <span className={`block text-xs ${pace === ms ? "text-white/75" : "text-zinc-500"}`}>{hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset disabled={busy}>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Nhạc nền</legend>
          <select
            className="input min-h-11"
            value={musicValue}
            onChange={(e) => {
              const v = e.target.value;
              setPlaying(false);
              if (v === "none") setMusic({ kind: "none" });
              else if (v === "file") document.getElementById("slideshow-music-file")?.click();
              else {
                const [kind, id] = v.split(":");
                setMusic({ kind: kind as "builtin" | "library", id });
              }
            }}
            aria-label="Chọn nhạc nền"
          >
            <optgroup label="Nhạc dựng sẵn">
              {TRACKS.map((t) => (
                <option key={t.id} value={`builtin:${t.id}`}>
                  {t.name} — {t.by}
                </option>
              ))}
            </optgroup>
            {library.length > 0 && (
              <optgroup label="Thư viện TCWedding">
                {library.map((t) => (
                  <option key={t.id} value={`library:${t.id}`}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Khác">
              <option value="file">{music.kind === "file" ? `File của bạn: ${music.name}` : "Chọn file nhạc trên máy…"}</option>
              <option value="none">Không có nhạc</option>
            </optgroup>
          </select>
          <input
            id="slideshow-music-file"
            type="file"
            accept="audio/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setMusic({ kind: "file", name: f.name, url: URL.createObjectURL(f) });
            }}
          />
          <p className="mt-2 text-xs text-zinc-500">Nhạc tự lặp lại nếu ngắn hơn video và nhỏ dần ở 2 giây cuối.</p>
        </fieldset>

        <div className="space-y-2">
          {busy ? (
            <>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-200" role="progressbar" aria-valuenow={Math.round((progress ?? 0) * 100)} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-brand transition-[width]" style={{ width: `${(progress ?? 0) * 100}%` }} />
              </div>
              <p className="text-sm text-zinc-600" aria-live="polite">
                Đang tạo video… {Math.round((progress ?? 0) * 100)}% (còn khoảng {fmt(total * (1 - (progress ?? 0)))}). Giữ nguyên tab này đến khi xong.
              </p>
              <button type="button" className="btn btn-outline w-full" onClick={() => abortRef.current?.abort()}>
                Huỷ
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary min-h-12 w-full text-base" onClick={exportVideo} disabled={!format || !photos.length}>
              {photos.length ? `Tải video ${format ?? ""} (${fmt(total)})` : "Thêm ảnh để tạo video"}
            </button>
          )}
          {!format && <p className="text-sm text-red-700">Trình duyệt này không tạo được video. Hãy mở trang bằng Chrome hoặc Edge trên máy tính.</p>}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <p className="text-xs text-zinc-500">Video Full HD 1920×1080 được tạo ngay trên máy bạn, mất đúng bằng độ dài video.</p>
        </div>
      </div>
    </div>
  );
}
