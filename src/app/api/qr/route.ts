import { clientIp, rateLimit } from "@/lib/rateLimit";

// Tải mã VietQR về máy ("Lưu mã QR"): img.vietqr.io không cho trình duyệt tải trực tiếp (CORS),
// nên server lấy hộ. Chỉ nhận đúng tham số của mã VietQR, không nhận URL tuỳ ý.
export async function GET(req: Request) {
  if (!rateLimit(`qr:${clientIp(req)}`, 20)) return new Response("Thử lại sau", { status: 429 });
  const q = new URL(req.url).searchParams;
  const bank = q.get("b") ?? "";
  const acc = q.get("a") ?? "";
  const name = (q.get("n") ?? "").slice(0, 60);
  const info = (q.get("t") ?? "").slice(0, 60);
  if (!/^[A-Za-z0-9]{2,12}$/.test(bank) || !/^[0-9A-Za-z]{4,30}$/.test(acc)) return new Response("Sai tham số", { status: 400 });
  const src = `https://img.vietqr.io/image/${bank}-${acc}-compact.png?${new URLSearchParams({ accountName: name, addInfo: info })}`;
  const res = await fetch(src, { cache: "force-cache" }).catch(() => null);
  if (!res?.ok) return new Response("Không tải được mã QR", { status: 502 });
  return new Response(await res.arrayBuffer(), {
    headers: { "Content-Type": "image/png", "Content-Disposition": `attachment; filename="qr-mung-cuoi-${acc}.png"`, "Cache-Control": "public, max-age=86400" },
  });
}
