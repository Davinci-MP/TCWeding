import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

/** Logo TCWedding: dấu tròn chữ "TC" + chữ TCWedding (Cormorant Garamond), giống tcwedding.vn. */
export function Logo({ dark }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={`font-serif-display flex h-8 w-8 items-center justify-center rounded-full border text-[13px] font-semibold leading-none ${
          dark ? "border-[#f3ece3]/70 text-[#f3ece3]" : "border-[#1d1a17]/70 text-[#1d1a17]"
        }`}
      >
        TC
      </span>
      <span className="font-serif-display text-[1.35rem] font-semibold leading-none tracking-[0.01em]">TCWedding</span>
    </span>
  );
}

export async function SiteHeader({ dark = false }: { dark?: boolean }) {
  const user = await getCurrentUser();
  const link = `rounded-full px-3 py-2 transition ${dark ? "text-white/75 hover:text-white" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"}`;
  return (
    <header
      className={`sticky top-0 z-30 backdrop-blur ${dark ? "border-b border-white/10 bg-[#1d1a17]/80 text-white" : "border-b border-zinc-200 bg-white/90"}`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="Trang chủ">
          <Logo dark={dark} />
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href="/templates" className={`${link} hidden sm:inline-flex`}>
            Mẫu thiệp
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className={link}>
                Thiệp của tôi
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className={`${link} hidden sm:inline-flex`}>
                  Quản trị
                </Link>
              )}
              <form action={logoutAction}>
                <button className={`${link} cursor-pointer`}>Đăng xuất</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={link}>
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className={`rounded-full px-4 py-2 font-semibold transition ${dark ? "bg-[#d8cdbf] text-[#1d1a17] hover:bg-[#ede6dc]" : "bg-brand text-white hover:bg-brand-dark"}`}
              >
                Tạo thiệp
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
