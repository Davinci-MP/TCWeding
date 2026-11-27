import Link from "next/link";
import { saveAboutAction } from "@/app/actions/studio";
import { ImageInput } from "@/components/admin/ImageInput";
import { getAbout } from "@/lib/about";

export const metadata = { title: "Về tôi" };

function Text({ name, label, value, hint, max = 200, placeholder }: { name: string; label: string; value: string; hint?: string; max?: number; placeholder?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      <input name={name} defaultValue={value} maxLength={max} placeholder={placeholder} className="input mt-1" />
    </label>
  );
}

function Area({ name, label, value, hint, max = 2000, rows = 4 }: { name: string; label: string; value: string; hint?: string; max?: number; rows?: number }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      <textarea name={name} defaultValue={value} maxLength={max} rows={rows} className="input mt-1" />
    </label>
  );
}

export default async function AdminAbout({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [a, { saved }] = await Promise.all([getAbout(), searchParams]);
  const legend = "px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400";
  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Về tôi</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Trang giới thiệu nhiếp ảnh gia / chủ studio ở /ve-toi. Mục nào để trống tiêu đề thì ẩn. Portfolio và liên hệ lấy tự động từ Bộ sưu tập và Nội dung trang chủ.
          </p>
        </div>
        <Link href="/ve-toi" target="_blank" className="btn btn-outline">
          Xem trang ↗
        </Link>
      </div>
      {saved && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Đã lưu. Trang Về tôi đã cập nhật.
        </p>
      )}
      <form action={saveAboutAction} className="mt-6 space-y-6">
        <fieldset className="card space-y-4 p-5">
          <legend className={legend}>Phần mở đầu</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Text name="eyebrow" label="Dòng nhỏ trên tiêu đề" value={a.eyebrow} max={80} placeholder="Nhiếp ảnh gia tại Nghệ An" />
            <Text name="name" label="Tên" value={a.name} max={80} />
            <Text name="role" label="Chức danh" value={a.role} max={120} placeholder="Wedding Photographer & Creative Director" />
          </div>
          <Area name="headline" label="Câu tiêu đề lớn" value={a.headline} max={200} rows={2} hint="Nên dưới 80 ký tự; câu dài tự thu nhỏ. Font và cỡ chữ chỉnh ở Nội dung trang chủ › Kiểu chữ." />
          <Area name="intro" label="Giới thiệu ngắn" value={a.intro} max={600} rows={3} />
          <ImageInput name="photo" label="Ảnh chân dung" aspect="aspect-[4/5]" defaultValue={a.photo} hint="Ảnh dọc 4:5. Để trống: dùng một ảnh trong bộ sưu tập." />
          <div>
            <p className="text-sm font-medium">Con số nổi bật</p>
            <p className="text-xs text-zinc-500">Chỉ điền số thật. Ô nào thiếu số thì không hiện.</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {a.stats.map((st, i) => (
                <div key={i} className="grid grid-cols-[5rem_1fr] gap-2">
                  <input name={`stats.${i}.value`} defaultValue={st.value} maxLength={20} placeholder="5" aria-label={`Con số ${i + 1}`} className="input" />
                  <input name={`stats.${i}.label`} defaultValue={st.label} maxLength={60} aria-label={`Nhãn con số ${i + 1}`} className="input" />
                </div>
              ))}
            </div>
          </div>
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className={legend}>Câu chuyện</legend>
          <Text name="storyTitle" label="Tiêu đề" value={a.storyTitle} max={150} />
          <Area name="storyBody" label="Nội dung" value={a.storyBody} max={4000} rows={8} hint="Cách một dòng trống để xuống đoạn mới." />
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className={legend}>Lĩnh vực hoạt động</legend>
          <Text name="fieldsTitle" label="Tiêu đề mục" value={a.fieldsTitle} max={100} />
          <div className="grid gap-3 sm:grid-cols-2">
            {a.fields.map((f, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-zinc-100 p-3">
                <input name={`fields.${i}.title`} defaultValue={f.title} maxLength={80} placeholder={`Lĩnh vực ${i + 1}`} aria-label={`Lĩnh vực ${i + 1}`} className="input" />
                <textarea name={`fields.${i}.body`} defaultValue={f.body} maxLength={400} rows={2} placeholder="Mô tả" aria-label={`Mô tả lĩnh vực ${i + 1}`} className="input" />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className={legend}>Các mục thêm (tư duy, cách làm việc, định hướng…)</legend>
          {a.blocks.map((b, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-zinc-100 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
                <input name={`blocks.${i}.eyebrow`} defaultValue={b.eyebrow} maxLength={60} placeholder="Dòng nhỏ" aria-label={`Dòng nhỏ mục ${i + 1}`} className="input" />
                <input name={`blocks.${i}.title`} defaultValue={b.title} maxLength={200} placeholder={`Tiêu đề mục ${i + 1}`} aria-label={`Tiêu đề mục ${i + 1}`} className="input" />
              </div>
              <textarea name={`blocks.${i}.body`} defaultValue={b.body} maxLength={3000} rows={3} placeholder="Nội dung" aria-label={`Nội dung mục ${i + 1}`} className="input" />
            </div>
          ))}
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className={legend}>Đánh giá</legend>
          <Text name="reviewUrl" label="Link trang đánh giá (Google, Facebook…)" value={a.reviewUrl} max={300} placeholder="https://g.page/r/…" hint="Để trống thì ẩn mục Đánh giá." />
          <Text name="reviewText" label="Lời mời đánh giá" value={a.reviewText} max={400} />
        </fieldset>

        <div className="sticky bottom-4 flex justify-end">
          <button className="btn btn-primary shadow-lg">Lưu trang Về tôi</button>
        </div>
      </form>
    </div>
  );
}
