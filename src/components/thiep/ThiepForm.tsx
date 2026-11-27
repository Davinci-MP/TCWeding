"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { DEMO_COUPLE } from "@/lib/invitation";
import { useRouter } from "next/navigation";
import { submitThiepAction } from "@/app/actions/thiep";
import { TemplateThumb } from "@/components/TemplateThumb";
import { lunarText } from "@/lib/lunar";
import { MAX_THIEP_PHOTOS, SLIDE_STYLES, emptyEvent, sampleDraft, templateCode, templateHash, type DraftGift, type ThiepDraft } from "@/lib/thiep";
import { TRACKS } from "@/templates/music/tracks";
import { HeartIcon, type TplLite } from "./TemplateCard";
import { useTemplateFavorites } from "./templateFavorites";
import { clearDraft, loadDraft, saveDraft } from "./draftStore";
import { uploadThiepPhoto } from "./upload";

export type ThiepFormProps = {
  templates: TplLite[];
  initialTemplate?: string;
  library: { id: string; name: string }[];
  price: { price: number; deposit: number; intro: string };
  studioName: string;
};

const money = (n: number) => `${n.toLocaleString("vi-VN")}đ`;
// min-w-0 + appearance-none: ô date / time native (iOS, Android) không rộng hơn cột chứa nó
const field = "mt-1.5 block w-full min-w-0 appearance-none rounded-xl border border-[#1d1a17]/15 bg-white px-4 py-3 text-base text-[#1d1a17] outline-none transition focus:border-[#7b2d26] focus:ring-4 focus:ring-[#7b2d26]/10";
const label = "block min-w-0 text-sm font-medium text-[#1d1a17]";

