import Link from "next/link";
import { SlideshowStudio } from "@/components/tools/SlideshowStudio";
import { getMusicLibrary } from "@/lib/settings";

export const metadata = {
  title: "Làm slideshow ảnh cưới miễn phí",
  description: "Ghép ảnh cưới thành video Full HD có nhạc nền để chiếu ở tiệc cưới. Làm ngay trên trình duyệt, ảnh không tải lên mạng.",
};

export default async function SlideshowPage() {
  const library = (await getMusicLibrary()).map(({ id, name, url }) => ({ id, name, url }));
  return (
    <>
      <section className="bg-[#1d1a17] px-4 pb-14 pt-14 text-white lg:pt-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-[#d8cdbf]">Công cụ miễn phí</p>
          <h1 className="font-serif-display mt-5 max-w-3xl text-5xl leading-[1] sm:text-6xl">
            Slideshow ảnh cưới <em className="text-[#d8cdbf]">chiếu ở tiệc</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
            Chọn ảnh, sắp xếp thứ tự, thêm nhạc nền rồi tải về video Full HD. Mở đầu bằng tên hai bạn, khép lại bằng lời cảm ơn khách mời.
          </p>
        </div>
      </section>
      <section className="bg-[#f6f2ec] px-4 py-12 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <SlideshowStudio library={library} />
        </div>
      </section>
      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
          {[
            ["Ảnh ngang, ảnh dọc đều đẹp", "Ảnh ngang phủ kín màn hình và trôi nhẹ. Ảnh dọc đặt giữa, nền phía sau làm mờ từ chính bức ảnh."],
            ["Riêng tư tuyệt đối", "Ảnh được xử lý ngay trong trình duyệt của bạn. TCWedding không nhận, không lưu bất kỳ bức ảnh nào."],
            ["Mẹo khi chiếu", "Dùng Chrome hoặc Edge trên máy tính để tạo video. Chép file vào USB và thử trên máy chiếu của nhà hàng trước ngày cưới."],
          ].map(([title, body]) => (
            <div key={title}>
              <h2 className="font-serif-display text-2xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 flex max-w-6xl flex-wrap gap-3">
          <Link href="/man-hinh-led" className="btn btn-outline min-h-11">
            Tạo màn hình LED
          </Link>
          <Link href="/templates" className="btn btn-primary min-h-11">
            Xem mẫu thiệp mời online
          </Link>
        </div>
      </section>
    </>
  );
}
