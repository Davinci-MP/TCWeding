"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { demoInvitationData } from "@/lib/invitation";
import { draftToInvitationData, templateCode, templateHash, templateIdFrom, type ThiepDraft } from "@/lib/thiep";
import { getTemplateDef } from "@/templates/registry";
import { InvitationView } from "@/templates/InvitationView";
import { Icon } from "@/templates/icons";
import { HeartIcon, TemplateCard, type TplLite } from "./TemplateCard";
import { TemplateModal } from "./TemplateModal";
import { loadDraft } from "./draftStore";
import { ThiepForm, type ThiepFormProps } from "./ThiepForm";
import { toggleTemplateFavorite, useTemplateFavorites } from "./templateFavorites";

type View = { kind: "gallery" } | { kind: "demo"; id: string } | { kind: "form"; id: string } | { kind: "preview" };

function parseHash(): View {
  const h = decodeURIComponent(window.location.hash.slice(1)).toLowerCase();
  if (!h) return { kind: "gallery" };
  if (h === "xem") return { kind: "preview" };
  if (h === "chon" || h === "dien-thong-tin") return { kind: "form", id: "" };
  if (h.startsWith("chon-")) return { kind: "form", id: templateIdFrom(h.slice(5)) };
  const id = templateIdFrom(h);
  return id ? { kind: "demo", id } : { kind: "gallery" };
}

/** Ẩn header/footer của website khi xem thiệp toàn màn hình. */
function useFullView(on: boolean) {
  useEffect(() => {
    if (on) document.documentElement.dataset.fullview = "1";
    else delete document.documentElement.dataset.fullview;
    return () => {
      delete document.documentElement.dataset.fullview;
    };
  }, [on]);
}

