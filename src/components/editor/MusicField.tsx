"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { InvitationData } from "@/lib/invitation";
import type { LibraryTrack } from "@/lib/settings";
import { getTrackUrl, silentUrl } from "@/templates/music/synth";
import { getTrack, templateTrackId, TRACKS } from "@/templates/music/tracks";
import { Field, UploadButton } from "./fields";

type MusicPatch = Partial<Pick<InvitationData, "music" | "musicUrl" | "musicName" | "musicStart">>;
type Preview = { key: string; state: "loading" | "playing" } | null;

/** Một trình nghe thử dùng chung: bấm bài khác thì bài đang phát dừng lại. */
function usePreview() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [now, setNow] = useState<Preview>(null);
  const token = useRef(0);
  useEffect(() => {
    const a = new Audio();
    audio.current = a;
    const off = () => a.src !== silentUrl() && setNow(null);
    a.addEventListener("ended", off);
    return () => {
      a.pause();
      a.removeEventListener("ended", off);
    };
  }, []);
  const stop = () => {
    token.current++;
    audio.current?.pause();
    setNow(null);
  };
  const toggle = async (key: string, get: () => Promise<string> | string, start = 0) => {
    const a = audio.current;
    if (!a) return;
    if (now?.key === key) return stop();
    const my = ++token.current;
    a.pause();
    setNow({ key, state: "loading" });
    try {
      const res = get();
      if (typeof res !== "string") {
        // Safari chỉ cho phát trong lần chạm: mở khoá bằng âm im lặng trong lúc chờ dựng bài
        a.src = silentUrl();
        a.play().catch(() => {});
      }
      const url = await res;
      if (my !== token.current) return;
      if (a.src !== new URL(url, location.href).href) a.src = url;
      a.currentTime = start;
      await a.play();
      if (my === token.current) setNow({ key, state: "playing" });
    } catch {
      if (my === token.current) setNow(null);
    }
  };
  return { now, toggle, stop, audio };
}

function PlayButton({ state, onClick, label }: { state?: "loading" | "playing"; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={state === "playing" ? `Dừng ${label}` : `Nghe thử ${label}`}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors hover:border-zinc-500 hover:text-zinc-900"
    >
      {state === "loading" ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" aria-hidden />
      ) : state === "playing" ? (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <rect x="3" y="2.5" width="3.5" height="11" rx="1" />
          <rect x="9.5" y="2.5" width="3.5" height="11" rx="1" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className="ml-0.5 h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M4 2.8v10.4a.8.8 0 0 0 1.2.7l8.4-5.2a.8.8 0 0 0 0-1.4L5.2 2.1A.8.8 0 0 0 4 2.8z" />
        </svg>
      )}
    </button>
  );
}

