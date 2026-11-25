import Link from "next/link";
import { NotifyForm } from "@/app/admin/orders/NotifyForm";
import { ChangePasswordForm } from "@/components/admin/PasswordForms";
import { requireAdmin } from "@/lib/auth";
import { getNotify } from "@/lib/notify";

export const metadata = { title: "Cài đặt" };

export default async function AdminSettings() {
  const [user, notify] = await Promise.all([requireAdmin(), getNotify()]);
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Cài đặt</h1>
        <p className="mt-1 text-sm text-zinc-500">Tài khoản của bạn và thông báo Telegram cho đơn đặt thiệp, yêu cầu tư vấn.</p>
      </div>

      <section className="card space-y-4 p-5">
        <div>
          <h2 className="font-semibold">Tài khoản</h2>
          <p className="text-sm text-zinc-500">
            Đang đăng nhập: <strong>{user.email}</strong>. Mật khẩu của người dùng khác đặt lại ở{" "}
            <Link href="/admin/users" className="underline">
              Người dùng
            </Link>
            .
          </p>
        </div>
        <ChangePasswordForm />
      </section>

      <NotifyForm bot={notify.bot} linkCode={notify.linkCode} connected={!!notify.chatId} chatName={notify.chatName} lastError={notify.error} defaultOpen={!notify.chatId || !!notify.error} />

      <section className="card space-y-2 p-5 text-sm">
        <h2 className="font-semibold">Các mục cấu hình khác</h2>
        <ul className="grid gap-1 sm:grid-cols-2">
          {[
            ["/admin/studio", "Nội dung trang chủ, liên hệ, mạng xã hội, SEO"],
            ["/admin/about", "Trang Về tôi"],
            ["/admin/studio-pricing", "Bảng giá gói chụp"],
            ["/admin/albums", "Bộ sưu tập ảnh"],
            ["/admin/ghep-album", "Ghép album (album mẫu)"],
            ["/admin/orders", "Đơn làm thiệp: giá, cọc, ngân hàng"],
            ["/admin/templates", "Mẫu thiệp"],
            ["/admin/music", "Thư viện nhạc"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="text-brand underline-offset-4 hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
