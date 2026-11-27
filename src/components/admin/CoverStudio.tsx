"use client";

// Ảnh bìa của một mẫu trong kho mẫu: chọn ảnh công khai (album studio đã xuất bản) hoặc tải ảnh đã chuẩn bị,
// căn ảnh đúng khung ảnh bìa của thumbnail, xem trước lưới kho mẫu trên điện thoại / máy tính, rồi "Lưu ảnh bìa".
// Chỉ đổi TemplateConfig.coverUrl/coverFrame của mẫu: thiệp khách, mã TC, thứ tự mẫu không đổi.

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  resetTemplateCoverAction,
  saveTemplateCoverAction,
} from "@/app/actions/showcase";
import { TemplateThumb } from "@/components/TemplateThumb";
import { FrameEditor, type FrameTarget } from "@/components/frame/FrameEditor";
import { measureTarget } from "@/components/editor/InvitationFrameEditor";
import type { ImgFrame } from "@/lib/imageFrame";
import { demoInvitationData } from "@/lib/invitation";
import { uploadPhoto } from "@/lib/resizeImage";
import type { CoverHistoryItem, TemplateCover } from "@/lib/templateCover";
import { templateCode } from "@/lib/thiep";
import { getTemplateDef } from "@/templates/registry";
import { InvitationView } from "@/templates/InvitationView";

export type CoverCandidate = { url: string; label: string };

/** Kích thước thật của thẻ mẫu ở /thiep: lưới 2 cột trên điện thoại (375px), 4 cột trên máy tính; ảnh cao 340px. */
const GRID = {
  mobile: { width: 375, cols: 2, gap: 16, pad: 16 },
  desktop: { width: 1152, cols: 4, gap: 16, pad: 0 },
} as const;
const THUMB_H = 340;
/** Cạnh dài tối đa của ảnh bìa lưu cho kho mẫu: đủ nét cho thumbnail (màn hình 2x) và phần đầu bản giới thiệu, nhẹ hơn ảnh gốc nhiều lần. */
const COVER_MAX = 1200;

function MiniCard({
  id,
  cover,
  highlight,
  width,
}: {
  id: string;
  cover?: TemplateCover | null;
  highlight?: boolean;
  width: number;
}) {
  const t = getTemplateDef(id);
  return (
    <div style={{ width }} className="shrink-0">
      <div
        className={`overflow-hidden rounded-2xl bg-white shadow-sm ${highlight ? "ring-4 ring-rose-400 ring-offset-2" : ""}`}
      >
        <TemplateThumb templateId={id} height={THUMB_H} cover={cover} />
      </div>
      <p className="mt-3 text-sm font-semibold tracking-wide text-[#1d1a17]">
        {templateCode(id)}
      </p>
      <p className="mt-0.5 line-clamp-1 text-sm text-zinc-600">
        {t.category} · {t.name}
      </p>
    </div>
  );
}

