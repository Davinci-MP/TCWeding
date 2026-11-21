import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { config, paths } from './config.js';

// Định dạng chấp nhận — kiểm tra bằng nội dung tệp (sharp đọc header), không tin đuôi file
const FORMATS = { jpeg: 'jpg', png: 'png', webp: 'webp' };
export const SIZES = {
  thumb: { width: 720, height: 720, fit: 'inside', quality: 76 },   // lưới album
  large: { width: 2200, height: 2200, fit: 'inside', quality: 82 }, // xem lớn
};
const MAX_PIXELS = 80e6; // chặn ảnh "bom" giải nén

export class MediaError extends Error { constructor(msg, status = 400) { super(msg); this.status = status; } }

export function watermarkState() {
  const hasAsset = existsSync(config.watermarkFile);
  return { requested: config.watermarkEnabled, hasAsset, active: config.watermarkEnabled && hasAsset };
}

async function watermarkLayer(imgW, imgH) {
  const w = Math.round(Math.min(imgW, imgH) * 0.22);
  // logo mờ 55%: nhân kênh alpha bằng một lớp 1px lặp lại
  const logo = await sharp(config.watermarkFile).resize({ width: w }).ensureAlpha()
    .composite([{ input: Buffer.from([255, 255, 255, 140]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'dest-in' }])
    .png().toBuffer();
  const m = await sharp(logo).metadata();
  const pad = Math.round(Math.min(imgW, imgH) * 0.03);
  return { input: logo, left: Math.max(0, imgW - m.width - pad), top: Math.max(0, imgH - m.height - pad) };
}

// Lưu bản gốc (nội bộ) + tạo bản thumb và large dạng WebP (công khai khi album xuất bản)
export async function processUpload(buffer, originalName) {
  let meta;
  try { meta = await sharp(buffer, { limitInputPixels: MAX_PIXELS }).metadata(); }
  catch { throw new MediaError('Tệp không phải ảnh hợp lệ (chỉ nhận JPG, PNG, WebP).', 415); }
  const ext = FORMATS[meta.format];
  if (!ext) throw new MediaError(`Định dạng ${meta.format || 'không rõ'} không được hỗ trợ (chỉ nhận JPG, PNG, WebP).`, 415);
  if (!meta.width || !meta.height) throw new MediaError('Không đọc được kích thước ảnh.', 415);

  const id = randomUUID();
  const originalFile = `${id}.${ext}`;
  const wm = watermarkState();
  const written = [];
  try {
    await writeFile(join(paths.originals, originalFile), buffer); written.push(join(paths.originals, originalFile));
    let dims;
    for (const [size, o] of Object.entries(SIZES)) {
      const base = sharp(buffer, { limitInputPixels: MAX_PIXELS }).rotate().resize({ width: o.width, height: o.height, fit: o.fit, withoutEnlargement: true });
      const { data, info } = await base.toBuffer({ resolveWithObject: true });
      let pipe = sharp(data);
      if (wm.active) pipe = pipe.composite([await watermarkLayer(info.width, info.height)]);
      const out = join(paths[size], `${id}.webp`);
      await pipe.webp({ quality: o.quality }).toFile(out); written.push(out);
      if (size === 'large') dims = { width: info.width, height: info.height };
    }
    return { id, originalFile, originalName: String(originalName || 'anh').slice(0, 200), bytes: buffer.length, ...dims, watermarked: wm.active ? 1 : 0 };
  } catch (e) {
    await Promise.all(written.map((f) => unlink(f).catch(() => {})));
    if (e instanceof MediaError) throw e;
    throw new MediaError('Không xử lý được ảnh này. Ảnh có thể bị hỏng.', 422);
  }
}

export async function removeFiles(photo) {
  await Promise.all([
    unlink(join(paths.originals, photo.original_file)).catch(() => {}),
    unlink(join(paths.thumb, `${photo.id}.webp`)).catch(() => {}),
    unlink(join(paths.large, `${photo.id}.webp`)).catch(() => {}),
  ]);
}

export const mediaUrl = (size, id) => `/media/${size}/${id}.webp`;
