"use client";

import { useState } from "react";

export function CopyLink({ path, label = "Sao chép link" }: { path: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-outline min-h-11"
      onClick={async () => {
        const url = location.origin + path;
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
        } catch {
          prompt("Sao chép link:", url);
        }
      }}
    >
      {done ? "Đã sao chép" : label}
    </button>
  );
}
