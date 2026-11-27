"use client";

import { useEffect } from "react";

/** Trên trang đơn: xin cookie quyền quản lý thiệp để mở được link bill /b/<mã>. */
export function GrantAccess({ token }: { token: string }) {
  useEffect(() => {
    fetch(`/api/don/${encodeURIComponent(token)}/access`, { method: "POST" }).catch(() => {});
  }, [token]);
  return null;
}
