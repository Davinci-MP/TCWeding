/**
 * Cảnh động cho Màn hình LED đám cưới. Mọi thứ là hàm của thời gian t, nên bản xem trước
 * và video tải về giống hệt nhau.
 */
import { clamp01, easeOut, fitFont, formatViDate } from "@/lib/videoRecorder";

export type LedData = {
  eyebrow: string;
  groom: string;
  bride: string;
  date: string; // yyyy-mm-dd
  venue: string;
};

export type LedThemeId = "ruou-vang" | "dem-sao" | "hoa-hong" | "song-hy";

type Theme = {
  name: string;
  note: string;
  bg: [string, string];
  text: string;
  soft: string;
  gold: boolean;
  particles: "dust" | "stars" | "petals";
  swatch: [string, string];
};

export const LED_THEMES: Record<LedThemeId, Theme> = {
  "ruou-vang": { name: "Rượu vang", note: "Nền đỏ rượu, bụi vàng bay lên", bg: ["#5a1a24", "#16060a"], text: "#f4e3c1", soft: "rgba(244,227,193,.7)", gold: true, particles: "dust", swatch: ["#5a1a24", "#d9b26a"] },
  "dem-sao": { name: "Đêm sao", note: "Xanh đêm, sao lấp lánh", bg: ["#13234a", "#03060f"], text: "#eef1f8", soft: "rgba(238,241,248,.65)", gold: false, particles: "stars", swatch: ["#13234a", "#eef1f8"] },
  "hoa-hong": { name: "Hoa hồng", note: "Hồng phấn, cánh hoa rơi", bg: ["#fbefea", "#ecc9c1"], text: "#7b2d26", soft: "rgba(123,45,38,.7)", gold: false, particles: "petals", swatch: ["#f4d9d2", "#7b2d26"] },
  "song-hy": { name: "Song Hỷ", note: "Đỏ truyền thống, chữ Hỷ vàng", bg: ["#a51f1f", "#4d0808"], text: "#f6dc9a", soft: "rgba(246,220,154,.75)", gold: true, particles: "dust", swatch: ["#a51f1f", "#f6dc9a"] },
};

export type LedRatio = "16:9" | "3:1" | "9:16";
export const LED_SIZES: Record<LedRatio, { w: number; h: number; label: string; hint: string }> = {
  "16:9": { w: 1920, h: 1080, label: "16:9 · Full HD", hint: "Màn LED, TV, máy chiếu thông thường" },
  "3:1": { w: 2400, h: 800, label: "3:1 · Màn dài", hint: "Màn LED ngang dài sau sân khấu" },
  "9:16": { w: 1080, h: 1920, label: "9:16 · Màn đứng", hint: "Standee điện tử, màn đứng ở cổng" },
};

type Particle = { x: number; y: number; r: number; speed: number; phase: number; spin: number };

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const cache = new Map<string, Particle[]>();
function particles(kind: string, count: number) {
  const key = `${kind}-${count}`;
  let list = cache.get(key);
  if (!list) {
    const r = rng(kind.length * 7919 + count);
    list = Array.from({ length: count }, () => ({ x: r(), y: r(), r: r(), speed: 0.4 + r() * 0.8, phase: r() * Math.PI * 2, spin: r() - 0.5 }));
    cache.set(key, list);
  }
  return list;
}

