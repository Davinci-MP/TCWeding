"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { FrameShape, LayoutFamily, Ornament, TemplateDef } from "./registry";
import { frameAttrs, type FrameMap } from "@/lib/imageFrame";
import { Reveal } from "./motion";

/** Đánh dấu một ô nội dung để áp kiểu chữ riêng của ô (font/cỡ chữ, xem src/lib/fieldTypo.ts). */
export function F({ f, children }: { f: string; children: ReactNode }) {
  return <span data-tf={f}>{children}</span>;
}

const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function formatDate(value: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: d,
    day: pad(d.getDate()),
    month: pad(d.getMonth() + 1),
    monthEn: MONTHS_EN[d.getMonth()],
    year: String(d.getFullYear()),
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    weekday: WEEKDAYS[d.getDay()],
    short: `${pad(d.getDate())} . ${pad(d.getMonth() + 1)} . ${d.getFullYear()}`,
  };
}

/** Hình hoa sen vẽ bằng SVG, tâm đáy tại (x, y). Dùng trong <svg>. */
export function LotusShape({ x, y, size }: { x: number; y: number; size: number }) {
  const s = size / 20;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="currentColor">
      <path d="M0 0C-4-6-4-14 0-20 4-14 4-6 0 0z" />
      <path d="M0 0C-7-3-11-10-11-17-5-14-1-8 0 0z" opacity=".8" />
      <path d="M0 0C7-3 11-10 11-17 5-14 1-8 0 0z" opacity=".8" />
      <path d="M0 0C-9 0-16-4-19-10-11-10-4-6 0 0z" opacity=".6" />
      <path d="M0 0C9 0 16-4 19-10 11-10 4-6 0 0z" opacity=".6" />
    </g>
  );
}

