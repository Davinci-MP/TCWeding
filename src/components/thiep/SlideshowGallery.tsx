"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SLIDE_DEMO_PHOTOS, SLIDE_MOTIONS, SLIDE_SCRIPTS, SLIDE_STYLES, type SlideStyle } from "@/lib/thiep";
import { Icon } from "@/templates/icons";
import { patchDraft } from "./draftStore";

const SCENES = 12; // mở đầu + 10 ảnh + kết
const SCENE_MS = 3200;

/** Một cảnh của slideshow: cảnh đầu/cuối là chữ, giữa là ảnh với hiệu ứng chuyển theo kiểu của mẫu. */
function Scene({ s, i, names, big }: { s: SlideStyle; i: number; names: string; big?: boolean }) {
  const p = s.palette;
  const anim = s.motion.id === "fade" ? "tcw-ss-fade" : s.motion.id === "slide" ? "tcw-ss-slide" : "tcw-ss-cinema";
  if (i === 0 || i === SCENES - 1) {
    const end = i === SCENES - 1;
    return (
      <div key={i} className="absolute inset-0 flex flex-col items-center justify-center px-[8%] text-center" style={{ background: p.bg, color: p.text, animation: "tcw-ss-fade .9s ease both" }}>
        <p className="uppercase tracking-[0.3em] opacity-80" style={{ fontFamily: p.heading, fontSize: big ? "clamp(12px,1.6vw,22px)" : 10 }}>
          {end ? "Thank you" : s.script.title}
        </p>
        <p className="mt-[0.4em] leading-none" style={{ fontFamily: p.script, color: p.accent, fontSize: big ? "clamp(40px,7vw,110px)" : 30 }}>
          {names}
        </p>
        <p className="mt-[0.8em] max-w-[80%] opacity-80" style={{ fontFamily: p.heading, fontSize: big ? "clamp(13px,1.5vw,22px)" : 9 }}>
          {end ? "Cảm ơn mọi người đã đến chung vui cùng chúng mình." : s.script.line}
        </p>
      </div>
    );
  }
  const photo = SLIDE_DEMO_PHOTOS[(i - 1) % SLIDE_DEMO_PHOTOS.length];
  const caption = (
    <span className="absolute bottom-[8%] left-0 right-0 text-center uppercase tracking-[0.3em] drop-shadow" style={{ fontFamily: p.heading, color: p.text, fontSize: big ? "clamp(10px,1.1vw,16px)" : 8 }}>
      Happy wedding / {names}
    </span>
  );
  /* eslint-disable @next/next/no-img-element */
  if (s.motion.id === "polaroid") {
    // Ảnh trong khung trắng nghiêng nhẹ trên nền màu, mỗi cảnh nghiêng một kiểu
    const tilt = i % 2 ? -4 : 3;
    return (
      <div key={i} className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ background: p.bg }}>
        <div className="bg-white p-[1.6%] pb-[5%] shadow-2xl" style={{ height: "78%", aspectRatio: "4 / 4.6", animation: `tcw-ss-drop ${SCENE_MS}ms cubic-bezier(.2,.8,.2,1) both`, ["--tilt" as string]: `${tilt}deg` }}>
          <img src={photo} alt="" className="h-full w-full object-cover" />
        </div>
        {caption}
      </div>
    );
  }
  if (s.motion.id === "split") {
    // Hai ảnh cạnh nhau trượt vào từ hai phía
    const second = SLIDE_DEMO_PHOTOS[i % SLIDE_DEMO_PHOTOS.length];
    return (
      <div key={i} className="absolute inset-0 grid grid-cols-2 gap-[1.2%] overflow-hidden p-[1.2%]" style={{ background: p.bg }}>
        <img src={photo} alt="" className="h-full w-full object-cover" style={{ animation: `tcw-ss-left ${SCENE_MS}ms ease both` }} />
        <img src={second} alt="" className="h-full w-full object-cover" style={{ animation: `tcw-ss-right ${SCENE_MS}ms ease both` }} />
        <span className="absolute inset-x-0 bottom-[6%] text-center" style={{ fontFamily: p.script, color: "#fff", fontSize: big ? "clamp(24px,3.4vw,52px)" : 16, textShadow: "0 2px 12px rgba(0,0,0,.45)" }}>
          {names}
        </span>
      </div>
    );
  }
  if (s.motion.id === "film") {
    // Khung phim nhựa có lỗ răng cưa, ảnh lướt ngang như cuộn phim
    const holes = Array.from({ length: 14 });
    const row = (pos: "top" | "bottom") => (
      <div className={`absolute inset-x-0 ${pos === "top" ? "top-[3%]" : "bottom-[3%]"} flex justify-around`} aria-hidden>
        {holes.map((_, k) => (
          <span key={k} className="h-[1.6vh] max-h-3 w-[3%] rounded-[2px]" style={{ background: p.bg }} />
        ))}
      </div>
    );
    return (
      <div key={i} className="absolute inset-0 overflow-hidden" style={{ background: p.bg }}>
        <div className="absolute inset-x-0 top-[8%] bottom-[8%] bg-[#141210]">
          {row("top")}
          {row("bottom")}
          <div className="absolute inset-x-[3%] top-[14%] bottom-[14%] overflow-hidden">
            <img src={photo} alt="" className="h-full w-full object-cover" style={{ animation: `tcw-ss-slide ${SCENE_MS + 600}ms ease both`, filter: "sepia(.18) contrast(1.05)" }} />
          </div>
        </div>
        {caption}
      </div>
    );
  }
  return (
    <div key={i} className="absolute inset-0 overflow-hidden" style={{ background: p.bg }}>
      <img src={photo} alt="" className="h-full w-full object-cover" style={{ animation: `${s.motion.id === "kenburns" ? "tcw-ss-kenburns" : anim} ${SCENE_MS + 600}ms ${s.motion.id === "kenburns" ? "linear" : "ease"} both` }} />
      {s.motion.id === "cinema" && (
        <>
          <span className="absolute inset-x-0 top-0 h-[9%] bg-black" aria-hidden />
          <span className="absolute inset-x-0 bottom-0 h-[9%] bg-black" aria-hidden />
        </>
      )}
      <span className="absolute bottom-[12%] left-0 right-0 text-center uppercase tracking-[0.3em] text-white/90 drop-shadow" style={{ fontFamily: p.heading, fontSize: big ? "clamp(10px,1.1vw,16px)" : 8 }}>
        Happy wedding / {names}
      </span>
    </div>
  );
  /* eslint-enable @next/next/no-img-element */
}

