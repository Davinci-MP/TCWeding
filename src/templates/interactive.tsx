"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { isImmersive, Marquee, useMode, type ViewMode } from "./motion";
import { Img, useLayout } from "./parts";
import type { LayoutFamily } from "./registry";
import { getTrackUrl, silentUrl } from "./music/synth";
import type { MusicSource } from "./music/tracks";

export type WishItem = { id: string; name: string; message: string; createdAt: string };
export type { ViewMode };

/* ---------------- Đếm ngược ---------------- */
export function Countdown({ target, light }: { target: string; light?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = new Date(target).getTime();
  if (!target || Number.isNaN(end)) return null;
  const diff = Math.max(0, end - (now ?? end));
  const parts = [
    { v: Math.floor(diff / 86400000), l: "Ngày" },
    { v: Math.floor((diff / 3600000) % 24), l: "Giờ" },
    { v: Math.floor((diff / 60000) % 60), l: "Phút" },
    { v: Math.floor((diff / 1000) % 60), l: "Giây" },
  ];
  return (
    // 4 ô chia đều bề ngang (min-w-0) và cỡ số co theo khổ thiệp: font rộng (vd Cobalt Type) không lố khỏi màn 320px
    <div className="mx-auto flex w-full max-w-3xl items-stretch justify-center" role="timer" aria-label="Thời gian đến ngày cưới">
      {parts.map((p, i) => (
        <div key={p.l} className={`min-w-0 flex-1 px-1 text-center @md:px-3 @3xl:px-4 ${i ? `border-l ${light ? "border-current/25" : "border-[var(--primary)]/25"}` : ""}`}>
          <div className="tpl-heading text-[clamp(1.6rem,9cqi,2.25rem)] leading-tight tabular-nums @3xl:text-6xl" suppressHydrationWarning>
            {now === null ? "--" : String(p.v).padStart(2, "0")}
          </div>
          <div className={`mt-1 text-[11px] uppercase tracking-[0.2em] @md:tracking-[0.3em] ${light ? "opacity-70" : "text-[var(--muted)]"}`}>{p.l}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Nút theo mẫu ---------------- */
export function TplButton({
  className = "",
  variant = "solid",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" }) {
  return (
    <button
      {...rest}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold tracking-wide transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "solid"
          ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-[0_10px_30px_-12px_var(--primary)] hover:-translate-y-0.5"
          : "border border-current hover:bg-[var(--primary)] hover:text-[var(--on-primary)] hover:border-[var(--primary)]"
      } ${className}`}
    />
  );
}

/** Nút liên kết theo mẫu. light: đặt trên nền ảnh / nền tối (chữ trắng) để không chìm khi màu chủ đạo tối. */
export function TplLink({ href, icon, children, light }: { href: string; icon: IconName; children: ReactNode; light?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-5 py-2 text-sm transition focus-visible:outline-2 ${
        light
          ? "border-white/55 text-white hover:bg-white hover:text-[#15110f] focus-visible:outline-white"
          : "border-[var(--primary)]/40 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--on-primary)] focus-visible:outline-[var(--primary)]"
      }`}
    >
      <Icon name={icon} size={16} />
      {children}
    </a>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--muted)]/30 bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)]/70 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/15";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]";

/* ---------------- Xác nhận tham dự ---------------- */
export function RsvpForm({ slug, mode }: { slug: string; mode: ViewMode }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [attending, setAttending] = useState("YES");
  const disabled = mode !== "live";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled) return;
    const fd = new FormData(e.currentTarget);
    setState("sending");
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, ...Object.fromEntries(fd), attending }),
    });
    if (res.ok) setState("done");
    else {
      setError((await res.json().catch(() => ({})))?.error ?? "Chưa gửi được. Kiểm tra kết nối mạng rồi thử lại.");
      setState("error");
    }
  }

  if (state === "done")
    return (
      <div className="mx-auto max-w-lg rounded-3xl bg-[var(--surface)] p-10 text-center text-[var(--text)] shadow-xl" role="status">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--on-primary)]">
          <Icon name="check" size={26} />
        </div>
        <p className="tpl-script mt-4 text-4xl text-[var(--primary)]">Cảm ơn bạn!</p>
        <p className="mt-2 text-[var(--muted)]">Chúng mình đã nhận được phản hồi và rất mong được gặp bạn.</p>
      </div>
    );

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-lg space-y-5 rounded-3xl bg-[var(--surface)] p-6 text-left text-[var(--text)] shadow-[0_30px_80px_-30px_rgba(0,0,0,.35)] @3xl:p-10"
    >
      <div>
        <label htmlFor="rsvp-name" className={labelCls}>
          Họ và tên
        </label>
        <input id="rsvp-name" name="name" required maxLength={80} autoComplete="name" placeholder="Nguyễn Văn A" className={inputCls} />
      </div>
      <div>
        <label htmlFor="rsvp-phone" className={labelCls}>
          Số điện thoại <span className="normal-case tracking-normal opacity-70">(không bắt buộc)</span>
        </label>
        <input id="rsvp-phone" name="phone" type="tel" maxLength={20} autoComplete="tel" placeholder="09xx xxx xxx" className={inputCls} />
      </div>
      <fieldset>
        <legend className={labelCls}>Bạn sẽ đến chứ?</legend>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["YES", "Chắc chắn"],
            ["MAYBE", "Chưa chắc"],
            ["NO", "Rất tiếc"],
          ].map(([v, l]) => (
            <button
              type="button"
              key={v}
              aria-pressed={attending === v}
              onClick={() => setAttending(v)}
              className={`min-h-11 cursor-pointer rounded-xl border px-2 py-3 text-sm transition ${
                attending === v
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]"
                  : "border-[var(--muted)]/30 hover:border-[var(--primary)]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </fieldset>
      {attending !== "NO" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="rsvp-guests" className={labelCls}>
              Số người
            </label>
            <select id="rsvp-guests" name="guests" defaultValue="1" className={inputCls}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} người
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rsvp-side" className={labelCls}>
              Khách của
            </label>
            <select id="rsvp-side" name="side" defaultValue="" className={inputCls}>
              <option value="">Cả hai</option>
              <option value="GROOM">Nhà trai</option>
              <option value="BRIDE">Nhà gái</option>
            </select>
          </div>
        </div>
      )}
      <div>
        <label htmlFor="rsvp-note" className={labelCls}>
          Lời nhắn
        </label>
        <textarea id="rsvp-note" name="note" maxLength={300} rows={2} placeholder="Ví dụ: mình ăn chay" className={inputCls} />
      </div>
      {state === "error" && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <TplButton type="submit" className="w-full" disabled={state === "sending" || disabled}>
        {disabled ? "Gửi xác nhận (chỉ hoạt động trên thiệp thật)" : state === "sending" ? "Đang gửi…" : "Gửi xác nhận"}
      </TplButton>
    </form>
  );
}

/* ---------------- Sổ lưu bút ---------------- */
export function Wishes({ slug, mode, initial }: { slug: string; mode: ViewMode; initial: WishItem[] }) {
  const [items, setItems] = useState(initial);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const disabled = mode !== "live";

  useEffect(() => setItems(initial), [initial]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSending(true);
    setError("");
    const res = await fetch("/api/wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name: fd.get("name"), message: fd.get("message") }),
    });
    setSending(false);
    if (res.ok) {
      const wish = (await res.json()) as WishItem;
      setItems((s) => [wish, ...s]);
      form.reset();
    } else setError((await res.json().catch(() => ({})))?.error ?? "Chưa gửi được lời chúc. Thử lại sau ít phút.");
  }

  const shown = items.length ? items : mode === "live" ? [] : SAMPLE_WISHES;

  return (
    <div className="space-y-10">
      {shown.length > 0 && (
        <Marquee duration={Math.max(30, shown.length * 8)} className="-mx-5 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          {shown.map((w) => (
            <figure key={w.id} className="mx-2.5 w-72 shrink-0 rounded-2xl border border-[var(--muted)]/15 bg-[var(--surface)] p-5 text-left shadow-sm">
              <Icon name="heart" size={16} className="text-[var(--primary)]" />
              <blockquote className="mt-2 line-clamp-4 text-sm leading-relaxed">{w.message}</blockquote>
              <figcaption className="mt-3 text-sm font-semibold text-[var(--primary)]">— {w.name}</figcaption>
            </figure>
          ))}
        </Marquee>
      )}
      <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4 rounded-3xl bg-[var(--surface)] p-6 text-left shadow-sm @3xl:p-8">
        <div>
          <label htmlFor="wish-name" className={labelCls}>
            Tên của bạn
          </label>
          <input id="wish-name" name="name" required maxLength={80} className={inputCls} />
        </div>
        <div>
          <label htmlFor="wish-msg" className={labelCls}>
            Lời chúc
          </label>
          <textarea id="wish-msg" name="message" required maxLength={500} rows={4} placeholder="Gửi đôi lời đến cô dâu chú rể…" className={inputCls} />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <TplButton type="submit" className="w-full" disabled={sending || disabled}>
          {sending ? "Đang gửi…" : "Gửi lời chúc"}
        </TplButton>
      </form>
    </div>
  );
}

const SAMPLE_WISHES: WishItem[] = [
  { id: "w1", name: "Lan Anh", message: "Chúc hai bạn trăm năm hạnh phúc, sớm có tin vui nhé!", createdAt: "" },
  { id: "w2", name: "Đức Huy", message: "Cuối cùng ông bạn thân cũng chịu lấy vợ. Chúc mừng hai bạn!", createdAt: "" },
  { id: "w3", name: "Cô Hằng", message: "Chúc các con luôn yêu thương, nhường nhịn và cùng nhau xây dựng tổ ấm thật vững bền.", createdAt: "" },
  { id: "w4", name: "Team Design", message: "Happy wedding! Mong được ăn cưới sớm thêm lần nữa (của đứa khác).", createdAt: "" },
];

/* ---------------- Hộp mừng cưới ---------------- */
// Hộp mừng cưới: xem GiftFlow.tsx

/* ---------------- Album: dải ảnh trượt + lưới + xem toàn màn hình ---------------- */
export function Gallery({ images }: { images: string[] }) {
  const [active, setActive] = useState<number | null>(null);
  const layout = useLayout();
  const strip = useRef<HTMLDivElement>(null);
  const touchX = useRef(0);
  const n = images.length;
  const go = (d: number) => setActive((i) => (i === null ? i : (i + d + n) % n));

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const scrollStrip = (d: number) => strip.current?.scrollBy({ left: d * strip.current.clientWidth * 0.8, behavior: "smooth" });
  const featured = images.slice(0, 6);
  const rest = images.slice(6);

  return (
    <>
      {layout === "classic" ? (
      <>
      {/* Dải ảnh lớn trượt ngang, có snap */}
      <div className="relative">
        <div ref={strip} className="tpl-noscroll -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2">
          {featured.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Xem ảnh ${i + 1} trên ${n}`}
              className="group relative aspect-[3/4] w-[72%] shrink-0 cursor-zoom-in snap-center overflow-hidden rounded-2xl @2xl:w-[38%]"
            >
              <Img src={src} alt="" className="h-full w-full transition duration-[1.4s] group-hover:scale-105" />
              <span className="absolute bottom-3 left-3 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur-sm">
                {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-center gap-3">
          <button type="button" onClick={() => scrollStrip(-1)} aria-label="Ảnh trước" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[var(--primary)]/40 text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-[var(--on-primary)]">
            <Icon name="left" />
          </button>
          <button type="button" onClick={() => scrollStrip(1)} aria-label="Ảnh tiếp theo" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[var(--primary)]/40 text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-[var(--on-primary)]">
            <Icon name="right" />
          </button>
        </div>
      </div>

      {/* Lưới ảnh còn lại */}
      {rest.length > 0 && (
        <div className="mt-10 grid grid-cols-3 gap-2 @2xl:gap-3">
          {rest.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i + 6)}
              aria-label={`Xem ảnh ${i + 7} trên ${n}`}
              className={`group cursor-zoom-in overflow-hidden rounded-xl ${i % 5 === 0 ? "col-span-2 row-span-2" : ""}`}
            >
              <Img src={src} alt="" className="aspect-square h-full w-full transition duration-[1.4s] group-hover:scale-105" />
            </button>
          ))}
        </div>
      )}

      </>
      ) : (
        <AltGallery layout={layout} images={images} onOpen={setActive} />
      )}

      {active !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95"
          onClick={() => setActive(null)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={active} src={images[active]} alt="" className="tpl-rise max-h-[86vh] max-w-[92vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <p className="absolute top-5 left-1/2 -translate-x-1/2 text-sm tracking-[0.3em] text-white/70">
            {active + 1} / {n}
          </p>
          <button type="button" aria-label="Đóng" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10" onClick={() => setActive(null)}>
            <Icon name="x" size={24} />
          </button>
          <button type="button" aria-label="Ảnh trước" className="absolute left-3 flex h-12 w-12 items-center justify-center rounded-full text-white/80 hover:bg-white/10" onClick={(e) => { e.stopPropagation(); go(-1); }}>
            <Icon name="left" size={28} />
          </button>
          <button type="button" aria-label="Ảnh tiếp theo" className="absolute right-3 flex h-12 w-12 items-center justify-center rounded-full text-white/80 hover:bg-white/10" onClick={(e) => { e.stopPropagation(); go(1); }}>
            <Icon name="right" size={28} />
          </button>
        </div>
      )}
    </>
  );
}

