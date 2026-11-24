import Link from "next/link";
import { categoryLabel, type AlbumCard as Album } from "@/lib/studio";

/** Thẻ album: ảnh bìa + tên + loại · địa điểm · số ảnh. `tall` cho ô lớn ở lưới trang chủ. */
export function AlbumCard({ album, tall }: { album: Album; tall?: boolean }) {
  const meta = [categoryLabel(album.category), album.location].filter(Boolean).join(" · ");
  return (
    <Link href={`/bo-suu-tap/${album.slug}`} className="group block h-full focus-visible:outline-none" aria-label={`${album.title} — ${meta}, ${album.photoCount} ảnh`}>
      <div className={`relative overflow-hidden bg-[#e9e2d8] ${tall ? "aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[560px]" : "aspect-[4/5]"}`}>
        {album.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.cover.url}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/75">{meta}</p>
          <h3 className="font-serif-display mt-2 text-3xl leading-tight sm:text-[2.1rem]">{album.title}</h3>
        </div>
        <span className="absolute inset-0 ring-inset ring-[#d8cdbf] group-focus-visible:ring-4" aria-hidden />
      </div>
    </Link>
  );
}
