"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/templates/icons";

type Photo = { id: string; url: string; width: number; height: number };

/** Lưới ảnh kiểu tạp chí (masonry bằng CSS columns) + xem ảnh lớn: phím ←/→/Esc, vuốt trên điện thoại. */
export function PhotoWall({ photos, title }: { photos: Photo[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);

  const go = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);
  const close = useCallback(() => {
    setOpen(null);
    lastTrigger.current?.focus();
  }, []);

  useEffect(() => {
    if (open === null) return;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go, close]);

  // Tải trước ảnh kế tiếp để chuyển ảnh không bị chờ.
  useEffect(() => {
    if (open === null || photos.length < 2) return;
    new Image().src = photos[(open + 1) % photos.length].url;
  }, [open, photos]);

  const current = open === null ? null : photos[open];

  return (
    <>
      <ul className="columns-1 gap-3 sm:columns-2 lg:columns-3 [&>li]:mb-3">
        {photos.map((p, i) => (
          <li key={p.id} className="break-inside-avoid">
            <button
              type="button"
              onClick={(e) => {
                lastTrigger.current = e.currentTarget;
                setOpen(i);
              }}
              className="group block w-full cursor-zoom-in overflow-hidden bg-[#e9e2d8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7b2d26]/50"
              aria-label={`Xem ảnh ${i + 1} trên ${photos.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                width={p.width || undefined}
                height={p.height || undefined}
                loading={i < 3 ? "eager" : "lazy"}
                className="h-auto w-full transition duration-700 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      {current && open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — ảnh ${open + 1} trên ${photos.length}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#120f0d]/96"
          onClick={(e) => e.target === e.currentTarget && close()}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={current.id} src={current.url} alt={`${title} — ảnh ${open + 1}`} className="tpl-rise max-h-[88svh] max-w-[94vw] object-contain" style={{ animationDuration: ".5s" }} />
          <p className="absolute left-4 top-4 text-sm tabular-nums text-white/60" aria-live="polite">
            {open + 1} / {photos.length}
          </p>
          <button ref={closeRef} type="button" onClick={close} aria-label="Đóng" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
            <Icon name="x" size={24} />
          </button>
          {photos.length > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Ảnh trước" className="absolute left-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white sm:flex">
                <Icon name="left" size={28} />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Ảnh sau" className="absolute right-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white sm:flex">
                <Icon name="right" size={28} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
