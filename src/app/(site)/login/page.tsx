import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Đăng nhập quản trị", robots: { index: false, follow: false } };

/** Chỉ dành cho admin (gõ /admin hoặc /login). Khách không cần đăng nhập. */
export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/");
  return (
    <div className="px-4 py-16">
      <AuthForm mode="login" />
    </div>
  );
}
