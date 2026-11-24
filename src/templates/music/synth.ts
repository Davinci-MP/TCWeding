/**
 * Bộ tổng hợp nhạc chạy trong trình duyệt: dựng bài từ bản nhạc (nốt) bằng tính toán trực tiếp
 * (bảng sóng, dây gảy Karplus–Strong, hồi âm Freeverb), xuất WAV để phát qua thẻ <audio>
 * — phát được cả khi iPhone gạt chế độ im lặng. Không cần file nhạc, không vướng bản quyền bản thu.
 */
import { getTrack, type Note, type Track } from "./tracks";

const SR = 32000;
const NYQ = SR * 0.45;

/* ---------------- bảng sóng ---------------- */
const W = 2048;
const tables = new Map<string, Float32Array>();
/** Bảng một chu kỳ từ các bội âm, bỏ bội âm vượt quá tần số lấy mẫu (tránh méo răng cưa). */
function table(kind: string, partials: (h: number) => number, maxH: number) {
  const key = `${kind}:${maxH}`;
  let t = tables.get(key);
  if (t) return t;
  t = new Float32Array(W + 1);
  for (let h = 1; h <= maxH; h++) {
    const a = partials(h);
    if (!a) continue;
    for (let i = 0; i <= W; i++) t[i] += a * Math.sin((2 * Math.PI * h * i) / W);
  }
  tables.set(key, t);
  return t;
}
const limitH = (f: number, cap: number) => Math.max(1, Math.min(cap, Math.floor(NYQ / f)));
const PIANO = [1, 0.5, 0.28, 0.14, 0.08, 0.05, 0.03, 0.02];
const ORGAN = [1, 0.35, 0.12, 0.05, 0.02];
const tPiano = (f: number) => table("piano", (h) => PIANO[h - 1] ?? 0, limitH(f, 8));
const tDull = () => table("dull", (h) => [1, 0.3][h - 1] ?? 0, 2);
const tOrgan = (f: number) => table("organ", (h) => ORGAN[h - 1] ?? 0, limitH(f, 5));
const tSaw = (f: number) => table("saw", (h) => 0.55 / h, limitH(f, 40));
const SINE = table("sine", (h) => (h === 1 ? 1 : 0), 1);

/** Đọc bảng với nội suy tuyến tính; ph tính theo chu kỳ [0, 1). */
function look(t: Float32Array, ph: number) {
  const x = ph * W;
  const i = x | 0;
  return t[i] + (x - i) * (t[i + 1] - t[i]);
}
const wrap = (ph: number) => ph - Math.floor(ph);

const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const CENT = Math.LN2 / 1200;

/** Đường bao: lên tuyến tính → tắt dần theo hằng số thời gian → nhả khi hết nốt. */
class Env {
  level = 0;
  private i = 0;
  private readonly a: number;
  private readonly peak: number;
  private readonly dk: number;
  private readonly rk: number;
  private readonly rel: number;
  constructor(peak: number, attack: number, tau: number, releaseAt: number, release: number) {
    this.peak = peak;
    this.a = Math.max(1, Math.floor(attack * SR));
    this.dk = tau > 0 ? Math.exp(-1 / (tau * SR)) : 1;
    this.rk = Math.exp(-1 / (release * SR));
    this.rel = Math.floor(releaseAt * SR);
  }
  next() {
    const i = this.i++;
    if (i < this.a) this.level = (this.peak * (i + 1)) / this.a;
    else this.level *= this.dk;
    if (i >= this.rel) this.level *= this.rk;
    return this.level;
  }
}

type Ctx = { out: Float32Array; plucks: Map<string, Float32Array> };

/** Dây gảy Karplus–Strong, dùng lại theo cao độ. */
function pluckBuffer(c: Ctx, f: number, decay: number, bright: number) {
  const n = Math.max(2, Math.floor(SR / f - 0.5));
  const key = `${n}:${decay}:${bright}`;
  const hit = c.plucks.get(key);
  if (hit) return { buf: hit, f0: SR / (n + 0.5) };
  const len = SR * 4;
  const y = new Float32Array(len);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    prev += bright * (Math.random() * 2 - 1 - prev);
    y[i] = prev;
  }
  for (let i = n; i < len; i++) y[i] = decay * 0.5 * (y[i - n] + y[i - n - 1 < 0 ? 0 : i - n - 1]);
  c.plucks.set(key, y);
  return { buf: y, f0: SR / (n + 0.5) };
}

