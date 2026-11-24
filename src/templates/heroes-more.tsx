"use client";

// 15 phần mở đầu cho các mẫu thuộc hệ Dạ tiệc, Bento, Sổ tay và Thiền.

import { useEffect, useState, type CSSProperties } from "react";
import { initials, type InvitationData } from "@/lib/invitation";
import type { TemplateDef } from "./registry";
import { Icon } from "./icons";
import { formatDate, Img } from "./parts";
import { Barcode, Cue, Guest, KenBurns, names } from "./heroes-new";

type Props = { tpl: TemplateDef; data: InvitationData; guestName?: string };
const d = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });
const H = "min-h-[var(--hero-h,100svh)]";

function roman(n: number) {
  const r: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of r) while (n >= v) (out += s), (n -= v);
  return out;
}

function useDaysLeft(target: string) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    const t = new Date(target).getTime();
    if (!Number.isNaN(t)) setDays(Math.max(0, Math.ceil((t - Date.now()) / 86400000)));
  }, [target]);
  return days;
}

/* ================= DẠ TIỆC ================= */

/** Cẩm thạch: nền đá vân, chữ lồng ánh nhũ vàng, ảnh trong khung oval viền đôi. */
export function MarbleHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const mono = initials(g, b);
  return (
    <header
      className={`relative flex ${H} flex-col items-center justify-center overflow-hidden px-6 py-16 text-center text-[var(--hero-text)]`}
      style={{
        background:
          "linear-gradient(118deg, transparent 38%, rgba(150,140,128,.22) 39%, transparent 41.5%), linear-gradient(32deg, transparent 62%, rgba(150,140,128,.18) 63%, transparent 64.5%), linear-gradient(160deg, transparent 20%, rgba(170,160,150,.14) 21%, transparent 22%), radial-gradient(120% 90% at 25% 20%, #ffffff, var(--hero-bg) 55%, color-mix(in srgb, var(--hero-bg) 85%, #a8a096))",
      }}
    >
      <p className="tpl-heading tpl-foil tpl-rise text-[26cqw] leading-none @3xl:text-[11rem]" aria-hidden>
        {mono[0]}
        <span className="mx-[0.08em] text-[0.45em] align-middle">&</span>
        {mono[1]}
      </p>
      <div className="tpl-rise relative -mt-[8cqw] w-[54%] max-w-[300px] @3xl:-mt-16" style={d(300)}>
        <div className="absolute -inset-2.5 rounded-[50%] border border-[var(--primary)]" aria-hidden />
        <div className="absolute -inset-5 rounded-[50%] border border-[var(--primary)]/40" aria-hidden />
        <KenBurns src={data.coverPhoto} position={data.photoPos.cover} className="aspect-[3/4] rounded-[50%] shadow-[0_30px_60px_-30px_rgba(0,0,0,.45)]" />
      </div>
      <p className="tpl-rise mt-12 text-[10px] uppercase tracking-[0.6em] text-[var(--primary)]" style={d(600)}>
        {data.headline}
      </p>
      <h1 className="tpl-heading tpl-rise mt-4 text-4xl uppercase tracking-[0.18em] @3xl:text-6xl" style={d(750)}>
        {g} <span className="tpl-script normal-case tracking-normal text-[var(--primary)]">và</span> {b}
      </h1>
      {date && (
        <p className="tpl-rise mt-5 text-sm tracking-[0.4em]" style={d(900)}>
          {date.short}
        </p>
      )}
      <Guest guestName={guestName} />
      <div className="mt-10">
        <Cue />
      </div>
    </header>
  );
}

