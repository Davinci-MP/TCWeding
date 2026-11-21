import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;

export const config = {
  root: ROOT,
  port: Number(env.PORT || 8787),
  isProd: env.NODE_ENV === 'production',
  dataDir: resolve(ROOT, env.DATA_DIR || 'data'),
  distDir: resolve(ROOT, 'dist'),
  maxUploadMb: Number(env.MAX_UPLOAD_MB || 25),
  sessionDays: Number(env.SESSION_DAYS || 7),
  // Watermark chỉ bật khi WATERMARK_ENABLED=true VÀ có file logo TCWedding
  watermarkEnabled: env.WATERMARK_ENABLED === 'true',
  watermarkFile: resolve(ROOT, env.WATERMARK_FILE || 'data/brand/watermark.png'),
  // Origin được phép gọi API ghi (chống CSRF); để trống = cùng host
  allowedOrigins: (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
};

export const paths = {
  db: resolve(config.dataDir, 'tcwedding.sqlite'),
  originals: resolve(config.dataDir, 'originals'),
  thumb: resolve(config.dataDir, 'media', 'thumb'),
  large: resolve(config.dataDir, 'media', 'large'),
};
for (const p of [paths.originals, paths.thumb, paths.large]) mkdirSync(p, { recursive: true });
