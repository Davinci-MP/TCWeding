"use client";

// Biến thể bố cục cho các mục bên trong thiệp: Tạp chí (editorial), Lãng mạn (romantic), Di sản (heritage).
// Bố cục Cổ điển (classic) nằm trong sections.tsx.

import { googleCalendarUrl, safeUrl, type InvitationData, type WeddingEvent, mapEmbedUrl } from "@/lib/invitation";
import type { TemplateDef } from "./registry";
import { Icon } from "./icons";
import { TplLink } from "./interactive";
import { isImmersive, Parallax, Reveal, useMode } from "./motion";
import { F, formatDate, Frame, Img, Section, SectionTitle } from "./parts";

type P = { tpl: TemplateDef; data: InvitationData };

function links(ev: WeddingEvent, data: InvitationData) {
  return {
    map: safeUrl(ev.mapUrl) || (ev.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.address)}` : ""),
    cal: ev.date ? googleCalendarUrl(`${ev.title} · ${data.groom.name} & ${data.bride.name}`, ev.date, ev.address || ev.venue) : "",
  };
}

function EventLinks({ ev, data }: { ev: WeddingEvent; data: InvitationData }) {
  const { map, cal } = links(ev, data);
  return (
    <div className="flex flex-wrap gap-2">
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

const people = (data: InvitationData) => [
  { role: "Chú rể", p: data.groom, son: "Con trai" },
  { role: "Cô dâu", p: data.bride, son: "Con gái" },
];

const visibleEvents = (data: InvitationData) => data.events.filter((e) => e.title || e.venue || e.date);

/* ======================= TẠP CHÍ ======================= */

export function EditorialCouple({ tpl, data }: P) {
  return (
    <Section id="co-dau-chu-re" wide>
      <SectionTitle tpl={tpl} eyebrow="Bride & Groom" title="Hai nửa của một câu chuyện" />
      <div className="space-y-20">
        {people(data).map(({ role, p }, i) => (
          <div key={role} className="grid items-end gap-8 @3xl:grid-cols-12">
            <Reveal variant={i ? "right" : "left"} className={`@3xl:col-span-7 ${i ? "@3xl:order-2" : ""}`}>
              <div className="overflow-hidden">
                <Parallax speed={0.06}>
                  <Img fk={p === data.groom ? "groom.photo" : "bride.photo"} src={p.photo} alt={`${role} ${p.name}`} className="aspect-[4/3] w-full grayscale-[.15]" />
                </Parallax>
              </div>
            </Reveal>
            <Reveal delay={150} className={`@3xl:col-span-5 ${i ? "@3xl:order-1 @3xl:text-right" : ""}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[var(--primary)]">{role}</p>
              <h3 className={`tpl-heading mt-3 text-5xl leading-[0.95] @3xl:text-6xl ${tpl.headingUppercase ? "uppercase" : ""}`}>
                <F f={p === data.groom ? "groom.fullName" : "bride.fullName"}>{p.fullName || p.name}</F>
              </h3>
              <div className={`mt-5 h-px w-20 bg-current/30 ${i ? "@3xl:ml-auto" : ""}`} />
              {p.bio && <p className="mt-5 leading-relaxed text-[var(--muted)]"><F f={p === data.groom ? "groom.bio" : "bride.bio"}>{p.bio}</F></p>}
            </Reveal>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function EditorialEvents({ tpl, data }: P) {
  const events = visibleEvents(data);
  if (!events.length) return null;
  return (
    <Section id="su-kien" wide>
      <SectionTitle tpl={tpl} eyebrow="When & where" title="Sự kiện cưới" intro="Thời gian và địa điểm của từng nghi lễ." />
      <div className="divide-y divide-current/15 border-y border-current/15">
        {events.map((ev, i) => {
          const dt = formatDate(ev.date);
          return (
            <Reveal key={ev.id} delay={i * 100} className="grid gap-6 py-10 @3xl:grid-cols-[14rem_1fr_auto] @3xl:items-center">
              <div>
                <p className="tpl-heading text-6xl leading-none tabular-nums @3xl:text-7xl">{dt?.time ?? "--:--"}</p>
                {dt && (
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                    {dt.weekday} · {dt.day}.{dt.month}.{dt.year}
                  </p>
                )}
              </div>
              <div>
                <h3 className={`tpl-heading text-3xl ${tpl.headingUppercase ? "uppercase tracking-wide" : ""}`}><F f={`event.${ev.id}.title`}>{ev.title}</F></h3>
                {ev.venue && <p className="mt-2 font-semibold"><F f={`event.${ev.id}.venue`}>{ev.venue}</F></p>}
                {ev.address && <p className="text-sm text-[var(--muted)]"><F f={`event.${ev.id}.address`}>{ev.address}</F></p>}
                {ev.lunarDate && <p className="mt-1 text-sm italic text-[var(--muted)]"><F f={`event.${ev.id}.lunarDate`}>{ev.lunarDate}</F></p>}
              </div>
              <EventLinks ev={ev} data={data} />
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

export function EditorialStory({ tpl, data }: P) {
  if (!data.story.length) return null;
  return (
    <Section id="chuyen-tinh" wide>
      <SectionTitle tpl={tpl} eyebrow="Our love story" title="Chuyện chúng mình" />
      <div className="space-y-16">
        {data.story.map((st, i) => (
          <Reveal key={st.id} className="grid gap-6 border-t border-current/15 pt-8 @3xl:grid-cols-12 @3xl:gap-10">
            <div className="@3xl:col-span-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[var(--primary)]">Chương {i + 1}</p>
              <h3 className={`tpl-heading mt-3 text-4xl leading-tight ${tpl.headingUppercase ? "uppercase" : ""}`}><F f={`story.${st.id}.title`}>{st.title}</F></h3>
              <p className="mt-2 text-sm uppercase tracking-[0.25em] text-[var(--muted)]"><F f={`story.${st.id}.date`}>{st.date}</F></p>
            </div>
            <div className="@3xl:col-span-8">
              <Img fk={`story.${st.id}`} src={st.photo} alt={st.title} className="aspect-[16/9] w-full" />
              <p className="mt-5 max-w-xl leading-loose text-[var(--muted)]"><F f={`story.${st.id}.content`}>{st.content}</F></p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ======================= LÃNG MẠN ======================= */

export function RomanticCouple({ tpl, data }: P) {
  return (
    <Section id="co-dau-chu-re">
      <SectionTitle tpl={tpl} eyebrow="Bride & Groom" title="Chúng mình là…" />
      <Reveal variant="zoom" className="relative mx-auto flex max-w-md items-center justify-center">
        {people(data).map(({ role, p }, i) => (
          <div
            key={role}
            className={`relative h-48 w-48 shrink-0 overflow-hidden rounded-full border-[6px] border-[var(--surface)] shadow-xl @3xl:h-60 @3xl:w-60 ${
              i ? "-ml-10 rotate-3" : "-rotate-3"
            }`}
          >
            <Img fk={p === data.groom ? "groom.photo" : "bride.photo"} src={p.photo} alt={`${role} ${p.name}`} className="h-full w-full" />
          </div>
        ))}
        <span className="tpl-script absolute bottom-2 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--primary)] text-3xl text-[var(--on-primary)] shadow-lg">
          &
        </span>
      </Reveal>
      <div className="mt-14 grid gap-10 text-center @2xl:grid-cols-2">
        {people(data).map(({ role, p }, i) => (
          <Reveal key={role} delay={i * 150}>
            <p className="text-[11px] uppercase tracking-[0.4em] text-[var(--muted)]">{role}</p>
            <h3 className="tpl-script mt-1 text-5xl text-[var(--primary)]">{p.name}</h3>
            {p.bio && <p className="mx-auto mt-3 max-w-xs leading-relaxed text-[var(--muted)]"><F f={p === data.groom ? "groom.bio" : "bride.bio"}>{p.bio}</F></p>}
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export function RomanticEvents({ tpl, data }: P) {
  const mode = useMode();
  const events = visibleEvents(data);
  if (!events.length) return null;
  return (
    <Section id="su-kien" tone="surface">
      <SectionTitle tpl={tpl} eyebrow="When & where" title="Hẹn gặp bạn tại" />
      <div className={`grid gap-8 ${events.length > 1 ? "@3xl:grid-cols-2" : "mx-auto max-w-md"}`}>
        {events.map((ev, i) => {
          const dt = formatDate(ev.date);
          return (
            <Reveal key={ev.id} delay={i * 120} variant="zoom">
              <article className="relative h-full rounded-[2.5rem] bg-[var(--bg)] px-7 pb-8 pt-14 text-center shadow-[0_25px_60px_-35px_var(--primary)]">
                <span className="absolute -top-7 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--on-primary)] shadow-lg">
                  <Icon name="heart" size={22} />
                </span>
                <h3 className="tpl-script text-4xl text-[var(--primary)]"><F f={`event.${ev.id}.title`}>{ev.title}</F></h3>
                {dt && (
                  <div className="mx-auto mt-5 inline-flex items-center gap-4 rounded-full bg-[var(--accent)]/70 px-6 py-3">
                    <span className="tpl-heading text-3xl tabular-nums">{dt.time}</span>
                    <span className="h-6 w-px bg-current/20" />
                    <span className="text-left text-sm leading-tight">
                      {dt.weekday}
                      <br />
                      {dt.day}.{dt.month}.{dt.year}
                    </span>
                  </div>
                )}
                {ev.lunarDate && <p className="mt-3 text-sm italic text-[var(--muted)]"><F f={`event.${ev.id}.lunarDate`}>{ev.lunarDate}</F></p>}
                {ev.venue && <p className="tpl-heading mt-5 text-xl"><F f={`event.${ev.id}.venue`}>{ev.venue}</F></p>}
                {ev.address && <p className="mt-1 text-sm text-[var(--muted)]"><F f={`event.${ev.id}.address`}>{ev.address}</F></p>}
                <div className="mt-6 flex justify-center">
                  <EventLinks ev={ev} data={data} />
                </div>
                {mapEmbedUrl(ev) && mode !== "thumb" && (
                  <iframe
                    title={`Bản đồ ${ev.title}`}
                    className="mt-6 h-44 w-full rounded-3xl border-0"
                    loading="lazy"
                    src={mapEmbedUrl(ev)}
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

export function RomanticStory({ tpl, data }: P) {
  if (!data.story.length) return null;
  return (
    <Section id="chuyen-tinh">
      <SectionTitle tpl={tpl} eyebrow="Our love story" title="Chuyện tình mình" />
      <ol className="relative mx-auto max-w-md space-y-14 text-center">
        <span className="absolute inset-y-0 left-1/2 border-l-2 border-dotted border-[var(--primary)]/40" aria-hidden />
        {data.story.map((st, i) => (
          <Reveal as="li" key={st.id} delay={i * 80} variant="zoom" className="relative">
            <div className="mx-auto h-40 w-40 overflow-hidden rounded-full border-[6px] border-[var(--bg)] shadow-lg ring-1 ring-[var(--primary)]/30">
              <Img fk={`story.${st.id}`} src={st.photo} alt={st.title} className="h-full w-full" />
            </div>
            <div className="relative mt-4 rounded-3xl bg-[var(--bg)] px-6 py-5">
              <span className="inline-block rounded-full bg-[var(--primary)] px-4 py-1 text-xs text-[var(--on-primary)]"><F f={`story.${st.id}.date`}>{st.date}</F></span>
              <h3 className="tpl-script mt-3 text-4xl text-[var(--primary)]"><F f={`story.${st.id}.title`}>{st.title}</F></h3>
              <p className="mt-2 leading-relaxed text-[var(--muted)]"><F f={`story.${st.id}.content`}>{st.content}</F></p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

/* ======================= DI SẢN ======================= */

export function HeritageCouple({ tpl, data }: P) {
  return (
    <Section id="co-dau-chu-re" tone="surface">
      <SectionTitle tpl={tpl} eyebrow="Tân lang & Tân nương" title="Cô dâu · Chú rể" />
      <div className="grid gap-8 @2xl:grid-cols-2">
        {people(data).map(({ role, p, son }, i) => (
          <Reveal key={role} variant={i ? "right" : "left"}>
            <article className="h-full border-[3px] border-double border-[var(--primary)]/50 p-6 text-center">
              <Frame fk={p === data.groom ? "groom.photo" : "bride.photo"} shape={tpl.frame} src={p.photo} alt={`${role} ${p.name}`} caption={p.name} className="mx-auto w-[70%] max-w-[260px]" />
              <p className="mt-8 text-[11px] uppercase tracking-[0.45em] text-[var(--primary)]">{role}</p>
              <h3 className="tpl-heading mt-2 text-3xl uppercase tracking-[0.12em]"><F f={p === data.groom ? "groom.fullName" : "bride.fullName"}>{p.fullName || p.name}</F></h3>
              {(p.father || p.mother) && (
                <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                  <F f={p === data.groom ? "groom.parents" : "bride.parents"}>{son} của {[p.father, p.mother].filter(Boolean).join(" & ")}</F>
                </p>
              )}
              {p.address && (
                <p className="mt-1 flex items-center justify-center gap-1 text-sm text-[var(--muted)]">
                  <Icon name="pin" size={14} />
                  <F f={p === data.groom ? "groom.address" : "bride.address"}>{p.address}</F>
                </p>
              )}
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/** Thẻ sự kiện dạng "vé mời": cuống vé ghi ngày, đường cắt răng cưa. */
export function HeritageEvents({ tpl, data }: P) {
  const events = visibleEvents(data);
  if (!events.length) return null;
  return (
    <Section id="su-kien">
      <SectionTitle tpl={tpl} eyebrow="Kính mời tham dự" title="Lễ cưới" />
      <div className="space-y-8">
        {events.map((ev, i) => {
          const dt = formatDate(ev.date);
          return (
            <Reveal key={ev.id} delay={i * 120} variant={i % 2 ? "right" : "left"}>
              <article className="relative grid overflow-hidden bg-[var(--surface)] shadow-[0_20px_50px_-30px_rgba(0,0,0,.4)] @2xl:grid-cols-[11rem_1fr]">
                <div className="relative flex flex-row items-center justify-center gap-4 bg-[var(--primary)] px-6 py-5 text-[var(--on-primary)] @2xl:flex-col @2xl:gap-1">
                  {dt ? (
                    <>
                      <span className="text-[11px] uppercase tracking-[0.3em] opacity-85">{dt.weekday}</span>
                      <span className="tpl-heading text-6xl leading-none">{dt.day}</span>
                      <span className="text-xs tracking-[0.3em]">
                        {dt.month} · {dt.year}
                      </span>
                    </>
                  ) : (
                    <Icon name="calendar" size={28} />
                  )}
                </div>
                {/* răng cưa ngăn cuống vé */}
                <span className="absolute left-[11rem] top-0 hidden h-full -translate-x-1/2 border-l-2 border-dashed border-[var(--bg)] @2xl:block" aria-hidden />
                <span className="absolute left-[11rem] -top-3 hidden h-6 w-6 -translate-x-1/2 rounded-full bg-[var(--bg)] @2xl:block" aria-hidden />
                <span className="absolute -bottom-3 left-[11rem] hidden h-6 w-6 -translate-x-1/2 rounded-full bg-[var(--bg)] @2xl:block" aria-hidden />
                <div className="px-7 py-7 text-center @2xl:text-left">
                  <p className="text-[11px] uppercase tracking-[0.45em] text-[var(--primary)]"><F f={`event.${ev.id}.title`}>{ev.title}</F></p>
                  {dt && <p className="tpl-heading mt-2 text-3xl">Vào lúc {dt.time}</p>}
                  {ev.lunarDate && <p className="mt-1 text-sm italic text-[var(--muted)]"><F f={`event.${ev.id}.lunarDate`}>{ev.lunarDate}</F></p>}
                  {ev.venue && <p className="mt-4 font-semibold"><F f={`event.${ev.id}.venue`}>{ev.venue}</F></p>}
                  {ev.address && <p className="text-sm text-[var(--muted)]"><F f={`event.${ev.id}.address`}>{ev.address}</F></p>}
                  <div className="mt-5 flex justify-center @2xl:justify-start">
                    <EventLinks ev={ev} data={data} />
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

export function HeritageStory({ tpl, data }: P) {
  if (!data.story.length) return null;
  return (
    <Section id="chuyen-tinh" tone="surface">
      <SectionTitle tpl={tpl} eyebrow="Duyên phận" title="Chuyện tình" />
      <div className="grid gap-10 @3xl:grid-cols-3">
        {data.story.map((st, i) => (
          <Reveal key={st.id} delay={i * 120} className="text-center">
            <div className="border-[3px] border-double border-[var(--primary)]/50 p-2">
              <Img fk={`story.${st.id}`} src={st.photo} alt={st.title} className="aspect-[4/5] w-full" />
            </div>
            <p className="mt-5 text-[11px] uppercase tracking-[0.4em] text-[var(--primary)]"><F f={`story.${st.id}.date`}>{st.date}</F></p>
            <h3 className="tpl-heading mt-2 text-2xl uppercase tracking-[0.1em]"><F f={`story.${st.id}.title`}>{st.title}</F></h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]"><F f={`story.${st.id}.content`}>{st.content}</F></p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