/** Nhung đỏ rượu: hai cánh màn nhung kéo mở, lộ ảnh cưới phía sau. */
export function VelvetHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const velvet = (flip: boolean): CSSProperties => ({
    background: `repeating-linear-gradient(90deg, #4a0a18 0 6%, #7d1a2e 9%, #5e1121 12%, #4a0a18 14%), linear-gradient(${flip ? 270 : 90}deg, rgba(0,0,0,.55), transparent 40%)`,
    backgroundBlendMode: "multiply",
    boxShadow: flip ? "inset 30px 0 40px -20px rgba(0,0,0,.6)" : "inset -30px 0 40px -20px rgba(0,0,0,.6)",
  });
  return (
    <header className={`relative flex ${H} items-end justify-center overflow-hidden bg-[var(--hero-bg)] text-center text-[var(--hero-text)]`}>
      <KenBurns src={data.coverPhoto} position={data.photoPos.cover} className="absolute inset-0" />
      <div className="absolute inset-0 bg-[#6b1426]/45 mix-blend-multiply" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-[#14080c] via-[#14080c]/40 to-transparent" aria-hidden />
      <div className="relative px-6 pb-16 pt-40">
        <p className="tpl-rise text-[10px] uppercase tracking-[0.6em] text-[var(--primary)]" style={d(1800)}>
          {data.headline}
        </p>
        <h1 className="tpl-heading tpl-rise mt-5 text-5xl leading-[1] @3xl:text-8xl" style={d(2000)}>
          <span className="block">{g}</span>
          <span className="tpl-script block text-4xl text-[var(--primary)] @3xl:text-6xl">&</span>
          <span className="block">{b}</span>
        </h1>
        {date && (
          <p className="tpl-rise mt-6 text-sm uppercase tracking-[0.45em]" style={d(2200)}>
            {date.weekday} · {date.day}.{date.month}.{date.year}
          </p>
        )}
        <Guest guestName={guestName} />
        <div className="mt-10">
          <Cue />
        </div>
      </div>
      {/* màn nhung */}
      <div className="tpl-curtain-l pointer-events-none absolute inset-y-0 left-0 z-20 w-1/2" style={velvet(false)} aria-hidden />
      <div className="tpl-curtain-r pointer-events-none absolute inset-y-0 right-0 z-20 w-1/2" style={velvet(true)} aria-hidden />
      {/* diềm màn */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 h-16"
        style={{
          background: "radial-gradient(circle at 50% 0, #6a1325 70%, transparent 71%) 0 0 / 64px 64px repeat-x, linear-gradient(#4a0a18, #6a1325)",
          backgroundSize: "64px 64px, 100% 34px",
          backgroundRepeat: "repeat-x, no-repeat",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 top-[34px] z-30 h-px bg-[var(--primary)]/70" aria-hidden />
    </header>
  );
}

function Laurel({ className }: { className: string }) {
  const leaves = Array.from({ length: 9 }, (_, i) => i);
  const side = (flip: boolean) => (
    <g transform={flip ? "translate(200 0) scale(-1 1)" : undefined}>
      <path d="M100 186C52 180 22 140 22 92S44 20 70 10" stroke="currentColor" strokeWidth="1.6" fill="none" />
      {leaves.map((i) => {
        const t = i / 8;
        const a = Math.PI * (0.55 + t * 0.85);
        const x = Math.round((100 + Math.cos(a) * 82 * (1 - t * 0.12)) * 10) / 10;
        const y = Math.round((94 - Math.sin(a) * -86) * 10) / 10;
        return <ellipse key={i} cx={x} cy={y} rx="5" ry="13" fill="currentColor" transform={`rotate(${-20 + t * -100} ${x} ${y})`} opacity=".9" />;
      })}
    </g>
  );
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      {side(false)}
      {side(true)}
    </svg>
  );
}

/** Hoàng gia: vòng nguyệt quế quanh chữ lồng, ngày cưới viết số La Mã. */
export function CrestHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const mono = initials(g, b);
  return (
    <header className={`relative flex ${H} flex-col items-center justify-center overflow-hidden bg-[var(--hero-bg)] px-6 py-16 text-center text-[var(--hero-text)]`}>
      <KenBurns src={data.coverPhoto} position={data.photoPos.cover} className="absolute inset-0 opacity-30 [filter:grayscale(.6)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,var(--hero-bg)_75%)]" aria-hidden />
      <div className="relative">
        <div className="tpl-rise relative mx-auto h-56 w-56 text-[#cdb37a] @3xl:h-72 @3xl:w-72">
          <Laurel className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] uppercase tracking-[0.5em]">Est. {date?.year}</span>
            <span className="tpl-heading mt-1 text-6xl @3xl:text-7xl">
              {mono[0]}
              <span className="text-3xl">·</span>
              {mono[1]}
            </span>
          </div>
        </div>
        <h1 className="tpl-heading tpl-rise mt-8 text-3xl uppercase tracking-[0.3em] @3xl:text-5xl" style={d(400)}>
          {g}
          <span className="my-3 block text-xs tracking-[0.6em] text-[#cdb37a]">cùng</span>
          {b}
        </h1>
        {date && (
          <p className="tpl-rise mt-8 text-sm tracking-[0.5em] text-[#cdb37a]" style={d(700)}>
            {roman(Number(date.day))} · {roman(Number(date.month))} · {roman(Number(date.year))}
          </p>
        )}
        <Guest guestName={guestName} />
        <div className="mt-12">
          <Cue />
        </div>
      </div>
    </header>
  );
}

