import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTemplateDef, TEMPLATES } from "@/templates/registry";
import { QaView } from "./QaView";

// Trang QA cho kho mẫu (scripts/qa-templates.mjs): hiển thị trọn thiệp với dữ liệu thử và tự đo tràn khung.
// Chỉ chạy ở môi trường dev, hoặc khi server được bật với TCW_QA=1. Website thật trả 404.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "QA mẫu thiệp", robots: { index: false, follow: false } };

export default async function QaTemplate({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ data?: string; guest?: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.TCW_QA !== "1") notFound();
  const { id } = await params;
  if (!TEMPLATES.some((t) => t.id === id)) notFound();
  const { data = "demo", guest } = await searchParams;
  const tpl = getTemplateDef(id);
  return <QaView templateId={id} demoCover={tpl.demoCover} variant={data === "long" || data === "empty" ? data : "demo"} guest={guest} />;
}