const PLUCK: Record<string, { decay: number; bright: number; gain: number }> = {
  guitar: { decay: 0.996, bright: 0.5, gain: 0.9 },
  harp: { decay: 0.9975, bright: 0.35, gain: 0.8 },
  tranh: { decay: 0.9985, bright: 0.75, gain: 0.8 },
};

/** Ghi một nốt vào bộ đệm. t, d tính bằng giây. */
function voice(c: Ctx, n: Note, t: number, d: number) {
  const out = c.out;
  const f = midiHz(n.m);
  const v = n.v ?? 0.6;
  const s0 = Math.floor(t * SR);
  const put = (len: number, fn: (k: number) => number) => {
    const end = Math.min(out.length, s0 + Math.floor(len * SR));
    for (let s = s0, k = 0; s < end; s++, k++) out[s] += fn(k);
  };

  switch (n.i) {
    case "piano": {
      // phím thấp ngân lâu hơn; bội âm cao tắt nhanh hơn như búa đàn
      const tau = 0.55 + 1.4 * Math.max(0, 1 - (f - 110) / 900);
      const env = new Env(v * 0.42, 0.004, tau, d, 0.18);
      const B = tPiano(f);
      const D = tDull();
      const bk = Math.exp(-1 / (tau * 0.35 * SR));
      const inc = f / SR;
      const inc2 = inc * Math.exp(3.5 * CENT);
      let p1 = 0;
      let p2 = 0;
      let b = 1;
      put(d + 1.2, () => {
        b *= bk;
        const bb = 0.25 + 0.75 * b;
        const s = (1 - bb) * (look(D, p1) + 0.45 * look(D, p2)) + bb * (look(B, p1) + 0.45 * look(B, p2));
        p1 = wrap(p1 + inc);
        p2 = wrap(p2 + inc2);
        return s * env.next();
      });
      break;
    }
    case "box": {
      // hộp nhạc: răng lược thép — nốt gốc trong, bội âm cao tắt rất nhanh
      const e1 = new Env(v * 0.38, 0.002, 0.55, 3, 0.4);
      const e2 = new Env(f * 3 < NYQ ? v * 0.12 : 0, 0.001, 0.09, 1, 0.1);
      const e3 = new Env(f * 6.27 < NYQ ? v * 0.05 : 0, 0.001, 0.03, 0.4, 0.05);
      const inc = f / SR;
      let p = 0;
      let p3 = 0;
      put(3, () => {
        const s = look(SINE, p) * e1.next() + look(SINE, wrap(p * 3)) * e2.next() + look(SINE, p3) * e3.next();
        p = wrap(p + inc);
        p3 = wrap(p3 + inc * 6.27);
        return s;
      });
      break;
    }
    case "rhodes": {
      // piano điện FM: bộ điều chế cùng tần số, độ "kim" giảm dần
      const env = new Env(v * 0.34, 0.003, 1.6, d, 0.22);
      const inc = f / SR;
      const ik = Math.exp(-1 / (0.35 * SR));
      let idx = 1.6 * v - 0.25;
      let p = 0;
      put(d + 0.8, () => {
        idx *= ik;
        const m = look(SINE, p) * (idx + 0.25);
        const s = look(SINE, wrap(p + m / (2 * Math.PI)));
        p = wrap(p + inc);
        return s * env.next();
      });
      break;
    }
    case "pad": {
      // dàn dây: hai sóng răng cưa lệch nhẹ, lọc ấm, vào chậm, rung nhẹ
      const env = new Env(v * 0.085, Math.min(0.6, d * 0.4), 0, d, 0.55);
      const S = tSaw(f);
      const inc = f / SR;
      const lo = Math.exp(-7 * CENT);
      const hi = Math.exp(7 * CENT);
      const a = 1 - Math.exp((-2 * Math.PI * Math.min(2400, 700 + f * 1.5)) / SR);
      const lfoInc = 5.1 / SR;
      let p1 = 0;
      let p2 = 0.37;
      let lp = 0;
      let l = 0;
      put(d + 3, (k) => {
        const depth = Math.min(1, k / (SR * 0.9)) * 5 * CENT;
        const vib = 1 + depth * look(SINE, l);
        l = wrap(l + lfoInc);
        const s = look(S, p1) + look(S, p2);
        p1 = wrap(p1 + inc * lo * vib);
        p2 = wrap(p2 + inc * hi * vib);
        lp += a * (s - lp);
        return lp * env.next();
      });
      break;
    }
    case "organ":
    case "flute": {
      const flute = n.i === "flute";
      const env = new Env(v * (flute ? 0.2 : 0.17), flute ? 0.09 : 0.05, 0, d, flute ? 0.15 : 0.2);
      const T = tOrgan(f);
      const inc = f / SR;
      const lfoInc = 5.4 / SR;
      let p = 0;
      let l = 0;
      put(d + 0.8, (k) => {
        let r = inc;
        if (flute) {
          r *= 1 + Math.min(1, k / (SR * 0.7)) * 14 * CENT * look(SINE, l);
          l = wrap(l + lfoInc);
        }
        const s = look(T, p);
        p = wrap(p + r);
        return s * env.next();
      });
      break;
    }
    case "bass": {
      const env = new Env(v * 0.5, 0.006, 0.9, d, 0.08);
      const inc = f / SR;
      let p = 0;
      put(d + 0.6, () => {
        const s = look(SINE, p) + 0.12 * look(SINE, wrap(p * 2)) + 0.04 * look(SINE, wrap(p * 3));
        p = wrap(p + inc);
        return s * env.next();
      });
      break;
    }
    case "kick": {
      const env = new Env(v * 0.7, 0.002, 0.11, 0.3, 0.05);
      let p = 0;
      put(0.5, (k) => {
        const fr = 42 + 78 * Math.exp(-k / (0.06 * SR));
        p = wrap(p + fr / SR);
        return look(SINE, p) * env.next();
      });
      break;
    }
    case "snare":
    case "hat": {
      const hat = n.i === "hat";
      const env = new Env(v * (hat ? 0.12 : 0.22), 0.001, hat ? 0.02 : 0.05, hat ? 0.08 : 0.2, 0.03);
      // trống: lọc thông dải (Chamberlin, ổn định ở tần số thấp); hi-hat: lọc thông cao một cực
      const fc = 2 * Math.sin((Math.PI * 1900) / SR);
      const a = 1 - Math.exp((-2 * Math.PI * 6000) / SR);
      let low = 0;
      let band = 0;
      put(hat ? 0.12 : 0.3, () => {
        const x = Math.random() * 2 - 1;
        if (hat) {
          low += a * (x - low);
          return (x - low) * env.next();
        }
        low += fc * band;
        band += fc * (x - low - 1.25 * band);
        return band * env.next();
      });
      break;
    }
    default: {
      // dây gảy: guitar, đàn hạc, đàn tranh
      const pr = PLUCK[n.i] ?? PLUCK.guitar;
      const { buf, f0 } = pluckBuffer(c, f, pr.decay, pr.bright);
      const env = new Env(v * pr.gain, 0.001, 0, d + 1.2, 0.6);
      const base = f / f0;
      const bend = n.bend ?? 0;
      const lfoInc = 5.6 / SR;
      let pos = 0;
      let l = 0;
      const fadeLen = 0.4 * SR;
      put(d + 4, (k) => {
        let cents = 0;
        if (bend) {
          // luyến: nhấn dây từ nốt dưới lên nốt chính
          const tt = k / SR;
          cents -= bend * 100 * (tt < 0.06 ? 1 : Math.exp(-(tt - 0.06) / 0.07));
        }
        if (n.vib) {
          cents += Math.max(0, Math.min(1, (k / SR - 0.35) / 0.4)) * 22 * look(SINE, l);
          l = wrap(l + lfoInc);
        }
        const i = pos | 0;
        if (i + 1 >= buf.length) return 0;
        const s = buf[i] + (pos - i) * (buf[i + 1] - buf[i]);
        pos += cents ? base * Math.exp(cents * CENT) : base;
        // mờ dần ở cuối bộ đệm để không bị tiếng tách
        const tailGain = Math.min(1, (buf.length - pos) / fadeLen);
        return s * env.next() * tailGain;
      });
    }
  }
}

