"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { fontFamily } from "@/lib/fonts";
import { fieldFontsUrl, fieldTypoCss } from "@/lib/fieldTypo";
import { initials, type InvitationData } from "@/lib/invitation";
import { fontUrl, getTemplateDef } from "./registry";
import { Hero } from "./heroes";
import type { IconName } from "./icons";
import { Faq, FloatingDock, Gallery, GateFold, MusicButton, RsvpForm, useMusic, Wishes, type WishItem } from "./interactive";
import { FallingEffect, isImmersive, Marquee, ModeContext, ScrollProgress, type ViewMode } from "./motion";
import { FramesContext, formatDate, Section, SectionTitle, TplContext } from "./parts";
import { resolveMusic } from "./music/tracks";
import { useFitHeroNames } from "./fit";
import { accessiblePrimary } from "./palettes";
import { GiftBox } from "./GiftFlow";
import { CalendarSection, Couple, DressCode, Events, Families, FeaturePhoto, QuoteSection, Schedule, Story, ThankYou, VideoSection } from "./sections";

type Props = {
  templateId: string;
  data: InvitationData;
  slug: string;
  mode?: ViewMode;
  guestName?: string;
  wishes?: WishItem[];
};

export function InvitationView({ templateId, data, slug, mode = "live", guestName, wishes = [] }: Props) {
  const base = getTemplateDef(templateId);
  // Font riêng chọn trong trình soạn thảo thay cho font của mẫu
  const tpl = useMemo(
    () => ({
      ...base,
      fonts: {
        heading: fontFamily(data.fontHeading) || base.fonts.heading,
        body: fontFamily(data.fontBody) || base.fonts.body,
        script: fontFamily(data.fontScript) || base.fonts.script,
      },
    }),
    [base, data.fontHeading, data.fontBody, data.fontScript],
  );
  const rootRef = useRef<HTMLDivElement>(null);
  // Kiểu chữ riêng từng ô: cùng một CSS cho bản xem trước và trang công khai
  const fieldStyles = data.fieldStyles;
  const fieldCss = useMemo(() => (fieldStyles ? fieldTypoCss(fieldStyles) : ""), [fieldStyles]);
  const fieldFonts = useMemo(() => (fieldStyles ? fieldFontsUrl(fieldStyles) : ""), [fieldStyles]);
  useFitHeroNames(rootRef, data.nameScale || 1, mode === "thumb", [templateId, data.groom.name, data.bride.name, tpl.fonts.heading, tpl.fonts.script, fieldCss]);
  const c = tpl.colors;
  // màu chủ đạo + chữ trên nút luôn đủ tương phản (WCAG) với mọi bảng màu / màu tự chọn
  const { primary, onPrimary } = useMemo(() => accessiblePrimary(data.primaryColor || c.primary, c.bg, c.onPrimary, c.text), [data.primaryColor, c.primary, c.bg, c.onPrimary, c.text]);
  const [opened, setOpened] = useState(!isImmersive(mode));
  // trong trình soạn thảo đã có trình nghe thử riêng
  const music = useMusic(mode === "live" || mode === "demo" ? resolveMusic(data, tpl.id) : null);
  const s = data.sections;
  const date = formatDate(data.weddingDate);
  const monogram = initials(data.groom.name, data.bride.name).split("").join("·");
  const effect = data.effect || tpl.effect;

  const style = {
    "--bg": c.bg,
    "--surface": c.surface,
    "--text": c.text,
    "--muted": c.muted,
    "--primary": primary,
    "--accent": c.accent,
    "--on-primary": onPrimary,
    "--hero-bg": c.heroBg,
    "--hero-text": c.heroText,
    "--f-heading": tpl.fonts.heading,
    "--f-body": tpl.fonts.body,
    "--f-script": tpl.fonts.script,
    "--text-scale": data.textScale || 1,
  } as CSSProperties;
  const textScaled = (data.textScale || 1) !== 1 ? "" : undefined;

  const P = { tpl, data };

  // Ảnh thu nhỏ trong kho mẫu: chỉ cần phần đầu thiệp
  if (mode === "thumb") {
    return (
      <FramesContext.Provider value={data.frames ?? {}}>
      <ModeContext.Provider value="thumb">
        <div ref={rootRef} style={style} className="tpl-root @container bg-[var(--bg)] text-[var(--text)]">
          <link rel="stylesheet" href={fontUrl(tpl)} precedence="default" />
          {fieldFonts && <link rel="stylesheet" href={fieldFonts} precedence="default" />}
          {fieldCss && <style>{fieldCss}</style>}
          <Hero tpl={tpl} data={data} />
        </div>
      </ModeContext.Provider>
      </FramesContext.Provider>
    );
  }

  type DockItem = { id: string; label: string; icon: IconName; show: boolean };
  const dock = (
    [
      { id: "dau-thiep", label: "Đầu", icon: "home", show: true },
      { id: "su-kien", label: "Sự kiện", icon: "calendar", show: s.events },
      { id: "album", label: "Album", icon: "camera", show: s.gallery && data.gallery.length > 0 },
      { id: "xac-nhan", label: "Tham dự", icon: "mail", show: s.rsvp },
      { id: "mung-cuoi", label: "Mừng cưới", icon: "gift", show: s.gift && data.gifts.length > 0 },
    ] satisfies DockItem[]
  ).filter((d) => d.show);

  return (
    <FramesContext.Provider value={data.frames ?? {}}>
    <ModeContext.Provider value={mode}>
    <TplContext.Provider value={tpl}>
      <div ref={rootRef} style={style} data-text-scale={textScaled} data-gate={opened ? "open" : "closed"} className="tpl-root @container min-h-full overflow-x-clip bg-[var(--bg)] text-[var(--text)] antialiased">
        <link rel="stylesheet" href={fontUrl(tpl)} precedence="default" />
        {fieldFonts && <link rel="stylesheet" href={fieldFonts} precedence="default" />}
        {fieldCss && <style>{fieldCss}</style>}

        <GateFold
          monogram={initials(data.groom.name, data.bride.name)}
          groom={data.groom.name}
          bride={data.bride.name}
          dateText={date?.short ?? ""}
          guestName={guestName}
          onOpen={() => {
            setOpened(true);
            music.play();
          }}
        />
        {isImmersive(mode) && <ScrollProgress />}
        <FallingEffect kind={effect} color={primary} />

        <div id="dau-thiep">
          <Hero tpl={tpl} data={data} guestName={guestName} />
        </div>

        {/* Dải chữ chạy */}
        <div className="border-y border-[var(--primary)]/20 py-4 text-[var(--primary)]">
          <Marquee
            duration={36}
            staticContent={
              <p className="tpl-heading px-5 text-center text-lg uppercase leading-relaxed tracking-[0.3em]">
                {data.groom.name} & {data.bride.name}
                {date ? ` ✦ ${date.short}` : ""}
                {data.headline ? ` ✦ ${data.headline}` : ""}
              </p>
            }
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="tpl-heading flex items-center gap-8 pr-8 text-lg uppercase tracking-[0.35em] whitespace-nowrap">
                <span>
                  {data.groom.name} & {data.bride.name}
                </span>
                <span aria-hidden>✦</span>
                <span>{date?.short ?? data.headline}</span>
                <span aria-hidden>✦</span>
                <span>{data.headline}</span>
                <span aria-hidden>✦</span>
              </span>
            ))}
          </Marquee>
        </div>

        {s.quote && <QuoteSection {...P} />}
        {s.families && <Families {...P} />}
        {s.couple && <Couple {...P} />}
        {s.calendar && <CalendarSection {...P} />}
        {s.events && <Events {...P} />}
        {s.schedule && <Schedule {...P} />}
        {s.story && <Story {...P} />}

        <FeaturePhoto src={data.featurePhoto} position={data.photoPos.feature} title="Forever starts here" subtitle={date ? `${date.day} · ${date.month} · ${date.year}` : undefined} />

        {s.gallery && data.gallery.length > 0 && (
          <Section id="album" wide>
            <SectionTitle tpl={tpl} eyebrow="Moments" title="Album ảnh cưới" intro="Chạm vào ảnh bất kỳ để xem toàn màn hình." />
            <Gallery images={data.gallery} />
          </Section>
        )}

        {s.video && <VideoSection {...P} />}
        {s.dresscode && <DressCode {...P} />}

        {s.rsvp && (
          <Section tone="hero" id="xac-nhan">
            <SectionTitle tpl={tpl} eyebrow="R.S.V.P" title="Bạn sẽ đến chứ?" intro="Vui lòng xác nhận để chúng mình chuẩn bị chu đáo nhất cho bạn." light />
            <RsvpForm slug={slug} mode={mode} />
          </Section>
        )}

        {s.gift && data.gifts.length > 0 && (
          <Section id="mung-cuoi">
            <SectionTitle tpl={tpl} eyebrow="Wedding gift" title="Hộp mừng cưới" intro="Sự hiện diện của bạn đã là món quà lớn nhất. Nếu muốn gửi thêm lời chúc phúc, bạn có thể dùng thông tin dưới đây." />
            <GiftBox gifts={data.gifts} slug={slug} mode={mode} groomName={data.groom.name} brideName={data.bride.name} />
          </Section>
        )}

        {s.faq && data.faqs.length > 0 && (
          <Section tone="surface" id="hoi-dap">
            <SectionTitle tpl={tpl} eyebrow="Q & A" title="Những điều bạn cần biết" />
            <Faq items={data.faqs} />
          </Section>
        )}

        {s.wishes && (
          <Section id="loi-chuc" wide>
            <SectionTitle tpl={tpl} eyebrow="Guestbook" title="Sổ lưu bút" intro="Để lại vài dòng — chúng mình sẽ đọc từng lời một." />
            <Wishes slug={slug} mode={mode} initial={wishes} />
          </Section>
        )}

        <ThankYou {...P} monogram={monogram} />

        {isImmersive(mode) && <FloatingDock items={dock} />}
        {music.enabled && <MusicButton playing={music.playing} onClick={music.toggle} />}
      </div>
    </TplContext.Provider>
    </ModeContext.Provider>
    </FramesContext.Provider>
  );
}
