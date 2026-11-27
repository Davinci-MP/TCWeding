// Cỡ chữ tiêu đề trên website (trang chủ, Về tôi…). Dùng được cả client lẫn server.
// Tiêu đề dài mà vẫn giữ cỡ chữ "trưng bày" rất lớn sẽ chiếm cả màn hình, đẩy nội dung xuống dưới:
// cỡ chữ được chọn theo độ dài câu (Tự động) hoặc theo lựa chọn của admin, có giới hạn khi câu quá dài.

export type TitleSize = "auto" | "lg" | "md" | "sm";
export type BodySize = "sm" | "md" | "lg";

export const TITLE_SIZE_LABEL: Record<TitleSize, string> = { auto: "Tự động theo độ dài", lg: "Lớn", md: "Vừa", sm: "Nhỏ" };
export const BODY_SIZE_LABEL: Record<BodySize, string> = { sm: "Nhỏ", md: "Vừa (mặc định)", lg: "Lớn" };
export const isTitleSize = (v: unknown): v is TitleSize => v === "auto" || v === "lg" || v === "md" || v === "sm";
export const isBodySize = (v: unknown): v is BodySize => v === "sm" || v === "md" || v === "lg";

type Tier = 0 | 1 | 2 | 3; // 0 = lớn nhất

/** Bậc cỡ chữ: chọn theo độ dài khi "auto"; chọn tay vẫn bị hạ bậc khi câu quá dài. */
function tier(text: string, size: TitleSize, limits: [number, number, number]): Tier {
  const n = text.trim().length;
  const byLength: Tier = n <= limits[0] ? 0 : n <= limits[1] ? 1 : n <= limits[2] ? 2 : 3;
  if (size === "auto") return byLength;
  const chosen: Tier = size === "lg" ? 0 : size === "md" ? 1 : 2;
  return Math.max(chosen, byLength - 1) as Tier;
}

/** Tiêu đề lớn đầu trang (hero). */
export function heroTitleClass(text: string, size: TitleSize = "auto") {
  return [
    "text-[2.9rem] sm:text-7xl lg:text-[5.4rem]",
    "text-[2.3rem] sm:text-6xl lg:text-7xl",
    "text-[1.9rem] sm:text-5xl lg:text-6xl",
    "text-[1.6rem] sm:text-4xl lg:text-5xl",
  ][tier(text, size, [45, 80, 130])];
}

/** Tiêu đề mục (h2 lớn: Về chúng tôi, câu chuyện…). */
export function sectionTitleClass(text: string, size: TitleSize = "auto") {
  return [
    "text-4xl sm:text-5xl lg:text-[3.6rem]",
    "text-[2rem] sm:text-4xl lg:text-5xl",
    "text-[1.7rem] sm:text-3xl lg:text-4xl",
    "text-2xl sm:text-[1.7rem] lg:text-3xl",
  ][tier(text, size, [40, 80, 140])];
}
