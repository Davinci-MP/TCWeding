"use client";

import { createContext, useContext, useEffect, useState, type RefObject } from "react";
import { FontPicker } from "@/components/admin/FontPicker";
import { clampFieldSize, FIELD_SIZE_RANGE, type FieldStyle } from "@/lib/fieldTypo";
import { fontName } from "@/lib/fonts";

/* ------------------------------ Chọn ô đang chỉnh ------------------------------ */

type Ctx = { selected: string; styled: (id: string) => boolean; select: (id: string, from: "form" | "preview") => void };
export const FieldTypoContext = createContext<Ctx | null>(null);

/** Gắn vào ô nhập: bấm/focus vào ô thì chọn ô đó để chỉnh kiểu chữ; trả về nút "Aa" cạnh nhãn. */
export function useFieldTypo(id?: string) {
  const ctx = useContext(FieldTypoContext);
  if (!ctx || !id) return { onFocus: undefined, badge: null };
  const active = ctx.selected === id;
  const styled = ctx.styled(id);
  return {
    onFocus: () => ctx.select(id, "form"),
    badge: (
      <button
        type="button"
        onClick={() => ctx.select(id, "form")}
        aria-pressed={active}
        title="Chỉnh font và cỡ chữ của ô này"
        className={`ml-2 inline-flex h-6 items-center rounded-md border px-1.5 align-middle font-serif text-xs leading-none transition ${
          active ? "border-rose-600 bg-rose-600 text-white" : styled ? "border-rose-300 bg-rose-50 text-rose-700" : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
        }`}
      >
        Aa{styled && !active ? " •" : ""}
      </button>
    ),
  };
}

/* ------------------------------ Đo kiểu chữ mặc định trong bản xem trước ------------------------------ */

export type Measured = { font: string; size: number; text: string } | null;

