"use client";

import Link from "next/link";
import { useRef } from "react";
import { TemplateThumb } from "@/components/TemplateThumb";
import { Icon } from "@/templates/icons";

type T = { id: string; name: string; category: string; isPremium: boolean; layoutName: string };

/** Dải mẫu thiệp trượt ngang có snap + nút điều hướng. */
export function TemplateRail({ templates }: { templates: T[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 300, behavior: "smooth" });
  return (
    <div>
      <div ref={ref} className="tpl-noscroll flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-[max(1rem,calc((100vw-72rem)/2))]">
        {templates.map((t) => (
          <Link
            key={t.id}
            href={`/templates/${t.id}`}
            className="group w-[260px] shrink-0 snap-start focus-visible:outline-none"
          >
            <div className="relative overflow-hidden rounded-[24px] bg-white shadow-[0_25px_50px_-30px_rgba(22,20,26,.45)] ring-1 ring-black/5 transition duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_35px_60px_-30px_rgba(22,20,26,.55)] group-focus-visible:ring-2 group-focus-visible:ring-[#7b2d26]">
              <TemplateThumb templateId={t.id} height={420} />
              {t.isPremium && (
                <span className="absolute left-3 top-3 rounded-full bg-[#1d1a17]/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d8cdbf] backdrop-blur">
                  Premium
                </span>
              )}
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-2 px-1">
              <h3 className="font-serif-display text-2xl italic leading-none">{t.name}</h3>
              <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{t.category}</span>
            </div>
            <p className="mt-1 px-1 text-xs text-zinc-500">Bố cục {t.layoutName}</p>
          </Link>
        ))}
      </div>
      <div className="mx-auto mt-6 flex max-w-6xl justify-end gap-2 px-4">
        <button type="button" onClick={() => scroll(-1)} aria-label="Mẫu trước" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-zinc-300 transition hover:bg-[#1d1a17] hover:text-white">
          <Icon name="left" />
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label="Mẫu tiếp theo" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-zinc-300 transition hover:bg-[#1d1a17] hover:text-white">
          <Icon name="right" />
        </button>
      </div>
    </div>
  );
}
