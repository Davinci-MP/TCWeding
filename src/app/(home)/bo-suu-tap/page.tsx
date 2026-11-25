import Link from "next/link";
import { AlbumCard } from "@/components/studio/AlbumCard";
import { ALBUM_CATEGORIES, isCategory, listPublishedAlbums } from "@/lib/studio";

export const metadata = {
  title: "Bộ sưu tập ảnh cưới",
  description: "Album ảnh cưới studio, ngoại cảnh và phóng sự ngày cưới do TCWedding thực hiện.",
};

export default async function Collections({ searchParams }: { searchParams: Promise<{ loai?: string }> }) {
  const { loai } = await searchParams;
  const category = loai && isCategory(loai) ? loai : undefined;
  const albums = await listPublishedAlbums({ category });
  const tabs = [{ id: "", label: "Tất cả" }, ...ALBUM_CATEGORIES];

  return (
    <>
      <section className="bg-[#1d1a17] px-4 pb-14 pt-20 text-white lg:pt-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-[#d8cdbf]">Bộ sưu tập</p>
          <h1 className="font-serif-display mt-5 max-w-3xl text-5xl leading-[1] sm:text-6xl lg:text-7xl">
            Album ảnh cưới <em className="text-[#d8cdbf]">chúng tôi đã chụp</em>
          </h1>
          <nav aria-label="Lọc theo loại album" className="mt-10 flex flex-wrap gap-2">
            {tabs.map((t) => {
              const active = (category ?? "") === t.id;
              return (
                <Link
                  key={t.id}
                  href={t.id ? `/bo-suu-tap?loai=${t.id}` : "/bo-suu-tap"}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-medium transition ${
                    active ? "bg-[#efe7dc] text-[#1d1a17]" : "border border-white/20 text-white/75 hover:border-white/60 hover:text-white"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      <section className="bg-[#f6f2ec] px-4 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl">
          {albums.length ? (
            <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((a) => (
                <AlbumCard key={a.id} album={a} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="font-serif-display text-3xl text-[#1d1a17]">Chưa có album nào{category ? " trong mục này" : ""}.</p>
              {category && (
                <Link href="/bo-suu-tap" className="mt-4 inline-block font-semibold text-[#7b2d26]">
                  Xem tất cả album
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
