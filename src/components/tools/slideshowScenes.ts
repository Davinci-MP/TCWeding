/**
 * Dựng khung hình slideshow ảnh cưới: thẻ mở đầu, từng ảnh chuyển mờ dần kèm hiệu ứng Ken Burns,
 * thẻ cảm ơn ở cuối. Mọi thứ là hàm của thời gian t (ms).
 */
import { clamp01, easeOut, fitFont, formatViDate } from "@/lib/videoRecorder";

export const SLIDE_W = 1920;
export const SLIDE_H = 1080;
export const INTRO_MS = 5000;
export const OUTRO_MS = 6000;
export const FADE_MS = 1000;

export type SlidePhoto = {
  id: string;
  name: string;
  /** Ảnh đã thu nhỏ (tối đa 1920 px cạnh dài). */
  image: HTMLCanvasElement;
  /** Bản rất nhỏ, đã làm mờ, để phủ nền cho ảnh dọc. */
  backdrop: HTMLCanvasElement;
  thumb: string;
};

export type SlideText = { groom: string; bride: string; date: string; thanks: string };

/** Tải và chuẩn bị ảnh từ file người dùng chọn. Ảnh không rời khỏi máy. */
export async function preparePhoto(file: File): Promise<SlidePhoto> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
  const image = document.createElement("canvas");
  image.width = Math.round(bmp.width * scale);
  image.height = Math.round(bmp.height * scale);
  const ictx = image.getContext("2d")!;
  ictx.imageSmoothingQuality = "high";
  ictx.drawImage(bmp, 0, 0, image.width, image.height);

  const backdrop = document.createElement("canvas");
  backdrop.width = 160;
  backdrop.height = 90;
  const bctx = backdrop.getContext("2d")!;
  bctx.filter = "blur(6px) brightness(0.55) saturate(1.15)";
  coverDraw(bctx, image, 160, 90, 1.15, 0, 0);

  const thumb = document.createElement("canvas");
  const ts = 240 / Math.max(image.width, image.height);
  thumb.width = Math.round(image.width * ts);
  thumb.height = Math.round(image.height * ts);
  thumb.getContext("2d")!.drawImage(image, 0, 0, thumb.width, thumb.height);
  bmp.close();
  return { id: crypto.randomUUID(), name: file.name, image, backdrop, thumb: thumb.toDataURL("image/jpeg", 0.8) };
}

function coverDraw(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, W: number, H: number, zoom: number, panX: number, panY: number) {
  const s = Math.max(W / img.width, H / img.height) * zoom;
  const w = img.width * s;
  const h = img.height * s;
  ctx.drawImage(img, (W - w) / 2 + panX * (w - W) / 2, (H - h) / 2 + panY * (h - H) / 2, w, h);
}

export function totalDuration(count: number, perPhotoMs: number) {
  const lens = [INTRO_MS, ...Array(count).fill(perPhotoMs), OUTRO_MS];
  return lens.reduce((n, l) => n + l, 0) - FADE_MS * (lens.length - 1);
}

function drawPhoto(ctx: CanvasRenderingContext2D, p: SlidePhoto, progress: number, index: number) {
  const W = SLIDE_W;
  const H = SLIDE_H;
  const ratio = p.image.width / p.image.height;
  const dir = index % 2 === 0 ? 1 : -1;
  const zoom = 1.02 + 0.07 * (index % 2 === 0 ? progress : 1 - progress);
  if (ratio > 1.35) {
    // Ảnh ngang: phủ kín khung, trôi nhẹ theo chiều ngang
    coverDraw(ctx, p.image, W, H, zoom, dir * (progress - 0.5) * 0.6, 0);
    return;
  }
  // Ảnh dọc hoặc vuông: nền mờ từ chính ảnh, ảnh đặt giữa có bóng đổ
  ctx.imageSmoothingQuality = "low";
  coverDraw(ctx, p.backdrop, W, H, 1.1, 0, 0);
  ctx.imageSmoothingQuality = "high";
  const h = H * 0.9;
  const w = h * ratio;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  const s = 1 + 0.035 * progress;
  ctx.scale(s, s);
  ctx.shadowColor = "rgba(0,0,0,.45)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  ctx.drawImage(p.image, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`;
}

