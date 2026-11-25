import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

/**
 * Tạo kết nối cơ sở dữ liệu.
 * - Có TURSO_DATABASE_URL (libsql://…): dùng Turso — SQLite online, cần khi chạy trên Vercel (không có ổ đĩa lưu lâu dài).
 * - Không có: dùng file SQLite theo DATABASE_URL (chạy trên máy, VPS).
 * Dùng chung cho website và script seed.
 */
export function createPrisma() {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  if (url) {
    // unixepoch-ms: lưu ngày giờ giống engine SQLite mặc định của Prisma, để chuyển dữ liệu qua lại được
    const adapter = new PrismaLibSQL({ url, authToken: process.env.TURSO_AUTH_TOKEN?.trim() }, { timestampFormat: "unixepoch-ms" });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

export const usingTurso = () => !!process.env.TURSO_DATABASE_URL?.trim();