/** Vàng hồng: khung lục giác tự vẽ nét, ảnh cắt theo hình lục giác. */
export function GeoHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const hex = "50,2 95,26 95,74 50,98 5,74 5,26";
  return (
    <header className={`relative flex ${H} flex-col items-center justify-center overflow-hidden bg-[var(--hero-bg)] px-6 py-16 text-center text-[var(--hero-text)]`}>
      <p className="tpl-script tpl-rise text-4xl text-[var(--primary)]">{data.headline}</p>
      <div className="relative mt-6 w-[72%] max-w-[360px]">
        <svg viewBox="-4 -4 108 108" className="absolute -inset-[9%] h-[118%] w-[118%] text-[var(--primary)]" fill="none" aria-hidden>
          <polygon points={hex} stroke="currentColor" strokeWidth=".5" className="tpl-draw" style={{ ["--len" as string]: 300 }} />
          <polygon points="50,-3 100,24 100,76 50,103 0,76 0,24" stroke="currentColor" strokeWidth=".25" className="tpl-draw" style={{ ["--len" as string]: 320, animationDelay: "400ms" }} />
          <path d="M50 -3V8M50 92v11M0 24l9 5M100 24l-9 5M0 76l9-5M100 76l-9-5" stroke="currentColor" strokeWidth=".4" />
        </svg>
        <div style={{ clipPath: "polygon(50% 2%, 95% 26%, 95% 74%, 50% 98%, 5% 74%, 5% 26%)" }}>
          <KenBurns src={data.coverPhoto} position={data.photoPos.cover} className="aspect-square w-full" />
        </div>
      </div>
      <h1 className="tpl-heading tpl-rise mt-12 text-5xl leading-tight @3xl:text-7xl" style={d(800)}>
        <span className="block">{g}</span>
        <span className="mx-auto my-3 block h-2.5 w-2.5 rotate-45 border border-[var(--primary)]" aria-hidden />
        <span className="block">{b}</span>
      </h1>
      {date && (
        <p className="tpl-rise mt-4 text-sm uppercase tracking-[0.4em] text-[var(--muted)]" style={d(1000)}>
          {date.weekday} · {date.short}
        </p>
      )}
      <Guest guestName={guestName} />
      <div className="mt-10">
        <Cue />
      </div>
    </header>
  );
}

/* ================= BENTO ================= */

/** Ba ô vòm nối liền một bức ảnh, tên lớn bên dưới. */
export function TriptychHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
    return (
    <header className={`relative flex ${H} flex-col justify-between overflow-hidden bg-[var(--hero-bg)] px-5 pb-10 pt-8 text-[var(--hero-text)] @3xl:px-12`}>
      <div className="tpl-rise flex items-center justify-between text-xs font-medium">
        <span>{data.headline}</span>
        <span className="tabular-nums">{date?.short}</span>
      </div>
      <div className="my-auto grid grid-cols-3 gap-2 py-8 [--g:0.5rem] @3xl:gap-4 @3xl:[--g:1rem]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`tpl-rise relative aspect-[1/2.1] overflow-hidden rounded-t-full bg-[var(--accent)] @3xl:aspect-[1/1.6] ${i === 1 ? "-translate-y-6" : ""}`}
            style={d(200 + i * 180)}
          >
            <Img
              src={data.coverPhoto}
              alt={i === 1 ? "Ảnh cưới của cô dâu và chú rể" : ""}
              eager
              position={data.photoPos.cover}
              className="absolute top-0 h-full max-w-none"
              style={{ width: "calc(300% + 2 * var(--g))", left: `calc(${-i} * (100% + var(--g)))` }}
            />
          </div>
        ))}
      </div>
      <div>
        <h1 className="tpl-heading tpl-rise text-[15cqw] font-extrabold leading-[0.85] tracking-tight @3xl:text-[9rem]" style={d(800)}>
          {g}
          <span className="tpl-script block text-right text-[0.5em] font-normal italic text-[var(--primary)]">& {b}</span>
        </h1>
        <div className="mt-6 flex items-end justify-between gap-4">
          <Guest guestName={guestName} className="!mt-0" />
          <span className="tpl-rise ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--on-primary)]" style={d(1400)} aria-hidden>
            <Icon name="down" size={20} className="tpl-cue" />
          </span>
        </div>
      </div>
    </header>
  );
}

/** Lưới bento: ảnh, tên, ngày, số ngày còn lại, địa điểm. */
export function BentoHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const days = useDaysLeft(data.weddingDate);
  const ev = data.events.find((e) => e.venue);
  const t = "tpl-rise rounded-[1.75rem] p-5";
  return (
    <header className={`relative ${H} bg-[var(--hero-bg)] p-3 text-[var(--hero-text)] @3xl:p-5`}>
      <div className="grid h-full min-h-[calc(var(--hero-h,100svh)-1.5rem)] grid-cols-2 grid-rows-[1fr_auto_auto_auto] gap-3 @3xl:min-h-[calc(var(--hero-h,100svh)-2.5rem)] @3xl:grid-cols-4 @3xl:grid-rows-[1fr_1fr]">
        <div className="tpl-rise col-span-2 overflow-hidden rounded-[1.75rem] @3xl:row-span-2">
          <KenBurns src={data.coverPhoto} position={data.photoPos.cover} className="h-full min-h-[44svh] w-full" />
        </div>
        <div className={`${t} col-span-2 flex flex-col justify-between bg-[var(--primary)] text-[var(--on-primary)]`} style={d(150)}>
          <p className="text-xs font-semibold">{data.headline}</p>
          <h1 className="tpl-heading mt-6 text-5xl font-bold leading-[0.9] tracking-tight @3xl:text-6xl">
            {g}
            <br />& {b}
          </h1>
        </div>
        <div className={`${t} bg-[var(--surface)]`} style={d(300)}>
          <p className="text-xs text-[var(--muted)]">{date?.weekday ?? "Ngày cưới"}</p>
          <p className="tpl-heading mt-2 text-4xl font-bold tabular-nums">
            {date ? `${date.day}.${date.month}` : "--.--"}
          </p>
          <p className="text-sm text-[var(--muted)]">{date?.year}</p>
        </div>
        <div className={`${t} bg-[var(--text)] text-[var(--bg)]`} style={d(400)}>
          <p className="text-xs opacity-70">Còn</p>
          <p className="tpl-heading mt-2 text-4xl font-bold tabular-nums">{days ?? "…"}</p>
          <p className="text-sm opacity-70">ngày nữa</p>
        </div>
        <div className={`${t} col-span-2 flex items-center justify-between gap-4 bg-[var(--surface)]`} style={d(500)}>
          <div className="min-w-0">
            <p className="text-xs text-[var(--muted)]">{guestName ? "Thân mời" : "Địa điểm"}</p>
            <p className="tpl-heading truncate text-xl font-bold">{guestName || ev?.venue || "Sẽ cập nhật sớm"}</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]" aria-hidden>
            <Icon name="down" size={18} className="tpl-cue" />
          </span>
        </div>
      </div>
    </header>
  );
}