function drawBackground(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, th: Theme) {
  const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.hypot(W, H) * 0.62);
  g.addColorStop(0, th.bg[0]);
  g.addColorStop(1, th.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Quầng sáng trôi chậm
  const s = t / 1000;
  const glowX = W * (0.5 + 0.28 * Math.sin(s * 0.25));
  const glow = ctx.createRadialGradient(glowX, H * 0.35, 0, glowX, H * 0.35, Math.max(W, H) * 0.45);
  glow.addColorStop(0, th.particles === "petals" ? "rgba(255,255,255,.45)" : th.gold ? "rgba(255,210,140,.16)" : "rgba(140,170,255,.14)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

function drawSongHy(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const size = Math.min(W, H) * 0.95;
  ctx.save();
  ctx.globalAlpha = 0.09 + 0.02 * Math.sin(t / 900);
  ctx.fillStyle = "#f6dc9a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${size}px "Noto Serif CJK SC", "Microsoft YaHei", "PingFang SC", serif`;
  ctx.fillText("囍", W / 2, H / 2 + size * 0.04);
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, th: Theme) {
  const s = t / 1000;
  const unit = Math.min(W, H);
  if (th.particles === "dust") {
    for (const p of particles("dust", 90)) {
      const y = (((p.y - s * 0.035 * p.speed) % 1) + 1) % 1;
      const x = p.x + 0.015 * Math.sin(s * 0.8 + p.phase);
      const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(s * 2 * p.speed + p.phase));
      const r = unit * (0.0015 + p.r * 0.004);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,214,140,${a * Math.sin(y * Math.PI)})`;
      ctx.arc(x * W, y * H, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (th.particles === "stars") {
    for (const p of particles("stars", 140)) {
      const a = Math.pow(0.5 + 0.5 * Math.sin(s * 1.6 * p.speed + p.phase), 3);
      const r = unit * (0.0008 + p.r * 0.0026);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${0.15 + a * 0.85})`;
      ctx.arc(p.x * W, p.y * H, r, 0, Math.PI * 2);
      ctx.fill();
      if (p.r > 0.85) {
        ctx.strokeStyle = `rgba(255,255,255,${a * 0.6})`;
        ctx.lineWidth = r * 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x * W - r * 5, p.y * H);
        ctx.lineTo(p.x * W + r * 5, p.y * H);
        ctx.moveTo(p.x * W, p.y * H - r * 5);
        ctx.lineTo(p.x * W, p.y * H + r * 5);
        ctx.stroke();
      }
    }
    // Sao băng mỗi 7 giây
    const k = (s % 7) / 1.2;
    if (k < 1) {
      const x0 = W * 0.75 - k * W * 0.4;
      const y0 = H * 0.12 + k * H * 0.22;
      const tail = ctx.createLinearGradient(x0, y0, x0 + W * 0.12, y0 - H * 0.066);
      tail.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - k)})`);
      tail.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = tail;
      ctx.lineWidth = unit * 0.003;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + W * 0.12, y0 - H * 0.066);
      ctx.stroke();
    }
  } else {
    for (const p of particles("petals", 34)) {
      const y = (((p.y + s * 0.05 * p.speed) % 1.1) + 1.1) % 1.1 - 0.05;
      const x = p.x + 0.05 * Math.sin(s * 0.7 * p.speed + p.phase);
      const r = unit * (0.008 + p.r * 0.012);
      ctx.save();
      ctx.translate(x * W, y * H);
      ctx.rotate(p.phase + s * p.spin * 1.5);
      ctx.scale(1, 0.55 + 0.35 * Math.sin(s * 1.3 + p.phase));
      ctx.beginPath();
      ctx.fillStyle = `rgba(${200 + Math.round(p.r * 40)},${120 + Math.round(p.r * 40)},${130 + Math.round(p.r * 30)},.7)`;
      ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

/** Độ hiện của phần tử thứ i: hiện dần lúc mở đầu, mờ đi ở 1,2 giây cuối vòng lặp. */
function reveal(t: number, i: number, loopMs: number) {
  const inA = easeOut((t - 500 - i * 450) / 1300);
  const out = 1 - clamp01((t - (loopMs - 1200)) / 1000);
  return Math.min(inA, out);
}

function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`;
}

function fillShimmer(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, W: number, t: number, th: Theme) {
  if (!th.gold) {
    ctx.fillStyle = th.text;
    ctx.fillText(text, x, y);
    return;
  }
  const width = ctx.measureText(text).width;
  const left = x - width / 2;
  const sweep = ((t / 4200) % 1.6) - 0.3; // vệt sáng quét qua chữ
  const g = ctx.createLinearGradient(left, 0, left + width, 0);
  const c = th.text;
  g.addColorStop(0, "#c9963f");
  g.addColorStop(clamp01(sweep - 0.12), c);
  g.addColorStop(clamp01(sweep), "#fffaf0");
  g.addColorStop(clamp01(sweep + 0.12), c);
  g.addColorStop(1, "#c9963f");
  ctx.fillStyle = g;
  ctx.shadowColor = "rgba(255,200,120,.35)";
  ctx.shadowBlur = W * 0.01;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
}

