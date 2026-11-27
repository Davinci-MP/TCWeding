import type { CSSProperties } from "react";
import { frameAttrs, type ImgFrame } from "@/lib/imageFrame";

/**
 * Ảnh theo cách căn thủ công của vị trí (dùng được trong Server Component).
 * Chưa có thiết lập → thẻ <img> như cũ (object-cover với className truyền vào), nên trang cũ không đổi.
 * Có thiết lập → khung .tcw-frame mang className (kích thước, bo góc…), ảnh bên trong căn theo thiết lập.
 */
export function FramedImg({
  src,
  alt = "",
  frame,
  className = "",
  scope = "viewport",
  loading,
  fetchPriority,
  style,
}: {
  src: string;
  alt?: string;
  frame?: ImgFrame | null;
  className?: string;
  scope?: "container" | "viewport";
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  style?: CSSProperties;
}) {
  if (!frame) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading={loading} fetchPriority={fetchPriority} className={`object-cover ${className}`} style={style} />;
  }
  const a = frameAttrs(frame, scope);
  // khung giữ mọi lớp định kích thước; lớp "absolute" của ảnh nền vẫn giữ nguyên vị trí
  return (
    <span className={`tcw-frame ${className}`} style={{ ...style, ...a.style }} data-m={a["data-m"]}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading={loading} fetchPriority={fetchPriority} />
    </span>
  );
}
