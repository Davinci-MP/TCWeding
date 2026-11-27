"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { demoInvitationData } from "@/lib/invitation";
import { applyCover, type TemplateCover } from "@/lib/templateCover";
import { useTemplateCovers } from "@/lib/useTemplateCovers";
import { getTemplateDef } from "@/templates/registry";
import { InvitationView } from "@/templates/InvitationView";

const INNER_WIDTH = 400;

/** Ảnh thu nhỏ chỉ rộng ~400px: đổi ảnh Unsplash 1200–1600px sang bản 480px (nhẹ hơn 5–10 lần). */
function shrinkPhotos<T>(data: T): T {
  return JSON.parse(JSON.stringify(data).replace(/(images\.unsplash\.com\/[^"]*?[?&]w=)\d+/g, "$1480")) as T;
}

/**
 * Ảnh thu nhỏ "sống" của một mẫu thiệp: render thật phần đầu thiệp, thu nhỏ bằng CSS.
 * Chỉ dựng khi sắp cuộn tới (không render ở server): tránh trình duyệt tải trước ảnh và font
 * của mọi mẫu ngay khi mở trang. Trước đó hiện khung màu của mẫu.
 */
export function TemplateThumb({
  templateId,
  height = 460,
  cover: override,
}: {
  templateId: string;
  height?: number;
  /** Ảnh bìa xem trước (admin đang chỉnh); undefined = ảnh bìa đã lưu của mẫu, null = ảnh demo mặc định. */
  cover?: TemplateCover | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);
  const [visible, setVisible] = useState(false);
  const tpl = getTemplateDef(templateId);
  const covers = useTemplateCovers();
  const cover = override !== undefined ? override : covers?.[templateId];
  const ready = override !== undefined || covers !== null;
  const data = useMemo(() => applyCover(shrinkPhotos(demoInvitationData(tpl.demoCover)), cover), [tpl.demoCover, cover]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / INNER_WIDTH));
    ro.observe(el);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="pointer-events-none relative w-full overflow-hidden" style={{ height, background: tpl.colors.heroBg }} aria-hidden>
      {visible && ready && (
        <div
          style={{ width: INNER_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left", "--hero-h": "680px" } as React.CSSProperties}
          className="absolute left-0 top-0"
        >
          <InvitationView templateId={templateId} data={data} slug="demo" mode="thumb" />
        </div>
      )}
    </div>
  );
}
