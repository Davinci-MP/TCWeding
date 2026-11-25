"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changeOwnPasswordAction, resetUserPasswordAction, type PasswordState } from "@/app/actions/account";

function Message({ state }: { state: PasswordState }) {
  if (state?.error)
    return (
      <p role="alert" className="text-sm text-red-700">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p role="status" className="text-sm text-emerald-700">
        {state.ok}
      </p>
    );
  return null;
}

/** Đổi mật khẩu của chính mình. */
export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPasswordAction, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  return (
    <form ref={form} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium">Mật khẩu hiện tại</span>
          <input name="current" type="password" required autoComplete="current-password" className="input mt-1" />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Mật khẩu mới</span>
          <input name="next" type="password" required minLength={8} autoComplete="new-password" className="input mt-1" />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Nhập lại mật khẩu mới</span>
          <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input mt-1" />
        </label>
      </div>
      <Message state={state} />
      <button disabled={pending} className="btn btn-primary">
        {pending ? "Đang lưu…" : "Đổi mật khẩu"}
      </button>
    </form>
  );
}

/** Admin đặt mật khẩu mới cho người dùng (nút nhỏ trong bảng Người dùng). */
export function ResetPasswordButton({ id, email }: { id: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(resetUserPasswordAction, undefined);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline">
        Đặt mật khẩu
      </button>
    );
  return (
    <form action={action} className="flex min-w-56 flex-col gap-1">
      <input type="hidden" name="id" value={id} />
      <div className="flex gap-1">
        <input name="password" type="text" required minLength={8} autoComplete="off" placeholder="Mật khẩu mới" aria-label={`Mật khẩu mới cho ${email}`} className="input h-8 py-1 text-xs" />
        <button disabled={pending} className="btn btn-primary h-8 px-2 py-1 text-xs">
          Lưu
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-1 text-xs text-zinc-500" aria-label="Huỷ">
          ✕
        </button>
      </div>
      <Message state={state} />
    </form>
  );
}
