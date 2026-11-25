import Link from "next/link";
import { savePackagesAction } from "@/app/actions/studio";
import { getPackages } from "@/lib/studio";

export const metadata = { title: "Gói chụp" };

export default async function AdminStudioPricing({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [packages, { saved }] = await Promise.all([getPackages(), searchParams]);
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Gói chụp</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Bảng giá gói chụp ảnh cưới ở mục{" "}
        <Link href="/#bang-gia" target="_blank" className="underline">
          Bảng giá trên trang chủ
        </Link>
        . Tên gói cũng là lựa chọn trong form đặt lịch tư vấn. Để trống tên gói để ẩn gói đó.
      </p>
      {saved && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Đã lưu bảng giá gói chụp.
        </p>
      )}
      <form action={savePackagesAction} className="mt-6 space-y-6">
        <div className="grid gap-6 xl:grid-cols-3">
          {packages.map((p, i) => (
            <fieldset key={p.id} className="card space-y-4 p-5">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Gói {i + 1}</legend>
              <label className="block text-sm">
                <span className="font-medium">Tên gói</span>
                <input name={`${p.id}.name`} defaultValue={p.name} className="input mt-1" maxLength={40} placeholder="Gói Studio" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="font-medium">Giá</span>
                  <input name={`${p.id}.price`} defaultValue={p.price} className="input mt-1" placeholder="5.900.000đ" maxLength={30} />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Đơn vị</span>
                  <input name={`${p.id}.unit`} defaultValue={p.unit} className="input mt-1" placeholder="/ bộ ảnh" maxLength={40} />
                </label>
              </div>
              <label className="block text-sm">
                <span className="font-medium">Mô tả ngắn</span>
                <input name={`${p.id}.tagline`} defaultValue={p.tagline} className="input mt-1" maxLength={200} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Quyền lợi</span>
                <span className="block text-xs text-zinc-500">Mỗi dòng một quyền lợi, tối đa 12 dòng.</span>
                <textarea name={`${p.id}.features`} defaultValue={p.features.join("\n")} rows={6} className="input mt-1" />
              </label>
              <div className="grid grid-cols-[auto_1fr] items-end gap-3">
                <label className="flex h-10 items-center gap-2 text-sm">
                  <input type="checkbox" name={`${p.id}.highlight`} defaultChecked={p.highlight} /> Làm nổi bật
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Nhãn nổi bật</span>
                  <input name={`${p.id}.badge`} defaultValue={p.badge} className="input mt-1" placeholder="Được chọn nhiều" maxLength={30} />
                </label>
              </div>
            </fieldset>
          ))}
        </div>
        <p className="text-xs text-zinc-500">Giá ban đầu chỉ là nội dung mẫu (“Liên hệ”). Hãy điền giá và quyền lợi thật trước khi mở website.</p>
        <button className="btn btn-primary">Lưu bảng giá</button>
      </form>
    </div>
  );
}
