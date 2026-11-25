import "server-only";
import { db } from "@/lib/db";

/** Trang "Về tôi" (/ve-toi): giới thiệu nhiếp ảnh gia / chủ studio. Admin sửa ở /admin/about. */
export type AboutItem = { title: string; body: string };
export type AboutBlock = { eyebrow: string; title: string; body: string };
export type AboutContent = {
  eyebrow: string;
  headline: string;
  name: string;
  role: string;
  intro: string;
  photo: string;
  stats: { value: string; label: string }[];
  storyTitle: string;
  storyBody: string;
  fieldsTitle: string;
  fields: AboutItem[];
  blocks: AboutBlock[];
  reviewText: string;
  reviewUrl: string;
};

export const ABOUT_FIELD_SLOTS = 6;
export const ABOUT_BLOCK_SLOTS = 3;

export const ABOUT_DEFAULTS: AboutContent = {
  eyebrow: "Nhiếp ảnh gia cưới",
  headline: "Mỗi bộ ảnh bắt đầu từ việc hiểu hai bạn là ai.",
  name: "TCWedding",
  role: "Wedding Photographer & Creative Director",
  intro: "Chúng tôi chụp ảnh cưới, làm thiệp mời online và album in trong cùng một tông màu, để câu chuyện của hai bạn liền mạch từ buổi chụp đến ngày cưới.",
  photo: "",
  stats: [
    { value: "", label: "năm kinh nghiệm" },
    { value: "", label: "cặp đôi đã chụp" },
    { value: "", label: "album đã bàn giao" },
  ],
  storyTitle: "Xin chào, chúng tôi là TCWedding",
  storyBody:
    "Chúng tôi đến với nhiếp ảnh cưới từ niềm yêu thích những khoảnh khắc thật, không gượng ép.\n\nMỗi buổi chụp đều bắt đầu bằng một cuộc trò chuyện: hai bạn gặp nhau thế nào, thích điều gì, muốn giữ lại cảm xúc ra sao. Từ đó chúng tôi chọn ánh sáng, địa điểm và cách dẫn dắt phù hợp.",
  fieldsTitle: "Những gì chúng tôi làm",
  fields: [
    { title: "Chụp ảnh cưới", body: "Studio, ngoại cảnh và phóng sự ngày cưới, chú trọng cảm xúc, ánh sáng và bố cục." },
    { title: "Thiệp mời online", body: "Thiệp cưới gửi bằng một đường link, dùng chính ảnh cưới của hai bạn." },
    { title: "Slideshow tiệc cưới", body: "Video trình chiếu ảnh cưới trên màn hình tiệc, có nhạc và lời tri ân." },
    { title: "Ghép & in album", body: "Chọn ảnh, chỉnh màu đồng bộ và dàn trang album theo khổ hai bạn thích." },
    { title: "", body: "" },
    { title: "", body: "" },
  ],
  blocks: [
    { eyebrow: "Cách chúng tôi làm việc", title: "Rõ ràng từ buổi tư vấn đến ngày bàn giao", body: "Lịch chụp, trang phục, số ảnh, thời gian chỉnh sửa đều được thống nhất trước, để hai bạn yên tâm tận hưởng ngày chụp." },
    { eyebrow: "", title: "", body: "" },
    { eyebrow: "", title: "", body: "" },
  ],
  reviewText: "",
  reviewUrl: "",
};

const KEY = "about";

export async function getAbout(): Promise<AboutContent> {
  const row = await db.siteSetting.findUnique({ where: { key: KEY } }).catch(() => null);
  if (!row) return ABOUT_DEFAULTS;
  try {
    const s = JSON.parse(row.value) as Partial<AboutContent>;
    const d = ABOUT_DEFAULTS;
    return {
      ...d,
      ...s,
      stats: d.stats.map((x, i) => ({ ...x, ...(s.stats?.[i] as Partial<typeof x> | undefined) })),
      fields: d.fields.map((x, i) => (Array.isArray(s.fields) ? { title: "", body: "", ...(s.fields[i] as Partial<AboutItem> | undefined) } : x)),
      blocks: d.blocks.map((x, i) => (Array.isArray(s.blocks) ? { eyebrow: "", title: "", body: "", ...(s.blocks[i] as Partial<AboutBlock> | undefined) } : x)),
    };
  } catch {
    return ABOUT_DEFAULTS;
  }
}

export async function saveAbout(content: AboutContent) {
  const value = JSON.stringify(content);
  await db.siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
}
