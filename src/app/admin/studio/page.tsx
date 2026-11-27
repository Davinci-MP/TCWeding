import Link from "next/link";
import { saveStudioAction } from "@/app/actions/studio";
import { FontPicker } from "@/components/admin/FontPicker";
import { ImageInput } from "@/components/admin/ImageInput";
import { getStudio } from "@/lib/studio";
import { BODY_SIZE_LABEL, TITLE_SIZE_LABEL } from "@/lib/typo";

function Choice({ name, label, value, options }: { name: string; label: string; value: string; options: Record<string, string> }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <select name={name} defaultValue={value} className="input mt-1">
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}

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
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Kiểu chữ toàn website</legend>
          <p className="text-xs text-zinc-500">
            Áp dụng cho trang chủ, Bộ sưu tập, Ghép album, Về tôi, Thiệp mời… (không đổi kiểu chữ bên trong mẫu thiệp). Tiêu đề dài tự thu nhỏ cho vừa màn hình; chọn cỡ chữ để chỉnh thêm.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FontPicker name="typo.headingFont" label="Font tiêu đề" defaultValue={s.typo.headingFont} kinds={["serif", "sans", "script"]} sample="Ảnh cưới giữ nguyên cách hai bạn nhìn nhau" />
            <FontPicker name="typo.bodyFont" label="Font nội dung" defaultValue={s.typo.bodyFont} kinds={["sans", "serif"]} sample="Chụp ảnh cưới studio, ngoại cảnh và thiệp mời online." />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Choice name="typo.heroSize" label="Cỡ tiêu đề đầu trang" value={s.typo.heroSize} options={TITLE_SIZE_LABEL} />
            <Choice name="typo.titleSize" label="Cỡ tiêu đề các mục" value={s.typo.titleSize} options={TITLE_SIZE_LABEL} />
            <Choice name="typo.bodySize" label="Cỡ chữ nội dung" value={s.typo.bodySize} options={BODY_SIZE_LABEL} />
          </div>
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Phần mở đầu</legend>
          <Text name="heroTitle" label="Tiêu đề lớn" value={s.heroTitle} max={120} hint="Từ đầu tiên in đứng, phần còn lại in nghiêng. Nên ngắn gọn (dưới 60 ký tự) để hiện trọn trên điện thoại; câu dài sẽ tự thu nhỏ." />
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
          <Text name="introTitle" label="Tiêu đề" value={s.introTitle} max={150} hint="Nên dưới 80 ký tự; câu dài tự thu nhỏ." />
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
            Ba ô theo thứ tự: chụp ảnh cưới (dẫn tới Bộ sưu tập), thiệp mời online (dẫn tới trang Thiệp mời), album (dẫn tới Album mẫu). Xoá tên để ẩn một ô.
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
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Quy trình</legend>
          <p className="text-xs text-zinc-500">Tối đa 4 bước, hiện theo thứ tự. Xoá tên bước để ẩn; xoá hết thì ẩn cả mục.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {s.steps.map((st, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-zinc-100 p-3">
                <Text name={`steps.${i}.title`} label={`Bước ${i + 1}`} value={st.title} max={60} />
                <textarea name={`steps.${i}.body`} defaultValue={st.body} maxLength={300} rows={2} aria-label={`Mô tả bước ${i + 1}`} className="input" />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Hỏi đáp</legend>
          <p className="text-xs text-zinc-500">Tối đa 8 câu. Câu nào thiếu câu hỏi hoặc câu trả lời thì không hiện.</p>
          <div className="space-y-3">
            {s.faqs.map((f, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-zinc-100 p-3 sm:grid-cols-[1fr_1.4fr]">
                <input name={`faqs.${i}.q`} defaultValue={f.q} maxLength={200} placeholder={`Câu hỏi ${i + 1}`} aria-label={`Câu hỏi ${i + 1}`} className="input" />
                <textarea name={`faqs.${i}.a`} defaultValue={f.a} maxLength={1000} rows={2} placeholder="Câu trả lời" aria-label={`Trả lời câu ${i + 1}`} className="input" />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Bảng giá, ghép album & chân trang</legend>
          <label className="block text-sm">
            <span className="font-medium">Ghi chú dưới tiêu đề Bảng giá</span>
            <span className="block text-xs text-zinc-500">
              Giá và quyền lợi từng gói sửa ở{" "}
              <Link href="/admin/studio-pricing" className="underline">
                Gói chụp
              </Link>
              .
            </span>
            <textarea name="pricingNote" defaultValue={s.pricingNote} maxLength={300} rows={2} className="input mt-1" />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Trang Ghép album: giá & mô tả dịch vụ</span>
            <span className="block text-xs text-zinc-500">Hiện ở đầu trang /ghep-album, vd “Ghép album cưới 400.000đ · nhận file in 300 DPI”.</span>
            <textarea name="albumNote" defaultValue={s.albumNote} maxLength={600} rows={2} className="input mt-1" />
          </label>
          <Text name="footerText" label="Câu giới thiệu ở chân trang" value={s.footerText} max={200} hint="Hiện dưới logo ở cuối mọi trang." />
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Google & chia sẻ (SEO)</legend>
          <p className="text-xs text-zinc-500">Tiêu đề và mô tả của trang chủ khi hiện trên Google hoặc khi gửi link qua Facebook, Zalo. Để trống: dùng mặc định. Ảnh chia sẻ là ảnh nền phần mở đầu.</p>
          <Text name="seoTitle" label="Tiêu đề (tối đa 70 ký tự)" value={s.seoTitle} max={70} placeholder="TCWedding — Chụp ảnh cưới, thiệp mời online & album cưới" />
          <label className="block text-sm">
            <span className="font-medium">Mô tả (tối đa 200 ký tự)</span>
            <textarea name="seoDescription" defaultValue={s.seoDescription} maxLength={200} rows={2} className="input mt-1" />
          </label>
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
