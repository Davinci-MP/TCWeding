"use client";

// Bộ chỉnh ảnh dùng chung: kéo (chuột / cảm ứng), thu phóng (thanh trượt, lăn chuột, chụm 2 ngón), "Lấp đầy khung" /
// "Hiện toàn bộ ảnh", căn riêng trên điện thoại, đặt lại, áp dụng. Hai khung xem trước đúng tỉ lệ + góc bo của vị trí.
// Ảnh gốc không đổi: chỉ trả về thiết lập ImgFrame (src/lib/imageFrame.ts).

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { DEFAULT_VIEW, frameAttrs, ZOOM_RANGE, type FrameView, type ImgFrame } from "@/lib/imageFrame";

/** Khung đích: tỉ lệ rộng/cao, góc bo (CSS, đã tính theo khung xem trước) và clip-path nếu có. */
export type FrameTarget = { aspect: number; radius?: string; clipPath?: string };
type Device = "desktop" | "mobile";

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Một khung xem trước có thể kéo / thu phóng. */
function Stage({
  src,
  view,
  target,
  width,
  natural,
  active,
  label,
  onFocus,
  onChange,
}: {
  src: string;
  view: FrameView;
  target: FrameTarget;
  width: number;
  natural: { w: number; h: number } | null;
  active: boolean;
  label: string;
  onFocus: () => void;
  onChange: (v: FrameView) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef<{ view: FrameView; dist: number } | null>(null);
  const height = Math.round(width / target.aspect);

  /** Đổi px kéo thành % điểm căn: theo phần ảnh dư ra so với khung (lấp đầy) hoặc theo khung (khi ảnh không dư). */
  const toPercent = (dx: number, dy: number, v: FrameView) => {
    const bw = box.current?.clientWidth ?? width;
    const bh = box.current?.clientHeight ?? height;
    let ow = bw * (v.z - 1);
    let oh = bh * (v.z - 1);
    if (natural) {
      const s = (v.fit === "cover" ? Math.max(bw / natural.w, bh / natural.h) : Math.min(bw / natural.w, bh / natural.h)) * v.z;
      ow = Math.max(ow, natural.w * s - bw);
      oh = Math.max(oh, natural.h * s - bh);
    }
    return { x: ow > 2 ? (-dx / ow) * 100 : (-dx / bw) * 100, y: oh > 2 ? (-dy / oh) * 100 : (-dy / bh) * 100 };
  };

  const down = (e: RPointerEvent<HTMLDivElement>) => {
    onFocus();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...pts.current.values()];
    start.current = { view, dist: p.length > 1 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0 };
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const prev = pts.current.get(e.pointerId);
    if (!prev || !start.current) return;
    const p = [...pts.current.values()];
    if (p.length > 1) {
      // chụm / mở 2 ngón: thu phóng
      pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const q = [...pts.current.values()];
      const d = Math.hypot(q[0].x - q[1].x, q[0].y - q[1].y);
      if (start.current.dist > 0) onChange({ ...view, z: clamp(r1((start.current.view.z * d) / start.current.dist * 100) / 100, ZOOM_RANGE.min, ZOOM_RANGE.max) });
      return;
    }
    const d = toPercent(e.clientX - prev.x, e.clientY - prev.y, view);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    onChange({ ...view, x: r1(clamp(view.x + d.x, 0, 100)), y: r1(clamp(view.y + d.y, 0, 100)) });
  };
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    pts.current.delete(e.pointerId);
    const p = [...pts.current.values()];
    start.current = p.length ? { view, dist: 0 } : null;
  };

  // lăn chuột để thu phóng (cần listener không passive để chặn cuộn trang)
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      onFocus();
      onChange({ ...view, z: clamp(Math.round((view.z - e.deltaY * 0.0015) * 100) / 100, ZOOM_RANGE.min, ZOOM_RANGE.max) });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [view, onChange, onFocus]);

  const a = frameAttrs(view);
  return (
    <figure className="flex flex-col items-center gap-2">
      <div
        ref={box}
        role="slider"
        tabIndex={0}
        aria-label={`Kéo để căn ảnh (${label}). Dùng phím mũi tên để dịch, + / - để thu phóng.`}
        aria-valuetext={`Điểm căn ${Math.round(view.x)}% ngang, ${Math.round(view.y)}% dọc, thu phóng ${Math.round(view.z * 100)}%`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onFocus={onFocus}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 5 : 1;
          const k: Record<string, Partial<FrameView>> = {
            ArrowLeft: { x: clamp(view.x + step, 0, 100) },
            ArrowRight: { x: clamp(view.x - step, 0, 100) },
            ArrowUp: { y: clamp(view.y + step, 0, 100) },
            ArrowDown: { y: clamp(view.y - step, 0, 100) },
            "+": { z: clamp(view.z + 0.05, ZOOM_RANGE.min, ZOOM_RANGE.max) },
            "=": { z: clamp(view.z + 0.05, ZOOM_RANGE.min, ZOOM_RANGE.max) },
            "-": { z: clamp(view.z - 0.05, ZOOM_RANGE.min, ZOOM_RANGE.max) },
          };
          if (k[e.key]) {
            e.preventDefault();
            onChange({ ...view, ...k[e.key] });
          }
        }}
        className={`tcw-frame cursor-grab touch-none select-none bg-zinc-200 outline-none ring-offset-2 active:cursor-grabbing ${active ? "ring-2 ring-rose-500" : "ring-1 ring-zinc-300"} focus-visible:ring-4`}
        style={{ width, height, borderRadius: target.radius, clipPath: target.clipPath, ...(a.style as CSSProperties) }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" draggable={false} />
        {/* lưới 1/3 giúp căn bố cục */}
        <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity [background:linear-gradient(to_right,transparent_33.2%,rgb(255_255_255/.6)_33.3%,transparent_33.5%,transparent_66.5%,rgb(255_255_255/.6)_66.6%,transparent_66.8%),linear-gradient(to_bottom,transparent_33.2%,rgb(255_255_255/.6)_33.3%,transparent_33.5%,transparent_66.5%,rgb(255_255_255/.6)_66.6%,transparent_66.8%)] [div:active>&]:opacity-100" />
      </div>
      <figcaption className={`text-xs ${active ? "font-semibold text-rose-700" : "text-zinc-500"}`}>{label}</figcaption>
    </figure>
  );
}