/** Chữ khổng lồ in lồng ảnh cưới bên trong nét chữ. */
export function TypeHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const fill: CSSProperties = data.coverPhoto
    ? {
        backgroundImage: `url("${data.coverPhoto}")`,
        backgroundSize: "cover",
        backgroundPosition: data.photoPos.cover,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        backgroundAttachment: "local",
      }
    : {};
  return (
    <header className={`relative flex ${H} flex-col justify-between overflow-hidden bg-[var(--hero-bg)] px-5 py-8 text-[var(--hero-text)] @3xl:px-12`}>
      <div className="tpl-rise flex justify-between text-[11px] font-semibold uppercase tracking-[0.25em]">
        <span>{data.headline}</span>
        <span>{date ? `${date.day}/${date.month}/${date.year}` : ""}</span>
      </div>
      <h1 className="tpl-heading my-auto break-words py-10 font-black uppercase leading-[1.08] tracking-tighter">
        <span className="tpl-rise block text-[23cqw] @3xl:text-[15rem]" style={{ ...fill, ...d(150) }}>
          {g}
        </span>
        <span className="tpl-rise block text-right text-[9cqw] font-normal normal-case tracking-normal @3xl:text-7xl" style={d(350)}>
          <span className="tpl-script">và</span>
        </span>
        <span className="tpl-rise block text-right text-[23cqw] @3xl:text-[15rem]" style={{ ...fill, ...d(500) }}>
          {b}
        </span>
      </h1>
      <div className="flex items-end justify-between gap-4">
        <Guest guestName={guestName} className="!mt-0" />
        <div className="ml-auto">
          <Cue />
        </div>
      </div>
    </header>
  );
}

