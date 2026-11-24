import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";

// Báo đơn qua Telegram. Mã bot chỉ dùng trên server, không bao giờ gửi xuống trình duyệt.
export type Notify = { token: string; bot: string; linkCode: string; chatId: string; chatName: string; error: string };

const KEY = "notify";
const EMPTY: Notify = { token: "", bot: "", linkCode: "", chatId: "", chatName: "", error: "" };
const API = process.env.TELEGRAM_API_URL || "https://api.telegram.org";
const TOKEN_RE = /^\d{5,20}:[\w-]{30,60}$/;

export async function getNotify(): Promise<Notify> {
  const row = await db.siteSetting.findUnique({ where: { key: KEY } }).catch(() => null);
  try {
    return row ? { ...EMPTY, ...(JSON.parse(row.value) as Partial<Notify>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

async function save(n: Notify) {
  const value = JSON.stringify(n);
  await db.siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
}

type TgResult<T> = { ok: true; result: T } | { ok: false; error: string };

async function call<T>(token: string, method: string, body: object = {}): Promise<TgResult<T>> {
  try {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const j = (await res.json()) as { ok: boolean; result: T; description?: string };
    return j.ok ? { ok: true, result: j.result } : { ok: false, error: `Telegram báo lỗi ${res.status}: ${j.description ?? ""}`.slice(0, 200) };
  } catch {
    // Không ghi lỗi gốc: nội dung có thể chứa URL kèm mã bot
    return { ok: false, error: "Không kết nối được Telegram." };
  }
}

/** Lưu mã bot mới, trả về lỗi nếu mã sai. */
export async function setBot(token: string) {
  if (!TOKEN_RE.test(token)) return "Mã bot không đúng định dạng.";
  const me = await call<{ username: string }>(token, "getMe");
  if (!me.ok) return me.error;
  await save({ ...EMPTY, token, bot: me.result.username, linkCode: randomBytes(12).toString("hex") });
  return "";
}

/** Tìm người đã mở bot bằng đúng link kết nối; người lạ nhắn bot sẽ không khớp mã. */
export async function linkChat() {
  const n = await getNotify();
  if (!n.token || !n.linkCode) return "Chưa có bot để kết nối.";
  type Update = { message?: { text?: string; chat: { id: number; type: string; first_name?: string; username?: string } } };
  const r = await call<Update[]>(n.token, "getUpdates", { allowed_updates: ["message"], offset: -100, limit: 100 });
  if (!r.ok) return r.error;
  const m = r.result.find((u) => u.message?.text === `/start ${n.linkCode}` && u.message.chat.type === "private")?.message;
  if (!m) return "Chưa thấy tin nhắn. Mở link kết nối, bấm Start trong Telegram rồi thử lại.";
  await save({ ...n, linkCode: "", chatId: String(m.chat.id), chatName: m.chat.first_name || m.chat.username || "Telegram", error: "" });
  return sendNotice("Đã kết nối. Đơn đặt thiệp mới sẽ báo về đây.");
}

export async function disconnect() {
  await db.siteSetting.deleteMany({ where: { key: KEY } });
}

/** Gửi thông báo; lỗi được lưu lại để admin thấy, không làm hỏng thao tác của khách. */
export async function sendNotice(text: string): Promise<string> {
  try {
    const n = await getNotify();
    if (!n.chatId) return "Chưa kết nối Telegram.";
    const r = await call(n.token, "sendMessage", { chat_id: n.chatId, text });
    const error = r.ok ? "" : r.error;
    const now = await getNotify(); // admin có thể vừa ngắt hoặc đổi bot
    if (error !== now.error && now.chatId === n.chatId && now.token === n.token) await save({ ...now, error });
    if (error) console.error("[notify]", error);
    return error;
  } catch {
    console.error("[notify] không gửi được thông báo");
    return "Không gửi được thông báo.";
  }
}

/** Tin báo chỉ có mã đơn và tên cặp đôi; chi tiết xem trong trang quản trị. */
export function orderNotice(what: string, o: { id: string; code: string; groom: string; bride: string }) {
  const base = (process.env.APP_URL || "https://tcwedding.vn").replace(/\/$/, "");
  return sendNotice(`${what}\n${o.groom} & ${o.bride} (${o.code})\n${base}/admin/orders/${o.id}`);
}
