import Link from "next/link";
import { CardFan } from "@/components/home/CardFan";
import { DemoPhone } from "@/components/home/DemoPhone";
import { TemplateRail } from "@/components/home/TemplateRail";
import { DEMO_PHOTOS, SECTION_LABELS, unsplash } from "@/lib/invitation";
import { getPlans } from "@/lib/settings";
import { listTemplates } from "@/lib/templates";
import { Icon, type IconName } from "@/templates/icons";
import { LAYOUT_NAMES } from "@/templates/registry";


const FEATURES: [IconName, string, string][] = [
  ["mail", "Khách xác nhận tham dự", "Biết trước ai đến, đi mấy người, khách nhà trai hay nhà gái — xuất ra Excel chỉ với một lần bấm."],
  ["users", "Mời đích danh từng người", "Mỗi khách một đường link riêng, thiệp mở ra với dòng “Thân gửi: Anh Nam & Gia đình”."],
  ["gift", "Mừng cưới bằng mã QR", "Mã VietQR tạo tự động từ số tài khoản. Khách quét bằng app ngân hàng là xong."],
  ["pin", "Chỉ đường & thêm vào lịch", "Bản đồ Google cho từng địa điểm và nút lưu ngày cưới vào lịch điện thoại."],
  ["book", "Sổ lưu bút trực tuyến", "Lời chúc của khách hiện ngay trên thiệp. Bạn có thể ẩn những lời chúc không phù hợp."],
  ["music", "Nhạc nền & video", "Bài hát của hai bạn vang lên khi khách mở thiệp, kèm video pre-wedding từ YouTube."],
];

const STEPS: [string, string][] = [
  ["Chọn mẫu", "Xem thử từng mẫu với dữ liệu thật trước khi quyết định. Đổi mẫu bất cứ lúc nào, nội dung vẫn giữ nguyên."],
  ["Điền thông tin", "Tên, ngày giờ, địa điểm, ảnh cưới, câu chuyện tình yêu — bản xem trước cập nhật ngay khi bạn gõ."],
  ["Gửi cho khách", "Xuất bản và sao chép đường link. Gửi qua Zalo, Messenger hoặc tạo link riêng cho từng khách."],
];

const FAQS: [string, string][] = [
  ["Khách có cần cài ứng dụng không?", "Không. Thiệp là một trang web, khách chỉ cần bấm vào đường link trên điện thoại hoặc máy tính."],
  ["Tôi có thể sửa thiệp sau khi đã gửi không?", "Có. Mọi thay đổi được cập nhật ngay trên cùng một đường link, khách không cần nhận link mới."],
  ["Thiệp tồn tại trong bao lâu?", "Thiệp luôn truy cập được sau ngày cưới để hai bạn và khách mời xem lại ảnh, lời chúc làm kỷ niệm."],
  ["Tiền mừng cưới có đi qua hệ thống không?", "Không. Khách chuyển khoản trực tiếp vào tài khoản của hai bạn qua mã QR, chúng tôi không giữ tiền."],
];

