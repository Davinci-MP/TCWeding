import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseInvitationData } from "@/lib/invitation";
import { InvitationView } from "@/templates/InvitationView";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ to?: string }> };

async function load(slug: string) {
  const inv = await db.invitation.findUnique({ where: { slug } });
  if (!inv) return null;
  if (inv.status === "PUBLISHED") return { inv, isOwner: false, draft: false };
  // Bản nháp: chỉ chủ thiệp hoặc admin xem được
  const user = await getCurrentUser();
  if (user && (user.id === inv.userId || user.role === "ADMIN")) return { inv, isOwner: true, draft: true };
  return null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const r = await load((await params).slug);
  if (!r) return { title: "Không tìm thấy thiệp" };
  const d = parseInvitationData(r.inv.data);
  const title = `Thiệp cưới ${d.groom.name} & ${d.bride.name}`;
  return {
    title: { absolute: title },
    description: d.invitationText.slice(0, 160),
    robots: { index: false },
    openGraph: { title, description: d.invitationText.slice(0, 160), images: d.coverPhoto ? [d.coverPhoto] : [] },
  };
}

export default async function PublicInvitation({ params, searchParams }: Params) {
  const { slug } = await params;
  const { to } = await searchParams;
  const r = await load(slug);
  if (!r) notFound();
  const { inv, draft } = r;

  const user = await getCurrentUser();
  if (!draft && user?.id !== inv.userId) {
    await db.invitation.update({ where: { id: inv.id }, data: { views: { increment: 1 } } });
  }

  const wishes = await db.wish.findMany({
    where: { invitationId: inv.id, hidden: false },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      {draft && (
        <div className="fixed inset-x-0 top-0 z-[60] bg-amber-400 py-1.5 text-center text-sm font-semibold text-amber-950">
          Bản nháp — chỉ bạn nhìn thấy. Xuất bản trong trình chỉnh sửa để chia sẻ với khách.
        </div>
      )}
      <InvitationView
        templateId={inv.templateId}
        data={parseInvitationData(inv.data)}
        slug={inv.slug}
        mode={draft ? "preview" : "live"}
        guestName={to?.slice(0, 80)}
        wishes={wishes.map((w) => ({ id: w.id, name: w.name, message: w.message, createdAt: w.createdAt.toISOString() }))}
      />
    </>
  );
}
