/**
 * Thư viện nhạc nền dựng sẵn. Mỗi bài là bản nhạc (nốt) — được tổng hợp thành âm thanh ngay trên
 * trình duyệt (xem synth.ts). Bản cổ điển đều là tác phẩm đã hết bản quyền; còn lại là bài tự soạn.
 */

export type Inst =
  | "piano"
  | "box"
  | "rhodes"
  | "pad"
  | "organ"
  | "flute"
  | "bass"
  | "guitar"
  | "harp"
  | "tranh"
  | "kick"
  | "snare"
  | "hat";

export type Note = {
  t: number; // phách bắt đầu
  d: number; // độ dài (phách)
  m: number; // MIDI
  i: Inst;
  v?: number;
  bend?: number; // luyến từ nốt thấp hơn (nửa cung)
  vib?: boolean; // rung
};

export type Track = {
  id: string;
  name: string;
  by: string;
  sound: string; // nhạc cụ, cảm giác
  bpm: number;
  swing?: number;
  reverb: { seconds: number; wet: number };
  tail?: number;
  crackle?: boolean;
  build: () => Note[];
};

/* ---------------- ký pháp ---------------- */

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "F#4" → 66 */
export function midi(name: string) {
  const m = name.match(/^([A-G])(#|b)?(-?\d)$/);
  if (!m) throw new Error(`Nốt không hợp lệ: ${name}`);
  return 12 * (Number(m[3]) + 1) + PC[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
}

/**
 * Đọc chuỗi giai điệu: "G4:1 A4:.5 R:1 /D5~:2"
 * R = lặng, tiền tố "/" = luyến từ nốt dưới lên, hậu tố "~" = rung.
 */
function line(i: Inst, start: number, src: string, v = 0.6, transpose = 0): { notes: Note[]; end: number } {
  let t = start;
  const notes: Note[] = [];
  for (const tok of src.trim().split(/\s+/)) {
    const [raw, dur] = tok.split(":");
    const d = Number(dur || 1);
    if (raw !== "R") {
      const bend = raw.startsWith("/") ? 2 : 0;
      const vib = raw.endsWith("~");
      const name = raw.replace(/^\//, "").replace(/~$/, "");
      notes.push({ t, d, m: midi(name) + transpose, i, v, bend: bend || undefined, vib: vib || undefined });
    }
    t += d;
  }
  return { notes, end: t };
}

const chord = (i: Inst, t: number, d: number, names: string[], v = 0.5, transpose = 0): Note[] =>
  names.map((n) => ({ t, d, m: midi(n) + transpose, i, v }));

const range = (n: number) => Array.from({ length: n }, (_, k) => k);

/* ---------------- 1. Canon in D — Pachelbel ---------------- */
function canon(): Note[] {
  // bass, gốc hợp âm để rải, có phải hợp âm thứ
  const prog: [string, string, boolean][] = [
    ["D2", "D3", false],
    ["A1", "A3", false],
    ["B1", "B3", true],
    ["F#1", "F#3", true],
    ["G1", "G3", false],
    ["D2", "D3", false],
    ["G1", "G3", false],
    ["A1", "A3", false],
  ];
  const A = "F#5:2 E5:2 D5:2 C#5:2 B4:2 A4:2 B4:2 C#5:2";
  const B = "D5:2 C#5:2 B4:2 A4:2 G4:2 F#4:2 G4:2 E4:2";
  const out: Note[] = [];
  const cycles = 5;
  for (const c of range(cycles)) {
    const base = c * 16;
    prog.forEach(([bass, root, minor], k) => {
      const t = base + k * 2;
      out.push({ t, d: 2, m: midi(bass) + 12, i: "bass", v: 0.5 });
      if (c >= 2) out.push({ t, d: 2, m: midi(bass) + 12, i: "pad", v: 0.6 });
      const r = midi(root);
      [r, r + 7, r + 12, r + 12 + (minor ? 3 : 4)].forEach((m, j) => out.push({ t: t + j * 0.5, d: 0.5, m, i: "harp", v: c === 0 ? 0.45 : 0.38 }));
    });
    if (c === 1) out.push(...line("box", base, A, 0.6).notes);
    if (c === 2) out.push(...line("box", base, B, 0.6).notes, ...line("pad", base, A, 0.55, -12).notes);
    if (c === 3) out.push(...line("box", base, A, 0.6, 12).notes, ...line("pad", base, B, 0.55, -12).notes);
    if (c === 4) out.push(...line("box", base, B, 0.55, 12).notes, ...line("pad", base, A, 0.6).notes);
  }
  const end = cycles * 16;
  out.push(...chord("pad", end, 6, ["D3", "A3", "F#4", "D5"], 0.55), ...chord("harp", end, 6, ["D3", "A3", "D4", "F#4"], 0.45));
  out.push({ t: end, d: 6, m: midi("D2"), i: "bass", v: 0.5 }, { t: end, d: 4, m: midi("D6"), i: "box", v: 0.4 });
  return out;
}

/* ---------------- 2. Bridal Chorus — Wagner ---------------- */
function bridal(): Note[] {
  const half1 = "C4:1 F4:.75 F4:.25 F4:2 C4:1 G4:.75 E4:.25 F4:2 C4:1 F4:.75 Bb4:.25 Bb4:1 A4:.75 G4:.25 F4:1 E4:.75 F4:.25 G4:2";
  const half2 = "C4:1 F4:.75 F4:.25 F4:2 C4:1 G4:.75 E4:.25 F4:2 C4:1 F4:.75 Bb4:.25 Bb4:1 A4:.75 G4:.25 F4:1 G4:.75 E4:.25 F4:2";
  // hợp âm theo nửa ô nhịp (2 phách)
  const harm = [
    ["F3", "A3", "C4"], ["F3", "A3", "C4"],
    ["E3", "G3", "C4"], ["F3", "A3", "C4"],
    ["F3", "A3", "C4"], ["F3", "Bb3", "D4"],
    ["E3", "G3", "C4"], ["E3", "G3", "C4"],
    ["F3", "A3", "C4"], ["F3", "A3", "C4"],
    ["E3", "G3", "C4"], ["F3", "A3", "C4"],
    ["F3", "A3", "C4"], ["F3", "Bb3", "D4"],
    ["E3", "G3", "Bb3"], ["F3", "A3", "C4"],
  ];
  const roots = ["F2", "F2", "C2", "F2", "F2", "Bb1", "C2", "C2", "F2", "F2", "C2", "F2", "F2", "Bb1", "C2", "F2"];
  const out: Note[] = [];
  const passes = 3;
  for (const p of range(passes)) {
    const base = p * 32;
    const melody = `${half1} ${half2}`;
    if (p === 0) out.push(...line("flute", base, melody, 0.7, 12).notes);
    if (p === 1) out.push(...line("organ", base, melody, 0.75, 12).notes, ...line("flute", base, melody, 0.4, 24).notes);
    if (p === 2) out.push(...line("box", base, melody, 0.6, 24).notes, ...line("flute", base, melody, 0.6, 12).notes);
    harm.forEach((h, k) => {
      const t = base + k * 2;
      out.push(...chord("pad", t, 2, h, p === 0 ? 0.55 : 0.7));
      if (p > 0) out.push({ t, d: 2, m: midi(roots[k]), i: "bass", v: 0.45 });
      if (p === 2) h.forEach((n, j) => out.push({ t: t + j * 0.5, d: 0.5, m: midi(n) + 12, i: "harp", v: 0.32 }));
    });
  }
  const end = passes * 32;
  out.push(...chord("pad", end, 5, ["F3", "A3", "C4", "F4"], 0.7), ...chord("flute", end, 4, ["F5"], 0.6), { t: end, d: 5, m: midi("F2"), i: "bass", v: 0.45 });
  return out;
}

/* ---------------- 3. Ode to Joy — Beethoven ---------------- */
function ode(): Note[] {
  const A = "E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:.5 D4:2";
  const A2 = "E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2";
  const B = "D4 D4 E4 C4 D4 E4:.5 F4:.5 E4 C4 D4 E4:.5 F4:.5 E4 D4 C4 D4 G3:2";
  const melody = `${A} ${A2} ${B} ${A2}`;
  // 1 hợp âm / 2 phách cho 16 ô nhịp
  const hA = "C C G G C C C G";
  const hA2 = "C C G G C C G C";
  const hB = "G C G C G G C G";
  const hc = `${hA} ${hA2} ${hB} ${hA2}`.split(" ");
  const tones: Record<string, string[]> = { C: ["C3", "G3", "E4", "G3"], G: ["G2", "D3", "B3", "D3"] };
  const T = 2; // lên Rê trưởng cho sáng
  const out: Note[] = [];
  for (const p of range(2)) {
    const base = p * 64;
    out.push(...line("piano", base, melody, p === 0 ? 0.7 : 0.75, 12 + T).notes);
    if (p === 1) out.push(...line("piano", base, melody, 0.45, T).notes, ...line("box", base, melody, 0.35, 24 + T).notes);
    hc.forEach((c, k) => {
      const t = base + k * 2;
      tones[c].forEach((n, j) => out.push({ t: t + j * 0.5, d: 0.5, m: midi(n) + T, i: "piano", v: 0.38 }));
      if (p === 1) out.push({ t, d: 2, m: midi(c === "C" ? "C2" : "G1") + T, i: "bass", v: 0.45 }, ...chord("pad", t, 2, c === "C" ? ["E3", "G3", "C4"] : ["D3", "G3", "B3"], 0.5, T));
    });
  }
  out.push(...chord("piano", 128, 4, ["C3", "G3", "C4", "E4", "G4", "C5"], 0.6, T), { t: 128, d: 4, m: midi("C2") + T, i: "bass", v: 0.45 });
  return out;
}

/* ---------------- 4. Gymnopédie No.1 — Satie ---------------- */
function gymnopedie(): Note[] {
  const out: Note[] = [];
  const bars = 26;
  for (const b of range(bars)) {
    const t = b * 3;
    const g = b % 2 === 0;
    out.push({ t, d: 3, m: midi(g ? "G2" : "D2"), i: "piano", v: 0.5 });
    out.push(...chord("piano", t + 1, 2, g ? ["B3", "D4", "F#4"] : ["A3", "C#4", "F#4"], 0.32));
  }
  const phrase = "R:1 F#5 A5 G5 F#5 C#5 B4 C#5 D5 A4:3";
  out.push(...line("piano", 12, `${phrase} F#4~:12`, 0.55).notes);
  out.push(...line("piano", 36, `${phrase} C#5:3 F#5:3 E5:6`, 0.55).notes);
  out.push(...line("pad", 36, "R:1 F#4:2 G4:1 F#4:1 C#4:1 B3:3 A3:3 C#4:3 F#4:3 E4:6", 0.4).notes);
  out.push(...chord("piano", bars * 3, 6, ["D2", "A3", "D4", "F#4", "A4"], 0.4));
  return out;
}

/* ---------------- 5. Hộp nhạc tình yêu (tự soạn) ---------------- */
function lullaby(): Note[] {
  const prog = ["G", "D", "Em", "C", "G", "D", "C", "D", "G", "D", "Em", "C", "G", "D", "C", "G"];
  const tones: Record<string, [string, string[]]> = {
    G: ["G3", ["B3", "D4"]],
    D: ["D3", ["F#3", "A3"]],
    Em: ["E3", ["G3", "B3"]],
    C: ["C3", ["E3", "G3"]],
  };
  const m1 = "D5 G5 B5 A5:2 F#5 G5 E5 B4 C5:2 E5 D5 B4 G4 A4 D5 F#5 E5:1.5 D5:.5 C5 A4:3";
  const m2 = "D5 G5 B5 A5:2 F#5 G5 E5 B4 C5:2 E5 D5 B4 G4 A4 D5 F#5 E5 C5 A4 G4:3";
  const out: Note[] = [];
  for (const p of range(2)) {
    const base = p * 48;
    prog.forEach((c, k) => {
      const t = base + k * 3;
      const [root, up] = tones[c];
      out.push({ t, d: 1, m: midi(root) + 12, i: "box", v: 0.5 });
      up.forEach((n) => out.push({ t: t + 1, d: 1, m: midi(n) + 12, i: "box", v: 0.35 }, { t: t + 2, d: 1, m: midi(n) + 12, i: "box", v: 0.32 }));
      if (p === 1) out.push({ t, d: 3, m: midi(root), i: "pad", v: 0.5 }, { t, d: 3, m: midi(up[1]), i: "pad", v: 0.4 });
    });
    out.push(...line("box", base, `${m1} ${m2}`, 0.62).notes);
    if (p === 1) out.push(...line("harp", base + 24, m2, 0.4, -12).notes);
  }
  out.push(...chord("box", 96, 6, ["G4", "B4", "D5", "G5"], 0.5), ...chord("pad", 96, 6, ["G3", "D4", "B4"], 0.5));
  return out;
}

/* ---------------- 6. Đàn tranh ngũ cung (tự soạn) ---------------- */
function tranh(): Note[] {
  const gliss = "E6:.125 D6:.125 C6:.125 A5:.125 G5:.125 E5:.125 D5:.125 C5:.125 A4:.125 G4:.125";
  const p1 = "G4:1 A4:.5 C5:.5 /D5~:2 E5:1 D5:.5 C5:.5 A4~:2 C5:1 A4:.5 G4:.5 E4:1 G4:1 A4~:4";
  const p2 = "D5:1 E5:.5 G5:.5 /A5~:2 G5:1 E5:.5 D5:.5 E5~:2 D5:1 C5:.5 A4:.5 C5:1 D5:1 G4~:4";
  const out: Note[] = [];
  let t = 0;
  for (const pass of range(2)) {
    const g = line("tranh", t, gliss, 0.4);
    out.push(...g.notes);
    t = g.end;
    const a = line("tranh", t, p1, 0.7);
    const b = line("tranh", a.end, p2, 0.7);
    out.push(...a.notes, ...b.notes);
    // tiếng đáp ở quãng tám dưới, rất nhẹ
    out.push(...line("tranh", t + 12.5, "R:.5 A3~:3", 0.35).notes, ...line("tranh", a.end + 12.5, "R:.5 G3~:3", 0.35).notes);
    if (pass === 1) out.push(...line("flute", a.end, p2.replace(/\//g, ""), 0.45, 12).notes);
    t = b.end;
  }
  const last = line("tranh", t, `${gliss} G4~:6`, 0.55);
  out.push(...last.notes);
  // tiếng trầm nền giữ suốt bài
  for (let s = 0; s < last.end; s += 8) out.push({ t: s, d: 8, m: midi("G2"), i: "pad", v: 0.4 }, { t: s, d: 8, m: midi("D3"), i: "pad", v: 0.3 });
  return out;
}

/* ---------------- 7. Đĩa than chiều thu (tự soạn) ---------------- */
function lofi(): Note[] {
  const chords: [string, string[]][] = [
    ["F2", ["F3", "A3", "C4", "E4"]],
    ["E2", ["E3", "G3", "B3", "D4"]],
    ["D2", ["D3", "F3", "A3", "C4"]],
    ["C2", ["C3", "E3", "G3", "B3", "D4"]],
  ];
  const mel1 = "E5:1 C5:.5 A4:1.5 R:1 G4:.5 B4:.5 D5:2 R:1 C5:1 A4:1 F4:1 R:1 E4:2 G4:1.5 R:.5";
  const mel2 = "A5:1 G5:.5 E5:1.5 R:1 D5:.5 E5:.5 G5:2 R:1 F5:1 E5:.5 C5:1.5 R:1 B4:2 C5:1 D5:1";
  const out: Note[] = [];
  const bars = 24;
  for (const b of range(bars)) {
    const t = b * 4;
    const [bass, voicing] = chords[b % 4];
    out.push(...chord("rhodes", t, 1.5, voicing, 0.5), ...chord("rhodes", t + 2.5, 1.5, voicing, 0.4));
    if (b >= 4) {
      out.push({ t, d: 1.5, m: midi(bass), i: "bass", v: 0.6 }, { t: t + 2.5, d: 1, m: midi(bass) + 7, i: "bass", v: 0.45 });
      out.push({ t, d: 0.3, m: 36, i: "kick", v: 0.6 }, { t: t + 2.5, d: 0.3, m: 36, i: "kick", v: 0.45 });
      out.push({ t: t + 1, d: 0.2, m: 38, i: "snare", v: 0.5 }, { t: t + 3, d: 0.2, m: 38, i: "snare", v: 0.5 });
      range(8).forEach((h) => out.push({ t: t + h * 0.5, d: 0.1, m: 42, i: "hat", v: h % 2 ? 0.35 : 0.5 }));
    }
  }
  out.push(...line("box", 32, `${mel1} ${mel1}`, 0.5).notes);
  out.push(...line("box", 64, `${mel2} ${mel1}`, 0.5).notes);
  out.push(...chord("rhodes", 96, 4, ["F3", "A3", "C4", "E4", "G4"], 0.5), { t: 96, d: 4, m: midi("F2"), i: "bass", v: 0.55 });
  return out;
}

/* ---------------- 8. Guitar mộc (tự soạn) ---------------- */
function guitar(): Note[] {
  const prog: [string, string, string[]][] = [
    ["C3", "G2", ["G3", "C4", "E4"]],
    ["B2", "G2", ["G3", "B3", "D4"]],
    ["A2", "E3", ["A3", "C4", "E4"]],
    ["F2", "C3", ["A3", "C4", "F4"]],
    ["C3", "G2", ["G3", "C4", "E4"]],
    ["G2", "D3", ["G3", "B3", "D4"]],
    ["F2", "C3", ["A3", "C4", "F4"]],
    ["G2", "D3", ["G3", "B3", "F4"]],
  ];
  const mel = "G4 C5 E5:2 D5 B4 G4:2 A4 C5 E5:1.5 D5:.5 C5:2 A4:2 G4 C5 E5 G5 F5 D5 B4:2 A4 C5 F5 E5 D5:4";
  const out: Note[] = [];
  for (const p of range(3)) {
    const base = p * 32;
    prog.forEach(([b1, b2, [t1, t2, t3]], k) => {
      const t = base + k * 4;
      [b1, t1, t3, t2, b2, t1, t3, t2].forEach((n, j) => out.push({ t: t + j * 0.5, d: j % 4 === 0 ? 2 : 1, m: midi(n), i: "guitar", v: j % 4 === 0 ? 0.6 : 0.42 }));
      if (p === 2) out.push(...chord("pad", t, 4, [b1, t2], 0.4));
    });
    if (p >= 1) out.push(...line("guitar", base, mel, 0.75).notes);
    if (p === 2) out.push(...line("flute", base, mel, 0.3, 12).notes);
  }
  out.push(...[["C3", 0], ["G3", 0.15], ["C4", 0.3], ["E4", 0.45], ["G4", 0.6], ["C5", 0.75]].map(([n, o]) => ({ t: 96 + (o as number), d: 4, m: midi(n as string), i: "guitar" as Inst, v: 0.55 })));
  return out;
}

export const TRACKS: Track[] = [
  { id: "canon", name: "Canon in D", by: "Pachelbel", sound: "Đàn hạc & hộp nhạc · trang trọng", bpm: 70, reverb: { seconds: 3.2, wet: 0.45 }, build: canon },
  { id: "bridal", name: "Bridal Chorus", by: "Wagner", sound: "Sáo & dàn dây · khúc cô dâu tiến vào", bpm: 72, reverb: { seconds: 3.6, wet: 0.5 }, build: bridal },
  { id: "ode", name: "Ode to Joy", by: "Beethoven", sound: "Piano · vui tươi, rạng rỡ", bpm: 104, reverb: { seconds: 2.2, wet: 0.3 }, build: ode },
  { id: "gymnopedie", name: "Gymnopédie No.1", by: "Satie", sound: "Piano chậm · tĩnh lặng, sâu lắng", bpm: 70, reverb: { seconds: 3.8, wet: 0.5 }, tail: 4.5, build: gymnopedie },
  { id: "lullaby", name: "Hộp nhạc tình yêu", by: "Bài soạn riêng", sound: "Hộp nhạc · ngọt ngào, nhẹ nhàng", bpm: 96, reverb: { seconds: 2.6, wet: 0.4 }, build: lullaby },
  { id: "tranh", name: "Đàn tranh ngũ cung", by: "Bài soạn riêng", sound: "Đàn tranh & sáo · âm hưởng Việt", bpm: 66, reverb: { seconds: 3.4, wet: 0.45 }, tail: 4.5, build: tranh },
  { id: "lofi", name: "Đĩa than chiều thu", by: "Bài soạn riêng", sound: "Piano điện · lofi, tiếng đĩa than", bpm: 78, swing: 0.08, reverb: { seconds: 1.8, wet: 0.25 }, crackle: true, build: lofi },
  { id: "guitar", name: "Guitar mộc", by: "Bài soạn riêng", sound: "Guitar gảy ngón · mộc mạc, ấm áp", bpm: 84, reverb: { seconds: 2.2, wet: 0.3 }, build: guitar },
];

export const getTrack = (id: string) => TRACKS.find((t) => t.id === id);

/** Bài gợi ý cho từng mẫu thiệp. */
const BY_TEMPLATE: Record<string, string> = {
  "classic-ivory": "canon",
  "song-hy": "tranh",
  "minimal-mono": "gymnopedie",
  "garden-sage": "guitar",
  "starry-night": "lullaby",
  "blush-pastel": "lullaby",
  "vintage-postcard": "lofi",
  "lotus-hue": "tranh",
  "ocean-breeze": "guitar",
  "emerald-deco": "bridal",
  "polaroid-fun": "ode",
  "noir-gold": "gymnopedie",
  "magazine-cover": "ode",
  "peach-blossom": "tranh",
  "watercolor-lilac": "lullaby",
  "marble-luxe": "canon",
  "burgundy-velvet": "bridal",
  "royal-crest": "bridal",
  "rose-gold": "canon",
  "terracotta-arch": "guitar",
  "citrus-bento": "ode",
  "cobalt-type": "lofi",
  "mint-boarding": "ode",
  "kraft-scrapbook": "guitar",
  "love-letter": "lullaby",
  "wildflower-herbarium": "guitar",
  "retro-vinyl": "lofi",
  "ink-wash": "tranh",
  "full-moon": "gymnopedie",
  "linen-offset": "gymnopedie",
};

export const templateTrackId = (templateId: string) => BY_TEMPLATE[templateId] ?? "canon";

export type MusicSource = { track: string } | { url: string; start: number };

/** Nguồn nhạc thực tế của thiệp, hoặc null nếu tắt nhạc. */
export function resolveMusic(data: { music: string; musicUrl: string; musicStart: number }, templateId: string): MusicSource | null {
  if (data.music === "off") return null;
  if (data.music === "file") return data.musicUrl ? { url: data.musicUrl, start: data.musicStart } : null;
  return { track: getTrack(data.music) ? data.music : templateTrackId(templateId) };
}
