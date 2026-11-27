import type { Metadata } from "next";
import { FramedImg } from "@/components/FramedImg";
import Link from "next/link";
import { AlbumCard } from "@/components/studio/AlbumCard";
import { ContactBlock } from "@/components/studio/Contact";
import { Packages } from "@/components/studio/Packages";
import { HomeInvitations } from "@/components/thiep/HomeInvitations";
import { SlideshowGallery } from "@/components/thiep/SlideshowGallery";
import type { TplLite } from "@/components/thiep/TemplateCard";
import { toTplLite } from "@/lib/thiep";
import { heroTitleClass, sectionTitleClass } from "@/lib/typo";
import { listTemplates } from "@/lib/templates";
import { bookingServices, getPackages, getStudio, listPublishedAlbums, listSampleAlbums, pickPortraitPhoto, sampleStyleLabel, sizeLabel } from "@/lib/studio";
import { Icon } from "@/templates/icons";

const SERVICE_LINKS = ["/bo-suu-tap", "/thiep", "/ghep-album"];
const SERVICE_CTA = ["Xem bộ sưu tập", "Chọn mẫu thiệp", "Xem mẫu ghép album"];

export async function generateMetadata(): Promise<Metadata> {
  const s = await getStudio();
  return {
    ...(s.seoTitle ? { title: { absolute: s.seoTitle } } : {}),
    ...(s.seoDescription ? { description: s.seoDescription } : {}),
    openGraph: {
      ...(s.seoTitle ? { title: s.seoTitle } : {}),
      ...(s.seoDescription ? { description: s.seoDescription } : {}),
      ...(s.heroImage ? { images: [s.heroImage] } : {}),
    },
  };
}

