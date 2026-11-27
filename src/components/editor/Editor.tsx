"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  mapEmbedUrl,
  giftQrUrl,
  EFFECT_LABELS,
  NAME_SCALE_RANGE,
  TEXT_SCALE_RANGE,
  SECTION_LABELS,
  type EffectKind,
  uid,
  type GiftAccount,
  type InvitationData,
  type Person,
  type SectionKey,
  type StoryItem,
  type WeddingEvent,
} from "@/lib/invitation";
import { getTemplateDef } from "@/templates/registry";
import { InvitationView } from "@/templates/InvitationView";
import { Field, ImageField, ListItem, move, TextArea, TextInput, UploadButton } from "./fields";
import { MusicField } from "./MusicField";
import { FontPicker } from "@/components/admin/FontPicker";
import { fontName } from "@/lib/fonts";
import { PHOTO_SPECS, PhotoField } from "./PhotoField";
import { InvitationFrameEditor } from "./InvitationFrameEditor";
import { setFrame, viewPos, type ImgFrame } from "@/lib/imageFrame";
import { FieldTypoBar, FieldTypoContext, useMeasuredField } from "./FieldTypo";
import { BankSelect } from "./BankSelect";
import { findBank } from "@/lib/vnBanks";
import { clampFieldSize, fieldLabel, setFieldStyle, type FieldStyle } from "@/lib/fieldTypo";
import type { LibraryTrack } from "@/lib/settings";

type TemplateOption = { id: string; name: string; category: string; isPremium: boolean };

type Props = {
  id: string;
  initial: { templateId: string; slug: string; status: string; data: InvitationData };
  templates: TemplateOption[];
  canUsePremium: boolean;
  musicLibrary: LibraryTrack[];
};

const TABS = [
  ["couple", "Cô dâu & chú rể"],
  ["invite", "Lời mời"],
  ["events", "Sự kiện"],
  ["story", "Chuyện tình"],
  ["gallery", "Album"],
  ["more", "Lịch trình & thêm"],
  ["gift", "Mừng cưới"],
  ["design", "Giao diện"],
  ["publish", "Xuất bản"],
] as const;
type Tab = (typeof TABS)[number][0];

/** Thanh kéo cỡ chữ (phần trăm so với mẫu), có nút về mặc định. */
function ScaleSlider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const v = value || 1;
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <span className="flex items-center gap-2">
          <span className="tabular-nums text-zinc-600">{Math.round(v * 100)}%</span>
          {v !== 1 && (
            <button type="button" className="text-xs text-brand underline" onClick={() => onChange(1)}>
              Về mặc định
            </button>
          )}
        </span>
      </div>
      <input type="range" min={min} max={max} step={0.05} value={v} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-[#7b2d26]" aria-label={label} />
    </div>
  );
}

