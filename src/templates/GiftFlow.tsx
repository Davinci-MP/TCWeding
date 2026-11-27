"use client";

// Hộp mừng cưới + luồng "Mừng cưới ngay" khi chưa nối API ngân hàng của chủ thiệp:
// chọn app ngân hàng của khách → mở app bằng deep link VietQR (điền sẵn nếu app hỗ trợ) hoặc dùng mã QR →
// quay lại thiệp thì hỏi "Bạn đã chuyển khoản chưa?" → gửi bill (dòng "Chờ xác nhận") hoặc "Mừng tại đám cưới".
// Việc khách quay lại trang chỉ để gợi mở popup; trạng thái tiền chỉ đổi khi chủ thiệp xác nhận.

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { appOpenUrl, appSupport, autofillClaimUrl, BANK_APPS, bankAppLogo, detectPlatform, sendAutofillClaim, type BankApp, type Platform } from "@/lib/bankApps";
import { BILL_MAX_BYTES, giftContent, giftSide, maskAccount, SIDE_LABEL, type GiftSide } from "@/lib/gifts";
import { giftQrUrl, type GiftAccount } from "@/lib/invitation";
import { Icon } from "./icons";
import type { ViewMode } from "./motion";

type Props = {
  gifts: GiftAccount[];
  slug: string;
  mode: ViewMode;
  groomName: string;
  brideName: string;
};

type Step =
  | { kind: "banks"; gift: GiftAccount }
  | { kind: "qr"; gift: GiftAccount; app?: BankApp; note?: string }
  | { kind: "ask"; gift: GiftAccount; app?: BankApp }
  | { kind: "bill"; gift: GiftAccount; app?: BankApp }
  | { kind: "review"; gift: GiftAccount; app?: BankApp }
  | { kind: "sent"; gift: GiftAccount; duplicate?: boolean }
  | { kind: "thanks" };

/** Lượt mở app đang chờ khách quay lại (giữ trong phiên để về đúng thiệp + đúng bên nhận). */
type Pending = { giftId: string; appId: string; at: number; awaiting: boolean };
const PENDING_TTL = 3 * 3600_000;
const FAIL_HASH = "mung-cuoi-chua-cai-";
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