function ornament(ctx: CanvasRenderingContext2D, cx: number, y: number, half: number, gap: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, half * 0.012);
  ctx.beginPath();
  ctx.moveTo(cx - gap - half, y);
  ctx.lineTo(cx - gap, y);
  ctx.moveTo(cx + gap, y);
  ctx.lineTo(cx + gap + half, y);
  ctx.stroke();
}

export function drawLed(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, data: LedData, themeId: LedThemeId, loopMs: number) {
  const th = LED_THEMES[themeId];
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  drawBackground(ctx, W, H, t, th);
  if (themeId === "song-hy") drawSongHy(ctx, W, H, t);
  drawParticles(ctx, W, H, t, th);

  const wide = W / H > 2.2;
  const tall = H > W;
  const unit = Math.min(W, H);
  const cx = W / 2;
  const maxW = W * (tall ? 0.86 : 0.8);
  const groom = data.groom.trim() || "Chú rể";
  const bride = data.bride.trim() || "Cô dâu";
  const { weekday, dots } = formatViDate(data.date);
  const dateLine = [weekday, dots].filter(Boolean).join("  ·  ");
  const script = (s: number) => `italic 500 ${s}px "Cormorant Garamond", Georgia, serif`;
  const sans = (s: number) => `500 ${s}px "Be Vietnam Pro", system-ui, sans-serif`;

  // Bố cục theo tỉ lệ khung: màn dài xếp tên trên một dòng, màn vuông/đứng xếp ba dòng
  const eyebrowSize = unit * (wide ? 0.05 : 0.036);
  const nameSize = unit * (wide ? 0.26 : tall ? 0.2 : 0.165);
  const dateSize = unit * (wide ? 0.052 : 0.04);
  const venueSize = unit * (wide ? 0.042 : 0.03);

  type Row = { h: number; draw: (y: number, a: number) => void };
  const rows: Row[] = [];
  if (data.eyebrow.trim()) {
    rows.push({
      h: eyebrowSize * 2.4,
      draw: (y, a) => {
        ctx.globalAlpha = a;
        setSpacing(ctx, eyebrowSize * 0.45);
        const text = data.eyebrow.trim().toUpperCase();
        fitFont(ctx, text, sans, eyebrowSize, maxW * 0.7);
        ctx.fillStyle = th.soft;
        ctx.fillText(text, cx, y);
        const w = ctx.measureText(text).width;
        setSpacing(ctx, 0);
        ornament(ctx, cx, y - eyebrowSize * 0.35, unit * 0.06 * a, w / 2 + unit * 0.03, th.soft);
      },
    });
  }
  const nameRow = (text: string) => ({
    h: nameSize * 1.05,
    draw: (y: number, a: number) => {
      ctx.globalAlpha = a;
      fitFont(ctx, text, script, nameSize, maxW);
      fillShimmer(ctx, text, cx, y + (1 - a) * unit * 0.03, W, t, th);
    },
  });
  if (wide) {
    rows.push(nameRow(`${groom}  &  ${bride}`));
  } else {
    rows.push(nameRow(groom));
    rows.push({
      h: nameSize * 0.62,
      draw: (y, a) => {
        ctx.globalAlpha = a;
        ctx.font = script(nameSize * 0.5);
        ctx.fillStyle = th.soft;
        ctx.fillText("&", cx, y);
      },
    });
    rows.push(nameRow(bride));
  }
  if (dateLine) {
    rows.push({
      h: dateSize * 2.6,
      draw: (y, a) => {
        ctx.globalAlpha = a;
        setSpacing(ctx, dateSize * 0.18);
        fitFont(ctx, dateLine, sans, dateSize, maxW);
        ctx.fillStyle = th.text;
        ctx.fillText(dateLine, cx, y);
        setSpacing(ctx, 0);
      },
    });
  }
  if (data.venue.trim()) {
    rows.push({
      h: venueSize * 1.9,
      draw: (y, a) => {
        ctx.globalAlpha = a;
        fitFont(ctx, data.venue.trim(), sans, venueSize, maxW);
        ctx.fillStyle = th.soft;
        ctx.fillText(data.venue.trim(), cx, y);
      },
    });
  }

  const total = rows.reduce((n, r) => n + r.h, 0);
  let y = (H - total) / 2;
  rows.forEach((r, i) => {
    y += r.h;
    r.draw(y - r.h * 0.22, reveal(t, i, loopMs));
  });
  ctx.restore();
}
