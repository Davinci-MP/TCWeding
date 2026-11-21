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
  drive: {
    clientId: env.GOOGLE_DRIVE_CLIENT_ID || '',
    developerKey: env.GOOGLE_PICKER_API_KEY || '',
    appId: env.GOOGLE_CLOUD_PROJECT_NUMBER || '',
  },
  sessionDays: Number(env.SESSION_DAYS || 7),
  // Watermark chỉ bật khi WATERMARK_ENABLED=true VÀ có file logo TCWedding
  watermarkEnabled: env.WATERMARK_ENABLED === 'true',
  watermarkFile: resolve(ROOT, env.WATERMARK_FILE || 'data/brand/watermark.png'),
  // Origin được phép gọi API ghi (chống CSRF); để trống = cùng host
  allowedOrigins: (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
};

const driveMediaDir = resolve(ROOT, env.DRIVE_MEDIA_DIR || resolve(config.dataDir, 'drive-media'));

export const paths = {
  drive: { thumb: resolve(driveMediaDir, 'thumb'), large: resolve(driveMediaDir, 'large') },
  db: resolve(config.dataDir, 'tcwedding.sqlite'),
  originals: resolve(config.dataDir, 'originals'),
  thumb: resolve(config.dataDir, 'media', 'thumb'),
  large: resolve(config.dataDir, 'media', 'large'),
};
for (const p of [paths.originals, paths.thumb, paths.large, paths.drive.thumb, paths.drive.large]) mkdirSync(p, { recursive: true });
