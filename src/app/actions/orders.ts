"use server";

import { randomBytes, randomInt } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { BANKS, defaultInvitationData, parseInvitationData, uid } from "@/lib/invitation";
import { orderNotice } from "@/lib/notify";
import { isOpen, settingsError, type OrderSettings } from "@/lib/orders";
import { rateLimit } from "@/lib/rateLimit";
import { getOrderSettings, saveOrderSettings } from "@/lib/settings";
import { getTemplateWithConfig } from "@/lib/templates";
import { FILE_NAME_RE, UPLOAD_DIR } from "@/lib/uploads";

export type OrderFormState = { error?: string } | undefined;

async function ip() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/* ------------------------------ Khách ------------------------------ */

const orderSchema = z.object({
  contactName: z.string().trim().min(2, "Vui lòng nhập họ tên người đặt").max(80),
  phone: z
    .string()
    .transform((s) => s.replace(/[\s.-]/g, ""))
    .pipe(z.string().regex(/^(\+84|0)\d{9,10}$/, "Số điện thoại không hợp lệ")),
  groom: z.string().trim().min(1, "Vui lòng nhập tên chú rể").max(60),
  bride: z.string().trim().min(1, "Vui lòng nhập tên cô dâu").max(60),
  weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Vui lòng chọn ngày cưới"),
  templateId: z.string().min(1, "Vui lòng chọn mẫu thiệp"),
  details: z.string().trim().max(4000, "Nội dung quá dài (tối đa 4000 ký tự)"),
});

export async function createOrderAction(_: OrderFormState, fd: FormData): Promise<OrderFormState> {
  if (text(fd, "website")) return { error: "Không gửi được đơn." }; // bẫy bot
  const settings = await getOrderSettings();
  if (!settings.enabled || settingsError(settings)) return { error: "Hiện chưa nhận đơn mới." };
  const parsed = orderSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const tpl = await getTemplateWithConfig(parsed.data.templateId);
  if (!tpl?.isActive) return { error: "Mẫu thiệp không còn sử dụng, vui lòng chọn mẫu khác." };
  if (!rateLimit(`order:${await ip()}`, 5, 3600_000)) return { error: "Bạn gửi quá nhiều đơn, vui lòng thử lại sau." };

  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = `TCW${Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join("")}`;
  const token = randomBytes(24).toString("base64url");
  const o = await db.order.create({ data: { ...parsed.data, code, token, price: settings.price, deposit: settings.deposit } });
  after(() => orderNotice("Đơn đặt thiệp mới", o));
  revalidatePath("/admin", "layout");
  redirect(`/don/${token}`);
}

async function byToken(fd: FormData) {
  const token = text(fd, "token");
  return token ? db.order.findUnique({ where: { token } }) : null;
}

function refresh(o: { id: string; token: string }) {
  revalidatePath(`/don/${o.token}`);
  revalidatePath("/admin", "layout"); // gồm cả số đơn cần xử lý trên menu
}

/** Khách báo đã chuyển khoản; admin kiểm tra tài khoản rồi mới xác nhận. */
export async function claimPaymentAction(fd: FormData) {
  const o = await byToken(fd);
  if (!o) return;
  // Chỉ ghi nhận lần báo đầu nên bấm lại không gửi thông báo trùng
  const now = new Date();
  if (o.status === "NEW" && o.deposit > 0) {
    const r = await db.order.updateMany({ where: { id: o.id, status: "NEW", depositClaimedAt: null, depositPaidAt: null }, data: { depositClaimedAt: now } });
    if (r.count) after(() => orderNotice("Khách báo đã chuyển cọc, cần kiểm tra tài khoản", o));
  } else if (o.status === "APPROVED") {
    const r = await db.order.updateMany({ where: { id: o.id, status: "APPROVED", finalClaimedAt: null, finalPaidAt: null }, data: { finalClaimedAt: now } });
    if (r.count) after(() => orderNotice("Khách báo đã trả phần còn lại, cần kiểm tra tài khoản", o));
  }
  refresh(o);
}