/** Thẻ lên máy bay: chuyến bay hạnh phúc từ chú rể tới cô dâu. */
export function BoardingHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const code = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/gi, "D")
      .replace(/[^a-z]/gi, "")
      .slice(0, 3)
      .toUpperCase()
      .padEnd(3, "X");
  const ev = data.events.find((e) => e.venue);
  return (
    <header className={`relative flex ${H} flex-col items-center justify-center overflow-hidden bg-[var(--hero-bg)] px-4 py-12 text-[var(--hero-text)]`}>
      <p className="tpl-rise text-xs font-semibold uppercase tracking-[0.35em] text-[var(--primary)]">{data.headline}</p>
      <div className="tpl-rise mt-6 w-full max-w-md overflow-hidden rounded-[1.75rem] bg-[var(--surface)] shadow-[0_40px_80px_-40px_rgba(0,0,0,.45)]" style={d(200)}>
        <KenBurns src={data.coverPhoto} position={data.photoPos.cover} className="aspect-[16/10] w-full" />
        <div className="p-6">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
            <span>Boarding pass</span>
            <span>Chuyến bay {date?.year ?? ""}</span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="tpl-heading text-5xl font-bold leading-none">{code(g)}</p>
              <p className="mt-1 text-sm">{g}</p>
            </div>
            <div className="flex flex-1 items-center gap-2 text-[var(--primary)]" aria-hidden>
              <span className="h-px flex-1 border-t-2 border-dashed border-current/50" />
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" transform="rotate(90 12 12)" />
              </svg>
              <span className="h-px flex-1 border-t-2 border-dashed border-current/50" />
            </div>
            <div className="text-right">
              <p className="tpl-heading text-5xl font-bold leading-none">{code(b)}</p>
              <p className="mt-1 text-sm">{b}</p>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
            {[
              ["Ngày", date ? `${date.day}.${date.month}` : "--"],
              ["Cất cánh", date?.time ?? "--:--"],
              ["Cổng", "Hạnh phúc"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative border-t-2 border-dashed border-[var(--bg)] px-6 py-5">
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[var(--hero-bg)]" aria-hidden />
          <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-[var(--hero-bg)]" aria-hidden />
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Hành khách</p>
              <p className="tpl-heading truncate text-lg font-bold">{guestName || "Khách quý của chúng mình"}</p>
              {ev?.venue && <p className="truncate text-xs text-[var(--muted)]">Điểm đến: {ev.venue}</p>}
            </div>
            <Barcode />
          </div>
        </div>
      </div>
      <div className="mt-10">
        <Cue />
      </div>
    </header>
  );
}

/* ================= SỔ TAY ================= */

function TapeStrip({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <span
      className={`absolute z-10 h-7 w-24 opacity-85 ${className}`}
      style={{ background: "color-mix(in srgb, var(--accent) 80%, white)", clipPath: "polygon(3% 0,97% 8%,100% 92%,0 100%)", ...style }}
      aria-hidden
    />
  );
}

/** Trang sổ dán ảnh: giấy kraft, băng keo, chữ viết tay, sticker. */
export function ScrapbookHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const small = [data.gallery[0], data.gallery[3]].filter(Boolean);
  return (
    <header
      className={`relative ${H} overflow-hidden px-5 pb-14 pt-12 text-center text-[var(--hero-text)]`}
      style={{
        background:
          "radial-gradient(circle at 20% 10%, rgba(255,255,255,.35), transparent 40%), repeating-radial-gradient(circle at 30% 40%, rgba(90,60,30,.05) 0 1px, transparent 1px 4px), var(--hero-bg)",
      }}
    >
      <p className="tpl-script tpl-rise text-3xl text-[var(--primary)]">{data.headline}!</p>
      <div className="relative mx-auto mt-8 h-[min(120cqw,560px)] w-full max-w-[460px]">
        <div className="tpl-rise absolute left-[8%] top-0 w-[70%] -rotate-3 bg-white p-3 pb-10 shadow-[0_20px_40px_-20px_rgba(0,0,0,.45)]" style={d(150)}>
          <TapeStrip className="-top-3 left-1/2 -translate-x-1/2 rotate-[-3deg]" />
          <KenBurns src={data.coverPhoto} position={data.photoPos.cover} className="aspect-[4/5] w-full" />
          <p className="tpl-script absolute inset-x-0 bottom-2 text-center text-xl text-[#6b5a48]">ngày đẹp nhất</p>
        </div>
        {small.map((src, i) => (
          <div
            key={src}
            className={`tpl-rise absolute w-[38%] bg-white p-2 pb-6 shadow-[0_14px_30px_-14px_rgba(0,0,0,.45)] ${i ? "bottom-0 left-0 -rotate-6" : "right-0 top-[38%] rotate-6"}`}
            style={d(400 + i * 200)}
          >
            <TapeStrip className={`!w-14 ${i ? "-right-4 -top-2 rotate-[35deg]" : "-left-4 -top-2 rotate-[-35deg]"}`} />
            <Img src={src} alt="" className="aspect-square w-full" />
          </div>
        ))}
        <svg viewBox="0 0 60 56" className="tpl-rise absolute bottom-[14%] right-[6%] w-16 rotate-12 text-[var(--primary)]" style={d(900)} aria-hidden>
          <path d="M30 52C12 40 3 30 3 18a13 13 0 0 1 27-6 13 13 0 0 1 27 6c0 12-9 22-27 34z" fill="currentColor" />
        </svg>
      </div>
      <h1 className="tpl-heading tpl-rise relative mt-8 text-5xl leading-tight @3xl:text-6xl" style={d(1000)}>
        {g} <span className="text-[var(--primary)]">♥</span> {b}
      </h1>
      {date && (
        <p className="tpl-rise mt-2 text-xl" style={d(1100)}>
          {date.weekday}, {date.day}/{date.month}/{date.year} — nhớ đến nha!
        </p>
      )}
      <Guest guestName={guestName} />
      <div className="mt-8">
        <Cue />
      </div>
    </header>
  );
}

/** Thư tay: nắp phong bì mở ra, lá thư có ảnh cưới trượt lên. */
export function EnvelopeHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header className={`relative flex ${H} flex-col items-center justify-end overflow-hidden bg-[var(--hero-bg)] px-5 pb-12 pt-10 text-center text-[var(--hero-text)]`}>
      {guestName && (
        <p className="tpl-rise mb-auto text-sm">
          Gửi <span className="tpl-script text-2xl text-[var(--primary)]">{guestName}</span>
        </p>
      )}
      <div className="relative mt-[50%] w-[84%] max-w-[400px] @3xl:mt-[260px]" style={{ perspective: 1200 }}>
        <div className="relative aspect-[4/3]">
          <div className="absolute inset-0 rounded-md bg-[color-mix(in_srgb,var(--primary)_78%,black)]" aria-hidden />
          {/* lá thư */}
          <div className="tpl-letter absolute inset-x-[6%] bottom-[6%] z-10 h-[150%] rounded-sm bg-[var(--surface)] p-4 shadow-lg">
            <Img src={data.coverPhoto} alt="Ảnh cưới của cô dâu và chú rể" eager position={data.photoPos.cover} className="aspect-[4/3] w-full" />
            <p className="mt-3 text-[10px] uppercase tracking-[0.45em] text-[var(--muted)]">{data.headline}</p>
          </div>
          {/* túi phong bì */}
          <div className="absolute inset-0 z-20 rounded-md bg-[var(--primary)]" style={{ clipPath: "polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)" }} aria-hidden>
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top right, rgba(0,0,0,.12) 50%, transparent 50%), linear-gradient(to top left, rgba(0,0,0,.08) 50%, transparent 50%)" }} />
          </div>
          {/* nắp + dấu sáp */}
          <div className="tpl-flap absolute inset-x-0 top-0 z-30 h-[58%]" aria-hidden>
            <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--primary)_88%,white)]" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
            <span className="absolute left-1/2 top-full flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#8e1f2c] text-lg font-semibold text-[#f3d9c0] shadow-[inset_0_-3px_0_rgba(0,0,0,.25),0_4px_10px_rgba(0,0,0,.3)]">
              {initials(g, b)}
            </span>
          </div>
        </div>
      </div>
      <h1 className="tpl-script tpl-rise relative mt-10 text-6xl leading-tight text-[var(--primary)]" style={d(2400)}>
        {g} & {b}
      </h1>
      {date && (
        <p className="tpl-heading tpl-rise relative mt-3 text-xl italic" style={d(2600)}>
          {date.weekday}, ngày {date.day} tháng {date.month} năm {date.year}
        </p>
      )}
      <div className="mt-6">
        <Cue />
      </div>
    </header>
  );
}

