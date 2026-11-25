"use client";

import { MAX_FAVORITES, toggleFavorite, useFavorites, type Favorite } from "./favorites";

/** Nút thả tim một ảnh. `variant="overlay"` nằm trên ảnh trong lưới, `"dark"` dùng trong trình xem ảnh lớn. */
export function HeartButton({ photo, variant = "overlay", index }: { photo: Favorite; variant?: "overlay" | "dark"; index?: number }) {
  const favs = useFavorites();
  const on = favs.some((f) => f.url === photo.url);
  const label = `${on ? "Bỏ thích" : "Thích"} ảnh${index ? ` ${index}` : ""}`;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={on ? "Bỏ thích" : "Thả tim để gửi cho studio"}
      onClick={(e) => {
        e.stopPropagation();
        if (!toggleFavorite(photo)) alert(`Bạn đã thả tim tối đa ${MAX_FAVORITES} ảnh. Bỏ bớt ảnh để chọn thêm.`);
      }}
      className={
        variant === "overlay"
          ? `absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur transition active:scale-90 ${
              on ? "bg-white text-[#b3261e] opacity-100" : "bg-black/30 text-white opacity-100 hover:bg-black/45 sm:opacity-0 sm:group-hover/photo:opacity-100 sm:focus-visible:opacity-100"
            }`
          : `flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition active:scale-95 ${on ? "bg-white text-[#b3261e]" : "bg-white/10 text-white hover:bg-white/20"}`
      }
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2 0 3.6 1.1 5.4 3.2 1.8-2.1 3.4-3.2 5.4-3.2 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z" />
      </svg>
      {variant === "dark" && (on ? "Đã thích" : "Thích ảnh này")}
    </button>
  );
}
