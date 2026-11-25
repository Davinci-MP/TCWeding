"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

/** Form đăng nhập quản trị. Khách không có tài khoản nên không còn form đăng ký. */
export function AuthForm({ mode: _mode = "login" }: { mode?: "login" }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="card mx-auto w-full max-w-sm space-y-4">
      <h1 className="font-display text-2xl font-semibold">Đăng nhập quản trị</h1>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className="input" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Mật khẩu
        </label>
        <input id="password" name="password" type="password" required className="input" autoComplete="current-password" />
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Đang xử lý…" : "Đăng nhập"}
      </button>
    </form>
  );
}
