"use client";

import type { CSSProperties, ReactNode } from "react";
import type { InvitationData } from "@/lib/invitation";
import type { TemplateDef } from "./registry";
import { Icon } from "./icons";
import { F, formatDate, Img, LotusShape, OrnamentMark } from "./parts";
import { PearlHero } from "./heroes-pearl";
import { BlossomHero, CinemaHero, MagazineHero, WatercolorHero } from "./heroes-new";
import { BentoHero, BoardingHero, CrestHero, EnvelopeHero, GeoHero, HerbariumHero, InkHero, MarbleHero, MoonHero, OffsetHero, ScrapbookHero, TriptychHero, TypeHero, VelvetHero, VinylHero } from "./heroes-more";

type Props = { tpl: TemplateDef; data: InvitationData; guestName?: string };

const d = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

/** Ảnh nền phóng chậm (Ken Burns). */
function KenBurns({ src, className = "", position, fk }: { src: string; className?: string; position?: string; fk?: string }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="tpl-kenburns h-full w-full">
        <Img src={src} alt="Ảnh cưới của cô dâu và chú rể" eager className="h-full w-full" position={position} fk={fk} />
      </div>
    </div>
  );
}

function ScrollCue({ className = "" }: { className?: string }) {
  return (
    <div className={`tpl-rise flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.4em] opacity-70 ${className}`} style={d(1600)} aria-hidden>
      Cuộn xuống
      <Icon name="down" size={18} className="tpl-cue" />
    </div>
  );
}

function Guest({ guestName, className = "" }: { guestName?: string; className?: string }) {
  if (!guestName) return null;
  return (
    <p className={`tpl-rise mt-8 text-sm ${className}`} style={d(1200)}>
      <span className="text-[11px] uppercase tracking-[0.35em] opacity-70">Trân trọng kính mời</span>
      <span className="tpl-heading mt-1 block text-xl">{guestName}</span>
    </p>
  );
}

function names(data: InvitationData) {
  return [data.groom.name || "Chú rể", data.bride.name || "Cô dâu"] as const;
}

export function Hero(props: Props) {
  const map: Record<TemplateDef["hero"], (p: Props) => ReactNode> = {
    frame: ArchWindowHero,
    songhy: SongHyHero,
    editorial: EditorialHero,
    floral: GardenHero,
    starry: StarryHero,
    split: SplitHero,
    postcard: PostcardHero,
    lotus: LotusHero,
    wave: WaveHero,
    deco: DecoHero,
    polaroid: PolaroidHero,
    cinema: CinemaHero,
    magazine: MagazineHero,
    blossom: BlossomHero,
    watercolor: WatercolorHero,
    marble: MarbleHero,
    velvet: VelvetHero,
    crest: CrestHero,
    geo: GeoHero,
    triptych: TriptychHero,
    bento: BentoHero,
    typo: TypeHero,
    boarding: BoardingHero,
    scrapbook: ScrapbookHero,
    envelope: EnvelopeHero,
    herbarium: HerbariumHero,
    vinyl: VinylHero,
    ink: InkHero,
    moon: MoonHero,
    offset: OffsetHero,
    pearl: PearlHero,
  };
  const C = map[props.tpl.hero] ?? ArchWindowHero;
  return <C {...props} />;
}

