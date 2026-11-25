"use client";

import { useSyncExternalStore } from "react";

/** Ảnh khách thả tim. Lưu trên trình duyệt (localStorage), gửi kèm form đặt lịch tư vấn. */
export type Favorite = { url: string; album: string; albumTitle: string };

const KEY = "tcw-favorites";
const EVENT = "tcw-favorites-change";
export const MAX_FAVORITES = 60;
const EMPTY: Favorite[] = [];

let cache: { raw: string | null; list: Favorite[] } = { raw: null, list: EMPTY };

function read(): Favorite[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.list;
  let list: Favorite[] = EMPTY;
  try {
    const a = JSON.parse(raw ?? "[]");
    if (Array.isArray(a)) list = a.filter((x) => x && typeof x.url === "string").slice(0, MAX_FAVORITES);
  } catch {}
  cache = { raw, list };
  return list;
}

function write(list: Favorite[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useFavorites() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Thả tim / bỏ tim. Trả về false nếu đã đủ số ảnh tối đa. */
export function toggleFavorite(f: Favorite) {
  const list = read();
  if (list.some((x) => x.url === f.url)) {
    write(list.filter((x) => x.url !== f.url));
    return true;
  }
  if (list.length >= MAX_FAVORITES) return false;
  write([...list, f]);
  return true;
}

export function removeFavorite(url: string) {
  write(read().filter((x) => x.url !== url));
}

export function clearFavorites() {
  write([]);
}
