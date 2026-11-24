import { savePlansAction } from "@/app/actions/admin";
import { getPlans } from "@/lib/settings";

export const metadata = { title: "Bảng giá" };

export default async function AdminPricing({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [plans, { saved }] = await Promise.all([getPlans(), searchParams]);
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Bảng giá</h1>
      <p className="mt-1 text-sm text-zinc-500">Nội dung các gói hiển thị ở mục Bảng giá trên trang chủ. Lưu xong, trang chủ cập nhật ngay.</p>
      {saved && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Đã lưu bảng giá.
        </p>
      )}
      <form action={savePlansAction} className="mt-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((p) => (
            <fieldset key={p.id} className="card space-y-4 p-5">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Gói {p.id === "FREE" ? "miễn phí" : "trả phí"} ({p.id})
              </legend>
              <label className="block text-sm">
                <span className="font-medium">Tên gói</span>
                <input name={`${p.id}.name`} defaultValue={p.name} className="input mt-1" required maxLength={40} />
              </label>
              <div className="grid grid-cols-[1fr_1fr] gap-3">
                <label className="block text-sm">
                  <span className="font-medium">Giá</span>
                  <input name={`${p.id}.price`} defaultValue={p.price} className="input mt-1" placeholder="299.000đ" required maxLength={30} />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Đơn vị</span>
                  <input name={`${p.id}.unit`} defaultValue={p.unit} className="input mt-1" placeholder="/ đám cưới" maxLength={40} />
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
              <label className="block text-sm">
                <span className="font-medium">Chữ trên nút</span>
                <input name={`${p.id}.cta`} defaultValue={p.cta} className="input mt-1" maxLength={40} />
              </label>
              <div className="grid grid-cols-[auto_1fr] items-end gap-3">
                <label className="flex h-10 items-center gap-2 text-sm">
                  <input type="checkbox" name={`${p.id}.highlight`} defaultChecked={p.highlight} /> Làm nổi bật
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Nhãn nổi bật</span>
                  <input name={`${p.id}.badge`} defaultValue={p.badge ?? ""} className="input mt-1" placeholder="Đầy đủ nhất" maxLength={30} />
                </label>
              </div>
            </fieldset>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          Bảng giá chỉ là nội dung hiển thị. Quyền dùng mẫu Premium của từng người vẫn do bạn bật trong mục Người dùng.
        </p>
        <button className="btn btn-primary">Lưu bảng giá</button>
      </form>
    </div>
  );
}
