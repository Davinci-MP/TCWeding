"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { EffectKind } from "@/lib/invitation";

/** live = thiệp thật, preview = trình chỉnh sửa, thumb = ảnh thu nhỏ trong kho mẫu (tắt chuyển động). */
export type ViewMode = "live" | "demo" | "preview" | "thumb";
export const isImmersive = (m: ViewMode) => m === "live" || m === "demo";
export const ModeContext = createContext<ViewMode>("live");
export const useMode = () => useContext(ModeContext);

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/* ---------------- Hiện dần khi cuộn tới ---------------- */
type RevealVariant = "up" | "left" | "right" | "zoom" | "blur";

export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "up",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  as?: "div" | "li" | "section" | "figure";
}) {
  const mode = useMode();
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(mode === "thumb");
  useEffect(() => {
    if (mode === "thumb") return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mode]);
  return (
    <Tag
      // @ts-expect-error ref đa hình
      ref={ref}
      data-v={variant}
      style={{ transitionDelay: `${delay}ms` }}
      className={`tpl-reveal ${shown ? "is-in" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}

/* ---------------- Parallax nhẹ (ảnh trôi chậm hơn nội dung) ---------------- */
export function Parallax({ children, speed = 0.15, className = "" }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mode = useMode();
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (mode === "thumb" || reduced) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.parentElement!.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      const progress = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
      el.style.transform = `translate3d(0, ${(-progress * speed * 100).toFixed(2)}%, 0) scale(${1 + speed})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    // capture: nhận cả sự kiện cuộn của khung xem trước trong trình chỉnh sửa
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [mode, reduced, speed]);
  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}

/* ---------------- Thanh tiến trình đọc ---------------- */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      if (ref.current) ref.current.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      ref={ref}
      className="fixed inset-x-0 top-0 z-40 h-[2px] origin-left bg-[var(--primary)]"
      style={{ transform: "scaleX(0)" }}
      aria-hidden
    />
  );
}

/* ---------------- Chữ chạy vô tận ---------------- */
export function Marquee({ children, duration = 40, className = "" }: { children: ReactNode; duration?: number; className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="tpl-marquee flex w-max" style={{ "--marquee-duration": `${duration}s` } as CSSProperties}>
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Hiệu ứng rơi (canvas, nhẹ, tự dừng khi tab ẩn) ---------------- */
type Particle = { x: number; y: number; r: number; vx: number; vy: number; rot: number; vr: number; a: number; c: string };

export function FallingEffect({ kind, color }: { kind: Exclude<EffectKind, "">; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mode = useMode();
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (kind === "none" || mode === "thumb" || reduced) return;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const count = kind === "stars" ? 46 : kind === "gold" ? 34 : 22;
    const palette =
      kind === "snow"
        ? ["#ffffff"]
        : kind === "gold"
          ? ["#e9c46a", "#f6dfa0", "#caa24a"]
          : kind === "stars"
            ? ["#fff6d8", "#ffffff"]
            : kind === "leaves"
              ? [color, "#9bb08d", "#c8b48a"]
              : [color, "#f7c9d2", "#fbe3e8"];
    const spawn = (initial: boolean): Particle => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : -20,
      r: kind === "stars" ? Math.random() * 1.6 + 0.4 : kind === "gold" ? Math.random() * 2.2 + 0.8 : Math.random() * 6 + 5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: kind === "stars" ? 0 : Math.random() * 0.5 + 0.35,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.02,
      a: Math.random() * 0.5 + 0.35,
      c: palette[Math.floor(Math.random() * palette.length)],
    });
    const ps = Array.from({ length: count }, () => spawn(true));
    let raf = 0;
    let t = 0;
    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.x += p.vx + Math.sin((t + p.y) / 90) * 0.25;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > h + 20 || p.x < -30 || p.x > w + 30) Object.assign(p, spawn(false));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        if (kind === "stars") {
          ctx.globalAlpha = p.a * (0.55 + 0.45 * Math.sin(t / 30 + p.x));
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (kind === "gold" || kind === "snow") {
          ctx.globalAlpha = p.a;
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (kind === "hearts") {
          ctx.globalAlpha = p.a * 0.8;
          const s = p.r / 8;
          ctx.scale(s, s);
          ctx.beginPath();
          ctx.moveTo(0, 3);
          ctx.bezierCurveTo(-8, -4, -4, -10, 0, -5);
          ctx.bezierCurveTo(4, -10, 8, -4, 0, 3);
          ctx.fill();
        } else {
          // cánh hoa / lá: hình elip lệch
          ctx.globalAlpha = p.a;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * (kind === "leaves" ? 0.45 : 0.6), p.r, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [kind, color, mode, reduced]);
  if (kind === "none" || mode === "thumb") return null;
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-30 h-full w-full" aria-hidden />;
}
