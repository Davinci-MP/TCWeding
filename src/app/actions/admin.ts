"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function setUserPlanAction(fd: FormData) {
  await requireAdmin();
  const plan = fd.get("plan") === "PREMIUM" ? "PREMIUM" : "FREE";
  await db.user.update({ where: { id: String(fd.get("id")) }, data: { plan } });
  revalidatePath("/admin/users");
}

export async function setUserRoleAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id"));
  if (id === admin.id) return; // không tự hạ quyền mình
  const role = fd.get("role") === "ADMIN" ? "ADMIN" : "USER";
  await db.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/users");
}

export async function deleteUserAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get("id"));
  if (id === admin.id) return;
  await db.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}

export async function setInvitationStatusAction(fd: FormData) {
  await requireAdmin();
  const status = fd.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  await db.invitation.update({ where: { id: String(fd.get("id")) }, data: { status } });
  revalidatePath("/admin/invitations");
}

export async function updateTemplateConfigAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const data = {
    isActive: fd.get("isActive") === "on",
    isPremium: fd.get("isPremium") === "on",
    sortOrder: Number(fd.get("sortOrder") ?? 0) || 0,
  };
  await db.templateConfig.upsert({ where: { id }, create: { id, ...data }, update: data });
  revalidatePath("/admin/templates");
  revalidatePath("/templates");
}

export async function savePlansAction(fd: FormData) {
  await requireAdmin();
  const { DEFAULT_PLANS } = await import("@/lib/plans");
  const { savePlans } = await import("@/lib/settings");
  const str = (k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
  const plans = DEFAULT_PLANS.map((d) => {
    const p = (k: string, max?: number) => str(`${d.id}.${k}`, max);
    return {
      id: d.id,
      name: p("name", 40) || d.name,
      price: p("price", 30) || d.price,
      unit: p("unit", 40),
      tagline: p("tagline", 200),
      features: p("features", 2000)
        .split(/\r?\n/)
        .map((f) => f.trim())
        .filter(Boolean)
        .slice(0, 12),
      cta: p("cta", 40) || d.cta,
      highlight: fd.get(`${d.id}.highlight`) === "on",
      badge: p("badge", 30),
    };
  });
  await savePlans(plans);
  revalidatePath("/thiep-moi");
  revalidatePath("/admin/pricing");
  redirect("/admin/pricing?saved=1");
}

export async function addMusicAction(fd: FormData) {
  await requireAdmin();
  const name = String(fd.get("name") ?? "").trim().slice(0, 80);
  const note = String(fd.get("note") ?? "").trim().slice(0, 120);
  const url = String(fd.get("url") ?? "").trim();
  if (!name || !/^(\/api\/files\/|https:\/\/)/.test(url)) redirect("/admin/music?error=1");
  const { getMusicLibrary, saveMusicLibrary } = await import("@/lib/settings");
  const list = await getMusicLibrary();
  list.push({ id: `u${Date.now().toString(36)}`, name, note, url });
  await saveMusicLibrary(list);
  revalidatePath("/admin/music");
  redirect("/admin/music?saved=1");
}

export async function deleteMusicAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const { getMusicLibrary, saveMusicLibrary } = await import("@/lib/settings");
  await saveMusicLibrary((await getMusicLibrary()).filter((t) => t.id !== id));
  revalidatePath("/admin/music");
}