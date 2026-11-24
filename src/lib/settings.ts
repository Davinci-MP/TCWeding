import { db } from "@/lib/db";
import { DEFAULT_PLANS, type Plan } from "@/lib/plans";

const PLANS_KEY = "plans";

/** Bảng giá hiện hành: bản admin đã lưu, trộn với mặc định để luôn đủ trường. */
export async function getPlans(): Promise<Plan[]> {
  const row = await db.siteSetting.findUnique({ where: { key: PLANS_KEY } }).catch(() => null);
  if (!row) return DEFAULT_PLANS;
  try {
    const saved = JSON.parse(row.value) as Partial<Plan>[];
    return DEFAULT_PLANS.map((d) => ({ ...d, ...saved.find((s) => s.id === d.id), id: d.id }));
  } catch {
    return DEFAULT_PLANS;
  }
}

/** Bài nhạc do quản trị viên tải lên (bản thu có bản quyền) để người dùng chọn. */
export type LibraryTrack = { id: string; name: string; note: string; url: string };
const MUSIC_KEY = "music";

export async function getMusicLibrary(): Promise<LibraryTrack[]> {
  const row = await db.siteSetting.findUnique({ where: { key: MUSIC_KEY } }).catch(() => null);
  if (!row) return [];
  try {
    const list = JSON.parse(row.value);
    return Array.isArray(list) ? (list as LibraryTrack[]) : [];
  } catch {
    return [];
  }
}

export async function saveMusicLibrary(list: LibraryTrack[]) {
  const value = JSON.stringify(list);
  await db.siteSetting.upsert({ where: { key: MUSIC_KEY }, create: { key: MUSIC_KEY, value }, update: { value } });
}

export async function savePlans(plans: Plan[]) {
  const value = JSON.stringify(plans);
  await db.siteSetting.upsert({ where: { key: PLANS_KEY }, create: { key: PLANS_KEY, value }, update: { value } });
}
