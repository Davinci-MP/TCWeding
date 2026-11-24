"use client";

import { useRef, useState, type ReactNode } from "react";

export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Tải lên thất bại");
  return json.url as string;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input type={type} className="input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <Field label={label}>
      <textarea className="input" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function UploadButton({
  accept,
  onUploaded,
  multiple,
  children,
}: {
  accept: string;
  onUploaded: (urls: string[]) => void;
  multiple?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-outline" disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? "Đang tải…" : children}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          try {
            const urls: string[] = [];
            for (const f of files) urls.push(await uploadFile(f));
            onUploaded(urls);
          } catch (err) {
            alert((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value && <img src={value} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input className="input" placeholder="Dán link ảnh hoặc tải lên" value={value} onChange={(e) => onChange(e.target.value)} />
          <div className="flex gap-2">
            <UploadButton accept="image/*" onUploaded={([u]) => onChange(u)}>
              Tải ảnh lên
            </UploadButton>
            {value && (
              <button type="button" className="btn btn-outline" onClick={() => onChange("")}>
                Xoá
              </button>
            )}
          </div>
        </div>
      </div>
    </Field>
  );
}

/** Khung cho 1 phần tử trong danh sách (sự kiện, câu chuyện, tài khoản…) */
export function ListItem({
  title,
  onRemove,
  onUp,
  onDown,
  children,
}: {
  title: string;
  onRemove: () => void;
  onUp?: () => void;
  onDown?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{title}</p>
        <div className="flex gap-1 text-sm">
          {onUp && (
            <button type="button" className="rounded px-2 hover:bg-zinc-200" onClick={onUp} aria-label="Lên">
              ↑
            </button>
          )}
          {onDown && (
            <button type="button" className="rounded px-2 hover:bg-zinc-200" onClick={onDown} aria-label="Xuống">
              ↓
            </button>
          )}
          <button type="button" className="rounded px-2 text-red-600 hover:bg-red-50" onClick={onRemove}>
            Xoá
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

export function move<T>(arr: T[], i: number, d: -1 | 1) {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
