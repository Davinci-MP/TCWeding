"use client";

// Xà Cừ Gấp Nếp: nền ánh xà cừ, hai nếp giấy chéo, khung ảnh bo lệch.
// Điện thoại: một cột (dòng tiêu đề → ảnh → tên → ngày). Màn rộng: hai cột cùng hệ lề (ảnh trái, cụm tên phải).

import type { CSSProperties } from "react";
import type { InvitationData } from "@/lib/invitation";
import type { TemplateDef } from "./registry";
import { F, formatDate } from "./parts";
import { Cue, KenBurns, names } from "./heroes-new";

type Props = { tpl: TemplateDef; data: InvitationData; guestName?: string };
const d = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

export function PearlHero({ data, guestName }: Props) {
  const date = formatDate(data.weddingDate);
  const [g, b] = names(data);
  return (
    <header className="tpl-pearl relative isolate overflow-hidden text-[var(--hero-text)]">
      {/* hai nếp giấy chéo (chỉ trang trí) */}
      <span className="tpl-pearl-fold tpl-pearl-fold-a" aria-hidden />
      <span className="tpl-pearl-fold tpl-pearl-fold-b" aria-hidden />

      <div className="relative mx-auto grid min-h-[var(--hero-h,100svh)] w-full max-w-6xl content-center items-center gap-8 px-6 pb-12 pt-14 @3xl:grid-cols-2 @3xl:gap-16 @3xl:px-12 @3xl:py-20">
        <p className="tpl-rise text-center text-[11px] font-medium uppercase tracking-[0.45em] text-[var(--primary)] @3xl:hidden">
          <F f="headline">{data.headline}</F>
        </p>

        <div className="tpl-rise mx-auto w-[76%] max-w-[22rem] @3xl:w-full @3xl:max-w-[30rem] @3xl:justify-self-end" style={d(150)}>
          <div className="tpl-pearl-frame relative aspect-[4/5]">
            <KenBurns src={data.coverPhoto} fk="cover" position={data.photoPos.cover} className="tpl-pearl-photo h-full w-full" />
          </div>
        </div>

        <div className="min-w-0 text-center @3xl:max-w-[30rem] @3xl:justify-self-start @3xl:text-left">
          <p className="tpl-rise hidden text-xs font-medium uppercase tracking-[0.45em] text-[var(--primary)] @3xl:block">
            <F f="headline">{data.headline}</F>
          </p>
          <h1 className="tpl-heading mt-0 text-balance break-words @3xl:mt-6">
            <span className="tpl-rise block text-[2.75rem] leading-[1.05] @md:text-6xl @3xl:text-7xl" style={d(350)}>
              <F f="groom.name">{g}</F>
            </span>
            <span className="tpl-script tpl-rise my-1 block text-3xl text-[var(--primary)] @3xl:my-2 @3xl:text-4xl" style={d(500)}>
              &
            </span>
            <span className="tpl-rise block text-[2.75rem] leading-[1.05] @md:text-6xl @3xl:text-7xl" style={d(650)}>
              <F f="bride.name">{b}</F>
            </span>
          </h1>
          <div className="tpl-rise mx-auto mt-6 h-px w-16 bg-[var(--primary)]/50 @3xl:mx-0" style={d(800)} aria-hidden />
          {date && (
            <p data-tf="weddingDate" className="tpl-rise mt-5 text-sm uppercase tracking-[0.3em]" style={d(900)}>
              {date.weekday} · {date.day}.{date.month}.{date.year}
              {date.time ? <span className="mt-1 block text-[0.8em] tracking-[0.25em] opacity-75">{date.time}</span> : null}
            </p>
          )}
          {guestName && (
            <p className="tpl-rise mt-8 text-sm" style={d(1100)}>
              <span className="block text-[11px] uppercase tracking-[0.35em] opacity-70">Trân trọng kính mời</span>
              <span className="tpl-heading mt-1 block break-words text-xl">{guestName}</span>
            </p>
          )}
        </div>

        <div className="@3xl:col-span-2">
          <Cue />
        </div>
      </div>
    </header>
  );
}
