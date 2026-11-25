"use client";

import { emptyDraft, normalizeDraft, type ThiepDraft } from "@/lib/thiep";

/** Bản nháp form làm thiệp, lưu trên máy khách (localStorage). */
export const DRAFT_KEY = "tcw-thiep-draft";

export function loadDraft(): ThiepDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? normalizeDraft(JSON.parse(raw)) : emptyDraft();
  } catch {
    return emptyDraft();
  }
}

export function saveDraft(d: ThiepDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

/** Ghi một phần vào bản nháp (vd chọn mẫu slideshow từ trang chủ) rồi mới mở form. */
export function patchDraft(patch: Partial<ThiepDraft>) {
  saveDraft({ ...loadDraft(), ...patch });
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}
