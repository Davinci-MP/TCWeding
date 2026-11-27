import { vietQrImageUrl } from "@/lib/invitation";
import { clientIp, rateLimit } from "@/lib/rateLimit";

// Tải mã VietQR về máy ("Lưu mã QR"): img.vietqr.io không cho trình duyệt tải trực tiếp (CORS),
// nên server lấy hộ. Dùng đúng hàm tạo QR của thiệp (vietQrImageUrl) → QR tải về giống hệt QR đang hiển thị.
export async function GET(req: Request) {
  if (!rateLimit(`qr:${clientIp(req)}`, 20)) return new Response("Thử lại sau", { status: 429 });
  const q = new URL(req.url).searchParams;
  const src = vietQrImageUrl(q.get("b") ?? "", q.get("a") ?? "", q.get("n") ?? "", q.get("t") ?? "");
  if (!src) return new Response("Sai tham số", { status: 400 });
  const res = await fetch(src, { cache: "force-cache" }).catch(() => null);
  if (!res?.ok) return new Response("Không tải được mã QR", { status: 502 });
  // img.vietqr.io hiện chuyển .png sang .svg (khung + mã QR vector). Trả đúng kiểu ảnh; trình duyệt khách tự chuyển
  // sang PNG trước khi lưu. Tải về dạng tệp đính kèm, chặn mọi script trong SVG.
  const type = (res.headers.get("content-type") ?? "image/png").split(";")[0];
  const ext = type.includes("svg") ? "svg" : "png";
  const acc = (q.get("a") ?? "").replace(/[^0-9A-Za-z]/g, "");
  return new Response(await res.arrayBuffer(), {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="qr-mung-cuoi-${acc}.${ext}"`,
      "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