export function OrnamentMark({ type, className = "" }: { type: Ornament; className?: string }) {
  const cls = `inline-block text-[var(--primary)] ${className}`;
  switch (type) {
    case "line":
      return (
        <svg className={cls} width="160" height="16" viewBox="0 0 160 16" fill="none" aria-hidden>
          <path d="M0 8h66M94 8h66" stroke="currentColor" strokeWidth="1" />
          <path d="M80 1l7 7-7 7-7-7z" stroke="currentColor" fill="none" />
          <circle cx="80" cy="8" r="2" fill="currentColor" />
        </svg>
      );
    case "songhy":
      return (
        <svg className={cls} width="150" height="28" viewBox="0 0 150 28" fill="none" aria-hidden>
          <path d="M0 14h55M95 14h55" stroke="currentColor" />
          <circle cx="75" cy="14" r="13" stroke="currentColor" />
          <text x="75" y="20" textAnchor="middle" fontSize="16" fill="currentColor" fontWeight="700">
            囍
          </text>
        </svg>
      );
    case "leaf":
      return (
        <svg className={cls} width="120" height="24" viewBox="0 0 120 24" fill="none" aria-hidden>
          <path d="M0 12h40M80 12h40" stroke="currentColor" strokeWidth="1" />
          <path d="M60 2c-8 4-12 10-12 10s6 1 12-4c6 5 12 4 12 4s-4-6-12-10z" fill="currentColor" opacity=".8" />
          <path d="M60 22V8" stroke="currentColor" />
        </svg>
      );
    case "star":
      return (
        <svg className={cls} width="120" height="20" viewBox="0 0 120 20" fill="none" aria-hidden>
          <path d="M0 10h44M76 10h44" stroke="currentColor" strokeWidth=".8" />
          <path d="M60 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="currentColor" />
        </svg>
      );
    case "heart":
      return (
        <svg className={cls} width="120" height="20" viewBox="0 0 120 20" fill="none" aria-hidden>
          <path d="M0 10h44M76 10h44" stroke="currentColor" strokeWidth=".8" />
          <path d="M60 16c-6-4-9-6.5-9-9.5a4 4 0 0 1 9-2 4 4 0 0 1 9 2c0 3-3 5.5-9 9.5z" fill="currentColor" />
        </svg>
      );
    case "lotus":
      return (
        <svg className={cls} width="140" height="28" viewBox="0 0 140 28" fill="none" aria-hidden>
          <path d="M0 22h46M94 22h46" stroke="currentColor" />
          <LotusShape x={70} y={24} size={20} />
        </svg>
      );
    case "wave":
      return (
        <svg className={cls} width="140" height="16" viewBox="0 0 140 16" fill="none" aria-hidden>
          <path d="M0 8c10-8 20-8 30 0s20 8 30 0 20-8 30 0 20 8 30 0 10-6 20-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "blossom":
      return (
        <svg className={cls} width="150" height="26" viewBox="0 0 150 26" fill="none" aria-hidden>
          <path d="M0 13h52M98 13h52" stroke="currentColor" strokeWidth=".8" />
          <path d="M60 18c6-2 12-8 15-14M75 4c3 6 9 12 15 14" stroke="currentColor" strokeWidth="1" />
          {[
            [75, 13, 6],
            [62, 17, 3.5],
            [88, 17, 3.5],
          ].map(([x, y, r]) => (
            <g key={x} transform={`translate(${x} ${y})`} fill="currentColor">
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx="0" cy={-r * 0.6} rx={r * 0.45} ry={r * 0.6} transform={`rotate(${a})`} opacity=".85" />
              ))}
            </g>
          ))}
        </svg>
      );
    case "deco":
      return (
        <svg className={cls} width="160" height="24" viewBox="0 0 160 24" fill="none" aria-hidden>
          <path d="M0 12h56M104 12h56M0 8h40M120 8h40M0 16h40M120 16h40" stroke="currentColor" strokeWidth="1" />
          <path d="M80 0l12 12-12 12-12-12z" stroke="currentColor" />
          <path d="M80 6l6 6-6 6-6-6z" fill="currentColor" />
        </svg>
      );
    case "laurel":
      return (
        <svg className={cls} width="150" height="26" viewBox="0 0 150 26" fill="none" aria-hidden>
          <path d="M0 13h45M105 13h45" stroke="currentColor" strokeWidth=".8" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <ellipse cx={58 + i * 4} cy={16 - i * 3} rx="2" ry="5" fill="currentColor" transform={`rotate(${50 - i * 15} ${58 + i * 4} ${16 - i * 3})`} />
              <ellipse cx={92 - i * 4} cy={16 - i * 3} rx="2" ry="5" fill="currentColor" transform={`rotate(${-50 + i * 15} ${92 - i * 4} ${16 - i * 3})`} />
            </g>
          ))}
          <circle cx="75" cy="13" r="2.5" fill="currentColor" />
        </svg>
      );
    case "sprig":
      return (
        <svg className={cls} width="130" height="24" viewBox="0 0 130 24" fill="none" aria-hidden>
          <path d="M0 12h40M90 12h40M45 12h40" stroke="currentColor" strokeWidth=".8" />
          {[52, 62, 72].map((x, i) => (
            <ellipse key={x} cx={x} cy={i % 2 ? 16 : 8} rx="5" ry="2.2" fill="currentColor" opacity=".8" transform={`rotate(${i % 2 ? 25 : -25} ${x} ${i % 2 ? 16 : 8})`} />
          ))}
          <circle cx="84" cy="12" r="3.2" fill="currentColor" />
        </svg>
      );
    case "enso":
      return (
        <svg className={cls} width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
          <path d="M20 4C10 4 4 11 4 20s7 16 16 16 16-7 16-15c0-6-4-11-10-14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return <span className="inline-block h-px w-16 bg-[var(--text)] opacity-30" aria-hidden />;
  }
}

/** Mẫu đang hiển thị — để các thành phần con chọn đúng hệ bố cục. */
export const TplContext = createContext<TemplateDef | null>(null);
/** Cách căn ảnh thủ công của thiệp (data.frames, khoá theo vị trí). Img đọc theo prop fk. */
export const FramesContext = createContext<FrameMap>({});
export const useLayout = (): LayoutFamily => useContext(TplContext)?.layout ?? "classic";

