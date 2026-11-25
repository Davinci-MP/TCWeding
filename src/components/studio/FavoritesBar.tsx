"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/templates/icons";
import { clearFavorites, removeFavorite, useFavorites } from "./favorites";

/** Thanh nổi ở cuối màn hình khi khách đã thả tim ảnh: xem lại, bỏ bớt và gửi cho studio. */
export function FavoritesBar() {
  const favs = useFavorites();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!favs.length) setOpen(false);
  }, [favs.length]);

  if (!favs.length) return null;

  return (
    <>
      <div data-site-chrome className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 print:hidden">
        <div className="flex items-center gap-1 rounded-full bg-[#1d1a17] p-1.5 pl-2 text-white shadow-2xl ring-1 ring-white/10">
          <button type="button" onClick={() => setOpen(true)} className="flex min-h-11 items-center gap-2 rounded-full px-3 text-sm hover:bg-white/10" aria-haspopup="dialog">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#e4574c" aria-hidden>
              <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2 0 3.6 1.1 5.4 3.2 1.8-2.1 3.4-3.2 5.4-3.2 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z" />
            </svg>
            <span>
              <strong className="tabular-nums">{favs.length}</strong> ảnh đã thích
            </span>
          </button>
          <Link href="/#lien-he" className="flex min-h-11 items-center gap-1.5 rounded-full bg-[#efe7dc] px-4 text-sm font-semibold text-[#1d1a17] transition hover:bg-white">
            Gửi cho studio
            <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Ảnh đã thích"
            className="max-h-[85svh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 outline-none sm:rounded-3xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif-display text-3xl text-[#1d1a17]">Ảnh đã thích</h2>
                <p className="mt-1 text-sm text-zinc-500">Gửi kèm yêu cầu tư vấn để studio biết concept hai bạn thích. Danh sách lưu trên máy này.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-zinc-100">
                <Icon name="x" size={22} />
              </button>
            </div>
            <ul className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {favs.map((f) => (
                <li key={f.url} className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-[11px] text-white">{f.albumTitle}</span>
                  <button
                    type="button"
                    onClick={() => removeFavorite(f.url)}
                    aria-label={`Bỏ thích ảnh trong album ${f.albumTitle}`}
                    className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow hover:bg-white"
                  >
                    <Icon name="x" size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => confirm("Bỏ thích tất cả ảnh?") && clearFavorites()} className="min-h-11 text-sm text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline">
                Bỏ thích tất cả
              </button>
              <Link href="/#lien-he" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#7b2d26] px-6 font-semibold text-white transition hover:bg-[#5f221d]">
                Gửi cho studio
                <Icon name="arrow" size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
