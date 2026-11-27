"use client";

import { useEffect, useState } from "react";
import { DEMO_COUPLE } from "@/lib/invitation";
import { FONT_KIND_LABEL, FONTS, fontFamily, googleFontsUrl, type FontKind } from "@/lib/fonts";

/** Tải CSS Google Fonts của một font để xem trước (mỗi font chỉ tải một lần). */
function useFontCss(name: string) {
  useEffect(() => {
    const href = googleFontsUrl([name]);
    if (!href || document.querySelector(`link[data-font-preview="${CSS.escape(name)}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.fontPreview = name;
    document.head.appendChild(link);
  }, [name]);
}

type Props = {
  label: string;
  /** Tên font đang chọn; "" = mặc định (defaultLabel). */
  value?: string;
  defaultValue?: string;
  onChange?: (name: string) => void;
  /** Tên trường khi dùng trong <form> (server action). */
  name?: string;
  kinds?: FontKind[];
  /** Có lựa chọn "theo mẫu / mặc định" (giá trị ""). */
  defaultLabel?: string;
  /** Font dùng để xem trước khi chọn "mặc định". */
  defaultFont?: string;
  sample?: string;
  hint?: string;
  /** Ẩn dòng xem trước trên màn hình nhỏ (bảng chỉnh nhanh trên điện thoại). */
  compact?: boolean;
};

/** Chọn font từ danh sách có hỗ trợ tiếng Việt, kèm dòng chữ xem trước bằng chính font đó. */
export function FontPicker({ label, value, defaultValue = "", onChange, name, kinds = ["serif", "sans", "script"], defaultLabel, defaultFont = "", sample = `${DEMO_COUPLE.pair} — Trân trọng kính mời`, hint, compact }: Props) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const preview = current || defaultFont;
  useFontCss(preview);
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      <select
        name={name}
        value={current}
        onChange={(e) => {
          setInner(e.target.value);
          onChange?.(e.target.value);
        }}
        className="input mt-1"
      >
        {defaultLabel !== undefined && <option value="">{defaultLabel}</option>}
        {kinds.map((k) => (
          <optgroup key={k} label={FONT_KIND_LABEL[k]}>
            {FONTS.filter((f) => f.kind === k).map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <span className={`mt-2 truncate rounded-lg bg-zinc-50 px-3 py-2 text-xl text-zinc-800 ${compact ? "hidden sm:block" : "block"}`} style={{ fontFamily: fontFamily(preview) || undefined }}>
        {sample}
      </span>
    </label>
  );
}
