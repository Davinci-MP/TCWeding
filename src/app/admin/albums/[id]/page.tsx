import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteAlbumAction, updateAlbumAction } from "@/app/actions/studio";
import { AlbumPhotos } from "@/components/admin/AlbumPhotos";
import { ConfirmButton } from "@/components/ConfirmButton";
import { db } from "@/lib/db";
import { ALBUM_CATEGORIES, ALBUM_SIZE_GROUPS, SAMPLE_STYLES, sizeLabel } from "@/lib/studio";

export const metadata = { title: "Sửa album" };

export default async function AdminAlbumEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const album = await db.album.findUnique({ where: { id }, include: { photos: { orderBy: { sortOrder: "asc" } } } });
  if (!album) notFound();
  const live = album.status === "PUBLISHED";
  const sample = album.kind === "SAMPLE";
  const publicUrl = sample ? `/album-mau#${album.slug}` : `/bo-suu-tap/${album.slug}`;

  return (
    <div className="max-w-5xl">
      <Link href={sample ? "/admin/album-mau" : "/admin/albums"} className="text-sm text-zinc-500 hover:text-zinc-900">
        ← {sample ? "Album mẫu" : "Bộ sưu tập"}
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">{album.title}</h1>
        {live && (
          <Link href={publicUrl} target="_blank" className="btn btn-outline">
            Xem trên trang ↗
          </Link>
        )}
      </div>
      {saved && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Đã lưu thông tin album.
        </p>
      )}

      <section className="card mt-6 p-5">
        <h2 className="font-semibold">Ảnh ({album.photos.length})</h2>
        <p className="mb-4 text-sm text-zinc-500">
          {sample
            ? `Mỗi ảnh là một trang album, lật theo thứ tự dưới đây; ảnh bìa là trang đầu. Nên dùng ảnh đúng tỉ lệ khổ ${sizeLabel(album.size)}. Thay đổi về ảnh được lưu ngay.`
            : "Ảnh hiện theo thứ tự dưới đây. Thay đổi về ảnh được lưu ngay."}
        </p>
        <AlbumPhotos albumId={album.id} coverUrl={album.coverUrl} photos={album.photos.map((p) => ({ id: p.id, url: p.url, width: p.width, height: p.height }))} />
      </section>

      <form action={updateAlbumAction} className="card mt-6 space-y-4 p-5">
        <h2 className="font-semibold">Thông tin album</h2>
        <input type="hidden" name="id" value={album.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">Tên album</span>
            <input name="title" defaultValue={album.title} required maxLength={120} className="input mt-1" />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Đường dẫn</span>
            <span className="mt-1 flex items-center rounded-lg border border-zinc-300 bg-zinc-50 pl-3 text-zinc-500 focus-within:ring-2 focus-within:ring-brand/30">
              <span className="shrink-0 text-xs">{sample ? "/album-mau#" : "/bo-suu-tap/"}</span>
              <input name="slug" defaultValue={album.slug} maxLength={60} className="min-w-0 flex-1 bg-transparent px-1 py-2 text-zinc-900 outline-none" />
            </span>
          </label>
          <label className="block text-sm">
            <span className="font-medium">{sample ? "Phong cách" : "Loại"}</span>
            <select name="category" defaultValue={album.category} className="input mt-1">
              {(sample ? SAMPLE_STYLES : ALBUM_CATEGORIES).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          {sample ? (
            <label className="block text-sm">
              <span className="font-medium">Khổ album</span>
              <select name="size" defaultValue={album.size} className="input mt-1">
                {ALBUM_SIZE_GROUPS.map((g) => (
                  <optgroup key={g.id} label={g.label}>
                    {g.sizes.map((s) => (
                      <option key={s} value={s}>
                        {sizeLabel(s)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          ) : (
            <label className="block text-sm">
              <span className="font-medium">Địa điểm chụp</span>
              <input name="location" defaultValue={album.location} maxLength={120} placeholder="Đà Lạt" className="input mt-1" />
            </label>
          )}
        </div>
        <label className="block text-sm">
          <span className="font-medium">Mô tả</span>
          <span className="block text-xs text-zinc-500">{sample ? "Một câu ngắn về phong cách dàn trang, hiện dưới tên album." : "Một vài câu về buổi chụp, hiện phía trên lưới ảnh."}</span>
          <textarea name="description" defaultValue={album.description} maxLength={2000} rows={3} className="input mt-1" />
        </label>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <fieldset className="text-sm">
            <legend className="font-medium">Trạng thái</legend>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="status" value="DRAFT" defaultChecked={!live} /> Nháp (ẩn)
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="status" value="PUBLISHED" defaultChecked={live} /> Hiện trên trang
              </label>
            </div>
          </fieldset>
          {!sample && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={album.featured} /> Ưu tiên ở trang chủ
            </label>
          )}
          <label className="block w-28 text-sm">
            <span className="font-medium">Thứ tự</span>
            <input type="number" name="sortOrder" defaultValue={album.sortOrder} className="input mt-1" />
          </label>
        </div>
        <button className="btn btn-primary">Lưu thông tin</button>
      </form>

      <form action={deleteAlbumAction} className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 p-5">
        <p className="text-sm text-zinc-600">Xoá album cùng toàn bộ {album.photos.length} ảnh. Không khôi phục được.</p>
        <input type="hidden" name="id" value={album.id} />
        <ConfirmButton message={`Xoá album “${album.title}” và ${album.photos.length} ảnh? Không khôi phục được.`}>Xoá album</ConfirmButton>
      </form>
    </div>
  );
}
