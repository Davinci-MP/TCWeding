"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { disconnect, linkChat, sendNotice, setBot } from "@/lib/notify";

export type NotifyState = { error?: string; ok?: string } | undefined;

export async function notifyAction(_: NotifyState, fd: FormData): Promise<NotifyState> {
  await requireAdmin();
  const op = fd.get("op");
  let error = "";
  let ok = "";
  if (op === "bot") error = await setBot(String(fd.get("token") ?? "").trim());
  else if (op === "link") {
    error = await linkChat();
    ok = "Đã kết nối và gửi một tin thử.";
  } else if (op === "test") {
    error = await sendNotice("Tin thử từ TCWedding.");
    ok = "Đã gửi tin thử.";
  } else if (op === "off") await disconnect();
  revalidatePath("/admin/orders");
  return error ? { error } : { ok };
}
