import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("Thiếu AUTH_SECRET trong .env");
  return new TextEncoder().encode(s);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, plan: true },
    });
  } catch {
    return null;
  }
});

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/login");
  return user;
}

/** Lấy thiệp và kiểm tra quyền sở hữu (admin được xem tất cả). */
export async function getOwnedInvitation(id: string, user: SessionUser) {
  const inv = await db.invitation.findUnique({ where: { id } });
  if (!inv) return null;
  if (inv.userId !== user.id && user.role !== "ADMIN") return null;
  return inv;
}

/* ---------------- Quyền quản lý thiệp cho cô dâu chú rể (khách đặt thiệp không có tài khoản) ---------------- */
// Người mở link đơn /don/<token> được cấp cookie ký số chứa id thiệp của đơn đó, để xem bill tiền mừng (/b/<mã>)
// và tải bảng tiền mừng mà không cần tài khoản.
const MGR_COOKIE = "tcw_mgr";
const MGR_MAX_AGE = 60 * 60 * 24 * 180;

async function readManaged(): Promise<string[]> {
  const raw = (await cookies()).get(MGR_COOKIE)?.value;
  if (!raw) return [];
  try {
    const { payload } = await jwtVerify(raw, secret());
    return Array.isArray(payload.inv) ? payload.inv.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Gọi trong Route Handler / Server Action sau khi đã kiểm token đơn hợp lệ. */
export async function grantInvitationAccess(invitationId: string) {
  const list = await readManaged();
  if (list.includes(invitationId)) return;
  const token = await new SignJWT({ inv: [invitationId, ...list].slice(0, 20) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MGR_MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(MGR_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MGR_MAX_AGE });
}

/** Chủ thiệp (tài khoản sở hữu), admin, hoặc người đã mở link đơn của thiệp. */
export async function canManageInvitation(invitationId: string, ownerId: string) {
  const user = await getCurrentUser();
  if (user && (user.role === "ADMIN" || user.id === ownerId)) return true;
  return (await readManaged()).includes(invitationId);
}