export async function customerMessageAction(fd: FormData) {
  const o = await byToken(fd);
  const body = text(fd, "body").slice(0, 2000);
  if (!o || !body || !isOpen(o.status) || !rateLimit(`order-msg:${o.id}`, 10)) return;
  await db.orderMessage.create({ data: { orderId: o.id, sender: "CUSTOMER", body } });
  // Khách nhắn liên tiếp chỉ báo một lần mỗi 2 phút; riêng yêu cầu sửa luôn báo
  if (o.status === "REVIEW") after(() => orderNotice("Khách yêu cầu sửa thiệp", o));
  else if (rateLimit(`notify-msg:${o.id}`, 1, 120_000)) after(() => orderNotice("Khách nhắn tin mới", o));
  // Nhắn khi đang chờ duyệt = yêu cầu sửa
  if (o.status === "REVIEW") await db.order.updateMany({ where: { id: o.id, status: "REVIEW" }, data: { status: "WORKING" } });
  refresh(o);
}

export async function approveOrderAction(fd: FormData) {
  const o = await byToken(fd);
  if (!o?.invitationId) return;
  const r = await db.order.updateMany({ where: { id: o.id, status: "REVIEW" }, data: { status: "APPROVED" } });
  if (r.count) after(() => orderNotice("Khách đã duyệt thiệp", o));
  refresh(o);
}

async function removeFile(url: string) {
  const name = url.split("/").pop() ?? "";
  if (FILE_NAME_RE.test(name)) await unlink(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name)).catch(() => null);
}

/** Chỉ xoá được ảnh khi chưa dựng thiệp, vì sau đó thiệp đang dùng chính file này. */
export async function deleteOrderPhotoAction(fd: FormData) {
  const o = await byToken(fd);
  if (!o || o.invitationId || !isOpen(o.status)) return;
  const p = await db.orderPhoto.findFirst({ where: { id: text(fd, "photoId"), orderId: o.id } });
  if (!p) return;
  await db.orderPhoto.delete({ where: { id: p.id } });
  await removeFile(p.url);
  refresh(o);
}

/** Sau bàn giao, khách chuyển thiệp về tài khoản của mình để xem danh sách khách (chỉ một lần). */
export async function claimInvitationAction(fd: FormData) {
  const o = await byToken(fd);
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!o?.invitationId || o.status !== "DONE") return;
  const invitationId = o.invitationId;
  await db.$transaction(async (tx) => {
    const r = await tx.order.updateMany({ where: { id: o.id, claimedAt: null }, data: { claimedAt: new Date() } });
    if (r.count) await tx.invitation.update({ where: { id: invitationId }, data: { userId: user.id } });
  });
  refresh(o);
  redirect("/dashboard");
}

/* ------------------------------ Admin ------------------------------ */

async function adminOrder(fd: FormData) {
  const admin = await requireAdmin();
  const order = await db.order.findUnique({ where: { id: text(fd, "id") }, include: { photos: { orderBy: { createdAt: "asc" } } } });
  return { admin, order };
}

export async function saveOrderSettingsAction(_: OrderFormState, fd: FormData): Promise<OrderFormState> {
  await requireAdmin();
  const num = (k: string) => Math.min(100_000_000, Number(text(fd, k).replace(/\D/g, "")) || 0);
  const bankCode = text(fd, "bankCode");
  const s: OrderSettings = {
    enabled: fd.get("enabled") === "on",
    price: num("price"),
    deposit: num("deposit"),
    bankCode: BANKS.some((b) => b.code === bankCode) ? bankCode : "",
    accountNumber: text(fd, "accountNumber").replace(/[^0-9A-Za-z]/g, "").slice(0, 24),
    accountName: text(fd, "accountName").slice(0, 80),
    intro: text(fd, "intro").slice(0, 1500),
  };
  const err = s.enabled ? settingsError(s) : "";
  if (err) return { error: err };
  await saveOrderSettings(s);
  revalidatePath("/", "layout");
  redirect("/admin/orders?saved=1");
}

export async function confirmPaymentAction(fd: FormData) {
  const { order: o } = await adminOrder(fd);
  if (!o) return;
  if (fd.get("kind") === "deposit") {
    await db.order.updateMany({ where: { id: o.id, status: "NEW" }, data: { depositPaidAt: new Date(), status: "WORKING" } });
  } else {
    await db.order.updateMany({ where: { id: o.id, status: "APPROVED", finalPaidAt: null }, data: { finalPaidAt: new Date() } });
  }
  refresh(o);
}