/** Album cho các hệ bố cục khác Cổ điển. */
function AltGallery({ layout, images, onOpen }: { layout: LayoutFamily; images: string[]; onOpen: (i: number) => void }) {
  const n = images.length;
  const label = (i: number) => `Xem ảnh ${i + 1} trên ${n}`;

  if (layout === "editorial")
    return (
      <div className="grid auto-rows-[9rem] grid-cols-2 gap-3 @3xl:auto-rows-[13rem] @3xl:grid-cols-4">
        {images.map((src, i) => {
          const span = i % 7 === 0 ? "col-span-2 row-span-2" : i % 7 === 3 ? "row-span-2" : i % 7 === 5 ? "col-span-2" : "";
          return (
            <button key={src + i} type="button" onClick={() => onOpen(i)} aria-label={label(i)} className={`group relative cursor-zoom-in overflow-hidden ${span}`}>
              <Img src={src} alt="" className="h-full w-full transition duration-[1.4s] group-hover:scale-105" />
              <span className="absolute left-2 top-2 text-[10px] font-semibold tracking-[0.3em] text-white mix-blend-difference">
                {String(i + 1).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>
    );

  if (layout === "romantic")
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 @3xl:grid-cols-3 @3xl:gap-x-8">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => onOpen(i)}
            aria-label={label(i)}
            style={{ transform: `rotate(${[-3, 2, -1.5, 3, -2, 1][i % 6]}deg)` }}
            className="cursor-zoom-in bg-white p-2 pb-6 shadow-[0_15px_35px_-18px_rgba(0,0,0,.4)] transition duration-500 hover:z-10 hover:!rotate-0 hover:scale-105"
          >
            <Img src={src} alt="" className="aspect-square w-full" />
          </button>
        ))}
      </div>
    );

  if (layout === "luxe") return <SpotlightGallery images={images} onOpen={onOpen} />;

  if (layout === "modern")
    return (
      <div className="columns-2 gap-3 @3xl:columns-3 @3xl:gap-4">
        {images.map((src, i) => (
          <button key={src + i} type="button" onClick={() => onOpen(i)} aria-label={label(i)} className="group mb-3 block w-full cursor-zoom-in overflow-hidden rounded-[1.5rem] @3xl:mb-4">
            <Img src={src} alt="" className={`w-full transition duration-[1.4s] group-hover:scale-105 ${["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/5]", "aspect-[5/4]"][i % 5]}`} />
          </button>
        ))}
      </div>
    );

  if (layout === "journal") {
    // dải ảnh chụp tự động (photobooth), mỗi dải 3 ảnh
    const strips: number[][] = [];
    images.forEach((_, i) => (i % 3 ? strips[strips.length - 1].push(i) : strips.push([i])));
    return (
      <div className="flex flex-wrap justify-center gap-6 @3xl:gap-10">
        {strips.map((idx, k) => (
          <div key={k} className="relative w-[42%] bg-white p-2 pb-8 shadow-[0_14px_30px_-14px_rgba(0,0,0,.4)] @3xl:w-[22%]" style={{ transform: `rotate(${[-3, 2, -1, 3][k % 4]}deg)` }}>
            <span className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 rotate-[-3deg] opacity-80" style={{ background: "color-mix(in srgb, var(--accent) 80%, white)" }} aria-hidden />
            <div className="space-y-2">
              {idx.map((i) => (
                <button key={i} type="button" onClick={() => onOpen(i)} aria-label={label(i)} className="block w-full cursor-zoom-in">
                  <Img src={images[i]} alt="" className="aspect-[4/3] w-full" />
                </button>
              ))}
            </div>
            <p className="tpl-script absolute inset-x-0 bottom-1.5 text-center text-lg text-[var(--muted)]">#{k + 1}</p>
          </div>
        ))}
      </div>
    );
  }

  if (layout === "zen")
    return (
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 @3xl:gap-x-16 @3xl:gap-y-16">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => onOpen(i)}
            aria-label={label(i)}
            className={`group cursor-zoom-in text-left ${i % 2 ? "translate-y-12 @3xl:translate-y-24" : ""} ${i % 3 === 0 ? "" : "px-4 @3xl:px-10"}`}
          >
            <div className="overflow-hidden">
              <Img src={src} alt="" className={`w-full transition duration-[1.6s] group-hover:scale-[1.03] ${i % 3 === 0 ? "aspect-[3/4]" : "aspect-square"}`} />
            </div>
            <span className="mt-2 block text-[10px] tracking-[0.4em] text-[var(--muted)]">— {String(i + 1).padStart(2, "0")}</span>
          </button>
        ))}
      </div>
    );

  // heritage
  return (
    <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-3">
      {images.map((src, i) => (
        <button
          key={src + i}
          type="button"
          onClick={() => onOpen(i)}
          aria-label={label(i)}
          className="group cursor-zoom-in border-[3px] border-double border-[var(--primary)]/40 p-1.5 transition hover:border-[var(--primary)]"
        >
          <div className="overflow-hidden">
            <Img src={src} alt="" className="aspect-[4/5] w-full transition duration-[1.4s] group-hover:scale-105" />
          </div>
        </button>
      ))}
    </div>
  );
}

