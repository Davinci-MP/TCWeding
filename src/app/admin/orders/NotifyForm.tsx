"use client";

import { startTransition, useActionState, useState } from "react";
import { notifyAction } from "@/app/actions/notify";
import { ConfirmButton } from "@/components/ConfirmButton";

type Props = { bot: string; linkCode: string; connected: boolean; chatName: string; lastError: string; defaultOpen: boolean };

export function NotifyForm({ bot, linkCode, connected, chatName, lastError, defaultOpen }: Props) {
  // Chỉ tự mở lúc tải trang, để kết quả thao tác không bị đóng lại ngay
  const [open, setOpen] = useState(defaultOpen);
  const [state, action, pending] = useActionState(notifyAction, undefined);
  const form = (op: string, children: React.ReactNode, cls = "") => (
    <form
      className={cls}
      onSubmit={(e) => {
        // Giữ lại mã vừa nhập khi có lỗi
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("op", op);
        startTransition(() => action(fd));
      }}>
      {children}
    </form>
  );
  const error = state?.error || (connected && lastError ? `Lần gửi gần nhất bị lỗi. ${lastError}` : "");
  return (
    <details className="card" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="cursor-pointer font-semibold">Thông báo Telegram: {!connected ? "chưa kết nối" : lastError ? "đang lỗi" : "đang bật"}</summary>
      <div className="mt-4 space-y-4 text-sm">
      {!bot && (
        <>
          <p className="text-zinc-600">
            Trong Telegram, nhắn <b>@BotFather</b> lệnh <code>/newbot</code>, đặt tên bot rồi dán mã bot nhận được vào đây.
          </p>
          {form(
            "bot",
            <>
              <label className="block grow">
                <span className="label">Mã bot (token)</span>
                <input name="token" type="password" autoComplete="off" required className="input" />
              </label>
              <button className="btn btn-primary" disabled={pending}>
                Lưu bot
              </button>
            </>,
            "flex flex-wrap items-end gap-3",
          )}
        </>
      )}
      {bot && !connected && (
        <>
          <p className="text-zinc-600">Mở bot trên điện thoại hoặc máy nhận thông báo, bấm Start, rồi quay lại bấm “Tôi đã bấm Start”.</p>
          <div className="flex flex-wrap gap-3">
            <a href={`https://t.me/${bot}?start=${linkCode}`} target="_blank" rel="noreferrer" className="btn btn-outline">
              Mở @{bot}
            </a>
            {form(
              "link",
              <button className="btn btn-primary" disabled={pending}>
                Tôi đã bấm Start
              </button>,
            )}
          </div>
        </>
      )}
      {connected && (
        <p className="text-zinc-600">
          Báo về Telegram của {chatName} qua @{bot}: đơn mới, khách báo chuyển khoản, tin nhắn và khi khách duyệt thiệp.
        </p>
      )}
      {bot && (
        <div className="flex flex-wrap gap-3">
          {connected &&
            form(
              "test",
              <button className="btn btn-outline" disabled={pending}>
                Gửi tin thử
              </button>,
            )}
          {form("off", <ConfirmButton message="Ngắt thông báo và xoá mã bot đã lưu?">Ngắt kết nối</ConfirmButton>)}
        </div>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {!error && state?.ok && (
        <p role="status" className="text-emerald-800">
          {state.ok}
        </p>
      )}
      </div>
    </details>
  );
}
