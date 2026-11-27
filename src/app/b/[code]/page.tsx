import type { Metadata } from "next";
import Link from "next/link";
import { GiftStatusForm } from "@/components/gifts/GiftTable";
import { canManageInvitation } from "@/lib/auth";
import { db } from "@/lib/db";
import { GIFT_STATUS, isGiftStatus, money } from "@/lib/gifts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bill tiền mừng", robots: { index: false, follow: false }, referrer: "no-referrer" };

// Link ngắn xem bill (kiểu prnt.sc nhưng lưu ở kho riêng của TCWedding): chỉ chủ thiệp, admin
// hoặc người đã mở link đơn của thiệp xem được.
export default async function BillPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const rec = await db.giftRecord.findUnique({
    where: { code },
    select: {
      id: true,
      invitationId: true,
      receiverLabel: true,
      senderName: true,
      senderBank: true,
      senderAccountMasked: true,
      transferAt: true,
      content: true,
      amount: true,
      txnCode: true,
      status: true,
      createdAt: true,
      invitation: { select: { userId: true, title: true } },
    },
  });
  const allowed = rec ? await canManageInvitation(rec.invitationId, rec.invitation.userId) : false;
  if (!rec || !allowed)
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[#f6f2ec] px-4 text-center">
        <h1 className="font-serif-display text-3xl">Không mở được bill này</h1>
        <p className="max-w-md text-zinc-600">
          Link bill chỉ xem được bởi chủ thiệp hoặc người quản lý thiệp. Nếu bạn là cô dâu chú rể, hãy mở link đơn đặt thiệp trước (hoặc đăng nhập), rồi mở lại link này.
        </p>
        <Link href="/login" className="btn btn-outline">
          Đăng nhập
        </Link>
      </main>
    );
  const st = isGiftStatus(rec.status) ? GIFT_STATUS[rec.status] : GIFT_STATUS.PENDING;
  const back = `/b/${code}`;
  const rows: [string, string][] = [
    ["Thiệp", rec.invitation.title],
    ["Bên nhận", rec.receiverLabel],
    ["Người gửi", rec.senderName],
    ["Ngân hàng gửi", rec.senderBank],
    ["STK gửi", rec.senderAccountMasked],
    ["Ngày giờ chuyển", rec.transferAt.replace("T", " ")],
    ["Nội dung", rec.content],
    ["Số tiền", rec.amount != null ? money(rec.amount) : ""],
    ["Mã giao dịch", rec.txnCode],
    ["Gửi lúc", rec.createdAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })],
  ];
  return (
    <main className="min-h-svh bg-[#f6f2ec] px-4 py-8">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[minmax(0,1fr)_340px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/b/${code}/anh`} alt={`Bill chuyển khoản của ${rec.senderName}`} className="w-full rounded-2xl bg-white object-contain shadow" />
        <div className="card h-fit space-y-4 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-sm text-zinc-500">/b/{code}</p>
            <span className={`rounded-full px-2 py-1 text-xs ${st.cls}`}>{st.label}</span>
          </div>
          <dl className="space-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-2">
                <dt className="text-zinc-500">{k}</dt>
                <dd className="break-words font-medium">{v || <span className="text-zinc-400">—</span>}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-zinc-500">Đối chiếu với lịch sử giao dịch trong app ngân hàng trước khi xác nhận. Ảnh và thông tin do khách tự gửi.</p>
          <div className="flex flex-wrap gap-2">
            {rec.status !== "CONFIRMED" && <GiftStatusForm id={rec.id} back={back} status="CONFIRMED" label="Đã xác nhận" cls="bg-emerald-600 text-white" />}
            {rec.status !== "REJECTED" && <GiftStatusForm id={rec.id} back={back} status="REJECTED" label="Từ chối" cls="border border-zinc-300 bg-white" />}
            {rec.status !== "PENDING" && <GiftStatusForm id={rec.id} back={back} status="PENDING" label="Về chờ xác nhận" cls="text-zinc-600 underline" />}
          </div>
        </div>
      </div>
    </main>
  );
}
