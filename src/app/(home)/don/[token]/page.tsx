import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { approveOrderAction, claimInvitationAction, claimPaymentAction, customerMessageAction, deleteOrderPhotoAction } from "@/app/actions/orders";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CopyLink } from "@/components/order/CopyLink";
import { Messages } from "@/components/order/Messages";
import { PhotoUploader } from "@/components/order/PhotoUploader";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BANKS } from "@/lib/invitation";
import { isOpen, MAX_ORDER_PHOTOS, money, ORDER_STATUS, ORDER_STEPS, paymentQrUrl, settingsError, viDate, type OrderStatus } from "@/lib/orders";
import { getOrderSettings } from "@/lib/settings";
import { getTemplateDef } from "@/templates/registry";

// Link là chìa khoá của đơn: không cho máy tìm kiếm lưu, không lộ qua Referer
export const metadata: Metadata = { title: "Đơn đặt thiệp", robots: { index: false, follow: false }, referrer: "same-origin" };

export default async function OrderDetail({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const o = await db.order.findUnique({
    where: { token },
    include: {
      photos: { orderBy: { createdAt: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
      invitation: { select: { slug: true } },
    },
  });
  if (!o) notFound();
  const [s, user] = await Promise.all([getOrderSettings(), getCurrentUser()]);
  const status = o.status as OrderStatus;
  const step = ORDER_STEPS.indexOf(status);
  const open = isOpen(status);
  const remaining = o.price - (o.depositPaidAt ? o.deposit : 0);
  const payNow = status === "NEW" && !o.depositPaidAt ? o.deposit : status === "APPROVED" && !o.finalPaidAt ? remaining : 0;
  const claimed = status === "NEW" ? o.depositClaimedAt : o.finalClaimedAt;
  const hidden = <input type="hidden" name="token" value={token} />;

  return (
    <section className="bg-[#f6f2ec] px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-600">
              Đơn <span className="font-mono font-semibold">{o.code}</span> · mẫu {getTemplateDef(o.templateId).name}
            </p>
            <h1 className="font-serif-display mt-1 text-4xl sm:text-5xl">
              {o.groom} & {o.bride}
            </h1>
          </div>
          <CopyLink path={`/don/${token}`} label="Sao chép link đơn" />
        </div>
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Hãy lưu link trang này. Ai có link đều xem được đơn, nên đừng gửi cho người lạ.</p>

        {status === "CANCELLED" ? (
          <p className="card font-semibold">Đơn đã huỷ.</p>
        ) : (
          <ol className="card grid gap-3 sm:grid-cols-5">
            {ORDER_STEPS.map((st, i) => (
              <li key={st} aria-current={i === step ? "step" : undefined} className={`border-t-4 pt-2 text-sm ${i <= step ? "border-brand font-semibold text-brand" : "border-zinc-200 text-zinc-500"}`}>
                {st === "REVIEW" ? "Chờ bạn duyệt" : st === "APPROVED" ? "Bạn đã duyệt" : ORDER_STATUS[st]}
              </li>
            ))}
          </ol>
        )}

        {payNow > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold">
              {status === "NEW" ? "Chuyển cọc" : "Thanh toán phần còn lại"}: {money(payNow)}
            </h2>
            {settingsError(s) ? (
              <p className="mt-2 text-sm text-zinc-600">Thông tin chuyển khoản đang được cập nhật, vui lòng nhắn cho chúng tôi bên dưới.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-6 sm:flex-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={paymentQrUrl(s, payNow, o.code)} alt={`Mã QR chuyển ${money(payNow)}`} className="w-56 self-center rounded-xl border border-zinc-200" />
                <dl className="space-y-2 text-sm">
                  {[
                    ["Ngân hàng", BANKS.find((b) => b.code === s.bankCode)?.name ?? s.bankCode],
                    ["Số tài khoản", s.accountNumber],
                    ["Chủ tài khoản", s.accountName],
                    ["Số tiền", money(payNow)],
                    ["Nội dung", o.code],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-zinc-500">{k}</dt>
                      <dd className="font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {claimed ? (
              <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Bạn đã báo chuyển khoản. Chúng tôi đang kiểm tra.</p>
            ) : (
              <form action={claimPaymentAction} className="mt-4">
                {hidden}
                <button className="btn btn-primary min-h-11">Tôi đã chuyển khoản</button>
              </form>
            )}
          </div>
        )}

        {o.invitation && (status === "REVIEW" || status === "APPROVED") && (
          <div className="card">
            <h2 className="text-lg font-semibold">{status === "REVIEW" ? "Thiệp của bạn đã sẵn sàng để duyệt" : "Bạn đã duyệt thiệp"}</h2>
            <p className="mt-1 text-sm text-zinc-600">{status === "REVIEW" ? "Nếu cần sửa, nhắn chỗ cần sửa ở ô bên dưới." : "Thiệp sẽ mở cho khách sau khi hoàn tất thanh toán."}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/don/${token}/xem-thiep`} target="_blank" className="btn btn-outline min-h-11">
                Xem bản nháp
              </Link>
              {status === "REVIEW" && (
                <form action={approveOrderAction}>
                  {hidden}
                  <ConfirmButton className="btn btn-primary min-h-11" message="Duyệt thiệp này?">
                    Duyệt thiệp
                  </ConfirmButton>
                </form>
              )}
            </div>
          </div>
        )}

        {o.invitation && status === "DONE" && (
          <div className="card">
            <h2 className="text-lg font-semibold">Thiệp đã sẵn sàng gửi khách</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/w/${o.invitation.slug}`} target="_blank" className="btn btn-primary min-h-11">
                Mở thiệp
              </Link>
              <CopyLink path={`/w/${o.invitation.slug}`} label="Sao chép link thiệp" />
            </div>
            {o.claimedAt ? (
              <p className="mt-4 text-sm text-zinc-600">Thiệp đã được chuyển về tài khoản của bạn.</p>
            ) : user ? (
              <form action={claimInvitationAction} className="mt-5 border-t border-zinc-100 pt-5">
                {hidden}
                <p className="mb-3 text-sm text-zinc-600">Chuyển thiệp về tài khoản {user.email} để xem khách xác nhận, lời chúc và tự sửa thiệp. Chỉ chuyển được một lần.</p>
                <ConfirmButton className="btn btn-outline min-h-11" message={`Chuyển thiệp về tài khoản ${user.email}?`}>
                  Nhận thiệp về tài khoản
                </ConfirmButton>
              </form>
            ) : (
              <p className="mt-5 border-t border-zinc-100 pt-5 text-sm text-zinc-600">
                Muốn xem khách xác nhận và lời chúc?{" "}
                <Link href="/register" className="text-brand underline">
                  Tạo tài khoản
                </Link>{" "}
                hoặc{" "}
                <Link href="/login" className="text-brand underline">
                  đăng nhập
                </Link>
                , rồi mở lại link này để nhận thiệp.
              </p>
            )}
          </div>
        )}

        <div className="card">
          <h2 className="text-lg font-semibold">
            Ảnh ({o.photos.length}/{MAX_ORDER_PHOTOS})
          </h2>
          <div className="mt-4 space-y-4">
            {open && <PhotoUploader token={token} room={MAX_ORDER_PHOTOS - o.photos.length} />}
            {o.photos.length > 0 && (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {o.photos.map((p, i) => (
                  <li key={p.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={`Ảnh ${i + 1}`} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
                    {open && !o.invitation && (
                      <form action={deleteOrderPhotoAction} className="absolute right-1 top-1">
                        {hidden}
                        <input type="hidden" name="photoId" value={p.id} />
                        <ConfirmButton className="h-9 w-9 cursor-pointer rounded-full bg-black/60 text-white" message="Xoá ảnh này?">
                          <span aria-hidden>✕</span>
                          <span className="sr-only">Xoá ảnh {i + 1}</span>
                        </ConfirmButton>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold">Trao đổi</h2>
          <div className="mt-4">
            <Messages list={o.messages} viewer="CUSTOMER" />
          </div>
          {open && (
            <form action={customerMessageAction} className="mt-4 space-y-3">
              {hidden}
              <textarea name="body" required maxLength={2000} rows={3} className="input" aria-label="Tin nhắn" placeholder={status === "REVIEW" ? "Chỗ cần sửa trong thiệp…" : "Bổ sung thông tin, câu hỏi…"} />
              <button className="btn btn-outline min-h-11">{status === "REVIEW" ? "Gửi yêu cầu sửa" : "Gửi tin nhắn"}</button>
            </form>
          )}
        </div>

        <details className="card">
          <summary className="cursor-pointer font-semibold">Thông tin đã gửi</summary>
          <p className="mt-3 text-sm text-zinc-600">
            {o.contactName} · {o.phone} · cưới ngày {viDate(o.weddingDate)} · giá {money(o.price)}
          </p>
          {o.details && <p className="mt-3 whitespace-pre-wrap break-words text-sm">{o.details}</p>}
        </details>
      </div>
    </section>
  );
}
