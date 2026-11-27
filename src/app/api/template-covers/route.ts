import { NextResponse } from "next/server";
import { getCoverMap } from "@/lib/showcase";

// Trình duyệt luôn hỏi lại (ảnh bìa mới hiện ngay khi tải lại trang); CDN (Vercel) giữ 30 giây để đỡ truy vấn DB.
const CACHE = { "Cache-Control": "public, max-age=0, must-revalidate", "CDN-Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" };

/** Ảnh bìa riêng của các mẫu cho kho mẫu (chỉ URL ảnh + cách căn, không có dữ liệu thiệp). */
export async function GET() {
  return NextResponse.json(await getCoverMap(), { headers: CACHE });
}
