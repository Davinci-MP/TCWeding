"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Mẫu thiệp khách thả tim. Lưu trên server theo cookie ẩn danh (lần sau quay lại vẫn còn,
 * studio biết khách thích mẫu nào), kèm bản sao trong localStorage để hiện ngay khi tải trang.
 */
const KEY = "tcw-tpl-favs";
let list: string[] = [];
let loaded = false;
let loading: Promise<void> | null = null;
const subs = new Set<() => void>();
const EMPTY: string[] = [];

function emit(next: string[]) {
  list = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  subs.forEach((f) => f());
}

function init() {
  if (loaded || typeof window === "undefined") return loading;
  loaded = true;
  try {
    const cached = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (Array.isArray(cached)) list = cached.filter((x) => typeof x === "string");
  } catch {}
  loading = fetch("/api/favorites", { cache: "no-store" })
    .then((r) => r.json())
    .then((j: { templates?: string[] }) => {
      if (Array.isArray(j.templates)) emit(j.templates);
    })
    .catch(() => {});
  return loading;
}

const subscribe = (cb: () => void) => {
  subs.add(cb);
  return () => subs.delete(cb);
};

export function useTemplateFavorites() {
  useEffect(() => {
    init();
    subs.forEach((f) => f());
  }, []);
  return useSyncExternalStore(subscribe, () => list, () => EMPTY);
}

export async function toggleTemplateFavorite(id: string) {
  await init();
  const liked = !list.includes(id);
  const prev = list;
  emit(liked ? [...list, id] : list.filter((x) => x !== id));
  try {
    const r = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId: id, liked }) });
    const j = (await r.json()) as { templates?: string[]; error?: string };
    if (!r.ok) throw new Error(j.error);
    if (Array.isArray(j.templates)) emit(j.templates);
  } catch (e) {
    emit(prev);
    alert((e as Error).message || "Không lưu được, vui lòng thử lại.");
  }
}