export default async function StudioHome() {
  const [studio, albums, templates, packages, services, samples] = await Promise.all([
    getStudio(),
    listPublishedAlbums({ take: 7, featuredFirst: true }),
    listTemplates(),
    getPackages(),
    bookingServices(),
    listSampleAlbums(),
  ]);

  // Ảnh mở đầu: ảnh admin chọn, nếu chưa có thì lấy bìa album nổi bật đầu tiên (kèm chú thích album).
  const heroAlbum = !studio.heroImage ? albums.find((a) => a.cover) : undefined;
  const heroImage = studio.heroImage || heroAlbum?.cover?.url || "";
  const covers = albums.flatMap((a) => (a.cover ? [a.cover.url] : []));
  const introImage = studio.introImage || (await pickPortraitPhoto([heroImage, ...covers]));
  const stats = studio.stats.filter((s) => s.value && s.label);
  const steps = studio.steps.filter((s) => s.title);
  const faqs = studio.faqs.filter((f) => f.q && f.a);
  const grid = albums.slice(0, 5);
  const featuredTemplates: TplLite[] = templates.slice(0, 8).map(toTplLite);
  const [lead, ...rest] = studio.heroTitle.split(" ");

  return (
    <>
      {/* ============ MỞ ĐẦU ============ */}
      <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-end overflow-hidden bg-[#1d1a17] text-white">
        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <FramedImg src={heroImage} frame={studio.heroImage ? studio.frames.hero : null} fetchPriority="high" className="tpl-kenburns absolute inset-0 -z-10 h-full w-full" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#1d1a17]/90 via-[#1d1a17]/35 to-[#1d1a17]/10" aria-hidden />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1d1a17]/55 via-[#1d1a17]/10 to-transparent" aria-hidden />
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-14 pt-32 sm:pb-20 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="tpl-rise text-[11px] font-semibold uppercase tracking-[0.45em] text-[#d8cdbf]">
              TCWedding{studio.contact.area ? ` · ${studio.contact.area}` : " · Chụp ảnh cưới"}
            </p>
            <h1 className={`font-serif-display tpl-rise mt-5 text-balance leading-[0.98] ${heroTitleClass(studio.heroTitle, studio.typo.heroSize)}`} style={{ animationDelay: "120ms" }}>
              {lead} <em className="text-[#efe7dc]">{rest.join(" ")}</em>
            </h1>
            {studio.heroLead && (
              <p className="tpl-rise mt-6 max-w-xl text-lg leading-relaxed text-white/75" style={{ animationDelay: "260ms" }}>
                {studio.heroLead}
              </p>
            )}
            <div className="tpl-rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "400ms" }}>
              <Link href="/bo-suu-tap" className="rounded-full bg-[#efe7dc] px-7 py-3.5 font-semibold text-[#1d1a17] transition hover:bg-white">
                Xem bộ sưu tập
              </Link>
              <Link href="#lien-he" className="rounded-full border border-white/35 px-7 py-3.5 font-semibold text-white transition hover:border-white">
                Đặt lịch tư vấn
              </Link>
            </div>
          </div>
          {heroAlbum && (
            <Link
              href={`/bo-suu-tap/${heroAlbum.slug}`}
              className="tpl-rise group hidden items-center gap-3 border-l border-white/30 pl-4 text-sm text-white/70 transition hover:text-white lg:flex"
              style={{ animationDelay: "560ms" }}
            >
              <span>
                <span className="block text-[10px] uppercase tracking-[0.3em] text-white/50">Ảnh trong album</span>
                <span className="font-serif-display mt-1 block text-xl text-white">{heroAlbum.title}</span>
                {heroAlbum.location && <span className="block">{heroAlbum.location}</span>}
              </span>
              <Icon name="arrow" size={18} className="transition group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </section>

      {/* ============ GIỚI THIỆU ============ */}
      <section className="bg-[#f6f2ec] px-4 py-24 lg:py-32">
        <div className={`mx-auto grid max-w-6xl items-center gap-12 ${introImage ? "lg:grid-cols-[5fr_6fr] lg:gap-20" : ""}`}>
          {introImage && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <FramedImg src={introImage} frame={studio.introImage ? studio.frames.intro : null} loading="lazy" className="aspect-[4/5] w-full" />
              <span className="absolute -bottom-4 -right-4 -z-0 hidden h-full w-full border border-[#7b2d26]/30 lg:block" aria-hidden style={{ zIndex: -1 }} />
            </div>
          )}
          <div className={introImage ? "" : "max-w-3xl"}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">Về chúng tôi</p>
            <h2 className={`font-serif-display mt-5 text-balance leading-[1.05] text-[#1d1a17] ${sectionTitleClass(studio.introTitle, studio.typo.titleSize)}`}>{studio.introTitle}</h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-zinc-600">
              {studio.introBody.split(/\n{2,}/).map((para, i) => (
                <p key={i} className="whitespace-pre-line">
                  {para}
                </p>
              ))}
            </div>
            {stats.length > 0 && (
              <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-[#1d1a17]/15 pt-8">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-serif-display text-4xl text-[#7b2d26] sm:text-5xl">{s.value}</dd>
                    <dd className="mt-1 text-sm text-zinc-600">{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>

      {/* ============ BỘ SƯU TẬP ============ */}
      {grid.length > 0 && (
        <section className="bg-white px-4 py-24 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">Bộ sưu tập</p>
                <h2 className="font-serif-display mt-4 text-4xl leading-[1.05] text-[#1d1a17] sm:text-5xl lg:text-6xl">
                  Những ngày chúng tôi <em>được có mặt</em>
                </h2>
              </div>
              <Link href="/bo-suu-tap" className="group inline-flex items-center gap-2 font-semibold text-[#7b2d26]">
                Xem tất cả album
                <Icon name="arrow" size={18} className="transition group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
              {grid.map((a, i) => (
                <div key={a.id} className={i === 0 ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""}>
                  <AlbumCard album={a} tall={i === 0} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ DỊCH VỤ ============ */}
      <section className="bg-[#f6f2ec] px-4 py-24 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">Dịch vụ</p>
          <h2 className="font-serif-display mt-4 max-w-2xl text-4xl leading-[1.05] text-[#1d1a17] sm:text-5xl lg:text-6xl">
            Từ buổi chụp <em>đến tấm thiệp gửi khách</em>
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {studio.services.map((s, i) =>
              s.title ? (
                <article key={i} className="group">
                  {s.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <FramedImg src={s.image} frame={studio.frames[`service.${i}`]} loading="lazy" className="mb-6 aspect-[3/2] w-full" />
                  )}
                  <h3 className="font-serif-display border-t border-[#1d1a17]/20 pt-5 text-3xl text-[#1d1a17]">{s.title}</h3>
                  {s.body && <p className="mt-3 leading-relaxed text-zinc-600">{s.body}</p>}
                  <Link href={SERVICE_LINKS[i]} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#7b2d26]">
                    {SERVICE_CTA[i]}
                    <Icon name="arrow" size={16} className="transition group-hover:translate-x-1" />
                  </Link>
                </article>
              ) : null,
            )}
          </div>
        </div>
      </section>

      {/* ============ THIỆP MỜI ONLINE ============ */}
      <section id="thiep-moi" className="scroll-mt-16 overflow-hidden bg-[#1d1a17] px-4 py-24 text-white lg:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#d8cdbf]">Thiệp cưới online</p>
          <h2 className="font-serif-display mt-5 max-w-3xl text-4xl leading-[1.02] sm:text-5xl lg:text-6xl">
            Tự chọn thiệp, <em className="text-[#d8cdbf]">xem ngay thiệp của hai bạn</em>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            Chọn một trong {templates.length} mẫu chạy thật có nhạc nền, đếm ngược, chỉ đường, xác nhận tham dự và hộp mừng cưới. Điền thông tin, bấm xem là thấy ngay thiệp mang tên hai bạn. Không cần tạo tài khoản.
          </p>
          <HomeInvitations templates={featuredTemplates} total={templates.length} />
        </div>
      </section>

      {/* ============ SLIDESHOW TIỆC CƯỚI ============ */}
      <section id="slideshow" className="scroll-mt-16 border-t border-white/10 bg-[#161210] px-4 py-24 text-white lg:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#d8cdbf]">Slideshow tiệc cưới</p>
          <h2 className="font-serif-display mt-5 max-w-3xl text-4xl leading-[1.02] sm:text-5xl lg:text-6xl">
            Ngày cưới, <em className="text-[#d8cdbf]">kể thành thước phim.</em>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            Một bộ ảnh, những lời muốn nói. Từ lời chào, lời tri ân gia đình đến khoảnh khắc chung đôi — chiếu toàn màn hình trong tiệc cưới, xuất file MP4 Full HD.
          </p>
          <div className="mb-12 mt-8 flex flex-wrap gap-3">
            <Link href="/thiep#chon" className="inline-flex min-h-12 items-center rounded-full bg-[#efe7dc] px-7 font-semibold text-[#1d1a17] transition hover:bg-white">
              Đặt làm video slideshow
            </Link>
            <Link href="/slideshow" className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-7 font-semibold text-white transition hover:border-white/60">
              Tự làm miễn phí ↗
            </Link>
          </div>
          <SlideshowGallery />
        </div>
      </section>

      {/* ============ QUY TRÌNH ============ */}
      {steps.length > 0 && (
        <section className="bg-white px-4 py-24 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">Quy trình</p>
            <h2 className="font-serif-display mt-4 max-w-2xl text-4xl leading-[1.05] text-[#1d1a17] sm:text-5xl lg:text-6xl">
              {["Một", "Hai", "Ba", "Bốn"][steps.length - 1]} bước <em>đến bộ ảnh cưới</em>
            </h2>
            <ol className={`mt-14 grid gap-10 sm:grid-cols-2 lg:gap-8 ${["", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4"][steps.length]}`}>
              {steps.map((s, i) => (
                <li key={i} className="border-t border-[#1d1a17]/20 pt-5">
                  <span className="font-serif-display text-5xl text-[#7b2d26]/80">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-xl font-semibold text-[#1d1a17]">{s.title}</h3>
                  {s.body && <p className="mt-2 leading-relaxed text-zinc-600">{s.body}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ============ BẢNG GIÁ GÓI CHỤP ============ */}
      {packages.some((p) => p.name) && (
        <section id="bang-gia" className="scroll-mt-16 bg-[#f6f2ec] px-4 py-24 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">Bảng giá</p>
              <h2 className="font-serif-display mt-4 text-4xl leading-[1.05] text-[#1d1a17] sm:text-5xl lg:text-6xl">
                Gói chụp <em>tham khảo</em>
              </h2>
              {studio.pricingNote && <p className="mt-5 text-lg leading-relaxed text-zinc-600">{studio.pricingNote}</p>}
            </div>
            <div className="mt-14">
              <Packages packages={packages} />
            </div>
            <p className="mt-10 text-sm text-zinc-500">
              Chỉ cần thiệp cưới online hoặc video slideshow?{" "}
              <Link href="/thiep#chon" className="font-medium text-[#7b2d26] underline-offset-4 hover:underline">
                Đặt làm thiệp & video
              </Link>
              , không cần tài khoản.
            </p>
          </div>
        </section>
      )}

      {/* ============ ALBUM MẪU ============ */}
      {samples.length > 0 && (
        <section className="bg-[#1d1a17] px-4 py-24 text-white lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#d8cdbf]">Album cưới</p>
                <h2 className="font-serif-display mt-4 max-w-2xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                  Lật xem <em className="text-[#d8cdbf]">album mẫu</em>
                </h2>
              </div>
              <Link href="/ghep-album" className="group inline-flex items-center gap-2 font-semibold text-[#d8cdbf]">
                Xem tất cả {samples.length} album mẫu
                <Icon name="arrow" size={18} className="transition group-hover:translate-x-1" />
              </Link>
            </div>
            <ul className="mt-12 grid gap-6 sm:grid-cols-3">
              {samples.slice(0, 3).map((a) => (
                <li key={a.id}>
                  <Link href={`/ghep-album#${a.slug}`} className="group block">
                    <div className="aspect-[4/3] overflow-hidden bg-white/5">
                      {a.cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <FramedImg src={a.cover.url} frame={a.frames.tile} loading="lazy" className="h-full w-full transition duration-700 group-hover:scale-[1.04]" />
                      )}
                    </div>
                    <p className="mt-4 text-[11px] uppercase tracking-[0.28em] text-white/50">{[sampleStyleLabel(a.category), sizeLabel(a.size)].filter(Boolean).join(" · ")}</p>
                    <p className="font-serif-display mt-1 text-2xl">{a.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ============ HỎI ĐÁP ============ */}
      {faqs.length > 0 && (
        <section className="bg-white px-4 py-24 lg:py-32">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">Hỏi đáp</p>
              <h2 className="font-serif-display mt-4 text-4xl leading-[1.05] text-[#1d1a17] sm:text-5xl">Chuẩn bị cho bộ ảnh cưới</h2>
            </div>
            <div className="divide-y divide-[#1d1a17]/10 border-y border-[#1d1a17]/10">
              {faqs.map((f, i) => (
                <details key={i} className="group py-5">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-[#1d1a17] [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="text-2xl leading-none text-[#7b2d26] transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-zinc-600">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ LIÊN HỆ ============ */}
      <section id="lien-he" className="scroll-mt-16 bg-[#f6f2ec] px-4 py-24 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <ContactBlock contact={studio.contact} services={services} />
        </div>
      </section>
    </>
  );
}
