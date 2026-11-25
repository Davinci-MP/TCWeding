"use client";

import { startTransition, useActionState, useState } from "react";
import { saveOrderSettingsAction } from "@/app/actions/orders";
import { BANKS } from "@/lib/invitation";
import type { OrderSettings } from "@/lib/orders";

export function SettingsForm({ initial }: { initial: OrderSettings }) {
  const [state, action, pending] = useActionState(saveOrderSettingsAction, undefined);
  const [v, setV] = useState({ ...initial, price: initial.price ? String(initial.price) : "", deposit: initial.deposit ? String(initial.deposit) : "" });
  const bind = (k: "price" | "deposit" | "bankCode" | "accountNumber" | "accountName" | "intro") => ({
    name: k,
    value: v[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value }),
  });
  return (
    <form
      onSubmit={(e) => {
        // Không dùng action= trực tiếp: React sẽ xoá ô chọn sau khi gửi, kể cả khi có lỗi
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="mt-4 space-y-4">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="enabled" checked={v.enabled} onChange={(e) => setV({ ...v, enabled: e.target.checked })} /> Thu tiền cọc qua chuyển khoản (cần điền ngân hàng). Tắt: đơn mới không cần cọc, bạn bấm “Bắt đầu làm”.
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Giá (đồng)</span>
          <input {...bind("price")} inputMode="numeric" className="input" />
        </label>
        <label>
          <span className="label">Tiền cọc (đồng, để trống nếu không cọc)</span>
          <input {...bind("deposit")} inputMode="numeric" className="input" />
        </label>
        <label>
          <span className="label">Ngân hàng</span>
          <select {...bind("bankCode")} className="input">
            <option value="">Chọn…</option>
            {BANKS.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Số tài khoản</span>
          <input {...bind("accountNumber")} className="input" />
        </label>
        <label>
          <span className="label">Chủ tài khoản</span>
          <input {...bind("accountName")} className="input" />
        </label>
      </div>
      <label className="block">
        <span className="label">Ghi chú cho khách (thời gian làm, số lần sửa, hoàn cọc…)</span>
        <textarea {...bind("intro")} rows={3} maxLength={1500} className="input" />
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button className="btn btn-primary" disabled={pending}>
        Lưu cài đặt
      </button>
    </form>
  );
}