export function FrameEditor({
  src,
  value,
  desktop,
  mobile,
  title = "Chỉnh ảnh",
  note,
  onApply,
  onClose,
  onDraft,
}: {
  src: string;
  value?: ImgFrame | null;
  desktop: FrameTarget;
  mobile: FrameTarget;
  title?: string;
  note?: ReactNode;
  onApply: (frame: ImgFrame | null) => void;
  onClose: () => void;
  /** Gọi mỗi khi thay đổi để bản xem trước bên ngoài cập nhật ngay (vd khung điện thoại trong trình sửa thiệp). */
  onDraft?: (frame: ImgFrame | null) => void;
}) {
  const init = value ?? null;
  const [base, setBase] = useState<FrameView>(init ? { x: init.x, y: init.y, z: init.z, fit: init.fit } : DEFAULT_VIEW);
  const [mob, setMob] = useState<FrameView | null>(init?.m ?? null);
  const [device, setDevice] = useState<Device>("desktop");
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  // tỉ lệ hai khung khác nhau rõ (vd ảnh bìa: ngang trên máy tính, dọc trên điện thoại) → gợi ý căn riêng
  const differ = Math.abs(desktop.aspect - mobile.aspect) / Math.max(desktop.aspect, mobile.aspect) > 0.08;

  useEffect(() => {
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  const frame: ImgFrame = useMemo(() => (mob ? { ...base, m: mob } : base), [base, mob]);
  useEffect(() => onDraft?.(frame), [frame, onDraft]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const active: FrameView = device === "mobile" && mob ? mob : base;
  const setActive = (v: FrameView) => (device === "mobile" && mob ? setMob(v) : setBase(v));
  const editMobile = (v: FrameView) => (mob ? setMob(v) : setBase(v));
  const zoomPct = Math.round(active.z * 100);
  const seg = (on: boolean) => `min-h-10 flex-1 rounded-lg px-3 text-sm font-medium ${on ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"}`;

  // khung xem trước vừa hộp thoại: máy tính rộng, điện thoại hẹp
  const dW = Math.round(clamp(360 * Math.sqrt(desktop.aspect), 220, 420));
  const mW = Math.round(clamp(170 * Math.sqrt(mobile.aspect), 110, 220));

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[96svh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3">
          <h2 className="min-w-0 flex-1 truncate font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-lg text-xl text-zinc-500 hover:bg-zinc-100" aria-label="Đóng">
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <p className="text-sm text-zinc-600">Kéo ảnh trong khung để căn (chuột hoặc ngón tay), lăn chuột / chụm hai ngón hoặc dùng thanh trượt để thu phóng. Ảnh gốc không bị cắt.</p>
          {note && <div className="mt-2 text-xs text-zinc-500">{note}</div>}
          <div className="mt-4 flex flex-wrap items-end justify-center gap-6 rounded-xl bg-zinc-50 p-4">
            <Stage src={src} view={base} target={desktop} width={dW} natural={natural} active={device === "desktop" || !mob} label="Máy tính" onFocus={() => setDevice("desktop")} onChange={setBase} />
            <Stage
              src={src}
              view={mob ?? base}
              target={mobile}
              width={mW}
              natural={natural}
              active={device === "mobile"}
              label={mob ? "Điện thoại (căn riêng)" : "Điện thoại"}
              onFocus={() => setDevice("mobile")}
              onChange={editMobile}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Cách hiển thị {mob ? (device === "mobile" ? "· điện thoại" : "· máy tính") : ""}</p>
              <div className="mt-1 flex gap-1 rounded-xl border border-zinc-200 p-1" role="radiogroup" aria-label="Cách hiển thị ảnh">
                <button type="button" role="radio" aria-checked={active.fit === "cover"} className={seg(active.fit === "cover")} onClick={() => setActive({ ...active, fit: "cover" })}>
                  Lấp đầy khung
                </button>
                <button type="button" role="radio" aria-checked={active.fit === "contain"} className={seg(active.fit === "contain")} onClick={() => setActive({ ...active, fit: "contain" })}>
                  Hiện toàn bộ ảnh
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="tcw-zoom">
                Thu phóng <span className="tabular-nums text-zinc-500">{zoomPct}%</span>
              </label>
              <div className="mt-1 flex items-center gap-2">
                <button type="button" className="h-10 w-10 rounded-lg border border-zinc-300 text-lg" aria-label="Thu nhỏ" onClick={() => setActive({ ...active, z: clamp(Math.round((active.z - 0.1) * 100) / 100, ZOOM_RANGE.min, ZOOM_RANGE.max) })}>
                  −
                </button>
                <input
                  id="tcw-zoom"
                  type="range"
                  min={ZOOM_RANGE.min}
                  max={ZOOM_RANGE.max}
                  step={0.01}
                  value={active.z}
                  onChange={(e) => setActive({ ...active, z: Number(e.target.value) })}
                  className="w-full accent-rose-600"
                />
                <button type="button" className="h-10 w-10 rounded-lg border border-zinc-300 text-lg" aria-label="Phóng to" onClick={() => setActive({ ...active, z: clamp(Math.round((active.z + 0.1) * 100) / 100, ZOOM_RANGE.min, ZOOM_RANGE.max) })}>
                  +
                </button>
              </div>
            </div>
          </div>

          <label className="mt-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={Boolean(mob)}
              onChange={(e) => {
                setMob(e.target.checked ? { ...base } : null);
                setDevice(e.target.checked ? "mobile" : "desktop");
              }}
            />
            <span>
              <b>Căn riêng trên điện thoại</b>
              <span className="block text-xs text-zinc-500">
                {differ ? "Khung trên điện thoại có tỉ lệ khác máy tính: bật để căn riêng." : "Mặc định điện thoại và máy tính dùng chung một cách căn."}
              </span>
            </span>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 px-4 py-3">
          <button
            type="button"
            className="min-h-11 rounded-lg px-3 text-sm text-zinc-700 underline-offset-4 hover:underline"
            onClick={() => {
              setBase(DEFAULT_VIEW);
              setMob(null);
              setDevice("desktop");
            }}
          >
            Đặt lại
          </button>
          <span className="flex-1" />
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Huỷ
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onApply(frame)}>
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
