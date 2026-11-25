import { redirect } from "next/navigation";
import { templateHash } from "@/lib/thiep";

/** Link xem thử mẫu cũ (/templates/<id>) chuyển sang thiệp chạy thật ở /thiep#tc-xx. */
export default async function OldTemplatePreview({ params }: { params: Promise<{ id: string }> }) {
  const hash = templateHash((await params).id);
  redirect(hash ? `/thiep#${hash}` : "/thiep");
}
