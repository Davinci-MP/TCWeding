import { addMusicAction, deleteMusicAction } from "@/app/actions/admin";
import { getMusicLibrary } from "@/lib/settings";
import { TRACKS } from "@/templates/music/tracks";
import { MusicUpload } from "./MusicUpload";

export const metadata = { title: "Thư viện nhạc" };

export default async function AdminMusic({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [list, { saved, error }] = await Promise.all([getMusicLibrary(), searchParams]);
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-semibold">Thư viện nhạc</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Bài bạn thêm ở đây sẽ hiện trong mục Nhạc nền của mọi người dùng, bên cạnh {TRACKS.length} bài dựng sẵn. Chỉ thêm bản thu bạn có quyền sử dụng.
      </p>
      {saved && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Đã thêm bài vào thư viện.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          Cần nhập tên bài và tải file nhạc lên trước khi thêm.
        </p>
      )}

      <form action={addMusicAction} className="card mt-6 space-y-4 p-5">
        <h2 className="font-semibold">Thêm bài</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">Tên bài</span>
            <input name="name" className="input mt-1" required maxLength={80} placeholder="A Thousand Years (piano)" />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Mô tả ngắn</span>
            <input name="note" className="input mt-1" maxLength={120} placeholder="Piano · nhẹ nhàng" />
          </label>
        </div>
        <MusicUpload />
        <button className="btn btn-primary">Thêm vào thư viện</button>
      </form>

      <h2 className="mt-8 font-semibold">Bài đã thêm ({list.length})</h2>
      {list.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">Chưa có bài nào. Người dùng vẫn chọn được các bài dựng sẵn hoặc tự tải nhạc lên.</p>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
          {list.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <div className="min-w-40 flex-1">
                <p className="font-medium">{t.name}</p>
                {t.note && <p className="text-xs text-zinc-500">{t.note}</p>}
              </div>
              <audio controls preload="none" src={t.url} className="h-9 w-64 max-w-full" />
              <form action={deleteMusicAction}>
                <input type="hidden" name="id" value={t.id} />
                <button className="text-sm text-red-600 hover:underline">Xoá</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
