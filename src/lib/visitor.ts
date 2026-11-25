import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/** Khách không cần tài khoản: nhận diện bằng cookie ẩn danh, giữ 1 năm, chỉ server đọc được. */
export const VISITOR_COOKIE = "tcw_vid";
const VID_RE = /^[A-Za-z0-9_-]{20,40}$/;

export async function readVisitorId() {
  const v = (await cookies()).get(VISITOR_COOKIE)?.value ?? "";
  return VID_RE.test(v) ? v : "";
}

/** Chỉ gọi trong Route Handler hoặc Server Action (nơi được ghi cookie). */
export async function ensureVisitorId() {
  const current = await readVisitorId();
  if (current) return current;
  const id = randomBytes(18).toString("base64url");
  (await cookies()).set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}