function Step({ n, title, hint, children, optional }: { n: number; title: string; hint?: React.ReactNode; children: React.ReactNode; optional?: boolean }) {
  return (
    <section id={`buoc-${n}`} className="scroll-mt-20 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
      <h2 className="flex items-center gap-3 text-xl font-semibold text-[#1d1a17]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7b2d26] text-sm text-white">{n}</span>
        {title}
        {optional && <span className="text-sm font-normal text-zinc-500">(không bắt buộc)</span>}
      </h2>
      {hint && <p className="mt-2 text-sm text-zinc-600">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Input({ label: l, value, onChange, className = "", ...rest }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className={label}>
      {l}
      <input {...rest} value={value} onChange={(e) => onChange(e.target.value)} className={`${field} ${className}`} />
    </label>
  );
}

export function ThiepForm({ templates, initialTemplate = "", library, price, studioName }: ThiepFormProps) {
  const router = useRouter();
  const [d, setD] = useState<ThiepDraft | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [showAll, setShowAll] = useState(false);
  const [onlyFav, setOnlyFav] = useState(false);
  const favs = useTemplateFavorites();

  // Đọc nháp trên máy; mẫu trên URL (#chon-tc-02) được ưu tiên
  useEffect(() => {
    const draft = loadDraft();
    if (initialTemplate) draft.templateId = initialTemplate;
    setD(draft);
    if (sessionStorage.getItem("tcw-thiep-jump") === "gui") {
      sessionStorage.removeItem("tcw-thiep-jump");
      setTimeout(() => document.getElementById("buoc-9")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, [initialTemplate]);

  // Tự lưu nháp
  useEffect(() => {
    if (!d) return;
    const t = setTimeout(() => setSaved(saveDraft(d)), 400);
    setSaved(false);
    return () => clearTimeout(t);
  }, [d]);

  const visible = useMemo(() => {
    let list = onlyFav ? templates.filter((t) => favs.includes(t.id)) : templates;
    if (!showAll) {
      const first = list.slice(0, 8);
      const sel = list.find((t) => t.id === d?.templateId);
      if (sel && !first.includes(sel)) first.unshift(sel);
      list = first;
    }
    return list;
  }, [templates, favs, onlyFav, showAll, d?.templateId]);

  if (!d) return <div className="min-h-[70svh] bg-[#f6f2ec]" />;
  const set = (patch: Partial<ThiepDraft>) => setD((x) => (x ? { ...x, ...patch } : x));
  const person = (who: "groom" | "bride", k: keyof ThiepDraft["groom"], v: string) => setD((x) => (x ? { ...x, [who]: { ...x[who], [k]: v } } : x));
  const event = (i: number, patch: Partial<ThiepDraft["events"][number]>) =>
    setD((x) => {
      if (!x) return x;
      const events = x.events.map((e, j) => {
        if (j !== i) return e;
        const next = { ...e, ...patch };
        // Ngày âm tự tính theo ngày dương nếu khách chưa tự sửa
        if (patch.date !== undefined && (!e.lunar || e.lunar === lunarText(e.date))) next.lunar = lunarText(patch.date);
        return next;
      });
      return { ...x, events };
    });
  const gift = (who: "groom" | "bride", patch: Partial<DraftGift>) => setD((x) => (x ? { ...x, gifts: { ...x.gifts, [who]: { ...x.gifts[who], ...patch } } } : x));
  const selected = templates.find((t) => t.id === d.templateId);

  function submit() {
    setError("");
    start(async () => {
      const r = await submitThiepAction(JSON.stringify(d));
      if (r.error) {
        setError(r.error);
        const step = /bước (\d)/.exec(r.error)?.[1];
        if (step) document.getElementById(`buoc-${step}`)?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      clearDraft();
      router.push(`/don/${r.token}`);
    });
  }

  return (
    <div className="bg-[#f6f2ec] pb-32">
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#7b2d26]">{studioName} · Thiệp cưới online</p>
        <h1 className="font-serif-display mt-3 text-4xl leading-tight text-[#1d1a17] sm:text-5xl">Thông tin làm thiệp cưới & video</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (d.groom.name && !confirm("Thay thông tin đang điền bằng thông tin mẫu?")) return;
              setD({ ...sampleDraft(d.templateId), photos: d.photos, phone: d.phone, contactName: d.contactName });
            }}
            className="min-h-11 rounded-full border border-[#1d1a17]/15 bg-white px-4 text-sm font-medium hover:border-[#1d1a17]/40"
          >
            ✎ Điền thử thông tin mẫu
          </button>
          <a href="#xem" className="inline-flex min-h-11 items-center rounded-full border border-[#1d1a17]/15 bg-white px-4 text-sm font-medium hover:border-[#1d1a17]/40">
            👁 Xem thiệp của bạn
          </a>
          <a href="#" className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-zinc-600 hover:text-zinc-900">
            ← Tất cả mẫu thiệp
          </a>
        </div>
        <p className="mt-5 text-zinc-600">
          Chọn mẫu thiệp bạn thích và điền thông tin bên dưới. Không cần tạo tài khoản, không cần trả tiền trước. Thông tin được lưu tạm trên máy bạn, điền dở có thể quay lại sau. Xong thì bấm <strong>Gửi cho studio</strong>.
        </p>
        {price.price > 0 && (
          <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-zinc-700">
            Phí làm thiệp: <strong>{money(price.price)}</strong>
            {price.deposit > 0 ? ` · đặt cọc ${money(price.deposit)} sau khi studio xác nhận` : ""}. Bạn chỉ thanh toán sau khi gửi thông tin và trao đổi với studio.
          </p>
        )}
        {price.intro && <p className="mt-3 whitespace-pre-line rounded-2xl bg-white px-4 py-3 text-sm text-zinc-700">{price.intro}</p>}
      </div>

      <div className="mx-auto mt-8 max-w-3xl space-y-5 px-4">
        <Step n={1} title="Chọn mẫu thiệp" hint={`${templates.length} mẫu. Bấm “Xem thử” để mở mẫu chạy thật ở tab mới, rồi bấm “Chọn mẫu này”.`}>
          {selected && (
            <div className="mb-5 flex items-center gap-4 rounded-2xl bg-[#f6f2ec] p-3">
              <div className="w-24 shrink-0 overflow-hidden rounded-xl bg-white">
                <TemplateThumb templateId={selected.id} height={150} />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Đã chọn</p>
                <p className="font-semibold">
                  {templateCode(selected.id)} · {selected.name}
                </p>
                <p className="text-sm text-zinc-600">{selected.category}</p>
              </div>
            </div>
          )}
          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setOnlyFav(false)} aria-pressed={!onlyFav} className={`min-h-10 rounded-full px-4 text-sm ${!onlyFav ? "bg-[#1d1a17] text-white" : "border border-zinc-300"}`}>
              Tất cả
            </button>
            <button type="button" onClick={() => setOnlyFav(true)} aria-pressed={onlyFav} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm ${onlyFav ? "bg-[#1d1a17] text-white" : "border border-zinc-300"}`}>
              <HeartIcon on size={14} /> Mẫu đã thích ({favs.length})
            </button>
          </div>
          {visible.length === 0 ? (
            <p className="text-sm text-zinc-500">Bạn chưa thả tim mẫu nào.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {visible.map((t) => {
                const on = t.id === d.templateId;
                return (
                  <li key={t.id} className={`overflow-hidden rounded-2xl border-2 bg-white ${on ? "border-[#7b2d26]" : "border-transparent"}`}>
                    <TemplateThumb templateId={t.id} height={220} />
                    <div className="p-2.5">
                      <p className="flex items-center gap-1 text-sm font-semibold">
                        {templateCode(t.id)}
                        {favs.includes(t.id) && (
                          <span className="text-[#c0392b]">
                            <HeartIcon on size={12} />
                          </span>
                        )}
                      </p>
                      <p className="line-clamp-1 text-xs text-zinc-500">{t.name}</p>
                      <div className="mt-2 flex flex-col gap-1.5">
                        <a href={`/thiep#${templateHash(t.id)}`} target="_blank" rel="noopener" className="text-center text-xs font-medium text-[#7b2d26] underline-offset-2 hover:underline">
                          Xem thử ↗
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            set({ templateId: t.id });
                            history.replaceState(null, "", `#chon-${templateHash(t.id)}`);
                          }}
                          className={`min-h-9 rounded-full text-xs font-semibold ${on ? "bg-[#7b2d26] text-white" : "border border-zinc-300 hover:border-zinc-500"}`}
                        >
                          {on ? "✓ Đã chọn" : "Chọn mẫu này"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {!showAll && (onlyFav ? favs.length : templates.length) > 8 && (
            <button type="button" onClick={() => setShowAll(true)} className="mt-4 min-h-11 w-full rounded-full border border-zinc-300 text-sm font-medium hover:border-zinc-500">
              Xem tất cả {onlyFav ? favs.length : templates.length} mẫu
            </button>
          )}
        </Step>

        <Step n={2} title="Cô dâu & chú rể">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Tên chú rể" value={d.groom.name} onChange={(v) => person("groom", "name", v)} maxLength={60} placeholder={DEMO_COUPLE.groom} />
            <Input label="Thứ bậc chú rể" value={d.groom.rank} onChange={(v) => person("groom", "rank", v)} maxLength={40} placeholder="Trưởng nam" />
            <Input label="Tên cô dâu" value={d.bride.name} onChange={(v) => person("bride", "name", v)} maxLength={60} placeholder={DEMO_COUPLE.bride} />
            <Input label="Thứ bậc cô dâu" value={d.bride.rank} onChange={(v) => person("bride", "rank", v)} maxLength={40} placeholder="Út nữ" />
          </div>
        </Step>

        <Step n={3} title="Gia đình hai bên">
          <div className="grid gap-6 sm:grid-cols-2">
            {(["groom", "bride"] as const).map((who) => (
              <fieldset key={who} className="space-y-3">
                <legend className="mb-1 font-semibold">Gia đình nhà {who === "groom" ? "trai" : "gái"}</legend>
                <Input label="Họ tên bố" value={d[who].father} onChange={(v) => person(who, "father", v)} maxLength={80} placeholder="Ông …" />
                <Input label="Họ tên mẹ" value={d[who].mother} onChange={(v) => person(who, "mother", v)} maxLength={80} placeholder="Bà …" />
                <Input label={`Địa chỉ nhà ${who === "groom" ? "trai" : "gái"}`} value={d[who].address} onChange={(v) => person(who, "address", v)} maxLength={200} />
              </fieldset>
            ))}
          </div>
        </Step>

        <Step n={4} title="Lịch cưới" hint="Mỗi lễ một khung. Có thể thêm hoặc bỏ bớt. Ngày âm lịch tự tính theo ngày dương.">
          <div className="space-y-4">
            {d.events.map((e, i) => (
              <fieldset key={e.id} className="rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <legend className="font-semibold">{e.title || `Sự kiện ${i + 1}`}</legend>
                  <button type="button" onClick={() => set({ events: d.events.filter((_, j) => j !== i) })} className="min-h-10 px-2 text-sm text-red-700 hover:underline">
                    Bỏ
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input label="Tên sự kiện" value={e.title} onChange={(v) => event(i, { title: v })} maxLength={60} placeholder="Lễ Thành Hôn" />
                  {/* Ngày + giờ: hai cột khi đủ chỗ (mỗi ô ≥ 9.5rem), không đủ thì tự xuống hàng; mép phải thẳng các ô khác */}
                  <div className="grid min-w-0 gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,9.5rem),1fr))]">
                    <Input label="Ngày dương" type="date" value={e.date} onChange={(v) => event(i, { date: v })} className="tcw-native-dt" />
                    <Input label="Giờ" type="time" value={e.time} onChange={(v) => event(i, { time: v })} className="tcw-native-dt" />
                  </div>
                  <Input label="Ngày âm (tự tính, có thể sửa)" value={e.lunar} onChange={(v) => event(i, { lunar: v })} maxLength={80} />
                  <Input label="Tên địa điểm" value={e.venue} onChange={(v) => event(i, { venue: v })} maxLength={120} placeholder="Tư gia nhà trai" />
                  <Input label="Địa chỉ tổ chức" value={e.address} onChange={(v) => event(i, { address: v })} maxLength={200} />
                  <Input label="Link Google Maps (nếu có)" type="url" value={e.mapUrl} onChange={(v) => event(i, { mapUrl: v })} maxLength={500} placeholder="https://maps.app.goo.gl/…" />
                </div>
              </fieldset>
            ))}
            {d.events.length < 8 && (
              <button type="button" onClick={() => set({ events: [...d.events, emptyEvent()] })} className="min-h-11 rounded-full border border-dashed border-zinc-400 px-5 text-sm font-medium hover:border-zinc-700">
                + Thêm sự kiện
              </button>
            )}
          </div>
        </Step>

        <Step n={5} title="Hộp mừng cưới" optional hint="Điền tài khoản nhận mừng cưới; có thể tải ảnh mã QR ngân hàng để khách quét chuyển khoản.">
          <div className="grid gap-6 sm:grid-cols-2">
            {(["groom", "bride"] as const).map((who) => (
              <fieldset key={who} className="space-y-3">
                <legend className="mb-1 font-semibold">Nhà {who === "groom" ? "trai" : "gái"}</legend>
                <Input label="Chủ tài khoản" value={d.gifts[who].name} onChange={(v) => gift(who, { name: v })} maxLength={80} />
                <Input label="Ngân hàng" value={d.gifts[who].bank} onChange={(v) => gift(who, { bank: v })} maxLength={80} placeholder="Vietcombank" />
                <Input label="Số tài khoản" value={d.gifts[who].number} onChange={(v) => gift(who, { number: v.replace(/[^\dA-Za-z]/g, "") })} maxLength={30} inputMode="numeric" />
                <QrUpload value={d.gifts[who].qr} onChange={(qr) => gift(who, { qr })} />
              </fieldset>
            ))}
          </div>
        </Step>

        <Step n={6} title="Nhạc nền thiệp" hint="Nhạc phát khi khách mời mở thiệp. Muốn bài khác danh sách thì chọn “Bài khác” và ghi tên bài ở bước 9, hoặc dán link YouTube.">
          <label className={label}>
            Bài hát
            <select value={d.music} onChange={(e) => set({ music: e.target.value })} className={field}>
              <option value="">— Để studio chọn giúp —</option>
              {library.length > 0 && (
                <optgroup label="Thư viện nhạc">
                  {library.map((t) => (
                    <option key={t.id} value={`lib:${t.id}`}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Nhạc không lời có sẵn">
                {TRACKS.map((t) => (
                  <option key={t.id} value={`track:${t.id}`}>
                    {t.name} – {t.by}
                  </option>
                ))}
              </optgroup>
              <option value="other">Bài khác (ghi ở phần yêu cầu thêm)</option>
            </select>
          </label>
          <div className="mt-3">
            <Input label="Hoặc dán link YouTube bài hát (không bắt buộc)" type="url" value={d.musicYoutube} onChange={(v) => set({ musicYoutube: v })} maxLength={300} placeholder="https://youtube.com/…" />
          </div>
        </Step>

        <Step n={7} title="Video slideshow chiếu tiệc" optional hint="Video trình chiếu ảnh cưới trên màn hình tiệc hoặc đăng TikTok, Reels. Tên, ngày cưới và ảnh dùng chung với thiệp, chỉ cần chọn mẫu video.">
          <label className="flex min-h-11 items-center gap-3 font-medium">
            <input type="checkbox" checked={d.slideshow} onChange={(e) => set({ slideshow: e.target.checked })} className="h-5 w-5" />
            Mình muốn làm thêm video slideshow
          </label>
          {d.slideshow && (
            <div className="mt-3">
              <label className={label}>
                Mẫu video
                <select value={d.slideshowId} onChange={(e) => set({ slideshowId: e.target.value })} className={field}>
                  <option value="">— Để studio chọn giúp —</option>
                  {SLIDE_STYLES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} · {s.script.label} · {s.motion.label} · {s.palette.name}
                    </option>
                  ))}
                </select>
              </label>
              <a href="/#slideshow" target="_blank" rel="noopener" className="mt-2 inline-block text-sm font-medium text-[#7b2d26] hover:underline">
                Xem các mẫu video ↗
              </a>
            </div>
          )}
        </Step>

        <Step n={8} title="Ảnh cưới" hint={`Tải ảnh cưới muốn đưa vào thiệp (tối đa ${MAX_THIEP_PHOTOS} ảnh, nên chọn 10–20 ảnh đẹp nhất). Ảnh gửi thẳng cho studio, dùng chung cho thiệp và video.`}>
          <PhotoPicker photos={d.photos} onChange={(photos) => set({ photos })} />
          <label className={`${label} mt-4`}>
            Hoặc dán link ảnh (Google Drive, Google Photos, Facebook, Zalo…)
            <textarea value={d.photoLinks} onChange={(e) => set({ photoLinks: e.target.value })} rows={2} maxLength={1000} className={field} />
          </label>
          <p className="mt-1 text-xs text-zinc-500">Link Google Drive nhớ để chế độ “Bất kỳ ai có đường liên kết đều xem được”.</p>
        </Step>

        <Step n={9} title="Liên hệ & yêu cầu thêm">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Tên người liên hệ" value={d.contactName} onChange={(v) => set({ contactName: v })} maxLength={80} autoComplete="name" />
            <Input label="Số điện thoại / Zalo của bạn" type="tel" value={d.phone} onChange={(v) => set({ phone: v })} maxLength={20} inputMode="tel" autoComplete="tel" placeholder="09xx xxx xxx" required />
          </div>
          <label className={`${label} mt-4`}>
            Yêu cầu thêm
            <textarea value={d.note} onChange={(e) => set({ note: e.target.value })} rows={3} maxLength={2000} className={field} placeholder="Tên bài hát khác, màu sắc mong muốn, lời mời riêng…" />
          </label>
        </Step>

        {error && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-red-800">
            {error}
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1d1a17]/10 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="hidden text-sm text-zinc-500 sm:block" aria-live="polite">
            {saved ? "Đã lưu nháp trên máy" : "Đang lưu…"}
          </p>
          <div className="flex flex-1 justify-end gap-2 sm:flex-none">
            <a href="#xem" className="inline-flex min-h-12 items-center rounded-full border border-zinc-300 px-4 text-sm font-semibold hover:border-zinc-600">
              👁 Xem thiệp
            </a>
            <button type="button" disabled={pending} onClick={submit} className="min-h-12 rounded-full bg-[#7b2d26] px-6 font-semibold text-white transition hover:bg-[#5f221d] disabled:opacity-60">
              {pending ? "Đang gửi…" : "Gửi cho studio"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QrUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Ảnh mã QR" className="h-16 w-16 rounded-lg border object-cover" />
      )}
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="min-h-11 rounded-full border border-zinc-300 px-4 text-sm hover:border-zinc-600 disabled:opacity-60">
        {busy ? "Đang tải…" : value ? "Đổi ảnh QR" : "📷 Tải ảnh mã QR"}
      </button>
      {value && (
        <button type="button" onClick={() => onChange("")} className="min-h-11 px-2 text-sm text-zinc-500 hover:text-red-700">
          Xoá
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          try {
            onChange(await uploadThiepPhoto(f, 1200));
          } catch (err) {
            alert((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

function PhotoPicker({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(photos);
  latest.current = photos;
  const room = MAX_THIEP_PHOTOS - photos.length;

  async function add(files: File[]) {
    const list = files.filter((f) => f.type.startsWith("image/")).slice(0, room);
    if (!list.length) return;
    setErrors([]);
    setProgress({ done: 0, total: list.length });
    const errs: string[] = [];
    let next = 0;
    const results: (string | null)[] = new Array(list.length).fill(null);
    const worker = async () => {
      while (next < list.length) {
        const i = next++;
        try {
          results[i] = await uploadThiepPhoto(list[i]);
        } catch (e) {
          errs.push((e as Error).message);
        }
        setProgress((p) => p && { ...p, done: p.done + 1 });
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    onChange([...latest.current, ...results.filter((u): u is string => !!u)].slice(0, MAX_THIEP_PHOTOS));
    setErrors(errs);
    setProgress(null);
  }

  return (
    <div>
      <button
        type="button"
        disabled={!!progress || room <= 0}
        onClick={() => input.current?.click()}
        className="flex min-h-24 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-[#faf8f5] p-4 text-center hover:border-[#7b2d26] disabled:opacity-60"
      >
        <span className="font-semibold">{progress ? `Đang tải ${progress.done}/${progress.total} ảnh…` : room > 0 ? "📷 Chọn ảnh từ điện thoại / máy tính" : `Đã đủ ${MAX_THIEP_PHOTOS} ảnh`}</span>
        <span className="mt-1 text-xs text-zinc-500">Chọn được nhiều ảnh một lúc · ảnh tự thu nhỏ cho nhanh · {photos.length}/{MAX_THIEP_PHOTOS}</span>
      </button>
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add([...(e.target.files ?? [])]).finally(() => (e.target.value = ""))} />
      {errors.length > 0 && (
        <ul role="alert" className="mt-2 space-y-1 text-sm text-red-700">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {photos.map((u, i) => (
            <li key={u} className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`Ảnh ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-[10px] text-white">Bìa</span>}
              <button type="button" onClick={() => onChange(photos.filter((x) => x !== u))} aria-label={`Bỏ ảnh ${i + 1}`} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs shadow">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
