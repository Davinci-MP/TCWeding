"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";

export type PasswordState = { error?: string; ok?: string } | undefined;

const MIN = 8;

/** Người đang đăng nhập đổi mật khẩu của chính mình (phải nhập đúng mật khẩu cũ). */
export async function changeOwnPasswordAction(_: PasswordState, fd: FormData): Promise<PasswordState> {
  const user = await requireUser();
  if (!rateLimit(`pw:${user.id}`, 5, 15 * 60_000)) return { error: "Thử quá nhiều lần, vui lòng đợi 15 phút." };
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (next.length < MIN) return { error: `Mật khẩu mới cần ít nhất ${MIN} ký tự.` };
  if (next.length > 200) return { error: "Mật khẩu mới quá dài." };
  if (next !== confirm) return { error: "Hai lần nhập mật khẩu mới không khớp." };
  const row = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!row || !(await bcrypt.compare(current, row.passwordHash))) return { error: "Mật khẩu hiện tại không đúng." };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: "Đã đổi mật khẩu. Lần đăng nhập sau dùng mật khẩu mới." };
}

/** Admin đặt mật khẩu mới cho một người dùng khác (khi khách quên mật khẩu). */
export async function resetUserPasswordAction(_: PasswordState, fd: FormData): Promise<PasswordState> {
  const admin = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const next = String(fd.get("password") ?? "");
  if (id === admin.id) return { error: "Đổi mật khẩu của bạn ở mục Cài đặt." };
  if (next.length < MIN) return { error: `Cần ít nhất ${MIN} ký tự.` };
  if (next.length > 200) return { error: "Mật khẩu quá dài." };
  const u = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!u) return { error: "Không tìm thấy người dùng." };
  await db.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  revalidatePath("/admin/users");
  return { ok: "Đã đặt mật khẩu mới." };
}