function Option({
  checked,
  onSelect,
  title,
  sub,
  aside,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  title: ReactNode;
  sub?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 transition-colors ${checked ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white"}`}>
      <div className="flex items-center gap-3">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
          <input type="radio" name="music-choice" checked={checked} onChange={onSelect} className="h-4 w-4 shrink-0 accent-zinc-900" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-zinc-900">{title}</span>
            {sub && <span className="block truncate text-xs text-zinc-500">{sub}</span>}
          </span>
        </label>
        {aside}
      </div>
      {children}
    </div>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function MusicField({
  templateId,
  templateName,
  data,
  library,
  onChange,
}: {
  templateId: string;
  templateName: string;
  data: Pick<InvitationData, "music" | "musicUrl" | "musicName" | "musicStart">;
  library: LibraryTrack[];
  onChange: (p: MusicPatch) => void;
}) {
  const pv = usePreview();
  const suggested = getTrack(templateTrackId(templateId))!;
  const fromLibrary = data.music === "file" ? library.find((t) => t.url === data.musicUrl) : undefined;
  const ownFile = data.music === "file" && !fromLibrary;
  const [meta, setMeta] = useState<{ url: string; duration: number } | { url: string; error: true } | null>(null);
  const [size, setSize] = useState<number | null>(null);

  // đọc thời lượng + dung lượng file của người dùng để cảnh báo
  useEffect(() => {
    if (!ownFile || !data.musicUrl) return;
    const url = data.musicUrl;
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => setMeta({ url, duration: a.duration });
    a.onerror = () => setMeta({ url, error: true });
    a.src = url;
    fetch(url, { method: "HEAD" })
      .then((r) => setSize(Number(r.headers.get("content-length")) || null))
      .catch(() => setSize(null));
    return () => {
      a.onloadedmetadata = a.onerror = null;
      a.removeAttribute("src");
    };
  }, [ownFile, data.musicUrl]);

  useEffect(() => pv.stop, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (p: MusicPatch) => {
    pv.stop();
    onChange(p);
  };
  const synthKey = (id: string) => `t:${id}`;
  const synthPlay = (id: string) => pv.toggle(synthKey(id), () => getTrackUrl(id));
  const stateOf = (key: string) => (pv.now?.key === key ? pv.now.state : undefined);

  const own = meta && meta.url === data.musicUrl ? meta : null;
  const duration = own && "duration" in own && Number.isFinite(own.duration) ? own.duration : null;
  const warnings: { tone: "warn" | "bad"; text: string }[] = [];
  if (ownFile && data.musicUrl) {
    if (own && "error" in own) warnings.push({ tone: "bad", text: "Không phát được file này. Hãy dùng file MP3 hoặc M4A, hoặc kiểm tra lại đường link." });
    if (size && size > 8 * 1024 * 1024) warnings.push({ tone: "warn", text: `File khá nặng (${(size / 1024 / 1024).toFixed(1)}MB) — khách dùng 4G có thể phải chờ vài giây mới nghe thấy nhạc. Nên dùng bản MP3 128kbps (khoảng 4–5MB cho 5 phút).` });
    if (duration !== null && duration < 45) warnings.push({ tone: "warn", text: `Bài chỉ dài ${fmt(duration)} nên sẽ lặp lại liên tục khi khách xem thiệp. Nên chọn bài dài từ 2 phút.` });
    if (duration !== null && data.musicStart >= duration - 5) warnings.push({ tone: "bad", text: "Thời điểm bắt đầu gần hết bài — hãy chọn sớm hơn." });
  }

  return (
    <Field label="Nhạc nền">
      <p className="-mt-1 mb-3 text-xs text-zinc-500">
        Nhạc bắt đầu khi khách bấm “Mở thiệp”, lặp lại suốt lúc xem. Khách tắt được bằng nút nốt nhạc ở góc màn hình.
      </p>
      <div role="radiogroup" aria-label="Chọn nhạc nền" className="space-y-2">
        <Option
          checked={data.music === ""}
          onSelect={() => pick({ music: "" })}
          title={`Theo mẫu: ${suggested.name}`}
          sub={`Gợi ý cho mẫu ${templateName} · ${suggested.sound}`}
          aside={<PlayButton state={stateOf(synthKey(suggested.id))} onClick={() => synthPlay(suggested.id)} label={suggested.name} />}
        />

        <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Bài dựng sẵn</p>
        {TRACKS.map((t) => (
          <Option
            key={t.id}
            checked={data.music === t.id}
            onSelect={() => pick({ music: t.id })}
            title={t.name}
            sub={`${t.by} · ${t.sound}`}
            aside={<PlayButton state={stateOf(synthKey(t.id))} onClick={() => synthPlay(t.id)} label={t.name} />}
          />
        ))}

        {library.length > 0 && (
          <>
            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Thư viện bản thu</p>
            {library.map((t) => (
              <Option
                key={t.id}
                checked={fromLibrary?.id === t.id}
                onSelect={() => pick({ music: "file", musicUrl: t.url, musicName: t.name, musicStart: 0 })}
                title={t.name}
                sub={t.note || "Bản thu"}
                aside={<PlayButton state={stateOf(`l:${t.id}`)} onClick={() => pv.toggle(`l:${t.id}`, () => t.url)} label={t.name} />}
              />
            ))}
          </>
        )}

        <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Khác</p>
        <Option
          checked={ownFile}
          onSelect={() => pick({ music: "file", musicUrl: fromLibrary ? "" : data.musicUrl, musicName: fromLibrary ? "" : data.musicName })}
          title="Nhạc của bạn"
          sub={ownFile && data.musicUrl ? data.musicName || "File đã tải lên" : "Tải lên MP3/M4A tối đa 12MB, hoặc dán link"}
          aside={
            ownFile && data.musicUrl ? (
              <PlayButton state={stateOf("own")} onClick={() => pv.toggle("own", () => data.musicUrl, data.musicStart)} label="nhạc của bạn" />
            ) : undefined
          }
        >
          {ownFile && (
            <div className="mt-3 space-y-3 border-t border-zinc-200 pt-3">
              <div className="flex flex-wrap gap-2">
                <UploadButton
                  accept="audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a"
                  onUploaded={([u]) => pick({ music: "file", musicUrl: u, musicName: "", musicStart: 0 })}
                >
                  {data.musicUrl ? "Đổi file nhạc" : "Tải nhạc lên"}
                </UploadButton>
              </div>
              <label className="block text-xs text-zinc-600">
                Hoặc dán link file nhạc
                <input
                  className="input mt-1"
                  placeholder="https://…/bai-hat.mp3"
                  value={data.musicUrl}
                  onChange={(e) => onChange({ musicUrl: e.target.value.trim(), musicStart: 0 })}
                />
              </label>
              {data.musicUrl && (
                <>
                  <label className="block text-xs text-zinc-600">
                    Tên bài (để bạn dễ nhận ra)
                    <input className="input mt-1" maxLength={80} placeholder="Tên bài hát" value={data.musicName} onChange={(e) => onChange({ musicName: e.target.value })} />
                  </label>
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-600">
                      <label htmlFor="music-start">Bắt đầu phát từ</label>
                      <span className="tabular-nums font-medium text-zinc-800">
                        {fmt(data.musicStart)}
                        {duration !== null && <span className="font-normal text-zinc-400"> / {fmt(duration)}</span>}
                      </span>
                    </div>
                    <input
                      id="music-start"
                      type="range"
                      min={0}
                      max={Math.max(0, Math.floor((duration ?? 300) - 5))}
                      step={1}
                      value={data.musicStart}
                      onChange={(e) => onChange({ musicStart: Number(e.target.value) })}
                      onPointerUp={() => pv.now?.key === "own" && pv.audio.current && (pv.audio.current.currentTime = data.musicStart)}
                      className="mt-1 w-full accent-zinc-900"
                    />
                    <p className="text-xs text-zinc-400">Bỏ qua đoạn dạo đầu dài — kéo rồi bấm nghe thử để kiểm tra.</p>
                  </div>
                </>
              )}
              <div aria-live="polite" className="space-y-2">
                {warnings.map((w) => (
                  <p
                    key={w.text}
                    className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${w.tone === "bad" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}
                  >
                    {w.text}
                  </p>
                ))}
              </div>
              <p className="text-xs text-zinc-400">Chỉ dùng bài hát bạn có quyền sử dụng.</p>
            </div>
          )}
        </Option>
        <Option checked={data.music === "off"} onSelect={() => pick({ music: "off" })} title="Không dùng nhạc" sub="Thiệp sẽ không phát âm thanh" />
      </div>
    </Field>
  );
}