/* ---------------- hồi âm Freeverb ---------------- */
function reverb(dry: Float32Array, seconds: number, wet: number) {
  const scale = SR / 44100;
  const room = Math.min(0.95, Math.max(0.4, 0.5 + ((seconds - 1.5) / 2.5) * 0.45));
  const fb = 0.7 + 0.28 * room;
  const damp = 0.35;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((n) => ({ buf: new Float32Array(Math.floor(n * scale)), i: 0, store: 0 }));
  const aps = [556, 441, 341, 225].map((n) => ({ buf: new Float32Array(Math.floor(n * scale)), i: 0 }));
  const out = new Float32Array(dry.length);
  const dryGain = 1 - wet * 0.4;
  for (let s = 0; s < dry.length; s++) {
    const x = dry[s] * 0.015;
    let acc = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.store = y * (1 - damp) + c.store * damp;
      c.buf[c.i] = x + c.store * fb;
      if (++c.i >= c.buf.length) c.i = 0;
      acc += y;
    }
    for (const a of aps) {
      const b = a.buf[a.i];
      a.buf[a.i] = acc + b * 0.5;
      acc = b - acc;
      if (++a.i >= a.buf.length) a.i = 0;
    }
    out[s] = dry[s] * dryGain + acc * 1.5 * wet;
  }
  return out;
}

