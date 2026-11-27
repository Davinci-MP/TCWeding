import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { BILL_MAX_BYTES, BILL_TYPES, giftSide, maskAccount, randomCode, SIDE_LABEL, sideToDb } from "@/lib/gifts";
import { parseInvitationData } from "@/lib/invitation";
import { clientIp, rateLimit } from "@/lib/rateLimit";

// Khách gửi bill tiền mừng. Luôn tạo dòng "Chờ xác nhận"; chủ thiệp tự đối chiếu rồi xác nhận.
// requestId (trình duyệt tạo khi mở form) chống trùng khi gửi lại sau lỗi mạng hoặc bấm hai lần.

const schema = z.object({
  slug: z.string().max(80),
  requestId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/, "Yêu cầu không hợp lệ"),
  giftAccountId: z.string().max(40),
  senderName: z.string().trim().min(1, "Vui lòng nhập tên người gửi").max(80),
  senderBank: z.string().trim().max(60).default(""),
  senderAccount: z.string().trim().max(30).default(""),
  transferAt: z.string().trim().max(30).default(""),
  content: z.string().trim().max(140).default(""),
  amount: z.string().trim().max(20).default(""),
  txnCode: z.string().trim().max(60).default(""),
});

/** Kiểm tra chữ ký file để chắc là ảnh thật (không tin Content-Type do trình duyệt gửi). */
function sniff(b: Uint8Array): (typeof BILL_TYPES)[number] | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

async function existing(invitationId: string, requestId: string) {
  return db.giftRecord.findUnique({ where: { invitationId_requestId: { invitationId, requestId } }, select: { code: true } });
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const parsed = schema.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;

  const inv = await db.invitation.findUnique({ where: { slug: d.slug }, select: { id: true, status: true, data: true } });
  if (!inv || inv.status !== "PUBLISHED") return NextResponse.json({ error: "Thiệp không tồn tại" }, { status: 404 });

  // Gửi lại cùng yêu cầu: trả về dòng đã có, không tạo thêm (kiểm trước khi tính giới hạn tần suất)
  const dup = await existing(inv.id, d.requestId);
  if (dup) return NextResponse.json({ ok: true, duplicate: true, code: dup.code });

  if (!rateLimit(`gift:${clientIp(req)}`, 6)) return NextResponse.json({ error: "Bạn gửi quá nhanh, vui lòng thử lại sau ít phút." }, { status: 429 });

  const file = form.get("bill");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Vui lòng chọn ảnh bill" }, { status: 400 });
  if (file.size > BILL_MAX_BYTES) return NextResponse.json({ error: "Ảnh bill quá lớn (tối đa 1,5MB sau khi nén)" }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniff(bytes);
  if (!mime) return NextResponse.json({ error: "Chỉ nhận ảnh JPG, PNG hoặc WebP" }, { status: 400 });

  const data = parseInvitationData(inv.data);
  const acc = data.gifts.find((g) => g.id === d.giftAccountId);
  if (!acc) return NextResponse.json({ error: "Tài khoản nhận không còn trên thiệp" }, { status: 400 });
  const side = giftSide(acc);
  const amount = Number(d.amount.replace(/\D/g, ""));

  try {
    const rec = await db.giftRecord.create({
      data: {
        invitationId: inv.id,
        requestId: d.requestId,
        code: randomCode(),
        side: sideToDb(side),
        giftAccountId: acc.id,
        receiverLabel: [side ? SIDE_LABEL[side] : acc.label, acc.bankName, acc.accountName].filter(Boolean).join(" · ").slice(0, 160),
        senderName: d.senderName,
        senderBank: d.senderBank,
        senderAccountMasked: maskAccount(d.senderAccount),
        transferAt: d.transferAt,
        content: d.content,
        amount: Number.isFinite(amount) && amount > 0 && amount < 10_000_000_000 ? amount : null,
        txnCode: d.txnCode,
        bill: { create: { mime, data: Buffer.from(bytes) } },
      },
      select: { code: true },
    });
    return NextResponse.json({ ok: true, code: rec.code });
  } catch (e) {
    // Hai yêu cầu giống nhau tới cùng lúc: dòng thứ hai vướng ràng buộc duy nhất → trả dòng đã có
    const again = await existing(inv.id, d.requestId);
    if (again) return NextResponse.json({ ok: true, duplicate: true, code: again.code });
    console.error("gift bill", e);
    return NextResponse.json({ error: "Không lưu được bill, vui lòng thử lại" }, { status: 500 });
  }
}
