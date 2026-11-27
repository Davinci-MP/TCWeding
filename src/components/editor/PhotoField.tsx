"use client";

import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { Field, UploadButton } from "./fields";

/** Yêu cầu kích thước cho từng loại ảnh nền. */
export type PhotoSpec = {
  /** Cạnh ngắn tối thiểu (px) để ảnh không bị vỡ trên màn hình lớn. */
  minShort: number;
  /** Hướng ảnh phù hợp nhất với vị trí hiển thị. */
  prefer: "portrait" | "landscape" | "any";
  /** Mô tả ngắn nơi ảnh xuất hiện. */
  where: string;
};

export const PHOTO_SPECS = {
  cover: { minShort: 1200, prefer: "portrait", where: "Ảnh phủ kín màn hình đầu thiệp — trên điện thoại khung hình dọc, trên máy tính khung ngang." },
  feature: { minShort: 1080, prefer: "landscape", where: "Ảnh tràn màn hình ở giữa thiệp, có chữ đè lên ở chính giữa." },
  thanks: { minShort: 1080, prefer: "any", where: "Ảnh nền cuối thiệp, lời cảm ơn nằm ở nửa dưới ảnh." },
} satisfies Record<string, PhotoSpec>;

type Size = { w: number; h: number };
type Notice = { tone: "ok" | "warn" | "bad"; text: string };

function parsePos(pos: string): [number, number] {
  const m = pos.match(/(-?[\d.]+)%\s+(-?[\d.]+)%/);
  return m ? [Number(m[1]), Number(m[2])] : [50, 50];
}
const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)));

function check(size: Size, spec: PhotoSpec): Notice[] {
  const out: Notice[] = [];
  const short = Math.min(size.w, size.h);
  const ratio = size.w / size.h;
  if (short < spec.minShort * 0.6)
    out.push({
      tone: "bad",
      text: `Ảnh quá nhỏ (${size.w} × ${size.h} px) nên sẽ bị mờ, vỡ hạt khi phủ kín màn hình. Hãy dùng ảnh có cạnh ngắn từ ${spec.minShort}px trở lên.`,
    });
  else if (short < spec.minShort)
    out.push({
      tone: "warn",
      text: `Ảnh hơi nhỏ (${size.w} × ${size.h} px). Trên điện thoại vẫn ổn, nhưng màn hình máy tính lớn có thể hơi mờ. Nên dùng ảnh từ ${spec.minShort}px.`,
    });
  if (spec.prefer === "portrait" && ratio > 1.2)
    out.push({
      tone: "warn",
      text: "Ảnh ngang sẽ bị cắt nhiều ở hai bên khi xem trên điện thoại (phần lớn khách mở thiệp bằng điện thoại). Kéo điểm lấy nét về phía hai người để không bị mất mặt.",
    });
  if (spec.prefer === "landscape" && ratio < 0.85)
    out.push({
      tone: "warn",
      text: "Ảnh dọc sẽ bị cắt nhiều phía trên và dưới khi xem trên máy tính. Kéo điểm lấy nét để giữ lại phần quan trọng.",
    });
  if (ratio > 2.6 || ratio < 0.38)
    out.push({ tone: "bad", text: "Ảnh quá dài hoặc quá hẹp — dù chỉnh thế nào cũng sẽ mất nhiều nội dung. Hãy chọn ảnh có tỉ lệ gần 3:4, 4:5 hoặc 3:2." });
  if (!out.length) out.push({ tone: "ok", text: `Kích thước tốt (${size.w} × ${size.h} px).` });
  return out;
}

const TONE: Record<Notice["tone"], string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
  bad: "border-red-200 bg-red-50 text-red-800",
};

/**
 * Trường ảnh nền: tải ảnh, báo kích thước không phù hợp và cho kéo chọn điểm lấy nét,
 * xem trước ngay trên khung điện thoại và máy tính.
 */
