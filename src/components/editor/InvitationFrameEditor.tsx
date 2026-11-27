"use client";

// Mở bộ chỉnh ảnh cho một vị trí trên thiệp. Khung xem trước lấy đúng tỉ lệ + góc bo của chỗ ảnh hiển thị:
// điện thoại đo từ khung xem trước của trình sửa (thiệp ~400px), máy tính đo từ một bản thiệp ẩn rộng 1280px.

import { useEffect, useRef, useState, type RefObject } from "react";
import { FrameEditor, type FrameTarget } from "@/components/frame/FrameEditor";
import type { ImgFrame } from "@/lib/imageFrame";
import type { InvitationData } from "@/lib/invitation";
import { InvitationView } from "@/templates/InvitationView";

/** Tỉ lệ mặc định khi mẫu không hiển thị vị trí này (phần chứa ảnh đang tắt…). */
const FALLBACK: Record<string, [number, number]> = { cover: [16 / 10, 9 / 19], feature: [16 / 9, 3 / 4], thanks: [16 / 9, 9 / 16] };
const fallbackOf = (key: string): [number, number] => FALLBACK[key] ?? (key.startsWith("gallery:") ? [4 / 3, 4 / 5] : [3 / 4, 3 / 4]);

/** Góc bo đo bằng px → % theo kích thước phần tử, để thu nhỏ đúng tỉ lệ trong khung xem trước. */
function radiusPct(cs: CSSStyleDeclaration, w: number, h: number) {
  const corners = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map((v) => {
    const [a, b = a] = v.split(" ").map((x) => parseFloat(x) || 0);
    return [Math.min(50, (a / w) * 100), Math.min(50, (b / h) * 100)];
  });
  if (corners.every(([a, b]) => !a && !b)) return undefined;
  return `${corners.map((c) => `${c[0].toFixed(2)}%`).join(" ")} / ${corners.map((c) => `${c[1].toFixed(2)}%`).join(" ")}`;
}

export function measureTarget(root: HTMLElement | null, key: string): FrameTarget | null {
  const el = root?.querySelector<HTMLElement>(`[data-fk="${key.replace(/["\\]/g, "\\$&")}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return null;
  let radius: string | undefined;
  let clipPath: string | undefined;
  // góc bo / clip-path nằm ở chính ảnh hoặc ở lớp cha cắt ảnh (khung vòm, tròn, bát giác…)
  for (let p: HTMLElement | null = el, i = 0; p && i < 6; p = p.parentElement, i++) {
    const cs = getComputedStyle(p);
    if (!clipPath && cs.clipPath && cs.clipPath !== "none") clipPath = cs.clipPath;
    if (!radius && (p === el || cs.overflow !== "visible")) {
      const pr = p.getBoundingClientRect();
      radius = radiusPct(cs, pr.width, pr.height);
    }
  }
  return { aspect: r.width / r.height, radius, clipPath };
}

export function InvitationFrameEditor({
  templateId,
  data,
  frameKey,
  src,
  title,
  previewRef,
  onApply,
  onClose,
  onDraft,
}: {
  templateId: string;
  data: InvitationData;
  frameKey: string;
  src: string;
  title: string;
  previewRef: RefObject<HTMLElement | null>;
  onApply: (f: ImgFrame | null) => void;
  onClose: () => void;
  onDraft: (f: ImgFrame | null) => void;
}) {
  const probe = useRef<HTMLDivElement>(null);
  const [targets, setTargets] = useState<{ desktop: FrameTarget; mobile: FrameTarget; found: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    const run = () => {
      if (!alive) return;
      const [fd, fm] = fallbackOf(frameKey);
      const mobile = measureTarget(previewRef.current, frameKey);
      const desktop = measureTarget(probe.current, frameKey);
      setTargets({ desktop: desktop ?? { aspect: fd }, mobile: mobile ?? { aspect: fm }, found: Boolean(mobile || desktop) });
    };
    const t = setTimeout(run, 350);
    document.fonts?.ready.then(() => setTimeout(run, 200));
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [frameKey, previewRef]);

  return (
    <>
      {/* bản thiệp ẩn rộng 1280px chỉ để đo khung trên máy tính */}
      <div ref={probe} aria-hidden className="pointer-events-none fixed left-[-20000px] top-0 h-[900px] w-[1280px] overflow-hidden opacity-0" inert>
        <InvitationView templateId={templateId} data={data} slug="frame-probe" mode="preview" />
      </div>
      {targets ? (
        <FrameEditor
          src={src}
          title={title}
          value={data.frames?.[frameKey] ?? null}
          desktop={targets.desktop}
          mobile={targets.mobile}
          note={!targets.found ? "Mẫu đang chọn chưa hiển thị vị trí này (hoặc phần chứa ảnh đang tắt), khung xem trước dùng tỉ lệ thường gặp." : "Khung xem trước lấy đúng tỉ lệ và góc bo của mẫu đang chọn. Bản xem trước điện thoại bên phải cập nhật ngay khi bạn kéo."}
          onApply={onApply}
          onClose={onClose}
          onDraft={onDraft}
        />
      ) : (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 text-sm text-white">Đang đo khung ảnh…</div>
      )}
    </>
  );
}
