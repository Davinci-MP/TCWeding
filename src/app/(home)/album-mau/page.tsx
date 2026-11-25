import Link from "next/link";
import { SampleGallery, type SampleCard } from "@/components/studio/SampleGallery";
import { ALBUM_SIZE_GROUPS, SAMPLE_STYLES, isAlbumSize, isSampleStyle, listSampleAlbums, sampleStyleLabel, sizeLabel, sizeRatio } from "@/lib/studio";

export const metadata = {
  title: "Album cưới mẫu",
  description: "Lật xem album cưới mẫu: prewedding, phóng sự cưới, ảnh phóng. Chọn khổ album và phong cách, TCWedding dàn trang bằng ảnh của hai bạn.",
};

type Search = { phong?: string; kho?: string };

export default async function SampleAlbums({ searchParams }: { searchParams: Promise<Search> }) {
  const { phong, kho } = await searchParams;
  const style = phong && isSampleStyle(phong) ? phong : undefined;
  const size = kho && isAlbumSize(kho) ? kho : undefined;
  const [albums, all] = await Promise.all([listSampleAlbums({ style, size }), listSampleAlbums()]);
  const usedSizes = new Set(all.map((a) => a.size));

  const cards: SampleCard[] = albums.map((a) => {
    const pages = a.photos.map((p) => p.url);
    const cover = a.cover?.url ?? "";
    // Ảnh bìa luôn là trang đầu tiên của album.
    const ordered = cover ? [cover, ...pages.filter((u) => u !== cover)] : pages;
    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      description: a.description,
      styleLabel: sampleStyleLabel(a.category),
      sizeLabel: sizeLabel(a.size),
      ratio: sizeRatio(a.size),
      single: a.category === "anh-phong",
      cover,
      pages: ordered,
    };
  });

  const href = (next: Search) => {
    const q = new URLSearchParams();
    const s = { phong: style, kho: size, ...next };
    if (s.phong) q.set("phong", s.phong);
    if (s.kho) q.set("kho", s.kho);
    const qs = q.toString();
    return qs ? `/album-mau?${qs}` : "/album-mau";
  };
  const chip = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-full px-5 text-sm font-medium transition ${active ? "bg-[#efe7dc] text-[#1d1a17]" : "border border-white/20 text-white/75 hover:border-white/60 hover:text-white"}`;

  return (
    <>
      <section className="bg-[#1d1a17] px-4 pb-14 pt-20 text-white lg:pt-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-[#d8cdbf]">Album cưới</p>
          <h1 className="font-serif-display mt-5 max-w-3xl text-5xl leading-[1] sm:text-6xl lg:text-7xl">
            Từng trang, <em className="text-[#d8cdbf]">một câu chuyện.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            Prewedding với những khung hình lớn tràn trang, phóng sự cưới kể lại trọn ngày vui. Bấm vào một album để lật từng trang như đang cầm album thật trên tay.
          </p>
          <nav aria-label="Lọc album mẫu" className="mt-10 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Link href={href({ phong: undefined })} aria-current={!style ? "page" : undefined} className={chip(!style)}>
                Tất cả
              </Link>
              {SAMPLE_STYLES.map((s) => (
                <Link key={s.id} href={href({ phong: s.id })} aria-current={style === s.id ? "page" : undefined} className={chip(style === s.id)}>
                  {s.label}
                </Link>
              ))}
            </div>
            {usedSizes.size > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm text-white/50">Khổ</span>
                <Link href={href({ kho: undefined })} aria-current={!size ? "page" : undefined} className={chip(!size)}>
                  Mọi khổ
                </Link>
                {ALBUM_SIZE_GROUPS.flatMap((g) => g.sizes)
                  .filter((s) => usedSizes.has(s))
                  .map((s) => (
                    <Link key={s} href={href({ kho: s })} aria-current={size === s ? "page" : undefined} className={chip(size === s)}>
                      {sizeLabel(s)}
                    </Link>
                  ))}
              </div>
            )}
          </nav>
        </div>
      </section>

      <section className="bg-[#f6f2ec] px-4 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl">
          {cards.length ? (
            <SampleGallery albums={cards} />
          ) : (
            <div className="py-16 text-center">
              <p className="font-serif-display text-3xl text-[#1d1a17]">{all.length ? "Chưa có album mẫu nào phù hợp bộ lọc." : "Album mẫu sẽ sớm có mặt tại đây."}</p>
              <p className="mt-3 text-zinc-600">{all.length ? "" : "Trong lúc chờ, bạn có thể xem ảnh cưới trong bộ sưu tập hoặc nhắn studio để xem album thật."}</p>
              <Link href={all.length ? "/album-mau" : "/bo-suu-tap"} className="mt-5 inline-block font-semibold text-[#7b2d26]">
                {all.length ? "Xem tất cả album mẫu" : "Xem bộ sưu tập"}
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white px-4 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">Kích thước</p>
          <h2 className="font-serif-display mt-4 max-w-2xl text-4xl leading-[1.05] text-[#1d1a17] sm:text-5xl">Chọn khổ album hợp với câu chuyện của hai bạn</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Album trải đôi mở phẳng, ảnh chạy liền qua gáy. Ngoài album còn có ảnh phóng treo tường và ảnh cổng cùng tông màu. Nhắn studio để được tư vấn chất liệu và báo giá.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ALBUM_SIZE_GROUPS.map((g) => (
              <div key={g.id} className="border-t border-[#1d1a17]/15 pt-5">
                <h3 className="font-serif-display text-2xl text-[#1d1a17]">{g.label}</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {g.sizes.map((s) => (
                    <li key={s} className="rounded-full bg-[#f6f2ec] px-3 py-1 text-sm tabular-nums text-[#1d1a17]">
                      {sizeLabel(s)}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{g.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1d1a17] px-4 py-20 text-center text-white">
        <h2 className="font-serif-display mx-auto max-w-2xl text-4xl leading-tight sm:text-5xl">
          Chọn một mẫu, <em className="text-[#d8cdbf]">studio dàn trang bằng ảnh của hai bạn.</em>
        </h2>
        <Link href="/?goi=album#lien-he" className="mt-8 inline-block rounded-full bg-[#efe7dc] px-7 py-3.5 font-semibold text-[#1d1a17] transition hover:bg-white">
          Đặt làm album
        </Link>
      </section>
    </>
  );
}
