import Link from "next/link";
import { notFound } from "next/navigation";
import { CoverStudio } from "@/components/admin/CoverStudio";
import { galleryNeighbors, getCoverState, publicPhotoCandidates } from "@/lib/showcase";
import { templateCode } from "@/lib/thiep";
import { TEMPLATES } from "@/templates/registry";

export const metadata = { title: "Ảnh bìa mẫu" };

export default async function TemplateCoverPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const t = TEMPLATES.find((x) => x.id === templateId);
  if (!t) notFound();
  const [state, candidates, neighbors] = await Promise.all([getCoverState(templateId), publicPhotoCandidates(), galleryNeighbors(templateId)]);
  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/showcase" className="text-sm text-zinc-500 hover:underline">
          ← Bản giới thiệu & ảnh bìa
        </Link>
        <h1 className="font-display mt-1 text-3xl font-semibold">
          Ảnh bìa {templateCode(templateId)} · {t.name}
        </h1>
        <p className="text-sm text-zinc-500">{t.baseId ? "Biến thể màu: có ảnh bìa riêng, không ảnh hưởng mẫu gốc." : "Mẫu gốc: ảnh bìa không áp cho các biến thể màu."}</p>
      </div>
      <div className="card">
        <CoverStudio templateId={templateId} current={state.current} history={state.history} candidates={candidates} neighbors={neighbors} />
      </div>
    </div>
  );
}
