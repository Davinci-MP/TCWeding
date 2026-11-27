import { setGiftStatusAction } from "@/app/actions/gifts";
import { GIFT_STATUS, isGiftStatus, money, SIDE_LABEL, sideFromDb } from "@/lib/gifts";
import { confirmedTotal, type GiftRow } from "@/lib/giftTable";

export function GiftStatusForm({ id, back, status, label, cls }: { id: string; back: string; status: string; label: string; cls: string }) {
  return (
    <form action={setGiftStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="back" value={back} />
      <button className={`min-h-9 whitespace-nowrap rounded-lg px-3 text-xs font-semibold ${cls}`}>{label}</button>
    </form>
  );
}

const HEAD = ["STT", "Bên nhận", "Tên người gửi", "Ngân hàng gửi", "STK gửi", "Ngày giờ chuyển", "Nội dung", "Số tiền", "Mã giao dịch", "Link bill", "Trạng thái", ""];

/** Bảng tiền mừng online cho chủ thiệp: đối chiếu bill với app ngân hàng rồi xác nhận / từ chối. */
export function GiftTable({ rows, back, csvHref }: { rows: GiftRow[]; back: string; csvHref: string }) {
  const total = confirmedTotal(rows);
  const pending = rows.filter((r) => r.status === "PENDING").length;
  return (
    <section aria-labelledby="tien-mung-online">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="tien-mung-online" className="text-xl font-semibold">
            Tiền mừng online
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600">
            Khách tự gửi bill. Mở app ngân hàng của bạn, đối chiếu số tiền, giờ chuyển và mã giao dịch, rồi bấm <b>Xác nhận</b> hoặc <b>Từ chối</b>. Chỉ dòng đã xác nhận được cộng vào tổng.
          </p>
        </div>
        <a href={csvHref} className="btn btn-outline">
          ⬇ Xuất CSV
        </a>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <div className="text-xl font-semibold tabular-nums sm:text-2xl">{money(total)}</div>
          <div className="text-sm text-zinc-500">Tổng đã xác nhận</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xl font-semibold sm:text-2xl">{pending}</div>
          <div className="text-sm text-zinc-500">Chờ xác nhận</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xl font-semibold sm:text-2xl">{rows.length}</div>
          <div className="text-sm text-zinc-500">Bill đã gửi</div>
        </div>
      </div>
      <div className="card mt-3 overflow-x-auto p-0">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              {HEAD.map((h, i) => (
                <th key={i} className="whitespace-nowrap px-3 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={HEAD.length} className="px-4 py-8 text-center text-zinc-500">
                  Chưa có bill nào.
                </td>
              </tr>
            )}
            {[...rows].reverse().map((r) => {
              const side = sideFromDb(r.side);
              const st = isGiftStatus(r.status) ? GIFT_STATUS[r.status] : GIFT_STATUS.PENDING;
              return (
                <tr key={r.id} className="border-t border-zinc-100 align-top">
                  <td className="px-3 py-3 tabular-nums">{r.stt}</td>
                  <td className="px-3 py-3">{side ? SIDE_LABEL[side] : r.receiverLabel}</td>
                  <td className="px-3 py-3 font-medium">{r.senderName}</td>
                  <td className="px-3 py-3">{r.senderBank}</td>
                  <td className="px-3 py-3 font-mono">{r.senderAccountMasked}</td>
                  <td className="whitespace-nowrap px-3 py-3">{r.transferAt.replace("T", " ")}</td>
                  <td className="max-w-48 break-words px-3 py-3">{r.content}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{r.amount != null ? money(r.amount) : ""}</td>
                  <td className="break-all px-3 py-3 font-mono text-xs">{r.txnCode}</td>
                  <td className="px-3 py-3">
                    <a href={`/b/${r.code}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-brand underline">
                      /b/{r.code}
                    </a>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      {r.status !== "CONFIRMED" && <GiftStatusForm id={r.id} back={back} status="CONFIRMED" label="Xác nhận" cls="bg-emerald-600 text-white" />}
                      {r.status !== "REJECTED" && <GiftStatusForm id={r.id} back={back} status="REJECTED" label="Từ chối" cls="border border-zinc-300" />}
                      {r.status !== "PENDING" && <GiftStatusForm id={r.id} back={back} status="PENDING" label="Hoàn tác" cls="text-zinc-500 underline" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
