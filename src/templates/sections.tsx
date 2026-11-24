"use client";

import { useState } from "react";
import { googleCalendarUrl, safeUrl, youtubeId, type InvitationData } from "@/lib/invitation";
import type { TemplateDef } from "./registry";
import { Icon } from "./icons";
import { Countdown, TplLink } from "./interactive";
import { isImmersive, Parallax, Reveal, useMode } from "./motion";
import { formatDate, Frame, Img, OrnamentMark, Section, SectionTitle } from "./parts";
import { JournalCouple, JournalEvents, JournalStory, LuxeCouple, LuxeEvents, LuxeStory, ModernCouple, ModernEvents, ModernStory, ZenCouple, ZenEvents, ZenStory } from "./layouts2";
import { EditorialCouple, EditorialEvents, EditorialStory, HeritageCouple, HeritageEvents, HeritageStory, RomanticCouple, RomanticEvents, RomanticStory } from "./layouts";

type P = { tpl: TemplateDef; data: InvitationData };

/* ---------------- Trích dẫn ---------------- */
export function QuoteSection({ tpl, data }: P) {
  if (!data.quote.text) return null;
  return (
    <Section className="!py-20">
      <Reveal variant="blur" className="mx-auto max-w-2xl text-center">
        <span className="tpl-heading block text-8xl leading-none text-[var(--primary)] opacity-40" aria-hidden>
          “
        </span>
        <blockquote className="tpl-heading -mt-6 text-2xl italic leading-relaxed @3xl:text-3xl" style={{ textWrap: "balance" }}>
          {data.quote.text}
        </blockquote>
        {data.quote.author && <p className="mt-6 text-xs uppercase tracking-[0.35em] text-[var(--muted)]">{data.quote.author}</p>}
        <OrnamentMark type={tpl.ornament} className="mt-8" />
      </Reveal>
    </Section>
  );
}

/* ---------------- Gia đình hai họ (lời báo hỷ trang trọng) ---------------- */
export function Families({ tpl, data }: P) {
  const sides = [
    { label: "Nhà trai", p: data.groom },
    { label: "Nhà gái", p: data.bride },
  ];
  return (
    <Section tone="surface" id="loi-moi">
      <div className="grid gap-10 text-center @2xl:grid-cols-2">
        {sides.map(({ label, p }, i) => (
          <Reveal key={label} variant={i ? "right" : "left"}>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--primary)]">{label}</p>
            <div className="tpl-heading mt-4 space-y-1 text-xl">
              {p.father && <p>{p.father}</p>}
              {p.mother && <p>{p.mother}</p>}
            </div>
            {p.address && <p className="mt-2 text-sm text-[var(--muted)]">{p.address}</p>}
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-16 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Trân trọng báo tin Lễ Thành Hôn của con chúng tôi</p>
        <div className="mt-8 grid items-center gap-4 @2xl:grid-cols-[1fr_auto_1fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--muted)]">Chú rể</p>
            <p className={`tpl-heading mt-2 text-4xl @3xl:text-5xl ${tpl.headingUppercase ? "uppercase tracking-[0.12em]" : ""}`}>
              {data.groom.fullName || data.groom.name}
            </p>
          </div>
          <p className="tpl-script text-6xl text-[var(--primary)]">&</p>
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--muted)]">Cô dâu</p>
            <p className={`tpl-heading mt-2 text-4xl @3xl:text-5xl ${tpl.headingUppercase ? "uppercase tracking-[0.12em]" : ""}`}>
              {data.bride.fullName || data.bride.name}
            </p>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-xl whitespace-pre-line leading-loose text-[var(--muted)]">{data.invitationText}</p>
      </Reveal>
    </Section>
  );
}

