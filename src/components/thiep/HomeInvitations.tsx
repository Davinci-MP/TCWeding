"use client";

import { useCallback, useState } from "react";
import { TemplateCard, type TplLite } from "./TemplateCard";
import { TemplateModal } from "./TemplateModal";

const STEPS: [string, string][] = [
  ["Chọn mẫu", "Xem thử thiệp chạy thật, có nhạc, hiệu ứng mở thiệp và đủ các mục: lịch cưới, chỉ đường, xác nhận tham dự, hộp mừng cưới."],
  ["Điền thông tin", "Tên cô dâu chú rể, gia đình hai bên, lịch các lễ. Ngày âm lịch tự tính. Thông tin lưu tạm trên máy, điền dở vẫn quay lại được."],
  ["Xem thiệp của bạn", "Bấm “Xem thiệp của bạn” để thấy ngay thiệp mang tên hai bạn theo mẫu đã chọn."],
  ["Gửi cho studio", "Không cần tài khoản, không trả tiền trước. Studio thay ảnh cưới, hoàn thiện và gửi lại link thiệp để hai bạn chia sẻ."],
];

/** Mục Thiệp cưới online trên trang chủ: dải mẫu nổi bật, bấm mẫu mở hộp chọn mẫu / xem thiệp chạy thật / thả tim. */
export function HomeInvitations({ templates, total }: { templates: TplLite[]; total: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const onClose = useCallback(() => setOpen(null), []);
  return (
    <>
      <ul className="-mx-4 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin]">
        {templates.map((t, i) => (
          <li key={t.id} className="w-[220px] shrink-0 snap-start sm:w-[240px]">
            <TemplateCard t={t} onOpen={() => setOpen(i)} dark height={400} />
          </li>
        ))}
      </ul>
      <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="border-t border-white/20 pt-5">
            <p className="text-sm font-semibold text-[#d8cdbf]">
              {String(i + 1).padStart(2, "0")} · {title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex flex-wrap gap-3">
        <a href="/thiep#chon" className="inline-flex min-h-12 items-center rounded-full bg-[#d9a0a8] px-7 font-semibold text-[#1d1a17] transition hover:bg-[#e8b6bd]">
          Đặt làm thiệp online
        </a>
        <a href="/thiep" className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-7 font-semibold text-white transition hover:border-white/60">
          Xem tất cả {total} mẫu thiệp
        </a>
      </div>
      {open !== null && <TemplateModal list={templates} index={open} onIndex={setOpen} onClose={onClose} />}
    </>
  );
}