/* 1. Ivory cổ điển — khung cửa vòm lớn, tên chồng lên mép ảnh */
function ArchWindowHero({ tpl, data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header className="relative overflow-hidden bg-[var(--hero-bg)] px-5 pb-16 pt-12 text-center text-[var(--hero-text)]">
      <p className="tpl-rise text-[11px] uppercase tracking-[0.5em] text-[var(--primary)]"><F f="headline">{data.headline}</F></p>
      <div className="relative mx-auto mt-8 w-[78%] max-w-[420px]">
        <div className="absolute -inset-3 rounded-t-full border border-[var(--primary)]/50" aria-hidden />
        <KenBurns src={data.coverPhoto} className="aspect-[3/4] rounded-t-full shadow-[0_40px_80px_-40px_rgba(60,40,20,.5)]" fk="cover" position={data.photoPos.cover} />
      </div>
      {/* tên chồng lên mép ảnh: quầng màu nền giữ chữ đọc rõ khi tên dài đè lên phần ảnh tối */}
      <h1 className="relative -mt-14 [text-shadow:0_0_2px_var(--hero-bg),0_0_8px_var(--hero-bg),0_0_18px_var(--hero-bg),0_0_28px_var(--hero-bg)] @3xl:-mt-20">
        <span className="tpl-heading tpl-rise block text-6xl italic leading-none @3xl:text-8xl" style={d(300)}>
          <F f="groom.name">{g}</F>
        </span>
        <span className="tpl-script tpl-rise block text-5xl text-[var(--primary)] @3xl:text-6xl" style={d(550)}>
          &
        </span>
        <span className="tpl-heading tpl-rise block text-6xl italic leading-none @3xl:text-8xl" style={d(800)}>
          <F f="bride.name">{b}</F>
        </span>
      </h1>
      <div className="tpl-rise mt-8" style={d(1000)}>
        <OrnamentMark type={tpl.ornament} />
        {date && (
          <p data-tf="weddingDate" className="tpl-heading mt-4 text-xl tracking-[0.25em]">
            {date.weekday.toUpperCase()} · {date.short}
          </p>
        )}
      </div>
      <Guest guestName={guestName} />
      <ScrollCue className="mt-10" />
    </header>
  );
}

/* 2. Song Hỷ — ảnh tràn màn hình phủ đỏ son, dấu 囍 vàng, khối ngày kiểu thiệp truyền thống */
function SongHyHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header className="relative flex min-h-[var(--hero-h,100svh)] flex-col items-center justify-end overflow-hidden bg-[var(--hero-bg)] px-6 pb-14 pt-24 text-center text-[var(--hero-text)]">
      <KenBurns src={data.coverPhoto} className="absolute inset-0" fk="cover" position={data.photoPos.cover} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#5c0710]/30 via-[#7a0b16]/55 to-[var(--hero-bg)]" aria-hidden />
      {/* góc hoa văn */}
      {["left-4 top-4", "right-4 top-4 rotate-90", "right-4 bottom-4 rotate-180", "left-4 bottom-4 -rotate-90"].map((c) => (
        <svg key={c} className={`absolute h-16 w-16 text-[var(--accent)] ${c}`} viewBox="0 0 64 64" fill="none" stroke="currentColor" aria-hidden>
          <path d="M2 30V2h28M8 22V8h14M2 2l12 12" />
        </svg>
      ))}
      <div className="relative">
        <div className="tpl-rise mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[var(--accent)] text-5xl font-bold text-[var(--accent)]">
          囍
        </div>
        <p className="tpl-rise mt-6 text-[11px] uppercase tracking-[0.5em]" style={d(200)}>
          Lễ Thành Hôn
        </p>
        <h1 className="tpl-heading tpl-rise mt-4 text-5xl leading-tight text-[var(--accent)] @3xl:text-7xl" style={d(400)}>
          <F f="groom.name">{g}</F>
          <span className="tpl-script mx-3 align-middle text-4xl">&</span>
          <F f="bride.name">{b}</F>
        </h1>
        {date && (
          <div data-tf="weddingDate" className="tpl-rise mx-auto mt-8 grid max-w-xs grid-cols-3 items-center border-y border-[var(--accent)]/60 py-3" style={d(700)}>
            <span className="text-xs uppercase tracking-[0.25em]">{date.weekday}</span>
            <span className="tpl-heading border-x border-[var(--accent)]/60 text-5xl text-[var(--accent)]">{date.day}</span>
            <span className="text-xs tracking-[0.25em]">
              {date.month} · {date.year}
            </span>
          </div>
        )}
        <Guest guestName={guestName} />
        <ScrollCue className="mt-10" />
      </div>
    </header>
  );
}