/* ---------------- Cô dâu & chú rể ---------------- */
function ClassicCouple({ tpl, data }: P) {
  const people = [
    { role: "Chú rể", p: data.groom },
    { role: "Cô dâu", p: data.bride },
  ];
  return (
    <Section id="co-dau-chu-re" wide>
      <SectionTitle tpl={tpl} eyebrow="Bride & Groom" title="Hai nửa của một câu chuyện" />
      <div className="grid gap-16 @2xl:grid-cols-2 @2xl:gap-10 @4xl:gap-24">
        {people.map(({ role, p }, i) => (
          <Reveal key={role} variant={i ? "right" : "left"} className={`text-center ${i ? "@2xl:mt-24" : ""}`}>
            <Frame shape={tpl.frame} src={p.photo} alt={`${role} ${p.name}`} caption={p.name} className="mx-auto w-[78%] max-w-[340px]" />
            <p className="mt-10 text-[11px] uppercase tracking-[0.4em] text-[var(--muted)]">{role}</p>
            <h3 className="tpl-script mt-1 text-5xl text-[var(--primary)]">{p.name}</h3>
            {p.bio && <p className="mx-auto mt-4 max-w-xs leading-relaxed text-[var(--muted)]">{p.bio}</p>}
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- Lịch tháng + đếm ngược ---------------- */
export function CalendarSection({ tpl, data }: P) {
  const date = formatDate(data.weddingDate);
  if (!date) return null;
  const y = date.date.getFullYear();
  const m = date.date.getMonth();
  const first = (new Date(y, m, 1).getDay() + 6) % 7; // thứ Hai đầu tuần
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const lunar = data.events.find((e) => e.lunarDate)?.lunarDate;
  return (
    <Section tone="hero" id="lich">
      <SectionTitle tpl={tpl} eyebrow="Save the date" title={`Tháng ${date.month} · ${date.year}`} light />
      <Reveal variant="zoom" className="mx-auto max-w-md">
        <div className="grid grid-cols-7 gap-y-2 text-center">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((w) => (
            <span key={w} className="pb-3 text-[11px] uppercase tracking-[0.2em] opacity-60">
              {w}
            </span>
          ))}
          {cells.map((c, i) => {
            const isDay = c === date.date.getDate();
            return (
              <span key={i} className="relative flex h-11 items-center justify-center tabular-nums">
                {isDay && (
                  <svg className="tpl-seal absolute h-11 w-11 rounded-full text-[var(--primary)]" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.3 4.5 6.8 4.5c2 0 3.6 1 5.2 3 1.6-2 3.2-3 5.2-3 3.5 0 5.8 3.5 4.3 7.2C19.5 16.4 12 21 12 21z"
                    />
                  </svg>
                )}
                <span className={`relative ${isDay ? "font-bold text-[var(--on-primary)]" : c ? "opacity-85" : ""}`}>{c ?? ""}</span>
              </span>
            );
          })}
        </div>
        <p className="mt-8 text-center">
          <span className="tpl-heading text-2xl">
            {date.weekday}, {date.day}.{date.month}.{date.year}
          </span>
          {lunar && <span className="mt-1 block text-sm italic opacity-70">{lunar}</span>}
        </p>
      </Reveal>
      <Reveal className="mt-14" delay={150}>
        <Countdown target={data.weddingDate} light />
      </Reveal>
    </Section>
  );
}

/* ---------------- Sự kiện ---------------- */
function ClassicEvents({ tpl, data }: P) {
  const mode = useMode();
  const events = data.events.filter((e) => e.title || e.venue || e.date);
  if (!events.length) return null;
  return (
    <Section id="su-kien" wide>
      <SectionTitle tpl={tpl} eyebrow="When & where" title="Sự kiện cưới" intro="Rất mong được đón tiếp bạn tại những khoảnh khắc quan trọng của chúng mình." />
      <div className={`grid gap-8 ${events.length > 1 ? "@3xl:grid-cols-2" : "mx-auto max-w-lg"}`}>
        {events.map((ev, i) => {
          const dt = formatDate(ev.date);
          const map = safeUrl(ev.mapUrl) || (ev.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.address)}` : "");
          const cal = ev.date ? googleCalendarUrl(`${ev.title} · ${data.groom.name} & ${data.bride.name}`, ev.date, ev.address || ev.venue) : "";
          return (
            <Reveal key={ev.id} delay={i * 120} variant="up">
              <article className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-[var(--primary)]/20 bg-[var(--surface)] shadow-[0_30px_60px_-40px_rgba(0,0,0,.35)]">
                <div className="px-7 pb-6 pt-9 text-center">
                  <p className="text-[11px] uppercase tracking-[0.45em] text-[var(--primary)]">{ev.title}</p>
                  {dt && (
                    <>
                      <p className="tpl-heading mt-5 text-6xl tabular-nums">{dt.time}</p>
                      <p className="mt-2">
                        {dt.weekday}, ngày {dt.day} tháng {dt.month} năm {dt.year}
                      </p>
                    </>
                  )}
                  {ev.lunarDate && <p className="mt-1 text-sm italic text-[var(--muted)]">{ev.lunarDate}</p>}
                  <div className="mx-auto my-6 h-px w-16 bg-[var(--primary)]/40" />
                  {ev.venue && <h3 className="tpl-heading text-2xl">{ev.venue}</h3>}
                  {ev.address && (
                    <p className="mt-2 flex items-start justify-center gap-1.5 text-sm text-[var(--muted)]">
                      <Icon name="pin" size={16} className="mt-0.5 shrink-0" />
                      {ev.address}
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {map && (
                      <TplLink href={map} icon="nav">
                        Chỉ đường
                      </TplLink>
                    )}
                    {cal && (
                      <TplLink href={cal} icon="calendar">
                        Thêm vào lịch
                      </TplLink>
                    )}
                  </div>
                </div>
                {ev.address && isImmersive(mode) && (
                  <iframe
                    title={`Bản đồ ${ev.title}`}
                    className="mt-auto h-52 w-full border-0 grayscale-[.4]"
                    loading="lazy"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(ev.address)}&output=embed`}
                  />
                )}
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

/* ---------------- Lịch trình ngày cưới (là chuỗi thời gian thật nên dùng mốc giờ) ---------------- */
export function Schedule({ tpl, data }: P) {
  if (!data.schedule.length) return null;
  return (
    <Section tone="surface" id="lich-trinh">
      <SectionTitle tpl={tpl} eyebrow="The big day" title="Lịch trình ngày cưới" />
      <ol className="relative mx-auto max-w-xl">
        <span className="absolute bottom-2 left-[5.25rem] top-2 w-px bg-[var(--primary)]/30" aria-hidden />
        {data.schedule.map((s, i) => (
          <Reveal as="li" key={s.id} delay={i * 100} variant="left" className="relative grid grid-cols-[4.5rem_1.5rem_1fr] items-start gap-3 pb-10 last:pb-0">
            <span className="tpl-heading pt-0.5 text-right text-2xl tabular-nums text-[var(--primary)]">{s.time}</span>
            <span className="mt-2.5 h-3 w-3 justify-self-center rounded-full border-2 border-[var(--primary)] bg-[var(--surface)]" aria-hidden />
            <div>
              <h3 className="tpl-heading text-xl">{s.title}</h3>
              {s.description && <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{s.description}</p>}
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

/* ---------------- Chuyện tình ---------------- */
function ClassicStory({ tpl, data }: P) {
  if (!data.story.length) return null;
  return (
    <Section id="chuyen-tinh" wide>
      <SectionTitle tpl={tpl} eyebrow="Our love story" title="Chuyện chúng mình" />
      <div className="space-y-20 @3xl:space-y-28">
        {data.story.map((st, i) => {
          const flip = i % 2 === 1;
          return (
            <div key={st.id} className={`grid items-center gap-8 @3xl:grid-cols-2 @3xl:gap-16`}>
              <Reveal variant={flip ? "right" : "left"} className={flip ? "@3xl:order-2" : ""}>
                <div className="relative overflow-hidden rounded-[1.75rem]">
                  <Parallax speed={0.08}>
                    <Img src={st.photo} alt={st.title} className="aspect-[4/3] w-full" />
                  </Parallax>
                </div>
              </Reveal>
              <Reveal variant="up" delay={150} className={`text-center @3xl:text-left ${flip ? "@3xl:order-1 @3xl:text-right" : ""}`}>
                <p className="text-[11px] uppercase tracking-[0.4em] text-[var(--primary)]">{st.date}</p>
                <h3 className="tpl-heading mt-3 text-3xl @3xl:text-4xl">{st.title}</h3>
                <p className="mt-4 leading-loose text-[var(--muted)]">{st.content}</p>
              </Reveal>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ---------------- Ảnh tràn màn hình (parallax) ---------------- */
export function FeaturePhoto({ src, title, subtitle, position }: { src: string; title: string; subtitle?: string; position?: string }) {
  if (!src) return null;
  return (
    <section className="relative flex h-[78svh] items-center justify-center overflow-hidden text-center text-white" aria-label={title}>
      <Parallax speed={0.18} className="absolute inset-0">
        <Img src={src} alt="" className="h-full w-full" position={position} />
      </Parallax>
      <div className="absolute inset-0 bg-black/35" aria-hidden />
      <Reveal variant="blur" className="relative px-6">
        <p className="tpl-script text-5xl drop-shadow-lg @3xl:text-7xl">{title}</p>
        {subtitle && <p className="mt-4 text-xs uppercase tracking-[0.5em] opacity-90">{subtitle}</p>}
      </Reveal>
    </section>
  );
}

/* ---------------- Video (tải iframe khi bấm để nhẹ trang) ---------------- */
export function VideoSection({ tpl, data }: P) {
  const id = youtubeId(data.videoUrl);
  const [play, setPlay] = useState(false);
  if (!id) return null;
  return (
    <Section id="video">
      <SectionTitle tpl={tpl} eyebrow="Pre-wedding film" title="Thước phim của chúng mình" />
      <Reveal variant="zoom" className="relative mx-auto aspect-video max-w-3xl overflow-hidden rounded-[1.75rem] bg-black shadow-2xl">
        {play ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title="Video cưới"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 cursor-pointer" aria-label="Phát video">
            <Img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full opacity-80 transition group-hover:opacity-100" />
            <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--on-primary)] shadow-xl transition group-hover:scale-110">
              <Icon name="play" size={28} className="ml-1" />
            </span>
          </button>
        )}
      </Reveal>
    </Section>
  );
}

/* ---------------- Trang phục ---------------- */
export function DressCode({ tpl, data }: P) {
  if (!data.dressCode.colors.length && !data.dressCode.note) return null;
  return (
    <Section tone="surface" id="trang-phuc">
      <SectionTitle tpl={tpl} eyebrow="Dress code" title="Gợi ý trang phục" intro={data.dressCode.note} />
      <div className="flex flex-wrap justify-center gap-4">
        {data.dressCode.colors.map((c, i) => (
          <Reveal key={c + i} variant="zoom" delay={i * 80}>
            <span className="block h-16 w-16 rounded-full shadow-inner ring-4 ring-[var(--surface)] @3xl:h-20 @3xl:w-20" style={{ background: c }} title={c} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ---------------- Lời cảm ơn ---------------- */
export function ThankYou({ data, monogram }: P & { monogram: string }) {
  const src = data.thankYouPhoto || data.coverPhoto;
  const pos = data.thankYouPhoto ? data.photoPos.thanks : data.photoPos.cover;
  return (
    <footer className="relative flex min-h-[90svh] items-end justify-center overflow-hidden pb-28 text-center text-white">
      <Parallax speed={0.12} className="absolute inset-0">
        <Img src={src} alt="" className="h-full w-full" position={pos} />
      </Parallax>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" aria-hidden />
      <Reveal variant="blur" className="relative max-w-lg px-6">
        <p className="tpl-script text-7xl @3xl:text-8xl">Thank you</p>
        <p className="mx-auto mt-6 leading-relaxed opacity-90">{data.closingText}</p>
        <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full border border-white/60">
          <span className="tpl-script text-2xl">{monogram}</span>
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.45em] opacity-80">
          {data.groom.name} & {data.bride.name}
        </p>
      </Reveal>
    </footer>
  );
}

/* ---------------- Chọn biến thể theo hệ bố cục của mẫu ---------------- */
export function Couple(p: P) {
  const C = { classic: ClassicCouple, editorial: EditorialCouple, romantic: RomanticCouple, heritage: HeritageCouple, luxe: LuxeCouple, modern: ModernCouple, journal: JournalCouple, zen: ZenCouple }[p.tpl.layout];
  return <C {...p} />;
}
export function Events(p: P) {
  const C = { classic: ClassicEvents, editorial: EditorialEvents, romantic: RomanticEvents, heritage: HeritageEvents, luxe: LuxeEvents, modern: ModernEvents, journal: JournalEvents, zen: ZenEvents }[p.tpl.layout];
  return <C {...p} />;
}
export function Story(p: P) {
  const C = { classic: ClassicStory, editorial: EditorialStory, romantic: RomanticStory, heritage: HeritageStory, luxe: LuxeStory, modern: ModernStory, journal: JournalStory, zen: ZenStory }[p.tpl.layout];
  return <C {...p} />;
}
