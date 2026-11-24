"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TemplateThumb } from "@/components/TemplateThumb";

/** Xấp thiệp xoè ra như thiệp in đặt trên bàn; tự đổi mẫu, xoè rộng khi rê chuột. */
export function CardFan({ templates }: { templates: { id: string; name: string }[] }) {
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || templates.length <= 3) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const t = setInterval(() => setOffset((o) => (o + 1) % templates.length), 4200);
    return () => clearInterval(t);
  }, [paused, templates.length]);

  const pick = [0, 1, 2].map((i) => templates[(offset + i) % templates.length]);
  const pose = [
    "-translate-x-[46%] -rotate-[11deg] group-hover:-translate-x-[62%] group-hover:-rotate-[15deg]",
    "z-10 -translate-y-3 group-hover:-translate-y-6",
    "translate-x-[46%] rotate-[11deg] group-hover:translate-x-[62%] group-hover:rotate-[15deg]",
  ];

  return (
    <div
      className="group relative mx-auto h-[520px] w-full max-w-[560px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* quầng sáng phía sau */}
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d8cdbf]/25 blur-3xl" aria-hidden />
      {pick.map((t, i) => (
        <Link
          key={`${t.id}-${i}`}
          href={`/templates/${t.id}`}
          aria-label={`Xem thử mẫu ${t.name}`}
          className={`absolute left-1/2 top-6 w-[220px] -ml-[110px] origin-bottom overflow-hidden rounded-[28px] border-[6px] border-[#2b2622] bg-[#2b2622] shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)] transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8cdbf] ${pose[i]}`}
        >
          <div key={t.id} className="tpl-rise overflow-hidden rounded-[22px]">
            <TemplateThumb templateId={t.id} height={440} />
          </div>
        </Link>
      ))}
      <p className="absolute inset-x-0 bottom-0 text-center text-xs uppercase tracking-[0.35em] text-white/50" aria-live="polite">
        {pick[1]?.name}
      </p>
    </div>
  );
}
