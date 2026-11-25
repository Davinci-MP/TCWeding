/**
 * Đồng bộ cấu trúc bảng (prisma/schema.prisma) lên database Turso.
 * `prisma db push` không nối thẳng được tới Turso, nên script này:
 *   1. đọc cấu trúc hiện có trên Turso, dựng lại vào một file SQLite tạm;
 *   2. dùng `prisma migrate diff` so file tạm với schema.prisma để ra đúng các câu lệnh còn thiếu;
 *   3. chạy các câu lệnh đó trên Turso.
 * Chạy lại bao nhiêu lần cũng được: không có thay đổi thì không làm gì.
 *
 * Dùng: npm run turso:push            (đọc TURSO_DATABASE_URL, TURSO_AUTH_TOKEN trong .env.turso)
 *       npm run turso:push -- --yes   (chấp nhận lệnh có thể mất dữ liệu: xoá bảng / cột)
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL?.trim();
if (!url) {
  console.error("Thiếu TURSO_DATABASE_URL (điền trong file .env.turso, xem README mục Vercel).");
  process.exit(1);
}
const turso = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN?.trim() });

async function main() {
  // 1. Cấu trúc hiện có trên Turso
  const rows = await turso.execute(
    "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' AND name NOT LIKE 'libsql_%' ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END",
  );
  const dir = mkdtempSync(path.join(tmpdir(), "tcw-turso-"));
  const shadowFile = path.join(dir, "current.db");
  const shadow = createClient({ url: `file:${shadowFile}` });
  for (const r of rows.rows) await shadow.execute(String(r.sql));
  shadow.close();
  console.log(`Turso hiện có ${rows.rows.filter((r) => r.type === "table").length} bảng.`);

  // 2. Các câu lệnh còn thiếu so với schema.prisma
  const sql = execFileSync(
    "npx",
    ["prisma", "migrate", "diff", "--from-url", `file:${shadowFile.replace(/\\/g, "/")}`, "--to-schema-datamodel", "prisma/schema.prisma", "--script"],
    { encoding: "utf8", shell: process.platform === "win32" },
  ).trim();
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    /* Windows có thể còn khoá file tạm: bỏ qua */
  }

  if (!sql || /^-- This is an empty migration\.?$/m.test(sql) && !/CREATE|ALTER|DROP|INSERT/i.test(sql)) {
    console.log("✔ Cấu trúc trên Turso đã khớp schema.prisma, không cần thay đổi.");
    return;
  }
  console.log("Các thay đổi sẽ chạy trên Turso:\n" + sql + "\n");
  const risky = /DROP TABLE|DROP COLUMN|DROP INDEX|"new_[A-Za-z]+"/i.test(sql);
  if (risky && !process.argv.includes("--yes")) {
    console.error("⚠ Có lệnh xoá hoặc dựng lại bảng (có thể mất dữ liệu). Sao lưu Turso trước, rồi chạy lại với: npm run turso:push -- --yes");
    process.exit(2);
  }

  // 3. Chạy trên Turso
  await turso.executeMultiple(sql);
  console.log("✔ Đã cập nhật cấu trúc bảng trên Turso.");
}

main()
  .catch((e) => {
    console.error("✖ Lỗi:", (e as Error).message);
    process.exit(1);
  })
  .finally(() => turso.close());