export default async function Home() {
  const [templates, plans] = await Promise.all([listTemplates(), getPlans()]);
  const fan = templates.slice(0, 6).map((t) => ({ id: t.id, name: t.name }));
  const rail = templates.map((t) => ({ id: t.id, name: t.name, category: t.category, isPremium: t.isPremium, layoutName: LAYOUT_NAMES[t.layout] }));

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-[#1d1a17] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: "radial-gradient(60% 50% at 80% 40%, rgba(123,45,38,.35), transparent 70%), radial-gradient(40% 40% at 10% 90%, rgba(216,205,191,.18), transparent 70%)" }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
          <div>
            <p className="tpl-rise text-[11px] font-semibold uppercase tracking-[0.45em] text-[#d8cdbf]">TCWedding · Thiệp mời online</p>
            <h1 className="font-serif-display tpl-rise mt-6 text-[3.1rem] leading-[0.95] sm:text-7xl lg:text-[4.7rem]" style={{ animationDelay: "120ms" }}>
              <span className="whitespace-nowrap">Đẹp như thiệp in,</span>
              <br />
              <em className="text-[#d8cdbf]">gửi bằng một đường link.</em>
            </h1>
            <p className="tpl-rise mt-7 max-w-md text-lg leading-relaxed text-white/70" style={{ animationDelay: "260ms" }}>
              Chọn một trong {templates.length} mẫu thiết kế, điền thông tin và gửi cho khách qua Zalo, Messenger. Khách mở thiệp, xác nhận tham dự và gửi lời chúc ngay trên điện thoại.
            </p>
            <div className="tpl-rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "400ms" }}>
              <Link href="/register" className="rounded-full bg-[#d8cdbf] px-7 py-3.5 font-semibold text-[#1d1a17] transition hover:bg-[#ede6dc]">
                Tạo thiệp miễn phí
              </Link>
              <Link href="/templates" className="rounded-full border border-white/25 px-7 py-3.5 font-semibold text-white transition hover:border-white/60">
                Xem các mẫu thiệp
              </Link>
            </div>
            <ul className="tpl-rise mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/55" style={{ animationDelay: "520ms" }}>
              {["Thiệp đầu tiên miễn phí", "Không cần cài ứng dụng", "Mừng cưới qua mã QR"].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <Icon name="check" size={16} className="text-[#d8cdbf]" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <CardFan templates={fan} />
        </div>
      </section>

      {/* Dải tên mẫu */}
      <div className="overflow-hidden border-y border-white/10 bg-[#221e1b] py-5 text-[#d8cdbf]">
        <div className="tpl-marquee flex w-max" style={{ ["--marquee-duration" as string]: "60s" }}>
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0" aria-hidden={k === 1}>
              {templates.map((t) => (
                <span key={t.id} className="font-serif-display flex items-center gap-8 pr-8 text-2xl italic whitespace-nowrap">
                  {t.name}
                  <span className="text-sm not-italic text-white/30">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ============ TRẢI NGHIỆM MỞ THIỆP ============ */}
      <section className="bg-[#f6f2ec] px-4 py-24 lg:py-32">
        <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
          <DemoPhone src="/templates/classic-ivory" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">Thử ngay trên điện thoại này</p>
            <h2 className="font-serif-display mt-5 text-5xl leading-[1.02] text-[#1d1a17] lg:text-6xl">
              Khoảnh khắc khách <em>mở thiệp</em> là lúc cảm xúc bắt đầu.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-zinc-600">
              Thiệp gấp đôi với con dấu chữ lồng tên hai bạn. Chạm vào con dấu, hai cánh thiệp mở ra, nhạc nền vang lên và câu chuyện của hai bạn hiện dần theo từng lần cuộn.
            </p>
            <dl className="mt-10 grid gap-6 sm:grid-cols-2">
              {[
                [`${templates.length} mẫu`, `thiết kế, ${Object.keys(LAYOUT_NAMES).length} phong cách bố cục khác nhau`],
                [`${Object.keys(SECTION_LABELS).length} mục`, "nội dung — bật tắt tuỳ ý cho từng thiệp"],
              ].map(([a, b]) => (
                <div key={a} className="border-t border-zinc-300 pt-4">
                  <dt className="font-serif-display text-4xl italic text-[#1d1a17]">{a}</dt>
                  <dd className="mt-1 text-sm text-zinc-500">{b}</dd>
                </div>
              ))}
            </dl>
            <Link href="/templates/classic-ivory" className="mt-10 inline-flex items-center gap-2 font-semibold text-[#7b2d26] underline-offset-4 hover:underline">
              Mở thiệp mẫu toàn màn hình <Icon name="right" size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ TÍNH NĂNG ============ */}
      <section className="bg-white px-4 py-24 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-end">
            <h2 className="font-serif-display text-5xl leading-[1.02] text-[#1d1a17] lg:text-6xl">
              Mọi thứ khách mời cần, <em>trong một đường link.</em>
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-zinc-600 lg:justify-self-end">
              Không chỉ đẹp — thiệp giúp hai bạn tổ chức đám cưới nhẹ nhàng hơn, từ danh sách khách đến tiền mừng.
            </p>
          </div>
          <div className="mt-16 grid border-t border-zinc-200 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([icon, title, desc]) => (
              <div key={title} className="border-b border-zinc-200 py-9 pr-8 sm:[&:nth-child(odd)]:border-r lg:border-r lg:pl-8 lg:[&:nth-child(3n+1)]:pl-0 lg:[&:nth-child(3n)]:border-r-0 sm:pl-8 sm:[&:nth-child(odd)]:pl-0">
                <Icon name={icon} size={26} className="text-[#7b2d26]" />
                <h3 className="mt-5 text-lg font-semibold text-[#1d1a17]">{title}</h3>
                <p className="mt-2 leading-relaxed text-zinc-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ MẪU THIỆP ============ */}
      <section className="bg-[#f6f2ec] py-24 lg:py-32">
        <div className="mx-auto mb-12 flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">Bộ sưu tập</p>
            <h2 className="font-serif-display mt-4 text-5xl leading-[1.02] text-[#1d1a17] lg:text-6xl">
              {templates.length} mẫu thiệp, <em>không mẫu nào giống mẫu nào.</em>
            </h2>
          </div>
          <Link href="/templates" className="inline-flex items-center gap-2 font-semibold text-[#1d1a17] underline-offset-4 hover:underline">
            Xem tất cả mẫu <Icon name="right" size={18} />
          </Link>
        </div>
        <TemplateRail templates={rail} />
      </section>

      {/* ============ 3 BƯỚC ============ */}
      <section className="bg-white px-4 py-24 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif-display max-w-2xl text-5xl leading-[1.02] text-[#1d1a17] lg:text-6xl">
            Ba bước, <em>khoảng mười lăm phút.</em>
          </h2>
          <ol className="mt-16 grid gap-10 lg:grid-cols-3">
            {STEPS.map(([title, desc], i) => (
              <li key={title}>
                <span className="font-serif-display block text-7xl italic leading-none text-[#d8cdbf]">{i + 1}</span>
                <h3 className="mt-4 border-t border-zinc-200 pt-4 text-xl font-semibold text-[#1d1a17]">{title}</h3>
                <p className="mt-2 leading-relaxed text-zinc-600">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ BẢNG GIÁ ============ */}
      <section id="bang-gia" className="scroll-mt-16 bg-[#1d1a17] px-4 py-24 text-white lg:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#d8cdbf]">Bảng giá</p>
            <h2 className="font-serif-display mt-4 text-5xl leading-[1.02] lg:text-6xl">
              Trả một lần, <em className="text-[#d8cdbf]">dùng trọn đám cưới.</em>
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`flex flex-col rounded-[28px] p-8 lg:p-10 ${p.highlight ? "bg-[#f6f2ec] text-[#1d1a17] shadow-[0_40px_80px_-40px_rgba(216,205,191,.6)]" : "border border-white/15"}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-serif-display text-3xl italic">{p.name}</h3>
                  {p.highlight && p.badge && <span className="rounded-full bg-[#7b2d26] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">{p.badge}</span>}
                </div>
                <p className={`mt-2 text-sm ${p.highlight ? "text-zinc-600" : "text-white/60"}`}>{p.tagline}</p>
                <p className="mt-8 flex items-baseline gap-2">
                  <span className="font-serif-display text-6xl">{p.price}</span>
                  <span className={p.highlight ? "text-zinc-500" : "text-white/50"}>{p.unit}</span>
                </p>
                <ul className="mt-8 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Icon name="check" size={18} className={`mt-0.5 shrink-0 ${p.highlight ? "text-[#7b2d26]" : "text-[#d8cdbf]"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-10 rounded-full py-3.5 text-center font-semibold transition ${p.highlight ? "bg-[#1d1a17] text-white hover:bg-[#2b2622]" : "border border-white/30 hover:border-white/70"}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HỎI ĐÁP ============ */}
      <section className="bg-[#f6f2ec] px-4 py-24 lg:py-32">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.6fr]">
          <h2 className="font-serif-display text-5xl leading-[1.02] text-[#1d1a17] lg:text-6xl">
            Câu hỏi <em>thường gặp</em>
          </h2>
          <div className="divide-y divide-zinc-300 border-y border-zinc-300">
            {FAQS.map(([q, a]) => (
              <details key={q} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold text-[#1d1a17] [&::-webkit-details-marker]:hidden">
                  {q}
                  <Icon name="plus" className="shrink-0 text-[#7b2d26] transition duration-300 group-open:rotate-45" />
                </summary>
                <p className="mt-3 max-w-xl leading-relaxed text-zinc-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ KÊU GỌI CUỐI ============ */}
      <section className="relative overflow-hidden px-4 py-32 text-center text-white lg:py-44">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={unsplash(DEMO_PHOTOS.coupleWalk, 1800)} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-[#1d1a17]/65" aria-hidden />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-serif-display text-5xl leading-[1.02] lg:text-7xl">
            Ngày vui của hai bạn <em className="text-[#d8cdbf]">xứng đáng được mời thật đẹp.</em>
          </h2>
          <Link href="/register" className="mt-10 inline-block rounded-full bg-[#d8cdbf] px-8 py-4 font-semibold text-[#1d1a17] transition hover:bg-[#ede6dc]">
            Tạo thiệp miễn phí
          </Link>
        </div>
      </section>
    </>
  );
}
