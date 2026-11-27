"use client";

// Biến thể bố cục: Dạ tiệc (luxe), Bento (modern), Sổ tay (journal), Thiền (zen).

import { googleCalendarUrl, safeUrl, type InvitationData, type WeddingEvent } from "@/lib/invitation";
import type { TemplateDef } from "./registry";
import { Icon } from "./icons";
import { TplLink } from "./interactive";
import { Parallax, Reveal } from "./motion";
import { F, formatDate, Img, Section, SectionTitle } from "./parts";

type P = { tpl: TemplateDef; data: InvitationData };

const people = (data: InvitationData) => [
  { role: "Chú rể", p: data.groom, son: "Con trai" },
  { role: "Cô dâu", p: data.bride, son: "Con gái" },
];
const visibleEvents = (data: InvitationData) => data.events.filter((e) => e.title || e.venue || e.date);
const parents = (p: InvitationData["groom"], son: string) =>
  p.father || p.mother ? `${son} của ${[p.father, p.mother].filter(Boolean).join(" & ")}` : "";

function EventLinks({ ev, data, center }: { ev: WeddingEvent; data: InvitationData; center?: boolean }) {
  const map = safeUrl(ev.mapUrl) || (ev.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.address)}` : "");
  const cal = ev.date ? googleCalendarUrl(`${ev.title} · ${data.groom.name} & ${data.bride.name}`, ev.date, ev.address || ev.venue) : "";
  return (
    <div className={`flex flex-wrap gap-2 ${center ? "justify-center" : ""}`}>
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
  );
}

/* ======================= DẠ TIỆC ======================= */

export function LuxeCouple({ tpl, data }: P) {
  return (
    <Section id="co-dau-chu-re" wide>
      <SectionTitle tpl={tpl} eyebrow="The couple" title="Tân lang & Tân nương" />
      <div className="relative grid grid-cols-2 gap-3 @3xl:gap-10">
        {people(data).map(({ role, p, son }, i) => (
          <Reveal key={role} delay={i * 200} variant="blur" className={i ? "mt-16 @3xl:mt-28" : ""}>
            <div className="relative overflow-hidden rounded-t-full border border-[var(--primary)]/50 p-1.5 @3xl:p-2.5">
              <div className="overflow-hidden rounded-t-full">
                <Parallax speed={0.05}>
                  <Img src={p.photo} alt={`${role} ${p.name}`} className="aspect-[3/5] w-full" />
                </Parallax>
              </div>
            </div>
            <p className="mt-6 text-center text-[10px] uppercase tracking-[0.5em] text-[var(--primary)]">{role}</p>
            <h3 className="tpl-heading mt-2 text-center text-xl uppercase tracking-[0.1em] @3xl:text-4xl"><F f={p === data.groom ? "groom.fullName" : "bride.fullName"}>{p.fullName || p.name}</F></h3>
            {parents(p, son) && <p className="mt-3 text-center text-xs leading-relaxed text-[var(--muted)] @3xl:text-sm"><F f={p === data.groom ? "groom.parents" : "bride.parents"}>{parents(p, son)}</F></p>}
            {p.bio && <p className="mx-auto mt-3 hidden max-w-xs text-center text-sm leading-loose text-[var(--muted)] @2xl:block"><F f={p === data.groom ? "groom.bio" : "bride.bio"}>{p.bio}</F></p>}
          </Reveal>
        ))}
        <span className="tpl-script absolute left-1/2 top-[38%] flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--primary)] bg-[var(--bg)] text-3xl text-[var(--primary)] @3xl:h-24 @3xl:w-24 @3xl:text-5xl">
          &
        </span>
      </div>
    </Section>
  );
}

/** Mỗi sự kiện là một tấm bảng tối trên nền ảnh album, viền vàng lồng bên trong. */
export function LuxeEvents({ tpl, data }: P) {
  const events = visibleEvents(data);
  if (!events.length) return null;
  return (
    <Section id="su-kien" wide>
      <SectionTitle tpl={tpl} eyebrow="Kính mời" title="Lễ thành hôn" />
      <div className="space-y-6">
        {events.map((ev, i) => {
          const dt = formatDate(ev.date);
          const bg = data.gallery[(i * 3 + 1) % Math.max(1, data.gallery.length)] || data.coverPhoto;
          return (
            <Reveal key={ev.id} delay={i * 120} variant="zoom">
              <article className="relative overflow-hidden text-center text-white">
                <div className="absolute inset-0">
                  <Parallax speed={0.08}>
                    <Img src={bg} alt="" className="h-[140%] w-full" />
                  </Parallax>
                </div>
                <div className="absolute inset-0 bg-black/65" aria-hidden />
                <div className="relative m-3 border border-[var(--primary)]/70 px-6 py-14 @3xl:m-5 @3xl:py-20">
                  <p className="text-[10px] uppercase tracking-[0.6em] text-[var(--primary)]"><F f={`event.${ev.id}.title`}>{ev.title}</F></p>
                  {dt && (
                    <div className="mt-6 flex items-center justify-center gap-5 @3xl:gap-8">
                      <span className="w-20 text-right text-xs uppercase tracking-[0.3em] opacity-80 @3xl:w-28">{dt.weekday}</span>
                      <span className="tpl-heading border-x border-[var(--primary)]/60 px-5 text-6xl leading-none @3xl:px-8 @3xl:text-8xl">{dt.day}</span>
                      <span className="w-20 text-left text-xs uppercase tracking-[0.3em] opacity-80 @3xl:w-28">
                        {dt.monthEn}
                        <br />
                        {dt.year}
                      </span>
                    </div>
                  )}
                  {dt && <p className="tpl-heading mt-6 text-2xl italic">vào lúc {dt.time}</p>}
                  {ev.lunarDate && <p className="mt-1 text-sm opacity-75"><F f={`event.${ev.id}.lunarDate`}>{ev.lunarDate}</F></p>}
                  {ev.venue && <p className="mt-6 text-lg uppercase tracking-[0.2em]"><F f={`event.${ev.id}.venue`}>{ev.venue}</F></p>}
                  {ev.address && <p className="mx-auto mt-1 max-w-md text-sm opacity-75"><F f={`event.${ev.id}.address`}>{ev.address}</F></p>}
                  <div className="mt-8">
                    <EventLinks ev={ev} data={data} center />
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

/** Chuyện tình dạng băng trượt ngang các tấm ảnh dọc cao. */
export function LuxeStory({ tpl, data }: P) {
  if (!data.story.length) return null;
  return (
    <Section id="chuyen-tinh" tone="surface" wide>
      <SectionTitle tpl={tpl} eyebrow="Our story" title="Hành trình của chúng mình" intro="Vuốt ngang để xem tiếp." />
      <div className="tpl-noscroll -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 @3xl:gap-8">
        {data.story.map((st, i) => (
          <Reveal key={st.id} delay={i * 100} className="w-[78%] shrink-0 snap-center @2xl:w-[42%] @3xl:w-[32%]">
            <div className="overflow-hidden">
              <Img src={st.photo} alt={st.title} className="aspect-[3/4] w-full transition duration-[1.4s] hover:scale-105" />
            </div>
            <div className="mt-5 border-t border-[var(--primary)]/40 pt-5">
              <p className="text-[10px] uppercase tracking-[0.5em] text-[var(--primary)]"><F f={`story.${st.id}.date`}>{st.date}</F></p>
              <h3 className="tpl-heading mt-2 text-2xl italic"><F f={`story.${st.id}.title`}>{st.title}</F></h3>
              <p className="mt-3 text-sm leading-loose text-[var(--muted)]"><F f={`story.${st.id}.content`}>{st.content}</F></p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ======================= BENTO ======================= */

const tile = "rounded-[1.75rem] bg-[var(--surface)] p-6 @3xl:p-8";

export function ModernCouple({ tpl, data }: P) {
  const [g, b] = [data.groom, data.bride];
  return (
    <Section id="co-dau-chu-re" wide>
      <SectionTitle tpl={tpl} eyebrow="Bride & Groom" title="Hai đứa mình" />
      <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4 @3xl:grid-rows-[auto_auto] @3xl:gap-4">
        <Reveal className="col-span-2 row-span-2 overflow-hidden rounded-[1.75rem] @3xl:col-span-2">
          <Img src={g.photo} alt={`Chú rể ${g.name}`} className="aspect-[4/5] h-full w-full" />
        </Reveal>
        <Reveal delay={100} className={`${tile} col-span-2 flex flex-col justify-between @3xl:col-span-2`}>
          <p className="text-xs font-semibold text-[var(--muted)]">Chú rể</p>
          <div>
            <h3 className="tpl-heading mt-6 text-4xl font-bold leading-none tracking-tight @3xl:text-5xl"><F f={"groom.fullName"}>{g.fullName || g.name}</F></h3>
            {g.bio && <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]"><F f="groom.bio">{g.bio}</F></p>}
          </div>
        </Reveal>
        <Reveal delay={150} className="flex aspect-square items-center justify-center rounded-[1.75rem] bg-[var(--primary)] text-[var(--on-primary)]">
          <span className="tpl-heading text-7xl font-bold">&</span>
        </Reveal>
        <Reveal delay={200} className="overflow-hidden rounded-[1.75rem]">
          <Img src={data.gallery[2] || data.coverPhoto} alt="" className="aspect-square h-full w-full" />
        </Reveal>
        <Reveal delay={250} className={`${tile} col-span-2 flex flex-col justify-between @3xl:col-span-2`}>
          <p className="text-xs font-semibold text-[var(--muted)]">Cô dâu</p>
          <div>
            <h3 className="tpl-heading mt-6 text-4xl font-bold leading-none tracking-tight @3xl:text-5xl"><F f={"bride.fullName"}>{b.fullName || b.name}</F></h3>
            {b.bio && <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]"><F f="bride.bio">{b.bio}</F></p>}
          </div>
        </Reveal>
        <Reveal delay={300} className="col-span-2 overflow-hidden rounded-[1.75rem]">
          <Img src={b.photo} alt={`Cô dâu ${b.name}`} className="aspect-[16/10] h-full w-full" />
        </Reveal>
      </div>
    </Section>
  );
}

export function ModernEvents({ tpl, data }: P) {
  const events = visibleEvents(data);
  if (!events.length) return null;
  return (
    <Section id="su-kien" wide>
      <SectionTitle tpl={tpl} eyebrow="Lịch hẹn" title="Gặp nhau ở đâu?" />
      <div className="space-y-4">
        {events.map((ev, i) => {
          const dt = formatDate(ev.date);
          return (
            <Reveal key={ev.id} delay={i * 100} className="grid grid-cols-[6.5rem_1fr] gap-3 @3xl:grid-cols-[10rem_12rem_1fr] @3xl:gap-4">
              <div className="row-span-2 flex flex-col items-center justify-center rounded-[1.75rem] bg-[var(--primary)] p-4 text-[var(--on-primary)] @3xl:row-span-1">
                <span className="text-xs font-semibold opacity-80">{dt ? `Th ${dt.month}` : ""}</span>
                <span className="tpl-heading text-6xl font-bold leading-none tabular-nums @3xl:text-7xl">{dt?.day ?? "--"}</span>
                <span className="text-xs opacity-80">{dt?.year}</span>
              </div>
              <div className={`${tile} flex flex-col justify-center !p-5`}>
                <p className="text-xs font-semibold text-[var(--muted)]">{dt?.weekday ?? "Giờ"}</p>
                <p className="tpl-heading text-4xl font-bold tabular-nums">{dt?.time ?? "--:--"}</p>
              </div>
              <div className={`${tile} !p-5 @3xl:col-auto`}>
                <h3 className="tpl-heading text-2xl font-bold"><F f={`event.${ev.id}.title`}>{ev.title}</F></h3>
                {ev.venue && <p className="mt-1 font-medium"><F f={`event.${ev.id}.venue`}>{ev.venue}</F></p>}
                {ev.address && <p className="text-sm text-[var(--muted)]"><F f={`event.${ev.id}.address`}>{ev.address}</F></p>}
                {ev.lunarDate && <p className="mt-1 text-xs text-[var(--muted)]"><F f={`event.${ev.id}.lunarDate`}>{ev.lunarDate}</F></p>}
                <div className="mt-4">
                  <EventLinks ev={ev} data={data} />
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

/** Các thẻ xếp chồng khi cuộn (sticky stack). */
export function ModernStory({ tpl, data }: P) {
  if (!data.story.length) return null;
  return (
    <Section id="chuyen-tinh" tone="surface" wide className="!overflow-visible">
      <SectionTitle tpl={tpl} eyebrow="Love story" title="Chuyện tình qua từng năm" />
      <div className="space-y-6">
        {data.story.map((st, i) => (
          <article
            key={st.id}
            className="sticky grid overflow-hidden rounded-[2rem] bg-[var(--bg)] shadow-[0_-20px_40px_-30px_rgba(0,0,0,.35)] @2xl:grid-cols-2"
            style={{ top: `${1.5 + i * 1.25}rem` }}
          >
            <Img src={st.photo} alt={st.title} className="aspect-[16/10] w-full @2xl:aspect-auto @2xl:h-full" />
            <div className="flex flex-col justify-center p-7 @3xl:p-12">
              <span className="w-fit rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold"><F f={`story.${st.id}.date`}>{st.date}</F></span>
              <h3 className="tpl-heading mt-4 text-3xl font-bold leading-tight tracking-tight @3xl:text-4xl"><F f={`story.${st.id}.title`}>{st.title}</F></h3>
              <p className="mt-3 leading-relaxed text-[var(--muted)]"><F f={`story.${st.id}.content`}>{st.content}</F></p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ======================= SỔ TAY ======================= */

function Tape({ className = "" }: { className?: string }) {
  return (
    <span
      className={`absolute z-10 h-6 w-20 opacity-80 ${className}`}
      style={{ background: "color-mix(in srgb, var(--accent) 80%, white)", clipPath: "polygon(3% 0,97% 8%,100% 92%,0 100%)" }}
      aria-hidden
    />
  );
}

export function JournalCouple({ tpl, data }: P) {
  return (
    <Section id="co-dau-chu-re">
      <SectionTitle tpl={tpl} eyebrow="Nhân vật chính" title="Cô ấy & anh ấy" />
      <div className="grid gap-14 @2xl:grid-cols-2 @2xl:gap-8">
        {people(data).map(({ role, p }, i) => (
          <Reveal key={role} delay={i * 150} className={i ? "@2xl:mt-20" : ""}>
            <div className={`relative mx-auto w-[82%] bg-white p-3 pb-4 shadow-[0_12px_30px_-14px_rgba(0,0,0,.35)] ${i ? "rotate-2" : "-rotate-2"}`}>
              <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-[-4deg]" />
              <Img src={p.photo} alt={`${role} ${p.name}`} className="aspect-[4/5] w-full" />
              <p className="tpl-script mt-2 text-center text-2xl text-[var(--muted)]">{role.toLowerCase()} nè</p>
            </div>
            <div className={`relative mx-auto -mt-6 w-[76%] bg-[var(--surface)] px-5 py-4 shadow-md ${i ? "-rotate-1" : "rotate-1"}`}>
              <h3 className="tpl-heading text-3xl text-[var(--primary)]"><F f={p === data.groom ? "groom.fullName" : "bride.fullName"}>{p.fullName || p.name}</F></h3>
              {p.bio && <p className="mt-2 leading-relaxed"><F f={p === data.groom ? "groom.bio" : "bride.bio"}>{p.bio}</F></p>}
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/** Thẻ ghi chú kẹp ghim, kẻ dòng như trang sổ. */
export function JournalEvents({ tpl, data }: P) {
  const events = visibleEvents(data);
  if (!events.length) return null;
  return (
    <Section id="su-kien" tone="surface">
      <SectionTitle tpl={tpl} eyebrow="Ghi nhớ nha" title="Ngày giờ & địa điểm" />
      <div className={`grid gap-10 ${events.length > 1 ? "@2xl:grid-cols-2" : "mx-auto max-w-md"}`}>
        {events.map((ev, i) => {
          const dt = formatDate(ev.date);
          return (
            <Reveal key={ev.id} delay={i * 120}>
              <article
                className={`relative bg-[var(--bg)] px-6 pb-7 pt-10 shadow-[0_14px_30px_-16px_rgba(0,0,0,.35)] ${i % 2 ? "rotate-1" : "-rotate-1"}`}
                style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 27px, color-mix(in srgb, var(--primary) 18%, transparent) 27px 28px)" }}
              >
                <span className="absolute left-1/2 top-3 h-4 w-4 -translate-x-1/2 rounded-full bg-[var(--primary)] shadow-[inset_-2px_-2px_0_rgba(0,0,0,.25)]" aria-hidden />
                <h3 className="tpl-heading text-3xl text-[var(--primary)]"><F f={`event.${ev.id}.title`}>{ev.title}</F></h3>
                {dt && (
                  <p className="mt-3 text-lg leading-7">
                    <Icon name="clock" size={16} className="mr-2 inline" />
                    {dt.time} · {dt.weekday}, {dt.day}/{dt.month}/{dt.year}
                  </p>
                )}
                {ev.lunarDate && <p className="leading-7 text-[var(--muted)]">(<F f={`event.${ev.id}.lunarDate`}>{ev.lunarDate}</F>)</p>}
                {ev.venue && (
                  <p className="mt-2 text-lg leading-7">
                    <Icon name="pin" size={16} className="mr-2 inline" />
                    <F f={`event.${ev.id}.venue`}>{ev.venue}</F>
                  </p>
                )}
                {ev.address && <p className="leading-7 text-[var(--muted)]"><F f={`event.${ev.id}.address`}>{ev.address}</F></p>}
                <div className="mt-5">
                  <EventLinks ev={ev} data={data} />
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

/** Nhật ký: con dấu ngày tròn bên trái, ảnh dán băng keo. */
export function JournalStory({ tpl, data }: P) {
  if (!data.story.length) return null;
  return (
    <Section id="chuyen-tinh">
      <SectionTitle tpl={tpl} eyebrow="Nhật ký" title="Trang nhật ký của tụi mình" />
      <div className="space-y-16">
        {data.story.map((st, i) => (
          <Reveal key={st.id} className="grid grid-cols-[4.5rem_1fr] gap-5 @2xl:grid-cols-[6rem_1fr_16rem] @2xl:items-start">
            <div className="flex aspect-square -rotate-12 items-center justify-center rounded-full border-2 border-dashed border-[var(--primary)] p-1 text-center text-[11px] font-semibold uppercase leading-tight text-[var(--primary)]">
              <F f={`story.${st.id}.date`}>{st.date}</F>
            </div>
            <div>
              <h3 className="tpl-heading text-3xl"><F f={`story.${st.id}.title`}>{st.title}</F></h3>
              <p className="mt-2 text-lg leading-8"><F f={`story.${st.id}.content`}>{st.content}</F></p>
            </div>
            <div className={`relative col-span-2 mx-auto w-[70%] bg-white p-2 shadow-md @2xl:col-span-1 @2xl:w-full ${i % 2 ? "rotate-3" : "-rotate-3"}`}>
              <Tape className="-top-2 -left-4 rotate-[-30deg] !w-16" />
              <Tape className="-bottom-2 -right-4 rotate-[-30deg] !w-16" />
              <Img src={st.photo} alt={st.title} className="aspect-square w-full" />
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ======================= THIỀN ======================= */

export function ZenCouple({ tpl, data }: P) {
  return (
    <Section id="co-dau-chu-re" wide>
      <SectionTitle tpl={tpl} eyebrow="The couple" title="Hai người, một lối về" />
      <div className="space-y-20 @3xl:space-y-0">
        {people(data).map(({ role, p, son }, i) => (
          <Reveal key={role} variant="blur" className={`@3xl:w-[62%] ${i ? "@3xl:-mt-24 @3xl:ml-auto" : ""}`}>
            <div className={`flex items-end gap-5 @3xl:gap-8 ${i ? "flex-row-reverse" : ""}`}>
              <div className="w-[70%] shrink-0">
                <Img src={p.photo} alt={`${role} ${p.name}`} className="aspect-[3/4] w-full" />
              </div>
              <h3 className="tpl-heading pb-1 text-3xl font-light leading-none @3xl:text-5xl" style={{ writingMode: "vertical-rl" }}>
                <F f={p === data.groom ? "groom.fullName" : "bride.fullName"}>{p.fullName || p.name}</F>
              </h3>
            </div>
            <div className={`mt-5 flex items-start gap-3 ${i ? "flex-row-reverse text-right" : ""}`}>
              <span className="mt-1 h-2 w-2 shrink-0 bg-[var(--primary)]" aria-hidden />
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--muted)]">{role}</p>
                {parents(p, son) && <p className="mt-1 max-w-xs text-sm leading-relaxed text-[var(--muted)]"><F f={p === data.groom ? "groom.parents" : "bride.parents"}>{parents(p, son)}</F></p>}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/** Danh sách tối giản: ngày lớn nét mảnh trong vòng tròn bút lông. */
export function ZenEvents({ tpl, data }: P) {
  const events = visibleEvents(data);
  if (!events.length) return null;
  return (
    <Section id="su-kien">
      <SectionTitle tpl={tpl} eyebrow="Ngày lành" title="Lễ cưới" />
      <div className="space-y-16">
        {events.map((ev, i) => {
          const dt = formatDate(ev.date);
          return (
            <Reveal key={ev.id} delay={i * 120} variant="blur" className="grid grid-cols-[7rem_1fr] items-center gap-6 @3xl:grid-cols-[12rem_1fr] @3xl:gap-12">
              <div className="relative flex aspect-square items-center justify-center">
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full text-[var(--primary)]" fill="none" aria-hidden>
                  <path d="M50 6C24 6 7 26 7 50s19 44 43 44 43-18 43-42C93 30 80 14 62 9" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity=".75" />
                </svg>
                <span className="tpl-heading text-5xl font-light tabular-nums @3xl:text-7xl">{dt?.day ?? "··"}</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.5em] text-[var(--muted)]">
                  {dt ? `Tháng ${dt.month} · ${dt.year} · ${dt.weekday}` : ""}
                </p>
                <h3 className="tpl-heading mt-2 text-3xl font-light @3xl:text-4xl"><F f={`event.${ev.id}.title`}>{ev.title}</F></h3>
                {dt && <p className="mt-1 text-lg">{dt.time}</p>}
                {ev.lunarDate && <p className="text-sm text-[var(--muted)]"><F f={`event.${ev.id}.lunarDate`}>{ev.lunarDate}</F></p>}
                {ev.venue && <p className="mt-4"><F f={`event.${ev.id}.venue`}>{ev.venue}</F></p>}
                {ev.address && <p className="text-sm text-[var(--muted)]"><F f={`event.${ev.id}.address`}>{ev.address}</F></p>}
                <div className="mt-5">
                  <EventLinks ev={ev} data={data} />
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

/** So le trái phải, nhiều khoảng trống, ngày ghi dọc. */
export function ZenStory({ tpl, data }: P) {
  if (!data.story.length) return null;
  return (
    <Section id="chuyen-tinh" tone="surface" wide>
      <SectionTitle tpl={tpl} eyebrow="Chuyện tình" title="Những mùa đã qua" />
      <div className="space-y-24">
        {data.story.map((st, i) => (
          <Reveal key={st.id} variant="blur" className={`grid items-end gap-6 @3xl:grid-cols-12 @3xl:gap-10`}>
            <div className={`flex gap-4 @3xl:col-span-7 ${i % 2 ? "@3xl:order-2 @3xl:col-start-6" : ""}`}>
              <p className="shrink-0 text-[10px] uppercase tracking-[0.5em] text-[var(--primary)]" style={{ writingMode: "vertical-rl" }}>
                <F f={`story.${st.id}.date`}>{st.date}</F>
              </p>
              <Img src={st.photo} alt={st.title} className="aspect-[4/3] w-full" />
            </div>
            <div className={`@3xl:col-span-4 ${i % 2 ? "@3xl:order-1 @3xl:col-start-1" : ""}`}>
              <h3 className="tpl-heading text-3xl font-light"><F f={`story.${st.id}.title`}>{st.title}</F></h3>
              <p className="mt-4 text-sm leading-loose text-[var(--muted)]"><F f={`story.${st.id}.content`}>{st.content}</F></p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
