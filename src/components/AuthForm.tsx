"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction } from "@/app/actions/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action, pending] = useActionState(mode === "login" ? loginAction : registerAction, undefined);
  return (
    <form action={action} className="card mx-auto w-full max-w-sm space-y-4">
      <h1 className="font-display text-2xl font-semibold">{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h1>
      {mode === "register" && (
        <div>
          <label className="label">Họ tên</label>
          <input name="name" required className="input" />
        </div>
      )}
      <div>
        <label className="label">Email</label>
        <input name="email" type="email" required className="input" autoComplete="email" />
      </div>
      <div>
        <label className="label">Mật khẩu</label>
        <input
          name="password"
          type="password"
          required
          className="input"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Đăng ký"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        {mode === "login" ? (
          <>
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-brand underline">
              Đăng ký
            </Link>
          </>
        ) : (
          <>
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-brand underline">
              Đăng nhập
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
