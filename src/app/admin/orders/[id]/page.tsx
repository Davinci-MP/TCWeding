import Link from "next/link";
import { notFound } from "next/navigation";
import { buildInvitationAction, confirmPaymentAction, deleteOrderAction, saveAdminNoteAction, setOrderStatusAction, shopMessageAction, syncPhotosAction } from "@/app/actions/orders";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CopyLink } from "@/components/order/CopyLink";
import { Messages } from "@/components/order/Messages";
import { db } from "@/lib/db";
import { isOpen, money, ORDER_STATUS, viDate, type OrderStatus } from "@/lib/orders";
import { getTemplateDef } from "@/templates/registry";

export const metadata = { title: "Chi tiết đơn" };

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const o = await db.order.findUnique({
    where: { id: (await params).id },
    include: { photos: { orderBy: { createdAt: "asc" } }, messages: { orderBy: { createdAt: "asc" } }, invitation: { select: { slug: true, data: true } } },
  });
  if (!o) notFound();
  const st = o.status as OrderStatus;
  const inv = o.invitation;
  const remaining = o.price - (o.depositPaidAt ? o.deposit : 0);
  const paid = remaining <= 0 || !!o.finalPaidAt;
  const extra = inv ? o.photos.filter((p) => !inv.data.includes(p.url)).length : 0;
  const id = <input type="hidden" name="id" value={o.id} />;
  const go = (to: OrderStatus, label: string, cls = "btn btn-primary") => (
    <form action={setOrderStatusAction}>
      {id}
      <input type="hidden" name="to" value={to} />
      <button className={cls}>{label}</button>
    </form>
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-zinc-500 hover:underline">
          ← Đơn đặt thiệp
        </Link>
        <h1 className="font-display mt-1 text-3xl font-semibold">
          {o.groom} & {o.bride}
        </h1>
        <p className="text-sm text-zinc-500">
          <span className="font-mono">{o.code}</span> · {ORDER_STATUS[st]}
        </p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold">Bước tiếp theo</h2>
        <div className="flex flex-wrap items-center gap-3">
          {st === "NEW" && o.deposit > 0 && (
            <form action={confirmPaymentAction}>
              {id}
              <input type="hidden" name="kind" value="deposit" />
              <ConfirmButton className="btn btn-primary" message={`Đã thấy ${money(o.deposit)} trong tài khoản?`}>
                Xác nhận đã nhận cọc {money(o.deposit)}
              </ConfirmButton>
            </form>
          )}
          {st === "NEW" && o.deposit === 0 && go("WORKING", "Bắt đầu làm")}
          {st === "WORKING" && (
            <form action={buildInvitationAction}>
              {id}
              <button className={`btn ${inv ? "btn-outline" : "btn-primary"}`}>{inv ? "Sửa thiệp" : "Tạo thiệp từ đơn"}</button>
            </form>
          )}
          {st === "WORKING" && inv && go("REVIEW", "Gửi khách duyệt")}
          {st === "REVIEW" && <p className="text-sm text-zinc-600">Đang chờ khách duyệt.</p>}
          {(st === "REVIEW" || st === "APPROVED") && go("WORKING", "Chuyển về đang làm", "btn btn-outline")}
          {st === "APPROVED" && !paid && (
            <form action={confirmPaymentAction}>
              {id}
              <input type="hidden" name="kind" value="final" />
              <ConfirmButton className="btn btn-primary" message={`Đã thấy ${money(remaining)} trong tài khoản?`}>
                Xác nhận đã nhận {money(remaining)}
              </ConfirmButton>
            </form>
          )}
          {st === "APPROVED" && paid && go("DONE", "Xuất bản và bàn giao")}
          {st === "DONE" && <p className="text-sm text-zinc-600">{o.claimedAt ? "Khách đã nhận thiệp về tài khoản." : "Khách chưa nhận thiệp về tài khoản."}</p>}
          {st === "CANCELLED" && go(o.depositPaidAt ? "WORKING" : "NEW", "Mở lại đơn", "btn btn-outline")}
          {inv && (
            <Link href={`/w/${inv.slug}`} target="_blank" className="btn btn-outline">
              Xem thiệp
            </Link>
          )}
          {extra > 0 && isOpen(st) && (
            <form action={syncPhotosAction}>
              {id}
              <button className="btn btn-outline">Thêm {extra} ảnh chưa dùng vào album</button>
            </form>
          )}
        </div>
        <ul className="text-sm text-zinc-600">
          <li>
            Giá {money(o.price)}, cọc {money(o.deposit)}
          </li>
          {o.deposit > 0 && <li>Cọc: {o.depositPaidAt ? "đã nhận" : o.depositClaimedAt ? "khách báo đã chuyển, cần kiểm tra tài khoản" : "chưa chuyển"}</li>}
          <li>Còn lại: {paid ? "đã nhận đủ" : `${money(remaining)}${o.finalClaimedAt ? ", khách báo đã chuyển" : ""}`}</li>
        </ul>
        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4">
          <CopyLink path={`/don/${o.token}`} label="Sao chép link đơn của khách" />
          <span className="ml-auto" />
          {isOpen(st) && (
            <form action={setOrderStatusAction}>
              {id}
              <input type="hidden" name="to" value="CANCELLED" />
              <ConfirmButton message="Huỷ đơn này?">Huỷ đơn</ConfirmButton>
            </form>
          )}
          {st === "CANCELLED" && (
            <form action={deleteOrderAction}>
              {id}
              <ConfirmButton message="Xoá vĩnh viễn đơn và ảnh khách gửi? Không thể hoàn tác.">Xoá vĩnh viễn</ConfirmButton>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-3 text-sm">
          <h2 className="text-base font-semibold">Thông tin khách gửi</h2>
          <p>
            {o.contactName} ·{" "}
            <a href={`tel:${o.phone}`} className="text-brand underline">
              {o.phone}
            </a>
          </p>
          <p>
            Ngày cưới {viDate(o.weddingDate)} · mẫu {getTemplateDef(o.templateId).name}
          </p>
          <p className="whitespace-pre-wrap break-words">{o.details || "Không có mô tả."}</p>
          <form action={saveAdminNoteAction} className="space-y-2 border-t border-zinc-100 pt-3">
            {id}
            <label className="block">
              <span className="label">Ghi chú nội bộ (khách không thấy)</span>
              <textarea key={o.adminNote} name="adminNote" defaultValue={o.adminNote} rows={3} maxLength={2000} className="input" />
            </label>
            <button className="btn btn-outline">Lưu ghi chú</button>
          </form>
        </div>
        <div className="card">
          <h2 className="font-semibold">Trao đổi</h2>
          <div className="mt-3">
            <Messages list={o.messages} viewer="SHOP" />
          </div>
          <form action={shopMessageAction} className="mt-4 space-y-2">
            {id}
            <textarea name="body" required rows={3} maxLength={2000} className="input" aria-label="Tin nhắn cho khách" />
            <button className="btn btn-outline">Gửi cho khách</button>
          </form>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold">Ảnh khách gửi ({o.photos.length})</h2>
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {o.photos.map((p, i) => (
            <li key={p.id}>
              <a href={p.url} target="_blank">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Ảnh ${i + 1}`} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
