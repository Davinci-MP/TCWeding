"use client";

import type { CSSProperties } from "react";
import type { InvitationData } from "@/lib/invitation";
import type { TemplateDef } from "./registry";
import { Icon } from "./icons";
import { F, formatDate, Img } from "./parts";

type Props = { tpl: TemplateDef; data: InvitationData; guestName?: string };
const d = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });
export const names = (data: InvitationData) => [data.groom.name || "Chú rể", data.bride.name || "Cô dâu"] as const;

export function KenBurns({ src, className = "", position, fk }: { src: string; className?: string; position?: string; fk?: string }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="tpl-kenburns h-full w-full">
        <Img src={src} alt="Ảnh cưới của cô dâu và chú rể" eager className="h-full w-full" position={position} fk={fk} />
      </div>
    </div>
  );
}

export function Cue() {
  return (
    <div className="tpl-rise flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.4em] opacity-70" style={d(1600)} aria-hidden>
      Cuộn xuống
      <Icon name="down" size={18} className="tpl-cue" />
    </div>
  );
}

export function Guest({ guestName, className = "" }: { guestName?: string; className?: string }) {
  if (!guestName) return null;
  return (
    <p className={`tpl-rise mt-8 ${className}`} style={d(1200)}>
      <span className="block text-[11px] uppercase tracking-[0.35em] opacity-70">Trân trọng kính mời</span>
      <span className="tpl-heading mt-1 block text-xl">{guestName}</span>
    </p>
  );
}

/* ---------- Noir Gold: mở đầu như một bộ phim ---------- */
export function CinemaHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header className="relative flex min-h-[var(--hero-h,100svh)] flex-col bg-black text-[var(--hero-text)]">
      <div className="h-[9svh] min-h-10 bg-black" aria-hidden />
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <KenBurns src={data.coverPhoto} className="absolute inset-0 [filter:sepia(.25)_saturate(.7)_contrast(1.05)]" fk="cover" position={data.photoPos.cover} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,.75))]" aria-hidden />
        <div
          className="absolute inset-0 opacity-[.18] mix-blend-overlay"
          style={{ backgroundImage: "repeating-radial-gradient(circle at 17% 32%, #fff 0 1px, transparent 1px 3px)" }}
          aria-hidden
        />
        <div className="relative px-6 py-16 text-center">
          <p className="tpl-rise text-[10px] uppercase tracking-[0.7em] text-[var(--primary)]">Một bộ phim về tình yêu</p>
          <div className="tpl-rise mx-auto my-6 h-px w-24 bg-[var(--primary)]" style={d(200)} />
          <h1 className="tpl-heading">
            <span className="tpl-rise block text-5xl uppercase tracking-[0.25em] @3xl:text-7xl" style={d(400)}>
              <F f="groom.name">{g}</F>
            </span>
            <span className="tpl-script tpl-rise my-2 block text-5xl text-[var(--primary)]" style={d(700)}>
              &
            </span>
            <span className="tpl-rise block text-5xl uppercase tracking-[0.25em] @3xl:text-7xl" style={d(1000)}>
              <F f="bride.name">{b}</F>
            </span>
          </h1>
          {date && (
            <p data-tf="weddingDate" className="tpl-rise mt-8 text-xs uppercase tracking-[0.6em]" style={d(1300)}>
              Công chiếu · {date.day}.{date.month}.{date.year}
            </p>
          )}
          <Guest guestName={guestName} />
        </div>
      </div>
      <div className="flex h-[9svh] min-h-10 items-center justify-center bg-black">
        <Cue />
      </div>
    </header>
  );
}

/* ---------- Tạp chí: cặp đôi lên trang bìa ---------- */
export function Barcode() {
  const bars = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1];
  let x = 0;
  return (
    <svg viewBox="0 0 60 30" className="h-10 w-20 bg-white p-1" aria-hidden>
      {bars.map((w, i) => {
        const r = i % 2 === 0 ? <rect key={i} x={x} y="0" width={w} height="30" fill="#111" /> : null;
        x += w;
        return r;
      })}
    </svg>
  );
}

