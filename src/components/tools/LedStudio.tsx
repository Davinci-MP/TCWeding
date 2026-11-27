"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_COUPLE } from "@/lib/invitation";
import { downloadBlob, ensureFonts, pickVideoFormat, recordCanvas, slugifyVi } from "@/lib/videoRecorder";
import { drawLed, LED_SIZES, LED_THEMES, type LedData, type LedRatio, type LedThemeId } from "./ledScenes";

const DURATIONS = [15, 30, 60];

export function LedStudio() {
  const [data, setData] = useState<LedData>({ eyebrow: "Lễ Thành Hôn", groom: DEMO_COUPLE.groom, bride: DEMO_COUPLE.bride, date: "2026-12-20", venue: "Sảnh Ngọc Trai · Nhà hàng tiệc cưới" });
  const [theme, setTheme] = useState<LedThemeId>("ruou-vang");
  const [ratio, setRatio] = useState<LedRatio>("16:9");
  const [seconds, setSeconds] = useState(15);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [format, setFormat] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const live = useRef({ data, theme, seconds });
  live.current = { data, theme, seconds };

  const { w, h } = LED_SIZES[ratio];

  useEffect(() => {
    const f = pickVideoFormat();
    setFormat(f ? f.ext.toUpperCase() : null);
  }, []);

  // Bản xem trước chạy lặp liên tục; tạm dừng khi đang ghi video (lúc đó recorder tự vẽ)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || progress !== null) return;
    let raf = 0;
    let stopped = false;
    const start = performance.now();
    ensureFonts().then(() => {
      if (stopped) return;
      const tick = () => {
        const loop = live.current.seconds * 1000;
        drawLed(ctx, canvas.width, canvas.height, (performance.now() - start) % loop, live.current.data, live.current.theme, loop);
        raf = requestAnimationFrame(tick);
      };
      tick();
    });
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [ratio, progress]);

  async function exportVideo() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    setError("");
    setProgress(0);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await ensureFonts();
      const loop = seconds * 1000;
      const { blob, ext } = await recordCanvas(canvas, {
        durationMs: loop,
        draw: (t) => drawLed(ctx, canvas.width, canvas.height, t, data, theme, loop),
        onProgress: setProgress,
        signal: ac.signal,
      });
      downloadBlob(blob, `man-hinh-led-${slugifyVi(`${data.groom} ${data.bride}`)}.${ext}`);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message || "Không tạo được video.");
    } finally {
      setProgress(null);
      abortRef.current = null;
    }
  }

  const set = (k: keyof LedData) => (e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, [k]: e.target.value });
  const busy = progress !== null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-center rounded-2xl bg-[#0d0b0a] p-3 shadow-2xl ring-1 ring-black/10 sm:p-5">
          <canvas
            ref={canvasRef}
            width={w}
            height={h}
            className={`block h-auto max-w-full rounded-md ${ratio === "9:16" ? "max-h-[70vh] w-auto" : "w-full"}`}
            style={ratio === "9:16" ? { aspectRatio: `${w}/${h}` } : undefined}
            aria-label={`Xem trước màn hình LED: ${data.groom} và ${data.bride}`}
          />
        </div>
        <p className="mt-3 text-center text-xs text-zinc-500">
          Bản xem trước chạy lặp lại giống hệt video tải về · {w}×{h} px · {seconds} giây
        </p>
      </div>

      <div className="space-y-6">
        <fieldset disabled={busy} className="space-y-3">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Nội dung</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Chú rể</span>
              <input className="input" value={data.groom} onChange={set("groom")} maxLength={40} />
            </label>
            <label className="block">
              <span className="label">Cô dâu</span>
              <input className="input" value={data.bride} onChange={set("bride")} maxLength={40} />
            </label>
          </div>
          <label className="block">
            <span className="label">Ngày cưới</span>
            <input type="date" className="input" value={data.date} onChange={set("date")} />
          </label>
          <label className="block">
            <span className="label">Dòng chữ phía trên</span>
            <input className="input" value={data.eyebrow} onChange={set("eyebrow")} maxLength={40} placeholder="Lễ Thành Hôn, Lễ Vu Quy, Tiệc cưới…" />
          </label>
          <label className="block">
            <span className="label">Địa điểm (không bắt buộc)</span>
            <input className="input" value={data.venue} onChange={set("venue")} maxLength={80} />
          </label>
        </fieldset>

        <fieldset disabled={busy}>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Kiểu nền</legend>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LED_THEMES) as LedThemeId[]).map((id) => {
              const th = LED_THEMES[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  aria-pressed={theme === id}
                  className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-left text-sm transition ${theme === id ? "border-brand bg-brand/5 ring-2 ring-brand/20" : "border-zinc-200 bg-white hover:border-zinc-400"}`}
                >
                  <span className="h-8 w-8 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: `linear-gradient(135deg, ${th.swatch[0]} 50%, ${th.swatch[1]} 50%)` }} aria-hidden />
                  <span>
                    <span className="block font-semibold">{th.name}</span>
                    <span className="block text-xs leading-tight text-zinc-500">{th.note}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset disabled={busy}>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Khổ màn hình</legend>
          <div className="space-y-2">
            {(Object.keys(LED_SIZES) as LedRatio[]).map((r) => (
              <label key={r} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${ratio === r ? "border-brand bg-brand/5" : "border-zinc-200 bg-white"}`}>
                <input type="radio" name="ratio" checked={ratio === r} onChange={() => setRatio(r)} className="accent-[#7b2d26]" />
                <span>
                  <span className="font-semibold">{LED_SIZES[r].label}</span>
                  <span className="block text-xs text-zinc-500">{LED_SIZES[r].hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset disabled={busy}>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Độ dài một vòng</legend>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSeconds(d)}
                aria-pressed={seconds === d}
                className={`min-h-11 flex-1 cursor-pointer rounded-xl border text-sm font-semibold ${seconds === d ? "border-brand bg-brand text-white" : "border-zinc-200 bg-white hover:border-zinc-400"}`}
              >
                {d} giây
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">Đặt máy chiếu ở chế độ lặp lại, video sẽ chạy suốt buổi tiệc.</p>
        </fieldset>

        <div className="space-y-2">
          {busy ? (
            <>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-200" role="progressbar" aria-valuenow={Math.round((progress ?? 0) * 100)} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-brand transition-[width]" style={{ width: `${(progress ?? 0) * 100}%` }} />
              </div>
              <p className="text-sm text-zinc-600" aria-live="polite">
                Đang tạo video… {Math.round((progress ?? 0) * 100)}%. Giữ nguyên tab này đến khi xong.
              </p>
              <button type="button" className="btn btn-outline w-full" onClick={() => abortRef.current?.abort()}>
                Huỷ
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary min-h-12 w-full text-base" onClick={exportVideo} disabled={!format}>
              Tải video {format ?? ""} miễn phí
            </button>
          )}
          {!format && <p className="text-sm text-red-700">Trình duyệt này không tạo được video. Hãy mở trang bằng Chrome hoặc Edge trên máy tính.</p>}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <p className="text-xs text-zinc-500">Video được tạo ngay trên máy bạn, mất khoảng {seconds} giây. Không cần đăng ký.</p>
        </div>
      </div>
    </div>
  );
}
