"use client";

import { useEffect, useRef, useState } from "react";

/** Điện thoại chạy thiệp mẫu thật (iframe), chỉ tải khi cuộn tới để trang chủ nhẹ. */
export function DemoPhone({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setLoad(true), io.disconnect()), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative mx-auto w-[300px] sm:w-[340px]">
      <div className="absolute -inset-10 rounded-full bg-[#d8cdbf]/20 blur-3xl" aria-hidden />
      <div className="relative overflow-hidden rounded-[44px] border-[10px] border-[#1d1a17] bg-[#1d1a17] shadow-[0_50px_100px_-40px_rgba(22,20,26,.7)]">
        <div className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-[#1d1a17]" aria-hidden />
        <div className="aspect-[9/19.5] w-full bg-[#f3ece3]">
          {load && <iframe src={src} title="Thiệp cưới mẫu — bấm thử" className="h-full w-full border-0" loading="lazy" />}
        </div>
      </div>
    </div>
  );
}
