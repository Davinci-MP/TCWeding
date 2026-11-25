import Link from "next/link";
import { createAlbumAction } from "@/app/actions/studio";
import { db } from "@/lib/db";
import { ALBUM_CATEGORIES, ALBUM_SIZE_GROUPS, SAMPLE_STYLES, categoryLabel, sampleStyleLabel, sizeLabel } from "@/lib/studio";

/** Danh sách album trong trang quản trị: bộ sưu tập (COLLECTION) hoặc album mẫu (SAMPLE). */
export async function AlbumList({ kind, error, deleted }: { kind: "COLLECTION" | "SAMPLE"; error?: string; deleted?: string }) {
  const sample = kind === "SAMPLE";
  const albums = await db.album.findMany({
    where: { kind },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { photos: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } }, _count: { select: { photos: true } } },
  });
  const cats = sample ? SAMPLE_STYLES : ALBUM_CATEGORIES;
  const label = sample ? sampleStyleLabel : categoryLabel;

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-3xl font-semibold">{sample ? "Album mẫu" : "Bộ sưu tập"}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {sample
          ? "Album in mẫu để khách lật xem ở trang /album-mau. Mỗi ảnh là một trang; ảnh bìa là trang đầu. Nên tải ảnh đúng tỉ lệ khổ album (vd 30×30 → ảnh vuông)."
          : "Album ảnh hiện ở trang /bo-suu-tap. Khách thả tim ảnh và gửi kèm yêu cầu tư vấn. Album đánh dấu “Trang chủ” được ưu tiên hiện ở trang chủ (tối đa 5 album)."}
      </p>
      {deleted && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Đã xoá album.
        </p>
      )}

      <form action={createAlbumAction} className="card mt-6 flex flex-wrap items-end gap-3 p-5">
        <input type="hidden" name="kind" value={kind} />
        <label className="block min-w-60 flex-1 text-sm">
          <span className="font-medium">Tên album mới</span>
          <input name="title" required maxLength={120} placeholder={sample ? "Prewedding Đà Lạt" : "Hoàng hôn trên đồi"} className="input mt-1" aria-invalid={error === "title" || undefined} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">{sample ? "Phong cách" : "Loại"}</span>
          <select name="category" className="input mt-1">
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        {sample && (
          <label className="block text-sm">
            <span className="font-medium">Khổ</span>
            <select name="size" defaultValue="30x30" className="input mt-1">
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
        )}
        <button className="btn btn-primary">Tạo album</button>
      </form>

      {albums.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">Chưa có album nào. Tạo album đầu tiên rồi tải ảnh lên.</p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
          {albums.map((a) => {
            const cover = a.coverUrl || a.photos[0]?.url;
            return (
              <li key={a.id}>
                <Link href={`/admin/albums/${a.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.title}</p>
                    <p className="text-xs text-zinc-500">
                      {[label(a.category), sample ? sizeLabel(a.size) : a.location, `${a._count.photos} ${sample ? "trang" : "ảnh"}`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {!sample && a.featured && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">Trang chủ</span>}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
                    {a.status === "PUBLISHED" ? "Đang hiện" : "Nháp"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