/** Dạ tiệc: một ảnh lớn ở giữa, dải ảnh nhỏ bên dưới để chọn. */
function SpotlightGallery({ images, onOpen }: { images: string[]; onOpen: (i: number) => void }) {
  const [cur, setCur] = useState(0);
  const n = images.length;
  return (
    <div>
      <button type="button" onClick={() => onOpen(cur)} aria-label={`Phóng to ảnh ${cur + 1} trên ${n}`} className="group relative block w-full cursor-zoom-in overflow-hidden border border-[var(--primary)]/40 p-2">
        <Img key={cur} src={images[cur]} alt="" className="tpl-rise aspect-[4/5] w-full @3xl:aspect-[16/10]" />
        <span className="absolute bottom-5 right-5 text-xs tracking-[0.4em] text-white drop-shadow">
          {String(cur + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </span>
      </button>
      <div className="tpl-noscroll mt-4 flex gap-2 overflow-x-auto pb-1">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setCur(i)}
            aria-label={`Chọn ảnh ${i + 1}`}
            aria-current={i === cur}
            className={`h-16 w-16 shrink-0 cursor-pointer overflow-hidden transition @3xl:h-20 @3xl:w-20 ${i === cur ? "opacity-100 ring-1 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg)]" : "opacity-45 hover:opacity-80"}`}
          >
            <Img src={src} alt="" className="h-full w-full" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Hỏi đáp ---------------- */
export function Faq({ items }: { items: { id: string; q: string; a: string }[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="mx-auto max-w-2xl divide-y divide-[var(--muted)]/20 border-y border-[var(--muted)]/20 text-left">
      {items.map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : f.id)}
                className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 py-5 text-left text-lg"
              >
                <span className="tpl-heading" data-tf={`faq.${f.id}.q`}>{f.q}</span>
                <Icon name="plus" className={`shrink-0 text-[var(--primary)] transition duration-300 ${isOpen ? "rotate-45" : ""}`} />
              </button>
            </h3>
            <div className={`grid transition-[grid-template-rows] duration-500 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <p className="overflow-hidden pb-0 leading-relaxed text-[var(--muted)]">
                <span className="block pb-5" data-tf={`faq.${f.id}.a`}>{f.a}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Nhạc nền ---------------- */
/**
 * Nhạc nền của thiệp: file người dùng tải lên, hoặc bài dựng sẵn (tổng hợp ngay trên máy khách).
 * Chỉ phát sau lần chạm "Mở thiệp"; tạm dừng khi khách chuyển sang ứng dụng khác.
 */
export function useMusic(src: MusicSource | null) {
  const key = !src ? "" : "track" in src ? `t:${src.track}` : `u:${src.url}:${src.start}`;
  const ref = useRef<HTMLAudioElement | null>(null);
  const want = useRef(false); // khách đã muốn nghe
  const ready = useRef(false);
  const kick = useRef<() => void>(() => {});
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!src) return;
    const a = new Audio();
    a.loop = true;
    a.preload = "auto";
    ref.current = a;
    ready.current = false;
    let alive = true;
    let fade = 0;
    const start = "url" in src ? src.start : 0;

    const begin = () => {
      if (!alive || !want.current) return;
      a.volume = 0;
      a.play().catch(() => {});
      // vào nhạc từ từ (iOS bỏ qua volume — không sao)
      window.clearInterval(fade);
      fade = window.setInterval(() => {
        a.volume = Math.min(1, a.volume + 0.05);
        if (a.volume >= 1) window.clearInterval(fade);
      }, 90);
    };
    const load = (url: string) => {
      if (!alive) return;
      a.src = url;
      ready.current = true;
      if (start > 0) a.addEventListener("loadedmetadata", () => (a.currentTime = Math.min(start, Math.max(0, a.duration - 1))), { once: true });
      begin();
    };

    let timer = 0;
    const fetchTrack = () => {
      window.clearTimeout(timer);
      if ("track" in src) getTrackUrl(src.track).then(load).catch(() => {});
    };
    if ("url" in src) load(src.url);
    // dựng bài sau khi phần mở đầu đã chạy xong để không làm giật hiệu ứng
    else timer = window.setTimeout(fetchTrack, 1500);
    kick.current = fetchTrack;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("playing", onPlay);
    a.addEventListener("pause", onPause);
    const onVis = () => {
      if (document.hidden) a.pause();
      else if (want.current && ready.current) a.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      window.clearInterval(fade);
      document.removeEventListener("visibilitychange", onVis);
      a.pause();
      a.removeAttribute("src");
      ref.current = null;
      setPlaying(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const play = () => {
    const a = ref.current;
    if (!a) return;
    want.current = true;
    if (ready.current) {
      a.play().catch(() => {});
      return;
    }
    // bài chưa dựng xong: mở khoá thẻ audio ngay trong lần chạm, dựng xong sẽ tự phát
    a.src = silentUrl();
    a.play().catch(() => {});
    kick.current();
  };
  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (playing) {
      want.current = false;
      a.pause();
    } else play();
  };
  return { enabled: !!src, playing, play, toggle };
}

export function MusicButton({ playing, onClick }: { playing: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={playing ? "Tắt nhạc nền" : "Bật nhạc nền"}
      aria-pressed={playing}
      className="fixed bottom-24 right-4 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[var(--surface)]/90 text-[var(--primary)] shadow-lg ring-1 ring-[var(--primary)]/30 backdrop-blur @3xl:bottom-6"
    >
      <span className={playing ? "tpl-spin" : ""}>
        <Icon name={playing ? "music" : "mute"} />
      </span>
    </button>
  );
}

/* ---------------- Thanh điều hướng nổi ---------------- */
export function FloatingDock({ items }: { items: { id: string; label: string; icon: IconName }[] }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const on = () => setVisible(window.scrollY > window.innerHeight * 0.7);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <nav
      aria-label="Các phần của thiệp"
      className={`fixed bottom-4 left-1/2 z-40 -translate-x-1/2 transition duration-500 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}
    >
      <ul className="flex items-center gap-1 rounded-full bg-[var(--surface)]/90 p-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,.35)] ring-1 ring-[var(--muted)]/15 backdrop-blur-md">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              className="flex min-h-11 min-w-11 flex-col items-center justify-center rounded-full px-2.5 text-[var(--text)] transition hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
            >
              <Icon name={it.icon} size={18} />
              <span className="mt-0.5 text-[10px] leading-none">{it.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ---------------- Màn mở thiệp: thiệp gấp đôi + con dấu chữ lồng ---------------- */
export function GateFold({
  monogram,
  groom,
  bride,
  dateText,
  guestName,
  onOpen,
}: {
  monogram: string;
  groom: string;
  bride: string;
  dateText: string;
  guestName?: string;
  onOpen: () => void;
}) {
  const [phase, setPhase] = useState<"closed" | "opening" | "gone">("closed");
  const mode = useMode();
  // Khách quay lại từ app ngân hàng (trang bị tải lại): bỏ qua bìa thiệp để về thẳng Hộp mừng cưới
  const openRef = useRef(onOpen);
  openRef.current = onOpen;
  useEffect(() => {
    const skip = () => {
      setPhase("gone");
      openRef.current();
    };
    window.addEventListener("tcw:skip-gate", skip);
    return () => window.removeEventListener("tcw:skip-gate", skip);
  }, []);
  if (phase === "gone" || !isImmersive(mode)) return null;

  const open = () => {
    if (phase !== "closed") return;
    setPhase("opening");
    onOpen();
    setTimeout(() => setPhase("gone"), 1700);
  };

  const panel =
    "absolute inset-y-0 w-1/2 bg-[var(--hero-bg)] transition-transform duration-[1400ms] ease-[cubic-bezier(.7,0,.2,1)] motion-reduce:duration-0";
  const paper = {
    backgroundImage:
      "radial-gradient(circle at 30% 20%, rgba(255,255,255,.08), transparent 60%), repeating-linear-gradient(0deg, rgba(0,0,0,.025) 0 2px, transparent 2px 4px)",
  };

  return (
    <div className="fixed inset-0 z-[60] text-[var(--hero-text)] [perspective:2200px]" role="dialog" aria-label="Thiệp mời">
      <div
        className={`${panel} left-0 origin-left border-r border-[var(--primary)]/40 ${phase === "opening" ? "[transform:rotateY(-105deg)]" : ""}`}
        style={paper}
      >
        <div className="absolute inset-4 border border-[var(--primary)]/30 border-r-0" />
      </div>
      <div
        className={`${panel} right-0 origin-right border-l border-[var(--primary)]/40 ${phase === "opening" ? "[transform:rotateY(105deg)]" : ""}`}
        style={paper}
      >
        <div className="absolute inset-4 border border-[var(--primary)]/30 border-l-0" />
      </div>

      <div className={`absolute inset-0 flex flex-col items-center justify-center px-8 text-center transition duration-500 ${phase === "opening" ? "scale-95 opacity-0" : ""}`}>
        <p className="tpl-rise text-[11px] uppercase tracking-[0.5em] opacity-80">Thiệp mời cưới</p>
        <p className="tpl-heading tpl-rise mt-6 text-4xl leading-tight [animation-delay:.15s] @3xl:text-5xl">
          {groom}
          <span className="tpl-script mx-3 text-[var(--primary)]">&</span>
          {bride}
        </p>
        <p className="tpl-rise mt-3 text-sm tracking-[0.3em] opacity-80 [animation-delay:.3s]">{dateText}</p>

        <button
          type="button"
          onClick={open}
          aria-label="Mở thiệp"
          className="tpl-seal group relative mt-12 flex h-28 w-28 cursor-pointer items-center justify-center rounded-full bg-[var(--primary)] text-[var(--on-primary)] shadow-[0_20px_50px_-15px_rgba(0,0,0,.6)] transition duration-300 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
        >
          <span className="absolute inset-2 rounded-full border border-dashed border-current opacity-50" />
          <span className="tpl-script text-4xl">{monogram}</span>
        </button>
        <p className="mt-5 text-xs uppercase tracking-[0.35em] opacity-70">Chạm vào con dấu để mở</p>

        {guestName && (
          <div className="tpl-rise mt-10 [animation-delay:.45s]">
            <p className="text-[11px] uppercase tracking-[0.4em] opacity-60">Thân gửi</p>
            <p className="tpl-heading mt-1 text-2xl">{guestName}</p>
          </div>
        )}
      </div>
    </div>
  );
}
