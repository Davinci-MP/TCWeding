import { NextResponse } from "next/server";
import { publicShowcaseData } from "@/lib/showcase";
import { TEMPLATES } from "@/templates/registry";

// Trình duyệt luôn hỏi lại (ảnh bìa mới hiện ngay khi tải lại trang); CDN (Vercel) giữ 30 giây để đỡ truy vấn DB.
const CACHE = { "Cache-Control": "public, max-age=0, must-revalidate", "CDN-Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" };

/**
 * Dữ liệu "Xem mẫu" của một mẫu: bản giới thiệu đã duyệt (dữ liệu sạch, tên demo, ảnh công khai) và ảnh bìa riêng.
 * 404 = dùng bản demo mặc định ở trình duyệt.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!TEMPLATES.some((t) => t.id === id)) return NextResponse.json(null, { status: 404 });
  const data = await publicShowcaseData(id);
  if (!data) return NextResponse.json(null, { status: 404, headers: CACHE });
  return NextResponse.json(data, { headers: CACHE });
}
