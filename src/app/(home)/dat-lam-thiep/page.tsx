import Link from "next/link";
import { OrderForm } from "@/components/order/OrderForm";
import { money, settingsError } from "@/lib/orders";
import { getOrderSettings } from "@/lib/settings";
import { listTemplates } from "@/lib/templates";

export const metadata = {
  title: "Đặt TCWedding làm thiệp",
  description: "Gửi thông tin và ảnh, TCWedding dựng thiệp mời online hoàn chỉnh cho bạn duyệt.",
};

const STEPS = [
  ["Gửi đơn", "Chọn mẫu, điền thông tin. Bạn nhận ngay một trang riêng để theo dõi đơn."],
  ["Thanh toán và gửi ảnh", "Quét mã QR và gửi ảnh ngay trên trang đơn hàng."],
  ["Duyệt thiệp", "Xem bản nháp, nhắn chỗ cần sửa hoặc bấm duyệt."],
  ["Nhận thiệp", "Hoàn tất thanh toán, nhận link thiệp để gửi khách."],
];

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ mau?: string }> }) {
  const [s, templates, { mau }] = await Promise.all([getOrderSettings(), listTemplates(), searchParams]);
  const open = s.enabled && !settingsError(s);
  return (
    <>
      <section className="bg-[#1d1a17] px-4 pb-14 pt-14 text-white lg:pt-20">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-serif-display max-w-3xl text-5xl leading-[1] sm:text-6xl">
            Bận rộn? <em className="text-[#d8cdbf]">Để chúng tôi làm thiệp.</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">Bạn gửi thông tin và ảnh, TCWedding dựng thiệp mời online rồi gửi lại cho bạn duyệt.</p>
          {open && (
            <p className="mt-8 text-white/70">
              <span className="font-serif-display text-5xl text-white">{money(s.price)}</span>
              {s.deposit > 0 && <span className="ml-3">cọc trước {money(s.deposit)}</span>}
            </p>
          )}
        </div>
      </section>
      <section className="bg-[#f6f2ec] px-4 py-12 lg:py-16">
        {open ? (
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <ol className="space-y-6">
                {STEPS.map(([t, d], i) => (
                  <li key={t} className="flex gap-4">
                    <span className="font-serif-display text-3xl text-brand">{i + 1}</span>
                    <div>
                      <h2 className="font-semibold">{t}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {s.intro && <p className="mt-8 whitespace-pre-wrap border-t border-zinc-300 pt-6 text-sm leading-relaxed text-zinc-600">{s.intro}</p>}
            </div>
            <OrderForm templates={templates.map(({ id, name }) => ({ id, name }))} initialTemplate={templates.find((t) => t.id === mau)?.id ?? ""} />
          </div>
        ) : (
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-serif-display text-3xl">Hiện chưa nhận đơn làm thiệp</h2>
            <p className="mt-3 text-zinc-600">Bạn vẫn có thể tự tạo thiệp miễn phí, chỉ cần chọn mẫu và điền thông tin.</p>
            <Link href="/templates" className="btn btn-primary mt-6 min-h-11">
              Xem mẫu thiệp
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
