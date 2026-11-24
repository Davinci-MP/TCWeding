"use client";

import { useState } from "react";
import { UploadButton } from "@/components/editor/fields";

/** Chọn file nhạc → tải lên → điền URL vào ô ẩn của biểu mẫu. */
export function MusicUpload() {
  const [url, setUrl] = useState("");
  return (
    <div className="space-y-2">
      <input type="hidden" name="url" value={url} />
      <div className="flex flex-wrap items-center gap-3">
        <UploadButton accept="audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a" onUploaded={([u]) => setUrl(u)}>
          {url ? "Đổi file" : "Chọn file MP3/M4A"}
        </UploadButton>
        {!url && <span className="text-xs text-zinc-500">Tối đa 12MB.</span>}
      </div>
      {url && <audio controls preload="metadata" src={url} className="w-full max-w-md" />}
    </div>
  );
}