const yieldToPage = () => new Promise((r) => setTimeout(r, 0));

async function render(track: Track): Promise<Blob> {
  const spb = 60 / track.bpm;
  const swing = track.swing ?? 0;
  const at = (beat: number) => {
    // nhịp nhún (swing): đẩy móc đơn lệch về sau
    const whole = Math.floor(beat);
    const frac = beat - whole;
    return (whole + (Math.abs(frac - 0.5) < 1e-6 ? 0.5 + swing : frac)) * spb;
  };
  const notes = track.build();
  const end = Math.max(...notes.map((n) => n.t + n.d)) * spb;
  const tail = track.tail ?? 3.5;
  const total = end + tail;
  const c: Ctx = { out: new Float32Array(Math.ceil(total * SR)), plucks: new Map() };

  // chia nhỏ công việc để không làm khựng trang
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    const t = at(n.t);
    voice(c, n, t, Math.max(0.05, at(n.t + n.d) - t));
    if (i % 40 === 39) await yieldToPage();
  }
  await yieldToPage();
  const mix = reverb(c.out, track.reverb.seconds, track.reverb.wet);
  await yieldToPage();

  // nén mềm: chuẩn hoá theo mức gần đỉnh rồi bão hoà nhẹ để đoạn nhỏ vẫn nghe rõ
  const sample: number[] = [];
  for (let i = 0; i < mix.length; i += 16) sample.push(Math.abs(mix[i]));
  sample.sort((a, b) => a - b);
  const ref = sample[Math.floor(sample.length * 0.995)] || 1;
  const g = 0.75 / ref;
  const fadeFrom = Math.floor(Math.max(0, end - 0.5) * SR);
  const fadeLen = mix.length - fadeFrom;
  let pop = 0;
  let hiss = 0;
  for (let i = 0; i < mix.length; i++) {
    let y = Math.tanh(mix[i] * g) * 0.95;
    if (track.crackle) {
      // tiếng lạo xạo của đĩa than
      if (Math.random() < 0.0004) pop = (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.7);
      pop *= 0.82;
      hiss += 0.12 * (Math.random() * 2 - 1 - hiss);
      y += pop * 0.1 + hiss * 0.012;
    }
    if (i >= fadeFrom) y *= 1 - (i - fadeFrom) / fadeLen;
    mix[i] = y;
  }
  return wav(mix);
}

function wav(data: Float32Array) {
  const buf = new ArrayBuffer(44 + data.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + data.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, SR, true);
  v.setUint32(28, SR * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, data.length * 2, true);
  for (let i = 0; i < data.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i])) * 0x7fff, true);
  return new Blob([buf], { type: "audio/wav" });
}

const cache = new Map<string, Promise<string>>();

/** Dựng bài (một lần mỗi trang) và trả về URL blob để phát. */
export function getTrackUrl(id: string): Promise<string> {
  const hit = cache.get(id);
  if (hit) return hit;
  const track = getTrack(id);
  if (!track) return Promise.reject(new Error("Không tìm thấy bài nhạc"));
  const p = render(track).then((b) => URL.createObjectURL(b));
  p.catch(() => cache.delete(id));
  cache.set(id, p);
  return p;
}

/** File WAV im lặng rất ngắn — dùng để "mở khoá" thẻ audio trên iOS ngay trong lần chạm của khách. */
let silent = "";
export function silentUrl() {
  if (!silent) silent = URL.createObjectURL(wav(new Float32Array(SR / 20)));
  return silent;
}
