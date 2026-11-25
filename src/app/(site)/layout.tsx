import Link from "next/link";
import { Logo } from "@/components/SiteHeader";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link href="/" aria-label="Trang chủ">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="min-h-[calc(100vh-4rem)] bg-zinc-50">{children}</main>
    </>
  );
}