export function MagazineHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const lines = data.story.slice(0, 3).map((s) => s.title);
  return (
    <header className="relative min-h-[var(--hero-h,100svh)] overflow-hidden bg-[var(--hero-bg)] text-white">
      <KenBurns src={data.coverPhoto} className="absolute inset-0" fk="cover" position={data.photoPos.cover} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/75" aria-hidden />
      <div className="relative flex min-h-[var(--hero-h,100svh)] flex-col p-5 @3xl:p-10">
        <div className="tpl-rise flex justify-between text-[10px] font-semibold uppercase tracking-[0.3em]">
          <span>Số đặc biệt</span>
          <span>{date ? `Tháng ${date.month} · ${date.year}` : ""}</span>
        </div>
        <p
          className="tpl-heading tpl-rise mt-1 text-center text-[18.5cqw] font-bold uppercase leading-[0.8] tracking-tight text-[var(--primary)] @3xl:text-[11rem]"
          style={d(150)}
          aria-hidden
        >
          Wedding
        </p>
        <div className="mt-6 max-w-[55%] space-y-4">
          {lines.map((l, i) => (
            <p key={l} className="tpl-rise border-l-2 border-[var(--primary)] pl-3 text-sm font-semibold leading-snug" style={d(400 + i * 150)}>
              {l}
            </p>
          ))}
        </div>
        <div className="mt-auto">
          <p className="tpl-rise text-[11px] font-semibold uppercase tracking-[0.4em] text-[var(--primary)]" style={d(800)}>
            Độc quyền
          </p>
          <h1 className="tpl-heading tpl-rise mt-2 text-6xl italic leading-[0.9] @3xl:text-8xl" style={d(950)}>
            <F f="groom.name">{g}</F>
            <br />& <F f="bride.name">{b}</F>
          </h1>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p data-tf="weddingDate" className="tpl-rise text-sm opacity-90" style={d(1100)}>
                {date ? `${date.weekday}, ${date.day}.${date.month}.${date.year}` : ""}
              </p>
              {guestName && (
                <p className="tpl-rise mt-2 text-sm" style={d(1200)}>
                  Dành riêng cho <strong>{guestName}</strong>
                </p>
              )}
            </div>
            <div className="tpl-rise" style={d(1300)}>
              <Barcode />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- Hoa Đào Xuân ---------- */
function PeachBranch({ className, flip }: { className: string; flip?: boolean }) {
  const flowers: [number, number, number][] = [
    [62, 34, 9],
    [100, 58, 7],
    [128, 30, 8],
    [150, 82, 6],
    [40, 70, 6],
    [176, 54, 7],
  ];
  return (
    <svg className={className} viewBox="0 0 220 140" fill="none" style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden>
      <path d="M0 10c40 10 70 30 110 40s70 30 110 70" stroke="#6b3b2a" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 32c10 20 30 30 42 26M120 62c8-14 4-26 8-32M150 84c10-4 18-14 26-30" stroke="#6b3b2a" strokeWidth="1.6" strokeLinecap="round" />
      {flowers.map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy={-r * 0.62} rx={r * 0.5} ry={r * 0.68} transform={`rotate(${a})`} fill="#f5a9b4" />
          ))}
          <circle r={r * 0.28} fill="#c23b3f" />
        </g>
      ))}
      {[
        [85, 44],
        [140, 70],
        [30, 22],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#f7c6cd" />
      ))}
    </svg>
  );
}