/* 3. Minimal — kiểu tạp chí, chữ in hoa cực lớn căn trái trên ảnh đen trắng */
function EditorialHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header className="relative min-h-[var(--hero-h,100svh)] overflow-hidden bg-[var(--hero-bg)] text-[var(--hero-text)]">
      <KenBurns src={data.coverPhoto} className="absolute inset-0 grayscale" fk="cover" position={data.photoPos.cover} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" aria-hidden />
      <div className="relative flex min-h-[var(--hero-h,100svh)] flex-col justify-between p-6 @3xl:p-12">
        <div className="tpl-rise flex items-start justify-between gap-4 border-b border-white/30 pb-4 text-[11px] uppercase tracking-[0.4em]">
          <span className="min-w-0"><F f="headline">{data.headline}</F></span>
          {/* ngày không bị bẻ dòng khi dòng tiêu đề dài */}
          <span className="shrink-0 whitespace-nowrap tracking-[0.25em]">{date?.short ?? ""}</span>
        </div>
        <div>
          <h1 className="tpl-heading text-[15cqw] font-semibold uppercase leading-[0.85] tracking-tight @3xl:text-[7.5rem]">
            <span className="tpl-rise block" style={d(200)}>
              <F f="groom.name">{g}</F>
            </span>
            <span className="tpl-script tpl-rise block py-2 text-[0.35em] font-normal normal-case italic tracking-normal" style={d(450)}>
              and
            </span>
            <span className="tpl-rise block" style={d(650)}>
              <F f="bride.name">{b}</F>
            </span>
          </h1>
          <div className="tpl-rise mt-8 flex flex-wrap items-end justify-between gap-4 text-sm" style={d(900)}>
            <p data-tf="weddingDate" className="max-w-xs opacity-80">{date ? `${date.weekday}, ngày ${date.day} tháng ${date.month} năm ${date.year}` : ""}</p>
            {guestName && (
              <p className="text-right">
                <span className="block text-[10px] uppercase tracking-[0.4em] opacity-60">Kính mời</span>
                <span className="tpl-heading text-lg uppercase tracking-[0.15em]">{guestName}</span>
              </p>
            )}
          </div>
          <ScrollCue className="mt-10" />
        </div>
      </div>
    </header>
  );
}

function Branch({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 160 160" fill="none" aria-hidden>
      <path d="M10 150C40 90 80 50 150 10" stroke="currentColor" strokeWidth="1.5" />
      {[18, 38, 58, 78, 98].map((t, i) => (
        <g key={t} fill="currentColor">
          <path d={`M${10 + t * 1.2} ${150 - t * 1.25}c-16-4-26-18-24-34 16 3 26 17 24 34z`} opacity={0.5 + i * 0.1} />
          <path d={`M${14 + t * 1.2} ${146 - t * 1.25}c16 6 32 2 40-10-16-8-32-4-40 10z`} opacity={0.4 + i * 0.1} />
        </g>
      ))}
    </svg>
  );
}

/* 4. Khu vườn — ảnh oval giữa cành lá, chữ viết tay */
function GardenHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header className="relative overflow-hidden bg-[var(--hero-bg)] px-5 pb-16 pt-14 text-center text-[var(--hero-text)]">
      <Branch className="tpl-rise absolute -left-6 -top-6 h-48 w-48 rotate-90 text-[var(--primary)]" />
      <Branch className="tpl-rise absolute -bottom-6 -right-6 h-48 w-48 -rotate-90 text-[var(--primary)]" />
      <p className="tpl-heading tpl-rise text-xl italic text-[var(--muted)]"><F f="headline">{data.headline}</F></p>
      <div className="relative mx-auto mt-8 h-[26rem] w-[17rem] @3xl:h-[30rem] @3xl:w-[20rem]">
        <div className="absolute -inset-3 rounded-[50%] border border-[var(--primary)]/40" aria-hidden />
        <KenBurns src={data.coverPhoto} className="h-full w-full rounded-[50%] shadow-2xl" fk="cover" position={data.photoPos.cover} />
      </div>
      <h1 className="tpl-script tpl-rise mt-8 text-6xl leading-tight text-[var(--primary)] @3xl:text-7xl" style={d(400)}>
        <F f="groom.name">{g}</F> <span className="text-4xl">&</span> <F f="bride.name">{b}</F>
      </h1>
      {date && (
        <p data-tf="weddingDate" className="tpl-heading tpl-rise mt-4 text-xl" style={d(700)}>
          {date.weekday}, {date.day} tháng {date.month} năm {date.year}
        </p>
      )}
      <Guest guestName={guestName} />
      <ScrollCue className="mt-10" />
    </header>
  );
}

