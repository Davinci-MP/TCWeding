import Link from "next/link";
import { saveStudioAction } from "@/app/actions/studio";
import { ImageInput } from "@/components/admin/ImageInput";
import { getStudio } from "@/lib/studio";

export const metadata = { title: "Nội dung trang chủ" };

function Text({ name, label, value, hint, max = 200, placeholder, type = "text" }: { name: string; label: string; value: string; hint?: string; max?: number; placeholder?: string; type?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      <input name={name} type={type} defaultValue={value} maxLength={max} placeholder={placeholder} className="input mt-1" />
    </label>
  );
}

export default async function AdminStudio({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [s, { saved }] = await Promise.all([getStudio(), searchParams]);
  const c = s.contact;
  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Nội dung trang chủ</h1>
          <p className="mt-1 text-sm text-zinc-500">Chữ, ảnh và thông tin liên hệ trên trang chủ studio. Ô nào để trống thì phần đó được ẩn.</p>
        </div>
        <Link href="/" target="_blank" className="btn btn-outline">
          Xem trang chủ ↗
        </Link>
      </div>
      {saved && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Đã lưu. Trang chủ đã cập nhật.
        </p>
      )}

      <form action={saveStudioAction} className="mt-6 space-y-6">
        <fieldset className="card space-y-4 p-5">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Phần mở đầu</legend>
          <Text name="heroTitle" label="Tiêu đề lớn" value={s.heroTitle} max={120} hint="Từ đầu tiên in đứng, phần còn lại in nghiêng." />
          <label className="block text-sm">
            <span className="font-medium">Câu giới thiệu</span>
            <textarea name="heroLead" defaultValue={s.heroLead} maxLength={300} rows={2} className="input mt-1" />
          </label>
          <ImageInput
            name="heroImage"
            label="Ảnh nền"
            defaultValue={s.heroImage}
            hint="Ảnh ngang, chủ thể ở giữa hoặc lệch phải (chữ nằm góc trái dưới). Để trống: dùng ảnh bìa album nổi bật đầu tiên."
          />
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Về chúng tôi</legend>
          <Text name="introTitle" label="Tiêu đề" value={s.introTitle} max={150} />
          <label className="block text-sm">
            <span className="font-medium">Nội dung</span>
            <span className="block text-xs text-zinc-500">Cách một dòng trống để xuống đoạn mới.</span>
            <textarea name="introBody" defaultValue={s.introBody} maxLength={2000} rows={5} className="input mt-1" />
          </label>
          <ImageInput name="introImage" label="Ảnh" aspect="aspect-[4/5]" defaultValue={s.introImage} hint="Ảnh dọc 4:5. Để trống: dùng bìa một album khác." />
          <div>
            <p className="text-sm font-medium">Con số nổi bật</p>
            <p className="text-xs text-zinc-500">Chỉ điền số thật, ví dụ “500+” và “cặp đôi đã chụp”. Để trống cả ba thì phần này được ẩn.</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {s.stats.map((st, i) => (
                <div key={i} className="grid grid-cols-[5rem_1fr] gap-2">
                  <input name={`stats.${i}.value`} defaultValue={st.value} maxLength={20} placeholder="8" aria-label={`Con số ${i + 1}`} className="input" />
                  <input name={`stats.${i}.label`} defaultValue={st.label} maxLength={60} placeholder="năm làm nghề" aria-label={`Nhãn con số ${i + 1}`} className="input" />
                </div>
              ))}
            </div>
          </div>
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Dịch vụ</legend>
          <p className="text-xs text-zinc-500">
            Ba ô theo thứ tự: chụp ảnh cưới (dẫn tới Bộ sưu tập), thiệp mời online (dẫn tới trang Thiệp mời), album (dẫn tới Liên hệ). Xoá tên để ẩn một ô.
          </p>
          <div className="grid gap-5 lg:grid-cols-3">
            {s.services.map((sv, i) => (
              <div key={i} className="space-y-3">
                <Text name={`services.${i}.title`} label={`Tên dịch vụ ${i + 1}`} value={sv.title} max={60} />
                <label className="block text-sm">
                  <span className="font-medium">Mô tả</span>
                  <textarea name={`services.${i}.body`} defaultValue={sv.body} maxLength={300} rows={4} className="input mt-1" />
                </label>
                <ImageInput name={`services.${i}.image`} label="Ảnh (không bắt buộc)" defaultValue={sv.image} />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Liên hệ</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Text name="contact.phone" label="Điện thoại" value={c.phone} max={30} placeholder="0901 234 567" type="tel" />
            <Text name="contact.email" label="Email" value={c.email} max={120} placeholder="lienhe@tcwedding.vn" type="email" />
            <Text name="contact.address" label="Địa chỉ studio" value={c.address} />
            <Text name="contact.hours" label="Giờ làm việc" value={c.hours} max={120} placeholder="8:00 – 20:00, tất cả các ngày" />
            <Text name="contact.area" label="Khu vực hoạt động" value={c.area} max={120} placeholder="Hà Nội" hint="Hiện ở dòng nhỏ trên tiêu đề và chân trang." />
            <Text name="contact.zalo" label="Link Zalo" value={c.zalo} max={300} placeholder="https://zalo.me/0901234567" hint="Để trống: tự tạo từ số điện thoại." />
            <Text name="contact.facebook" label="Facebook" value={c.facebook} max={300} placeholder="https://facebook.com/tcwedding" />
            <Text name="contact.instagram" label="Instagram" value={c.instagram} max={300} />
            <Text name="contact.tiktok" label="TikTok" value={c.tiktok} max={300} />
          </div>
        </fieldset>

        <div className="sticky bottom-4 flex justify-end">
          <button className="btn btn-primary shadow-lg">Lưu nội dung</button>
        </div>
      </form>
    </div>
  );
}