/** Đọc font và cỡ chữ đang hiển thị của ô trong bản xem trước (để biết "mặc định của mẫu"). */
export function useMeasuredField(previewRef: RefObject<HTMLElement | null>, id: string, deps: unknown[]): Measured {
  const [m, setM] = useState<Measured>(null);
  useEffect(() => {
    if (!id) return setM(null);
    const read = () => {
      const el = previewRef.current?.querySelector<HTMLElement>(`[data-tf="${id}"]`);
      if (!el) return setM(null);
      // Tạm bỏ data-tf để đọc kiểu chữ gốc của mẫu (không bị thiết lập riêng của ô che), rồi trả lại ngay
      // trong cùng một khung hình nên không nhấp nháy.
      el.removeAttribute("data-tf");
      const cs = getComputedStyle(el);
      const next = { font: fontName(cs.fontFamily), size: Math.round(parseFloat(cs.fontSize)), text: (el.textContent ?? "").replace(/s+/g, " ").trim().slice(0, 60) };
      el.setAttribute("data-tf", id);
      setM(next);
    };
    const t = setTimeout(read, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, ...deps]);
  return m;
}

/* ------------------------------ Bảng chỉnh font + cỡ chữ của ô ------------------------------ */

type Props = {
  label: string;
  value: FieldStyle | undefined;
  /** Font/cỡ chữ của mẫu khi ô chưa có thiết lập riêng (đo từ bản xem trước). */
  base: Measured;
  sample: string;
  onChange: (patch: FieldStyle | null) => void;
  /** Tăng/giảm cỡ chữ d px, tính từ giá trị mới nhất (bấm nhanh liên tục không mất bước). */
  onStep: (d: number, from: number) => void;
  onClose: () => void;
};

export function FieldTypoBar({ label, value, base, sample, onChange, onStep, onClose }: Props) {
  const size = value?.size;
  const shown = size ?? base?.size;
  const [draft, setDraft] = useState(size ? String(size) : "");
  useEffect(() => setDraft(size ? String(size) : ""), [size, label]);
  const step = (d: number) => onStep(d, base?.size ?? 16);
  const commit = (raw: string) => {
    const n = Number(raw);
    if (!raw.trim()) onChange({ size: undefined });
    else if (Number.isFinite(n) && n > 0) {
      const c = clampFieldSize(n);
      onChange({ size: c });
      setDraft(String(c));
    } else setDraft(size ? String(size) : "");
  };
  const custom = Boolean(value?.font || value?.size);
  const outOfRange = draft !== "" && (Number(draft) < FIELD_SIZE_RANGE.min || Number(draft) > FIELD_SIZE_RANGE.max);

  return (
    <section aria-label={`Kiểu chữ của ô ${label}`} className="border-b border-rose-200 bg-rose-50/70 px-4 py-2 sm:py-3">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm">
          <span className="text-zinc-500">Kiểu chữ ô:</span> <strong>{label}</strong>
          {custom && <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-xs text-rose-700">đã chỉnh riêng</span>}
        </p>
        <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-zinc-500 hover:bg-white" aria-label="Đóng bảng kiểu chữ">
          ×
        </button>
      </div>
      <div className="mt-1 grid gap-2 sm:mt-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3">
        <FontPicker
          label="Font chữ"
          value={value?.font ?? ""}
          onChange={(v) => onChange({ font: v || undefined })}
          defaultLabel={`Theo mẫu${base?.font ? ` (${base.font})` : ""}`}
          defaultFont={base?.font ?? ""}
          sample={sample}
          compact
        />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm sm:block">
          <span className="font-medium">Cỡ chữ</span>
          <div className="flex items-center gap-1 sm:mt-1">
            <button type="button" onClick={() => step(-1)} disabled={(shown ?? 16) <= FIELD_SIZE_RANGE.min} className="h-11 w-11 rounded-lg border border-zinc-300 bg-white text-lg disabled:opacity-40" aria-label="Giảm cỡ chữ 1px">
              −
            </button>
            <label className="relative">
              <span className="sr-only">Cỡ chữ (px)</span>
              <input
                type="number"
                inputMode="numeric"
                min={FIELD_SIZE_RANGE.min}
                max={FIELD_SIZE_RANGE.max}
                step={1}
                value={draft}
                placeholder={base?.size ? String(base.size) : "–"}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={(e) => commit(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commit((e.target as HTMLInputElement).value)}
                aria-invalid={outOfRange}
                className="h-11 w-24 rounded-lg border border-zinc-300 bg-white pl-3 pr-9 text-right tabular-nums outline-none focus:border-rose-500"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">px</span>
            </label>
            <button type="button" onClick={() => step(1)} disabled={(shown ?? 16) >= FIELD_SIZE_RANGE.max} className="h-11 w-11 rounded-lg border border-zinc-300 bg-white text-lg disabled:opacity-40" aria-label="Tăng cỡ chữ 1px">
              +
            </button>
          </div>
          <p className={`text-xs sm:mt-1 ${outOfRange ? "text-red-600" : "text-zinc-500"}`}>
            {FIELD_SIZE_RANGE.min}–{FIELD_SIZE_RANGE.max} px{!size && base?.size ? ` · mẫu đang ~${base.size} px` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 sm:mt-2">
        <button type="button" onClick={() => onChange(null)} disabled={!custom} className="min-h-10 text-sm font-medium text-rose-700 underline-offset-4 hover:underline disabled:text-zinc-400 disabled:no-underline">
          Dùng mặc định của mẫu
        </button>
        <span className="hidden text-xs text-zinc-500 sm:inline">Chỉ áp cho ô này. Trên điện thoại hẹp, chữ tự thu nhỏ theo bề ngang để không tràn.</span>
      </div>
      {!base && <p className="mt-1 text-xs text-amber-700">Mẫu đang chọn không hiển thị ô này (hoặc phần chứa ô đang tắt), nên chưa thấy thay đổi trong bản xem trước.</p>}
    </section>
  );
}
