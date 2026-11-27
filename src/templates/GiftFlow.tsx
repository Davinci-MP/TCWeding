"use client";

// Hộp mừng cưới + luồng "Mừng cưới ngay" khi chưa nối API ngân hàng của chủ thiệp:
// chọn app ngân hàng của khách → mở app bằng deep link VietQR (điền sẵn nếu app hỗ trợ) hoặc dùng mã QR →
// quay lại thiệp thì hỏi "Bạn đã chuyển khoản chưa?" → gửi bill (dòng "Chờ xác nhận") hoặc "Mừng tại đám cưới".
// Việc khách quay lại trang chỉ để gợi mở popup; trạng thái tiền chỉ đổi khi chủ thiệp xác nhận.

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { appSupport, BANK_APPS, bankAppLogo, bankDeepLink, detectPlatform, type BankApp, type Platform } from "@/lib/bankApps";
import { BILL_MAX_BYTES, giftContent, giftSide, SIDE_LABEL, type GiftSide } from "@/lib/gifts";
import { giftQrUrl, type GiftAccount } from "@/lib/invitation";
import { Icon } from "./icons";
import type { ViewMode } from "./motion";

type Props = { gifts: GiftAccount[]; slug: string; mode: ViewMode; groomName: string; brideName: string };

type Step =
  | { kind: "banks"; gift: GiftAccount }
  | { kind: "qr"; gift: GiftAccount; app?: BankApp; note?: string }
  | { kind: "ask"; gift: GiftAccount; app?: BankApp }
  | { kind: "bill"; gift: GiftAccount; app?: BankApp }
  | { kind: "sent"; gift: GiftAccount; duplicate?: boolean }
  | { kind: "thanks" };

/** Lượt mở app đang chờ khách quay lại (giữ trong phiên để về đúng thiệp + đúng bên nhận). */
type Pending = { giftId: string; appId: string; at: number; awaiting: boolean };
const PENDING_TTL = 3 * 3600_000;
const keyOf = (slug: string) => `tcw-gift:${slug}`;
function readPending(slug: string): Pending | null {
  try {
    const p = JSON.parse(sessionStorage.getItem(keyOf(slug)) ?? "null") as Pending | null;
    return p && Date.now() - p.at < PENDING_TTL ? p : null;
  } catch {
    return null;
  }
}
function writePending(slug: string, p: Pending | null) {
  try {
    if (p) sessionStorage.setItem(keyOf(slug), JSON.stringify(p));
    else sessionStorage.removeItem(keyOf(slug));
  } catch {}
}

function copy(text: string) {
  return navigator.clipboard?.writeText(text).then(
    () => true,
    () => false,
  ) ?? Promise.resolve(false);
}

function sideTitle(g: GiftAccount) {
  const s = giftSide(g);
  return s ? SIDE_LABEL[s] : g.label || "Tài khoản";
}

/* ================================ Hộp mừng cưới ================================ */

