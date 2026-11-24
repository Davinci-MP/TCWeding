import { readFile } from "node:fs/promises";
import path from "node:path";
import { FILE_NAME_RE, MIME_BY_EXT, UPLOAD_DIR } from "@/lib/uploads";

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!FILE_NAME_RE.test(name)) return new Response("Not found", { status: 404 });
  let buf: Buffer;
  try {
    buf = await readFile(path.join(UPLOAD_DIR, name));
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const headers = {
    "Content-Type": MIME_BY_EXT[name.split(".").pop()!] ?? "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  };

  // Safari/iOS chỉ phát nhạc khi máy chủ trả từng đoạn (206)
  const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range) {
    const size = buf.length;
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(new Uint8Array(buf.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(buf), { headers: { ...headers, "Content-Length": String(buf.length) } });
}
