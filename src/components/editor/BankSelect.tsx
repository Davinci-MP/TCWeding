"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { bankLabel, findBank, matchBankText, searchBanks, type VnBank } from "@/lib/vnBanks";

type Value = { bankCode: string; bankBin?: string; bankName: string };

/**
 * Chọn ngân hàng nhận: gõ tên, tên viết tắt, mã hoặc BIN rồi chọn trong danh sách VietQR.
 * Chọn xong lưu mã VietQR + BIN chuẩn cùng tên hiển thị. Chữ gõ tự do không khớp ngân hàng nào → chưa có mã (không tạo QR).
 */
export function BankSelect({ value, onChange }: { value: Value; onChange: (v: Value) => void }) {
  const selected = findBank(value.bankCode);
  const [text, setText] = useState(selected ? selected.short : value.bankName);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const results = useMemo(() => searchBanks(open ? text : "", 10), [text, open]);

  // Đổi tài khoản khác (danh sách sắp xếp lại) → hiện đúng ngân hàng đã lưu
  useEffect(() => {
    setText(findBank(value.bankCode)?.short ?? value.bankName);
  }, [value.bankCode, value.bankName]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const pick = (b: VnBank) => {
    onChange({ bankCode: b.code, bankBin: b.bin, bankName: b.short || b.name });
    setText(b.short || b.name);
    setOpen(false);
  };
  const commitTyped = () => {
    if (selected && (text === selected.short || text === selected.name)) return;
    const m = matchBankText(text);
    if (m) pick(m);
    else onChange({ bankCode: "", bankBin: "", bankName: text.trim() });
  };

  const missing = !selected && text.trim() !== "";
  return (
    <div ref={box} className="relative">
      <label htmlFor={id} className="label">
        Ngân hàng nhận
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        autoComplete="off"
        className={`input ${missing ? "border-amber-500" : ""}`}
        placeholder="Gõ tên ngân hàng, vd: OCB, Vietcombank, MB"
        value={text}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && open && results[active]) {
            e.preventDefault();
            pick(results[active]);
          } else if (e.key === "Escape") setOpen(false);
        }}
        onBlur={() => setTimeout(commitTyped, 150)}
      />
      {open && results.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 text-sm shadow-lg">
          {results.map((b, i) => (
            <li
              key={b.code}
              role="option"
              aria-selected={b.code === selected?.code}
              onPointerDown={(e) => {
                e.preventDefault();
                pick(b);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-baseline gap-2 px-3 py-2 ${i === active ? "bg-zinc-100" : ""}`}
            >
              <span className="w-24 shrink-0 font-semibold">{b.short || b.code}</span>
              <span className="min-w-0 flex-1 truncate text-zinc-600">{b.name}</span>
              <span className="shrink-0 font-mono text-xs text-zinc-400">{b.code}</span>
            </li>
          ))}
        </ul>
      )}
      {selected ? (
        <p className="mt-1 text-xs text-zinc-500">
          {bankLabel(selected)} · mã {selected.code} · BIN {selected.bin}
        </p>
      ) : missing ? (
        <p className="mt-1 text-xs text-amber-700">Chưa xác định được ngân hàng “{text.trim()}”. Hãy chọn đúng ngân hàng trong danh sách để thiệp tự tạo mã VietQR.</p>
      ) : null}
    </div>
  );
}