export function BlossomHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const lunar = data.events.find((e) => e.lunarDate)?.lunarDate;
  return (
    <header className="relative overflow-hidden bg-[var(--hero-bg)] px-5 pb-16 pt-24 text-center text-[var(--hero-text)]">
      <PeachBranch className="tpl-rise absolute -left-6 top-0 w-64 @3xl:w-96" />
      <PeachBranch className="tpl-rise absolute -right-6 top-0 w-56 @3xl:w-80" flip />
      <div className="tpl-rise relative mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-[var(--primary)] text-2xl font-bold text-[var(--on-primary)] shadow-md">
        囍
      </div>
      <p className="tpl-rise relative mt-5 text-[11px] uppercase tracking-[0.5em] text-[var(--primary)]" style={d(150)}>
        <F f="headline">{data.headline}</F>
      </p>
      <div className="relative mx-auto mt-8 h-64 w-64 @3xl:h-80 @3xl:w-80">
        <div className="absolute -inset-3 rounded-full border-2 border-[var(--primary)]/70" aria-hidden />
        <div className="absolute -inset-5 rounded-full border border-[var(--primary)]/30" aria-hidden />
        <KenBurns src={data.coverPhoto} className="h-full w-full rounded-full" fk="cover" position={data.photoPos.cover} />
      </div>
      <h1 className="tpl-script tpl-rise relative mt-10 text-6xl leading-tight text-[var(--primary)]" style={d(400)}>
        <F f="groom.name">{g}</F> <span className="text-4xl">&</span> <F f="bride.name">{b}</F>
      </h1>
      {date && (
        <p data-tf="weddingDate" className="tpl-heading tpl-rise relative mt-4 text-xl" style={d(700)}>
          {date.weekday} · {date.short}
        </p>
      )}
      {lunar && (
        <p className="tpl-rise relative mt-1 text-sm italic text-[var(--muted)]" style={d(800)}>
          {lunar}
        </p>
      )}
      <Guest guestName={guestName} className="relative" />
      <div className="relative mt-10">
        <Cue />
      </div>
    </header>
  );
}

/* ---------- Lilac màu nước ---------- */
export function WatercolorHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const blob = (c: string, cls: string) => (
    <div className={`absolute rounded-full mix-blend-multiply blur-3xl ${cls}`} style={{ background: c }} aria-hidden />
  );
  return (
    <header className="relative overflow-hidden bg-[var(--hero-bg)] px-5 pb-16 pt-16 text-center text-[var(--hero-text)]">
      {blob("color-mix(in srgb, var(--primary) 35%, transparent)", "-left-20 -top-16 h-80 w-80")}
      {blob("#f6c9d3aa", "-right-24 top-40 h-96 w-96")}
      {blob("#cfe3d4aa", "-bottom-20 left-10 h-72 w-72")}
      <p className="tpl-heading tpl-rise relative text-2xl italic text-[var(--muted)]"><F f="headline">{data.headline}</F></p>
      <div className="relative mx-auto mt-8 w-[76%] max-w-[380px]">
        <div
          className="absolute -inset-4 opacity-60"
          style={{ borderRadius: "58% 42% 52% 48% / 46% 56% 44% 54%", background: "color-mix(in srgb, var(--primary) 25%, transparent)" }}
          aria-hidden
        />
        <div className="relative overflow-hidden shadow-xl" style={{ borderRadius: "52% 48% 46% 54% / 44% 50% 50% 56%" }}>
          <KenBurns src={data.coverPhoto} className="aspect-[4/5] w-full" fk="cover" position={data.photoPos.cover} />
        </div>
      </div>
      <h1 className="tpl-script tpl-rise relative mt-10 text-7xl leading-[1.05] text-[var(--primary)] @3xl:text-8xl" style={d(400)}>
        <F f="groom.name">{g}</F>
        <br />
        <span className="text-5xl">&</span> <F f="bride.name">{b}</F>
      </h1>
      {date && (
        <p data-tf="weddingDate" className="tpl-heading tpl-rise relative mt-5 text-2xl italic" style={d(700)}>
          {date.weekday}, ngày {date.day} tháng {date.month} năm {date.year}
        </p>
      )}
      <Guest guestName={guestName} className="relative" />
      <div className="relative mt-10">
        <Cue />
      </div>
    </header>
  );
}
