"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { demoInvitationData } from "@/lib/invitation";
import { getTemplateDef } from "@/templates/registry";
import { InvitationView } from "@/templates/InvitationView";

const INNER_WIDTH = 400;

/** Ảnh thu nhỏ "sống" của một mẫu thiệp: render thật phần đầu thiệp, thu nhỏ bằng CSS. */
export function TemplateThumb({ templateId, height = 460 }: { templateId: string; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);
  const data = useMemo(() => demoInvitationData(getTemplateDef(templateId).demoCover), [templateId]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / INNER_WIDTH));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="pointer-events-none relative w-full overflow-hidden" style={{ height }} aria-hidden>
      <div
        style={{ width: INNER_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left", "--hero-h": "680px" } as React.CSSProperties}
        className="absolute left-0 top-0"
      >
        <InvitationView templateId={templateId} data={data} slug="demo" mode="thumb" />
      </div>
    </div>
  );
}