/** Tạo thiệp nháp từ thông tin và ảnh khách gửi; admin hoàn thiện trong trình soạn thảo. */
export async function buildInvitationAction(fd: FormData) {
  const { admin, order: o } = await adminOrder(fd);
  if (!o || o.status !== "WORKING") return;
  if (o.invitationId) redirect(`/dashboard/${o.invitationId}/edit`);
  const data = defaultInvitationData();
  const urls = o.photos.map((p) => p.url);
  data.groom.name = o.groom;
  data.bride.name = o.bride;
  data.weddingDate = `${o.weddingDate}T11:00`;
  data.events[0].date = data.weddingDate;
  data.coverPhoto = urls[0] ?? "";
  data.gallery = urls;
  const inv = await db.invitation.create({
    data: {
      userId: admin.id,
      title: `${o.groom} & ${o.bride}`.slice(0, 120),
      templateId: o.templateId,
      slug: `thiep-cuoi-${uid()}`,
      data: JSON.stringify(data),
    },
  });
  await db.order.update({ where: { id: o.id }, data: { invitationId: inv.id } });
  refresh(o);
  redirect(`/dashboard/${inv.id}/edit`);
}

/** Ảnh khách gửi thêm sau khi đã dựng thiệp: nối vào album của thiệp. */
export async function syncPhotosAction(fd: FormData) {
  const { order: o } = await adminOrder(fd);
  if (!o?.invitationId || !isOpen(o.status)) return;
  const inv = await db.invitation.findUnique({ where: { id: o.invitationId } });
  if (!inv) return;
  const data = parseInvitationData(inv.data);
  data.gallery = [...data.gallery, ...o.photos.map((p) => p.url).filter((u) => !inv.data.includes(u))];
  await db.invitation.update({ where: { id: inv.id }, data: { data: JSON.stringify(data) } });
  refresh(o);
}

export async function setOrderStatusAction(fd: FormData) {
  const { order: o } = await adminOrder(fd);
  if (!o) return;
  const to = text(fd, "to");
  const move = (from: string[]) => db.order.updateMany({ where: { id: o.id, status: { in: from } }, data: { status: to } });
  if (to === "WORKING" && (o.deposit === 0 || o.depositPaidAt)) await move(["NEW", "REVIEW", "APPROVED", "CANCELLED"]);
  else if (to === "NEW") await move(["CANCELLED"]);
  else if (to === "REVIEW" && o.invitationId) await move(["WORKING"]);
  else if (to === "CANCELLED") await move(["NEW", "WORKING", "REVIEW", "APPROVED"]);
  else if (to === "DONE" && o.invitationId) {
    const invitationId = o.invitationId;
    const remaining = o.price - (o.depositPaidAt ? o.deposit : 0);
    if (remaining > 0 && !o.finalPaidAt) return;
    await db.$transaction(async (tx) => {
      const r = await tx.order.updateMany({ where: { id: o.id, status: "APPROVED" }, data: { status: "DONE" } });
      if (r.count) await tx.invitation.update({ where: { id: invitationId }, data: { status: "PUBLISHED" } });
    });
  }
  refresh(o);
}

export async function shopMessageAction(fd: FormData) {
  const { order: o } = await adminOrder(fd);
  const body = text(fd, "body").slice(0, 2000);
  if (!o || !body) return;
  await db.orderMessage.create({ data: { orderId: o.id, sender: "SHOP", body } });
  refresh(o);
}

export async function saveAdminNoteAction(fd: FormData) {
  const { order: o } = await adminOrder(fd);
  if (!o) return;
  await db.order.update({ where: { id: o.id }, data: { adminNote: text(fd, "adminNote").slice(0, 2000) } });
  refresh(o);
}

/** Xoá hẳn đơn đã huỷ, kèm ảnh khách gửi nếu không có thiệp nào đang dùng. */
export async function deleteOrderAction(fd: FormData) {
  const { order: o } = await adminOrder(fd);
  if (!o || o.status !== "CANCELLED") return;
  await db.order.delete({ where: { id: o.id } });
  if (!o.invitationId) await Promise.all(o.photos.map((p) => removeFile(p.url)));
  revalidatePath("/admin", "layout");
  redirect("/admin/orders");
}