/* 5. Đêm đầy sao — ảnh tràn phủ xanh đêm, trăng khuyết, chữ vàng */
function StarryHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header className="relative flex min-h-[var(--hero-h,100svh)] flex-col items-center justify-center overflow-hidden bg-[var(--hero-bg)] px-6 py-20 text-center text-[var(--hero-text)]">
      <KenBurns src={data.coverPhoto} className="absolute inset-0 opacity-60" fk="cover" position={data.photoPos.cover} />
      <div className="tpl-stars absolute inset-0 bg-gradient-to-b from-[var(--hero-bg)]/70 via-[var(--hero-bg)]/40 to-[var(--hero-bg)]" aria-hidden />
      <div className="absolute right-10 top-12 h-14 w-14 rounded-full shadow-[inset_-12px_4px_0_0_var(--primary)]" aria-hidden />
      <div className="relative">
        <p className="tpl-rise text-[11px] uppercase tracking-[0.5em] text-[var(--primary)]"><F f="headline">{data.headline}</F></p>
        <h1 className="tpl-script tpl-rise mt-8 text-7xl leading-[1.05] text-[var(--primary)] drop-shadow-[0_2px_20px_rgba(217,181,111,.35)] @3xl:text-8xl" style={d(300)}>
          <F f="groom.name">{g}</F>
          <br />
          <span className="text-5xl">&</span> <F f="bride.name">{b}</F>
        </h1>
        {date && (
          <p data-tf="weddingDate" className="tpl-heading tpl-rise mt-8 text-2xl tracking-[0.35em]" style={d(700)}>
            {date.short}
            <span className="mt-2 block text-xs tracking-[0.4em] opacity-70">
              {date.weekday.toUpperCase()} · {date.time}
            </span>
          </p>
        )}
        <Guest guestName={guestName} />
        <ScrollCue className="mt-12" />
      </div>
    </header>
  );
}

/* 6. Hồng pastel — chia đôi ảnh / chữ */
function SplitHero({ tpl, data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header className="grid bg-[var(--hero-bg)] text-[var(--hero-text)] @3xl:min-h-[var(--hero-h,100svh)] @3xl:grid-cols-2">
      <KenBurns src={data.coverPhoto} className="h-[68svh] rounded-b-[3rem] @3xl:h-auto @3xl:rounded-none" fk="cover" position={data.photoPos.cover} />
      <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <p className="tpl-rise text-[11px] uppercase tracking-[0.45em] text-[var(--muted)]"><F f="headline">{data.headline}</F></p>
        <h1 className="mt-6">
          <span className="tpl-heading tpl-rise block text-5xl @3xl:text-7xl" style={d(250)}>
            <F f="groom.name">{g}</F>
          </span>
          <span className="tpl-script tpl-rise block text-5xl text-[var(--primary)]" style={d(450)}>
            và
          </span>
          <span className="tpl-heading tpl-rise block text-5xl @3xl:text-7xl" style={d(650)}>
            <F f="bride.name">{b}</F>
          </span>
        </h1>
        <OrnamentMark type={tpl.ornament} className="tpl-rise mt-6" />
        {date && (
          <p data-tf="weddingDate" className="tpl-rise mt-4 rounded-full bg-[var(--surface)] px-6 py-3 shadow-sm" style={d(850)}>
            <span className="tpl-heading text-lg">
              {date.weekday}, {date.short}
            </span>
          </p>
        )}
        <Guest guestName={guestName} />
      </div>
    </header>
  );
}

