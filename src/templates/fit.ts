"use client";

import { useLayoutEffect, type RefObject } from "react";

/**
 * Tên cô dâu chú rể ở đầu thiệp tự thu nhỏ cho vừa màn hình.
 * Các mẫu đặt cỡ chữ tên rất lớn (48–72px); tên dài (vd "Nguyễn Hoàng Thiên Phúc") làm phần đầu thiệp
 * dài 1,5–2 màn hình. Hook này dùng CSS zoom trên từng <h1> ở phần đầu (zoom thu cả các chữ con dùng rem),
 * giảm dần tới khi tên cao không quá ~28% màn hình (gần bằng tên ngắn) và không chữ nào tràn ngang.
 * `scale` (Cỡ chữ tên trong trình soạn thảo) nhân thêm vào cỡ gốc của mẫu.
 */
export function useFitHeroNames(rootRef: RefObject<HTMLElement | null>, scale: number, thumb: boolean, deps: unknown[]) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;

    const fit = () => {
      const hero = root.querySelector<HTMLElement>("#dau-thiep") ?? root;
      const viewH = thumb ? 680 : window.innerHeight;
      const maxH = Math.max(150, viewH * 0.28);
      hero.querySelectorAll<HTMLElement>("h1").forEach((h) => {
        h.style.zoom = "";
        let z = scale;
        const apply = () => (h.style.zoom = z === 1 ? "" : String(z));
        apply();
        // Chữ dọc (vd mẫu Linen Offset) chạy theo chiều cao màn hình: cho phép tới 80% màn hình
        const limit = getComputedStyle(h).writingMode.startsWith("vertical") ? viewH * 0.8 : maxH;
        // Giảm 6% mỗi bước, không nhỏ hơn 40% cỡ của mẫu
        for (let i = 0; i < 18 && z > 0.4; i++) {
          const r = h.getBoundingClientRect();
          const tooTall = r.height > limit;
          const tooWide = h.scrollWidth > h.clientWidth + 1;
          if (!tooTall && !tooWide) break;
          z = Math.round(z * 0.94 * 1000) / 1000;
          apply();
        }
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    schedule();
    // Đo lại khi font tải xong hoặc khi đổi khổ màn hình
    document.fonts?.ready.then(schedule).catch(() => {});
    const ro = new ResizeObserver(schedule);
    ro.observe(root);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, thumb, ...deps]);
}
