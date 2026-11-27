"use client";

import { FramedImg } from "@/components/FramedImg";
import type { ImgFrame } from "@/lib/imageFrame";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/templates/icons";

type Page = { url: string; frame?: ImgFrame | null } | null;

/**
 * Album lật trang: bìa đứng một mình bên phải, sau đó từng cặp trang trải đôi, cuối cùng là bìa sau.
 * Lật bằng nút, phím ←/→ hoặc vuốt. Màn hình hẹp (hoặc `single`) hiện từng trang một.
 */
export function FlipBook({ pages, frames, ratio, title, single = false }: { pages: string[]; frames?: (ImgFrame | null)[]; ratio: number; title: string; single?: boolean }) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const oneUp = single || narrow;

  // Trải đôi: [trống, bìa], [2, 3], [4, 5]… ; trang lẻ cuối đứng bên trái.
  const spreads = useMemo<Page[][]>(() => {
    const p = pages.map((url, i) => ({ url, frame: frames?.[i] ?? null }));
    if (oneUp) return p.map((x) => [x]);
    const out: Page[][] = [[null, p[0] ?? null]];
    for (let i = 1; i < p.length; i += 2) out.push([p[i], p[i + 1] ?? null]);
    return out;
  }, [pages, oneUp]);

  const [at, setAt] = useState(0);
  const [flip, setFlip] = useState<{ dir: 1 | -1; to: number } | null>(null);
  const touchX = useRef<number | null>(null);
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  useEffect(() => setAt(0), [spreads.length]);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (flip) return;
      const to = at + dir;
      if (to < 0 || to >= spreads.length) return;
      if (oneUp || reduced.current) return setAt(to);
      setFlip({ dir, to });
    },
    [at, flip, spreads.length, oneUp],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Tải trước trải kế tiếp.
  useEffect(() => {
    spreads[at + 1]?.forEach((p) => p && (new Image().src = p.url));
  }, [at, spreads]);

  const cur = spreads[at] ?? [];
  // Khi đang lật: nửa đứng yên hiện trang của trải đích ở phía tờ giấy rời đi.
  const target = flip ? spreads[flip.to] : null;
  const left = flip?.dir === -1 && target ? target[0] : cur[0];
  const right = flip?.dir === 1 && target ? target[1] : cur[1];
  const pageW = oneUp ? 100 : 50;

  const face = (p: Page | undefined, side: "l" | "r" | "one") =>
    p ? (
      <FramedImg src={p.url} frame={p.frame} className="pointer-events-none h-full w-full select-none" />
    ) : (
      <div className={`h-full w-full ${side === "one" ? "" : "bg-[#efe9e1]"}`} />
    );

  const label = oneUp ? `Trang ${at + 1} / ${spreads.length}` : at === 0 ? "Bìa" : at === spreads.length - 1 && !cur[1] ? "Trang cuối" : `Trải ${at} / ${spreads.length - 1}`;

  return (
    <div className="select-none">
      <div
        className="relative mx-auto w-full"
        style={{ aspectRatio: `${oneUp ? ratio : ratio * 2}`, maxHeight: "72svh", maxWidth: `calc(72svh * ${oneUp ? ratio : ratio * 2})`, perspective: "2400px" }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
        role="group"
        aria-roledescription="album lật trang"
        aria-label={`${title}. ${label}`}
      >
        {oneUp ? (
          <div key={at} className="tpl-rise absolute inset-0 overflow-hidden rounded-sm bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,.45)]" style={{ animationDuration: ".45s" }}>
            {face(cur[0], "one")}
          </div>
        ) : (
          <>
            <div className="absolute inset-y-0 left-0 overflow-hidden rounded-l-sm shadow-[0_30px_60px_-20px_rgba(0,0,0,.45)]" style={{ width: `${pageW}%`, visibility: left ? "visible" : "hidden" }}>
              {face(left, "l")}
              <span className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/25 to-transparent" aria-hidden />
            </div>
            <div className="absolute inset-y-0 right-0 overflow-hidden rounded-r-sm shadow-[0_30px_60px_-20px_rgba(0,0,0,.45)]" style={{ width: `${pageW}%`, visibility: right ? "visible" : "hidden" }}>
              {face(right, "r")}
              <span className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/20 to-transparent" aria-hidden />
            </div>

            {flip && target && (
              <div
                className="absolute inset-y-0 z-10"
                style={{
                  width: "50%",
                  left: flip.dir === 1 ? "50%" : 0,
                  transformOrigin: flip.dir === 1 ? "left center" : "right center",
                  transformStyle: "preserve-3d",
                  animation: `${flip.dir === 1 ? "tcw-flip-next" : "tcw-flip-prev"} .8s cubic-bezier(.45,.05,.25,1) forwards`,
                }}
                onAnimationEnd={() => {
                  setAt(flip.to);
                  setFlip(null);
                }}
              >
                <div className="absolute inset-0 overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
                  {face(flip.dir === 1 ? cur[1] : cur[0], flip.dir === 1 ? "r" : "l")}
                </div>
                <div className="absolute inset-0 overflow-hidden" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                  {face(flip.dir === 1 ? target[0] : target[1], flip.dir === 1 ? "l" : "r")}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button type="button" onClick={() => go(-1)} disabled={at === 0} aria-label="Trang trước" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 text-white transition hover:border-white disabled:opacity-30">
          <Icon name="left" size={22} />
        </button>
        <p className="min-w-28 text-center text-sm tabular-nums text-white/70" aria-live="polite">
          {label}
        </p>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={at >= spreads.length - 1}
          aria-label="Trang sau"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 text-white transition hover:border-white disabled:opacity-30"
        >
          <Icon name="right" size={22} />
        </button>
      </div>
      <style>{`
        @keyframes tcw-flip-next { from { transform: rotateY(0deg) } to { transform: rotateY(-180deg) } }
        @keyframes tcw-flip-prev { from { transform: rotateY(0deg) } to { transform: rotateY(180deg) } }
      `}</style>
    </div>
  );
}