export function ThiepApp({ templates, ...formProps }: { templates: TplLite[] } & Omit<ThiepFormProps, "templates">) {
  const [view, setView] = useState<View | null>(null);
  useEffect(() => {
    const on = () => {
      setView(parseHash());
      window.scrollTo({ top: 0 });
    };
    on();
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  useFullView(view?.kind === "demo" || view?.kind === "preview");

  if (!view) return <div className="min-h-[60svh] bg-[#f6f2ec]" />;
  if (view.kind === "demo") return <LiveDemo id={view.id} />;
  if (view.kind === "preview") return <DraftPreview />;
  if (view.kind === "form") return <ThiepForm templates={templates} initialTemplate={view.id} {...formProps} />;
  return <Gallery templates={templates} />;
}

/* ------------------------------ Thư viện mẫu ------------------------------ */

function Gallery({ templates }: { templates: TplLite[] }) {
  const favs = useTemplateFavorites();
  const [filter, setFilter] = useState("");
  const [color, setColor] = useState("");
  const [design, setDesign] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const categories = useMemo(() => [...new Set(templates.map((t) => t.category))], [templates]);
  const colors = useMemo(() => [...new Set(templates.map((t) => t.color))].sort((a, b) => (a === "Màu gốc" ? -1 : b === "Màu gốc" ? 1 : a.localeCompare(b, "vi"))), [templates]);
  const designs = useMemo(() => [...new Set(templates.map((t) => t.design))], [templates]);
  const list = useMemo(
    () =>
      templates.filter(
        (t) =>
          (filter === "fav" ? favs.includes(t.id) : !filter || t.category === filter) && (!color || t.color === color) && (!design || t.design === design),
      ),
    [filter, color, design, templates, favs],
  );
  const select = "min-h-11 rounded-full border border-white/20 bg-[#1d1a17] px-4 text-sm text-white/85 outline-none focus:border-white/60";
  const onClose = useCallback(() => setOpen(null), []);
  const chip = (active: boolean) =>
    `inline-flex min-h-11 items-center gap-1.5 rounded-full px-5 text-sm font-medium transition ${active ? "bg-[#efe7dc] text-[#1d1a17]" : "border border-white/20 text-white/75 hover:border-white/60 hover:text-white"}`;

  return (
    <>
      <section className="bg-[#1d1a17] px-4 pb-12 pt-16 text-white lg:pt-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-[#d8cdbf]">Thiệp cưới online</p>
          <h1 className="font-serif-display mt-5 max-w-3xl text-5xl leading-[1] sm:text-6xl lg:text-7xl">
            Tự chọn thiệp, <em className="text-[#d8cdbf]">xem ngay thiệp của hai bạn.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            {templates.length} mẫu chạy thật có nhạc nền, đếm ngược, chỉ đường, xác nhận tham dự và hộp mừng cưới. Chọn mẫu, điền thông tin, bấm xem là thấy ngay thiệp mang tên hai bạn. Không cần tạo tài khoản.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#chon" className="inline-flex min-h-12 items-center rounded-full bg-[#d9a0a8] px-6 font-semibold text-[#1d1a17] transition hover:bg-[#e8b6bd]">
              Điền thông tin làm thiệp
            </a>
          </div>
          <nav aria-label="Lọc mẫu thiệp" className="mt-10 flex flex-wrap gap-2">
            <button type="button" onClick={() => setFilter("")} aria-pressed={!filter} className={chip(!filter)}>
              Tất cả ({templates.length})
            </button>
            <button type="button" onClick={() => setFilter("fav")} aria-pressed={filter === "fav"} className={chip(filter === "fav")}>
              <HeartIcon on size={15} /> Đã thích ({favs.filter((id) => templates.some((t) => t.id === id)).length})
            </button>
            {categories.map((c) => (
              <button key={c} type="button" onClick={() => setFilter(c)} aria-pressed={filter === c} className={chip(filter === c)}>
                {c}
              </button>
            ))}
          </nav>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select value={design} onChange={(e) => setDesign(e.target.value)} className={select} aria-label="Lọc theo thiết kế">
              <option value="">Mọi thiết kế ({designs.length})</option>
              {designs.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select value={color} onChange={(e) => setColor(e.target.value)} className={select} aria-label="Lọc theo màu sắc">
              <option value="">Mọi màu sắc ({colors.length})</option>
              {colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {(color || design || filter) && (
              <button
                type="button"
                onClick={() => {
                  setColor("");
                  setDesign("");
                  setFilter("");
                }}
                className="min-h-11 px-3 text-sm text-white/60 underline-offset-4 hover:text-white hover:underline"
              >
                Bỏ lọc
              </button>
            )}
            <span className="text-sm text-white/50">{list.length} mẫu</span>
          </div>
        </div>
      </section>
      <section className="bg-[#f6f2ec] px-4 py-12 lg:py-16">
        <div className="mx-auto max-w-6xl">
          {list.length ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((t, i) => (
                <li key={t.id}>
                  <TemplateCard t={t} onOpen={() => setOpen(i)} height={340} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-16 text-center text-zinc-600">{filter === "fav" ? "Bạn chưa thả tim mẫu nào. Bấm ♡ trên mẫu bạn thích để lưu lại, lần sau quay lại vẫn còn." : "Chưa có mẫu trong mục này."}</p>
          )}
        </div>
      </section>
      {open !== null && list[open] && <TemplateModal list={list} index={open} onIndex={setOpen} onClose={onClose} />}
    </>
  );
}

/* ------------------------------ Thiệp chạy thật ------------------------------ */

function FloatingBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 top-3 z-[80] flex justify-center px-3">
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-[#1d1a17]/90 p-1.5 text-sm text-white shadow-xl ring-1 ring-white/10 backdrop-blur">{children}</div>
    </div>
  );
}

function LiveDemo({ id }: { id: string }) {
  const favs = useTemplateFavorites();
  const liked = favs.includes(id);
  const tpl = getTemplateDef(id);
  const data = useMemo(() => demoInvitationData(tpl.demoCover), [tpl.demoCover]);
  return (
    <>
      <FloatingBar>
        <a href="#" className="flex min-h-10 items-center gap-1 whitespace-nowrap rounded-full px-3 hover:bg-white/10" aria-label="Quay lại tất cả mẫu">
          <Icon name="left" size={16} /> Mẫu
        </a>
        <span className="whitespace-nowrap px-2 font-semibold">{templateCode(id)}</span>
        <button type="button" onClick={() => toggleTemplateFavorite(id)} aria-pressed={liked} aria-label={liked ? "Bỏ thích mẫu này" : "Thả tim mẫu này"} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${liked ? "bg-white text-[#c0392b]" : "hover:bg-white/10"}`}>
          <HeartIcon on={liked} />
        </button>
        <a href={`#chon-${templateHash(id)}`} className="flex min-h-10 items-center whitespace-nowrap rounded-full bg-[#d9a0a8] px-4 font-semibold text-[#1d1a17]">
          Chọn mẫu này
        </a>
      </FloatingBar>
      <InvitationView key={id} templateId={id} data={data} slug="demo" mode="demo" guestName="Anh Nam & Gia đình" />
    </>
  );
}

function DraftPreview() {
  const [draft, setDraft] = useState<ThiepDraft | null>(null);
  useEffect(() => setDraft(loadDraft()), []);
  if (!draft) return <div className="min-h-svh bg-[#f6f2ec]" />;
  if (!draft.templateId)
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[#f6f2ec] px-4 text-center">
        <p className="font-serif-display text-3xl">Bạn chưa chọn mẫu thiệp.</p>
        <a href="#chon" className="btn btn-primary">
          Điền thông tin làm thiệp
        </a>
      </div>
    );
  const data = draftToInvitationData(draft, { demoPhotos: true });
  return (
    <>
      <FloatingBar>
        <a href={`#chon-${templateHash(draft.templateId)}`} className="flex min-h-10 items-center gap-1 whitespace-nowrap rounded-full px-3 hover:bg-white/10">
          <Icon name="left" size={16} /> Sửa thông tin
        </a>
        <span className="whitespace-nowrap px-2 text-white/70">Bản xem trước{draft.photos.length ? "" : " · ảnh minh hoạ"}</span>
        <a href={`#chon-${templateHash(draft.templateId)}`} onClick={() => sessionStorage.setItem("tcw-thiep-jump", "gui")} className="flex min-h-10 items-center whitespace-nowrap rounded-full bg-[#d9a0a8] px-4 font-semibold text-[#1d1a17]">
          Gửi cho studio
        </a>
      </FloatingBar>
      <InvitationView templateId={draft.templateId} data={data} slug="preview" mode="demo" guestName="Bạn" />
    </>
  );
}