export function GiftBox({ gifts, slug, mode, groomName, brideName }: Props) {
  const live = mode === "live";
  const content = useMemo(() => giftContent(groomName, brideName), [groomName, brideName]);
  // Nhóm theo bên nhận: Nhà trai / Nhà gái (tài khoản chưa rõ bên thì đứng riêng theo tiêu đề)
  const groups = useMemo(() => {
    const m = new Map<string, { key: string; title: string; side: GiftSide | ""; items: GiftAccount[] }>();
    for (const g of gifts) {
      const s = giftSide(g);
      const key = s || `acc-${g.id}`;
      if (!m.has(key)) m.set(key, { key, title: sideTitle(g), side: s, items: [] });
      m.get(key)!.items.push(g);
    }
    return [...m.values()].sort((a, b) => (a.side === "groom" ? -1 : b.side === "groom" ? 1 : 0));
  }, [gifts]);
  const [tab, setTab] = useState(groups[0]?.key ?? "");
  const [step, setStep] = useState<Step | null>(null);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const rootRef = useRef<HTMLDivElement>(null);

  const findGift = useCallback((id: string) => gifts.find((g) => g.id === id), [gifts]);
  const groupOf = useCallback((g: GiftAccount) => groups.find((x) => x.items.includes(g))?.key ?? "", [groups]);

  // Khách quay lại thiệp sau khi mở app ngân hàng: hỏi một lần cho mỗi lượt mở app
  useEffect(() => {
    setPlatform(detectPlatform(navigator.userAgent));
    if (!live) return;
    const ask = () => {
      const p = readPending(slug);
      if (!p?.awaiting) return;
      const g = findGift(p.giftId);
      writePending(slug, { ...p, awaiting: false });
      if (!g) return;
      setTab(groupOf(g));
      setStep({ kind: "ask", gift: g, app: BANK_APPS.find((a) => a.id === p.appId) });
    };
    // Trang được tải lại (iOS có thể tải lại thiệp khi quay về) → về đúng hộp mừng cưới và hỏi luôn
    const p = readPending(slug);
    if (p) {
      const g = findGift(p.giftId);
      if (g) setTab(groupOf(g));
      if (p.awaiting)
        setTimeout(() => {
          window.dispatchEvent(new Event("tcw:skip-gate"));
          rootRef.current?.scrollIntoView({ block: "center" });
          ask();
        }, 400);
    }
    const onVisible = () => document.visibilityState === "visible" && ask();
    const onShow = (e: PageTransitionEvent) => e.persisted && ask();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onShow);
    };
  }, [live, slug, findGift, groupOf]);

  /** Khách chọn app ngân hàng của mình. */
  const chooseApp = (gift: GiftAccount, app: BankApp | undefined) => {
    const support = app ? appSupport(app, platform) : 0;
    if (!app || support === 0 || !gift.bankCode || !gift.accountNumber) {
      setStep({
        kind: "qr",
        gift,
        app,
        note: !app ? undefined : platform === "desktop" ? "Máy tính không mở được app ngân hàng. Hãy quét mã QR bằng app trên điện thoại." : !gift.bankCode ? "Tài khoản này chỉ có ảnh QR, hãy quét mã hoặc nhập tay." : `${app.name} chưa có trên loại điện thoại này. Hãy dùng mã QR hoặc sao chép số tài khoản.`,
      });
      return;
    }
    const filled = support === 2;
    setStep({
      kind: "qr",
      gift,
      app,
      note: filled
        ? `Đang mở ${app.name}: số tài khoản, ngân hàng nhận và nội dung đã điền sẵn. Bạn tự nhập số tiền, kiểm tra tên người nhận rồi xác nhận trong app.`
        : `Đang mở ${app.name}. App này chưa hỗ trợ điền sẵn: hãy quét mã QR (Lưu mã QR rồi chọn ảnh trong app) hoặc dán số tài khoản và nội dung bên dưới.`,
    });
    if (!live) return; // xem trước / demo: không mở app thật
    writePending(slug, { giftId: gift.id, appId: app.id, at: Date.now(), awaiting: true });
    let left = false;
    const onHide = () => {
      if (document.visibilityState === "hidden") left = true;
    };
    document.addEventListener("visibilitychange", onHide);
    window.location.href = bankDeepLink(app, platform, {
      bankCode: gift.bankCode,
      accountNumber: gift.accountNumber,
      accountName: gift.accountName,
      content,
      returnUrl: `${window.location.origin}${window.location.pathname}${window.location.search}#mung-cuoi`,
    });
    // Sau 2,5 giây trang vẫn hiển thị → app không mở được: bỏ lượt chờ, giữ mã QR trên màn hình
    setTimeout(() => {
      document.removeEventListener("visibilitychange", onHide);
      if (left || document.visibilityState === "hidden") return;
      const p = readPending(slug);
      if (p?.awaiting && p.appId === app.id) writePending(slug, { ...p, awaiting: false });
      setStep((s) => (s?.kind === "qr" && s.app?.id === app.id ? { ...s, note: `Không mở được ${app.name} trên thiết bị này. Hãy dùng mã QR hoặc sao chép số tài khoản bên dưới.` } : s));
    }, 2500);
  };

  if (gifts.length === 0) return null;
  const active = groups.find((g) => g.key === tab) ?? groups[0];

  return (
    <div ref={rootRef} className="mx-auto max-w-md">
      {groups.length > 1 && (
        <div role="tablist" aria-label="Chọn bên nhận" className="mb-5 grid grid-cols-2 gap-1 rounded-full border border-[var(--primary)]/25 bg-[var(--surface)] p-1">
          {groups.map((g) => (
            <button
              key={g.key}
              type="button"
              role="tab"
              aria-selected={g.key === active.key}
              onClick={() => setTab(g.key)}
              className={`min-h-11 cursor-pointer rounded-full px-4 text-sm font-semibold transition ${g.key === active.key ? "bg-[var(--primary)] text-[var(--on-primary)]" : "text-[var(--text)] hover:bg-[var(--primary)]/10"}`}
            >
              {g.title}
            </button>
          ))}
        </div>
      )}
      <div role="tabpanel" className="space-y-5">
        {active.items.map((g) => (
          <AccountCard key={g.id} gift={g} content={content}>
            <button
              type="button"
              onClick={() => setStep({ kind: "banks", gift: g })}
              className="mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 font-semibold text-[var(--on-primary)] shadow-lg transition hover:opacity-90"
            >
              <Icon name="gift" size={18} /> Mừng cưới ngay
            </button>
            <button type="button" onClick={() => setStep({ kind: "ask", gift: g })} className="mt-2 min-h-11 cursor-pointer text-sm text-[var(--muted)] underline-offset-4 hover:underline">
              Tôi đã chuyển khoản
            </button>
          </AccountCard>
        ))}
      </div>

      {step && (
        <Sheet
          onClose={() => setStep(null)}
          title={
            step.kind === "banks"
              ? "Chọn ngân hàng của bạn"
              : step.kind === "qr"
                ? "Chuyển khoản mừng cưới"
                : step.kind === "ask"
                  ? "Bạn đã chuyển khoản chưa?"
                  : step.kind === "bill"
                    ? "Gửi bill chuyển khoản"
                    : step.kind === "sent"
                      ? "Đã gửi bill"
                      : "Cảm ơn bạn!"
          }
        >
          {step.kind === "banks" && <BankPicker gift={step.gift} platform={platform} onPick={(a) => chooseApp(step.gift, a)} />}
          {step.kind === "qr" && <QrPanel gift={step.gift} app={step.app} note={step.note} content={content} live={live} onReopen={step.app && platform !== "desktop" && appSupport(step.app, platform) > 0 ? () => chooseApp(step.gift, step.app) : undefined} onDone={() => setStep({ kind: "ask", gift: step.gift, app: step.app })} />}
          {step.kind === "ask" && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted)]">
                Tiền mừng gửi tới <b className="text-[var(--text)]">{sideTitle(step.gift)}</b> · {step.gift.bankName} · {step.gift.accountName}
              </p>
              <button type="button" onClick={() => setStep({ kind: "bill", gift: step.gift, app: step.app })} className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 font-semibold text-[var(--on-primary)]">
                <Icon name="check" size={18} /> Đã chuyển khoản · Gửi bill
              </button>
              <button type="button" onClick={() => setStep({ kind: "thanks" })} className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border border-[var(--primary)]/40 px-5 font-semibold text-[var(--primary)]">
                Mừng tại đám cưới
              </button>
              <p className="text-center text-xs text-[var(--muted)]">Cô dâu chú rể sẽ tự đối chiếu với tài khoản ngân hàng.</p>
            </div>
          )}
          {step.kind === "bill" && <BillForm gift={step.gift} app={step.app} slug={slug} live={live} content={content} onSent={(dup) => setStep({ kind: "sent", gift: step.gift, duplicate: dup })} />}
          {step.kind === "sent" && (
            <div className="space-y-3 text-center">
              <p>
                Bill của bạn đã tới <b>{sideTitle(step.gift)}</b>
                {step.duplicate ? " (đã nhận trước đó, không gửi trùng)" : ""}. Cô dâu chú rể sẽ đối chiếu và xác nhận. Cảm ơn tấm lòng của bạn!
              </p>
              <button type="button" onClick={() => setStep(null)} className="min-h-11 cursor-pointer rounded-full bg-[var(--primary)] px-6 font-semibold text-[var(--on-primary)]">
                Đóng
              </button>
            </div>
          )}
          {step.kind === "thanks" && (
            <div className="space-y-3 text-center">
              <p>Cảm ơn bạn! Hẹn gặp bạn trong ngày vui của chúng mình.</p>
              <button type="button" onClick={() => setStep(null)} className="min-h-11 cursor-pointer rounded-full bg-[var(--primary)] px-6 font-semibold text-[var(--on-primary)]">
                Đóng
              </button>
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}

/* ================================ Thẻ tài khoản nhận ================================ */

function AccountCard({ gift, content, children }: { gift: GiftAccount; content: string; children: ReactNode }) {
  const qr = giftQrUrl(gift, content);
  return (
    <div className="rounded-3xl border border-[var(--primary)]/20 bg-[var(--surface)] p-7 text-center shadow-[0_20px_60px_-30px_rgba(0,0,0,.3)]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">{gift.label || sideTitle(gift)}</p>
      {qr && (
        <div className="mx-auto mt-5 w-44 rounded-2xl bg-white p-3 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={`Mã QR chuyển khoản ${gift.bankName}`} className="aspect-square w-full object-contain" loading="lazy" />
        </div>
      )}
      <p className="mt-5 text-sm text-[var(--muted)]">{gift.bankName}</p>
      <p className="tpl-heading mt-1 break-all text-2xl tracking-[0.12em] tabular-nums">{gift.accountNumber}</p>
      <p className="mt-1 text-sm uppercase tracking-wider">{gift.accountName}</p>
      {children}
    </div>
  );
}

/* ================================ Khung popup ================================ */

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/55 sm:items-center sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="tpl-gift-sheet flex max-h-[92svh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-[var(--bg)] text-[var(--text)] shadow-2xl sm:rounded-3xl">
        <div className="flex items-center gap-2 border-b border-[var(--muted)]/20 px-5 py-3">
          <h3 className="tpl-heading min-w-0 flex-1 text-xl">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Đóng" className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-[var(--primary)]/10">
            <Icon name="x" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ================================ Chọn app ngân hàng của khách ================================ */

function BankPicker({ gift, platform, onPick }: { gift: GiftAccount; platform: Platform; onPick: (a: BankApp | undefined) => void }) {
  const [q, setQ] = useState("");
  const apps = useMemo(() => {
    const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const list = BANK_APPS.filter((a) => platform === "desktop" || a[platform] > 0);
    return q ? list.filter((a) => norm(`${a.name} ${a.id}`).includes(norm(q))) : list;
  }, [q, platform]);
  return (
    <div className="space-y-3">
      <p className="rounded-2xl bg-[var(--surface)] p-3 text-sm">
        Tiền mừng sẽ chuyển tới <b>{sideTitle(gift)}</b>: {gift.bankName} · <span className="tabular-nums">{gift.accountNumber}</span> · {gift.accountName}
      </p>
      <p className="text-sm text-[var(--muted)]">Chọn app ngân hàng bạn dùng để chuyển. App có dấu ⚡ sẽ điền sẵn số tài khoản và nội dung; bạn chỉ nhập số tiền.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm ngân hàng (vd: VCB, Techcombank)" aria-label="Tìm ngân hàng" className="min-h-11 w-full rounded-xl border border-[var(--muted)]/30 bg-[var(--surface)] px-4 text-base outline-none focus:border-[var(--primary)]" />
      <ul className="grid grid-cols-3 gap-2">
        {apps.map((a) => {
          const s = appSupport(a, platform);
          return (
            <li key={a.id}>
              <button type="button" onClick={() => onPick(a)} className="flex h-full min-h-24 w-full cursor-pointer flex-col items-center justify-start gap-1.5 rounded-2xl border border-[var(--muted)]/20 bg-[var(--surface)] p-2 text-center text-xs leading-tight transition hover:border-[var(--primary)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bankAppLogo(a.id, platform)} alt="" width={44} height={44} loading="lazy" className="h-11 w-11 rounded-xl" />
                <span>
                  {a.name}
                  {s === 2 && <span title="Điền sẵn thông tin" aria-label="điền sẵn"> ⚡</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {apps.length === 0 && <p className="text-center text-sm text-[var(--muted)]">Không tìm thấy, hãy dùng mã QR bên dưới.</p>}
      <button type="button" onClick={() => onPick(undefined)} className="min-h-11 w-full cursor-pointer rounded-full border border-[var(--primary)]/40 font-semibold text-[var(--primary)]">
        Không thấy ngân hàng của tôi · Hiện mã QR
      </button>
    </div>
  );
}

/* ================================ Mã QR + sao chép ================================ */

function QrPanel({ gift, app, note, content, live, onReopen, onDone }: { gift: GiftAccount; app?: BankApp; note?: string; content: string; live: boolean; onReopen?: () => void; onDone: () => void }) {
  const qr = giftQrUrl(gift, content);
  const [msg, setMsg] = useState("");
  const flash = (t: string) => {
    setMsg(t);
    setTimeout(() => setMsg(""), 2000);
  };
  const saveQr = async () => {
    try {
      // mã VietQR: tải qua /api/qr (img.vietqr.io chặn CORS); ảnh QR tự tải lên: tải thẳng
      const src = gift.qrImage || !gift.bankCode ? qr : `/api/qr?${new URLSearchParams({ b: gift.bankCode, a: gift.accountNumber, n: gift.accountName, t: content })}`;
      const blob = await fetch(src).then((r) => {
        if (!r.ok) throw new Error();
        return r.blob();
      });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href: url, download: `qr-mung-cuoi-${gift.accountNumber || "tcwedding"}.png` });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      flash("Đã lưu mã QR");
    } catch {
      window.open(qr, "_blank", "noopener");
      flash("Nhấn giữ ảnh QR để lưu vào máy");
    }
  };
  return (
    <div className="space-y-3 text-center">
      {note && <p className="rounded-2xl bg-[var(--surface)] p-3 text-left text-sm">{note}</p>}
      {!live && app && <p className="text-xs text-[var(--muted)]">Bản xem trước: không mở app thật.</p>}
      {qr ? (
        <div className="mx-auto w-56 rounded-2xl bg-white p-3 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={`Mã VietQR chuyển khoản tới ${gift.accountName}`} className="aspect-square w-full object-contain" />
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">Tài khoản này chưa có mã QR, hãy chuyển khoản theo số tài khoản.</p>
      )}
      <div className="text-sm">
        <p className="text-[var(--muted)]">
          {sideTitle(gift)} · {gift.bankName}
        </p>
        <p className="tpl-heading break-all text-2xl tabular-nums tracking-[0.1em]">{gift.accountNumber}</p>
        <p className="uppercase">{gift.accountName}</p>
        <p className="mt-1 text-[var(--muted)]">
          Nội dung: <b className="text-[var(--text)]">{content}</b>
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {qr && (
          <button type="button" onClick={saveQr} className="min-h-11 cursor-pointer rounded-full border border-[var(--primary)]/40 font-semibold text-[var(--primary)]">
            Lưu mã QR
          </button>
        )}
        <button type="button" onClick={async () => flash((await copy(gift.accountNumber)) ? "Đã sao chép số tài khoản" : "Không sao chép được, hãy chép tay")} className="min-h-11 cursor-pointer rounded-full border border-[var(--primary)]/40 font-semibold text-[var(--primary)]">
          Sao chép số tài khoản
        </button>
        <button type="button" onClick={async () => flash((await copy(content)) ? "Đã sao chép nội dung chuyển khoản" : "Không sao chép được, hãy chép tay")} className="min-h-11 cursor-pointer rounded-full border border-[var(--primary)]/40 font-semibold text-[var(--primary)]">
          Sao chép nội dung chuyển khoản
        </button>
        {onReopen && app && (
          <button type="button" onClick={onReopen} className="min-h-11 cursor-pointer text-sm text-[var(--muted)] underline">
            Mở lại {app.name}
          </button>
        )}
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-[var(--primary)]">
        {msg}
      </p>
      <button type="button" onClick={onDone} className="min-h-12 w-full cursor-pointer rounded-full bg-[var(--primary)] font-semibold text-[var(--on-primary)]">
        Tôi đã chuyển khoản
      </button>
    </div>
  );
}

/* ================================ Gửi bill ================================ */

/** Thu nhỏ ảnh bill về JPEG ≤ 1600px để gửi nhanh và lưu gọn (bill vẫn đọc rõ). */
async function compressBill(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = Object.assign(document.createElement("canvas"), { width: Math.round(bmp.width * scale), height: Math.round(bmp.height * scale) });
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  for (const q of [0.85, 0.72, 0.6, 0.45]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
    if (blob && blob.size <= BILL_MAX_BYTES) return blob;
  }
  return file;
}

const newRequestId = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9-]/g, "");

function BillForm({ gift, app, slug, live, content, onSent }: { gift: GiftAccount; app?: BankApp; slug: string; live: boolean; content: string; onSent: (duplicate: boolean) => void }) {
  // Một mã yêu cầu cho mỗi lần mở form: gửi lại sau lỗi mạng dùng lại mã này → server không tạo dòng trùng
  const requestId = useRef(newRequestId());
  const [file, setFile] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  useEffect(() => {
    try {
      setName(localStorage.getItem("tcw-guest-name") ?? "");
    } catch {}
  }, []);
  useEffect(() => () => URL.revokeObjectURL(preview), [preview]);
  const field = "min-h-11 w-full rounded-xl border border-[var(--muted)]/30 bg-[var(--surface)] px-3 text-base outline-none focus:border-[var(--primary)]";
  const label = "block text-left text-sm";

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!file) return setError("Vui lòng chọn ảnh bill chuyển khoản.");
    if (!live) return setError("Bản xem trước: không gửi bill thật.");
    const fd = new FormData(e.currentTarget);
    fd.set("slug", slug);
    fd.set("requestId", requestId.current);
    fd.set("giftAccountId", gift.id);
    fd.set("bill", file, "bill.jpg");
    fd.set("amount", String(fd.get("amount") ?? "").replace(/\D/g, ""));
    try {
      localStorage.setItem("tcw-guest-name", String(fd.get("senderName") ?? ""));
    } catch {}
    setBusy(true);
    try {
      const res = await fetch("/api/gifts", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Gửi chưa được, vui lòng thử lại.");
      writePending(slug, null);
      onSent(Boolean(json.duplicate));
    } catch (err) {
      setError(err instanceof TypeError ? "Mất kết nối mạng. Bấm Gửi lại, bill sẽ không bị gửi trùng." : (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-left text-sm text-[var(--muted)]">
        Gửi tới <b className="text-[var(--text)]">{sideTitle(gift)}</b> · {gift.bankName} · {gift.accountName}
      </p>
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--primary)]/40 bg-[var(--surface)] p-3 text-sm">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Ảnh bill đã chọn" className="max-h-64 rounded-xl object-contain" />
        ) : (
          <>
            <Icon name="camera" size={26} />
            <span>Chọn ảnh chụp màn hình bill</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setError("");
            const blob = await compressBill(f);
            if (blob.size > BILL_MAX_BYTES) return setError("Ảnh quá lớn, hãy chụp màn hình bill rồi chọn lại.");
            setFile(blob);
            setPreview(URL.createObjectURL(blob));
          }}
        />
        {preview && <span className="text-xs text-[var(--primary)] underline">Đổi ảnh khác</span>}
      </label>
      <p className="rounded-xl bg-[var(--surface)] p-2 text-left text-xs text-[var(--muted)]">Hệ thống chưa tự đọc chữ trên ảnh: bạn nhập các thông tin có trên bill. Trường nào bill không có thì để trống.</p>
      <label className={label}>
        Tên người gửi *
        <input name="senderName" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Vd: Anh Nam & chị Lan" className={field} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className={label}>
          Ngân hàng gửi
          <input name="senderBank" maxLength={60} defaultValue={app?.name ?? ""} className={field} />
        </label>
        <label className={label}>
          STK gửi
          <input name="senderAccount" inputMode="numeric" maxLength={30} placeholder="Chỉ lưu 4 số cuối" className={field} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className={label}>
          Ngày giờ chuyển
          <input name="transferAt" type="datetime-local" className={field} />
        </label>
        <label className={label}>
          Số tiền (đ)
          <input name="amount" inputMode="numeric" maxLength={16} placeholder="500.000" className={field} onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "");
            e.target.value = d ? Number(d).toLocaleString("vi-VN") : "";
          }} />
        </label>
      </div>
      <label className={label}>
        Nội dung chuyển khoản
        <input name="content" maxLength={140} defaultValue={content} className={field} />
      </label>
      <label className={label}>
        Mã giao dịch
        <input name="txnCode" maxLength={60} className={field} />
      </label>
      {error && (
        <p role="alert" className="text-left text-sm text-red-600">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="min-h-12 w-full cursor-pointer rounded-full bg-[var(--primary)] font-semibold text-[var(--on-primary)] disabled:opacity-60">
        {busy ? "Đang gửi…" : error ? "Gửi lại" : "Gửi bill"}
      </button>
    </form>
  );
}
