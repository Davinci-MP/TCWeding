"use client";

import { useEffect, useRef } from "react";
import { TemplateThumb } from "@/components/TemplateThumb";
import { templateCode, templateHash } from "@/lib/thiep";
import { Icon } from "@/templates/icons";
import { HeartIcon, type TplLite } from "./TemplateCard";
import { toggleTemplateFavorite, useTemplateFavorites } from "./templateFavorites";

/**
 * Hộp chi tiết một mẫu: xem trước trong khung điện thoại, chọn mẫu & điền thông tin (/thiep#chon-tc-02),
 * xem thiệp chạy thật (/thiep#tc-02), thả tim, chuyển mẫu trước/sau.
 */
export function TemplateModal({ list, index, onIndex, onClose }: { list: TplLite[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const t = list[index];
  const favs = useTemplateFavorites();
  const liked = t ? favs.includes(t.id) : false;
  const closeRef = useRef<HTMLButtonElement>(null);
  const go = (d: number) => onIndex((index + d + list.length) % list.length);

  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % list.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + list.length) % list.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, list.length, onClose, onIndex]);

  if (!t) return null;
  const code = templateCode(t.id);
  const pill = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-semibold transition";

  return (
    <div role="dialog" aria-modal="true" aria-label={`Mẫu ${code} ${t.name}`} className="fixed inset-0 z-50 overflow-y-auto bg-[#0f0c0b]/90 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex min-h-full items-center justify-center p-4 sm:p-8" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="grid w-full max-w-5xl items-center gap-8 md:grid-cols-[minmax(0,380px)_1fr] md:gap-12">
          <div className="mx-auto w-full max-w-[380px] rounded-[28px] bg-[#1b1716] p-3 shadow-2xl ring-1 ring-white/10">
            <div key={t.id} className="tpl-rise overflow-hidden rounded-[20px] bg-white" style={{ animationDuration: ".5s" }}>
              <TemplateThumb templateId={t.id} height={600} />
            </div>
          </div>
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
              {code} · {t.fonts}
            </p>
            <h2 className="font-serif-display mt-4 text-4xl leading-[1.05] sm:text-5xl">
              {t.category} · {t.name}
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/75">
              {t.description} Bản chạy thật có nhạc nền, đếm ngược, lịch cưới, chỉ đường, album, xác nhận tham dự và hộp mừng cưới.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`/thiep#chon-${templateHash(t.id)}`} className={`${pill} bg-[#d9a0a8] text-[#1d1a17] hover:bg-[#e8b6bd]`}>
                Chọn mẫu này & điền thông tin ↗
              </a>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <a href={`/thiep#${templateHash(t.id)}`} className={`${pill} border border-white/30 text-white hover:border-white`}>
                Xem thiệp chạy thật ↗
              </a>
              <button type="button" onClick={() => toggleTemplateFavorite(t.id)} aria-pressed={liked} className={`${pill} border ${liked ? "border-[#e8b6bd] bg-white text-[#c0392b]" : "border-white/30 text-white hover:border-white"}`}>
                <HeartIcon on={liked} />
                {liked ? "Đã thả tim" : "Thả tim mẫu này"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={() => go(-1)} aria-label="Mẫu trước" className={`${pill} w-14 border border-white/30 px-0 text-white hover:border-white`}>
                <Icon name="left" size={20} />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Mẫu sau" className={`${pill} w-14 border border-white/30 px-0 text-white hover:border-white`}>
                <Icon name="right" size={20} />
              </button>
              <button ref={closeRef} type="button" onClick={onClose} className={`${pill} border border-white/30 text-white hover:border-white`}>
                Đóng <Icon name="x" size={18} />
              </button>
            </div>
            <p className="mt-6 text-sm text-white/45">
              Mẫu {index + 1} / {list.length} · dùng phím ← → để chuyển mẫu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

