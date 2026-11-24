"use client";

/**
 * Ghi một canvas thành file video ngay trên trình duyệt (MediaRecorder), không gửi gì lên máy chủ.
 * Dùng cho Màn hình LED và Slideshow. Ghi theo thời gian thực: video 60 giây mất 60 giây để tạo.
 */

export type VideoFormat = { mime: string; ext: "mp4" | "webm" };

const CANDIDATES: VideoFormat[] = [
  { mime: "video/mp4;codecs=avc1.640028,mp4a.40.2", ext: "mp4" },
  { mime: "video/mp4;codecs=avc1,mp4a.40.2", ext: "mp4" },
  { mime: "video/mp4", ext: "mp4" },
  { mime: "video/webm;codecs=vp9,opus", ext: "webm" },
  { mime: "video/webm;codecs=vp8,opus", ext: "webm" },
  { mime: "video/webm", ext: "webm" },
];

/** Định dạng tốt nhất trình duyệt ghi được; ưu tiên MP4 vì TV, máy chiếu và màn LED đọc được ngay. */
export function pickVideoFormat(): VideoFormat | null {
  if (typeof MediaRecorder === "undefined") return null;
  return CANDIDATES.find((c) => MediaRecorder.isTypeSupported(c.mime)) ?? null;
}

export type RecordOptions = {
  durationMs: number;
  /** Vẽ khung hình tại thời điểm t (ms tính từ đầu video). */
  draw: (t: number) => void;
  /** Phần tử audio mới (chưa từng nối vào AudioContext) để trộn vào video; nhạc nhỏ dần ở 2 giây cuối. */
  audio?: HTMLAudioElement | null;
  fps?: number;
  bitrate?: number;
  onProgress?: (ratio: number) => void;
  signal?: AbortSignal;
};

export async function recordCanvas(canvas: HTMLCanvasElement, opts: RecordOptions): Promise<{ blob: Blob; ext: string }> {
  const format = pickVideoFormat();
  if (!format) throw new Error("Trình duyệt này không ghi được video. Hãy dùng Chrome hoặc Edge bản mới trên máy tính.");
  const fps = opts.fps ?? 30;
  const stream = canvas.captureStream(fps);

  let audioCtx: AudioContext | null = null;
  let gain: GainNode | null = null;
  if (opts.audio) {
    audioCtx = new AudioContext();
    const src = audioCtx.createMediaElementSource(opts.audio);
    gain = audioCtx.createGain();
    const dest = audioCtx.createMediaStreamDestination();
    src.connect(gain).connect(dest);
    dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
  }

  const recorder = new MediaRecorder(stream, {
    mimeType: format.mime,
    videoBitsPerSecond: opts.bitrate ?? 10_000_000,
    audioBitsPerSecond: 192_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const done = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));
  opts.draw(0);
  if (opts.audio) {
    opts.audio.currentTime = 0;
    await audioCtx!.resume();
    await opts.audio.play();
  }
  recorder.start(1000);
  const start = performance.now();
  let aborted = false;
  let hidden = false;

  await new Promise<void>((resolve) => {
    // Tab bị ẩn thì trình duyệt ngừng vẽ, video sẽ đứng hình: dừng ngay và báo rõ
    const onHide = () => {
      if (!document.hidden) return;
      hidden = true;
      resolve();
    };
    document.addEventListener("visibilitychange", onHide);
    done.then(() => document.removeEventListener("visibilitychange", onHide));
    const tick = () => {
      if (hidden) return;
      if (opts.signal?.aborted) {
        aborted = true;
        return resolve();
      }
      const t = performance.now() - start;
      if (t >= opts.durationMs) return resolve();
      opts.draw(t);
      if (gain && audioCtx) {
        const left = opts.durationMs - t;
        gain.gain.setValueAtTime(left < 2000 ? Math.max(0, left / 2000) : 1, audioCtx.currentTime);
      }
      opts.onProgress?.(t / opts.durationMs);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  opts.draw(opts.durationMs);
  await new Promise((r) => setTimeout(r, 120));
  recorder.stop();
  await done;
  opts.audio?.pause();
  stream.getTracks().forEach((tr) => tr.stop());
  await audioCtx?.close();
  if (aborted) throw new DOMException("Đã huỷ", "AbortError");
  if (hidden) throw new Error("Video bị dừng vì bạn rời khỏi tab này. Hãy bấm tải lại và giữ tab mở đến khi xong.");
  opts.onProgress?.(1);
  return { blob: new Blob(chunks, { type: format.mime.split(";")[0] }), ext: format.ext };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Tên file không dấu: "Minh Anh & Thu Trang" → "minh-anh-thu-trang". */
export function slugifyVi(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "tcwedding"
  );
}

/** Chờ font web tải xong trước khi vẽ lên canvas (canvas không tự vẽ lại khi font về). */
export async function ensureFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all(
    ['italic 500 64px "Cormorant Garamond"', '600 64px "Cormorant Garamond"', '500 32px "Be Vietnam Pro"', 'italic 400 64px "Playfair Display"'].map((f) =>
      document.fonts.load(f, "Đẹp ẩ").catch(() => null),
    ),
  );
}

/** Thu nhỏ chữ cho vừa bề ngang tối đa. */
export function fitFont(ctx: CanvasRenderingContext2D, text: string, font: (size: number) => string, size: number, maxWidth: number) {
  let s = size;
  ctx.font = font(s);
  while (s > 8 && ctx.measureText(text).width > maxWidth) {
    s *= 0.94;
    ctx.font = font(s);
  }
  return s;
}

export const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Ngày "2026-12-20" → { weekday: "Chủ Nhật", dots: "20 · 12 · 2026" }. */
export function formatViDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return { weekday: "", dots: "" };
  const wd = new Date(y, m - 1, d).getDay();
  const names = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return { weekday: names[wd], dots: `${String(d).padStart(2, "0")} · ${String(m).padStart(2, "0")} · ${y}` };
}
