import Link from "next/link";
import { Logo, SiteHeader } from "@/components/SiteHeader";
import { socialLinks } from "@/components/studio/Contact";
import { contactLinks, getStudio } from "@/lib/studio";
import { Icon } from "@/templates/icons";

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const { contact } = await getStudio();
  const l = contactLinks(contact);
  const social = socialLinks(contact);
  return (
    <>
      <SiteHeader dark />
      <main>{children}</main>
      <footer className="bg-[#1d1a17] px-4 pb-10 pt-16 text-white/70">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <span className="text-white">
              <Logo dark />
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Chụp ảnh cưới, thiệp mời online và album cưới{contact.area ? ` tại ${contact.area}` : ""}.
            </p>
            {social.length > 0 && (
              <div className="mt-5 flex gap-2">
                {social.map(([name, href, icon]) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 transition hover:border-white/50 hover:text-white"
                  >
                    <Icon name={icon} size={18} />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#d8cdbf]">Studio</p>
            <Link href="/bo-suu-tap" className="block hover:text-white">
              Bộ sưu tập
            </Link>
            <Link href="/#lien-he" className="block hover:text-white">
              Đặt lịch tư vấn
            </Link>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#d8cdbf]">Thiệp mời online</p>
            <Link href="/thiep-moi" className="block hover:text-white">
              Giới thiệu
            </Link>
            <Link href="/templates" className="block hover:text-white">
              Mẫu thiệp
            </Link>
            <Link href="/thiep-moi#bang-gia" className="block hover:text-white">
              Bảng giá
            </Link>
            <Link href="/dashboard" className="block hover:text-white">
              Thiệp của tôi
            </Link>
          </div>
          {(contact.phone || contact.email || contact.address) && (
            <div className="space-y-2 text-sm">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#d8cdbf]">Liên hệ</p>
              {contact.phone && (
                <a href={l.tel} className="block hover:text-white">
                  {contact.phone}
                </a>
              )}
              {contact.email && (
                <a href={l.mail} className="block break-all hover:text-white">
                  {contact.email}
                </a>
              )}
              {contact.address && <p>{contact.address}</p>}
            </div>
          )}
        </div>
        <p className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-xs text-white/40">© {new Date().getFullYear()} TCWedding · tcwedding.vn</p>
      </footer>
    </>
  );
}