/** Tiêu đề mục — mỗi hệ bố cục có cách trình bày riêng. */
export function SectionTitle({
  tpl,
  title,
  eyebrow,
  intro,
  light,
}: {
  tpl: TemplateDef;
  title: string;
  eyebrow?: string;
  intro?: string;
  light?: boolean;
}) {
  const muted = light ? "opacity-75" : "text-[var(--muted)]";
  const accent = light ? "" : "text-[var(--primary)]";

  if (tpl.layout === "editorial")
    return (
      <Reveal className="mb-12 grid gap-4 border-t border-current/20 pt-6 text-left @3xl:mb-16 @3xl:grid-cols-[1fr_2fr] @3xl:gap-10">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.4em] ${accent}`}>{eyebrow}</p>
        <div>
          <h2
            className={`tpl-heading text-5xl leading-[0.95] @3xl:text-7xl ${tpl.headingUppercase ? "uppercase tracking-tight" : ""}`}
            style={{ textWrap: "balance" }}
          >
            {title}
          </h2>
          {intro && <p className={`mt-5 max-w-md leading-relaxed ${muted}`}>{intro}</p>}
        </div>
      </Reveal>
    );

  if (tpl.layout === "romantic")
    return (
      <Reveal className="mx-auto mb-12 max-w-xl text-center @3xl:mb-16">
        {eyebrow && <p className={`text-[11px] uppercase tracking-[0.45em] ${muted}`}>{eyebrow}</p>}
        <h2 className={`tpl-script mt-2 text-5xl leading-tight @3xl:text-6xl ${accent}`} style={{ textWrap: "balance" }}>
          {title}
        </h2>
        <svg className={`mx-auto mt-4 h-5 w-24 ${accent}`} viewBox="0 0 96 20" fill="none" aria-hidden>
          <path d="M0 10c16 0 22-8 34-8 8 0 10 8 14 8s6-8 14-8c12 0 18 8 34 8" stroke="currentColor" strokeWidth="1" />
        </svg>
        {intro && <p className={`mx-auto mt-4 max-w-md leading-relaxed ${muted}`}>{intro}</p>}
      </Reveal>
    );

  if (tpl.layout === "heritage")
    return (
      <Reveal className="mx-auto mb-12 max-w-xl text-center @3xl:mb-16">
        <div className={`relative inline-block border-y-[3px] border-double px-8 py-4 ${light ? "border-current/50" : "border-[var(--primary)]/60"}`}>
          {["-left-1.5 -top-1.5", "-right-1.5 -top-1.5", "-left-1.5 -bottom-1.5", "-right-1.5 -bottom-1.5"].map((c) => (
            <span key={c} className={`absolute h-3 w-3 rotate-45 border ${light ? "border-current" : "border-[var(--primary)]"} ${c}`} aria-hidden />
          ))}
          {eyebrow && <p className={`text-[11px] uppercase tracking-[0.45em] ${muted}`}>{eyebrow}</p>}
          <h2 className="tpl-heading mt-1 text-3xl uppercase tracking-[0.18em] @3xl:text-4xl" style={{ textWrap: "balance" }}>
            {title}
          </h2>
        </div>
        <div className="mt-5">
          <OrnamentMark type={tpl.ornament} className={light ? "!text-current opacity-70" : ""} />
        </div>
        {intro && <p className={`mx-auto mt-4 max-w-md leading-relaxed ${muted}`}>{intro}</p>}
      </Reveal>
    );

  if (tpl.layout === "luxe")
    return (
      <Reveal variant="blur" className="mx-auto mb-14 max-w-2xl text-center @3xl:mb-20">
        <span className={`mx-auto block h-14 w-px ${light ? "bg-current/50" : "bg-[var(--primary)]/70"}`} aria-hidden />
        {eyebrow && (
          <p className={`mt-5 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.6em] ${accent}`}>
            <span className="h-px w-8 bg-current/60" aria-hidden />
            {eyebrow}
            <span className="h-px w-8 bg-current/60" aria-hidden />
          </p>
        )}
        <h2 className={`tpl-heading mt-4 text-5xl italic leading-[1.05] @3xl:text-6xl ${tpl.headingUppercase ? "not-italic uppercase tracking-[0.14em] text-4xl @3xl:text-5xl" : ""}`} style={{ textWrap: "balance" }}>
          {title}
        </h2>
        {intro && <p className={`mx-auto mt-6 max-w-md text-sm leading-loose ${muted}`}>{intro}</p>}
      </Reveal>
    );

  if (tpl.layout === "modern")
    return (
      <Reveal className="mb-10 flex flex-col gap-5 @3xl:mb-14 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        <div>
          {eyebrow && (
            <span className={`inline-block rounded-full px-4 py-1.5 text-xs font-semibold ${light ? "bg-white/15" : "bg-[var(--accent)] text-[var(--text)]"}`}>
              {eyebrow}
            </span>
          )}
          <h2 className="tpl-heading mt-4 text-4xl font-bold leading-[1] tracking-tight @3xl:text-6xl" style={{ textWrap: "balance" }}>
            {title}
          </h2>
        </div>
        {intro && <p className={`max-w-xs text-sm leading-relaxed @3xl:text-right ${muted}`}>{intro}</p>}
      </Reveal>
    );

  if (tpl.layout === "journal")
    return (
      <Reveal className="mx-auto mb-12 max-w-xl text-center @3xl:mb-16">
        {eyebrow && (
          <span
            className="inline-block -rotate-2 px-5 py-1 text-xs uppercase tracking-[0.25em] text-[var(--text)]"
            style={{ background: "color-mix(in srgb, var(--accent) 85%, transparent)", clipPath: "polygon(2% 0,98% 6%,100% 94%,0 100%)" }}
          >
            {eyebrow}
          </span>
        )}
        <h2 className={`tpl-heading mt-4 text-4xl leading-tight @3xl:text-5xl ${light ? "" : "text-[var(--text)]"}`} style={{ textWrap: "balance" }}>
          {title}
        </h2>
        <svg className={`mx-auto mt-2 h-4 w-44 ${accent}`} viewBox="0 0 176 16" fill="none" aria-hidden>
          <path d="M3 10c30-7 58-7 86-3s56 5 84-4M20 13c40-4 90-5 140-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {intro && <p className={`mx-auto mt-4 max-w-md leading-relaxed ${muted}`}>{intro}</p>}
      </Reveal>
    );

  if (tpl.layout === "zen")
    return (
      <Reveal variant="blur" className="mb-14 grid grid-cols-[auto_1fr] items-start gap-6 @3xl:mb-20 @3xl:gap-10">
        <div className="flex flex-col items-center gap-3 pt-2">
          <span className={`h-3 w-3 ${light ? "bg-current" : "bg-[var(--primary)]"}`} aria-hidden />
          {eyebrow && (
            <span className={`text-[10px] uppercase tracking-[0.5em] ${muted}`} style={{ writingMode: "vertical-rl" }}>
              {eyebrow}
            </span>
          )}
        </div>
        <div className="border-l border-current/15 pl-6 @3xl:pl-10">
          <h2 className="tpl-heading text-4xl font-light leading-[1.15] @3xl:text-6xl" style={{ textWrap: "balance" }}>
            {title}
          </h2>
          {intro && <p className={`mt-5 max-w-sm text-sm leading-loose ${muted}`}>{intro}</p>}
        </div>
      </Reveal>
    );

  return (
    <Reveal className="mx-auto mb-12 max-w-xl text-center @3xl:mb-16">
      {eyebrow && <p className={`tpl-script text-2xl @3xl:text-3xl ${light ? "" : "text-[var(--primary)]"}`}>{eyebrow}</p>}
      <h2
        className={`tpl-heading mt-1 text-[2.1rem] leading-tight @3xl:text-5xl ${
          tpl.headingUppercase ? "text-[1.6rem] font-semibold uppercase tracking-[0.22em] @3xl:text-4xl" : ""
        }`}
        style={{ textWrap: "balance" }}
      >
        {title}
      </h2>
      <div className="mt-5">
        <OrnamentMark type={tpl.ornament} className={light ? "!text-current opacity-70" : ""} />
      </div>
      {intro && <p className={`mx-auto mt-5 max-w-md leading-relaxed ${light ? "opacity-80" : "text-[var(--muted)]"}`}>{intro}</p>}
    </Reveal>
  );
}

export function Section({
  children,
  tone = "plain",
  id,
  className = "",
  wide,
}: {
  children: ReactNode;
  tone?: "plain" | "surface" | "hero";
  id?: string;
  className?: string;
  wide?: boolean;
}) {
  const layout = useLayout();
  const bg =
    tone === "surface" ? "bg-[var(--surface)]" : tone === "hero" ? "bg-[var(--hero-bg)] text-[var(--hero-text)]" : "";
  const inner = `relative mx-auto ${wide ? "max-w-6xl" : "max-w-4xl"}`;
  const pad = layout === "zen" ? "py-24 @3xl:py-40" : layout === "modern" ? "py-16 @3xl:py-24" : "py-20 @3xl:py-28";
  return (
    <section id={id} className={`relative scroll-mt-4 overflow-hidden px-5 ${pad} ${bg} ${className}`}>
      {/* Lãng mạn: vệt màu loang mềm ở góc */}
      {layout === "romantic" && tone !== "hero" && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(40% 35% at 0% 0%, color-mix(in srgb, var(--primary) 9%, transparent), transparent 70%), radial-gradient(35% 30% at 100% 100%, color-mix(in srgb, var(--accent) 60%, transparent), transparent 70%)",
          }}
          aria-hidden
        />
      )}
      {/* Sổ tay: giấy kẻ dòng */}
      {layout === "journal" && tone !== "hero" && (
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0 31px, color-mix(in srgb, var(--primary) 12%, transparent) 31px 32px)",
          }}
          aria-hidden
        />
      )}
      {/* Sang trọng: góc khung mảnh */}
      {layout === "luxe" &&
        ["left-4 top-4 border-l border-t", "right-4 top-4 border-r border-t", "left-4 bottom-4 border-l border-b", "right-4 bottom-4 border-r border-b"].map((c) => (
          <span key={c} className={`pointer-events-none absolute h-10 w-10 border-[var(--primary)]/45 @3xl:h-16 @3xl:w-16 ${c}`} aria-hidden />
        ))}
      {layout === "heritage" ? (
        // Di sản: khung viền đôi như trang thiệp in
        <div className={`${inner} border border-current/15 px-4 py-14 outline outline-1 outline-offset-[6px] outline-current/10 @3xl:px-12`}>
          {children}
        </div>
      ) : (
        <div className={inner}>{children}</div>
      )}
    </section>
  );
}

/**
 * Ảnh: hiện mờ dần khi tải xong, có nền giữ chỗ để tránh giật layout.
 * fk: khoá vị trí trong data.frames (cách căn thủ công). Có thiết lập → khung .tcw-frame (thu phóng, lấp đầy /
 * hiện toàn bộ, căn riêng trên điện thoại); chưa có → như cũ (object-cover + position).
 */
export function Img({
  src,
  alt,
  className = "",
  eager,
  position,
  style,
  fk,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  position?: string;
  style?: CSSProperties;
  fk?: string;
}) {
  const frames = useContext(FramesContext);
  const frame = fk ? frames[fk] : undefined;
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  // Ảnh trong HTML có sẵn (SSR) có thể tải xong trước khi React gắn onLoad: kiểm tra lại sau khi mount để ảnh không bị
  // kẹt ở opacity 0.
  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) setLoaded(true);
  }, [src]);
  if (!src)
    return (
      <div className={`flex items-center justify-center bg-[var(--accent)] text-[var(--muted)] ${className}`}>
        <span className="text-xs">Chưa có ảnh</span>
      </div>
    );
  const imgEl = (extra?: { className?: string; style?: CSSProperties; fk?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-fk={extra?.fk}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => setLoaded(true)}
      ref={(el) => {
        imgRef.current = el;
        if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true);
      }}
      style={extra?.style}
      className={extra?.className}
    />
  );
  if (frame) {
    const a = frameAttrs(frame, "container");
    return (
      <span data-fk={fk} className={`tcw-frame bg-[var(--accent)] ${className}`} style={{ ...style, ...a.style }} data-m={a["data-m"]}>
        {imgEl({ className: `transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}` })}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-fk={fk}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => setLoaded(true)}
      ref={(el) => {
        imgRef.current = el;
        if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true);
      }}
      style={position || style ? { objectPosition: position, ...style } : undefined}
      className={`bg-[var(--accent)] object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
    />
  );
}