const script = (s: number) => `italic 500 ${s}px "Cormorant Garamond", Georgia, serif`;
const sans = (s: number) => `500 ${s}px "Be Vietnam Pro", system-ui, sans-serif`;

function drawCard(ctx: CanvasRenderingContext2D, photo: SlidePhoto | undefined, local: number, lines: { eyebrow: string; title: string; sub: string }, base: number) {
  const W = SLIDE_W;
  const H = SLIDE_H;
  if (photo) {
    ctx.imageSmoothingQuality = "low";
    coverDraw(ctx, photo.backdrop, W, H, 1.1 + local / 60000, 0, 0);
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "rgba(20,16,14,.45)";
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
    g.addColorStop(0, "#3a2a22");
    g.addColorStop(1, "#14100e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.textAlign = "center";
  const a1 = easeOut((local - 300) / 1200);
  const a2 = easeOut((local - 800) / 1400);
  const a3 = easeOut((local - 1500) / 1200);

  ctx.globalAlpha = base * a1;
  setSpacing(ctx, 14);
  ctx.font = sans(30);
  ctx.fillStyle = "rgba(243,236,227,.75)";
  ctx.fillText(lines.eyebrow.toUpperCase(), W / 2, H / 2 - 150);
  setSpacing(ctx, 0);

  ctx.globalAlpha = base * a2;
  fitFont(ctx, lines.title, script, 150, W * 0.84);
  ctx.fillStyle = "#f3ece3";
  ctx.shadowColor = "rgba(0,0,0,.35)";
  ctx.shadowBlur = 24;
  ctx.fillText(lines.title, W / 2, H / 2 + 40 + (1 - a2) * 24);
  ctx.shadowBlur = 0;

  ctx.globalAlpha = base * a3;
  ctx.strokeStyle = "rgba(216,205,191,.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 90 * a3, H / 2 + 100);
  ctx.lineTo(W / 2 + 90 * a3, H / 2 + 100);
  ctx.stroke();
  setSpacing(ctx, 8);
  ctx.font = sans(34);
  ctx.fillStyle = "#d8cdbf";
  ctx.fillText(lines.sub, W / 2, H / 2 + 170);
  setSpacing(ctx, 0);
  ctx.globalAlpha = base;
}

export function drawSlideshow(ctx: CanvasRenderingContext2D, t: number, photos: SlidePhoto[], perPhotoMs: number, text: SlideText) {
  const W = SLIDE_W;
  const H = SLIDE_H;
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  const names = `${text.groom.trim() || "Chú rể"}  &  ${text.bride.trim() || "Cô dâu"}`;
  const { dots } = formatViDate(text.date);
  const lens = [INTRO_MS, ...photos.map(() => perPhotoMs), OUTRO_MS];
  const total = totalDuration(photos.length, perPhotoMs);
  let start = 0;
  lens.forEach((len, i) => {
    const local = t - start;
    if (local >= 0 && local < len + (i === lens.length - 1 ? 1 : 0)) {
      const base = i === 0 ? 1 : clamp01(local / FADE_MS);
      ctx.globalAlpha = base;
      if (i === 0) drawCard(ctx, photos[0], local, { eyebrow: "Lễ Thành Hôn", title: names, sub: dots }, base);
      else if (i === lens.length - 1) drawCard(ctx, photos[photos.length - 1], local, { eyebrow: names, title: text.thanks.trim() || "Cảm ơn quý khách", sub: dots }, base);
      else drawPhoto(ctx, photos[i - 1], clamp01(local / len), i - 1);
      ctx.globalAlpha = 1;
    }
    start += len - FADE_MS;
  });
  // Mở từ đen và khép về đen
  const fade = Math.max(1 - clamp01(t / 1200), clamp01((t - (total - 1500)) / 1500));
  if (fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}
