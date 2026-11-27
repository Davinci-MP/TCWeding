import type { Metadata } from "next";
import Link from "next/link";
import { AlbumCard } from "@/components/studio/AlbumCard";
import { socialLinks } from "@/components/studio/Contact";
import { getAbout } from "@/lib/about";
import { contactLinks, getStudio, listPublishedAlbums, pickPortraitPhoto } from "@/lib/studio";
import { heroTitleClass, sectionTitleClass } from "@/lib/typo";
import { Icon } from "@/templates/icons";

export async function generateMetadata(): Promise<Metadata> {
  const a = await getAbout();
  return { title: { absolute: `${a.name}${a.role ? ` — ${a.role}` : ""}` }, description: a.intro.slice(0, 200), openGraph: a.photo ? { images: [a.photo] } : undefined };
}

const paras = (s: string) => s.split(/\n{2,}/).filter(Boolean);

export default async function AboutPage() {
  const [a, studio, albums] = await Promise.all([getAbout(), getStudio(), listPublishedAlbums({ take: 6, featuredFirst: true })]);
  const photo = a.photo || (await pickPortraitPhoto([]));
  const stats = a.stats.filter((s) => s.value && s.label);
  const fields = a.fields.filter((f) => f.title);
  const blocks = a.blocks.filter((b) => b.title);
  const c = studio.contact;
  const l = contactLinks(c);
  const contactRows = (
    [
      ["Điện thoại", c.phone, l.tel],
      ["Zalo", c.phone ? c.phone : "", l.zalo],
      ["Email", c.email, l.mail],
      ["Địa chỉ", c.address, ""],
      ["Khu vực", c.area, ""],
    ] as [string, string, string][]
  ).filter(([, v]) => v);
  const social = socialLinks(c);

  return (
    <>
      <section className="bg-[#1d1a17] px-4 pb-20 pt-16 text-white lg:pt-24">
        <div className={`mx-auto grid max-w-6xl items-center gap-12 ${photo ? "lg:grid-cols-[1.2fr_1fr]" : ""}`}>
          <div>
            {a.eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-[#d8cdbf]">{a.eyebrow}</p>}
            <h1 className={`font-serif-display mt-5 text-balance leading-[1.02] ${heroTitleClass(a.headline, studio.typo.heroSize)}`}>{a.headline}</h1>
            <p className="mt-6 text-lg text-white/85">
              <strong className="font-semibold">{a.name}</strong>
              {a.role ? `, ${a.role}` : ""}
            </p>
            {a.intro && <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/70">{a.intro}</p>}
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/#lien-he" className="rounded-full bg-[#efe7dc] px-7 py-3.5 font-semibold text-[#1d1a17] transition hover:bg-white">
                Liên hệ tư vấn
              </Link>
              <Link href="/bo-suu-tap" className="rounded-full border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:border-white">
                Xem portfolio
              </Link>
            </div>
            {stats.length > 0 && (
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/15 pt-8">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dd className="font-serif-display text-4xl text-[#efe7dc] sm:text-5xl">{s.value}</dd>
                    <dt className="mt-1 text-sm text-white/60">{s.label}</dt>
                  </div>
                ))}
              </dl>
            )}
          </div>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={a.name} className="aspect-[4/5] w-full object-cover" />
          )}
        </div>
      </section>

      {(a.storyTitle || a.storyBody) && (
        <section className="bg-[#f6f2ec] px-4 py-24 lg:py-28">
          <div className="mx-auto max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">Về tôi</p>
            {a.storyTitle && <h2 className={`font-serif-display mt-4 leading-[1.05] text-[#1d1a17] ${sectionTitleClass(a.storyTitle, studio.typo.titleSize)}`}>{a.storyTitle}</h2>}
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-zinc-700">
              {paras(a.storyBody).map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {fields.length > 0 && (
        <section className="bg-white px-4 py-24 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">Lĩnh vực hoạt động</p>
            <h2 className="font-serif-display mt-4 text-4xl leading-[1.05] text-[#1d1a17] sm:text-5xl">{a.fieldsTitle}</h2>
            <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map((f, i) => (
                <li key={i} className="border-t border-[#1d1a17]/20 pt-5">
                  <h3 className="font-serif-display text-2xl text-[#1d1a17]">{f.title}</h3>
                  {f.body && <p className="mt-2 leading-relaxed text-zinc-600">{f.body}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {albums.length > 0 && (
        <section className="bg-[#f6f2ec] px-4 py-24 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">Portfolio</p>
                <h2 className="font-serif-display mt-4 text-4xl leading-[1.05] text-[#1d1a17] sm:text-5xl">Một vài album tiêu biểu</h2>
              </div>
              <Link href="/bo-suu-tap" className="group inline-flex items-center gap-2 font-semibold text-[#7b2d26]">
                Xem toàn bộ album
                <Icon name="arrow" size={18} className="transition group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((al) => (
                <AlbumCard key={al.id} album={al} />
              ))}
            </div>
          </div>
        </section>
      )}

      {blocks.map((b, i) => (
        <section key={i} className={`px-4 py-24 lg:py-28 ${i % 2 ? "bg-[#f6f2ec]" : "bg-white"}`}>
          <div className="mx-auto max-w-3xl">
            {b.eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">{b.eyebrow}</p>}
            <h2 className={`font-serif-display mt-4 leading-[1.08] text-[#1d1a17] ${sectionTitleClass(b.title, studio.typo.titleSize)}`}>{b.title}</h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-zinc-700">
              {paras(b.body).map((p, j) => (
                <p key={j} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </section>
      ))}

      {a.reviewUrl && (
        <section className="bg-[#1d1a17] px-4 py-20 text-center text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#d8cdbf]">Đánh giá</p>
          <h2 className="font-serif-display mx-auto mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">Bạn đã chụp cùng chúng tôi?</h2>
          {a.reviewText && <p className="mx-auto mt-5 max-w-xl text-white/70">{a.reviewText}</p>}
          <a href={a.reviewUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block rounded-full bg-[#efe7dc] px-7 py-3.5 font-semibold text-[#1d1a17] hover:bg-white">
            Viết / xem đánh giá ↗
          </a>
        </section>
      )}

      <section className="bg-white px-4 py-24 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">Liên hệ</p>
            <h2 className="font-serif-display mt-4 text-4xl leading-[1.05] text-[#1d1a17] sm:text-5xl">Cần tư vấn hoặc muốn hợp tác?</h2>
            <Link href="/#lien-he" className="mt-8 inline-block rounded-full bg-[#7b2d26] px-7 py-3.5 font-semibold text-white hover:bg-[#5f221d]">
              Đặt lịch tư vấn
            </Link>
          </div>
          {(contactRows.length > 0 || social.length > 0) && (
            <dl className="divide-y divide-[#1d1a17]/10">
              {contactRows.map(([k, v, href]) => (
                <div key={k} className="flex justify-between gap-4 py-4">
                  <dt className="text-zinc-500">{k}</dt>
                  <dd className="text-right font-medium text-[#1d1a17]">
                    {href ? (
                      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                        {v}
                      </a>
                    ) : (
                      v
                    )}
                  </dd>
                </div>
              ))}
              {social.length > 0 && (
                <div className="flex flex-wrap justify-end gap-2 py-4">
                  {social.map(([name, href, icon]) => (
                    <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#1d1a17]/15 px-4 text-sm hover:border-[#7b2d26]">
                      <Icon name={icon} size={16} /> {name}
                    </a>
                  ))}
                </div>
              )}
            </dl>
          )}
        </div>
      </section>
    </>
  );
}
