"use client";

import { startTransition, useActionState, useState } from "react";
import { createOrderAction } from "@/app/actions/orders";

export function OrderForm({ templates, initialTemplate }: { templates: { id: string; name: string }[]; initialTemplate: string }) {
  const [state, action, pending] = useActionState(createOrderAction, undefined);
  const [v, setV] = useState({ contactName: "", phone: "", groom: "", bride: "", weddingDate: "", templateId: initialTemplate, details: "" });
  const bind = (k: keyof typeof v) => ({
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
      className="card space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Họ tên người đặt</span>
          <input {...bind("contactName")} required maxLength={80} autoComplete="name" className="input min-h-11" />
        </label>
        <label>
          <span className="label">Số điện thoại (có Zalo)</span>
          <input {...bind("phone")} type="tel" required autoComplete="tel" className="input min-h-11" />
        </label>
        <label>
          <span className="label">Tên chú rể</span>
          <input {...bind("groom")} required maxLength={60} className="input min-h-11" />
        </label>
        <label>
          <span className="label">Tên cô dâu</span>
          <input {...bind("bride")} required maxLength={60} className="input min-h-11" />
        </label>
        <label>
          <span className="label">Ngày cưới</span>
          <input {...bind("weddingDate")} type="date" required className="input min-h-11" />
        </label>
        <label>
          <span className="label">Mẫu thiệp</span>
          <select {...bind("templateId")} required className="input min-h-11">
            <option value="">Chọn mẫu…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="label">Nội dung thiệp</span>
        <textarea
          {...bind("details")}
          rows={7}
          maxLength={4000}
          className="input"
          placeholder={"Tên cha mẹ hai bên, địa chỉ nhà trai, nhà gái\nGiờ và địa điểm các buổi lễ, tiệc\nTài khoản mừng cưới, bài nhạc, lời mời mong muốn…"}
        />
        <span className="mt-1 block text-xs text-zinc-500">Chưa đủ thông tin cũng không sao, bạn bổ sung và gửi ảnh ở trang đơn hàng.</span>
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button className="btn btn-primary min-h-12 w-full text-base" disabled={pending}>
        {pending ? "Đang gửi…" : "Gửi đơn đặt thiệp"}
      </button>
    </form>
  );
}
