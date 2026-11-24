import { notFound } from "next/navigation";
import { Editor } from "@/components/editor/Editor";
import { getOwnedInvitation, requireUser } from "@/lib/auth";
import { parseInvitationData } from "@/lib/invitation";
import { getMusicLibrary } from "@/lib/settings";
import { listTemplates } from "@/lib/templates";

export const metadata = { title: "Chỉnh sửa thiệp" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const inv = await getOwnedInvitation((await params).id, user);
  if (!inv) notFound();
  const [templates, musicLibrary] = await Promise.all([listTemplates(), getMusicLibrary()]);
  return (
    <Editor
      id={inv.id}
      initial={{ templateId: inv.templateId, slug: inv.slug, status: inv.status, data: parseInvitationData(inv.data) }}
      templates={templates.map((t) => ({ id: t.id, name: t.name, category: t.category, isPremium: t.isPremium }))}
      canUsePremium={user.plan === "PREMIUM" || user.role === "ADMIN"}
      musicLibrary={musicLibrary}
    />
  );
}