export function PhotoField({
  label,
  value,
  onChange,
  position,
  onPositionChange,
  spec,
  onFrame,
  framed,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  position: string;
  onPositionChange: (v: string) => void;
  spec: PhotoSpec;
  /** Mở bộ chỉnh ảnh (kéo, thu phóng, lấp đầy / hiện toàn bộ, căn riêng điện thoại). */
  onFrame?: () => void;
  /** Đã căn thủ công: cách căn này thay cho điểm lấy nét. */
  framed?: boolean;
}) {
  const [size, setSize] = useState<Size | null>(null);
  const [failed, setFailed] = useState(false);
  const [x, y] = parsePos(position);

  useEffect(() => {
    setSize(null);
    setFailed(false);
    if (!value) return;
    const img = new Image();
    img.onload = () => setSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setFailed(true);
    img.src = value;
    return () => {
      img.onload = img.onerror = null;
    };
  }, [value]);

  const set = (nx: number, ny: number) => onPositionChange(`${clamp(nx)}% ${clamp(ny)}%`);
  const notices = size ? check(size, spec) : [];

  return (
    <Field label={label}>
      <p className="-mt-1 mb-2 text-xs text-zinc-500">{spec.where}</p>
      <div className="flex flex-col gap-2">
        <input className="input" placeholder="Dán link ảnh hoặc tải lên" value={value} onChange={(e) => onChange(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <UploadButton accept="image/*" onUploaded={([u]) => (onChange(u), onPositionChange("50% 50%"))}>
            {value ? "Đổi ảnh" : "Tải ảnh lên"}
          </UploadButton>
          {value && onFrame && (
            <button type="button" className="btn btn-outline" onClick={onFrame}>
              Chỉnh ảnh{framed ? " ✓" : ""}
            </button>
          )}
          {value && (
            <button type="button" className="btn btn-outline" onClick={() => onChange("")}>
              Xoá
            </button>
          )}
        </div>
      </div>

      {value && failed && <p className={`mt-3 rounded-lg border px-3 py-2 text-sm ${TONE.bad}`}>Không mở được ảnh từ đường link này. Kiểm tra lại link hoặc tải ảnh lên.</p>}

      {value && !failed && (
        <div className="mt-4 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div aria-live="polite" className="space-y-2">
            {!size && <p className="text-sm text-zinc-500">Đang đọc kích thước ảnh…</p>}
            {notices.map((n) => (
              <p key={n.text} className={`rounded-lg border px-3 py-2 text-sm leading-relaxed ${TONE[n.tone]}`}>
                {n.text}
              </p>
            ))}
          </div>

          {framed ? (
            <p className="text-sm text-zinc-600">Ảnh đã được căn thủ công (thu phóng, cách hiển thị, căn riêng điện thoại). Bấm <b>Chỉnh ảnh</b> để sửa, hoặc <b>Đặt lại</b> trong bộ chỉnh để quay về điểm lấy nét.</p>
          ) : (
          <div>
            <p className="text-sm font-medium text-zinc-700">Chọn điểm lấy nét</p>
            <p className="text-xs text-zinc-500">Kéo chấm tròn tới khuôn mặt hai bạn. Bạn cũng có thể kéo thẳng trên khung xem trước, hoặc dùng phím mũi tên.</p>
            <FocalPicker src={value} x={x} y={y} onChange={set} size={size} />
          </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700">Khách sẽ thấy như thế này</p>
            <div className="flex flex-wrap items-end gap-4">
              <DragPreview src={value} x={x} y={y} onChange={set} label="Điện thoại" className="aspect-[9/19.5] w-[92px] rounded-[14px] border-[4px] border-zinc-800" />
              <DragPreview src={value} x={x} y={y} onChange={set} label="Máy tính" className="aspect-[16/10] w-[240px] rounded-md border-[4px] border-zinc-800" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="tabular-nums">
              Điểm lấy nét: ngang {x}% · dọc {y}%
            </span>
            {(x !== 50 || y !== 50) && (
              <button type="button" className="font-medium text-zinc-700 underline underline-offset-2" onClick={() => set(50, 50)}>
                Về giữa ảnh
              </button>
            )}
          </div>
        </div>
      )}
    </Field>
  );
}

/** Toàn bộ ảnh + chấm lấy nét kéo được. */
function FocalPicker({ src, x, y, onChange, size }: { src: string; x: number; y: number; onChange: (x: number, y: number) => void; size: Size | null }) {
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const at = (e: RPointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    onChange(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
  };
  return (
    <div
      ref={box}
      className="relative mt-2 w-full cursor-crosshair touch-none select-none overflow-hidden rounded-lg bg-zinc-200"
      style={{ aspectRatio: size ? `${size.w} / ${size.h}` : "4 / 3", maxHeight: 320 }}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        at(e);
      }}
      onPointerMove={(e) => dragging.current && at(e)}
      onPointerUp={() => (dragging.current = false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Ảnh đang chỉnh" draggable={false} className="pointer-events-none h-full w-full object-contain" />
      <span className="pointer-events-none absolute inset-0 bg-black/10" aria-hidden />
      <button
        type="button"
        role="slider"
        aria-label="Điểm lấy nét của ảnh"
        aria-valuetext={`Ngang ${x}%, dọc ${y}%`}
        aria-valuenow={x}
        aria-valuemin={0}
        aria-valuemax={100}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 10 : 2;
          const k: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
          if (!k[e.key]) return;
          e.preventDefault();
          onChange(x + k[e.key][0], y + k[e.key][1]);
        }}
        className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-white/20 shadow-[0_0_0_1px_rgba(0,0,0,.35),0_4px_12px_rgba(0,0,0,.35)] outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </button>
    </div>
  );
}

/** Khung thiết bị: ảnh cover theo điểm lấy nét; kéo để dời ảnh. */
function DragPreview({
  src,
  x,
  y,
  onChange,
  label,
  className,
}: {
  src: string;
  x: number;
  y: number;
  onChange: (x: number, y: number) => void;
  label: string;
  className: string;
}) {
  const start = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  return (
    <figure>
      <div
        className={`relative cursor-grab touch-none select-none overflow-hidden bg-zinc-800 active:cursor-grabbing ${className}`}
        onPointerDown={(e) => {
          start.current = { px: e.clientX, py: e.clientY, x, y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (!s) return;
          const r = e.currentTarget.getBoundingClientRect();
          // kéo ảnh sang phải = nhìn về phía trái ảnh
          onChange(s.x - ((e.clientX - s.px) / r.width) * 120, s.y - ((e.clientY - s.py) / r.height) * 120);
        }}
        onPointerUp={() => (start.current = null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" style={{ objectPosition: `${x}% ${y}%` }} />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" aria-hidden />
      </div>
      <figcaption className="mt-1 text-center text-[11px] text-zinc-500">{label}</figcaption>
    </figure>
  );
}
