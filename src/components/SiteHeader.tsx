import Link from "next/link";
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

type NavItem = readonly [string, string];

/** Menu chính. Khách không cần tài khoản; admin tự vào /admin. */
const MAIN_NAV: NavItem[] = [
  ["/bo-suu-tap", "Bộ sưu tập"],
  ["/thiep", "Thiệp mời"],
  ["/#slideshow", "Slideshow"],
  ["/#bang-gia", "Bảng giá"],
  ["/ghep-album", "Ghép album"],
  ["/ve-toi", "Về tôi"],
  ["/#lien-he", "Liên hệ"],
];
const MORE_NAV: NavItem[] = [
  ["/man-hinh-led", "Màn hình LED miễn phí"],
  ["/slideshow", "Tự làm slideshow miễn phí"],
];

export function SiteHeader({ dark = false }: { dark?: boolean }) {
  const link = `whitespace-nowrap rounded-full px-3 py-2 transition ${dark ? "text-white/75 hover:text-white" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"}`;
  return (
    <header data-site-chrome className={`sticky top-0 z-30 backdrop-blur ${dark ? "border-b border-white/10 bg-[#1d1a17]/80 text-white" : "border-b border-zinc-200 bg-white/90"}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="Trang chủ">
          <Logo dark={dark} />
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2" aria-label="Menu chính">
          <div className="hidden items-center gap-0.5 xl:flex">
            {MAIN_NAV.map(([href, label]) => (
              <Link key={href} href={href} className={link}>
                {label}
              </Link>
            ))}
          </div>
          <details className="group relative xl:hidden">
            <summary className={`${link} flex min-h-11 cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}>
              Menu
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition group-open:rotate-180" aria-hidden>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="absolute right-0 top-full mt-2 max-h-[80svh] w-60 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 text-zinc-700 shadow-xl">
              {MAIN_NAV.map(([href, label]) => (
                <Link key={href} href={href} className="block rounded-xl px-3 py-2.5 hover:bg-zinc-100">
                  {label}
                </Link>
              ))}
              <hr className="my-2 border-zinc-100" />
              {MORE_NAV.map(([href, label]) => (
                <Link key={href} href={href} className="block rounded-xl px-3 py-2.5 text-sm hover:bg-zinc-100">
                  {label}
                </Link>
              ))}
            </div>
          </details>
          <Link
            href="/thiep#chon"
            className={`ml-1 whitespace-nowrap rounded-full px-4 py-2 font-semibold transition ${dark ? "bg-[#d8cdbf] text-[#1d1a17] hover:bg-[#ede6dc]" : "bg-brand text-white hover:bg-brand-dark"}`}
          >
            Đặt thiệp & video
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Header cho trang quản trị và trình soạn thiệp của admin. */
export function AdminHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/admin" aria-label="Trang quản trị" className="flex items-center gap-3">
          <Logo />
          <span className="hidden rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 sm:inline">Quản trị</span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <Link href="/" target="_blank" className="rounded-full px-3 py-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900">
            Xem website ↗
          </Link>
          <span className="hidden px-2 text-zinc-400 md:inline">{email}</span>
          <form action={logoutAction}>
            <button className="cursor-pointer rounded-full px-3 py-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900">Đăng xuất</button>
          </form>
        </div>
      </div>
    </header>
  );
}
