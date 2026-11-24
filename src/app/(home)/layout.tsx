import Link from "next/link";
import { Logo, SiteHeader } from "@/components/SiteHeader";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader dark />
      <main className="overflow-x-clip">{children}</main>
      <footer className="bg-[#1d1a17] px-4 pb-10 pt-16 text-white/70">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            <span className="text-white">
              <Logo dark />
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">TCWedding — thiệp mời cưới online. Thiệp đẹp như thiệp in, gửi đi bằng một đường link.</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#d8cdbf]">Sản phẩm</p>
            <Link href="/templates" className="block hover:text-white">
              Mẫu thiệp
            </Link>
            <Link href="/#bang-gia" className="block hover:text-white">
              Bảng giá
            </Link>
            <Link href="/templates/classic-ivory" className="block hover:text-white">
              Thiệp mẫu
            </Link>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#d8cdbf]">Tài khoản</p>
            <Link href="/register" className="block hover:text-white">
              Tạo tài khoản
            </Link>
            <Link href="/login" className="block hover:text-white">
              Đăng nhập
            </Link>
            <Link href="/dashboard" className="block hover:text-white">
              Thiệp của tôi
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-xs text-white/40">
          © {new Date().getFullYear()} TCWedding · tcwedding.vn. Ảnh minh hoạ từ Unsplash.
        </p>
      </footer>
    </>
  );
}
