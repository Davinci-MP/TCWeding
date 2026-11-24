import Link from "next/link";
import { LedStudio } from "@/components/tools/LedStudio";

export const metadata = {
  title: "Màn hình LED đám cưới miễn phí",
  description: "Nhập tên cô dâu chú rể và ngày cưới, tải về video chiếu màn hình LED, TV hoặc máy chiếu ở tiệc cưới. Miễn phí, không cần đăng ký.",
};

export default function LedPage() {
  return (
    <>
      <section className="bg-[#1d1a17] px-4 pb-14 pt-14 text-white lg:pt-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-[#d8cdbf]">Công cụ miễn phí</p>
          <h1 className="font-serif-display mt-5 max-w-3xl text-5xl leading-[1] sm:text-6xl">
            Màn hình LED <em className="text-[#d8cdbf]">cho ngày cưới</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
            Nhập tên hai bạn và ngày cưới, chọn kiểu nền rồi tải video về. Gửi file cho nhà hàng để chiếu trên màn LED, TV hoặc máy chiếu ở sảnh tiệc.
          </p>
        </div>
      </section>
      <section className="bg-[#f6f2ec] px-4 py-12 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <LedStudio />
        </div>
      </section>
      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
          {[
            ["Gửi file cho nhà hàng", "Video là file MP4 (hoặc WebM trên một số trình duyệt), chép vào USB hoặc gửi qua Zalo cho bộ phận kỹ thuật của nhà hàng."],
            ["Chọn đúng khổ màn hình", "Hỏi nhà hàng kích thước màn LED. Màn ngang thông thường dùng 16:9, màn dài sau sân khấu dùng 3:1."],
            ["Đã có thiệp mời online?", "Dùng cùng tên và ngày cưới trên thiệp để khách nhận ra ngay khi bước vào sảnh."],
          ].map(([title, body]) => (
            <div key={title}>
              <h2 className="font-serif-display text-2xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 flex max-w-6xl flex-wrap gap-3">
          <Link href="/slideshow" className="btn btn-outline min-h-11">
            Làm slideshow ảnh cưới
          </Link>
          <Link href="/templates" className="btn btn-primary min-h-11">
            Xem mẫu thiệp mời online
          </Link>
        </div>
      </section>
    </>
  );
}
