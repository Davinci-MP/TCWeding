"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

const registerSchema = z.object({
  name: z.string().trim().min(2, "Tên quá ngắn").max(80),
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").max(100),
});

/** Đã tắt: khách không cần tài khoản. Giữ hàm để không vỡ import cũ. */
export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  if (process.env.ALLOW_REGISTER !== "true") return { error: "Website không còn đăng ký tài khoản khách." };
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: "Email đã được sử dụng" };
  const user = await db.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
  });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Email hoặc mật khẩu không đúng" };
  }
  if (user.role !== "ADMIN") return { error: "Tài khoản này không có quyền quản trị." };
  await createSession(user.id);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