function Sprig({ className, flower = "#d98fa0" }: { className: string; flower?: string }) {
  return (
    <svg viewBox="0 0 80 220" className={className} fill="none" aria-hidden>
      <path d="M40 218C38 160 44 100 36 20" stroke="#5c6b3a" strokeWidth="1.6" />
      {[40, 70, 100, 130, 160].map((y, i) => (
        <ellipse key={y} cx={i % 2 ? 50 : 28} cy={y} rx="12" ry="5" fill="#7c8c4e" opacity=".75" transform={`rotate(${i % 2 ? -35 : 35} ${i % 2 ? 50 : 28} ${y})`} />
      ))}
      {[[36, 18], [30, 8], [44, 10]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill={flower} opacity=".9" />
      ))}
    </svg>
  );
}

/** Tiêu bản thảo mộc: ảnh kẹp góc giấy, hoa ép khô, nhãn mẫu vật. */
export function HerbariumHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const ev = data.events.find((e) => e.venue);
  const corner = "absolute h-8 w-8 bg-[var(--accent)]";
  return (
    <header className={`relative ${H} overflow-hidden bg-[var(--hero-bg)] px-6 pb-14 pt-14 text-[var(--hero-text)]`}>
      <Sprig className="tpl-rise absolute -left-2 top-10 w-16 -rotate-12 @3xl:w-24" />
      <Sprig className="tpl-rise absolute -right-1 bottom-24 w-14 rotate-[20deg] @3xl:w-20" flower="#e2b04a" />
      <div className="relative mx-auto max-w-md">
        <p className="tpl-rise text-center text-[10px] uppercase tracking-[0.5em] text-[var(--muted)]">Bộ sưu tập · Mẫu số 01</p>
        <div className="tpl-rise relative mx-auto mt-6 w-[78%] rotate-1" style={d(150)}>
          <KenBurns src={data.coverPhoto} position={data.photoPos.cover} className="aspect-[4/5] w-full shadow-[0_18px_36px_-20px_rgba(0,0,0,.45)]" />
          <span className={`${corner} -left-2 -top-2`} style={{ clipPath: "polygon(0 0,100% 0,0 100%)" }} aria-hidden />
          <span className={`${corner} -right-2 -top-2`} style={{ clipPath: "polygon(0 0,100% 0,100% 100%)" }} aria-hidden />
          <span className={`${corner} -bottom-2 -left-2`} style={{ clipPath: "polygon(0 0,100% 100%,0 100%)" }} aria-hidden />
          <span className={`${corner} -bottom-2 -right-2`} style={{ clipPath: "polygon(100% 0,100% 100%,0 100%)" }} aria-hidden />
        </div>
        <h1 className="tpl-heading tpl-rise mt-10 text-center text-5xl italic leading-tight" style={d(500)}>
          {g} <span className="tpl-script not-italic text-[var(--primary)]">&</span> {b}
        </h1>
        <dl className="tpl-rise mx-auto mt-8 max-w-xs border border-[var(--hero-text)]/40 bg-[var(--surface)]/70 text-sm" style={d(800)}>
          {[
            ["Tên gọi", "Amor aeternus — Tình yêu bền lâu"],
            ["Ngày thu hái", date ? `${date.day}.${date.month}.${date.year}` : "—"],
            ["Nơi tìm thấy", ev?.venue || "—"],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[6.5rem_1fr] border-b border-[var(--hero-text)]/20 px-3 py-2 last:border-0">
              <dt className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{k}</dt>
              <dd className="italic">{v}</dd>
            </div>
          ))}
        </dl>
        <Guest guestName={guestName} className="text-center" />
        <div className="mt-10">
          <Cue />
        </div>
      </div>
    </header>
  );
}

