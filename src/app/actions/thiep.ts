"use server";

import { randomBytes, randomInt } from "node:crypto";
import { access } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { db } from "@/lib/db";
import { orderNotice } from "@/lib/notify";
import { settingsError } from "@/lib/orders";
import { rateLimit } from "@/lib/rateLimit";
import { getMusicLibrary, getOrderSettings } from "@/lib/settings";
import { getTemplateWithConfig } from "@/lib/templates";
import { draftExtras, draftToInvitationData, getSlideStyle, mainDate, normalizeDraft, templateCode } from "@/lib/thiep";
import { UPLOAD_DIR } from "@/lib/uploads";
import { ensureVisitorId } from "@/lib/visitor";
import { TRACKS } from "@/templates/music/tracks";

export type ThiepSubmitResult = { error?: string; token?: string };

async function fileExists(url: string) {
  const name = url.replace(/^\/api\/files\//, "");
  return access(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name))
    .then(() => true)
    .catch(() => false);
}

/** Khách gửi thông tin làm thiệp từ /thiep: tạo đơn mới, không cần tài khoản, không bắt trả tiền trước. */
export async function submitThiepAction(json: string): Promise<ThiepSubmitResult> {
  let raw: unknown;
  try {
    raw = JSON.parse(String(json).slice(0, 200_000));
  } catch {
    return { error: "Dữ liệu không hợp lệ, vui lòng tải lại trang." };
  }
  const d = normalizeDraft(raw);
  const tpl = d.templateId ? await getTemplateWithConfig(d.templateId) : null;
  if (!tpl?.isActive) return { error: "Vui lòng chọn mẫu thiệp (bước 1)." };
  if (!d.groom.name.trim() || !d.bride.name.trim()) return { error: "Vui lòng nhập tên chú rể và cô dâu (bước 2)." };
  const main = mainDate(d);
  if (!main) return { error: "Vui lòng nhập ngày cho ít nhất một lễ cưới (bước 4)." };
  const phone = d.phone.replace(/[\s.()-]/g, "");
  if (!/^(\+84|0)\d{9,10}$/.test(phone)) return { error: "Số điện thoại không hợp lệ (bước 9)." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
  if (!rateLimit(`thiep-order:${ip}`, 5, 3600_000)) return { error: "Bạn gửi quá nhiều lần, vui lòng thử lại sau hoặc nhắn Zalo cho studio." };

  // Chỉ giữ ảnh thật sự đã tải lên
  const photos = (await Promise.all(d.photos.map(async (u) => ((await fileExists(u)) ? u : "")))).filter(Boolean);
  for (const g of [d.gifts.groom, d.gifts.bride]) if (g.qr && !(await fileExists(g.qr))) g.qr = "";
  d.photos = photos;

  const library = await getMusicLibrary();
  const musicLabel = d.music.startsWith("track:")
    ? (TRACKS.find((t) => t.id === d.music.slice(6))?.name ?? "Studio chọn giúp")
    : d.music.startsWith("lib:")
      ? (library.find((t) => t.id === d.music.slice(4))?.name ?? "Studio chọn giúp")
      : d.music === "other"
        ? "Bài khác (xem yêu cầu thêm)"
        : "Studio chọn giúp";
  const slide = d.slideshow ? getSlideStyle(d.slideshowId) : undefined;
  const extras = draftExtras(d, musicLabel, slide?.code ?? "");

  const settings = await getOrderSettings();
  const deposit = settings.enabled && !settingsError(settings) ? settings.deposit : 0;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = `TCW${Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join("")}`;
  const token = randomBytes(24).toString("base64url");
  const visitorId = await ensureVisitorId();
  const data = draftToInvitationData(d);
  // Lưu bài nhạc thư viện vào dữ liệu thiệp để admin không phải chọn lại
  const lib = d.music.startsWith("lib:") ? library.find((t) => t.id === d.music.slice(4)) : undefined;
  if (lib) Object.assign(data, { music: "file", musicUrl: lib.url, musicName: lib.name });

  const o = await db.order.create({
    data: {
      code,
      token,
      contactName: (d.contactName || `${d.groom.name} & ${d.bride.name}`).slice(0, 80),
      phone,
      groom: d.groom.name.slice(0, 60),
      bride: d.bride.name.slice(0, 60),
      weddingDate: main.date,
      templateId: tpl.id,
      details: `Mẫu ${templateCode(tpl.id)} · ${tpl.name}\n${extras}`.slice(0, 4000),
      price: settings.price,
      deposit,
      draft: JSON.stringify(data),
      extras: JSON.stringify({ musicLabel, slideshow: d.slideshow, slideshowId: slide?.id ?? "", photoLinks: d.photoLinks, note: d.note, groomRank: d.groom.rank, brideRank: d.bride.rank }),
      visitorId,
      photos: { create: photos.map((url) => ({ url })) },
    },
  });
  after(() => orderNotice(`Đơn làm thiệp mới${d.slideshow ? " (kèm slideshow)" : ""}`, o));
  revalidatePath("/admin", "layout");
  return { token };
}