function useTicker(on: boolean, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setI((x) => (x + 1) % SCENES), ms);
    return () => clearInterval(t);
  }, [on, ms]);
  return [i, setI] as const;
}

/** Ô xem trước nhỏ: chỉ chạy khi nằm trong màn hình để không tốn pin. */
function PreviewCard({ s, names, onPlay, onPick }: { s: SlideStyle; names: string; onPlay: () => void; onPick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const [i] = useTicker(visible, 2200);
  return (
    <div>
      <button type="button" onClick={onPlay} className="group relative block aspect-video w-full overflow-hidden rounded-xl ring-offset-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d9a0a8]" aria-label={`Xem trình chiếu mẫu ${s.code}`}>
        <div ref={ref} className="absolute inset-0">
          <Scene s={s} i={i} names={names} />
        </div>
        <span className="absolute bottom-2 right-2 rounded bg-black/50 px-1.5 text-[10px] tabular-nums text-white">
          {String(i + 1).padStart(2, "0")} / {SCENES}
        </span>
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
          <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#1d1a17]">▶ Xem</span>
        </span>
      </button>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
        {s.code} · {s.script.label}
      </p>
      <p className="text-sm text-white/55">
        {s.motion.label} · {s.palette.name}
      </p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={onPlay} className="min-h-10 rounded-full border border-white/25 px-4 text-sm text-white hover:border-white">
          ▶ Xem
        </button>
        <button type="button" onClick={onPick} className="min-h-10 rounded-full border border-white/25 px-4 text-sm text-white hover:border-white">
          ♡ Chọn
        </button>
      </div>
    </div>
  );
}

/** Mục Slideshow tiệc cưới trên trang chủ: lọc theo kịch bản / chuyển cảnh, xem toàn màn hình, chọn mẫu để đặt làm. */
export function SlideshowGallery({ names = "Minh Quân & Thanh Hà" }: { names?: string }) {
  const [script, setScript] = useState("");
  const [motion, setMotion] = useState("");
  const [count, setCount] = useState(8);
  const [playing, setPlaying] = useState<SlideStyle | null>(null);
  useEffect(() => setCount(8), [script, motion]);
  const list = useMemo(() => SLIDE_STYLES.filter((s) => (!script || s.script.id === script) && (!motion || s.motion.id === motion)), [script, motion]);
  const shown = list.slice(0, count);
  const hero = list[0] ?? SLIDE_STYLES[0];
  const [heroI, setHeroI] = useTicker(!playing, SCENE_MS);

  function pick(s: SlideStyle) {
    patchDraft({ slideshow: true, slideshowId: s.id });
    window.location.href = "/thiep#chon";
  }
  const chip = (active: boolean) => `min-h-10 rounded-full px-4 text-sm transition ${active ? "bg-[#efe7dc] text-[#1d1a17]" : "border border-white/20 text-white/75 hover:border-white/60 hover:text-white"}`;

  return (
    <>
      <style>{`
        @keyframes tcw-ss-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tcw-ss-slide { from { opacity: .3; transform: translateX(8%) scale(1.05) } to { opacity: 1; transform: translateX(0) scale(1.05) } }
        @keyframes tcw-ss-cinema { from { opacity: 0; transform: scale(1.18) } to { opacity: 1; transform: scale(1.04) } }
        @keyframes tcw-ss-kenburns { from { opacity: 0; transform: scale(1) translate(0,0) } 15% { opacity: 1 } to { opacity: 1; transform: scale(1.14) translate(-2%,-1.5%) } }
        @keyframes tcw-ss-drop { from { opacity: 0; transform: translateY(-14%) rotate(calc(var(--tilt) * -2)) scale(1.06) } to { opacity: 1; transform: translateY(0) rotate(var(--tilt)) scale(1) } }
        @keyframes tcw-ss-left { from { opacity: 0; transform: translateX(-12%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes tcw-ss-right { from { opacity: 0; transform: translateX(12%) } 20% { opacity: 0 } to { opacity: 1; transform: translateX(0) } }
        @media (prefers-reduced-motion: reduce) { [style*="tcw-ss-"] { animation: none !important } }
      `}</style>
      <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <button type="button" onClick={() => setPlaying(hero)} className="relative block aspect-video w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10" aria-label={`Xem trình chiếu mẫu ${hero.code}`}>
            <Scene s={hero} i={heroI} names={names} big />
          </button>
          <div className="mt-3 flex items-center justify-between text-sm text-white/60">
            <span>
              {hero.code} · {hero.script.label} · {SCENES} cảnh
            </span>
            <span className="flex gap-1">
              <button type="button" onClick={() => setHeroI((heroI - 1 + SCENES) % SCENES)} aria-label="Cảnh trước" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10">
                <Icon name="left" size={18} />
              </button>
              <span className="w-14 py-2 text-center tabular-nums">
                {String(heroI + 1).padStart(2, "0")} / {SCENES}
              </span>
              <button type="button" onClick={() => setHeroI((heroI + 1) % SCENES)} aria-label="Cảnh sau" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10">
                <Icon name="right" size={18} />
              </button>
            </span>
          </div>
        </div>
        <div>
          <p className="text-white/70">Mỗi mẫu dùng chính ảnh cưới, tên và màu sắc của hai bạn, chạy liền như video và có nhạc nền. Bấm để xem toàn màn hình.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => setPlaying(hero)} className="min-h-12 rounded-full bg-[#efe7dc] px-6 font-semibold text-[#1d1a17] hover:bg-white">
              ▶ Xem trình chiếu
            </button>
            <button type="button" onClick={() => pick(hero)} className="min-h-12 rounded-full border border-white/30 px-6 font-semibold text-white hover:border-white">
              ♡ Chọn mẫu này
            </button>
          </div>
          <div className="mt-8 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setScript("")} aria-pressed={!script} className={chip(!script)}>
                Mọi kịch bản
              </button>
              {SLIDE_SCRIPTS.map((x) => (
                <button key={x.id} type="button" onClick={() => setScript(x.id)} aria-pressed={script === x.id} className={chip(script === x.id)}>
                  {x.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setMotion("")} aria-pressed={!motion} className={chip(!motion)}>
                Mọi chuyển cảnh
              </button>
              {SLIDE_MOTIONS.map((x) => (
                <button key={x.id} type="button" onClick={() => setMotion(x.id)} aria-pressed={motion === x.id} className={chip(motion === x.id)}>
                  {x.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-14 text-xs font-semibold uppercase tracking-[0.3em] text-[#d8cdbf]">
        {list.length} mẫu động · {SCENES} cảnh mỗi mẫu
      </p>
      <ul className="mt-6 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((s) => (
          <li key={s.id}>
            <PreviewCard s={s} names={names} onPlay={() => setPlaying(s)} onPick={() => pick(s)} />
          </li>
        ))}
      </ul>
      {list.length > count && (
        <div className="mt-8 text-center">
          <button type="button" onClick={() => setCount((c) => c + 16)} className="min-h-11 rounded-full border border-white/25 px-6 text-white hover:border-white">
            Xem thêm {Math.min(16, list.length - count)} mẫu ↓ ({list.length - count} mẫu nữa)
          </button>
        </div>
      )}
      {playing && <Player s={playing} names={names} onClose={() => setPlaying(null)} onPick={() => pick(playing)} />}
    </>
  );
}

function Player({ s, names, onClose, onPick }: { s: SlideStyle; names: string; onClose: () => void; onPick: () => void }) {
  const [i, setI] = useTicker(true, SCENE_MS);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((x) => (x + 1) % SCENES);
      if (e.key === "ArrowLeft") setI((x) => (x - 1 + SCENES) % SCENES);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, setI]);
  return (
    <div role="dialog" aria-modal="true" aria-label={`Trình chiếu mẫu ${s.code}`} className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1">
        <div className="absolute inset-0 m-auto aspect-video max-h-full max-w-full">
          <Scene s={s} i={i} names={names} big />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#120f0d] px-4 py-3 text-sm text-white">
        <span className="text-white/70">
          {s.code} · {s.script.label} · {s.motion.label} · {String(i + 1).padStart(2, "0")}/{SCENES}
        </span>
        <span className="flex gap-2">
          <button type="button" onClick={onPick} className="min-h-10 rounded-full bg-[#efe7dc] px-4 font-semibold text-[#1d1a17]">
            ♡ Chọn mẫu này
          </button>
          <button ref={closeRef} type="button" onClick={onClose} className="min-h-10 rounded-full border border-white/30 px-4">
            Đóng ✕
          </button>
        </span>
      </div>
    </div>
  );
}
