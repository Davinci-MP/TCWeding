import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumCard } from "@/components/studio/AlbumCard";
import { PhotoWall } from "@/components/studio/PhotoWall";
import { categoryLabel, getPublishedAlbum, listPublishedAlbums } from "@/lib/studio";
import { Icon } from "@/templates/icons";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const album = await getPublishedAlbum((await params).slug);
  if (!album) return {};
  return {
    title: album.title,
    description: album.description || `Album ảnh cưới ${categoryLabel(album.category).toLowerCase()}${album.location ? ` tại ${album.location}` : ""} do TCWedding thực hiện.`,
    openGraph: album.cover ? { images: [album.cover.url] } : undefined,
  };
}

export default async function AlbumPage({ params }: Props) {
  const album = await getPublishedAlbum((await params).slug);
  if (!album) notFound();
  const others = (await listPublishedAlbums({ featuredFirst: false })).filter((a) => a.id !== album.id);
  const related = [...others.filter((a) => a.category === album.category), ...others.filter((a) => a.category !== album.category)].slice(0, 3);
  const meta = [categoryLabel(album.category), album.location].filter(Boolean);

  return (
    <>
      <section className="relative isolate flex min-h-[72svh] items-end overflow-hidden bg-[#1d1a17] text-white">
        {album.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={album.cover.url} alt="" fetchPriority="high" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#1d1a17]/90 via-[#1d1a17]/40 to-[#1d1a17]/30" aria-hidden />
        <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-28 sm:pb-16">
          <Link href="/bo-suu-tap" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <Icon name="left" size={16} />
            Bộ sưu tập
          </Link>
          <h1 className="font-serif-display tpl-rise mt-5 max-w-4xl text-balance text-5xl leading-[1] sm:text-7xl lg:text-[5.2rem]">{album.title}</h1>
          <p className="tpl-rise mt-5 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#d8cdbf]" style={{ animationDelay: "150ms" }}>
            {[...meta, `${album.photos.length} ảnh`].join(" · ")}
          </p>
        </div>
      </section>

      <section className="bg-[#f6f2ec] px-3 py-12 sm:px-4 lg:py-16">
        <div className="mx-auto max-w-6xl">
          {album.description && <p className="font-serif-display mx-auto mb-12 max-w-2xl whitespace-pre-line text-center text-2xl leading-relaxed text-[#1d1a17] sm:text-[1.7rem]">{album.description}</p>}
          {album.photos.length ? (
            <PhotoWall photos={album.photos.map((p) => ({ id: p.id, url: p.url, width: p.width, height: p.height }))} title={album.title} />
          ) : (
            <p className="py-16 text-center text-zinc-500">Album đang được cập nhật ảnh.</p>
          )}
        </div>
      </section>

      <section className="bg-[#1d1a17] px-4 py-20 text-center text-white">
        <h2 className="font-serif-display mx-auto max-w-2xl text-4xl leading-tight sm:text-5xl">
          Muốn có một bộ ảnh <em className="text-[#d8cdbf]">như thế này?</em>
        </h2>
        <Link href="/#lien-he" className="mt-8 inline-block rounded-full bg-[#efe7dc] px-7 py-3.5 font-semibold text-[#1d1a17] transition hover:bg-white">
          Đặt lịch tư vấn
        </Link>
      </section>

      {related.length > 0 && (
        <section className="bg-white px-4 py-20 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-serif-display text-4xl text-[#1d1a17]">Album khác</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <AlbumCard key={a.id} album={a} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
