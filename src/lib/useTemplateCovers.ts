"use client";

// Ảnh bìa riêng của các mẫu (TemplateConfig) cho kho mẫu: tải một lần mỗi lần mở trang, dùng chung cho mọi thumbnail.

import { useSyncExternalStore } from "react";
import type { TemplateCoverMap } from "./templateCover";

let covers: TemplateCoverMap | null = null;
let loading = false;
const subs = new Set<() => void>();

function load() {
  if (covers || loading || typeof window === "undefined") return;
  loading = true;
  fetch("/api/template-covers")
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((m: TemplateCoverMap) => {
      covers = m && typeof m === "object" ? m : {};
      subs.forEach((f) => f());
    });
}

/** null = đang tải (thumbnail chờ để không nháy ảnh demo cũ rồi mới đổi sang ảnh bìa mới). */
export function useTemplateCovers(): TemplateCoverMap | null {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      load();
      return () => subs.delete(cb);
    },
    () => covers,
    () => null,
  );
}