/** Đĩa than: bìa album là ảnh cưới, đĩa trượt ra và quay; mặt A là các nghi lễ. */
export function VinylHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const tracks = data.events.filter((e) => e.title).slice(0, 4);
  return (
    <header className={`relative ${H} overflow-hidden bg-[var(--hero-bg)] px-5 pb-12 pt-12 text-[var(--hero-text)]`}>
      <div className="mx-auto max-w-lg">
        <p className="tpl-rise text-[11px] font-semibold uppercase tracking-[0.4em] text-[var(--primary)]">{data.headline}</p>
        <div className="relative mt-6 w-[62%]">
          {/* đĩa */}
          <div className="tpl-vinyl-out absolute inset-y-0 left-[50%] aspect-square">
            <div
              className="tpl-spin-vinyl relative h-full w-full rounded-full shadow-2xl"
              style={{ background: "repeating-radial-gradient(circle, #141414 0 2px, #222 2px 4px)", }}
            >
              <div className="absolute inset-[31%] overflow-hidden rounded-full border-4 border-[var(--primary)]">
                <Img src={data.gallery[0] || data.coverPhoto} alt="" className="h-full w-full" />
              </div>
              <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--hero-bg)]" aria-hidden />
              <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_40deg,transparent,rgba(255,255,255,.12)_10%,transparent_20%,transparent_55%,rgba(255,255,255,.08)_62%,transparent_70%)]" aria-hidden />
            </div>
          </div>
          {/* bìa */}
          <div className="tpl-rise relative z-10 aspect-square overflow-hidden shadow-[0_30px_60px_-25px_rgba(0,0,0,.7)]">
            <KenBurns src={data.coverPhoto} position={data.photoPos.cover} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
            <p className="absolute bottom-4 left-4 right-4 text-white">
              <span className="block text-[9px] uppercase tracking-[0.4em] opacity-80">The wedding album</span>
              <span className="tpl-heading text-4xl">{initials(g, b).split("").join(" & ")}</span>
            </p>
          </div>
        </div>
        <h1 className="tpl-heading tpl-rise mt-10 text-6xl leading-[0.9] @3xl:text-7xl" style={d(600)}>
          {g}
          <br />
          <span className="text-[var(--primary)]">&</span> {b}
        </h1>
        {date && (
          <p className="tpl-rise mt-3 text-sm uppercase tracking-[0.3em] opacity-80" style={d(750)}>
            Phát hành {date.day}.{date.month}.{date.year}
          </p>
        )}
        {tracks.length > 0 && (
          <ol className="tpl-rise mt-8 border-t border-current/20" style={d(900)} aria-label="Các nghi lễ">
            {tracks.map((ev, i) => (
              <li key={ev.id} className="flex items-baseline gap-4 border-b border-current/20 py-3 text-sm">
                <span className="w-8 text-[var(--primary)]">A{i + 1}</span>
                <span className="flex-1">{ev.title}</span>
                <span className="tabular-nums opacity-70">{formatDate(ev.date)?.time}</span>
              </li>
            ))}
          </ol>
        )}
        <Guest guestName={guestName} />
        <div className="mt-10">
          <Cue />
        </div>
      </div>
    </header>
  );
}

/* ================= THIỀN ================= */

/** Thuỷ mặc: núi mực loang, cuộn tranh treo chứa ảnh cưới, triện son. */
export function InkHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header className={`relative flex ${H} flex-col items-center justify-center overflow-hidden bg-[var(--hero-bg)] px-6 py-14 text-center text-[var(--hero-text)]`}>
      <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[45%] w-full" aria-hidden>
        <path d="M0 140 60 80 110 120 170 50 230 110 280 70 340 120 400 90V200H0z" fill="#1d1d1b" opacity=".08" />
        <path d="M0 170 50 130 120 160 190 100 260 150 320 120 400 160V200H0z" fill="#1d1d1b" opacity=".12" />
        <path d="M0 190 80 165 160 185 240 160 320 182 400 170V200H0z" fill="#1d1d1b" opacity=".16" />
      </svg>
      {date && (
        <p className="tpl-rise absolute right-5 top-10 text-[10px] uppercase tracking-[0.5em] text-[var(--muted)] @3xl:right-12" style={{ writingMode: "vertical-rl" }}>
          {date.weekday} · {date.day}.{date.month}.{date.year}
        </p>
      )}
      <div className="tpl-rise relative w-[56%] max-w-[300px]" style={d(200)}>
        <div className="mx-[-8%] h-3 rounded-full bg-[#3b2a1d] shadow" aria-hidden />
        <div className="bg-[var(--surface)] px-[9%] pb-[14%] pt-[9%] shadow-[0_30px_50px_-30px_rgba(0,0,0,.5)]">
          <KenBurns src={data.coverPhoto} position={data.photoPos.cover} className="aspect-[2/3] w-full" />
        </div>
        <div className="mx-[-8%] h-3 rounded-full bg-[#3b2a1d] shadow" aria-hidden />
        <span className="absolute bottom-[8%] right-[2%] flex h-10 w-10 items-center justify-center bg-[var(--primary)] text-sm font-semibold text-white">
          {initials(g, b)}
        </span>
      </div>
      <h1 className="tpl-heading tpl-rise relative mt-10 text-5xl font-light @3xl:text-6xl" style={d(600)}>
        <span className="block">{g}</span>
        <span className="mx-auto my-3 block h-8 w-px bg-[var(--primary)]" aria-hidden />
        <span className="block">{b}</span>
      </h1>
      <p className="tpl-script tpl-rise relative mt-3 text-2xl text-[var(--muted)]" style={d(800)}>
        {data.headline}
      </p>
      <Guest guestName={guestName} className="relative" />
      <div className="relative mt-10">
        <Cue />
      </div>
    </header>
  );
}

