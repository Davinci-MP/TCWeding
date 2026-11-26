"use client";

import { TemplateThumb } from "@/components/TemplateThumb";
import { templateCode } from "@/lib/thiep";
import { toggleTemplateFavorite, useTemplateFavorites } from "./templateFavorites";

/** Thông tin mẫu gửi xuống client (không kèm cấu hình server). */
export type TplLite = {
  id: string;
  name: string;
  description: string;
  category: string;
  premium: boolean;
  fonts: string;
  /** Thiết kế gốc (bố cục) và tên phối màu — để lọc trong thư viện mẫu. */
  design: string;
  color: string;
};

export function HeartIcon({ on, size = 18 }: { on: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2 0 3.6 1.1 5.4 3.2 1.8-2.1 3.4-3.2 5.4-3.2 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

/** Thẻ mẫu thiệp: ảnh thu nhỏ chạy thật + mã + tên. Bấm thẻ để mở hộp chọn mẫu. */
export function TemplateCard({ t, onOpen, dark = false, height = 380 }: { t: TplLite; onOpen: () => void; dark?: boolean; height?: number }) {
  const favs = useTemplateFavorites();
  const liked = favs.includes(t.id);
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onOpen}
        className={`block w-full overflow-hidden rounded-2xl text-left ring-offset-2 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d8a0a8] ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}
        aria-label={`${templateCode(t.id)} ${t.name}: xem chi tiết mẫu`}
      >
        <div className="transition duration-500 group-hover:scale-[1.02]">
          <TemplateThumb templateId={t.id} height={height} />
        </div>
      </button>
      <button
        type="button"
        onClick={() => toggleTemplateFavorite(t.id)}
        aria-pressed={liked}
        aria-label={`${liked ? "Bỏ thích" : "Thả tim"} mẫu ${templateCode(t.id)}`}
        className={`absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full shadow backdrop-blur transition active:scale-90 ${liked ? "bg-white text-[#c0392b]" : "bg-black/35 text-white hover:bg-black/50"}`}
      >
        <HeartIcon on={liked} />
      </button>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className={`text-sm font-semibold tracking-wide ${dark ? "text-white" : "text-[#1d1a17]"}`}>{templateCode(t.id)}</p>
        {t.premium && <span className={`text-[11px] font-medium ${dark ? "text-[#d8cdbf]" : "text-[#7b2d26]"}`}>Premium</span>}
      </div>
      <p className={`mt-0.5 line-clamp-1 text-sm ${dark ? "text-white/60" : "text-zinc-600"}`}>
        {t.category} · {t.name}
      </p>
    </div>
  );
}