export function Editor({ id, initial, templates, canUsePremium, musicLibrary }: Props) {
  const [tab, setTab] = useState<Tab>("couple");
  const [templateId, setTemplateId] = useState(initial.templateId);
  const [slug, setSlug] = useState(initial.slug);
  const [status, setStatus] = useState(initial.status);
  const [data, setData] = useState<InvitationData>(initial.data);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [savedSlug, setSavedSlug] = useState(initial.slug);
  // Ô đang chọn để chỉnh font/cỡ chữ riêng (ID ổn định, xem src/lib/fieldTypo.ts)
  const [tfSel, setTfSel] = useState("");
  // Chỉnh ảnh thủ công: vị trí đang mở + bản nháp để khung xem trước cập nhật ngay khi kéo
  const [frameEdit, setFrameEdit] = useState<{ key: string; src: string; title: string } | null>(null);
  const [frameDraft, setFrameDraft] = useState<ImgFrame | null | undefined>(undefined);
  const previewRef = useRef<HTMLDivElement>(null);

  const patch = useCallback((fn: (d: InvitationData) => InvitationData) => {
    setData((d) => fn(d));
    setDirty(true);
  }, []);
  const set = <K extends keyof InvitationData>(k: K, v: InvitationData[K]) => patch((d) => ({ ...d, [k]: v }));
  const setPerson = (who: "groom" | "bride", k: keyof Person, v: string) =>
    patch((d) => ({ ...d, [who]: { ...d[who], [k]: v } }));

  function updateList<K extends "events" | "story" | "gifts" | "schedule" | "faqs">(key: K, i: number, p: Partial<InvitationData[K][number]>) {
    patch((d) => ({ ...d, [key]: (d[key] as object[]).map((x, j) => (j === i ? { ...x, ...p } : x)) }));
  }
  function removeFrom<K extends "events" | "story" | "gifts" | "gallery" | "schedule" | "faqs">(key: K, i: number) {
    patch((d) => ({ ...d, [key]: (d[key] as unknown[]).filter((_, j) => j !== i) }));
  }
  function moveIn<K extends "events" | "story" | "gifts" | "gallery" | "schedule" | "faqs">(key: K, i: number, dir: -1 | 1) {
    patch((d) => ({ ...d, [key]: move(d[key] as unknown[], i, dir) }));
  }

  const save = useCallback(
    async (override?: { status?: string }) => {
      setSaving(true);
      setMessage(null);
      const nextStatus = override?.status ?? status;
      const res = await fetch(`/api/invitations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, slug, status: nextStatus, data }),
      });
      const json = await res.json().catch(() => ({}));
      setSaving(false);
      if (res.ok) {
        setStatus(nextStatus);
        setDirty(false);
        setSavedSlug(slug);
        setMessage({ ok: true, text: "Đã lưu ✓" });
        setTimeout(() => setMessage(null), 2000);
      } else setMessage({ ok: false, text: json.error ?? "Lưu thất bại" });
    },
    [id, templateId, slug, status, data],
  );

  // Ctrl/Cmd + S để lưu, cảnh báo khi rời trang chưa lưu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [save, dirty]);

  const tplDef = getTemplateDef(templateId);

  /** Mở bộ chỉnh ảnh cho một vị trí; cuộn bản xem trước tới chỗ ảnh đó. */
  const openFrame = (key: string, src: string, title: string) => {
    setFrameDraft(undefined);
    setFrameEdit({ key, src, title });
    requestAnimationFrame(() => previewRef.current?.querySelector<HTMLElement>(`[data-fk="${CSS.escape(key)}"]`)?.scrollIntoView({ block: "center" }));
  };
  const framed = (key: string) => Boolean(data.frames?.[key]);
  const applyFrame = (key: string, f: ImgFrame | null) =>
    patch((d) => {
      const next = { ...d, frames: setFrame(d.frames, key, f) };
      // ảnh nền cũ đọc photoPos: giữ điểm căn đồng bộ để chỗ nào chưa đọc frames vẫn đúng
      if (key === "cover" || key === "feature" || key === "thanks") next.photoPos = { ...d.photoPos, [key]: f ? viewPos(f) : "50% 50%" };
      return next;
    });
  const previewData = frameEdit && frameDraft !== undefined ? { ...data, frames: setFrame(data.frames, frameEdit.key, frameDraft) } : data;

  const fieldStyles = data.fieldStyles;
  const setFieldTypo = (id: string, p: FieldStyle | null) => patch((d) => ({ ...d, fieldStyles: setFieldStyle(d.fieldStyles ?? {}, id, p) }));
  const selectField = useCallback((id: string, from: "form" | "preview") => {
    setTfSel(id);
    if (from !== "form") return;
    // chọn từ ô nhập: cuộn bản xem trước tới chỗ ô đó trên thiệp
    requestAnimationFrame(() => previewRef.current?.querySelector<HTMLElement>(`[data-tf="${id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
  }, []);
  const tfCtx = useMemo(() => ({ selected: tfSel, styled: (id: string) => Boolean(fieldStyles?.[id]), select: selectField }), [tfSel, fieldStyles, selectField]);
  const measured = useMeasuredField(previewRef, tfSel, [templateId, data, showPreview]);

  return (
    <FieldTypoContext.Provider value={tfCtx}>
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Thanh công cụ */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-4 py-2">
        <Link href="/admin/invitations" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Thiệp đã làm
        </Link>
        <span className="mx-2 hidden text-zinc-300 sm:inline">|</span>
        <span className="hidden text-sm font-semibold sm:inline">
          {data.groom.name} & {data.bride.name}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}
        >
          {status === "PUBLISHED" ? "Đã xuất bản" : "Nháp"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {message && <span className={`text-sm ${message.ok ? "text-emerald-600" : "text-red-600"}`}>{message.text}</span>}
          {dirty && !message && <span className="text-xs text-amber-600">● Chưa lưu</span>}
          <button className="btn btn-outline lg:hidden" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? "Chỉnh sửa" : "Xem trước"}
          </button>
          <Link href={`/w/${savedSlug}?preview=1`} target="_blank" className="btn btn-outline hidden sm:inline-flex">
            Mở thiệp ↗
          </Link>
          <button className="btn btn-primary" disabled={saving} onClick={() => save()}>
            {saving ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </div>

      {tfSel && (
        <FieldTypoBar
          label={fieldLabel(tfSel, data)}
          value={fieldStyles?.[tfSel]}
          base={measured}
          sample={measured?.text || "Minh Khang & Bảo Ngọc — Trân trọng kính mời"}
          onChange={(p) => setFieldTypo(tfSel, p)}
          onStep={(delta, from) =>
            patch((d) => {
              const cur = d.fieldStyles?.[tfSel]?.size ?? from;
              return { ...d, fieldStyles: setFieldStyle(d.fieldStyles ?? {}, tfSel, { size: clampFieldSize(cur + delta) }) };
            })
          }
          onClose={() => setTfSel("")}
        />
      )}

      <div className="flex min-h-0 flex-1">
        {/* Cột trái: form */}
        <div className={`flex min-h-0 w-full flex-col border-r border-zinc-200 bg-white lg:w-[480px] ${showPreview ? "hidden lg:flex" : "flex"}`}>
          <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 px-2 py-2">
            {TABS.map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm ${tab === k ? "bg-brand text-white" : "hover:bg-zinc-100"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {tab === "couple" &&
              (["groom", "bride"] as const).map((who) => (
                <fieldset key={who} className="space-y-3 rounded-xl border border-zinc-200 p-4">
                  <legend className="px-2 font-semibold">{who === "groom" ? "Chú rể" : "Cô dâu"}</legend>
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput tf={`${who}.name`} label="Tên gọi" value={data[who].name} onChange={(v) => setPerson(who, "name", v)} />
                    <TextInput tf={`${who}.fullName`} label="Họ tên đầy đủ" value={data[who].fullName} onChange={(v) => setPerson(who, "fullName", v)} />
                    <TextInput tf={`${who}.parents`} label="Bố" value={data[who].father} placeholder="Ông …" onChange={(v) => setPerson(who, "father", v)} />
                    <TextInput tf={`${who}.parents`} label="Mẹ" value={data[who].mother} placeholder="Bà …" onChange={(v) => setPerson(who, "mother", v)} />
                  </div>
                  <TextInput tf={`${who}.address`} label="Địa chỉ gia đình" value={data[who].address} onChange={(v) => setPerson(who, "address", v)} />
                  <TextArea tf={`${who}.bio`} label="Giới thiệu ngắn" value={data[who].bio} onChange={(v) => setPerson(who, "bio", v)} rows={2} />
                  <ImageField label="Ảnh" value={data[who].photo} onChange={(v) => setPerson(who, "photo", v)} onFrame={() => openFrame(`${who}.photo`, data[who].photo, who === "groom" ? "Chỉnh ảnh chú rể" : "Chỉnh ảnh cô dâu")} framed={framed(`${who}.photo`)} />
                </fieldset>
              ))}

            {tab === "invite" && (
              <>
                <TextInput tf="headline" label="Dòng tiêu đề" value={data.headline} onChange={(v) => set("headline", v)} placeholder="Save the Date" />
                <TextInput
                  tf="weddingDate"
                  label="Ngày giờ cưới chính"
                  type="datetime-local"
                  value={data.weddingDate}
                  onChange={(v) => set("weddingDate", v)}
                  hint="Dùng cho phần đếm ngược và hiển thị ở đầu thiệp"
                />
                <PhotoField
                  label="Ảnh bìa"
                  value={data.coverPhoto}
                  onChange={(v) => set("coverPhoto", v)}
                  position={data.photoPos.cover}
                  onPositionChange={(v) => set("photoPos", { ...data.photoPos, cover: v })}
                  spec={PHOTO_SPECS.cover}
                  onFrame={() => openFrame("cover", data.coverPhoto, "Chỉnh ảnh bìa")}
                  framed={framed("cover")}
                />
                <TextArea tf="invitationText" label="Lời mời" value={data.invitationText} onChange={(v) => set("invitationText", v)} rows={4} />
                <TextArea tf="quote.text" label="Câu trích dẫn" value={data.quote.text} onChange={(v) => set("quote", { ...data.quote, text: v })} rows={2} />
                <TextInput tf="quote.author" label="Tác giả trích dẫn" value={data.quote.author} onChange={(v) => set("quote", { ...data.quote, author: v })} />
                <PhotoField
                  label="Ảnh tràn màn hình (giữa thiệp)"
                  value={data.featurePhoto}
                  onChange={(v) => set("featurePhoto", v)}
                  position={data.photoPos.feature}
                  onPositionChange={(v) => set("photoPos", { ...data.photoPos, feature: v })}
                  spec={PHOTO_SPECS.feature}
                  onFrame={() => openFrame("feature", data.featurePhoto, "Chỉnh ảnh tràn màn hình")}
                  framed={framed("feature")}
                />
                <TextArea tf="closingText" label="Lời cảm ơn cuối thiệp" value={data.closingText} onChange={(v) => set("closingText", v)} />
                <PhotoField
                  label="Ảnh nền lời cảm ơn"
                  value={data.thankYouPhoto}
                  onChange={(v) => set("thankYouPhoto", v)}
                  position={data.photoPos.thanks}
                  onPositionChange={(v) => set("photoPos", { ...data.photoPos, thanks: v })}
                  spec={PHOTO_SPECS.thanks}
                  onFrame={() => openFrame("thanks", data.thankYouPhoto, "Chỉnh ảnh nền lời cảm ơn")}
                  framed={framed("thanks")}
                />
              </>
            )}

            {tab === "events" && (
              <>
                {data.events.map((ev: WeddingEvent, i) => (
                  <ListItem
                    key={ev.id}
                    title={ev.title || `Sự kiện ${i + 1}`}
                    onRemove={() => removeFrom("events", i)}
                    onUp={i > 0 ? () => moveIn("events", i, -1) : undefined}
                    onDown={i < data.events.length - 1 ? () => moveIn("events", i, 1) : undefined}
                  >
                    <TextInput tf={`event.${ev.id}.title`} label="Tên sự kiện" value={ev.title} placeholder="Lễ Vu Quy / Lễ Thành Hôn / Tiệc Cưới" onChange={(v) => updateList("events", i, { title: v })} />
                    <TextInput label="Thời gian" type="datetime-local" value={ev.date} onChange={(v) => updateList("events", i, { date: v })} />
                    <TextInput tf={`event.${ev.id}.lunarDate`} label="Ngày âm lịch" value={ev.lunarDate} placeholder="Nhằm ngày … tháng … năm …" onChange={(v) => updateList("events", i, { lunarDate: v })} />
                    <TextInput tf={`event.${ev.id}.venue`} label="Địa điểm" value={ev.venue} placeholder="Nhà hàng / Tư gia" onChange={(v) => updateList("events", i, { venue: v })} />
                    <TextInput tf={`event.${ev.id}.address`} label="Địa chỉ" value={ev.address} onChange={(v) => updateList("events", i, { address: v })} />
                    <TextInput label="Link Google Maps (tuỳ chọn)" value={ev.mapUrl} onChange={(v) => updateList("events", i, { mapUrl: v })} placeholder="https://maps.app.goo.gl/…" hint={ev.mapUrl.trim() && !mapEmbedUrl(ev) ? "Link chưa đúng dạng Google Maps nên thiệp chưa hiện bản đồ." : "Có link: thiệp hiện bản đồ và nút chỉ đường. Để trống: không hiện bản đồ."} />
                  </ListItem>
                ))}
                <button
                  className="btn btn-outline w-full"
                  onClick={() =>
                    set("events", [...data.events, { id: uid(), title: "", date: "", lunarDate: "", venue: "", address: "", mapUrl: "" }])
                  }
                >
                  + Thêm sự kiện
                </button>
              </>
            )}

            {tab === "story" && (
              <>
                {data.story.map((st: StoryItem, i) => (
                  <ListItem
                    key={st.id}
                    title={st.title || `Mốc ${i + 1}`}
                    onRemove={() => removeFrom("story", i)}
                    onUp={i > 0 ? () => moveIn("story", i, -1) : undefined}
                    onDown={i < data.story.length - 1 ? () => moveIn("story", i, 1) : undefined}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <TextInput tf={`story.${st.id}.date`} label="Thời gian" value={st.date} placeholder="Tháng 9, 2019" onChange={(v) => updateList("story", i, { date: v })} />
                      <TextInput tf={`story.${st.id}.title`} label="Tiêu đề" value={st.title} onChange={(v) => updateList("story", i, { title: v })} />
                    </div>
                    <TextArea tf={`story.${st.id}.content`} label="Nội dung" value={st.content} onChange={(v) => updateList("story", i, { content: v })} />
                    <ImageField label="Ảnh" value={st.photo} onChange={(v) => updateList("story", i, { photo: v })} onFrame={() => openFrame(`story.${st.id}`, st.photo, `Chỉnh ảnh · ${st.title || "chuyện tình"}`)} framed={framed(`story.${st.id}`)} />
                  </ListItem>
                ))}
                <button
                  className="btn btn-outline w-full"
                  onClick={() => set("story", [...data.story, { id: uid(), date: "", title: "", content: "", photo: "" }])}
                >
                  + Thêm mốc câu chuyện
                </button>
              </>
            )}

            {tab === "gallery" && (
              <>
                <div className="flex flex-wrap gap-2">
                  <UploadButton accept="image/*" multiple onUploaded={(urls) => set("gallery", [...data.gallery, ...urls])}>
                    Tải nhiều ảnh lên
                  </UploadButton>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      const u = prompt("Dán link ảnh:");
                      if (u) set("gallery", [...data.gallery, u]);
                    }}
                  >
                    + Thêm bằng link
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {data.gallery.map((src, i) => (
                    <div key={src + i} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                      <div className="relative aspect-square bg-zinc-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        {framed(`gallery:${src}`) && <span className="absolute right-1 top-1 rounded bg-white/90 px-1.5 text-[10px] font-semibold text-emerald-700">Đã căn</span>}
                      </div>
                      <div className="grid grid-cols-4 text-xs">
                        <button type="button" className="min-h-9 hover:bg-zinc-100 disabled:opacity-30" disabled={i === 0} onClick={() => moveIn("gallery", i, -1)} aria-label="Đưa lên trước">←</button>
                        <button type="button" className="col-span-2 min-h-9 font-medium hover:bg-zinc-100" onClick={() => openFrame(`gallery:${src}`, src, `Chỉnh ảnh album ${i + 1}`)}>Chỉnh ảnh</button>
                        <button type="button" className="min-h-9 hover:bg-zinc-100 disabled:opacity-30" disabled={i === data.gallery.length - 1} onClick={() => moveIn("gallery", i, 1)} aria-label="Đưa ra sau">→</button>
                        <button
                          type="button"
                          className="col-span-4 min-h-8 border-t border-zinc-100 text-red-600 hover:bg-red-50"
                          onClick={() =>
                            patch((d) => {
                              const gallery = d.gallery.filter((_, j) => j !== i);
                              return { ...d, gallery, frames: gallery.includes(src) ? d.frames : setFrame(d.frames, `gallery:${src}`, null) };
                            })
                          }
                        >
                          Xoá
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {data.gallery.length === 0 && <p className="text-sm text-zinc-500">Chưa có ảnh nào.</p>}
              </>
            )}

            {tab === "more" && (
              <>
                <h3 className="font-semibold">Lịch trình ngày cưới</h3>
                {data.schedule.map((it, i) => (
                  <ListItem
                    key={it.id}
                    title={it.title || `Mốc ${i + 1}`}
                    onRemove={() => removeFrom("schedule", i)}
                    onUp={i > 0 ? () => moveIn("schedule", i, -1) : undefined}
                    onDown={i < data.schedule.length - 1 ? () => moveIn("schedule", i, 1) : undefined}
                  >
                    <div className="grid grid-cols-[6rem_1fr] gap-3">
                      <TextInput tf={`schedule.${it.id}.time`} label="Giờ" value={it.time} placeholder="11:00" onChange={(v) => updateList("schedule", i, { time: v })} />
                      <TextInput tf={`schedule.${it.id}.title`} label="Hoạt động" value={it.title} placeholder="Làm lễ" onChange={(v) => updateList("schedule", i, { title: v })} />
                    </div>
                    <TextInput tf={`schedule.${it.id}.description`} label="Mô tả ngắn" value={it.description} onChange={(v) => updateList("schedule", i, { description: v })} />
                  </ListItem>
                ))}
                <button className="btn btn-outline w-full" onClick={() => set("schedule", [...data.schedule, { id: uid(), time: "", title: "", description: "" }])}>
                  Thêm mốc lịch trình
                </button>

                <hr className="border-zinc-200" />
                <TextInput label="Video YouTube" value={data.videoUrl} placeholder="https://youtu.be/..." onChange={(v) => set("videoUrl", v)} hint="Dán link video pre-wedding trên YouTube" />

                <hr className="border-zinc-200" />
                <h3 className="font-semibold">Gợi ý trang phục</h3>
                <TextArea label="Lời nhắn về trang phục" value={data.dressCode.note} onChange={(v) => set("dressCode", { ...data.dressCode, note: v })} rows={2} />
                <Field label="Bảng màu gợi ý">
                  <div className="flex flex-wrap items-center gap-2">
                    {data.dressCode.colors.map((c, i) => (
                      <div key={i} className="relative">
                        <input
                          type="color"
                          aria-label={`Màu ${i + 1}`}
                          className="h-10 w-10 cursor-pointer rounded-full border border-zinc-300"
                          value={c}
                          onChange={(e) => set("dressCode", { ...data.dressCode, colors: data.dressCode.colors.map((x, j) => (j === i ? e.target.value : x)) })}
                        />
                        <button
                          type="button"
                          aria-label="Xoá màu"
                          className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-white text-xs text-red-600 shadow"
                          onClick={() => set("dressCode", { ...data.dressCode, colors: data.dressCode.colors.filter((_, j) => j !== i) })}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {data.dressCode.colors.length < 6 && (
                      <button type="button" className="btn btn-outline" onClick={() => set("dressCode", { ...data.dressCode, colors: [...data.dressCode.colors, "#ede6dc"] })}>
                        Thêm màu
                      </button>
                    )}
                  </div>
                </Field>

                <hr className="border-zinc-200" />
                <h3 className="font-semibold">Hỏi đáp cho khách</h3>
                {data.faqs.map((f, i) => (
                  <ListItem key={f.id} title={f.q || `Câu hỏi ${i + 1}`} onRemove={() => removeFrom("faqs", i)}>
                    <TextInput tf={`faq.${f.id}.q`} label="Câu hỏi" value={f.q} onChange={(v) => updateList("faqs", i, { q: v })} />
                    <TextArea tf={`faq.${f.id}.a`} label="Trả lời" value={f.a} onChange={(v) => updateList("faqs", i, { a: v })} rows={2} />
                  </ListItem>
                ))}
                <button className="btn btn-outline w-full" onClick={() => set("faqs", [...data.faqs, { id: uid(), q: "", a: "" }])}>
                  Thêm câu hỏi
                </button>
              </>
            )}

            {tab === "gift" && (
              <>
                <p className="text-sm text-zinc-500">Chọn ngân hàng nhận trong danh sách, nhập số tài khoản và tên chủ tài khoản: thiệp tự tạo mã VietQR, không cần tải ảnh QR.</p>
                {data.gifts.map((g: GiftAccount, i) => (
                  <ListItem key={g.id} title={g.label || `Tài khoản ${i + 1}`} onRemove={() => removeFrom("gifts", i)}>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Bên nhận" hint="Khách chọn tab Nhà trai / Nhà gái khi mừng cưới">
                        <select className="input" value={g.side ?? ""} onChange={(e) => updateList("gifts", i, { side: e.target.value as GiftAccount["side"] })}>
                          <option value="">Tự đoán theo tiêu đề</option>
                          <option value="groom">Nhà trai</option>
                          <option value="bride">Nhà gái</option>
                        </select>
                      </Field>
                      <TextInput tf={`gift.${g.id}.label`} label="Tiêu đề" value={g.label} placeholder="Mừng cưới chú rể" onChange={(v) => updateList("gifts", i, { label: v })} />
                    </div>
                    <BankSelect value={g} onChange={(v) => updateList("gifts", i, v)} />
                    <div className="grid grid-cols-2 gap-3">
                      <TextInput tf={`gift.${g.id}.accountNumber`} label="Số tài khoản" value={g.accountNumber} onChange={(v) => updateList("gifts", i, { accountNumber: v.replace(/s/g, "") })} />
                      <TextInput tf={`gift.${g.id}.accountName`} label="Chủ tài khoản" value={g.accountName} onChange={(v) => updateList("gifts", i, { accountName: v.toUpperCase() })} />
                    </div>
                    <GiftQrStatus gift={g} />
                    <ImageField label="Ảnh QR riêng (không bắt buộc, thay cho VietQR tự tạo)" value={g.qrImage} onChange={(v) => updateList("gifts", i, { qrImage: v })} />
                  </ListItem>
                ))}
                <button
                  className="btn btn-outline w-full"
                  onClick={() =>
                    set("gifts", [...data.gifts, { id: uid(), label: "", bankCode: "", bankName: "", accountNumber: "", accountName: "", qrImage: "" }])
                  }
                >
                  + Thêm tài khoản
                </button>
              </>
            )}

            {tab === "design" && (
              <>
                <Field label="Mẫu thiệp">
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map((t) => {
                      const def = getTemplateDef(t.id);
                      const locked = t.isPremium && !canUsePremium && t.id !== initial.templateId;
                      return (
                        <button
                          key={t.id}
                          disabled={locked}
                          onClick={() => {
                            setTemplateId(t.id);
                            setDirty(true);
                          }}
                          className={`relative overflow-hidden rounded-xl border-2 text-left transition ${templateId === t.id ? "border-brand" : "border-zinc-200 hover:border-zinc-300"} ${locked ? "opacity-50" : ""}`}
                        >
                          <div className="flex h-14">
                            {[def.colors.heroBg, def.colors.primary, def.colors.bg, def.colors.accent].map((c, k) => (
                              <span key={k} className="flex-1" style={{ background: c }} />
                            ))}
                          </div>
                          <div className="p-2">
                            <p className="text-sm font-semibold">{t.name}</p>
                            <p className="text-xs text-zinc-500">
                              {t.category}
                              {t.isPremium && " · ★ Premium"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Màu chủ đạo" hint="Để trống để dùng màu gốc của mẫu">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="h-10 w-14 cursor-pointer rounded border border-zinc-300"
                      value={data.primaryColor || tplDef.colors.primary}
                      onChange={(e) => set("primaryColor", e.target.value)}
                    />
                    <span className="font-mono text-sm">{data.primaryColor || tplDef.colors.primary}</span>
                    {data.primaryColor && (
                      <button className="text-sm text-brand underline" onClick={() => set("primaryColor", "")}>
                        Khôi phục
                      </button>
                    )}
                  </div>
                </Field>
                <Field label="Kiểu chữ" hint="Để “Theo mẫu” để giữ font gốc. Tên dài tự thu nhỏ cho vừa màn hình điện thoại.">
                  <div className="space-y-3">
                    <FontPicker label="Font tiêu đề" value={data.fontHeading} onChange={(v) => set("fontHeading", v)} defaultLabel={`Theo mẫu (${fontName(tplDef.fonts.heading)})`} defaultFont={fontName(tplDef.fonts.heading)} kinds={["serif", "sans", "script"]} sample={`${data.groom.name || "Minh Khang"} & ${data.bride.name || "Bảo Ngọc"}`} />
                    <FontPicker label="Font chữ viết tay (tên, lời chúc)" value={data.fontScript} onChange={(v) => set("fontScript", v)} defaultLabel={`Theo mẫu (${fontName(tplDef.fonts.script)})`} defaultFont={fontName(tplDef.fonts.script)} kinds={["script", "serif"]} sample="Save the date · Trân trọng kính mời" />
                    <FontPicker label="Font nội dung" value={data.fontBody} onChange={(v) => set("fontBody", v)} defaultLabel={`Theo mẫu (${fontName(tplDef.fonts.body)})`} defaultFont={fontName(tplDef.fonts.body)} kinds={["sans", "serif"]} sample="Trân trọng kính mời bạn đến dự tiệc cưới của chúng tôi." />
                    <ScaleSlider label="Cỡ chữ tên cô dâu chú rể" value={data.nameScale} min={NAME_SCALE_RANGE.min} max={NAME_SCALE_RANGE.max} onChange={(v) => set("nameScale", v)} />
                    <ScaleSlider label="Cỡ chữ nội dung" value={data.textScale} min={TEXT_SCALE_RANGE.min} max={TEXT_SCALE_RANGE.max} onChange={(v) => set("textScale", v)} />
                  </div>
                </Field>
                <Field label="Hiệu ứng nền">
                  <select className="input" value={data.effect} onChange={(e) => set("effect", e.target.value as EffectKind)}>
                    <option value="">Theo mẫu ({EFFECT_LABELS[tplDef.effect]})</option>
                    {(Object.keys(EFFECT_LABELS) as (keyof typeof EFFECT_LABELS)[]).map((k) => (
                      <option key={k} value={k}>
                        {EFFECT_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </Field>
                <MusicField templateId={templateId} templateName={tplDef.name} data={data} library={musicLibrary} onChange={(m) => patch((d) => ({ ...d, ...m }))} />
                <Field label="Các phần hiển thị trên thiệp">
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(SECTION_LABELS) as SectionKey[]).map((k) => (
                      <label key={k} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={data.sections[k]}
                          onChange={(e) => set("sections", { ...data.sections, [k]: e.target.checked })}
                        />
                        {SECTION_LABELS[k]}
                      </label>
                    ))}
                  </div>
                </Field>
              </>
            )}

            {tab === "publish" && <PublishTab slug={slug} savedSlug={savedSlug} setSlug={(v) => { setSlug(v); setDirty(true); }} status={status} saving={saving} onPublish={(s) => save({ status: s })} />}
          </div>
        </div>

        {/* Cột phải: xem trước */}
        <div className={`min-h-0 flex-1 items-start justify-center overflow-hidden bg-zinc-100 p-4 lg:flex ${showPreview ? "flex" : "hidden"}`}>
          <div className="flex h-full w-full max-w-[430px] flex-col">
            <p className="mb-2 text-center text-xs text-zinc-500">Xem trước · {tplDef.name} · bấm vào chữ để chỉnh font, cỡ chữ</p>
            <div
              ref={previewRef}
              onClickCapture={(e) => {
                // bấm vào chữ trên thiệp để chọn ô đó
                const el = (e.target as HTMLElement).closest<HTMLElement>("[data-tf]");
                if (el?.dataset.tf) selectField(el.dataset.tf, "preview");
              }}
              className="tf-pick relative min-h-0 flex-1 overflow-y-auto rounded-[2rem] border-8 border-zinc-900 bg-white shadow-2xl [transform:translateZ(0)]"
            >
              {tfSel && <style>{`.tf-pick [data-tf="${tfSel}"]{outline:2px dashed #e11d48;outline-offset:3px;border-radius:2px}`}</style>}
              <InvitationView templateId={templateId} data={previewData} slug={slug} mode="preview" guestName="Khách mời" />
            </div>
          </div>
        </div>
      </div>
    </div>
      {frameEdit && (
        <InvitationFrameEditor
          templateId={templateId}
          data={data}
          frameKey={frameEdit.key}
          src={frameEdit.src}
          title={frameEdit.title}
          previewRef={previewRef}
          onDraft={setFrameDraft}
          onClose={() => {
            setFrameEdit(null);
            setFrameDraft(undefined);
          }}
          onApply={(f) => {
            applyFrame(frameEdit.key, f);
            setFrameEdit(null);
            setFrameDraft(undefined);
          }}
        />
      )}
    </FieldTypoContext.Provider>
  );
}

/** Trạng thái mã VietQR của một tài khoản mừng cưới (thiếu gì thì nói rõ). */
function GiftQrStatus({ gift }: { gift: GiftAccount }) {
  if (gift.qrImage) return <p className="text-xs text-zinc-500">Đang dùng ảnh QR riêng đã tải lên. Xoá ảnh để dùng VietQR tự tạo.</p>;
  const missing = [!findBank(gift.bankCode) && "chọn ngân hàng trong danh sách", !/^[0-9A-Za-z]{4,30}$/.test(gift.accountNumber) && "số tài khoản", !gift.accountName.trim() && "tên chủ tài khoản"].filter(Boolean);
  if (!missing.length || giftQrUrl(gift)) return <p className="text-xs font-medium text-emerald-700">✓ Đã tự tạo mã VietQR — xem ở bản xem trước, mục Hộp mừng cưới.</p>;
  return <p className="text-xs text-amber-700">Cần {missing.join(", ")} để tạo mã VietQR.</p>;
}

function PublishTab({
  slug,
  savedSlug,
  setSlug,
  status,
  saving,
  onPublish,
}: {
  slug: string;
  savedSlug: string;
  setSlug: (v: string) => void;
  status: string;
  saving: boolean;
  onPublish: (status: string) => void;
}) {
  const [origin, setOrigin] = useState("");
  const [guest, setGuest] = useState("");
  const [copied, setCopied] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const link = `${origin}/w/${savedSlug}`;
  const guestLink = guest ? `${link}?to=${encodeURIComponent(guest)}` : "";
  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <>
      <Field label="Đường dẫn thiệp" hint="Chữ thường không dấu, số, dấu gạch ngang. Ví dụ: quan-ha-2027">
        <div className="flex items-center rounded-lg border border-zinc-300 bg-zinc-50 pl-3 text-sm">
          <span className="text-zinc-500">/w/</span>
          <input
            className="w-full bg-white px-2 py-2 outline-none"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
          />
        </div>
      </Field>

      <div className="rounded-xl border border-zinc-200 p-4">
        <p className="font-semibold">Trạng thái: {status === "PUBLISHED" ? "🟢 Đang công khai" : "⚪ Bản nháp (chỉ bạn xem được)"}</p>
        <div className="mt-3 flex gap-2">
          {status === "PUBLISHED" ? (
            <button className="btn btn-outline" disabled={saving} onClick={() => onPublish("DRAFT")}>
              Ngừng xuất bản
            </button>
          ) : (
            <button className="btn btn-primary" disabled={saving} onClick={() => onPublish("PUBLISHED")}>
              Lưu & xuất bản
            </button>
          )}
        </div>
      </div>

      <Field label="Link chia sẻ">
        <div className="flex gap-2">
          <input readOnly className="input font-mono" value={link} />
          <button className="btn btn-outline shrink-0" onClick={() => copy(link, "main")}>
            {copied === "main" ? "✓" : "Sao chép"}
          </button>
        </div>
      </Field>

      <Field label="Tạo link mời đích danh" hint="Thiệp sẽ hiển thị “Trân trọng kính mời: …” với tên khách">
        <input className="input" placeholder="Vd: Anh Nam & Gia đình" value={guest} onChange={(e) => setGuest(e.target.value)} />
        {guestLink && (
          <div className="mt-2 flex gap-2">
            <input readOnly className="input font-mono text-xs" value={guestLink} />
            <button className="btn btn-outline shrink-0" onClick={() => copy(guestLink, "guest")}>
              {copied === "guest" ? "✓" : "Sao chép"}
            </button>
          </div>
        )}
      </Field>
    </>
  );
}
