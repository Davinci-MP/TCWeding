"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getOwnedInvitation, requireUser } from "@/lib/auth";
import { defaultInvitationData, toSlug, uid } from "@/lib/invitation";
import { FREE_INVITATION_LIMIT, getTemplateWithConfig } from "@/lib/templates";

async function uniqueSlug(base: string) {
  const root = toSlug(base) || "thiep-cuoi";
  let slug = root;
  while (await db.invitation.findUnique({ where: { slug } })) slug = `${root}-${uid().slice(0, 4)}`;
  return slug;
}

export async function createInvitationAction(fd: FormData) {
  const user = await requireUser();
  const templateId = String(fd.get("templateId") ?? "");
  const tpl = await getTemplateWithConfig(templateId);
  if (!tpl || !tpl.isActive) redirect("/dashboard/new?error=template");

  if (user.plan !== "PREMIUM" && user.role !== "ADMIN") {
    if (tpl.isPremium) redirect("/dashboard/new?error=premium");
    const count = await db.invitation.count({ where: { userId: user.id } });
    if (count >= FREE_INVITATION_LIMIT) redirect("/dashboard?error=limit");
  }

  const inv = await db.invitation.create({
    data: {
      userId: user.id,
      title: "Thiệp cưới của tôi",
      templateId: tpl.id,
      slug: await uniqueSlug(`thiep-cuoi-${uid().slice(0, 5)}`),
      data: JSON.stringify(defaultInvitationData()),
    },
  });
  redirect(`/dashboard/${inv.id}/edit`);
}

export async function deleteInvitationAction(fd: FormData) {
  const user = await requireUser();
  const inv = await getOwnedInvitation(String(fd.get("id")), user);
  if (inv) await db.invitation.delete({ where: { id: inv.id } });
  revalidatePath("/dashboard");
  revalidatePath("/admin/invitations");
}

export async function setWishHiddenAction(fd: FormData) {
  const user = await requireUser();
  const wish = await db.wish.findUnique({ where: { id: String(fd.get("id")) } });
  if (!wish) return;
  const inv = await getOwnedInvitation(wish.invitationId, user);
  if (!inv) return;
  await db.wish.update({ where: { id: wish.id }, data: { hidden: fd.get("hidden") === "1" } });
  revalidatePath(`/dashboard/${inv.id}/guests`);
}

export async function deleteRsvpAction(fd: FormData) {
  const user = await requireUser();
  const r = await db.rsvp.findUnique({ where: { id: String(fd.get("id")) } });
  if (!r) return;
  const inv = await getOwnedInvitation(r.invitationId, user);
  if (!inv) return;
  await db.rsvp.delete({ where: { id: r.id } });
  revalidatePath(`/dashboard/${inv.id}/guests`);
}
