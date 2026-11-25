"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/templates/icons";
import { FlipBook } from "./FlipBook";

export type SampleCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  styleLabel: string;
  sizeLabel: string;
  ratio: number;
  single: boolean;
  cover: string;
  pages: string[];
};

/** Lưới album mẫu; bấm một album để lật xem trong hộp thoại. `#<slug>` trên URL mở sẵn album đó. */
export function SampleGallery({ albums }: { albums: SampleCard[] }) {
  const [open, setOpen] = useState<SampleCard | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fromHash = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      const a = albums.find((x) => x.slug === slug);
      if (a) setOpen(a);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [albums]);

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(null);
    if (window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);
    trigger.current?.focus();
  }

  return (
    <>
      <ul className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={(e) => {
                trigger.current = e.currentTarget;
                setOpen(a);
                history.replaceState(null, "", `#${a.slug}`);
              }}
              className="group block w-full text-left focus-visible:outline-none"
            >
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#e9e2d8] p-8">
                <div
                  className="relative h-full max-w-full shadow-[12px_18px_30px_-12px_rgba(0,0,0,.45)] transition duration-700 group-hover:-rotate-1 group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
                  style={{ aspectRatio: `${a.ratio}` }}
                >
                  {a.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                  <span className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/30 to-transparent" aria-hidden />
                </div>
                <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#1d1a17]">{a.pages.length} trang</span>
                <span className="absolute inset-0 ring-inset ring-[#7b2d26] group-focus-visible:ring-4" aria-hidden />
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7b2d26]">{[a.styleLabel, a.sizeLabel].filter(Boolean).join(" · ")}</p>
              <h3 className="font-serif-display mt-1 text-3xl text-[#1d1a17]">{a.title}</h3>
              {a.description && <p className="mt-1 line-clamp-2 text-zinc-600">{a.description}</p>}
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7b2d26]">
                Lật xem album
                <Icon name="arrow" size={16} className="transition group-hover:translate-x-1" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={`Album mẫu ${open.title}`} className="fixed inset-0 z-50 flex flex-col bg-[#120f0d] text-white">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">{[open.styleLabel, open.sizeLabel].filter(Boolean).join(" · ")}</p>
              <p className="font-serif-display truncate text-2xl">{open.title}</p>
            </div>
            <button ref={closeBtn} type="button" onClick={close} aria-label="Đóng" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
              <Icon name="x" size={24} />
            </button>
          </div>
          <div className="flex flex-1 flex-col justify-center overflow-y-auto px-4 pb-6 sm:px-10">
            <FlipBook pages={open.pages} ratio={open.ratio} title={open.title} single={open.single} />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/10 px-4 py-4">
            <p className="text-sm text-white/60">Muốn album như thế này bằng ảnh của hai bạn?</p>
            <Link href={`/?goi=album#lien-he`} onClick={() => setOpen(null)} className="inline-flex min-h-11 items-center rounded-full bg-[#efe7dc] px-5 text-sm font-semibold text-[#1d1a17] hover:bg-white">
              Đặt làm album
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
