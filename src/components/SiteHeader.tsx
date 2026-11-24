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

const MAIN_NAV = [
  ["/bo-suu-tap", "Bộ sưu tập"],
  ["/thiep-moi", "Thiệp mời online"],
  ["/templates", "Mẫu thiệp"],
  ["/#lien-he", "Liên hệ"],
] as const;

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
          <div className="hidden items-center gap-1 lg:flex">
            {MAIN_NAV.map(([href, label]) => (
              <Link key={href} href={href} className={link}>
                {label}
              </Link>
            ))}
            <span className={`mx-2 h-4 w-px ${dark ? "bg-white/20" : "bg-zinc-200"}`} aria-hidden />
          </div>
          <details className="group relative lg:hidden">
            <summary className={`${link} flex min-h-11 cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}>
              Menu
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition group-open:rotate-180" aria-hidden>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-zinc-200 bg-white p-2 text-zinc-700 shadow-xl">
              {MAIN_NAV.map(([href, label]) => (
                <Link key={href} href={href} className="block rounded-xl px-3 py-2.5 hover:bg-zinc-100">
                  {label}
                </Link>
              ))}
              <hr className="my-2 border-zinc-100" />
              {user ? (
                <>
                  <Link href="/dashboard" className="block rounded-xl px-3 py-2.5 hover:bg-zinc-100">
                    Thiệp của tôi
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" className="block rounded-xl px-3 py-2.5 hover:bg-zinc-100">
                      Quản trị
                    </Link>
                  )}
                  <form action={logoutAction}>
                    <button className="block w-full cursor-pointer rounded-xl px-3 py-2.5 text-left hover:bg-zinc-100">Đăng xuất</button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="block rounded-xl px-3 py-2.5 hover:bg-zinc-100">
                  Đăng nhập
                </Link>
              )}
            </div>
          </details>
          {user ? (
            <div className="hidden items-center gap-1 lg:flex">
              <Link href="/dashboard" className={link}>
                Thiệp của tôi
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className={link}>
                  Quản trị
                </Link>
              )}
              <form action={logoutAction}>
                <button className={`${link} cursor-pointer`}>Đăng xuất</button>
              </form>
            </div>
          ) : (
            <>
              <Link href="/login" className={`${link} hidden lg:inline-flex`}>
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold transition ${dark ? "bg-[#d8cdbf] text-[#1d1a17] hover:bg-[#ede6dc]" : "bg-brand text-white hover:bg-brand-dark"}`}
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