/** Khung ảnh chân dung theo kiểu của mẫu. */
export function Frame({
  shape,
  src,
  alt,
  className = "",
  caption,
  fk,
}: {
  shape: FrameShape;
  src: string;
  alt: string;
  className?: string;
  caption?: string;
  fk?: string;
}) {
  if (shape === "polaroid")
    return (
      <figure className={`bg-white p-3 pb-12 shadow-[0_18px_40px_-18px_rgba(0,0,0,.35)] ${className}`}>
        <Img fk={fk} src={src} alt={alt} className="aspect-[4/5] w-full" />
        {caption && <figcaption className="tpl-script mt-3 text-center text-xl text-[var(--muted)]">{caption}</figcaption>}
      </figure>
    );
  const clip: Record<Exclude<FrameShape, "polaroid">, string> = {
    arch: "rounded-t-full",
    circle: "rounded-full aspect-square",
    rounded: "rounded-[2rem]",
    rect: "",
    octagon: "",
  };
  const octa = shape === "octagon" ? { clipPath: "polygon(30% 0, 70% 0, 100% 14%, 100% 100%, 0 100%, 0 14%)" } : undefined;
  return (
    <div className={`relative ${className}`}>
      {/* đường viền lệch tạo chiều sâu */}
      <div
        className={`absolute inset-0 translate-x-3 translate-y-3 border border-[var(--primary)]/50 ${clip[shape]}`}
        style={octa}
        aria-hidden
      />
      <div className={`relative overflow-hidden ${clip[shape]}`} style={octa}>
        <Img fk={fk} src={src} alt={alt} className={`w-full transition duration-[1.2s] hover:scale-105 ${shape === "circle" ? "aspect-square" : "aspect-[3/4]"}`} />
      </div>
    </div>
  );
}