/* 7. Bưu thiếp vintage */
function PostcardHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header className="bg-[var(--hero-bg)] px-4 py-14 text-[var(--hero-text)]">
      <div
        className="tpl-rise mx-auto max-w-3xl p-2 shadow-[0_30px_60px_-30px_rgba(60,40,20,.6)]"
        style={{
          background: "repeating-linear-gradient(135deg, #b3413a 0 14px, var(--surface) 14px 22px, #2f5b8c 22px 36px, var(--surface) 36px 44px)",
        }}
      >
        <div className="relative bg-[var(--surface)] p-6 @3xl:p-10">
          <div className="absolute right-5 top-5 rotate-3 border-2 border-dashed border-[var(--muted)]/60 bg-[var(--surface)] p-1">
            <Img src={data.coverPhoto} alt="" className="h-20 w-16 sepia-[.4]" fk="cover" position={data.photoPos.cover} />
          </div>
          {date && (
            <div data-tf="weddingDate" className="absolute right-16 top-20 flex h-20 w-20 -rotate-12 flex-col items-center justify-center rounded-full border-2 border-[var(--primary)]/70 text-[var(--primary)]">
              <span className="text-[9px] uppercase tracking-widest">Wedding</span>
              <span className="tpl-heading text-sm font-semibold">
                {date.day}.{date.month}
              </span>
              <span className="text-[10px]">{date.year}</span>
            </div>
          )}
          <p className="tpl-heading pr-28 text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Post card · <F f="headline">{data.headline}</F></p>
          <div className="mt-10 grid gap-8 @3xl:grid-cols-[1.1fr_1px_1fr]">
            <KenBurns src={data.coverPhoto} className="aspect-[4/5] sepia-[.2]" fk="cover" position={data.photoPos.cover} />
            <div className="hidden bg-[var(--muted)]/30 @3xl:block" />
            <div className="flex flex-col justify-center">
              <h1 className="tpl-script tpl-rise text-6xl leading-tight text-[var(--primary)]" style={d(400)}>
                <F f="groom.name">{g}</F> <span className="text-4xl">&</span> <F f="bride.name">{b}</F>
              </h1>
              {date && (
                <p data-tf="weddingDate" className="tpl-heading tpl-rise mt-4 text-lg" style={d(600)}>
                  {date.weekday}, {date.short}
                </p>
              )}
              <div className="tpl-rise mt-8 space-y-4 text-xl" style={d(800)}>
                <p className="border-b border-dashed border-[var(--muted)]/50 pb-1">
                  Gửi: <span className="font-semibold">{guestName || "Bạn thân mến"}</span>
                </p>
                <p className="border-b border-dashed border-[var(--muted)]/50 pb-1">Từ: Nhà trai & Nhà gái</p>
                <p className="border-b border-dashed border-[var(--muted)]/50 pb-1">Lời nhắn: Nhất định phải đến nhé!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ScrollCue className="mt-10" />
    </header>
  );
}

/* 8. Sen tím Huế */
function LotusHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header
      className="relative overflow-hidden px-5 pb-24 pt-14 text-center text-[var(--hero-text)]"
      style={{ background: "radial-gradient(ellipse at top, color-mix(in srgb, var(--hero-bg) 60%, #b58bd0), var(--hero-bg) 70%)" }}
    >
      <svg className="tpl-rise mx-auto h-14 w-24 text-[var(--accent)]" viewBox="-24 -24 48 26" aria-hidden>
        <LotusShape x={0} y={0} size={22} />
      </svg>
      <p className="tpl-heading tpl-rise mt-2 text-xl italic opacity-90"><F f="headline">{data.headline}</F></p>
      <div className="relative mx-auto mt-8 w-[74%] max-w-[380px]">
        <div className="absolute -inset-2.5 rounded-t-full border border-[var(--accent)]/70" aria-hidden />
        <KenBurns src={data.coverPhoto} className="aspect-[3/4] rounded-t-full" fk="cover" position={data.photoPos.cover} />
      </div>
      <h1 className="tpl-script tpl-rise mt-8 text-6xl leading-tight text-[var(--accent)]" style={d(400)}>
        <F f="groom.name">{g}</F> <span className="text-4xl">&</span> <F f="bride.name">{b}</F>
      </h1>
      {date && (
        <p data-tf="weddingDate" className="tpl-heading tpl-rise mx-auto mt-6 inline-block border-y border-[var(--accent)]/60 px-6 py-2 text-lg tracking-[0.2em]" style={d(700)}>
          {date.time} · {date.weekday} · {date.short}
        </p>
      )}
      <Guest guestName={guestName} />
      <svg className="absolute bottom-0 left-0 h-16 w-full text-[var(--accent)] opacity-30" viewBox="0 0 200 22" preserveAspectRatio="xMidYMax meet" aria-hidden>
        {[20, 60, 100, 140, 180].map((x, i) => (
          <LotusShape key={x} x={x} y={22} size={i === 2 ? 20 : 14} />
        ))}
      </svg>
    </header>
  );
}