/** Trăng rằm: ảnh tròn như vầng trăng nhô lên giữa trời đêm. */
export function MoonHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const lunar = data.events.find((e) => e.lunarDate)?.lunarDate;
  return (
    <header
      className={`relative flex ${H} flex-col items-center justify-center overflow-hidden px-6 py-16 text-center text-[var(--hero-text)]`}
      style={{ background: "linear-gradient(to bottom, var(--hero-bg), color-mix(in srgb, var(--hero-bg) 70%, var(--primary)) 70%, color-mix(in srgb, var(--hero-bg) 50%, var(--primary)))" }}
    >
      <div className="tpl-stars pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="tpl-moon relative w-[70%] max-w-[380px]">
        <div className="absolute -inset-10 rounded-full bg-[#f6efd6]/25 blur-3xl" aria-hidden />
        <div className="relative overflow-hidden rounded-full shadow-[0_0_0_1px_rgba(246,239,214,.4),0_0_80px_10px_rgba(246,239,214,.25)]">
          <KenBurns src={data.coverPhoto} position={data.photoPos.cover} className="aspect-square w-full" />
        </div>
      </div>
      <svg viewBox="0 0 300 30" className="tpl-rise -mt-8 w-[80%] max-w-md text-[var(--hero-text)]/40" style={d(1200)} fill="none" aria-hidden>
        <path d="M0 20c40 0 50-12 90-12s50 12 90 12 70-14 120-6" stroke="currentColor" />
        <path d="M30 28c30 0 40-8 70-8s40 8 70 8" stroke="currentColor" opacity=".6" />
      </svg>
      <p className="tpl-rise mt-6 text-[10px] uppercase tracking-[0.6em] opacity-75" style={d(1400)}>
        {data.headline}
      </p>
      <h1 className="tpl-heading tpl-rise mt-3 text-5xl @3xl:text-7xl" style={d(1600)}>
        {g} <span className="tpl-script text-[var(--accent)]">&</span> {b}
      </h1>
      {(lunar || date) && (
        <p className="tpl-rise mt-4 text-sm tracking-[0.25em] opacity-85" style={d(1800)}>
          {lunar || `${date!.weekday} · ${date!.short}`}
        </p>
      )}
      <Guest guestName={guestName} />
      <div className="mt-10">
        <Cue />
      </div>
    </header>
  );
}

/** Vải lanh: bố cục lệch, tên viết dọc theo mép trái, ảnh lớn lệch phải. */
export function OffsetHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header
      className={`relative ${H} overflow-hidden text-[var(--hero-text)]`}
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(0,0,0,.025) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,.02) 0 1px, transparent 1px 4px), var(--hero-bg)",
      }}
    >
      <div className="absolute right-0 top-[8%] h-[66%] w-[64%] @3xl:w-[58%]">
        <KenBurns src={data.coverPhoto} position={data.photoPos.cover} className="h-full w-full" />
      </div>
      <h1
        className="tpl-heading tpl-rise absolute bottom-[8%] left-4 text-[13cqw] font-light leading-[0.9] @3xl:left-12 @3xl:text-8xl"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", ...d(300) }}
      >
        {g} <span className="tpl-script text-[var(--primary)]">&</span> {b}
      </h1>
      <div className="absolute bottom-[7%] right-5 max-w-[56%] text-right @3xl:right-12">
        <span className="tpl-rise ml-auto block h-16 w-px bg-current/40" style={d(600)} aria-hidden />
        <p className="tpl-rise mt-4 text-[10px] uppercase tracking-[0.5em] text-[var(--muted)]" style={d(700)}>
          {data.headline}
        </p>
        {date && (
          <p className="tpl-heading tpl-rise mt-2 text-3xl font-light tabular-nums" style={d(850)}>
            {date.day}.{date.month}.{date.year}
          </p>
        )}
        {guestName && (
          <p className="tpl-rise mt-4 text-sm" style={d(1000)}>
            Kính mời <strong className="font-medium">{guestName}</strong>
          </p>
        )}
      </div>
    </header>
  );
}