/** Sao chép: dùng Clipboard API; trang http hoặc trình duyệt trong app (Zalo, Facebook…) không có API này thì chép bằng ô ẩn. */
function copyFallback(text: string) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px";
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {}
  ta.remove();
  return ok;
}
async function copy(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }
  return copyFallback(text);
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
  // Các bước trong popup xếp chồng: "Quay lại" bỏ bước trên cùng, giữ nguyên bên nhận
  const [stack, setStack] = useState<Step[]>([]);
  const step = stack.at(-1) ?? null;
  // Dữ liệu bill + ảnh đã chọn: giữ suốt một lần mở popup (Quay lại / Xem lại không mất)
  const [draft, setDraft] = useState<BillDraft | null>(null);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const rootRef = useRef<HTMLDivElement>(null);

  const open = useCallback((s: Step) => {
    setStack([s]);
    setDraft(null);
  }, []);
  const push = (s: Step) => setStack((st) => [...st, s]);
  const back = () => setStack((st) => st.slice(0, -1));
  const close = useCallback(() => {
    setStack([]);
    setDraft((d) => {
      if (d?.preview) URL.revokeObjectURL(d.preview);
      return null;
    });
  }, []);
  const replaceTop = (fn: (s: Step) => Step) => setStack((st) => (st.length ? [...st.slice(0, -1), fn(st[st.length - 1])] : st));

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
      const app = BANK_APPS.find((a) => a.id === p.appId);
      // giữ bước QR phía dưới để "Quay lại" về được mã QR / số tài khoản
      setStack((st) => (st.at(-1)?.kind === "qr" ? [...st, { kind: "ask", gift: g, app }] : [{ kind: "ask", gift: g, app }]));
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
    // Android chưa cài app: intent quay về thiệp với #${FAIL_HASH}<app>
    const onFailHash = () => {
      const h = window.location.hash.slice(1);
      if (!h.startsWith(FAIL_HASH)) return;
      const app = BANK_APPS.find((a) => a.id === h.slice(FAIL_HASH.length));
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}#mung-cuoi`);
      const p = readPending(slug);
      const g = p ? findGift(p.giftId) : undefined;
      if (p) writePending(slug, { ...p, awaiting: false });
      if (!g || !app) return;
      setTab(groupOf(g));
      window.dispatchEvent(new Event("tcw:skip-gate"));
      setStack([
        { kind: "banks", gift: g },
        {
          kind: "qr",
          gift: g,
          app,
          note: `Máy chưa cài ${app.name}. Hãy dùng mã QR hoặc sao chép số tài khoản bên dưới, hoặc chọn app khác.`,
        },
      ]);
    };
    onFailHash();
    window.addEventListener("hashchange", onFailHash);
    const onVisible = () => document.visibilityState === "visible" && ask();
    const onShow = (e: PageTransitionEvent) => e.persisted && ask();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("hashchange", onFailHash);
    };
  }, [live, slug, findGift, groupOf]);

  /** Thông tin bên nhận đang chọn: đổi app gửi không bao giờ đổi STK nhận. */
  const receiver = (gift: GiftAccount) => ({
    bankCode: gift.bankCode,
    accountNumber: gift.accountNumber,
    accountName: gift.accountName,
    content,
  });
  /** Link quay về thiệp khi máy Android chưa cài app (thay cho Play Store). */
  const fallbackUrl = (app: BankApp) => (typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}${window.location.search}#${FAIL_HASH}${app.id}`);
  /** Link mở app gắn vào thẻ <a>; trống khi không mở được (máy tính, app không có trên nền tảng, bản xem trước). */
  const openHref = (gift: GiftAccount, app: BankApp) => (live && gift.accountNumber ? appOpenUrl(app, platform, fallbackUrl(app)) : "");

  /**
   * Khách chạm vào một app. Việc mở app do chính thẻ <a href> làm (trình duyệt coi là thao tác của khách, không qua trang
   * trung gian, không chờ API / hẹn giờ). Ở đây chỉ: hiện bước QR, ghi lượt chờ quay lại, gửi yêu cầu điền sẵn ở chế độ nền.
   */
  const chooseApp = (gift: GiftAccount, app: BankApp | undefined, reopen = false) => {
    const support = app ? appSupport(app, platform) : 0;
    const go = (s: Step) => (reopen ? replaceTop(() => s) : push(s));
    if (!app || support === 0 || !gift.bankCode || !gift.accountNumber) {
      go({
        kind: "qr",
        gift,
        app,
        note: !app
          ? undefined
          : platform === "desktop"
            ? "Máy tính không mở được app ngân hàng. Hãy quét mã QR bằng app trên điện thoại."
            : !gift.bankCode
              ? "Tài khoản này chỉ có ảnh QR, hãy quét mã hoặc nhập tay."
              : `${app.name} chưa có trên loại điện thoại này. Hãy dùng mã QR hoặc sao chép số tài khoản.`,
      });
      return;
    }
    const ask = platform === "ios" ? " Nếu điện thoại hỏi “Mở trong " + app.name + "?”, chọn Mở." : "";
    go({
      kind: "qr",
      gift,
      app,
      note:
        support === 2
          ? `Đang mở ${app.name}.${ask} Trong app, kiểm tra người nhận ${gift.accountName} · ${gift.bankName} · STK ${gift.accountNumber} đã được điền sẵn, tự nhập số tiền rồi xác nhận. Nếu app chưa điền sẵn, dùng mã QR hoặc sao chép bên dưới.`
          : `Đang mở ${app.name}.${ask} App này không nhận thông tin điền sẵn: trong app, chọn Quét QR → chọn ảnh (biểu tượng thư viện ảnh) → chọn mã QR vừa lưu; hoặc dán số tài khoản và nội dung chuyển khoản bên dưới.`,
    });
    if (!live) return; // xem trước / demo: không mở app thật
    writePending(slug, {
      giftId: gift.id,
      appId: app.id,
      at: Date.now(),
      awaiting: true,
    });
    sendAutofillClaim(autofillClaimUrl(app, platform, receiver(gift)));
    let left = false;
    const onHide = () => {
      if (document.visibilityState === "hidden") left = true;
    };
    document.addEventListener("visibilitychange", onHide);
    // Sau 3 giây trang vẫn hiển thị → app không mở được (chưa cài, trình duyệt Zalo / Facebook chặn…): bỏ lượt chờ, giữ mã QR
    setTimeout(() => {
      document.removeEventListener("visibilitychange", onHide);
      if (left || document.visibilityState === "hidden") return;
      const p = readPending(slug);
      if (p?.awaiting && p.appId === app.id) writePending(slug, { ...p, awaiting: false });
      replaceTop((s) =>
        s.kind === "qr" && s.app?.id === app.id
          ? {
              ...s,
              note: `Chưa mở được ${app.name} trên trình duyệt này (máy chưa cài app, hoặc đang mở thiệp trong Zalo / Facebook). Hãy dùng mã QR hoặc sao chép số tài khoản bên dưới, hoặc mở thiệp bằng Safari / Chrome rồi thử lại.`,
            }
          : s,
      );
    }, 3000);
  };

  /** Gửi bill (chỉ ở bước Xem lại). Mã yêu cầu giữ nguyên trong cả lần mở popup → gửi lại không tạo dòng trùng. */
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const send = async (gift: GiftAccount) => {
    if (!draft?.file) return;
    setSendError("");
    if (!live) return setSendError("Bản xem trước: không gửi bill thật.");
    const fd = new FormData();
    fd.set("slug", slug);
    fd.set("requestId", draft.requestId);
    fd.set("giftAccountId", gift.id);
    fd.set("senderName", draft.senderName.trim());
    fd.set("senderBank", draft.senderBank.trim());
    fd.set("senderAccount", draft.senderAccount.trim());
    fd.set("transferAt", draft.transferAt);
    fd.set("amount", draft.amount.replace(/\D/g, ""));
    fd.set("content", draft.content.trim());
    fd.set("txnCode", draft.txnCode.trim());
    fd.set("bill", draft.file, "bill.jpg");
    try {
      localStorage.setItem("tcw-guest-name", draft.senderName.trim());
    } catch {}
    setSending(true);
    try {
      const res = await fetch("/api/gifts", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Gửi chưa được, vui lòng thử lại.");
      writePending(slug, null);
      setStack([{ kind: "sent", gift, duplicate: Boolean(json.duplicate) }]);
    } catch (err) {
      setSendError(err instanceof TypeError ? "Mất kết nối mạng. Bấm Gửi bill lần nữa, bill sẽ không bị gửi trùng." : (err as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (gifts.length === 0) return null;
  const active = groups.find((g) => g.key === tab) ?? groups[0];
  const startBill = (gift: GiftAccount, app?: BankApp) => {
    setDraft((d) => d ?? newDraft(app?.name ?? "", content));
    push({ kind: "bill", gift, app });
  };
  // Bước đầu (chọn ngân hàng / hỏi đã chuyển chưa) "Quay lại" là đóng popup; các bước sau quay về bước trước
  const canBack = step && (step.kind === "banks" || step.kind === "qr" || step.kind === "bill" || step.kind === "review" || (step.kind === "ask" && stack.length > 1));

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
              onClick={() => open({ kind: "banks", gift: g })}
              className="mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 font-semibold text-[var(--on-primary)] shadow-lg transition hover:opacity-90"
            >
              <Icon name="gift" size={18} /> Mừng cưới ngay
            </button>
            <button type="button" onClick={() => open({ kind: "ask", gift: g })} className="mt-2 min-h-11 cursor-pointer text-sm text-[var(--muted)] underline-offset-4 hover:underline">
              Tôi đã chuyển khoản
            </button>
          </AccountCard>
        ))}
      </div>

      {step && (
        <Sheet onClose={close} onBack={canBack ? (stack.length > 1 ? back : close) : undefined} heading={STEP_HEADING[step.kind]}>
          {step.kind === "banks" && <BankPicker gift={step.gift} platform={platform} hrefOf={(a) => openHref(step.gift, a)} onPick={(a) => chooseApp(step.gift, a)} />}
          {step.kind === "qr" && (
            <QrPanel
              gift={step.gift}
              app={step.app}
              note={step.note}
              content={content}
              live={live}
              reopenHref={step.app ? openHref(step.gift, step.app) : ""}
              onReopen={step.app && platform !== "desktop" && appSupport(step.app, platform) > 0 ? () => chooseApp(step.gift, step.app, true) : undefined}
              onDone={() => push({ kind: "ask", gift: step.gift, app: step.app })}
            />
          )}
          {step.kind === "ask" && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted)]">
                Tiền mừng gửi tới <b className="text-[var(--text)]">{sideTitle(step.gift)}</b> · {step.gift.bankName} · {step.gift.accountName}
              </p>
              <button
                type="button"
                onClick={() => startBill(step.gift, step.app)}
                className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 font-semibold text-[var(--on-primary)]"
              >
                <Icon name="check" size={18} /> Đã chuyển khoản · Gửi bill
              </button>
              <button
                type="button"
                onClick={() => setStack([{ kind: "thanks" }])}
                className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border border-[var(--primary)]/40 px-5 font-semibold text-[var(--primary)]"
              >
                Mừng tại đám cưới
              </button>
              <p className="text-center text-xs text-[var(--muted)]">Cô dâu chú rể sẽ tự đối chiếu với tài khoản ngân hàng.</p>
            </div>
          )}
          {step.kind === "bill" && draft && <BillForm gift={step.gift} draft={draft} setDraft={setDraft} onReview={() => push({ kind: "review", gift: step.gift, app: step.app })} />}
          {step.kind === "review" && draft && <ReviewPanel gift={step.gift} draft={draft} sending={sending} error={sendError} onBack={back} onSend={() => send(step.gift)} />}
          {step.kind === "sent" && (
            <div className="space-y-3 text-center">
              <p>
                Bill của bạn đã tới <b>{sideTitle(step.gift)}</b>
                {step.duplicate ? " (đã nhận trước đó, không gửi trùng)" : ""}. Cô dâu chú rể sẽ đối chiếu và xác nhận. Cảm ơn tấm lòng của bạn!
              </p>
              <button type="button" onClick={close} className="min-h-11 cursor-pointer rounded-full bg-[var(--primary)] px-6 font-semibold text-[var(--on-primary)]">
                Đóng
              </button>
            </div>
          )}
          {step.kind === "thanks" && (
            <div className="space-y-3 text-center">
              <p>Cảm ơn bạn! Hẹn gặp bạn trong ngày vui của chúng mình.</p>
              <button type="button" onClick={close} className="min-h-11 cursor-pointer rounded-full bg-[var(--primary)] px-6 font-semibold text-[var(--on-primary)]">
                Đóng
              </button>
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}

const STEP_HEADING: Record<Step["kind"], string> = {
  banks: "Chọn ngân hàng của bạn",
  qr: "Chuyển khoản",
  ask: "Bạn đã chuyển khoản chưa?",
  bill: "Gửi bill chuyển khoản",
  review: "Xem lại trước khi gửi",
  sent: "Đã gửi bill",
  thanks: "Cảm ơn bạn!",
};

/* ================================ Thẻ tài khoản nhận ================================ */

function AccountCard({ gift, content, children }: { gift: GiftAccount; content: string; children: ReactNode }) {
  const qr = giftQrUrl(gift, content);
  return (
    <div className="rounded-3xl border border-[var(--primary)]/20 bg-[var(--surface)] p-7 text-center shadow-[0_20px_60px_-30px_rgba(0,0,0,.3)]">
      <p data-tf={`gift.${gift.id}.label`} className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
        {gift.label || sideTitle(gift)}
      </p>
      {qr && (
        <div className="mx-auto mt-5 w-44 rounded-2xl bg-white p-3 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={`Mã QR chuyển khoản ${gift.bankName}`} className="aspect-square w-full object-contain" loading="lazy" />
        </div>
      )}
      <p data-tf={`gift.${gift.id}.bankName`} className="mt-5 text-sm text-[var(--muted)]">
        {gift.bankName}
      </p>
      <AccountNumber gift={gift} className="mt-1" />
      <p data-tf={`gift.${gift.id}.accountName`} className="mt-1 text-sm uppercase tracking-wider">
        {gift.accountName}
      </p>
      {children}
    </div>
  );
}

/** STK nhận: chữ số đều (lining + tabular), nhóm 4 số để dễ đọc và chỉ xuống dòng giữa các nhóm. */
function AccountNumber({ gift, className = "" }: { gift: GiftAccount; className?: string }) {
  const groups = gift.accountNumber.replace(/s+/g, "").match(/.{1,4}/g) ?? [];
  return (
    <p data-tf={`gift.${gift.id}.accountNumber`} className={`tpl-digits ${className}`} aria-label={`Số tài khoản ${gift.accountNumber}`}>
      {groups.map((g, i) => (
        <span key={i} className="inline-block whitespace-nowrap">
          {g}
          {i < groups.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}

/* ================================ Khung popup ================================ */

/** Popup "Mừng Cưới": tiêu đề cố định, tên bước ở dưới, nút Quay lại ở các bước có bước trước. */
function Sheet({ heading, onBack, onClose, children }: { heading: string; onBack?: () => void; onClose: () => void; children: ReactNode }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  // đổi bước thì cuộn nội dung về đầu
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [heading]);
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
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Mừng Cưới: ${heading}`}
        className="tpl-gift-sheet flex max-h-[92svh] w-full max-w-md sm:max-w-lg flex-col overflow-hidden rounded-t-3xl bg-[var(--bg)] text-[var(--text)] shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center gap-1 border-b border-[var(--muted)]/20 py-2 pl-2 pr-3">
          {onBack ? (
            <button type="button" onClick={onBack} className="flex min-h-11 shrink-0 cursor-pointer items-center gap-1 rounded-full px-3 text-sm font-medium hover:bg-[var(--primary)]/10">
              <Icon name="left" size={18} /> Quay lại
            </button>
          ) : (
            <span className="w-3 shrink-0" />
          )}
          <div className="min-w-0 flex-1 text-center">
            <h3 className="tpl-heading text-xl leading-tight">Mừng Cưới</h3>
            <p className="truncate text-xs text-[var(--muted)]">{heading}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-[var(--primary)]/10">
            <Icon name="x" />
          </button>
        </div>
        <div ref={bodyRef} className="overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ================================ Chọn app ngân hàng của khách ================================ */

function BankPicker({ gift, platform, hrefOf, onPick }: { gift: GiftAccount; platform: Platform; hrefOf: (a: BankApp) => string; onPick: (a: BankApp | undefined) => void }) {
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
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm ngân hàng (vd: VCB, Techcombank)"
        aria-label="Tìm ngân hàng"
        className="min-h-11 w-full rounded-xl border border-[var(--muted)]/30 bg-[var(--surface)] px-4 text-base outline-none focus:border-[var(--primary)]"
      />
      <ul className="grid grid-cols-3 gap-2">
        {apps.map((a) => {
          const s = appSupport(a, platform);
          const href = hrefOf(a);
          const cls =
            "flex h-full min-h-24 w-full cursor-pointer flex-col items-center justify-start gap-1.5 rounded-2xl border border-[var(--muted)]/20 bg-[var(--surface)] p-2 text-center text-xs leading-tight text-[var(--text)] transition hover:border-[var(--primary)]";
          const inner = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bankAppLogo(a.id, platform)} alt="" width={44} height={44} loading="lazy" className="h-11 w-11 rounded-xl" />
              <span>
                {a.name}
                {s === 2 && (
                  <span title="Điền sẵn thông tin" aria-label="điền sẵn">
                    {" "}
                    ⚡
                  </span>
                )}
              </span>
            </>
          );
          return (
            <li key={a.id}>
              {href ? (
                // Một chạm mở app ngay: link mở app đã chuẩn bị sẵn trong href, trình duyệt tự mở khi chạm
                <a href={href} onClick={() => onPick(a)} className={cls}>
                  {inner}
                </a>
              ) : (
                <button type="button" onClick={() => onPick(a)} className={cls}>
                  {inner}
                </button>
              )}
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

function QrPanel({
  gift,
  app,
  note,
  content,
  live,
  reopenHref,
  onReopen,
  onDone,
}: {
  gift: GiftAccount;
  app?: BankApp;
  note?: string;
  content: string;
  live: boolean;
  reopenHref: string;
  onReopen?: () => void;
  onDone: () => void;
}) {
  const qr = giftQrUrl(gift, content);
  const [msg, setMsg] = useState("");
  const flash = (t: string) => {
    setMsg(t);
    setTimeout(() => setMsg(""), 2500);
  };
  const saveQr = async () => {
    try {
      // mã VietQR: tải qua /api/qr (img.vietqr.io chặn CORS); ảnh QR tự tải lên: tải thẳng
      const src = gift.qrImage || !gift.bankCode ? qr : `/api/qr?${new URLSearchParams({ b: gift.bankCode, a: gift.accountNumber, n: gift.accountName, t: content })}`;
      const blob = await fetch(src).then((r) => {
        if (!r.ok) throw new Error();
        return r.blob();
      });
      const name = `qr-mung-cuoi-${gift.accountNumber || "tcwedding"}.png`;
      // Điện thoại: mở bảng chia sẻ để chọn "Lưu hình ảnh" (vào thư viện Ảnh — nơi app ngân hàng chọn ảnh QR)
      const file = new File([blob], name, { type: blob.type || "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Mã QR mừng cưới" });
          return flash("Chọn “Lưu hình ảnh” để lưu mã QR vào Ảnh");
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement("a"), {
        href: url,
        download: name,
      }).click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      flash("Đã lưu mã QR");
    } catch {
      window.open(qr, "_blank", "noopener");
      flash("Nhấn giữ ảnh QR rồi chọn Lưu vào Ảnh");
    }
  };
  const outline = "flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[var(--primary)] px-4 font-semibold text-[var(--primary)]";
  return (
    <div className="space-y-3 text-center">
      {note && <p className="rounded-2xl bg-[var(--surface)] p-3 text-left text-sm">{note}</p>}
      {!live && app && <p className="text-xs text-[var(--muted)]">Bản xem trước: không mở app thật.</p>}
      {/* Mở lại app: thẻ <a> thật để mở ngay trong lần chạm (kể cả app không điền sẵn như VCB Digibank) */}
      {app && reopenHref && onReopen && (
        <a href={reopenHref} onClick={onReopen} className={outline}>
          Mở lại {app.name}
        </a>
      )}
      {qr ? (
        <div className="mx-auto w-56 max-w-full rounded-2xl bg-white p-3 shadow-inner">
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
        <AccountNumber gift={gift} />
        <p className="uppercase">{gift.accountName}</p>
        <p className="mt-1 text-[var(--muted)]">
          Nội dung: <b className="text-[var(--text)]">{content}</b>
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {qr && (
          <button type="button" onClick={saveQr} className={outline}>
            Lưu mã QR
          </button>
        )}
        <button type="button" onClick={async () => flash((await copy(gift.accountNumber)) ? "Đã sao chép số tài khoản" : "Không sao chép được, hãy chép tay")} className={outline}>
          Sao chép STK
        </button>
        <button type="button" onClick={async () => flash((await copy(content)) ? "Đã sao chép nội dung chuyển khoản" : "Không sao chép được, hãy chép tay")} className={outline}>
          Sao chép nội dung
        </button>
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
  const canvas = Object.assign(document.createElement("canvas"), {
    width: Math.round(bmp.width * scale),
    height: Math.round(bmp.height * scale),
  });
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

/** Dữ liệu form bill (giữ trong một lần mở popup). STK là chuỗi để giữ số 0 đầu. */
type BillDraft = {
  requestId: string;
  file: Blob | null;
  preview: string;
  senderName: string;
  senderBank: string;
  senderAccount: string;
  transferAt: string;
  amount: string;
  content: string;
  txnCode: string;
};

function newDraft(bank: string, content: string): BillDraft {
  let name = "";
  try {
    name = localStorage.getItem("tcw-guest-name") ?? "";
  } catch {}
  return {
    requestId: newRequestId(),
    file: null,
    preview: "",
    senderName: name,
    senderBank: bank,
    senderAccount: "",
    transferAt: "",
    amount: "",
    content,
    txnCode: "",
  };
}

const fmtAmount = (raw: string) => {
  const d = raw.replace(/\D/g, "");
  return d ? Number(d).toLocaleString("vi-VN") : "";
};
const fmtWhen = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);
  return m ? `${m[4]}:${m[5]} · ${m[3]}/${m[2]}/${m[1]}` : v;
};

/** Ô nhập trong form bill: nhãn, chiều cao, padding giống nhau; min-w-0 để ô ngày giờ trên iOS không tràn cột. */
function BillField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-left text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "tpl-gift-input block h-12 w-full min-w-0 rounded-xl border border-[var(--muted)]/30 bg-[var(--surface)] px-3 text-base text-[var(--text)] outline-none focus:border-[var(--primary)]";

function BillForm({ gift, draft, setDraft, onReview }: { gift: GiftAccount; draft: BillDraft; setDraft: (fn: (d: BillDraft | null) => BillDraft | null) => void; onReview: () => void }) {
  const [error, setError] = useState("");
  const set = (k: keyof BillDraft, v: string) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const review = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draft.file) return setError("Vui lòng chọn ảnh bill chuyển khoản.");
    if (!draft.senderName.trim()) return setError("Vui lòng nhập tên người gửi.");
    setError("");
    onReview();
  };

  return (
    <form onSubmit={review} className="space-y-4" noValidate>
      <p className="text-left text-sm text-[var(--muted)]">
        Gửi tới <b className="text-[var(--text)]">{sideTitle(gift)}</b> · {gift.bankName} · {gift.accountName}
      </p>
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--primary)]/40 bg-[var(--surface)] p-3 text-sm">
        {draft.preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.preview} alt="Ảnh bill đã chọn" className="max-h-56 rounded-xl object-contain" />
        ) : (
          <>
            <Icon name="camera" size={26} />
            <span>Chọn ảnh chụp màn hình bill *</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setError("");
            const blob = await compressBill(f);
            if (blob.size > BILL_MAX_BYTES) return setError("Ảnh quá lớn, hãy chụp màn hình bill rồi chọn lại.");
            setDraft((d) => {
              if (!d) return d;
              if (d.preview) URL.revokeObjectURL(d.preview);
              return { ...d, file: blob, preview: URL.createObjectURL(blob) };
            });
          }}
        />
        {draft.preview && <span className="text-xs text-[var(--primary)] underline">Đổi ảnh khác</span>}
      </label>
      <p className="rounded-xl bg-[var(--surface)] p-2 text-left text-xs text-[var(--muted)]">
        Hệ thống chưa tự đọc chữ trên ảnh: bạn nhập các thông tin có trên bill. Trường nào bill không có thì để trống.
      </p>
      <BillField label="Tên người gửi *">
        <input value={draft.senderName} onChange={(e) => set("senderName", e.target.value)} maxLength={80} autoComplete="name" placeholder="Vd: Anh Nam & chị Lan" className={inputCls} />
      </BillField>
      {/* Thứ tự: Ngân hàng gửi → STK gửi → Ngày giờ chuyển → Số tiền. Điện thoại một cột, màn rộng hai cột bằng nhau. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BillField label="Ngân hàng gửi">
          <input value={draft.senderBank} onChange={(e) => set("senderBank", e.target.value)} maxLength={60} className={inputCls} />
        </BillField>
        <BillField label="STK gửi">
          <input
            value={draft.senderAccount}
            onChange={(e) => set("senderAccount", e.target.value.replace(/[^\d\s]/g, ""))}
            inputMode="numeric"
            autoComplete="off"
            maxLength={30}
            placeholder="Chỉ lưu 4 số cuối"
            className={`${inputCls} tabular-nums`}
          />
        </BillField>
        <BillField label="Ngày giờ chuyển">
          <input type="datetime-local" value={draft.transferAt} onChange={(e) => set("transferAt", e.target.value)} className={inputCls} />
        </BillField>
        <BillField label="Số tiền (đ)">
          <input value={draft.amount} onChange={(e) => set("amount", fmtAmount(e.target.value))} inputMode="numeric" maxLength={16} placeholder="500.000" className={`${inputCls} tabular-nums`} />
        </BillField>
      </div>
      <BillField label="Mã giao dịch (không bắt buộc)">
        <input value={draft.txnCode} onChange={(e) => set("txnCode", e.target.value)} maxLength={60} autoComplete="off" className={inputCls} />
      </BillField>
      <BillField label="Nội dung chuyển khoản">
        <input value={draft.content} onChange={(e) => set("content", e.target.value)} maxLength={140} className={inputCls} />
      </BillField>
      {error && (
        <p role="alert" className="text-left text-sm text-red-600">
          {error}
        </p>
      )}
      <button type="submit" className="min-h-12 w-full cursor-pointer rounded-full bg-[var(--primary)] font-semibold text-[var(--on-primary)]">
        Xem lại
      </button>
    </form>
  );
}

function ReviewPanel({ gift, draft, sending, error, onBack, onSend }: { gift: GiftAccount; draft: BillDraft; sending: boolean; error: string; onBack: () => void; onSend: () => void }) {
  const rows: [string, string][] = [
    ["Bên nhận", `${sideTitle(gift)} · ${gift.bankName} · ${gift.accountName}`],
    ["Người gửi", draft.senderName.trim()],
    ["Ngân hàng gửi", draft.senderBank.trim()],
    ["STK gửi", maskAccount(draft.senderAccount)],
    ["Ngày giờ chuyển", fmtWhen(draft.transferAt)],
    ["Số tiền", draft.amount ? `${draft.amount} đ` : ""],
    ["Nội dung", draft.content.trim()],
  ];
  if (draft.txnCode.trim()) rows.push(["Mã giao dịch", draft.txnCode.trim()]);
  return (
    <div className="space-y-4">
      <dl className="divide-y divide-[var(--muted)]/15 rounded-2xl bg-[var(--surface)] px-4 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 py-2.5">
            <dt className="text-[var(--muted)]">{k}</dt>
            <dd className="break-words text-left font-medium tabular-nums">{v || <span className="font-normal text-[var(--muted)]">Để trống</span>}</dd>
          </div>
        ))}
      </dl>
      {draft.preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={draft.preview} alt="Ảnh bill sẽ gửi" className="mx-auto max-h-72 rounded-xl object-contain shadow" />
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={sending}
          className="min-h-12 cursor-pointer rounded-full border border-[var(--primary)]/40 font-semibold text-[var(--primary)] disabled:opacity-50"
        >
          Quay lại
        </button>
        <button type="button" onClick={onSend} disabled={sending} className="min-h-12 cursor-pointer rounded-full bg-[var(--primary)] font-semibold text-[var(--on-primary)] disabled:opacity-60">
          {sending ? "Đang gửi…" : "Gửi bill"}
        </button>
      </div>
    </div>
  );
}