/* 9. Gió biển */
function WaveHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header className="relative min-h-[var(--hero-h,100svh)] overflow-hidden text-center text-white">
      <KenBurns src={data.coverPhoto} className="absolute inset-0" fk="cover" position={data.photoPos.cover} />
      {/* phủ cả giữa ảnh: tên chữ trắng không chìm vào nền trời sáng */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d3a4d]/55 via-[#0d3a4d]/30 to-[#0d3a4d]/60" aria-hidden />
      <div className="relative flex min-h-[var(--hero-h,100svh)] flex-col items-center justify-center px-6 pb-32">
        <p className="tpl-rise text-[11px] uppercase tracking-[0.5em]"><F f="headline">{data.headline}</F></p>
        <h1 className="tpl-script tpl-rise mt-6 text-7xl leading-tight drop-shadow-lg [text-shadow:0_2px_18px_rgb(6_30_40/0.55)] @3xl:text-8xl" style={d(300)}>
          <F f="groom.name">{g}</F>
          <br />
          <span className="text-4xl">&</span> <F f="bride.name">{b}</F>
        </h1>
        {date && (
          <p data-tf="weddingDate" className="tpl-heading tpl-rise mt-6 text-xl uppercase tracking-[0.45em]" style={d(650)}>
            {date.short}
          </p>
        )}
        <Guest guestName={guestName} />
      </div>
      <svg className="absolute bottom-0 left-0 h-32 w-full" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden>
        <path d="M0 40c50-30 100 30 150 0s100-30 150 0 70 20 100 5v55H0z" fill="var(--primary)" opacity=".35" />
        <path d="M0 60c60-25 110 25 170 0s110-25 170 0 40 10 60 5v35H0z" fill="var(--primary)" opacity=".55" />
        <path d="M0 80c50-15 100 15 150 0s100-15 150 0 70 10 100 3v17H0z" fill="var(--bg)" />
      </svg>
    </header>
  );
}

/* 10. Lục bảo Art Deco */
function DecoCorner({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" stroke="currentColor" aria-hidden>
      <path d="M0 0h60M0 0v60" strokeWidth="2" />
      <path d="M8 8h44M8 8v44" />
      {[14, 22, 30, 38].map((r) => (
        <path key={r} d={`M8 ${8 + r}A${r} ${r} 0 0 0 ${8 + r} 8`} />
      ))}
    </svg>
  );
}
const OCTA = "polygon(30% 0, 70% 0, 100% 14%, 100% 100%, 0 100%, 0 14%)";

function DecoHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header className="bg-[var(--hero-bg)] px-4 py-10 text-center text-[var(--hero-text)]">
      <div className="relative mx-auto max-w-lg border border-[var(--primary)] px-6 py-14">
        {["left-2 top-2", "right-2 top-2 rotate-90", "bottom-2 right-2 rotate-180", "bottom-2 left-2 -rotate-90"].map((c) => (
          <DecoCorner key={c} className={`absolute h-14 w-14 text-[var(--primary)] ${c}`} />
        ))}
        <p className="tpl-rise text-[11px] uppercase tracking-[0.55em] text-[var(--primary)]"><F f="headline">{data.headline}</F></p>
        <div className="tpl-rise mx-auto my-9 h-80 w-56 bg-[var(--primary)] p-[3px]" style={{ ...d(150), clipPath: OCTA }}>
          <div className="h-full w-full" style={{ clipPath: OCTA }}>
            <KenBurns src={data.coverPhoto} className="h-full w-full" fk="cover" position={data.photoPos.cover} />
          </div>
        </div>
        <h1 className="tpl-heading">
          <span className="tpl-rise block text-4xl font-semibold uppercase tracking-[0.22em]" style={d(350)}>
            <F f="groom.name">{g}</F>
          </span>
          <span className="tpl-script tpl-rise my-1 block text-5xl text-[var(--primary)]" style={d(550)}>
            &
          </span>
          <span className="tpl-rise block text-4xl font-semibold uppercase tracking-[0.22em]" style={d(750)}>
            <F f="bride.name">{b}</F>
          </span>
        </h1>
        {date && (
          <div data-tf="weddingDate" className="tpl-heading tpl-rise mt-9 flex items-center justify-center text-[var(--primary)]" style={d(950)}>
            <span className="border-y border-[var(--primary)] px-3 py-1 text-[11px] uppercase tracking-widest">{date.weekday}</span>
            <span className="border border-[var(--primary)] px-4 py-2 text-3xl">{date.day}</span>
            <span className="border-y border-[var(--primary)] px-3 py-1 text-[11px] tracking-widest">
              {date.month} · {date.year}
            </span>
          </div>
        )}
        <Guest guestName={guestName} />
      </div>
      <ScrollCue className="mt-8" />
    </header>
  );
}

/* 11. Polaroid trẻ trung */
function Polaroid({ src, caption, className, style }: { src: string; caption: string; className: string; style?: CSSProperties }) {
  return (
    <div className={`tpl-rise absolute bg-white p-2 pb-9 shadow-[0_20px_40px_-15px_rgba(0,0,0,.35)] ${className}`} style={style}>
      <span className="absolute -top-3 left-1/2 z-10 h-6 w-16 -translate-x-1/2 rotate-[-4deg] bg-[var(--accent)]/80" aria-hidden />
      <Img src={src} alt={caption} eager className="h-full w-full" />
      <p className="tpl-script absolute inset-x-0 bottom-1.5 text-center text-base text-[var(--muted)]">{caption}</p>
    </div>
  );
}

function PolaroidHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  const left = data.groom.photo || data.gallery[0] || data.coverPhoto;
  const right = data.bride.photo || data.gallery[1] || data.coverPhoto;
  return (
    <header className="overflow-hidden bg-[var(--hero-bg)] px-5 py-14 text-center text-[var(--hero-text)]">
      <p className="tpl-rise text-[11px] uppercase tracking-[0.45em] text-[var(--primary)]"><F f="headline">{data.headline}</F></p>
      <div className="relative mx-auto my-10 h-[22rem] w-full max-w-sm">
        <Polaroid src={left} caption={g} className="left-0 top-10 h-56 w-40 -rotate-12" style={d(150)} />
        <Polaroid src={right} caption={b} className="right-0 top-10 h-56 w-40 rotate-12" style={d(300)} />
        <Polaroid src={data.coverPhoto} caption="us, forever" className="left-1/2 top-0 z-10 h-72 w-52 -translate-x-1/2 rotate-2" style={d(450)} />
      </div>
      <h1 className="tpl-script tpl-rise text-6xl leading-tight text-[var(--primary)]" style={d(650)}>
        <F f="groom.name">{g}</F> <span className="text-4xl">+</span> <F f="bride.name">{b}</F>
      </h1>
      {date && (
        <div data-tf="weddingDate" className="tpl-heading tpl-rise mx-auto mt-4 inline-block text-xl" style={d(850)}>
          {date.weekday}, {date.short}
          <svg className="mt-1 h-3 w-full text-[var(--primary)]" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden>
            <path d="M2 6c20-6 40 4 60-1s30-3 36 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      )}
      <Guest guestName={guestName} />
      <ScrollCue className="mt-10" />
    </header>
  );
}