/** Lưới kho mẫu thu nhỏ đúng kích thước thật (bề ngang thật rồi scale cho vừa khung xem trước). */
function GridPreview({
  device,
  templateId,
  neighbors,
  cover,
  boxWidth: maxW,
}: {
  device: "mobile" | "desktop";
  templateId: string;
  neighbors: string[];
  cover: TemplateCover | null;
  boxWidth: number;
}) {
  const g = GRID[device];
  const wrap = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState(maxW);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setBoxWidth(Math.max(200, Math.min(maxW, e.contentRect.width))),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxW]);
  const colW = (g.width - g.pad * 2 - g.gap * (g.cols - 1)) / g.cols;
  const ids = [templateId, ...neighbors].slice(
    0,
    g.cols * (device === "mobile" ? 2 : 1),
  );
  const scale = Math.min(1, boxWidth / g.width);
  const innerH = (THUMB_H + 64) * Math.ceil(ids.length / g.cols) + g.gap * 2;
  return (
    <div ref={wrap} className="w-full">
      <div
        style={{ width: g.width * scale, height: innerH * scale }}
        className="overflow-hidden rounded-xl border border-zinc-200 bg-[#f6f2ec]"
      >
        <div
          style={{
            width: g.width,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            padding: `${g.gap}px ${g.pad}px`,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${g.cols}, ${colW}px)`,
              columnGap: g.gap,
              rowGap: 32,
            }}
          >
            {ids.map((id) => (
              <MiniCard
                key={id}
                id={id}
                width={colW}
                cover={id === templateId ? cover : undefined}
                highlight={id === templateId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CoverStudio({
  templateId,
  current,
  history,
  candidates,
  neighbors,
}: {
  templateId: string;
  current: TemplateCover | null;
  history: CoverHistoryItem[];
  candidates: CoverCandidate[];
  /** Các mẫu đứng cạnh trong kho mẫu (để xem trước lưới). */
  neighbors: string[];
}) {
  const router = useRouter();
  const tpl = getTemplateDef(templateId);
  const [src, setSrc] = useState(current?.url ?? "");
  const [frame, setFrame] = useState<ImgFrame | null>(current?.frame ?? null);
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState<FrameTarget | null>(null);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const probe = useRef<HTMLDivElement>(null);
  const beforeEdit = useRef<ImgFrame | null>(null);
  const draft: TemplateCover | null = src ? { url: src, frame } : null;
  const dirty =
    (current?.url ?? "") !== src ||
    JSON.stringify(current?.frame ?? null) !== JSON.stringify(frame);

  // đo khung ảnh bìa trong thumbnail (thiệp 400px, phần đầu cao 680px — y như TemplateThumb)
  useEffect(() => {
    let alive = true;
    const run = () =>
      alive &&
      setTarget(measureTarget(probe.current, "cover") ?? { aspect: 400 / 680 });
    const t = setTimeout(run, 400);
    document.fonts?.ready.then(() => setTimeout(run, 200));
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [templateId]);

  const pick = (url: string) => {
    if (url !== src) setFrame(null); // cách căn của ảnh cũ không còn đúng
    setSrc(url);
    setMsg("");
  };

  const save = () =>
    start(async () => {
      if (!src) return;
      let url = src;
      // ảnh album là ảnh gốc (vài trăm KB – vài MB): lưu một bản thu nhỏ riêng cho kho mẫu để thumbnail tải nhanh
      if (candidates.some((c) => c.url === src)) {
        try {
          const blob = await fetch(src).then((res) => (res.ok ? res.blob() : Promise.reject(new Error(String(res.status)))));
          url = (await uploadPhoto(new File([blob], "cover.jpg", { type: blob.type || "image/jpeg" }), COVER_MAX)).url;
        } catch {
          setMsg("Không tạo được bản thu nhỏ của ảnh, thử lại hoặc tải ảnh bìa đã chuẩn bị.");
          return;
        }
      }
      const r = await saveTemplateCoverAction(templateId, url, frame);
      if (r.ok) setSrc(url);
      setMsg(
        r.ok
          ? "Đã lưu ảnh bìa. Kho mẫu hiện ảnh mới sau khi tải lại trang (tối đa ~30 giây do bộ nhớ đệm)."
          : r.error || "Không lưu được",
      );
      if (r.ok) router.refresh();
    });

  const reset = () =>
    start(async () => {
      await resetTemplateCoverAction(templateId);
      setSrc("");
      setFrame(null);
      setMsg(
        "Đã quay lại ảnh demo mặc định. Ảnh bìa vừa bỏ vẫn nằm trong lịch sử để khôi phục.",
      );
      router.refresh();
    });

  const box = "rounded-xl border border-zinc-200 p-3";

  return (
    <div className="@container space-y-5">
      {/* bản thiệp ẩn chỉ để đo khung ảnh bìa của thumbnail */}
      <div
        ref={probe}
        aria-hidden
        inert
        className="pointer-events-none fixed left-[-20000px] top-0 w-[400px] overflow-hidden opacity-0"
        style={{ "--hero-h": "680px" } as React.CSSProperties}
      >
        <InvitationView
          templateId={templateId}
          data={demoInvitationData(tpl.demoCover)}
          slug="frame-probe"
          mode="thumb"
        />
      </div>

      <div className="grid gap-5 @3xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4">
          <div className={box}>
            <p className="text-sm font-medium">1. Chọn ảnh công khai</p>
            <p className="text-xs text-zinc-500">
              Chỉ ảnh trong album studio đã xuất bản hoặc ảnh bạn tải lên ở đây
              (đã đồng ý công khai). Không lấy ảnh riêng của thiệp khách.
            </p>
            {candidates.length > 0 ? (
              <ul className="mt-3 grid max-h-72 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
                {candidates.map((c) => (
                  <li key={c.url}>
                    <button
                      type="button"
                      onClick={() => pick(c.url)}
                      title={c.label}
                      className={`block aspect-[3/4] w-full overflow-hidden rounded-lg bg-zinc-100 ${c.url === src ? "ring-4 ring-rose-400" : "hover:opacity-80"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">
                Chưa có album studio nào đã xuất bản. Tải ảnh bìa đã chuẩn bị
                bên dưới.
              </p>
            )}
            <label className="btn btn-outline mt-3 cursor-pointer">
              {uploading ? "Đang tải ảnh…" : "Tải ảnh bìa đã chuẩn bị"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  setUploading(true);
                  try {
                    pick((await uploadPhoto(f, COVER_MAX)).url);
                  } catch (err) {
                    setMsg(
                      err instanceof Error ? err.message : "Tải ảnh thất bại",
                    );
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
          </div>

          <div className={box}>
            <p className="text-sm font-medium">
              2. Căn ảnh theo khung thumbnail
            </p>
            <p className="text-xs text-zinc-500">
              Kéo và thu phóng trong đúng khung ảnh bìa của mẫu{" "}
              {templateCode(templateId)} khi hiện trong kho mẫu.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-outline"
                disabled={!src || !target}
                onClick={() => {
                  beforeEdit.current = frame;
                  setEditing(true);
                }}
              >
                Căn ảnh{frame ? " ✓" : ""}
              </button>
              {frame && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setFrame(null)}
                >
                  Bỏ căn chỉnh
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`${box} w-full max-w-[280px]`}>
          <p className="text-sm font-medium">Ảnh bìa đang dùng</p>
          <div className="mt-2 overflow-hidden rounded-xl">
            <TemplateThumb
              templateId={templateId}
              height={THUMB_H}
              cover={current}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {current ? "Ảnh bìa riêng." : "Ảnh demo mặc định của mẫu."}
          </p>
        </div>
      </div>

      <div className={box}>
        <p className="text-sm font-medium">
          3. Xem trước kho mẫu{dirty ? " (chưa lưu)" : ""}
        </p>
        <div className="mt-3 flex flex-wrap items-start gap-5">
          <figure className="w-[300px] max-w-full">
            <figcaption className="mb-2 text-xs text-zinc-500">
              Điện thoại · 375px
            </figcaption>
            <GridPreview
              device="mobile"
              templateId={templateId}
              neighbors={neighbors}
              cover={draft}
              boxWidth={300}
            />
          </figure>
          <figure className="min-w-[240px] flex-1">
            <figcaption className="mb-2 text-xs text-zinc-500">
              Máy tính · 1152px
            </figcaption>
            <GridPreview
              device="desktop"
              templateId={templateId}
              neighbors={neighbors}
              cover={draft}
              boxWidth={900}
            />
          </figure>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!src || !dirty || pending}
          onClick={save}
        >
          {pending ? "Đang lưu…" : "Lưu ảnh bìa"}
        </button>
        {current && (
          <button
            type="button"
            className="btn btn-outline"
            disabled={pending}
            onClick={reset}
          >
            Dùng lại ảnh demo mặc định
          </button>
        )}
        {msg && (
          <p className="text-sm text-zinc-600" role="status">
            {msg}
          </p>
        )}
      </div>

      {history.length > 0 && (
        <div className={box}>
          <p className="text-sm font-medium">Ảnh bìa trước đây</p>
          <p className="text-xs text-zinc-500">
            Bấm để nạp lại (kèm cách căn cũ), rồi “Lưu ảnh bìa” để khôi phục.
          </p>
          <ul className="mt-3 flex flex-wrap gap-3">
            {history.map((h) => (
              <li key={h.url + h.at}>
                <button
                  type="button"
                  onClick={() => {
                    setSrc(h.url);
                    setFrame(h.frame);
                    setMsg("");
                  }}
                  className={`block w-24 overflow-hidden rounded-lg text-left ${h.url === src ? "ring-4 ring-rose-400" : ""}`}
                >
                  <TemplateThumb
                    templateId={templateId}
                    height={150}
                    cover={h}
                  />
                  <span className="block bg-zinc-50 px-1.5 py-1 text-[10px] text-zinc-500">
                    {h.at ? new Date(h.at).toLocaleDateString("vi-VN") : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing && src && target && (
        <FrameEditor
          src={src}
          title={`Ảnh bìa ${templateCode(templateId)} · khung thumbnail`}
          value={frame}
          desktop={target}
          mobile={target}
          note="Khung lấy đúng tỉ lệ và góc bo của ô ảnh bìa trong thumbnail. Lưới xem trước bên dưới cập nhật ngay khi bạn kéo."
          onDraft={setFrame}
          onApply={(f) => {
            setFrame(f);
            setEditing(false);
          }}
          onClose={() => {
            setFrame(beforeEdit.current); // huỷ: bỏ phần đã kéo thử
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
