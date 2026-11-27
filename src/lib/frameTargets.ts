// Tỉ lệ khung (rộng / cao) + góc bo của từng chỗ ảnh hiển thị trên website, để bộ chỉnh ảnh xem trước đúng
// như trang công khai. Máy tính tính theo màn 1440 × 900, điện thoại 390 × 844 (trừ thanh đầu trang 64px).
import type { FrameTarget } from "@/components/frame/FrameEditor";

type Pair = { desktop: FrameTarget; mobile: FrameTarget };
const same = (aspect: number, radius?: string): Pair => ({ desktop: { aspect, radius }, mobile: { aspect, radius } });

export const SITE_TARGETS = {
  /** Trang chủ · ảnh nền mở đầu: phủ cả khung (calc(100svh − 4rem)). */
  hero: { desktop: { aspect: 1440 / 836 }, mobile: { aspect: 390 / 780 } } satisfies Pair,
  /** Trang chủ · ảnh giới thiệu 4:5. */
  intro: same(4 / 5),
  /** Trang chủ · ảnh dịch vụ 3:2. */
  service: same(3 / 2),
  /** Về tôi · chân dung 4:5. */
  portrait: same(4 / 5),
  /** Thẻ album (bộ sưu tập, trang chủ) 4:5. */
  albumCard: same(4 / 5),
  /** Đầu trang album: phủ khung min-h-[72svh]. */
  albumHero: { desktop: { aspect: 1440 / 648 }, mobile: { aspect: 390 / 608 } } satisfies Pair,
  /** Ô album mẫu ở trang chủ 4:3. */
  sampleTile: same(4 / 3),
} as const;

/** Bìa / trang album mẫu: đúng khổ album (vd 30x30 → 1, 25x35 → 0,71). */
export const bookTarget = (ratio: number): Pair => same(ratio || 1, "2px");
