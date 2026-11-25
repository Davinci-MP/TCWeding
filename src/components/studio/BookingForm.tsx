"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { createBookingAction, type BookingState } from "@/app/actions/studio";
import { clearFavorites, removeFavorite, useFavorites } from "./favorites";

type Service = { id: string; label: string };

/** Form đặt lịch tư vấn. Tự đính kèm ảnh khách đã thả tim; `?goi=<id>` trên URL chọn sẵn gói chụp. */
export function BookingForm({ services }: { services: Service[] }) {
  const [state, action, pending] = useActionState<BookingState, FormData>(createBookingAction, undefined);
  const favs = useFavorites();
  const [service, setService] = useState("");
  const done = useRef<HTMLDivElement>(null);

  // Chọn sẵn gói khi khách bấm "Chọn gói này" ở bảng giá (link /?goi=concept#lien-he).
  useEffect(() => {
    const pick = () => {
      const goi = new URLSearchParams(window.location.search).get("goi");
      if (goi && services.some((s) => s.id === goi)) setService(goi);
    };
    pick();
    window.addEventListener("popstate", pick);
    return () => window.removeEventListener("popstate", pick);
  }, [services]);

  useEffect(() => {
    if (state?.ok) {
      clearFavorites();
      done.current?.focus();
    }
  }, [state]);

  if (state?.ok) {
    return (
      <div ref={done} tabIndex={-1} role="status" className="rounded-3xl bg-white p-8 text-center outline-none">
        <p className="font-serif-display text-3xl text-[#1d1a17]">Đã nhận yêu cầu của hai bạn</p>
        <p className="mt-3 text-zinc-600">Studio sẽ gọi hoặc nhắn Zalo cho bạn trong thời gian sớm nhất.</p>
        <Link href="/bo-suu-tap" className="mt-6 inline-block font-semibold text-[#7b2d26]">
          Xem thêm bộ sưu tập
        </Link>
      </div>
    );
  }

  const field = "mt-1.5 block w-full rounded-xl border border-[#1d1a17]/15 bg-white px-4 py-3 text-base text-[#1d1a17] outline-none transition focus:border-[#7b2d26] focus:ring-4 focus:ring-[#7b2d26]/10";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-4" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[#1d1a17]">
          Họ tên
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={field} />
        </label>
        <label className="block text-sm font-medium text-[#1d1a17]">
          Số điện thoại / Zalo
          <input name="phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="09xx xxx xxx" className={field} />
        </label>
        <label className="block text-sm font-medium text-[#1d1a17]">
          Ngày chụp dự kiến <span className="font-normal text-zinc-500">(không bắt buộc)</span>
          <input name="shootDate" type="date" min={today} className={field} />
        </label>
        <label className="block text-sm font-medium text-[#1d1a17]">
          Dịch vụ quan tâm
          <select name="service" value={service} onChange={(e) => setService(e.target.value)} className={field}>
            <option value="">Chưa chọn</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium text-[#1d1a17]">
        Lời nhắn <span className="font-normal text-zinc-500">(không bắt buộc)</span>
        <textarea name="message" rows={4} maxLength={2000} placeholder="Địa điểm cưới, phong cách ảnh hai bạn thích…" className={field} />
      </label>

      {favs.length > 0 && (
        <fieldset className="rounded-2xl border border-[#1d1a17]/10 bg-white p-4">
          <legend className="sr-only">Ảnh đã thích</legend>
          <p className="text-sm font-medium text-[#1d1a17]">
            Gửi kèm <strong>{favs.length}</strong> ảnh hai bạn đã thả tim
          </p>
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {favs.map((f) => (
              <li key={f.url} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFavorite(f.url)}
                  aria-label={`Bỏ ảnh trong album ${f.albumTitle}`}
                  className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs text-zinc-700"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      <input type="hidden" name="favorites" value={JSON.stringify(favs.map((f) => ({ url: f.url })))} />
      {/* Bẫy bot: người thật không thấy ô này */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#7b2d26] px-8 font-semibold text-white transition hover:bg-[#5f221d] disabled:opacity-60 sm:w-auto">
        {pending ? "Đang gửi…" : "Gửi yêu cầu tư vấn"}
      </button>
    </form>
  );
}
